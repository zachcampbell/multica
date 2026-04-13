"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { AppLink } from "../../navigation";
import { StatusIcon } from "./status-icon";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@multica/ui/components/ui/popover";
import { Input } from "@multica/ui/components/ui/input";
import { cn } from "@multica/ui/lib/utils";
import {
  issueDependenciesOptions,
  issueListOptions,
  useAddDependency,
  useRemoveDependency,
} from "@multica/core/issues";
import type { IssueDependency, Issue } from "@multica/core/types";

interface DependencySectionProps {
  issueId: string;
  wsId: string;
}

export function DependencySection({ issueId, wsId }: DependencySectionProps) {
  const [open, setOpen] = useState(true);
  const { data: deps = [] } = useQuery(issueDependenciesOptions(issueId));

  const blockers = deps.filter((d) => d.direction === "blocked_by");
  const blocking = deps.filter((d) => d.direction === "blocks");
  const related = deps.filter((d) => d.direction === "related");
  const hasAny = deps.length > 0;

  return (
    <div>
      <button
        className={cn(
          "flex w-full items-center gap-1 text-xs font-medium transition-colors mb-2",
          !open && "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => setOpen(!open)}
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
        Dependencies
        {!open && hasAny && (
          <span className="ml-auto text-muted-foreground">{deps.length}</span>
        )}
      </button>

      {open && (
        <div className="pl-2 space-y-2">
          {blockers.length > 0 && (
            <DepGroup label="Blocked by" deps={blockers} issueId={issueId} />
          )}
          {blocking.length > 0 && (
            <DepGroup label="Blocks" deps={blocking} issueId={issueId} />
          )}
          {related.length > 0 && (
            <DepGroup label="Related" deps={related} issueId={issueId} />
          )}
          <AddDependencyButton issueId={issueId} wsId={wsId} existingIds={deps.map(d => d.related_issue?.id ?? "")} />
        </div>
      )}
    </div>
  );
}

function DepGroup({
  label,
  deps,
  issueId,
}: {
  label: string;
  deps: IssueDependency[];
  issueId: string;
}) {
  const removeMut = useRemoveDependency(issueId);

  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </div>
      {deps.map((dep) => {
        const ri = dep.related_issue;
        if (!ri) return null;
        const isResolved = ri.status === "done" || ri.status === "cancelled";
        return (
          <div
            key={dep.id}
            className="group flex items-center gap-1.5 rounded-md px-2 py-1 -mx-2 text-xs hover:bg-accent/50 transition-colors"
          >
            <StatusIcon status={ri.status} className="h-3.5 w-3.5 shrink-0" />
            <AppLink
              href={`/issues/${ri.id}`}
              className={cn(
                "flex items-center gap-1 min-w-0 flex-1",
                isResolved && "line-through text-muted-foreground",
              )}
            >
              <span className="text-muted-foreground shrink-0">
                {ri.identifier}
              </span>
              <span className="truncate">{ri.title}</span>
            </AppLink>
            <button
              className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-0.5 text-muted-foreground hover:text-foreground transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                removeMut.mutate(dep.id, {
                  onError: () => toast.error("Failed to remove dependency"),
                });
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function AddDependencyButton({
  issueId,
  wsId,
  existingIds,
}: {
  issueId: string;
  wsId: string;
  existingIds: string[];
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [depType, setDepType] = useState<"blocked_by" | "blocks" | "related">("blocked_by");
  const { data: allIssues = [] } = useQuery(issueListOptions(wsId));
  const addMut = useAddDependency(issueId);

  const candidates = allIssues.filter(
    (i: Issue) =>
      i.id !== issueId &&
      !existingIds.includes(i.id) &&
      (search === "" ||
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.identifier.toLowerCase().includes(search.toLowerCase())),
  );

  const handleAdd = (targetId: string) => {
    addMut.mutate(
      { dependsOnIssueId: targetId, type: depType },
      {
        onSuccess: () => {
          setSearch("");
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Failed to add dependency";
          toast.error(msg);
        },
      },
    );
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger
        render={
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
            <Plus className="h-3 w-3" />
            Add dependency
          </button>
        }
      />
      <PopoverContent className="w-72 p-2" align="start">
        <div className="flex gap-1 mb-2">
          {(["blocked_by", "blocks", "related"] as const).map((t) => (
            <button
              key={t}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full transition-colors",
                depType === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setDepType(t)}
            >
              {t === "blocked_by" ? "Blocked by" : t === "blocks" ? "Blocks" : "Related"}
            </button>
          ))}
        </div>
        <Input
          placeholder="Search issues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 text-xs mb-1"
          autoFocus
        />
        <div className="max-h-48 overflow-y-auto">
          {candidates.slice(0, 20).map((issue: Issue) => (
            <button
              key={issue.id}
              className="flex items-center gap-1.5 w-full rounded-md px-2 py-1.5 text-xs hover:bg-accent/50 transition-colors text-left"
              onClick={() => handleAdd(issue.id)}
            >
              <StatusIcon status={issue.status} className="h-3.5 w-3.5 shrink-0" />
              <span className="text-muted-foreground shrink-0">{issue.identifier}</span>
              <span className="truncate">{issue.title}</span>
            </button>
          ))}
          {candidates.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4">
              No matching issues
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
