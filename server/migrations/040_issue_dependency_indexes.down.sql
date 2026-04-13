-- Revert issue_dependency constraints and indexes.
ALTER TABLE issue_dependency
    DROP CONSTRAINT IF EXISTS issue_dependency_type_check;
ALTER TABLE issue_dependency
    ADD CONSTRAINT issue_dependency_type_check CHECK (type IN ('blocks', 'blocked_by', 'related'));

DROP INDEX IF EXISTS idx_issue_dependency_depends_on;

ALTER TABLE issue_dependency
    DROP CONSTRAINT IF EXISTS issue_dependency_unique;
