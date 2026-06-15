# The Nudge Intelligence

**A strategic account intelligence and sales enablement platform for Freyr Solutions.**

Built with React + TypeScript + Vite. Fully functional offline using `localStorage` — Supabase is optional and adds cloud persistence for teams.

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Available Routes](#available-routes)
7. [Key Features by Module](#key-features-by-module)
8. [Data Architecture](#data-architecture)
9. [Persistence Model](#persistence-model)
10. [Deployment (Vercel)](#deployment-vercel)
11. [Adding New Accounts or Executives](#adding-new-accounts-or-executives)
12. [Troubleshooting](#troubleshooting)

---

## What It Does

The Nudge Intelligence is an internal tool for Freyr Solutions account teams. It provides:

- **Account Intelligence** — Nudge signals, SWOT, financial snapshots, strategic priorities, and stakeholder maps for Revance Therapeutics and Takeda Pharmaceutical
- **Exec Capital** — Deep executive profiles with behavioural intelligence, engagement playbooks, sales insights, conference intelligence, and LinkedIn links for 9 C-suite contacts
- **Account Planning** — Versioned, editable account plan sections (Account Context, Account Priority, Our Big Bets, Power Centres, Emerging Pipeline, Inferences, Review Recap) with Save Draft / Publish / Version history
- **Executive Briefing** — Auto-generated HTML presentation with inline viewer, downloadable HTML + PDF for client-facing account briefings
- **Intelligence Dossiers** — One-click downloadable HTML files for both executive profiles and full account intelligence

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Build tool | Vite 5 |
| Routing | React Router v6 |
| Styling | Custom CSS (index.css) + Tailwind utility classes |
| Icons | Lucide React |
| Charts | Recharts |
| Drag & Drop | @dnd-kit |
| Animations | Framer Motion |
| Database | Supabase (PostgreSQL) — optional |
| Offline storage | localStorage (always active, DB-fallback) |
| Deployment | Vercel |

---

## Project Structure

```
nudge-intelligence/
├── src/
│   ├── App.tsx                          # Router — all routes defined here
│   ├── main.tsx                         # React entry point
│   ├── index.css                        # Global styles, CSS variables, shared classes
│   │
│   ├── components/
│   │   └── layout/
│   │       └── AppShell.tsx             # Sidebar nav + topbar + page outlet
│   │
│   ├── data/
│   │   └── index.ts                     # ALL static seed data (accounts, execs, news, modules)
│   │
│   ├── hooks/
│   │   ├── useTheme.tsx                 # Light/dark theme context
│   │   └── useToast.ts                  # Toast notification hook
│   │
│   ├── lib/
│   │   ├── supabase.ts                  # DB client + all CRUD + localStorage fallback + seedExecProfile()
│   │   └── versioning.ts               # useVersioning hook for account plan section versioning
│   │
│   ├── pages/
│   │   ├── ModulesPage.tsx              # /modules — module selector landing
│   │   ├── ExecutiveSummaryPage.tsx     # /executive-summary — Sales & Growth home
│   │   ├── PipelineInsightsPage.tsx     # /executive-summary/pipeline-insights
│   │   ├── FinancialInsightsPage.tsx    # /executive-summary/financial-insights
│   │   ├── ArticlePage.tsx              # /executive-summary/article/:type
│   │   ├── NewsArticlePage.tsx          # /executive-summary/news/:id
│   │   │
│   │   └── accounts/
│   │       ├── AccountsListPage.tsx     # /accounts — account selector
│   │       ├── AccountInfoPage.tsx      # /accounts/:id — full account intelligence hub
│   │       ├── AccountPlanningPage.tsx  # /accounts/planning — versioned account plan editor
│   │       ├── ExecCapitalPage.tsx      # /accounts/exec-capital — exec profile cards grid
│   │       ├── ExecDetailPage.tsx       # /accounts/exec-capital/:id — full exec profile
│   │       └── ExecutiveBriefingPresentation.tsx  # /briefing/:accountId — standalone PPT
│   │
│   └── types/
│       └── InsightPerson.ts             # TypeScript types for exec profiles
│
├── supabase/
│   └── migrations/
│       ├── 20260614_definitive.sql      # Account plan tables (account_plan_versions, account_context_sections)
│       └── 20260614_final.sql           # Alternate final migration (idempotent)
│
├── index.html                           # Vite HTML entry
├── vite.config.ts                       # Vite config (React plugin)
├── tsconfig.json                        # TypeScript config
├── tailwind.config.js                   # Tailwind config
├── postcss.config.js                    # PostCSS config
├── package.json                         # Dependencies and scripts
├── README.md                            # This file
└── SUPABASE.md                          # Database setup guide
```

---

## Getting Started

### 1. Prerequisites

- Node.js 18 or 20 (run `node --version` to check)
- npm 9+ (comes with Node)

### 2. Install dependencies

```bash
npm install
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

The app works fully offline with no environment variables. All data is seeded from `src/data/index.ts` into `localStorage` on first load.

### 4. Build for production

```bash
npm run build
```

Output goes to `dist/`. Preview the production build with:

```bash
npm run preview
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Both variables are optional.** Without them, the app runs entirely on `localStorage` — all edits, exec profiles, account plan versions, and notes are persisted locally in the browser.

With Supabase configured, data syncs to the cloud and is shared across all team members.

> See `SUPABASE.md` for full database setup instructions.

---

## Available Routes

| Route | Page | Description |
|---|---|---|
| `/` | Redirect | Redirects to `/modules` |
| `/modules` | Modules | Module selector |
| `/executive-summary` | Executive Summary | Sales & Growth intelligence hub |
| `/executive-summary/pipeline-insights` | Pipeline Insights | Pipeline drilldown |
| `/executive-summary/financial-insights` | Financial Insights | Revenue & spend signals |
| `/executive-summary/article/:type` | Article | Insight article reader |
| `/executive-summary/news/:id` | News Article | News article reader |
| `/accounts` | Accounts List | Account selector (Revance, Takeda) |
| `/accounts/:id` | Account Info | Full account intelligence (`:id` = `revance` or `takeda`) |
| `/accounts/planning` | Account Planning | Versioned account plan editor |
| `/accounts/exec-capital` | Exec Capital | Executive profile card grid |
| `/accounts/exec-capital/:id` | Exec Detail | Full executive profile (`:id` = exec slug) |
| `/briefing/:accountId` | Executive Briefing | Standalone presentation (no shell) |

---

## Key Features by Module

### Account Info (`/accounts/:id`)

Five layers, each with multiple sections:

**Account Layer**
- Account Intelligence — Nudge signal + company profile tabs (Company Profile, Key Signals, Competitive Intelligence, Sales Intelligence)
- News Intelligence — Internal (Freyr) and external news
- One Minute Summary — Exec flip cards from the One Minute Summary data
- Financial Snapshot — Revenue, pipeline, and financial metrics
- SWOT Analysis — Flip cards for S/W/O/T

**Business Layer**
- Key Stakeholders — Org chart with drag-and-drop, stakeholder profiles with dos/don'ts
- Strategic Priorities — Expandable priority cards with urgency, Freyr action, and stakeholder links
- Right to Win — Competitive positioning
- Freyr Opportunities — Play areas and engagement opportunities

**Growth Layer**
- Revenue Target — Revenue targets and pipeline
- Pipeline Insights — Asset-level pipeline registry
- Play Areas — Freyr service play areas
- Investment Strategy — Investment priority flip cards

**Execution Layer**
- Next Best Actions — Prioritised action cards
- 90-Day Action Plan — Quarterly action timeline
- Big Bets — Strategic bets

**Workspace**
- Notes & Download — Account notes + Account Intelligence Dossier download

### Exec Capital (`/accounts/exec-capital`)

9 executive profiles across Revance (5) and Takeda (4):

- **Revance**: Nadeem Moiz (CEO), Kira Schwartz (CLO), Nick Crowe (COO), Scott Leffler (CFO), Thomas Hitchcock PhD (CInO)
- **Takeda**: Julie Kim (President & CEO), Andrew Robertson PhD JD (VP GRA Policy & Innovation), Lauren Duprey (CTO), Gabriele Ricci (CDTO)

Each profile has 17 editable sections with DB persistence:
One Minute Summary · Interests & Hobbies · Company Role · Media Appearances · Social Activity · Key Traits · Sales Insights · Conference Intelligence · Game Time Tags · Memberships & Affiliations · Awards & Recognitions · Notes · Freyr Selling Point · Action Plan · Relationship Score · Tasks · Download Profile Link

### Account Planning (`/accounts/planning`)

Eight Browse By sections with full versioning (Save Draft → Publish → Version history):
- Executive Briefing (read-only PPT preview)
- Account Context (5 editable text fields)
- Account Priority
- Our Big Bets
- Power Centres Responsible
- Emerging Pipeline
- Inferences
- Account Review Recap (editable table)

---

## Data Architecture

All static data lives in `src/data/index.ts`. This single file exports:

| Export | Description |
|---|---|
| `REVANCE_EXECS` | 5 Revance executive profiles |
| `TAKEDA_EXECS` | 4 Takeda executive profiles |
| `ALL_EXECS` | Combined array `[...REVANCE_EXECS, ...TAKEDA_EXECS]` |
| `ACCOUNT_INFO` | Account intelligence data keyed by `revance` / `takeda` |
| `ACCOUNT_PLAN` | Account plan seed data keyed by account ID |
| `REVANCE_ORG` / `TAKEDA_ORG` | Org chart node data |
| `MODULES` | Module card definitions |
| `INSIGHT_CARDS` | Executive Summary insight cards |
| `NEWS_INTERNAL` / `NEWS_EXTERNAL` | News articles |
| `ACCOUNTS_LIST` | Account selector entries |
| `BROWSE_BY_OPTIONS` | Account Planning browse-by section names |

**Modifying data**: Edit `src/data/index.ts` directly. To force re-seeding of exec profiles after data changes, call `clearExecSeedFlag(execId)` from `src/lib/supabase.ts`, or clear `localStorage` in DevTools.

---

## Persistence Model

The app uses a **dual-layer persistence** model:

```
User action (edit a field)
        │
        ▼
React state (live session)
        │
        ▼ on Save/Publish
localStorage (always)  ──►  Supabase DB (if configured)
        │                           │
        └──────────────────────────►│
                    on page load, DB wins if available
```

**Executive profile seeding** (`seedExecProfile`):
- Called once per exec on `ExecDetailPage` mount
- Reads static data from `ALL_EXECS` in `index.ts`
- Writes all 12 sections to `localStorage` (and Supabase if connected)
- Flagged via `localStorage.setItem('nudge_seeded_${execId}', '1')` — only runs once
- To reset: open DevTools → Application → Local Storage → delete `nudge_seeded_${execId}`

**Account plan versioning**:
- Save Draft → writes `is_draft: true` with incrementing version number
- Publish → writes `is_draft: false`, updates `publishedData` in React state
- Version selector allows loading any previously published version

---

## Deployment (Vercel)

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_ORG/nudge-intelligence.git
git push -u origin main
```

### Step 2 — Create Vercel project

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import your GitHub repo
3. Vercel auto-detects Vite. Confirm:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**

### Step 3 — Add environment variables (optional)

Vercel dashboard → your project → **Settings → Environment Variables**:

```
VITE_SUPABASE_URL        = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY   = your-anon-key
```

Redeploy after adding variables.

### Step 4 — Custom domain (optional)

Vercel project → **Settings → Domains** → add your domain → copy DNS records to your registrar.

### Ongoing deployments

Every `git push` to `main` triggers an automatic Vercel redeploy. No manual steps needed.

---

## Adding New Accounts or Executives

### Add a new executive

In `src/data/index.ts`, add an entry to `REVANCE_EXECS` or `TAKEDA_EXECS`:

```typescript
{
  id: 'jane-smith',               // URL slug — must be unique
  name: 'Jane Smith',
  title: 'Chief Medical Officer',
  company: 'Revance Therapeutics',
  companyId: 'revance',
  linkedIn: 'https://www.linkedin.com/in/...',
  status: 'cold',
  bookmarked: false,
  tenure: 'From Jan 2026',
  location: 'Nashville, TN',
  workHistory: [ { company:'...', role:'...', period:'...' } ],
  education:   [ { school:'...', degree:'...', period:'...' } ],
  summary: {
    currentRole: '...',
    personalityType: '...',
    topPriorities: '...',
    dosWhenEngaging: '...',
    dontsWhenEngaging: '...',
    leadershipStyle: '...',
    personalMotivation: '...',
    freyrSellingPoint: '...',
  },
  keyTraits:             [ { name:'...', summary:'...' } ],
  salesInsights:         [ { scenario:'During A Call Or A Meeting', dos:[], donts:[] } ],
  conferenceIntelligence:[ '...' ],
  interests:             [ { name:'...', proofPoint:'...' } ],
  companyRole: '...',
  sellingPoint: { department:'...', content:'...' },
  actionPlan: [ '...' ],
  downloads: { profilePdf: null },
}
```

### Add a new account

In `src/data/index.ts`, add an entry to `ACCOUNT_INFO` and `ACCOUNT_PLAN`, then add the account to `ACCOUNTS_LIST`.

---

## Troubleshooting

**Exec profile sections are empty after a fresh install**

The seed runs once and is flagged. If localStorage was cleared but the flag is still present from a previous session, sections will appear empty. Fix: in DevTools → Application → Local Storage → filter by `nudge_seeded_` → delete the relevant keys. Reload the exec profile page.

**Account plan data not saving**

Without Supabase, data saves to localStorage. Check: DevTools → Application → Local Storage → filter by `nudge_apv_` or `nudge_acs_`. If empty, ensure the `handleSave` / `handlePublish` function is being called correctly.

**Build fails with TypeScript errors**

Run `npx tsc --noEmit` to see detailed errors. The most common cause is adding a new field to exec data without updating the TypeScript type in `src/types/InsightPerson.ts`.

**Vite dev server not starting**

```bash
rm -rf node_modules
npm install
npm run dev
```

**White screen on Vercel deploy**

Check: Vercel project → Deployments → latest build → Functions log. Usually caused by missing `VITE_` prefix on environment variables (Vite only exposes env vars prefixed with `VITE_`).
