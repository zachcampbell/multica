-- name: CreateIssueDependency :one
INSERT INTO issue_dependency (issue_id, depends_on_issue_id, type)
VALUES ($1, $2, $3)
RETURNING *;

-- name: DeleteIssueDependency :exec
DELETE FROM issue_dependency
WHERE id = $1;

-- name: DeleteIssueDependencyByPair :exec
DELETE FROM issue_dependency
WHERE issue_id = $1 AND depends_on_issue_id = $2;

-- name: GetIssueDependency :one
SELECT * FROM issue_dependency
WHERE id = $1;

-- name: ListDependenciesByIssue :many
-- Returns all dependencies involving this issue (both directions),
-- with joined info about the other issue in each relationship.
SELECT
    dep.id,
    dep.issue_id,
    dep.depends_on_issue_id,
    dep.type,
    -- "direction" relative to the queried issue:
    -- 'blocks' if this issue is the blocker (issue_id = $1)
    -- 'blocked_by' if this issue is blocked (depends_on_issue_id = $1)
    -- 'related' pass-through
    CASE
        WHEN dep.type = 'blocks' AND dep.issue_id = $1 THEN 'blocks'
        WHEN dep.type = 'blocks' AND dep.depends_on_issue_id = $1 THEN 'blocked_by'
        ELSE 'related'
    END AS direction,
    other.id AS related_issue_id,
    other.number AS related_issue_number,
    other.title AS related_issue_title,
    other.status AS related_issue_status,
    other.priority AS related_issue_priority,
    other.assignee_type AS related_issue_assignee_type,
    other.assignee_id AS related_issue_assignee_id
FROM issue_dependency dep
JOIN issue other ON other.id = CASE
    WHEN dep.issue_id = $1 THEN dep.depends_on_issue_id
    ELSE dep.issue_id
END
WHERE dep.issue_id = $1 OR dep.depends_on_issue_id = $1
ORDER BY dep.type, other.number;

-- name: HasUnresolvedBlockers :one
-- Returns true if the issue has any blocker not in done/cancelled status.
SELECT EXISTS (
    SELECT 1 FROM issue_dependency dep
    JOIN issue blocker ON blocker.id = dep.issue_id
    WHERE dep.depends_on_issue_id = $1
      AND dep.type = 'blocks'
      AND blocker.status NOT IN ('done', 'cancelled')
) AS has_unresolved;

-- name: ListBlockEdgesInWorkspace :many
-- Returns all 'blocks' edges in a workspace for cycle detection in Go.
SELECT dep.issue_id, dep.depends_on_issue_id
FROM issue_dependency dep
JOIN issue i ON i.id = dep.issue_id
WHERE i.workspace_id = $1 AND dep.type = 'blocks';

-- name: ListDependentsUnblockedByIssue :many
-- When an issue is marked done/cancelled, find all issues that were
-- blocked by it and now have zero remaining unresolved blockers.
SELECT i.id, i.workspace_id, i.number, i.title, i.status, i.priority,
       i.assignee_type, i.assignee_id
FROM issue_dependency dep
JOIN issue i ON i.id = dep.depends_on_issue_id
WHERE dep.issue_id = $1
  AND dep.type = 'blocks'
  AND NOT EXISTS (
      SELECT 1 FROM issue_dependency other_dep
      JOIN issue other_blocker ON other_blocker.id = other_dep.issue_id
      WHERE other_dep.depends_on_issue_id = dep.depends_on_issue_id
        AND other_dep.type = 'blocks'
        AND other_dep.issue_id != $1
        AND other_blocker.status NOT IN ('done', 'cancelled')
  );

-- name: ListAssignableIssues :many
-- Issues with all blockers resolved, no assignee, not terminal status.
SELECT i.id, i.workspace_id, i.title, i.status, i.priority,
       i.assignee_type, i.assignee_id, i.creator_type, i.creator_id,
       i.parent_issue_id, i.position, i.due_date, i.created_at, i.updated_at,
       i.number, i.project_id
FROM issue i
WHERE i.workspace_id = $1
  AND i.status NOT IN ('done', 'cancelled')
  AND i.assignee_id IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM issue_dependency dep
      JOIN issue blocker ON blocker.id = dep.issue_id
      WHERE dep.depends_on_issue_id = i.id
        AND dep.type = 'blocks'
        AND blocker.status NOT IN ('done', 'cancelled')
  )
ORDER BY i.priority DESC, i.position ASC, i.created_at DESC;

-- name: ListDependencyGraph :many
-- All dependency edges in a workspace (for the DAG view).
SELECT dep.id, dep.issue_id, dep.depends_on_issue_id, dep.type
FROM issue_dependency dep
JOIN issue i1 ON i1.id = dep.issue_id
WHERE i1.workspace_id = $1;
