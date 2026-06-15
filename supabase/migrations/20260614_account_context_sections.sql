-- ============================================================
-- Migration: account_context_sections  +  account_plan_versions
-- Purpose:   Add two NEW tables for Account Planning persistence.
--            ADDITIVE ONLY — zero changes to any existing table.
--
-- Safe to run adjacent to the existing exec-capital schema:
--   • No DROP TABLE / DROP COLUMN on any existing table
--   • No ALTER TABLE on any existing table
--   • Uses CREATE TABLE IF NOT EXISTS throughout
--   • Uses CREATE INDEX IF NOT EXISTS throughout
--   • Uses DROP POLICY IF EXISTS before CREATE POLICY (idempotent)
--   • Uses CREATE OR REPLACE FUNCTION (idempotent)
--   • Uses DROP TRIGGER IF EXISTS before CREATE TRIGGER (idempotent)
--   • The update_updated_at() function already exists from the
--     exec-capital migration — CREATE OR REPLACE is idempotent.
--
-- Existing tables that are NOT touched by this file:
--   exec_profiles, exec_interests, exec_company_role,
--   exec_media_appearances, exec_social_activity, exec_key_traits,
--   exec_sales_insights, exec_conference_summary, exec_conferences,
--   exec_game_time_tags, exec_memberships, exec_awards, exec_notes,
--   exec_selling_points, exec_action_plan, exec_relationship_scores,
--   exec_tasks, org_charts
-- ============================================================

-- ── 1. account_context_sections ───────────────────────────────────────────────
-- Stores each of the 5 Account Context sub-sections per account.
-- sub_section: 'organizationalOverview' | 'companyPerformance' |
--              'keyPartners' | 'pipelineAndTherapyFocus' | 'accountInsights'
CREATE TABLE IF NOT EXISTS account_context_sections (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     TEXT NOT NULL,
  sub_section    TEXT NOT NULL,         -- matches AC_SECTIONS[*].key
  content        TEXT NOT NULL DEFAULT '',
  structured     JSONB DEFAULT '{}',   -- metrics, partners, pipeline, insights arrays
  version_number INTEGER NOT NULL DEFAULT 1,
  is_draft       BOOLEAN NOT NULL DEFAULT true,
  saved_by       TEXT,
  saved_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT account_context_sections_unique
    UNIQUE (account_id, sub_section, version_number)
);

CREATE INDEX IF NOT EXISTS idx_acs_account
  ON account_context_sections (account_id, sub_section, is_draft, version_number DESC);


-- ── 2. account_plan_versions ──────────────────────────────────────────────────
-- Stores full section data for BROWSE_BY sections:
--   'Account Context' | 'Account Priority' | 'Our Big Bets' |
--   'Power Centres Responsible' | 'Emerging Pipeline' |
--   'Inferences' | 'Account Review Recap'
CREATE TABLE IF NOT EXISTS account_plan_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id     TEXT NOT NULL,
  section_key    TEXT NOT NULL,         -- exact BROWSE_BY_OPTIONS value
  version_number INTEGER NOT NULL DEFAULT 1,
  data           JSONB NOT NULL DEFAULT '{}',
  is_draft       BOOLEAN NOT NULL DEFAULT true,
  saved_by       TEXT,
  saved_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT account_plan_versions_unique
    UNIQUE (account_id, section_key, version_number)
);

CREATE INDEX IF NOT EXISTS idx_apv_account
  ON account_plan_versions (account_id, section_key, is_draft, version_number DESC);


-- ── RLS: enable ───────────────────────────────────────────────────────────────
ALTER TABLE account_context_sections  ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_plan_versions     ENABLE ROW LEVEL SECURITY;


-- ── RLS: policies (drop-then-create = idempotent) ─────────────────────────────
DROP POLICY IF EXISTS "anon_all_account_context_sections"  ON account_context_sections;
DROP POLICY IF EXISTS "anon_all_account_plan_versions"     ON account_plan_versions;

CREATE POLICY "anon_all_account_context_sections"
  ON account_context_sections FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "anon_all_account_plan_versions"
  ON account_plan_versions FOR ALL USING (true) WITH CHECK (true);


-- ── updated_at trigger (function already exists from exec-capital schema) ──────
-- CREATE OR REPLACE is safe — it replaces the function body if it already
-- exists with an identical one, preserving all dependent objects.
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_account_context_sections ON account_context_sections;
CREATE TRIGGER set_updated_at_account_context_sections
  BEFORE UPDATE ON account_context_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── Helper: next version number for account_plan_versions ─────────────────────
CREATE OR REPLACE FUNCTION next_plan_version(p_account_id TEXT, p_section_key TEXT)
RETURNS INTEGER
LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1
  FROM account_plan_versions
  WHERE account_id  = p_account_id
    AND section_key = p_section_key
    AND is_draft    = false;
$$;

-- ── Helper: next version number for account_context_sections ──────────────────
CREATE OR REPLACE FUNCTION next_context_version(p_account_id TEXT, p_sub_section TEXT)
RETURNS INTEGER
LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1
  FROM account_context_sections
  WHERE account_id  = p_account_id
    AND sub_section = p_sub_section
    AND is_draft    = false;
$$;
