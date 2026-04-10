# Multica Daemon Setup Guide

Set up a daemon on any Mac, Linux, or Windows machine to register your local AI agent CLIs as runtimes in Multica.

## Prerequisites

You need an account on the Multica instance (e.g. `https://your-multica-server.example.com`).

## Step 1: Install Agent CLIs

Install whichever agent CLIs you want to use. You only need at least one.

### Claude Code (Anthropic)

```bash
# macOS / Linux
npm install -g @anthropic-ai/claude-code

# Verify
claude --version
```

Requires an Anthropic API key. Set it up:
```bash
claude  # First run walks through auth
```

### Codex (OpenAI)

```bash
# macOS / Linux
npm install -g @openai/codex

# Verify
codex --version
```

Requires an OpenAI API key:
```bash
export OPENAI_API_KEY=sk-...
```

### Ollama (Local/Proxy — optional)

Ollama support lets you run free models (kimi-k2.5, devstral, qwen, etc.) through an Ollama or LiteLLM proxy. No local Ollama install needed — it reuses the Claude Code CLI with a proxied inference endpoint.

Your daemon admin will provide the host URL and API key. Set them before starting the daemon:

```bash
export MULTICA_OLLAMA_HOST=http://your-ollama-proxy:4000
export MULTICA_OLLAMA_API_KEY=sk-ant-api03-your-key-here
export MULTICA_OLLAMA_MODEL=kimi-k2.5  # or any model the proxy serves
```

**Requirements:**
- Claude Code CLI must be installed (Ollama backend uses it as the agent harness)
- Your machine must be able to reach the proxy host
- The proxy must serve an Anthropic-compatible `/v1/messages` endpoint

The daemon auto-detects Ollama when `MULTICA_OLLAMA_HOST` is set and registers it as an additional runtime alongside Claude/Codex.

## Step 2: Install the Multica CLI

### Option A: Download from GitHub Releases

Go to https://github.com/zachcampbell/multica/releases/latest and download the binary for your platform:

| Platform | File |
|----------|------|
| macOS Apple Silicon | `multica_darwin_arm64.tar.gz` |
| macOS Intel | `multica_darwin_amd64.tar.gz` |
| Linux x86_64 | `multica_linux_amd64.tar.gz` |
| Linux ARM | `multica_linux_arm64.tar.gz` |

```bash
# Example: macOS Apple Silicon
tar xzf multica_darwin_arm64.tar.gz
sudo mv multica /usr/local/bin/
multica version
```

### Option B: Build from source (requires Go 1.26+)

```bash
git clone https://github.com/zachcampbell/multica.git
cd multica/server
go build -o /usr/local/bin/multica ./cmd/multica
multica version
```

## Step 3: Log in

```bash
multica config set server_url https://your-multica-server.example.com
multica login
```

This opens a browser. Log in with your email, enter the verification code, and the CLI saves your token locally.

If the browser callback fails (e.g. SSH session), log in via the web UI at `https://your-multica-server.example.com`, then go to **Settings > Tokens**, create a personal access token, and:

```bash
multica auth login --token
# Paste the mul_... token when prompted
```

## Step 4: Start the daemon

```bash
multica daemon start
```

That's it. The daemon auto-discovers which CLIs are on your PATH (claude, codex) and registers them as runtimes. You should see them appear on the Runtimes page in the web UI.

### Run in background (recommended)

The daemon runs in the foreground by default. To background it:

```bash
multica daemon start  # Forks to background automatically
multica daemon stop   # Stop it later
```

### macOS: Keep running after logout

To keep the daemon running even after you close your terminal, create a launchd plist:

```bash
mkdir -p ~/Library/LaunchAgents

cat > ~/Library/LaunchAgents/com.multica.daemon.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.multica.daemon</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/multica</string>
        <string>daemon</string>
        <string>start</string>
        <string>--foreground</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/multica-daemon.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/multica-daemon.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
EOF

# Start it
launchctl load ~/Library/LaunchAgents/com.multica.daemon.plist

# Check logs
tail -f /tmp/multica-daemon.log

# Stop it
launchctl unload ~/Library/LaunchAgents/com.multica.daemon.plist
```

**Important:** The `PATH` in the plist must include wherever `claude` and `codex` are installed. If installed via npm/nvm, add your nvm node path (e.g. `/Users/you/.nvm/versions/node/v22.18.0/bin`).

### Linux: Systemd user service

```bash
# Run the install script from the repo
bash deploy/install.sh

# Edit the daemon env with your settings
vim ~/.config/multica/daemon.env

# Start
systemctl --user start multica-daemon

# Logs
journalctl --user -u multica-daemon -f

# Stop
systemctl --user stop multica-daemon
```

## Step 5: Verify

Check the Runtimes page in the web UI. You should see your CLIs listed with status "online" and your machine name.

```bash
# Or verify from CLI
multica auth status
```

## Troubleshooting

**"no agent CLI found"** — None of claude, codex are on your PATH. Install at least one.

**"version too old"** — Codex requires v0.100.0+. Run `npm install -g @openai/codex` to update.

**Daemon exits immediately** — Check logs: `multica daemon start --foreground` to see errors in the terminal. Common issues:
- Can't reach the server (check `multica config show` for the server URL)
- Token expired (re-run `multica login`)
- Not a member of any workspace (ask the workspace owner to invite you)

**Runtimes show "offline"** — The daemon sends heartbeats every 15 seconds. If it stopped, runtimes go offline after ~60 seconds. Restart the daemon.
