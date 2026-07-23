-- Adds the missing "userId" (teacher) column to students, model_tests, and settings
-- without dropping any existing data. Safe to run more than once.
--
-- Run this against your Render Postgres database, e.g.:
--   psql "$DATABASE_URL" -f server/database/migrations_manual/001_add_teacher_userid.sql
--
-- Assumes exactly one teacher currently exists in "users" and assigns all
-- existing students / model_tests / settings rows to that teacher.

BEGIN;

-- Sanity check: make sure there really is a teacher to assign rows to.
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  IF user_count = 0 THEN
    RAISE EXCEPTION 'No rows in "users" table — create a teacher account first, then re-run this migration.';
  END IF;
END $$;

-- ============ students ============
ALTER TABLE students ADD COLUMN IF NOT EXISTS "userId" INTEGER;

UPDATE students
SET "userId" = (SELECT id FROM users ORDER BY id ASC LIMIT 1)
WHERE "userId" IS NULL;

ALTER TABLE students ALTER COLUMN "userId" SET NOT NULL;

-- Drop the old plain UNIQUE constraint on "rollNo" (name may vary; find it dynamically)
DO $$
DECLARE
  cname TEXT;
BEGIN
  SELECT tc.constraint_name INTO cname
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
  WHERE tc.table_name = 'students'
    AND tc.constraint_type = 'UNIQUE'
    AND ccu.column_name = 'rollNo'
  LIMIT 1;

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE students DROP CONSTRAINT %I', cname);
  END IF;
END $$;

-- Add FK to users (drop first in case it already exists from a partial prior run)
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_userid_fkey;
ALTER TABLE students
  ADD CONSTRAINT students_userid_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

-- Composite unique index: same teacher can't reuse a rollNo, different teachers can
CREATE UNIQUE INDEX IF NOT EXISTS students_user_id_roll_no ON students("userId", "rollNo");

-- ============ model_tests ============
ALTER TABLE model_tests ADD COLUMN IF NOT EXISTS "userId" INTEGER;

UPDATE model_tests
SET "userId" = (SELECT id FROM users ORDER BY id ASC LIMIT 1)
WHERE "userId" IS NULL;

ALTER TABLE model_tests ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE model_tests DROP CONSTRAINT IF EXISTS model_tests_userid_fkey;
ALTER TABLE model_tests
  ADD CONSTRAINT model_tests_userid_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

-- ============ settings ============
DO $$
DECLARE
  settings_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO settings_count FROM settings;
  IF settings_count > 1 THEN
    RAISE EXCEPTION 'settings has % rows, but userId must be unique per teacher. Resolve manually before running this migration.', settings_count;
  END IF;
END $$;

ALTER TABLE settings ADD COLUMN IF NOT EXISTS "userId" INTEGER;

UPDATE settings
SET "userId" = (SELECT id FROM users ORDER BY id ASC LIMIT 1)
WHERE "userId" IS NULL;

ALTER TABLE settings ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_userid_fkey;
ALTER TABLE settings
  ADD CONSTRAINT settings_userid_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_userid_key;
ALTER TABLE settings ADD CONSTRAINT settings_userid_key UNIQUE ("userId");

COMMIT;