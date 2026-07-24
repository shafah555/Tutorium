-- Widens settings.logo / settings.signature from VARCHAR(255) to TEXT.
--
-- WHY: The logo/signature upload feature used to save the uploaded file to
-- disk (server/uploads) and store only the short "/uploads/xxx.png" path in
-- this column. On Render's free tier (and most PaaS free tiers) the
-- filesystem is EPHEMERAL — every deploy / dyno restart wipes the uploads
-- folder, so the logo/signature "disappeared" and the receipt PDF/preview
-- silently fell back to no-logo. The app now stores the uploaded image
-- directly in the database as a base64 data URI (e.g.
-- "data:image/png;base64,iVBORw0KG...") so it survives restarts/redeploys
-- without needing a paid persistent disk. That requires a much bigger
-- column than VARCHAR(255).
--
-- Safe to run more than once.
--
-- Run this against your Render Postgres database, e.g.:
--   psql "$DATABASE_URL" -f server/database/migrations/002_settings_assets_to_text.sql

BEGIN;


ALTER TABLE settings ALTER COLUMN logo TYPE TEXT;
ALTER TABLE settings ALTER COLUMN signature TYPE TEXT;

COMMIT;