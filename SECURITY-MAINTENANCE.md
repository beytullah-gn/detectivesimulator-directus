# Production maintenance (2026-10-16)

The production API remains on Directus 11.17.4. Compatible dependencies are pinned in package-lock.json and security overrides. The unused request package was removed after scanning all application sources; axios remains the HTTP client. Do not force Directus 12 as an audit repair without a separate authentication, permissions, and licensing review.

Production runs as www on loopback behind Nginx. Keep CACHE_ENABLED=false and keep /files/import blocked case-insensitively with an optional trailing slash. See Directus upstream cache isolation and file-import advisories linked in the central hosting repository. Login, registration, social auth, AI generation, general requests and connections have edge limits. Production test/social-login bypasses remain disabled. Secrets belong only in ignored .env files.

Published scenarios, characters and evidence require the sort field in their read permissions because the real web client orders on sort. scripts/bootstrap-v2-schema.mjs includes that field in both user and public read policies. The production correction changed only those field lists, after verifying live REST metadata; it did not grant hidden answer, culprit or secret-info fields. No schema migration or catalog seeding was run.

The previous OpenRouter key was rejected, and openai/gpt-oss-120b:free returned a discontinued free-endpoint error. The configured replacement uses cohere/north-mini-code:free. Reasoning is disabled so the short completion budget produces a visible role-play/JSON response. Free model availability and quotas depend on the external provider. The actual /game/interrogate endpoint returned a real response against an existing owner session. Test account fixtures and mocked LLM responses were not used.

API release: /www/wwwroot/.security-releases-20261016/detective-backend. uploads links to the original /www/wwwroot/panel.detectivesimulator.com/uploads; retain that directory. Web release: /www/wwwroot/detectivesimulator.com, previous web saved as .pre-security-20261016. Database and configuration backups are private under /root/site-recovery-20261016. Certificate renewal is managed by aaPanel.

Local development uses Node 22 (see .nvmrc). npm ci under Node 24 can fail to build isolated-vm; use the supported Node 22 runtime. The local website .env.local points to the real deployed content/API for verification and is ignored by Git. Never commit runtime credentials.
