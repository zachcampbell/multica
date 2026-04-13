-- Add constraints and indexes for issue_dependency table.
-- The table already exists from 001_init.up.sql.

-- Prevent duplicate dependency edges.
ALTER TABLE issue_dependency
    ADD CONSTRAINT issue_dependency_unique UNIQUE (issue_id, depends_on_issue_id);

-- Fast reverse lookups: "what issues depend on this one?"
CREATE INDEX idx_issue_dependency_depends_on
    ON issue_dependency(depends_on_issue_id);

-- Normalize to one canonical direction: issue_id BLOCKS depends_on_issue_id.
-- Drop 'blocked_by' — it's derived at query/API time.
ALTER TABLE issue_dependency
    DROP CONSTRAINT issue_dependency_type_check;
ALTER TABLE issue_dependency
    ADD CONSTRAINT issue_dependency_type_check CHECK (type IN ('blocks', 'related'));

-- Clean up any existing 'blocked_by' rows (shouldn't exist, but defensive).
DELETE FROM issue_dependency WHERE type = 'blocked_by';
