"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { MulticaIcon } from "@multica/ui/components/common/multica-icon";
import { useAuthStore } from "@multica/core/auth";
import {
  ClaudeCodeLogo,
  CodexLogo,
  GeminiCliLogo,
  OpenClawLogo,
  OpenCodeLogo,
  GitHubMark,
  githubUrl,
} from "./shared";

const INSTALL_COMMAND =
  "curl -fsSL https://raw.githubusercontent.com/zachcampbell/multica/main/scripts/install.sh | bash";

const FORK_ADDITIONS = [
  {
    title: "Ollama / LiteLLM backend",
    description:
      "Run agents on any Ollama-compatible model. Per-agent model selection from the UI with auto-discovery.",
  },
  {
    title: "Issue dependency graph",
    description:
      "Blocks/blocked-by with cycle detection. Daemon enforces at claim time. Auto-enqueues when blockers resolve.",
  },
  {
    title: "SMTP auth & MinIO storage",
    description:
      "Plain SMTP for internal MTAs. MinIO for file uploads. No external service dependencies.",
  },
  {
    title: "Deployment tooling",
    description:
      "Docker Compose, systemd units, worktree-aware multi-checkout, auto-updating CLI from fork releases.",
  },
  {
    title: "Collapsible agent comments",
    description:
      "Long agent output auto-collapses with expand toggle. Keeps the timeline readable.",
  },
  {
    title: "Self-hosted everything",
    description:
      "WebSocket URL auto-derived from origin. Configurable ports. No build-time env vars for deployment.",
  },
];

const AGENTS = [
  { name: "Claude Code", Logo: ClaudeCodeLogo },
  { name: "Codex", Logo: CodexLogo },
  { name: "Gemini CLI", Logo: GeminiCliLogo },
  { name: "OpenClaw", Logo: OpenClawLogo },
  { name: "OpenCode", Logo: OpenCodeLogo },
];

export function MulticaLanding() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-full bg-[#f3f4f6]">
      {/* Header */}
      <header className="border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <MulticaIcon className="size-5 text-[#004b87]" noSpin />
            <span className="text-lg font-semibold tracking-wide lowercase text-[#1c2430]">
              multica
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-sm text-[#475569] transition-colors hover:bg-[#f3f4f6]"
            >
              <GitHubMark className="size-3.5" />
              GitHub
            </Link>
            <Link
              href={user ? "/issues" : "/login"}
              className="rounded-lg bg-[#004b87] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#003869]"
            >
              {user ? "Dashboard" : "Log in"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#004b87] py-16 text-white">
        <div className="mx-auto max-w-4xl px-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Multica, extended.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            A fork of{" "}
            <Link
              href="https://github.com/multica-ai/multica"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-white/40 underline-offset-2 hover:decoration-white/80"
            >
              multica-ai/multica
            </Link>{" "}
            with Ollama backend, issue dependencies, per-agent model selection,
            and self-hosted deployment tooling.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={user ? "/issues" : "/login"}
              className="rounded-lg bg-[#ed8b00] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d47d00]"
            >
              {user ? "Go to dashboard" : "Log in"}
            </Link>
            <Link
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <GitHubMark className="size-4" />
              View source
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Agents */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#475569]">
            Supported agents
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            {AGENTS.map((a) => (
              <div
                key={a.name}
                className="flex items-center gap-2 text-[#1c2430]"
              >
                <a.Logo className="size-5" />
                <span className="text-sm font-medium">{a.name}</span>
              </div>
            ))}
            <span className="text-sm text-[#475569]">
              + any Ollama-compatible model
            </span>
          </div>
        </section>

        {/* Fork additions */}
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#475569]">
            What this fork adds
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FORK_ADDITIONS.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-[#e5e7eb] bg-white p-5"
              >
                <h3 className="text-sm font-semibold text-[#1c2430]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#475569]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Install */}
        <section className="mt-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#475569]">
            Install
          </h2>
          <CopyCommand />
          <p className="mt-3 text-sm text-[#475569]">
            Then run{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-[#1c2430]">
              multica setup
            </code>{" "}
            to authenticate, and{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-[#1c2430]">
              multica daemon start
            </code>{" "}
            to connect your runtimes.
          </p>
        </section>

        {/* Links */}
        <section className="mt-12 border-t border-[#e5e7eb] pt-8">
          <div className="flex flex-wrap gap-6 text-sm text-[#475569]">
            <Link href="/changelog" className="hover:text-[#1c2430]">
              Changelog
            </Link>
            <Link
              href={githubUrl + "/blob/main/deploy/DAEMON-SETUP.md"}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#1c2430]"
            >
              Daemon setup guide
            </Link>
            <Link
              href={githubUrl + "/blob/main/SELF_HOSTING.md"}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#1c2430]"
            >
              Self-hosting docs
            </Link>
            <Link
              href="https://github.com/multica-ai/multica"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#1c2430]"
            >
              Upstream repo
            </Link>
          </div>
          <p className="mt-6 text-xs text-[#9ca3af]">
            &copy; {new Date().getFullYear()} zachcampbell/multica
          </p>
        </section>
      </div>
    </div>
  );
}

function CopyCommand() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, []);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="mt-3 flex w-full items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 font-mono text-xs text-[#475569] transition-colors hover:border-[#d1d5db] sm:w-auto"
    >
      <span className="text-[#9ca3af]">$</span>
      <span className="select-all truncate">{INSTALL_COMMAND}</span>
      <span className="ml-auto shrink-0 text-xs">
        {copied ? (
          <span className="text-green-600">copied</span>
        ) : (
          <span className="text-[#9ca3af]">copy</span>
        )}
      </span>
    </button>
  );
}
