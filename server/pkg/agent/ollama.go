package agent

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"sort"
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
	args := buildClaudeArgs(opts, b.cfg.Logger)
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
		env["ANTHROPIC_AUTH_TOKEN"] = b.apiKey
	} else {
		env["ANTHROPIC_AUTH_TOKEN"] = "ollama"
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

// discoverOllamaModels queries the configured Ollama/LiteLLM proxy
// (MULTICA_OLLAMA_HOST + MULTICA_OLLAMA_API_KEY) for available models
// and returns them as []Model. The model named in MULTICA_OLLAMA_MODEL
// (default "kimi-k2.5") is marked Default so the UI can badge it.
//
// Unlike most discoverers in this package this one ignores the
// executablePath argument: ollama models are catalogued by the proxy,
// not by the local Claude CLI binary that ferries inference requests.
func discoverOllamaModels(ctx context.Context, _ string) ([]Model, error) {
	host := strings.TrimSpace(os.Getenv("MULTICA_OLLAMA_HOST"))
	if host == "" {
		return nil, fmt.Errorf("MULTICA_OLLAMA_HOST not set")
	}
	apiKey := strings.TrimSpace(os.Getenv("MULTICA_OLLAMA_API_KEY"))
	defaultModel := strings.TrimSpace(os.Getenv("MULTICA_OLLAMA_MODEL"))
	if defaultModel == "" {
		defaultModel = "kimi-k2.5"
	}

	endpoint := strings.TrimRight(host, "/") + "/v1/models"
	reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("build ollama models request: %w", err)
	}
	if apiKey != "" {
		// The Anthropic-formatted key (sk-ant-api03-<real-key>) wraps the
		// proxy's actual key. Strip the "ant-api03-" portion to recover the
		// original proxy key (e.g. sk-ant-api03-sk-xxx → sk-xxx).
		key := strings.Replace(apiKey, "ant-api03-", "", 1)
		req.Header.Set("Authorization", "Bearer "+key)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("query ollama models: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ollama models endpoint returned %d", resp.StatusCode)
	}

	var body struct {
		Data []struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, fmt.Errorf("decode ollama models response: %w", err)
	}

	ids := make([]string, 0, len(body.Data))
	for _, m := range body.Data {
		if id := strings.TrimSpace(m.ID); id != "" {
			ids = append(ids, id)
		}
	}
	sort.Strings(ids)

	models := make([]Model, 0, len(ids))
	for _, id := range ids {
		models = append(models, Model{
			ID:       id,
			Label:    id,
			Provider: "ollama",
			Default:  id == defaultModel,
		})
	}
	return models, nil
}
