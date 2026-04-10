package agent

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strings"
	"time"
)

// ollamaBackend implements Backend by spawning Claude Code CLI configured to
// use an Ollama-compatible inference endpoint (LiteLLM proxy, Ollama server,
// or any Anthropic-compatible API). The Claude Code agent loop handles
// tool use, file editing, and bash execution; Ollama provides the inference.
type ollamaBackend struct {
	cfg        Config
	ollamaHost string // e.g. "http://localhost:11434"
	apiKey     string // proxy API key
}

func (b *ollamaBackend) Execute(ctx context.Context, prompt string, opts ExecOptions) (*Session, error) {
	execPath := b.cfg.ExecutablePath
	if execPath == "" {
		execPath = "claude"
	}
	if _, err := exec.LookPath(execPath); err != nil {
		return nil, fmt.Errorf("ollama backend requires claude CLI on PATH: %w", err)
	}

	timeout := opts.Timeout
	if timeout == 0 {
		timeout = 20 * time.Minute
	}
	runCtx, cancel := context.WithTimeout(ctx, timeout)

	// Build the same args as claude backend, then add --setting-sources ""
	// to prevent user's local settings.json from overriding the proxy target.
	args := buildClaudeArgs(opts)
	args = append(args, "--setting-sources", "")

	cmd := exec.CommandContext(runCtx, execPath, args...)
	if opts.Cwd != "" {
		cmd.Dir = opts.Cwd
	}

	// Build env: start with the cfg env, override with proxy settings.
	env := make(map[string]string, len(b.cfg.Env)+2)
	for k, v := range b.cfg.Env {
		env[k] = v
	}
	env["ANTHROPIC_BASE_URL"] = b.ollamaHost
	if b.apiKey != "" {
		env["ANTHROPIC_API_KEY"] = b.apiKey
	} else {
		env["ANTHROPIC_API_KEY"] = "ollama"
	}
	cmd.Env = buildEnv(env)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		cancel()
		return nil, fmt.Errorf("ollama stdout pipe: %w", err)
	}
	stdin, err := cmd.StdinPipe()
	if err != nil {
		cancel()
		return nil, fmt.Errorf("ollama stdin pipe: %w", err)
	}
	cmd.Stderr = newLogWriter(b.cfg.Logger, "[ollama:stderr] ")

	if err := cmd.Start(); err != nil {
		cancel()
		return nil, fmt.Errorf("start ollama (claude): %w", err)
	}
	if err := writeClaudeInput(stdin, prompt); err != nil {
		_ = stdin.Close()
		cancel()
		_ = cmd.Wait()
		return nil, fmt.Errorf("write ollama input: %w", err)
	}
	if err := stdin.Close(); err != nil {
		cancel()
		_ = cmd.Wait()
		return nil, fmt.Errorf("close ollama stdin: %w", err)
	}

	b.cfg.Logger.Info("ollama started", "pid", cmd.Process.Pid, "cwd", opts.Cwd, "model", opts.Model, "host", b.ollamaHost)

	msgCh := make(chan Message, 256)
	resCh := make(chan Result, 1)

	go func() {
		defer cancel()
		defer close(msgCh)
		defer close(resCh)

		startTime := time.Now()
		var output strings.Builder
		var sessionID string
		finalStatus := "completed"
		var finalError string
		usage := make(map[string]TokenUsage)

		scanner := bufio.NewScanner(stdout)
		scanner.Buffer(make([]byte, 0, 1024*1024), 10*1024*1024)

		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" {
				continue
			}

			var msg claudeSDKMessage
			if err := json.Unmarshal([]byte(line), &msg); err != nil {
				continue
			}

			// Reuse claude's message handling via a temporary claudeBackend
			// with our logger. This avoids duplicating the parsing logic.
			cb := &claudeBackend{cfg: Config{Logger: b.cfg.Logger}}

			switch msg.Type {
			case "assistant":
				cb.handleAssistant(msg, msgCh, &output, usage)
			case "user":
				cb.handleUser(msg, msgCh)
			case "system":
				if msg.SessionID != "" {
					sessionID = msg.SessionID
				}
				trySend(msgCh, Message{Type: MessageStatus, Status: "running"})
			case "result":
				sessionID = msg.SessionID
				if msg.ResultText != "" {
					output.Reset()
					output.WriteString(msg.ResultText)
				}
				if msg.IsError {
					finalStatus = "failed"
					finalError = msg.ResultText
				}
			case "log":
				if msg.Log != nil {
					trySend(msgCh, Message{
						Type:    MessageLog,
						Level:   msg.Log.Level,
						Content: msg.Log.Message,
					})
				}
			}
		}

		exitErr := cmd.Wait()
		duration := time.Since(startTime)

		if runCtx.Err() == context.DeadlineExceeded {
			finalStatus = "timeout"
			finalError = fmt.Sprintf("ollama timed out after %s", timeout)
		} else if runCtx.Err() == context.Canceled {
			finalStatus = "aborted"
			finalError = "execution cancelled"
		} else if exitErr != nil && finalStatus == "completed" {
			finalStatus = "failed"
			finalError = fmt.Sprintf("ollama (claude) exited with error: %v", exitErr)
		}

		b.cfg.Logger.Info("ollama finished", "pid", cmd.Process.Pid, "status", finalStatus, "duration", duration.Round(time.Millisecond).String())

		resCh <- Result{
			Status:     finalStatus,
			Output:     output.String(),
			Error:      finalError,
			DurationMs: duration.Milliseconds(),
			SessionID:  sessionID,
			Usage:      usage,
		}
	}()

	return &Session{Messages: msgCh, Result: resCh}, nil
}
