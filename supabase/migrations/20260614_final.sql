-- ================================================================
-- FINAL MIGRATION — Account Planning Persistence
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
--
-- This script is fully idempotent. Safe to run on:
--   • A fresh database
--   • A database where the exec-capital schema already exists
--   • A database where previous versions of these tables exist
--
-- It does NOT touch any exec_* or org_charts tables.
-- ================================================================


-- ── Step 1: Drop previous versions of these tables cleanly ───────
-- CASCADE drops dependent indexes, constraints, policies, triggers.
-- The tables we're dropping were created by previous migrations only.
DROP TABLE IF EXISTS account_plan_versions    CASCADE;
DROP TABLE IF EXISTS account_context_sections CASCADE;

-- Drop helper functions from previous migrations (if any)
DROP FUNCTION IF EXISTS next_plan_version(TEXT, TEXT);
DROP FUNCTION IF EXISTS next_context_version(TEXT, TEXT);


-- ── Step 2: Create account_plan_versions ─────────────────────────
CREATE TABLE account_plan_versions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     TEXT        NOT NULL,
  section_key    TEXT        NOT NULL,
  version_number INTEGER     NOT NULL DEFAULT 1,
  data           JSONB       NOT NULL DEFAULT '{}',
  is_draft       BOOLEAN     NOT NULL DEFAULT true,
  saved_by       TEXT,
  saved_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, section_key, version_number)
);

CREATE INDEX idx_apv_lookup
  ON account_plan_versions (account_id, section_key, is_draft, version_number DESC);


-- ── Step 3: Create account_context_sections ──────────────────────
CREATE TABLE account_context_sections (
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
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, sub_section, version_number)
);

CREATE INDEX idx_acs_lookup
  ON account_context_sections (account_id, sub_section, is_draft, version_number DESC);


-- ── Step 4: Row Level Security ────────────────────────────────────
ALTER TABLE account_plan_versions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_context_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_account_plan_versions"
  ON account_plan_versions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_account_context_sections"
  ON account_context_sections
  FOR ALL USING (true) WITH CHECK (true);


-- ── Step 5: updated_at trigger ────────────────────────────────────
-- Function already exists from exec-capital schema.
-- CREATE OR REPLACE is safe — idempotent.
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_acs_updated_at
  BEFORE UPDATE ON account_context_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── Step 6: Helper functions ──────────────────────────────────────
CREATE FUNCTION next_plan_version(p_account_id TEXT, p_section_key TEXT)
RETURNS INTEGER LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1
  FROM   account_plan_versions
  WHERE  account_id  = p_account_id
    AND  section_key = p_section_key
    AND  is_draft    = false;
$$;

CREATE FUNCTION next_context_version(p_account_id TEXT, p_sub_section TEXT)
RETURNS INTEGER LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1
  FROM   account_context_sections
  WHERE  account_id  = p_account_id
    AND  sub_section = p_sub_section
    AND  is_draft    = false;
$$;


-- ── Verify ────────────────────────────────────────────────────────
SELECT table_name, column_name, data_type
FROM   information_schema.columns
WHERE  table_name IN ('account_plan_versions', 'account_context_sections')
ORDER  BY table_name, ordinal_position;
