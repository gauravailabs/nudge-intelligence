-- ============================================================
-- Migration: account_plan_versions
-- Purpose:   Persist all BROWSE_BY section edits (Save Draft /
--            Publish) for Account Planning page so that
--            Open Presentation and Download HTML always render
--            the latest published data rather than static seed.
-- ============================================================

CREATE TABLE IF NOT EXISTS account_plan_versions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which account this plan section belongs to
  account_id       TEXT NOT NULL,

  -- Matches BROWSE_BY_OPTIONS values exactly:
  -- 'Account Priority' | 'Our Big Bets' | 'Power Centres Responsible' |
  -- 'Emerging Pipeline' | 'Inferences' | 'Account Review Recap'
  section_key      TEXT NOT NULL,

  -- Monotonically increasing per (account_id, section_key).
  -- Draft rows use the same number as the last published + 1 while is_draft=true.
  version_number   INTEGER NOT NULL DEFAULT 1,

  -- Full JSON payload of the section data (array or object depending on section)
  data             JSONB NOT NULL DEFAULT '{}',

  -- When this version was written
  saved_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- true while still a draft; false once published
  is_draft         BOOLEAN NOT NULL DEFAULT true,

  -- Who last saved (optional, populated from auth.uid() or passed by client)
  saved_by         TEXT,

  CONSTRAINT account_plan_versions_unique
    UNIQUE (account_id, section_key, version_number)
);

-- Index for fast "get all sections for account" lookup
CREATE INDEX IF NOT EXISTS idx_apv_account
  ON account_plan_versions (account_id, section_key, is_draft, version_number DESC);

-- ─── Row-Level Security ───────────────────────────────────────────────────────
ALTER TABLE account_plan_versions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all plan versions
CREATE POLICY "authenticated_read_plan_versions"
  ON account_plan_versions FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert/update their own plan data
CREATE POLICY "authenticated_write_plan_versions"
  ON account_plan_versions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── Helper: next version number ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION next_plan_version(p_account_id TEXT, p_section_key TEXT)
RETURNS INTEGER
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1
  FROM account_plan_versions
  WHERE account_id = p_account_id
    AND section_key = p_section_key
    AND is_draft = false;
$$;

-- ─── Seed comment ─────────────────────────────────────────────────────────────
-- Initial data is provided by the static ACCOUNT_PLAN constant in
-- src/data/index.ts. The first time a user clicks Save Draft or Publish,
-- the client writes the live data to this table. Subsequent Open Presentation
-- / Download HTML calls read the latest published row per section.
