-- Adds per-session score and star rating used by the career/rank system.
-- Run once; scripts/bootstrap-v2-schema.mjs defines the same fields for fresh installs.
ALTER TABLE sessions
  ADD COLUMN score INT NULL DEFAULT 0,
  ADD COLUMN stars INT NULL DEFAULT 0;

INSERT INTO directus_fields (collection, field, interface, readonly, hidden, width, sort)
VALUES
  ('sessions', 'score', 'input', 1, 0, 'half', NULL),
  ('sessions', 'stars', 'input', 1, 0, 'half', NULL);
