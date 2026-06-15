# Supabase Setup Guide

This document covers the complete Supabase database setup for The Nudge Intelligence platform.

**Supabase is optional.** The app runs fully on `localStorage` without any database. Set up Supabase when you want:
- Data shared across multiple team members
- Exec profile edits that survive browser clears
- Account plan versions backed up in the cloud
- Multi-device access to the same data

---

## Table of Contents

1. [Create a Supabase Project](#1-create-a-supabase-project)
2. [Run the Migrations](#2-run-the-migrations)
3. [Full Schema Reference](#3-full-schema-reference)
4. [Connect the App](#4-connect-the-app)
5. [Row Level Security](#5-row-level-security)
6. [How the App Uses the Database](#6-how-the-app-uses-the-database)
7. [Seeding Executive Profiles](#7-seeding-executive-profiles)
8. [Resetting Data](#8-resetting-data)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **Start your project** → sign in with GitHub
2. Click **New project**
3. Fill in:
   - **Organisation**: your org (or create one)
   - **Project name**: `nudge-intelligence`
   - **Database password**: generate a strong password and save it securely
   - **Region**: choose the closest to your team (e.g. `ap-southeast-1` for Asia, `eu-west-1` for Europe)
4. Click **Create new project** — takes ~2 minutes to provision

---

## 2. Run the Migrations

### Migration 1 — Exec Capital Schema (run first)

This creates all 17 tables for executive profile data.

1. In Supabase dashboard → **SQL Editor** → **New query**
2. Copy and paste the SQL below, then click **Run**

```sql
-- ================================================================
-- EXEC CAPITAL SCHEMA
-- Creates all tables for executive profile persistence.
-- Safe to run on a fresh database.
-- ================================================================

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── updated_at trigger function (used by multiple tables) ─────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ── 1. exec_profiles (One Minute Summary / OMS) ───────────────────
CREATE TABLE IF NOT EXISTS exec_profiles (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id       TEXT        NOT NULL UNIQUE,
  company_id    TEXT        NOT NULL,
  oms_overrides JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE exec_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_profiles" ON exec_profiles FOR ALL USING (true) WITH CHECK (true);


-- ── 2. exec_interests ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exec_interests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id     TEXT        NOT NULL,
  name        TEXT        NOT NULL DEFAULT '',
  proof_point TEXT        NOT NULL DEFAULT '',
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exec_interests_exec ON exec_interests(exec_id, sort_order);
ALTER TABLE exec_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_interests" ON exec_interests FOR ALL USING (true) WITH CHECK (true);


-- ── 3. exec_company_role ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exec_company_role (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id    TEXT        NOT NULL UNIQUE,
  content    TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE exec_company_role ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_company_role" ON exec_company_role FOR ALL USING (true) WITH CHECK (true);


-- ── 4. exec_media_appearances ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS exec_media_appearances (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id     TEXT        NOT NULL,
  link        TEXT        NOT NULL DEFAULT '',
  title       TEXT        NOT NULL DEFAULT '',
  description TEXT        NOT NULL DEFAULT '',
  date        TEXT        NOT NULL DEFAULT '',
  source_url  TEXT        NOT NULL DEFAULT '',
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exec_media_exec ON exec_media_appearances(exec_id, sort_order);
ALTER TABLE exec_media_appearances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_media" ON exec_media_appearances FOR ALL USING (true) WITH CHECK (true);


-- ── 5. exec_social_activity ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS exec_social_activity (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id     TEXT        NOT NULL,
  link        TEXT        NOT NULL DEFAULT '',
  summary     TEXT        NOT NULL DEFAULT '',
  posted_date TEXT        NOT NULL DEFAULT '',
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exec_social_exec ON exec_social_activity(exec_id, sort_order);
ALTER TABLE exec_social_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_social" ON exec_social_activity FOR ALL USING (true) WITH CHECK (true);


-- ── 6. exec_key_traits ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exec_key_traits (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id    TEXT        NOT NULL,
  name       TEXT        NOT NULL DEFAULT '',
  summary    TEXT        NOT NULL DEFAULT '',
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exec_key_traits_exec ON exec_key_traits(exec_id, sort_order);
ALTER TABLE exec_key_traits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_key_traits" ON exec_key_traits FOR ALL USING (true) WITH CHECK (true);


-- ── 7. exec_sales_insights ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exec_sales_insights (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id    TEXT        NOT NULL,
  scenario   TEXT        NOT NULL DEFAULT '',
  dos        TEXT        NOT NULL DEFAULT '',
  donts      TEXT        NOT NULL DEFAULT '',
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exec_sales_exec ON exec_sales_insights(exec_id, sort_order);
ALTER TABLE exec_sales_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_sales" ON exec_sales_insights FOR ALL USING (true) WITH CHECK (true);


-- ── 8. exec_conference_summary ────────────────────────────────────
CREATE TABLE IF NOT EXISTS exec_conference_summary (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id    TEXT        NOT NULL UNIQUE,
  summary    TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE exec_conference_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_conf_summary" ON exec_conference_summary FOR ALL USING (true) WITH CHECK (true);


-- ── 9. exec_conferences ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exec_conferences (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id     TEXT        NOT NULL,
  name        TEXT        NOT NULL DEFAULT '',
  occurrences INTEGER     NOT NULL DEFAULT 1,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exec_conferences_exec ON exec_conferences(exec_id, sort_order);
ALTER TABLE exec_conferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_conferences" ON exec_conferences FOR ALL USING (true) WITH CHECK (true);


-- ── 10. exec_game_time_tags ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS exec_game_time_tags (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id    TEXT        NOT NULL,
  tag        TEXT        NOT NULL DEFAULT '',
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exec_game_tags_exec ON exec_game_time_tags(exec_id, sort_order);
ALTER TABLE exec_game_time_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_game_tags" ON exec_game_time_tags FOR ALL USING (true) WITH CHECK (true);


-- ── 11. exec_memberships ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exec_memberships (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id     TEXT        NOT NULL,
  name        TEXT        NOT NULL DEFAULT '',
  type        TEXT        NOT NULL DEFAULT '',
  description TEXT        NOT NULL DEFAULT '',
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exec_memberships_exec ON exec_memberships(exec_id, sort_order);
ALTER TABLE exec_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_memberships" ON exec_memberships FOR ALL USING (true) WITH CHECK (true);


-- ── 12. exec_awards ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exec_awards (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id      TEXT        NOT NULL,
  name         TEXT        NOT NULL DEFAULT '',
  year         TEXT        NOT NULL DEFAULT '',
  organization TEXT        NOT NULL DEFAULT '',
  description  TEXT        NOT NULL DEFAULT '',
  sort_order   INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exec_awards_exec ON exec_awards(exec_id, sort_order);
ALTER TABLE exec_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_awards" ON exec_awards FOR ALL USING (true) WITH CHECK (true);


-- ── 13. exec_notes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exec_notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id    TEXT        NOT NULL,
  content    TEXT        NOT NULL DEFAULT '',
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exec_notes_exec ON exec_notes(exec_id, sort_order);
ALTER TABLE exec_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_notes" ON exec_notes FOR ALL USING (true) WITH CHECK (true);


-- ── 14. exec_selling_points (Freyr Selling Point) ─────────────────
CREATE TABLE IF NOT EXISTS exec_selling_points (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id    TEXT        NOT NULL UNIQUE,
  department TEXT        NOT NULL DEFAULT '',
  content    TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE exec_selling_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_selling" ON exec_selling_points FOR ALL USING (true) WITH CHECK (true);


-- ── 15. exec_action_plan ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exec_action_plan (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id    TEXT        NOT NULL,
  content    TEXT        NOT NULL DEFAULT '',
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exec_action_plan_exec ON exec_action_plan(exec_id, sort_order);
ALTER TABLE exec_action_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_action_plan" ON exec_action_plan FOR ALL USING (true) WITH CHECK (true);


-- ── 16. exec_relationship_scores ──────────────────────────────────
CREATE TABLE IF NOT EXISTS exec_relationship_scores (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id    TEXT        NOT NULL,
  score      INTEGER     NOT NULL DEFAULT 0,
  label      TEXT        NOT NULL DEFAULT '',
  note       TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exec_rel_scores_exec ON exec_relationship_scores(exec_id, created_at DESC);
ALTER TABLE exec_relationship_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_rel_scores" ON exec_relationship_scores FOR ALL USING (true) WITH CHECK (true);


-- ── 17. exec_tasks ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exec_tasks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_id    TEXT        NOT NULL,
  title      TEXT        NOT NULL DEFAULT '',
  due_date   TEXT        NOT NULL DEFAULT '',
  priority   TEXT        NOT NULL DEFAULT 'medium',
  done       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exec_tasks_exec ON exec_tasks(exec_id, created_at DESC);
ALTER TABLE exec_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_exec_tasks" ON exec_tasks FOR ALL USING (true) WITH CHECK (true);


-- ── 18. org_charts ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_charts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  TEXT        NOT NULL UNIQUE,
  people      JSONB       NOT NULL DEFAULT '[]',
  orientation TEXT        NOT NULL DEFAULT 'leftright',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE org_charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_org_charts" ON org_charts FOR ALL USING (true) WITH CHECK (true);


-- ── Verify ────────────────────────────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'exec_%'
   OR table_name = 'org_charts'
ORDER BY table_name;
```

---

### Migration 2 — Account Planning Schema (run second)

This creates the versioned account plan tables.

1. **SQL Editor** → **New query**
2. Paste and run:

```sql
-- ================================================================
-- ACCOUNT PLANNING SCHEMA
-- Creates versioned storage for account plan sections.
-- Safe to run after the exec-capital schema above.
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. account_plan_versions ──────────────────────────────────────
-- One row per (account_id, section_key, version_number).
-- section_key values:
--   'Account Context' | 'Account Priority' | 'Our Big Bets'
--   'Power Centres Responsible' | 'Emerging Pipeline'
--   'Inferences' | 'Account Review Recap'
CREATE TABLE IF NOT EXISTS account_plan_versions (
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

CREATE INDEX IF NOT EXISTS idx_apv_lookup
  ON account_plan_versions (account_id, section_key, is_draft, version_number DESC);

ALTER TABLE account_plan_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_account_plan_versions"
  ON account_plan_versions FOR ALL USING (true) WITH CHECK (true);


-- ── 2. account_context_sections ───────────────────────────────────
-- Stores the 5 Account Context sub-sections per account.
-- sub_section values:
--   'organizationalOverview' | 'companyPerformance' | 'keyPartners'
--   'pipelineAndTherapyFocus' | 'accountInsights'
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
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (account_id, sub_section, version_number)
);

CREATE INDEX IF NOT EXISTS idx_acs_lookup
  ON account_context_sections (account_id, sub_section, is_draft, version_number DESC);

ALTER TABLE account_context_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_account_context_sections"
  ON account_context_sections FOR ALL USING (true) WITH CHECK (true);


-- ── updated_at trigger ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_acs_updated_at ON account_context_sections;
CREATE TRIGGER trg_acs_updated_at
  BEFORE UPDATE ON account_context_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── Helper functions ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION next_plan_version(p_account_id TEXT, p_section_key TEXT)
RETURNS INTEGER LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1
  FROM   account_plan_versions
  WHERE  account_id  = p_account_id
    AND  section_key = p_section_key
    AND  is_draft    = false;
$$;

CREATE OR REPLACE FUNCTION next_context_version(p_account_id TEXT, p_sub_section TEXT)
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
```

---

## 3. Full Schema Reference

### Exec Capital Tables (18 tables)

| Table | Primary key | Unique constraint | Description |
|---|---|---|---|
| `exec_profiles` | `id` | `exec_id` | One Minute Summary OMS overrides (JSONB) |
| `exec_interests` | `id` | — | Interests & Hobbies (array) |
| `exec_company_role` | `id` | `exec_id` | Company Role (single text block) |
| `exec_media_appearances` | `id` | — | Media Appearances (array) |
| `exec_social_activity` | `id` | — | Social Activity (array) |
| `exec_key_traits` | `id` | — | Key Traits (array) |
| `exec_sales_insights` | `id` | — | Sales Insights scenarios (array) |
| `exec_conference_summary` | `id` | `exec_id` | Conference summary text block |
| `exec_conferences` | `id` | — | Individual conference entries (array) |
| `exec_game_time_tags` | `id` | — | Game Time Tags (array) |
| `exec_memberships` | `id` | — | Memberships & Affiliations (array) |
| `exec_awards` | `id` | — | Awards & Recognitions (array) |
| `exec_notes` | `id` | — | Notes (array) |
| `exec_selling_points` | `id` | `exec_id` | Freyr Selling Point (single row) |
| `exec_action_plan` | `id` | — | Action Plan items (array) |
| `exec_relationship_scores` | `id` | — | Relationship score history (array) |
| `exec_tasks` | `id` | — | Tasks (array) |
| `org_charts` | `id` | `account_id` | Org chart people + orientation (JSONB) |

### Account Planning Tables (2 tables)

| Table | Primary key | Unique constraint | Description |
|---|---|---|---|
| `account_plan_versions` | `id` | `(account_id, section_key, version_number)` | Versioned account plan sections |
| `account_context_sections` | `id` | `(account_id, sub_section, version_number)` | Account Context sub-sections |

### Helper Functions

| Function | Returns | Description |
|---|---|---|
| `next_plan_version(account_id, section_key)` | `INTEGER` | Next version number for a plan section |
| `next_context_version(account_id, sub_section)` | `INTEGER` | Next version number for a context sub-section |
| `update_updated_at()` | `TRIGGER` | Auto-updates `updated_at` on row updates |

---

## 4. Connect the App

### Get your credentials

1. Supabase dashboard → your project → **Settings → API**
2. Copy:
   - **Project URL** → looks like `https://abcdefgh.supabase.co`
   - **anon / public key** → long JWT string starting with `eyJ...`

### Local development

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Restart the dev server after creating `.env`:
```bash
npm run dev
```

### Vercel production

1. Vercel dashboard → your project → **Settings → Environment Variables**
2. Add both variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Set scope to **Production** (and **Preview** if you use branch deployments)
4. Redeploy: **Deployments → Redeploy**

---

## 5. Row Level Security

All tables use RLS with a single permissive anon policy (`FOR ALL USING (true)`). This means:

- **No authentication is required** — the app uses the `anon` role
- **All users can read and write all rows**
- This is intentional for an internal team tool

If you want to restrict access in future:

1. Enable Supabase Auth in the project settings
2. Replace the `anon_all_*` policies with user-specific policies
3. Add a login page to the React app

---

## 6. How the App Uses the Database

### Connection detection

```typescript
// src/lib/supabase.ts
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null
```

If `supabase` is `null` (no env vars), every DB operation silently falls back to `localStorage`.

### Read pattern

```
1. Try Supabase → if data found, write to localStorage (cache) and return
2. If no Supabase, read from localStorage
3. If localStorage empty, return empty array / null
```

### Write pattern

```
1. Always write to localStorage immediately (optimistic)
2. If Supabase connected, also upsert to DB
```

### Key patterns by section type

| Section type | DB table | Key | Pattern |
|---|---|---|---|
| Single text block | `exec_company_role` | `exec_id` UNIQUE | `upsert` on `exec_id` |
| Array of items | `exec_key_traits` | `id` UUID | `upsert` on `id`, ordered by `sort_order` |
| JSONB payload | `exec_profiles` | `exec_id` UNIQUE | `upsert`, overrides nested JSONB |
| Versioned data | `account_plan_versions` | `(account_id, section_key, version_number)` | New row per version |

---

## 7. Seeding Executive Profiles

When a user first opens an exec profile page, `seedExecProfile(exec)` runs automatically. It reads data from `src/data/index.ts` and writes all 12 sections to `localStorage` (and Supabase if connected).

**Seed flag**: `localStorage.getItem('nudge_seeded_${execId}')` — set to `'1'` after first seed. Once set, the seed function is a no-op.

### Force re-seed after data changes

If you update exec data in `index.ts` and want the changes to appear in the UI:

**Option A — Browser DevTools (single exec)**
1. DevTools → Application → Local Storage
2. Find and delete `nudge_seeded_nadeem-moiz` (or whichever exec)
3. Also delete all `nudge_exec_interests_nadeem-moiz`, `nudge_exec_key_traits_nadeem-moiz` etc.
4. Reload the exec profile page

**Option B — Clear all Nudge data (all execs)**
1. DevTools → Application → Local Storage
2. Clear all entries starting with `nudge_`

**Option C — Programmatic (from browser console)**
```javascript
// Clear seed flag for one exec
localStorage.removeItem('nudge_seeded_nadeem-moiz')

// Clear all nudge data
Object.keys(localStorage)
  .filter(k => k.startsWith('nudge_'))
  .forEach(k => localStorage.removeItem(k))
```

**Supabase reset (if using DB)**

Run in Supabase SQL Editor to clear and re-seed from scratch:

```sql
-- Delete all exec data (will re-seed from app on next page load)
DELETE FROM exec_profiles;
DELETE FROM exec_interests;
DELETE FROM exec_company_role;
DELETE FROM exec_media_appearances;
DELETE FROM exec_social_activity;
DELETE FROM exec_key_traits;
DELETE FROM exec_sales_insights;
DELETE FROM exec_conference_summary;
DELETE FROM exec_conferences;
DELETE FROM exec_game_time_tags;
DELETE FROM exec_memberships;
DELETE FROM exec_awards;
DELETE FROM exec_notes;
DELETE FROM exec_selling_points;
DELETE FROM exec_action_plan;
DELETE FROM exec_relationship_scores;
DELETE FROM exec_tasks;
```

Then clear `localStorage` keys in the browser as above. The next time each exec profile is opened, the seed runs again from `index.ts`.

---

## 8. Resetting Data

### Reset account plan versions only

```sql
DELETE FROM account_plan_versions;
DELETE FROM account_context_sections;
```

### Reset org charts only

```sql
DELETE FROM org_charts;
```

### Nuclear reset — all data

```sql
DELETE FROM exec_profiles;
DELETE FROM exec_interests;
DELETE FROM exec_company_role;
DELETE FROM exec_media_appearances;
DELETE FROM exec_social_activity;
DELETE FROM exec_key_traits;
DELETE FROM exec_sales_insights;
DELETE FROM exec_conference_summary;
DELETE FROM exec_conferences;
DELETE FROM exec_game_time_tags;
DELETE FROM exec_memberships;
DELETE FROM exec_awards;
DELETE FROM exec_notes;
DELETE FROM exec_selling_points;
DELETE FROM exec_action_plan;
DELETE FROM exec_relationship_scores;
DELETE FROM exec_tasks;
DELETE FROM org_charts;
DELETE FROM account_plan_versions;
DELETE FROM account_context_sections;
```

---

## 9. Troubleshooting

### "Failed to fetch" or network error in the browser console

- Check that `VITE_SUPABASE_URL` is correctly set (no trailing slash)
- Check that `VITE_SUPABASE_ANON_KEY` is the **anon** key, not the **service_role** key
- Confirm the Supabase project is not paused (free tier pauses after 1 week of inactivity — visit the dashboard to wake it)

### Data appears in Supabase but not in the app

The app reads from `localStorage` first as a cache. If stale localStorage data is present, it takes precedence. Clear `localStorage` and reload.

### Exec profile sections appear empty after adding Supabase

The seed only runs if `localStorage.getItem('nudge_seeded_${execId}')` is absent. If you added Supabase after the seed already ran, the data is only in `localStorage` — not yet synced to Supabase. Fix: clear the seed flags and all exec localStorage keys (see Section 7), then reload each exec profile page.

### "relation does not exist" error when app tries to write

One of the migrations didn't run successfully. Re-run both migration queries in order. The `IF NOT EXISTS` clauses make them idempotent — safe to run multiple times.

### RLS blocking reads or writes

By default all policies use `USING (true)` which allows everything. If you've modified policies, check:

```sql
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename LIKE 'exec_%'
   OR tablename LIKE 'account_%'
   OR tablename = 'org_charts'
ORDER BY tablename;
```

### Supabase free tier limits

| Resource | Free tier limit |
|---|---|
| Database size | 500 MB |
| Bandwidth | 5 GB / month |
| API requests | Unlimited |
| Projects | 2 active |
| Inactivity pause | After 1 week |

For a team using this platform daily, the free tier is sufficient. Upgrade to Pro ($25/month) to remove the inactivity pause.
