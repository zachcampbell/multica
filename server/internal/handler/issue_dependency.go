package handler

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	db "github.com/multica-ai/multica/server/pkg/db/generated"
	"github.com/multica-ai/multica/server/pkg/protocol"
)

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

type IssueDependencyIssueInfo struct {
	ID           string  `json:"id"`
	Number       int32   `json:"number"`
	Identifier   string  `json:"identifier,omitempty"`
	Title        string  `json:"title"`
	Status       string  `json:"status"`
	Priority     string  `json:"priority"`
	AssigneeType *string `json:"assignee_type"`
	AssigneeID   *string `json:"assignee_id"`
}

type IssueDependencyResponse struct {
	ID               string                    `json:"id"`
	IssueID          string                    `json:"issue_id"`
	DependsOnIssueID string                    `json:"depends_on_issue_id"`
	Type             string                    `json:"type"`
	Direction        string                    `json:"direction"`
	RelatedIssue     *IssueDependencyIssueInfo `json:"related_issue,omitempty"`
}

// ---------------------------------------------------------------------------
// AddIssueDependency — POST /api/issues/{id}/dependencies
// ---------------------------------------------------------------------------

func (h *Handler) AddIssueDependency(w http.ResponseWriter, r *http.Request) {
	userID, ok := requireUserID(w, r)
	if !ok {
		return
	}
	issueID := chi.URLParam(r, "id")
	issue, ok := h.loadIssueForUser(w, r, issueID)
	if !ok {
		return
	}

	var req struct {
		DependsOnIssueID string `json:"depends_on_issue_id"`
		Type             string `json:"type"` // "blocks", "blocked_by", or "related"
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.DependsOnIssueID == "" {
		writeError(w, http.StatusBadRequest, "depends_on_issue_id is required")
		return
	}
	if req.Type == "" {
		req.Type = "blocks"
	}

	// Self-reference check.
	if req.DependsOnIssueID == issueID {
		writeError(w, http.StatusUnprocessableEntity, "an issue cannot depend on itself")
		return
	}

	// Validate the target issue exists in the same workspace.
	workspaceID := resolveWorkspaceID(r)
	targetIssue, err := h.Queries.GetIssueInWorkspace(r.Context(), db.GetIssueInWorkspaceParams{
		ID:          parseUUID(req.DependsOnIssueID),
		WorkspaceID: parseUUID(workspaceID),
	})
	if err != nil {
		writeError(w, http.StatusNotFound, "target issue not found in workspace")
		return
	}

	// Normalize direction: always store as (blocker, blocked, 'blocks').
	// If the request says "blocked_by", flip the pair.
	var blockerID, blockedID pgtype.UUID
	depType := req.Type
	switch req.Type {
	case "blocks":
		blockerID = issue.ID
		blockedID = targetIssue.ID
		depType = "blocks"
	case "blocked_by":
		blockerID = targetIssue.ID
		blockedID = issue.ID
		depType = "blocks"
	case "related":
		blockerID = issue.ID
		blockedID = targetIssue.ID
		depType = "related"
	default:
		writeError(w, http.StatusBadRequest, "type must be blocks, blocked_by, or related")
		return
	}

	// Cycle detection: check if adding this edge would create a cycle.
	if depType == "blocks" {
		hasCycle, err := h.hasPathBetween(r.Context(), blockedID, blockerID, parseUUID(workspaceID))
		if err != nil {
			slog.Error("cycle detection failed", "error", err)
			writeError(w, http.StatusInternalServerError, "internal error")
			return
		}
		if hasCycle {
			writeError(w, http.StatusUnprocessableEntity, "adding this dependency would create a cycle")
			return
		}
	}

	dep, err := h.Queries.CreateIssueDependency(r.Context(), db.CreateIssueDependencyParams{
		IssueID:          blockerID,
		DependsOnIssueID: blockedID,
		Type:             depType,
	})
	if err != nil {
		// Unique constraint violation = duplicate.
		if isUniqueViolation(err) {
			writeError(w, http.StatusConflict, "dependency already exists")
			return
		}
		slog.Error("failed to create dependency", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create dependency")
		return
	}

	actorType, actorID := h.resolveActor(r, userID, workspaceID)
	h.publish(protocol.EventDependencyCreated, workspaceID, actorType, actorID, map[string]any{
		"dependency": map[string]any{
			"id":                  uuidToString(dep.ID),
			"issue_id":            uuidToString(dep.IssueID),
			"depends_on_issue_id": uuidToString(dep.DependsOnIssueID),
			"type":                dep.Type,
		},
	})

	writeJSON(w, http.StatusCreated, map[string]any{
		"id":                  uuidToString(dep.ID),
		"issue_id":            uuidToString(dep.IssueID),
		"depends_on_issue_id": uuidToString(dep.DependsOnIssueID),
		"type":                dep.Type,
	})
}

// ---------------------------------------------------------------------------
// RemoveIssueDependency — DELETE /api/issues/{id}/dependencies/{depId}
// ---------------------------------------------------------------------------

func (h *Handler) RemoveIssueDependency(w http.ResponseWriter, r *http.Request) {
	userID, ok := requireUserID(w, r)
	if !ok {
		return
	}
	issueID := chi.URLParam(r, "id")
	depID := chi.URLParam(r, "depId")

	if _, ok := h.loadIssueForUser(w, r, issueID); !ok {
		return
	}

	dep, err := h.Queries.GetIssueDependency(r.Context(), parseUUID(depID))
	if err != nil {
		writeError(w, http.StatusNotFound, "dependency not found")
		return
	}

	// Verify this dependency belongs to the requested issue.
	if uuidToString(dep.IssueID) != issueID && uuidToString(dep.DependsOnIssueID) != issueID {
		writeError(w, http.StatusNotFound, "dependency not found for this issue")
		return
	}

	if err := h.Queries.DeleteIssueDependency(r.Context(), dep.ID); err != nil {
		slog.Error("failed to delete dependency", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to delete dependency")
		return
	}

	workspaceID := resolveWorkspaceID(r)
	actorType, actorID := h.resolveActor(r, userID, workspaceID)
	h.publish(protocol.EventDependencyDeleted, workspaceID, actorType, actorID, map[string]any{
		"dependency": map[string]any{
			"id":                  uuidToString(dep.ID),
			"issue_id":            uuidToString(dep.IssueID),
			"depends_on_issue_id": uuidToString(dep.DependsOnIssueID),
			"type":                dep.Type,
		},
	})

	w.WriteHeader(http.StatusNoContent)
}

// ---------------------------------------------------------------------------
// ListIssueDependencies — GET /api/issues/{id}/dependencies
// ---------------------------------------------------------------------------

func (h *Handler) ListIssueDependencies(w http.ResponseWriter, r *http.Request) {
	issueID := chi.URLParam(r, "id")
	issue, ok := h.loadIssueForUser(w, r, issueID)
	if !ok {
		return
	}

	rows, err := h.Queries.ListDependenciesByIssue(r.Context(), issue.ID)
	if err != nil {
		slog.Error("failed to list dependencies", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list dependencies")
		return
	}

	// Look up workspace prefix for identifier formatting.
	workspaceID := resolveWorkspaceID(r)
	prefix := h.getIssuePrefix(r.Context(), parseUUID(workspaceID))

	resp := make([]IssueDependencyResponse, 0, len(rows))
	for _, row := range rows {
		identifier := formatIdentifier(prefix, row.RelatedIssueNumber)
		resp = append(resp, IssueDependencyResponse{
			ID:               uuidToString(row.ID),
			IssueID:          uuidToString(row.IssueID),
			DependsOnIssueID: uuidToString(row.DependsOnIssueID),
			Type:             row.Type,
			Direction:        row.Direction,
			RelatedIssue: &IssueDependencyIssueInfo{
				ID:           uuidToString(row.RelatedIssueID),
				Number:       row.RelatedIssueNumber,
				Identifier:   identifier,
				Title:        row.RelatedIssueTitle,
				Status:       row.RelatedIssueStatus,
				Priority:     row.RelatedIssuePriority,
				AssigneeType: textToPtr(row.RelatedIssueAssigneeType),
				AssigneeID:   uuidToPtr(row.RelatedIssueAssigneeID),
			},
		})
	}

	writeJSON(w, http.StatusOK, resp)
}

// ---------------------------------------------------------------------------
// ListAssignableIssues — GET /api/issues/assignable
// ---------------------------------------------------------------------------

func (h *Handler) ListAssignableIssues(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireUserID(w, r); !ok {
		return
	}
	workspaceID := resolveWorkspaceID(r)
	if workspaceID == "" {
		writeError(w, http.StatusBadRequest, "workspace_id is required")
		return
	}

	rows, err := h.Queries.ListAssignableIssues(r.Context(), parseUUID(workspaceID))
	if err != nil {
		slog.Error("failed to list assignable issues", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list assignable issues")
		return
	}

	writeJSON(w, http.StatusOK, rows)
}

// ---------------------------------------------------------------------------
// Cycle detection (Go-level BFS since sqlc can't do recursive CTEs)
// ---------------------------------------------------------------------------

// hasPathBetween checks if there's already a path from `from` to `to` through
// existing 'blocks' edges. Used before inserting a new dependency to prevent cycles.
func (h *Handler) hasPathBetween(ctx context.Context, from, to, workspaceID pgtype.UUID) (bool, error) {
	edges, err := h.Queries.ListBlockEdgesInWorkspace(ctx, workspaceID)
	if err != nil {
		return false, err
	}

	// Build adjacency list: blocker → [blocked, blocked, ...]
	adj := make(map[[16]byte][][16]byte)
	for _, e := range edges {
		adj[e.IssueID.Bytes] = append(adj[e.IssueID.Bytes], e.DependsOnIssueID.Bytes)
	}

	// BFS from `from` to `to`.
	visited := make(map[[16]byte]bool)
	queue := [][16]byte{from.Bytes}
	visited[from.Bytes] = true

	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]

		for _, neighbor := range adj[current] {
			if neighbor == to.Bytes {
				return true, nil
			}
			if !visited[neighbor] {
				visited[neighbor] = true
				queue = append(queue, neighbor)
			}
		}
	}

	return false, nil
}

// ---------------------------------------------------------------------------
// GetDependencyGraph — GET /api/issues/dependency-graph
// Returns all issues + dependency edges for the workspace (DAG view).
// ---------------------------------------------------------------------------

func (h *Handler) GetDependencyGraph(w http.ResponseWriter, r *http.Request) {
	if _, ok := requireUserID(w, r); !ok {
		return
	}
	workspaceID := resolveWorkspaceID(r)
	if workspaceID == "" {
		writeError(w, http.StatusBadRequest, "workspace_id is required")
		return
	}

	wsUUID := parseUUID(workspaceID)

	edges, err := h.Queries.ListDependencyGraph(r.Context(), wsUUID)
	if err != nil {
		slog.Error("failed to list dependency graph", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to load graph")
		return
	}

	type EdgeResponse struct {
		ID               string `json:"id"`
		IssueID          string `json:"issue_id"`
		DependsOnIssueID string `json:"depends_on_issue_id"`
		Type             string `json:"type"`
	}
	edgeResp := make([]EdgeResponse, 0, len(edges))
	for _, e := range edges {
		edgeResp = append(edgeResp, EdgeResponse{
			ID:               uuidToString(e.ID),
			IssueID:          uuidToString(e.IssueID),
			DependsOnIssueID: uuidToString(e.DependsOnIssueID),
			Type:             e.Type,
		})
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"edges": edgeResp,
	})
}

// ---------------------------------------------------------------------------
// Auto-unblock notification
// ---------------------------------------------------------------------------

// notifyUnblockedDependents checks if any issues blocked by the given issue
// are now fully unblocked (all blockers done/cancelled) and publishes WS events.
func (h *Handler) notifyUnblockedDependents(ctx context.Context, issue db.Issue, workspaceID, actorType, actorID string) {
	unblocked, err := h.Queries.ListDependentsUnblockedByIssue(ctx, issue.ID)
	if err != nil {
		slog.Error("failed to check unblocked dependents", "issue_id", uuidToString(issue.ID), "error", err)
		return
	}
	for _, dep := range unblocked {
		h.publish(protocol.EventIssueUnblocked, workspaceID, actorType, actorID, map[string]any{
			"issue_id":       uuidToString(dep.ID),
			"issue_number":   dep.Number,
			"issue_title":    dep.Title,
			"unblocked_by":   uuidToString(issue.ID),
		})
		slog.Info("issue unblocked", "issue_id", uuidToString(dep.ID), "unblocked_by", uuidToString(issue.ID))
	}
}

