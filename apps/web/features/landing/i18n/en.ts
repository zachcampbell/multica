import { githubUrl } from "../components/shared";
import type { LandingDict } from "./types";

export const en: LandingDict = {
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
    categories: {
      features: "New Features",
      improvements: "Improvements",
      fixes: "Bug Fixes",
    },
    entries: [
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
        version: "0.1.35-zc.1",
        date: "2026-04-14",
        title: "Upstream Rebase & Dependency Fix",
        changes: [],
        features: [
          "Auto-enqueue agent tasks when blockers resolve (dependency graph integration)",
          "Invitation flow with email notifications and dedicated /invite/{id} page (from upstream)",
          "Google OAuth ?next= redirect fix (from upstream)",
          "WebSocket ping/pong heartbeat for dead connection detection (from upstream)",
          "Desktop daemon management panel (from upstream)",
        ],
        improvements: [
          "Update check points at zachcampbell/multica releases with correct version suffix parsing",
          "Landing page customized for fork",
          "Systemd unit changed to Restart=always for daemon self-update survival",
        ],
        fixes: [
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
};
