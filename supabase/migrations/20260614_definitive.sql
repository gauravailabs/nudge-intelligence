-- ================================================================
-- DEFINITIVE MIGRATION — Account Planning Persistence
-- Replaces: 20260614_account_plan_versions.sql
--           20260614_account_context_sections.sql
--
-- SAFE TO RUN ON A FRESH DB or on top of existing exec-capital schema.
-- Does NOT touch any existing exec_* or org_charts tables.
--
-- Run this single file in Supabase SQL Editor.
-- Paste it below your exec-capital schema and run everything together,
-- OR run it on its own — both are safe.
-- ================================================================

-- ── Extension ────────────────────────────────────────────────────
-- gen_random_uuid() lives here (Supabase already enables this,
-- but IF NOT EXISTS makes it safe to re-run)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ================================================================
-- TABLE 1: account_plan_versions
-- Stores versioned data for every BROWSE_BY section:
--   'Account Context' | 'Account Priority' | 'Our Big Bets' |
--   'Power Centres Responsible' | 'Emerging Pipeline' |
--   'Inferences' | 'Account Review Recap'
-- ================================================================
CREATE TABLE IF NOT EXISTS account_plan_versions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     TEXT        NOT NULL,
  section_key    TEXT        NOT NULL,
  version_number INTEGER     NOT NULL DEFAULT 1,
  data           JSONB       NOT NULL DEFAULT '{}',
  is_draft       BOOLEAN     NOT NULL DEFAULT true,
  saved_by       TEXT,
  saved_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one row per (account, section, version)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'account_plan_versions_unique'
  ) THEN
    ALTER TABLE account_plan_versions
      ADD CONSTRAINT account_plan_versions_unique
      UNIQUE (account_id, section_key, version_number);
  END IF;
END $$;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_apv_lookup
  ON account_plan_versions (account_id, section_key, is_draft, version_number DESC);


-- ================================================================
-- TABLE 2: account_context_sections
-- Stores the 5 Account Context sub-sections per account:
--   'organizationalOverview' | 'companyPerformance' | 'keyPartners'
--   'pipelineAndTherapyFocus' | 'accountInsights'
-- ================================================================
CREATE TABLE IF NOT EXISTS account_context_sections (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     TEXT        NOT NULL,
  sub_section    TEXT        NOT NULL,
  content        TEXT        NOT NULL DEFAULT '',
  structured     JSONB                DEFAULT '{}',
  version_number INTEGER     NOT NULL DEFAULT 1,
  is_draft       BOOLEAN     NOT NULL DEFAULT true,
  saved_by       TEXT,
  saved_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'account_context_sections_unique'
  ) THEN
    ALTER TABLE account_context_sections
      ADD CONSTRAINT account_context_sections_unique
      UNIQUE (account_id, sub_section, version_number);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_acs_lookup
  ON account_context_sections (account_id, sub_section, is_draft, version_number DESC);


-- ================================================================
-- ROW LEVEL SECURITY
-- Using anon role (no Supabase Auth required) — same pattern as
-- the exec-capital schema you already have running.
-- ================================================================
ALTER TABLE account_plan_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_context_sections ENABLE ROW LEVEL SECURITY;

-- Drop old policies (from previous migration attempts) then recreate
DROP POLICY IF EXISTS "authenticated_read_plan_versions"   ON account_plan_versions;
DROP POLICY IF EXISTS "authenticated_write_plan_versions"  ON account_plan_versions;
DROP POLICY IF EXISTS "anon_all_account_plan_versions"     ON account_plan_versions;
DROP POLICY IF EXISTS "anon_all_account_context_sections"  ON account_context_sections;

CREATE POLICY "anon_all_account_plan_versions"
  ON account_plan_versions
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_all_account_context_sections"
  ON account_context_sections
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- ================================================================
-- TRIGGER FUNCTION
-- update_updated_at() may already exist from exec-capital schema.
-- CREATE OR REPLACE is idempotent — safe to run again.
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only account_context_sections has updated_at; account_plan_versions does not.
DROP TRIGGER IF EXISTS trg_acs_updated_at ON account_context_sections;
CREATE TRIGGER trg_acs_updated_at
  BEFORE UPDATE ON account_context_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Next published version number for account_plan_versions
CREATE OR REPLACE FUNCTION next_plan_version(
  p_account_id  TEXT,
  p_section_key TEXT
)
RETURNS INTEGER
LANGUAGE SQL
STABLE AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1
  FROM   account_plan_versions
  WHERE  account_id  = p_account_id
    AND  section_key = p_section_key
    AND  is_draft    = false;
$$;

-- Next published version number for account_context_sections
CREATE OR REPLACE FUNCTION next_context_version(
  p_account_id   TEXT,
  p_sub_section  TEXT
)
RETURNS INTEGER
LANGUAGE SQL
STABLE AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1
  FROM   account_context_sections
  WHERE  account_id   = p_account_id
    AND  sub_section  = p_sub_section
    AND  is_draft     = false;
$$;


-- ================================================================
-- VERIFICATION QUERY (optional — uncomment to check after running)
-- ================================================================
-- SELECT table_name, column_name, data_type
-- FROM   information_schema.columns
-- WHERE  table_name IN ('account_plan_versions', 'account_context_sections')
-- ORDER  BY table_name, ordinal_position;
