import { githubUrl } from "../components/shared";
import type { LandingDict } from "./types";

export function createEnDict(allowSignup: boolean): LandingDict {
  return {
  header: {
    github: "GitHub",
    login: "Log in",
    dashboard: "Dashboard",
  },

  hero: {
    headlineLine1: "Multica,",
    headlineLine2: "extended.",
    subheading:
      "A fork of multica-ai/multica with Ollama/LiteLLM proxy support, issue dependency graphs, per-agent model selection, SMTP auth, and self-hosted deployment tooling. Everything upstream has, plus what it doesn\u2019t.",
    cta: "Log in",
    downloadDesktop: "Download Desktop",
    worksWith: "Works with",
    imageAlt: "Multica board view \u2014 issues managed by humans and agents",
  },

  features: {
    teammates: {
      label: "TEAMMATES",
      title: "Agents show up in the same assignee picker as people",
      description:
        "Agents have profiles, report status, create issues, and comment \u2014 just like human teammates. The activity feed shows everyone working side by side.",
      cards: [
        {
          title: "Same assignee picker",
          description:
            "Assign work to an agent the same way you assign to a colleague. No separate interface.",
        },
        {
          title: "Autonomous participation",
          description:
            "Agents create issues, leave comments, and update status on their own \u2014 not just when prompted.",
        },
        {
          title: "Unified timeline",
          description:
            "One feed for the whole team. Human and agent actions interleaved so you always know what happened.",
        },
      ],
    },
    autonomous: {
      label: "AUTONOMOUS",
      title: "Agents work while you sleep",
      description:
        "Full task lifecycle management: enqueue, claim, start, complete or fail. Agents report blockers proactively and stream progress in real time.",
      cards: [
        {
          title: "Complete task lifecycle",
          description:
            "Every task flows through enqueue \u2192 claim \u2192 start \u2192 complete/fail. No silent failures \u2014 every transition is tracked.",
        },
        {
          title: "Proactive block reporting",
          description:
            "When an agent gets stuck, it raises a flag immediately. No more checking back hours later to find nothing happened.",
        },
        {
          title: "Real-time progress",
          description:
            "WebSocket-powered live updates. Watch agents work in real time or check in whenever you want.",
        },
      ],
    },
    skills: {
      label: "SKILLS",
      title: "Reusable capabilities that compound over time",
      description:
        "Skills are bundled instructions, config, and context that any agent can execute. Write a skill once and every agent on the team can use it.",
      cards: [
        {
          title: "Reusable definitions",
          description:
            "Package knowledge into skills that any agent can run. Deploy, write tests, review PRs \u2014 all codified.",
        },
        {
          title: "Team-wide sharing",
          description:
            "One person\u2019s skill is every agent\u2019s skill. Build once, benefit everywhere.",
        },
        {
          title: "Compound growth",
          description:
            "Day 1: you teach an agent to deploy. Day 30: every agent deploys, writes tests, and does code review.",
        },
      ],
    },
    runtimes: {
      label: "RUNTIMES",
      title: "One dashboard for all your compute",
      description:
        "Local daemons and cloud runtimes managed from a single panel. Online/offline status, usage charts, and activity heatmaps. Connect a machine and it\u2019s ready to work.",
      cards: [
        {
          title: "Unified runtime panel",
          description:
            "Local daemons and cloud runtimes in one view. No context switching between management interfaces.",
        },
        {
          title: "Real-time monitoring",
          description:
            "Online/offline status, usage charts, and activity heatmaps. Know what your compute is doing at any moment.",
        },
        {
          title: "Auto-detection",
          description:
            "Multica detects available CLIs (Claude Code, Codex, Gemini CLI) automatically. Connect and go.",
        },
      ],
    },
  },

  howItWorks: {
    label: "Get started",
    headlineMain: "Get connected",
    headlineFaded: "in 10 minutes.",
    steps: [
      {
        title: "Log in",
        description:
          "Sign in with your email or Google account. Create a workspace or join an existing one.",
      },
      {
        title: "Install the CLI",
        description:
          "Run the install command to get the multica CLI. Then run `multica setup` to authenticate and configure your machine.",
      },
      {
        title: "Start the daemon",
        description:
          "Run `multica daemon start` to register your machine\u2019s runtimes. It auto-detects Claude Code, Codex, and Gemini CLI.",
      },
      {
        title: "Assign an issue",
        description:
          "Pick an agent from the assignee dropdown on any issue. The task is queued, claimed, and executed automatically.",
      },
    ],
    cta: "Log in",
    ctaGithub: "View on GitHub",
    ctaDocs: "Read the docs",
  },

  openSource: {
    label: "Fork additions",
    headlineLine1: "What upstream",
    headlineLine2: "doesn\u2019t have.",
    description:
      "This fork stays rebased on multica-ai/multica and adds features for self-hosted, multi-provider deployments. Everything below is unique to this build.",
    cta: "View source",
    highlights: [
      {
        title: "Ollama / LiteLLM backend",
        description:
          "Run agents on any Ollama-compatible model \u2014 kimi-k2.5, devstral, qwen3-coder, deepseek-v3.1, and 40+ more. Per-agent model selection from the UI.",
      },
      {
        title: "Issue dependency graph",
        description:
          "Blocks/blocked-by relationships with cycle detection. Daemon enforces dependencies at claim time \u2014 blocked tasks don\u2019t dispatch. Auto-enqueues when blockers resolve.",
      },
      {
        title: "SMTP auth & self-hosted storage",
        description:
          "Plain SMTP for internal MTAs (no Resend dependency). MinIO integration for file uploads. No external services required.",
      },
      {
        title: "Deployment tooling",
        description:
          "Docker Compose for backend/frontend, systemd units for daemons, worktree-aware multi-checkout support, and auto-updating CLI from fork releases.",
      },
    ],
  },

  faq: {
    label: "FAQ",
    headline: "Questions & answers.",
    items: [
      {
        question: "How do I set up my daemon?",
        answer:
          "Install the CLI, run `multica setup` to authenticate, then `multica daemon start`. It auto-detects Claude Code and Codex on your machine. For systemd/launchd setup, see deploy/DAEMON-SETUP.md in the repo.",
      },
      {
        question: "What models are available?",
        answer:
          "Claude (Anthropic API), Codex (OpenAI), Gemini CLI, and any model served by an Ollama-compatible proxy. Each agent can be configured with a specific model from the UI.",
      },
      {
        question: "Can multiple people run daemons?",
        answer:
          "Yes. Each person runs a daemon on their machine. All daemons connect to the same server and register their own runtimes. Tasks are distributed across available runtimes automatically.",
      },
      {
        question: "How do agent skills work?",
        answer:
          "Skills are instruction sets that define how an agent approaches a task \u2014 like TDD, code review, or project planning. Assign skills to agents in the UI. The daemon injects them into the agent\u2019s working directory at runtime.",
      },
      {
        question: "What happens if an agent task fails?",
        answer:
          "The task is marked as failed with the error captured. The issue stays in its current status so you can reassign or investigate. Check the agent\u2019s execution transcript for details.",
      },
      {
        question: "How does this fork stay in sync with upstream?",
        answer:
          "We rebase on multica-ai/multica regularly and resolve conflicts in our additions (Ollama backend, dependency graph, deployment tooling). Fork releases are tagged as vX.Y.Z-zc.N.",
      },
    ],
  },

  footer: {
    tagline:
      "Multica fork with Ollama backend, dependency graphs, and self-hosted deployment tooling.",
    cta: "Log in",
    groups: {
      product: {
        label: "Product",
        links: [
          { label: "Features", href: "#features" },
          { label: "Get Started", href: "#how-it-works" },
          { label: "Changelog", href: "/changelog" },
          { label: "Download", href: "/download" },
        ],
      },
      resources: {
        label: "Resources",
        links: [
          { label: "GitHub", href: githubUrl },
          { label: "Daemon Setup", href: githubUrl + "/blob/main/deploy/DAEMON-SETUP.md" },
          { label: "Self-Hosting", href: githubUrl + "/blob/main/SELF_HOSTING.md" },
        ],
      },
      company: {
        label: "Links",
        links: [
          { label: "About", href: "/about" },
          { label: "Upstream", href: "https://github.com/multica-ai/multica" },
        ],
      },
    },
    copyright: "\u00a9 {year} zachcampbell/multica.",
  },

  about: {
    title: "About",
    nameLine: {
      prefix: "Multica \u2014 ",
      mul: "Mul",
      tiplexed: "tiplexed ",
      i: "I",
      nformationAnd: "nformation and ",
      c: "C",
      omputing: "omputing ",
      a: "A",
      gent: "gent.",
    },
    paragraphs: [
      "This is a fork of multica-ai/multica \u2014 the open-source AI agent platform \u2014 extended with Ollama/LiteLLM proxy support, issue dependency graphs, per-agent model selection, and self-hosted deployment tooling.",
      "The platform treats AI agents as first-class team members. Agents get assigned issues, report progress, raise blockers, and ship code. The daemon runs on your workstation and connects your local CLIs (Claude Code, Codex, Gemini) to the central task queue.",
      "Fork additions are contributed upstream where possible. We rebase regularly and tag releases as vX.Y.Z-zc.N to distinguish from upstream builds.",
    ],
    cta: "View on GitHub",
  },

  changelog: {
    title: "Changelog",
    subtitle: "Fork-specific changes and upstream rebases.",
    toc: "All releases",
    categories: {
      features: "New Features",
      improvements: "Improvements",
      fixes: "Bug Fixes",
    },
    entries: [
      {
        version: "0.2.17",
        date: "2026-04-26",
        title: "Custom Agent Env, Better Failure Messages & Reliability Fixes",
        changes: [],
        features: [
          "`multica agent create/update --custom-env KEY=VALUE` injects custom environment variables into agent runs",
          "Agent failure messages now include a tail of the runtime CLI's stderr — much easier to debug runtime errors",
          "CLI update download timeout is now configurable, so slow links no longer abort `multica update`",
        ],
        improvements: [
          "Daemon reports cancelled tasks as `cancelled` instead of `timeout`, and reconciles agent status when an issue's tasks are cancelled",
          "Server heartbeat split into probe/claim with slow-log + a model-list running-timeout, so a lost heartbeat no longer wedges the UI",
        ],
        fixes: [
          "Server validates `assignee_id` on issue create/update so phantom IDs are rejected, and `DeleteIssue` uses the resolved issue ID",
          "Pi runtime now reads/writes `.pi/skills` instead of the old `.pi/agent/skills` path",
          "Windows daemon uses `CREATE_NEW_CONSOLE` so grandchild console popups no longer appear when launching agents",
          "Autopilot run-only context is now properly forwarded to the agent",
        ],
      },
      {
        version: "0.2.16",
        date: "2026-04-24",
        title: "Chat V2, Issue Right-Click Menu & In-App Feedback",
        changes: [],
        features: [
          "Chat V2 — dedicated sidebar entry and full main-area page for AI conversations",
          "Right-click context menu on issues with a unified action set across list, board, and detail",
          "In-app feedback flow with a new Help launcher centralizing docs, support, and feedback",
          "Autopilot modal redesigned — simpler schema and consistent schedule UI across creation and edit",
          "Skills page redesigned — list + detail pages, scroll-fade card layout, shared PageHeader and mobile nav",
          "Bilingual flat-content rewrite of the docs site — English and Chinese sections share one tree",
        ],
        improvements: [
          "Agent profile card appears on avatar hover for quick context",
          "Native right-click menu on desktop with clipboard actions (copy / paste / cut / select all)",
          "Daemon agent prompts hardened to break self-mention loops between agents",
          "Server readiness health endpoints for proper rollout / ingress probes",
          "Daemon GC defaults tightened and now accept flexible duration suffixes (e.g. `7d`, `12h`)",
          "Test Connection / runtime ping removed — runtime reachability is detected automatically",
        ],
        fixes: [
          "Chat no longer flickers when a streamed response finalizes, and the input box no longer jumps when sending the first message",
          "Desktop reopens the last-used workspace on app start instead of falling back to the first one",
          "Editor preserves nested ordered lists through the readonly render path",
          "CLI `browser-login` now works from a machine that isn't running the server",
          "Daemon suppresses extra terminal windows when launching agents on Windows, and retries local-skill reports on transient server errors",
          "`/api/config` is publicly reachable again so unauthenticated clients can bootstrap",
          "Defense-in-depth owner check on workspace deletion, and `/health/realtime` metrics restricted to authorized callers (security)",
          "Hermes ACP runtime now receives the configured model; OpenClaw agent discovery timeout raised to 30s",
        ],
      },
      {
        version: "0.2.15",
        date: "2026-04-22",
        title: "Local Skills, LaTeX, Focus Mode & Orphan-Task Recovery",
        changes: [],
        features: [
          "Import runtime local Skills into the workspace as first-class artifacts",
          "Orphan-task recovery — abandoned agent runs auto-retry, with manual rerun as fallback",
          "LaTeX rendering in issues, comments and chat",
          "Chat Focus mode — share the page you're on as conversation context",
        ],
        improvements: [
          "Sub-issue `status_changed` events no longer spam parent-issue subscribers",
          "Multi-arch Docker release images built natively per-arch (no QEMU)",
          "Pin sidebar derives fields client-side for snappier reorders",
          "Expanded reserved-slug list so new slugs can't collide with product routes",
        ],
        fixes: [
          "Gemini runtime model list now includes Gemini 3 and CLI aliases",
          "Chat focus button disabled on pages without an anchor",
          "Onboarding pin sync, welcome layout and runtime bootstrap state",
          "`install.ps1` OS architecture detection hardened for more Windows setups",
          "`/download` falls back to the previous release within a 1h freshness window",
        ],
      },
      {
        version: "0.2.11",
        date: "2026-04-21",
        title: "Desktop Cross-Platform Packaging, CLI Self-Update & Board Pagination",
        changes: [],
        features: [
          "Desktop app cross-platform packaging — macOS, Windows, and Linux artifacts from a single release pipeline",
          "`multica update` self-update command — upgrade the CLI and local daemon without reinstalling",
          "Issue board paginates every status column, not only Done — large backlogs stay responsive",
        ],
        fixes: [
          "Workspace isolation enforced end-to-end for agent execution on the local daemon (security)",
          "Windows daemon stays alive after the terminal closes, so background agents keep running",
          "Board cards render their description preview again — list queries no longer strip the description field",
          "OpenClaw agent runtime now reads the real model from agent metadata instead of falling back to a default",
          "Comment Markdown preserved end-to-end — the HTML sanitizer that was stripping formatting has been removed",
        ],
      },
      {
        version: "0.2.8",
        date: "2026-04-20",
        title: "Per-Agent Models, Kimi Runtime & Self-Host Auth",
        changes: [],
        features: [
          "Per-agent `model` field with a provider-aware dropdown — pick the LLM model for each agent from the UI or via `multica agent create/update --model`, with live discovery from each runtime's CLI",
          "Kimi CLI as a new agent runtime (Moonshot AI's `kimi-cli` over ACP), with model selection, auto-approved tool permissions, and streaming tool-call rendering",
          "Expand toggle on inline comment and reply editors for composing long text",
        ],
        fixes: [
          "Posting the result comment is now an explicit, numbered step in agent workflows so final replies reach the issue instead of terminal output",
          "Agent live status card no longer leaks across issues when switching via Cmd+K",
          "Self-hosted session cookies honor the `FRONTEND_ORIGIN` scheme — plain-HTTP deployments stop silently dropping cookies, and `COOKIE_DOMAIN=<ip>` now falls back to host-only with a warning instead of breaking login",
        ],
      },
      {
        version: "0.2.6",
        date: "2026-04-19",
        title: "Auth Hardening, Render Loop & Daemon Fixes",
        changes: [],
        features: [
          "Issue title now shown in the detail page header",
          "Custom args tab shows a launch mode preview for agent runtimes",
        ],
        improvements: [
          "CLI accepts `workspace members list` as an alias for `workspace members`",
          "Update check correctly handles `-zc.N` fork version suffixes when comparing releases",
          "Self-host: `APP_ENV` propagated to backend container, defaulting to production",
        ],
        fixes: [
          "Login and Google OAuth callback validate the `next=` redirect target to prevent open-redirect (security)",
          "Sidebar and chat resize no longer trigger infinite re-render loops when the backend is unreachable",
          "Daemon now propagates Ollama env and model overrides to the ping handler",
          "Daemon populates `workspace_id` in `ClaimTaskByRuntime` for autopilot run-only tasks",
          "Claude runtime clears stale session IDs on resume failure so the daemon fallback fires",
          "Comment-triggered agent assignment uses the reply ID instead of the thread root",
          "Autopilot run icon spins while a run is in progress",
          "Dropped Codex-incompatible `--model` example from the custom args tab",
        ],
      },
      {
        version: "0.2.7",
        date: "2026-04-18",
        title: "Sub-Issues from Editor, Self-Host Gating & MCP",
        changes: [],
        features: [
          "Create sub-issue directly from selected text in the editor bubble menu",
          "Self-hosted instance gating — `ALLOW_SIGNUP` and `ALLOWED_EMAIL_*` env vars to restrict account creation",
          "Per-agent `mcp_config` field to restore MCP access",
          "Desktop app hourly update poll with manual check button in settings",
        ],
        fixes: [
          "Session hand-off to desktop when already logged in on web",
          "Open redirect vulnerability on `?next=` validated",
          "OpenClaw stops passing unsupported flags and properly delivers AgentInstructions",
        ],
      },
      {
        version: "0.2.5",
        date: "2026-04-17",
        title: "CLI Autopilot, Cmd+K & Daemon Identity",
        changes: [],
        features: [
          "CLI `autopilot` commands for managing scheduled and triggered automations",
          "CLI `issue subscriber` commands for subscription management",
          "Cmd+K palette extended — theme toggle, quick new issue/project, copy link, switch workspace",
          "Project and sub-issue progress as optional card properties on the issue list",
          "Persistent daemon UUID identity — CLI and desktop share one daemon across restarts and machine moves",
          "Sole-owner workspace leave preflight check",
          "Persist comment collapse state across sessions",
        ],
        fixes: [
          "Agents now triggered on comments regardless of issue status",
          "Codex sandbox config fixed for macOS network access",
          "Editor bubble menu rewritten with @floating-ui/dom for reliable scroll hiding",
          "Autopilot creator automatically subscribed to autopilot-created issues",
          "Autopilot workspace ID correctly resolved for run-only tasks",
          "Desktop restricts `shell.openExternal` to http/https schemes (security)",
          "Duplicate agent names return 409 instead of silently failing",
          "New tabs in desktop inherit current workspace",
        ],
      },
      {
        version: "0.2.1",
        date: "2026-04-16",
        title: "New Agent Runtimes",
        changes: [],
        features: [
          "GitHub Copilot CLI runtime support",
          "Cursor Agent CLI runtime support",
          "Pi agent runtime support",
          "Workspace URL refactor — slug-first routing (`/{slug}/issues`) with legacy URL redirects",
        ],
        fixes: [
          "Codex threads resume across tasks on the same issue",
          "Codex turn errors surfaced instead of reporting empty output",
          "Workspace usage correctly bucketed by task completion time",
          "Autopilot run history rows fully clickable",
          "Workspace isolation enforced on additional daemon and GC endpoints (security)",
          "HTML-escape workspace and inviter names in invitation emails",
          "Dev and production desktop instances can now coexist",
        ],
      },
      {
        version: "0.2.0",
        date: "2026-04-15",
        title: "Desktop App, Autopilot & Invitations",
        changes: [],
        features: [
          "Desktop app for macOS — native Electron app with tab system, built-in daemon management, immersive mode, and auto-update",
          "Autopilot — scheduled and triggered automations for AI agents",
          "Workspace invitations with email notifications and dedicated accept page",
          "Custom CLI arguments per agent for advanced runtime configuration",
          "Chat redesign with unread tracking and improved session management",
          "Create Agent dialog shows runtime owner with Mine/All filter",
        ],
        improvements: [
          "Inter font with CJK fallback and automatic CJK+Latin spacing",
          "Sidebar user menu redesigned as full-row popover",
          "WebSocket ping/pong heartbeat to detect dead connections",
          "Members can now create agents and manage their own skills",
        ],
        fixes: [
          "Agent now triggered on reply in threads where it already participated",
          "Self-hosting: local uploads persist in Docker, WebSocket URL auto-derived for LAN access",
          "Stale cmd+k recent issues resolved",
        ],
      },
      {
        version: "0.2.0-zc.1",
        date: "2026-04-15",
        title: "v0.2.0 Rebase + Auto-Unblock",
        changes: [],
        features: [
          "Auto-enqueue agent tasks when blockers resolve — no more re-assigning after unblock",
          "Rebased on upstream v0.2.0: Desktop app, Autopilot, custom CLI args, invitations",
          "Trigger agent when issue moves out of backlog (from upstream)",
        ],
        improvements: [
          "Update check points at zachcampbell/multica releases with version suffix parsing",
          "Landing page customized for fork",
        ],
        fixes: [
          "Ollama backend updated for upstream buildClaudeArgs logger parameter",
          "Upstream invitation email adapted to SMTP/Resend pattern",
        ],
      },
      {
        version: "0.1.27-zc",
        date: "2026-04-12",
        title: "Dependency Graph & Comments",
        changes: [],
        features: [
          "Issue dependency graph \u2014 backend (blocks/blocked-by relationships, cycle detection, claim-time enforcement)",
          "Issue dependency graph \u2014 frontend (DAG visualization, dependency management UI)",
          "Auto-collapse long agent comments (> 500 chars) with expand toggle",
        ],
        improvements: [
          "Ollama backend uses ANTHROPIC_AUTH_TOKEN to bypass client-side key validation",
          "CLAUDE_CODE_MAX_OUTPUT_TOKENS bumped to 65536 for agent sessions",
        ],
        fixes: [
          "Test scripts removed from repo and gitignored",
        ],
      },
      {
        version: "0.1.22-zc.2",
        date: "2026-04-10",
        title: "Production Deployment & Agent Fleet",
        changes: [],
        features: [
          "Docker Compose + systemd deployment for self-hosted instances",
          "SMTP email backend for verification codes (internal MTA support)",
          "Per-agent model selection with Ollama model discovery (42 models)",
          "MinIO integration for self-hosted file uploads",
          "Ollama/LiteLLM proxy backend for free model inference",
        ],
        improvements: [
          "WebSocket URL auto-derived from page origin (no build-time env vars)",
          "CLI update command points at zachcampbell/multica fork",
          "Daemon setup guide for Mac/Linux with launchd and systemd instructions",
        ],
        fixes: [
          "Configurable postgres port for multi-instance deployments",
          "crypto.randomUUID fallback for non-secure contexts",
          "Plain SMTP dial for internal MTAs without STARTTLS",
        ],
      },
    ],
  },
  download: {
    hero: {
      macArm64: {
        title: "Multica for macOS",
        sub: "Apple Silicon · bundled daemon, zero setup",
        primary: "Download (.dmg)",
        altZip: "or download .zip",
      },
      macIntel: {
        title: "Multica for macOS",
        sub: "Apple Silicon required — Intel Macs not yet supported.",
        disabledCta: "Apple Silicon required",
        intelHint:
          "On an Intel Mac? Use the CLI below — it runs the same daemon.",
      },
      winX64: {
        title: "Multica for Windows",
        sub: "Bundled daemon, zero setup",
        primary: "Download (.exe)",
      },
      winArm64: {
        title: "Multica for Windows",
        sub: "ARM · bundled daemon, zero setup",
        primary: "Download (.exe)",
      },
      linux: {
        title: "Multica for Linux",
        sub: "Bundled daemon, zero setup",
        primary: "Download AppImage",
        altFormats: "or .deb / .rpm",
      },
      unknown: {
        title: "Choose your platform",
        sub: "All installers are listed below.",
      },
      safariMacHint: "On an Intel Mac? Use the CLI below.",
      archFallbackHint: "Wrong architecture? See all formats below.",
    },
    allPlatforms: {
      title: "All platforms",
      macLabel: "macOS · Apple Silicon",
      winX64Label: "Windows · x64",
      winArm64Label: "Windows · ARM64",
      linuxX64Label: "Linux · x64",
      linuxArm64Label: "Linux · ARM64",
      formatDmg: ".dmg",
      formatZip: ".zip",
      formatExe: ".exe",
      formatAppImage: ".AppImage",
      formatDeb: ".deb",
      formatRpm: ".rpm",
      intelNote:
        "Apple Silicon only — Intel Macs not supported in this release.",
      unavailable: "Not available",
    },
    cli: {
      title: "Prefer the CLI?",
      sub: "For servers, remote dev boxes, and headless setups. Same daemon as Desktop, installed via terminal.",
      installLabel: "Install",
      startLabel: "Start daemon",
      sshNote: "Already on a server? Same commands work over SSH.",
      copyLabel: "Copy",
      copiedLabel: "Copied",
    },
    cloud: {
      title: "Cloud runtime (waitlist)",
      sub: "We’ll host the runtime for you. Not live yet — leave your email to be notified.",
    },
    footer: {
      releaseNotes: "What’s new in {version}",
      allReleases: "View all releases",
      currentVersion: "Current version: {version}",
      versionUnavailable: "Version unavailable — check GitHub",
    },
  },
  };
}
