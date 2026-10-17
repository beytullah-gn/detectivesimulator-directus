-- Case story, narrated briefing and image/audio media for evidence and hints.
ALTER TABLE scenarios
  ADD COLUMN story TEXT NULL,
  ADD COLUMN briefing_audio_url VARCHAR(255) NULL;
ALTER TABLE scenario_media ADD COLUMN media_url VARCHAR(255) NULL;
ALTER TABLE hints ADD COLUMN media_url VARCHAR(255) NULL;

INSERT INTO directus_fields (collection, field, interface, readonly, hidden, width, note)
VALUES
  ('scenarios', 'story', 'input-multiline', 0, 0, 'full', 'Case story shown to the player in the briefing and case file.'),
  ('scenarios', 'briefing_audio_url', 'input', 0, 0, 'half', 'Optional narrated briefing (audio URL or /case-media path).'),
  ('scenario_media', 'media_url', 'input', 0, 0, 'half', 'Optional image or audio for this evidence (URL or /case-media path).'),
  ('hints', 'media_url', 'input', 0, 0, 'half', 'Optional image or audio clue (URL or /case-media path).');

-- Players read these through the public and user read policies.
UPDATE directus_permissions
SET fields = CONCAT(fields, ',story,briefing_audio_url')
WHERE collection = 'scenarios' AND action = 'read' AND fields IS NOT NULL AND fields <> '*'
  AND FIND_IN_SET('story', fields) = 0;

UPDATE directus_permissions
SET fields = CONCAT(fields, ',media_url')
WHERE collection = 'scenario_media' AND action = 'read' AND fields IS NOT NULL AND fields <> '*'
  AND FIND_IN_SET('media_url', fields) = 0;
