"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeProps,
  Position,
  Handle,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { useNavigation } from "../../navigation";
import { StatusIcon } from "./status-icon";
import { issueKeys } from "@multica/core/issues";
import { api } from "@multica/core/api";
import type { Issue, IssueStatus } from "@multica/core/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IssueNodeData = {
  label: string;
  identifier: string;
  status: IssueStatus;
  priority: string;
  assigneeType: string | null;
  issueId: string;
};

// ---------------------------------------------------------------------------
// Dagre layout
// ---------------------------------------------------------------------------

const NODE_WIDTH = 220;
const NODE_HEIGHT = 50;

function layoutGraph(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 80 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });
}

// ---------------------------------------------------------------------------
// Custom issue node
// ---------------------------------------------------------------------------

const statusColors: Record<string, string> = {
  backlog: "border-muted-foreground/30",
  todo: "border-muted-foreground/50",
  in_progress: "border-blue-500",
  in_review: "border-amber-500",
  done: "border-green-500",
  blocked: "border-red-500",
  cancelled: "border-muted-foreground/20",
};

function IssueNode({ data }: NodeProps<Node<IssueNodeData>>) {
  const nav = useNavigation();
  const isDone = data.status === "done" || data.status === "cancelled";

  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground/50 !w-2 !h-2" />
      <div
        className={`
          rounded-lg border-2 bg-card px-3 py-2 shadow-sm cursor-pointer
          hover:shadow-md transition-shadow
          ${statusColors[data.status] ?? "border-border"}
          ${isDone ? "opacity-50" : ""}
        `}
        style={{ width: NODE_WIDTH }}
        onClick={() => nav.push(`/issues/${data.issueId}`)}
      >
        <div className="flex items-center gap-1.5">
          <StatusIcon status={data.status} className="h-3.5 w-3.5 shrink-0" />
          <span className="text-[10px] text-muted-foreground shrink-0">{data.identifier}</span>
          {data.assigneeType === "agent" && (
            <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1 rounded">agent</span>
          )}
        </div>
        <div className={`text-xs truncate mt-0.5 ${isDone ? "line-through" : ""}`}>
          {data.label}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground/50 !w-2 !h-2" />
    </>
  );
}

const nodeTypes = { issue: IssueNode };

// ---------------------------------------------------------------------------
// Edge styling
// ---------------------------------------------------------------------------

function getEdgeStyle(sourceStatus: string, type: string) {
  if (type === "related") {
    return { stroke: "#6b7280", strokeDasharray: "4 4", strokeWidth: 1 };
  }
  if (sourceStatus === "done" || sourceStatus === "cancelled") {
    return { stroke: "#22c55e", strokeWidth: 1.5 };
  }
  return { stroke: "#ef4444", strokeWidth: 2 };
}

// ---------------------------------------------------------------------------
// DependencyGraph component
// ---------------------------------------------------------------------------

interface DependencyGraphProps {
  issues: Issue[];
}

export function DependencyGraph({ issues }: DependencyGraphProps) {
  const { data: graphData } = useQuery({
    queryKey: issueKeys.dependencyGraph(),
    queryFn: () => api.getDependencyGraph(),
  });

  const issueMap = useMemo(() => {
    const map = new Map<string, Issue>();
    issues.forEach((i) => map.set(i.id, i));
    return map;
  }, [issues]);

  const { nodes, edges } = useMemo(() => {
    if (!graphData?.edges?.length) return { nodes: [], edges: [] };

    // Collect only issues that are part of a dependency
    const involvedIds = new Set<string>();
    graphData.edges.forEach((e) => {
      involvedIds.add(e.issue_id);
      involvedIds.add(e.depends_on_issue_id);
    });

    const rawNodes: Node<IssueNodeData>[] = [];
    involvedIds.forEach((id) => {
      const issue = issueMap.get(id);
      if (!issue) return;
      rawNodes.push({
        id: issue.id,
        type: "issue",
        position: { x: 0, y: 0 },
        data: {
          label: issue.title,
          identifier: issue.identifier,
          status: issue.status,
          priority: issue.priority,
          assigneeType: issue.assignee_type,
          issueId: issue.id,
        },
      });
    });

    const rawEdges: Edge[] = graphData.edges.map((e) => {
      const source = issueMap.get(e.issue_id);
      return {
        id: e.id,
        source: e.issue_id,
        target: e.depends_on_issue_id,
        animated: e.type === "blocks" && source?.status !== "done" && source?.status !== "cancelled",
        style: getEdgeStyle(source?.status ?? "", e.type),
        markerEnd: { type: "arrowclosed" as const, color: getEdgeStyle(source?.status ?? "", e.type).stroke },
      };
    });

    const layoutNodes = layoutGraph(rawNodes, rawEdges);
    return { nodes: layoutNodes, edges: rawEdges };
  }, [graphData, issueMap]);

  if (!graphData?.edges?.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No dependencies to display. Add dependencies between issues to see the graph.
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{ type: "smoothstep" }}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
