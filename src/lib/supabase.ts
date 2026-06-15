import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL  ?? ''
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? ''

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null
export const DB_ENABLED = !!supabase

// ─── Local fallback ────────────────────────────────────────────────────────
export function localGet<T = any>(key: string): T[] {
  try { const s = localStorage.getItem(`nudge_${key}`); return s ? JSON.parse(s) : [] }
  catch { return [] }
}
export function localSet(key: string, data: any) {
  try { localStorage.setItem(`nudge_${key}`, JSON.stringify(data)) } catch {}
}
function localOne(key: string): any|null {
  const a = localGet(key); return a[0] ?? null
}

// ─── Generic CRUD helpers ─────────────────────────────────────────────────
async function dbAll<T>(table: string, execId: string): Promise<T[]> {
  if (supabase) {
    const { data, error } = await supabase.from(table).select('*').eq('exec_id', execId).order('sort_order').order('created_at', { ascending: false })
    if (!error && data) { localSet(`${table}_${execId}`, data); return data as T[] }
  }
  return localGet<T>(`${table}_${execId}`)
}

async function dbUpsert<T extends { id?: string }>(table: string, row: T): Promise<T> {
  const withId = { ...row, id: row.id || crypto.randomUUID(), created_at: new Date().toISOString() }
  if (supabase) {
    const { data, error } = await supabase.from(table).upsert(withId).select().single()
    if (!error && data) return data as T
  }
  // local fallback
  const key = `${table}_${(withId as any).exec_id}`
  const list = localGet<any>(key)
  const idx = list.findIndex((r: any) => r.id === withId.id)
  if (idx >= 0) list[idx] = withId; else list.unshift(withId)
  localSet(key, list)
  return withId as T
}

async function dbDelete(table: string, execId: string, id: string): Promise<void> {
  if (supabase) { await supabase.from(table).delete().eq('id', id) }
  const key = `${table}_${execId}`
  localSet(key, localGet(key).filter((r: any) => r.id !== id))
}

async function dbOne<T>(table: string, execId: string): Promise<T | null> {
  if (supabase) {
    const { data } = await supabase.from(table).select('*').eq('exec_id', execId).single()
    if (data) { localSet(`${table}_${execId}`, [data]); return data as T }
  }
  return localOne(`${table}_${execId}`)
}

async function dbUpsertOne<T>(table: string, row: T): Promise<T> {
  const withId = { ...(row as any), id: (row as any).id || crypto.randomUUID() }
  if (supabase) {
    const { data, error } = await supabase.from(table).upsert(withId, { onConflict: 'exec_id' }).select().single()
    if (!error && data) { localSet(`${table}_${(row as any).exec_id}`, [data]); return data as T }
  }
  localSet(`${table}_${(row as any).exec_id}`, [withId])
  return withId as T
}

// ─── OMS (One Minute Summary) ───────────────────────────────────────────────
export interface OmsOverrides {
  currentRole?: string; personalityType?: string; topPriorities?: string
  dosWhenEngaging?: string; dontsWhenEngaging?: string; leadershipStyle?: string
  personalMotivation?: string; freyrSellingPoint?: string
}

export async function getOmsOverrides(execId: string): Promise<OmsOverrides> {
  if (supabase) {
    const { data } = await supabase.from('exec_profiles').select('oms_overrides').eq('exec_id', execId).single()
    if (data?.oms_overrides) return data.oms_overrides
  }
  const s = localOne(`oms_${execId}`); return s || {}
}

export async function setOmsOverride(execId: string, key: string, value: string): Promise<void> {
  const current = await getOmsOverrides(execId)
  const updated = { ...current, [key]: value }
  if (supabase) {
    await supabase.from('exec_profiles').upsert({ exec_id: execId, company_id: 'unknown', oms_overrides: updated }, { onConflict: 'exec_id' })
  }
  localSet(`oms_${execId}`, [updated])
}

// ─── Interests And Hobbies ──────────────────────────────────────────────────
export interface Interest { id?: string; exec_id: string; name: string; proof_point?: string; sort_order?: number; created_at?: string }
export const getInterests = (execId: string) => dbAll<Interest>('exec_interests', execId)
export const upsertInterest = (row: Interest) => dbUpsert<Interest>('exec_interests', row)
export const deleteInterest = (execId: string, id: string) => dbDelete('exec_interests', execId, id)

// ─── Company Role ───────────────────────────────────────────────────────────
export interface CompanyRole { id?: string; exec_id: string; content: string }
export const getCompanyRole = (execId: string) => dbOne<CompanyRole>('exec_company_role', execId)
export const saveCompanyRole = (row: CompanyRole) => dbUpsertOne<CompanyRole>('exec_company_role', row)

// ─── Media Appearances ──────────────────────────────────────────────────────
export interface MediaAppearance { id?: string; exec_id: string; link?: string; title?: string; description?: string; date?: string; source_url?: string; sort_order?: number; created_at?: string }
export const getMediaAppearances = (execId: string) => dbAll<MediaAppearance>('exec_media_appearances', execId)
export const upsertMediaAppearance = (row: MediaAppearance) => dbUpsert<MediaAppearance>('exec_media_appearances', row)
export const deleteMediaAppearance = (execId: string, id: string) => dbDelete('exec_media_appearances', execId, id)

// ─── Social Activity ─────────────────────────────────────────────────────────
export interface SocialPost { id?: string; exec_id: string; link?: string; summary?: string; posted_date?: string; sort_order?: number; created_at?: string }
export const getSocialActivity = (execId: string) => dbAll<SocialPost>('exec_social_activity', execId)
export const upsertSocialPost = (row: SocialPost) => dbUpsert<SocialPost>('exec_social_activity', row)
export const deleteSocialPost = (execId: string, id: string) => dbDelete('exec_social_activity', execId, id)

// ─── Key Traits ──────────────────────────────────────────────────────────────
export interface KeyTrait { id?: string; exec_id: string; name: string; summary?: string; sort_order?: number; created_at?: string }
export const getKeyTraits = (execId: string) => dbAll<KeyTrait>('exec_key_traits', execId)
export const upsertKeyTrait = (row: KeyTrait) => dbUpsert<KeyTrait>('exec_key_traits', row)
export const deleteKeyTrait = (execId: string, id: string) => dbDelete('exec_key_traits', execId, id)

// ─── Sales Insights ──────────────────────────────────────────────────────────
export interface SalesInsight { id?: string; exec_id: string; scenario?: string; dos?: string; donts?: string; sort_order?: number; created_at?: string }
export const getSalesInsights = (execId: string) => dbAll<SalesInsight>('exec_sales_insights', execId)
export const upsertSalesInsight = (row: SalesInsight) => dbUpsert<SalesInsight>('exec_sales_insights', row)
export const deleteSalesInsight = (execId: string, id: string) => dbDelete('exec_sales_insights', execId, id)

// ─── Conference Intelligence ─────────────────────────────────────────────────
export interface ConferenceSummary { id?: string; exec_id: string; summary: string }
export const getConferenceSummary = (execId: string) => dbOne<ConferenceSummary>('exec_conference_summary', execId)
export const saveConferenceSummary = (row: ConferenceSummary) => dbUpsertOne<ConferenceSummary>('exec_conference_summary', row)

export interface Conference { id?: string; exec_id: string; name: string; occurrences?: number; role?: string; year?: string; evidence?: string; source_url?: string; major_topics?: string; sort_order?: number; created_at?: string }
export const getConferences = (execId: string) => dbAll<Conference>('exec_conferences', execId)
export const upsertConference = (row: Conference) => dbUpsert<Conference>('exec_conferences', row)
export const deleteConference = (execId: string, id: string) => dbDelete('exec_conferences', execId, id)

// ─── Game Time Tags ───────────────────────────────────────────────────────────
export interface GameTimeTag { id?: string; exec_id: string; name: string; type?: string; position?: string; source_url?: string; start_date?: string; description?: string; org_represented?: string; sort_order?: number; created_at?: string }
export const getGameTimeTags = (execId: string) => dbAll<GameTimeTag>('exec_game_time_tags', execId)
export const upsertGameTimeTag = (row: GameTimeTag) => dbUpsert<GameTimeTag>('exec_game_time_tags', row)
export const deleteGameTimeTag = (execId: string, id: string) => dbDelete('exec_game_time_tags', execId, id)

// ─── Memberships And Affiliations ─────────────────────────────────────────────
export interface Membership { id?: string; exec_id: string; name: string; type?: string; position?: string; source_url?: string; start_date?: string; description?: string; org_represented?: string; sort_order?: number; created_at?: string }
export const getMemberships = (execId: string) => dbAll<Membership>('exec_memberships', execId)
export const upsertMembership = (row: Membership) => dbUpsert<Membership>('exec_memberships', row)
export const deleteMembership = (execId: string, id: string) => dbDelete('exec_memberships', execId, id)

// ─── Awards And Recognitions ─────────────────────────────────────────────────
export interface Award { id?: string; exec_id: string; name: string; year?: string; organization?: string; description?: string; source_url?: string; sort_order?: number; created_at?: string }
export const getAwards = (execId: string) => dbAll<Award>('exec_awards', execId)
export const upsertAward = (row: Award) => dbUpsert<Award>('exec_awards', row)
export const deleteAward = (execId: string, id: string) => dbDelete('exec_awards', execId, id)

// ─── Notes ────────────────────────────────────────────────────────────────────
export interface ExecNote { id?: string; exec_id: string; note_header?: string; note_content?: string; version?: number; updated_by?: string; created_at?: string }
export const getNotes = (execId: string) => dbAll<ExecNote>('exec_notes', execId)
export async function upsertNote(row: ExecNote): Promise<ExecNote> {
  // Auto-increment version
  const existing = await getNotes(row.exec_id)
  const base = row.id ? existing.find(n => n.id === row.id) : null
  const version = base ? (base.version || 1) : (existing.length + 1)
  return dbUpsert<ExecNote>('exec_notes', { ...row, version, updated_by: row.updated_by || 'Ritesh Dogra' })
}
export const deleteNote = (execId: string, id: string) => dbDelete('exec_notes', execId, id)

// ─── Freyr Selling Point ────────────────────────────────────────────
export interface SellingPoint { id?: string; exec_id: string; department?: string; content?: string }
export const getSellingPoint = (execId: string) => dbOne<SellingPoint>('exec_selling_points', execId)
export const saveSellingPoint = (row: SellingPoint) => dbUpsertOne<SellingPoint>('exec_selling_points', row)

// ─── Action Plan ──────────────────────────────────────────────────────────────
export interface ActionItem { id?: string; exec_id: string; content: string; sort_order?: number; created_at?: string }
export const getActionPlan = (execId: string) => dbAll<ActionItem>('exec_action_plan', execId)
export const upsertActionItem = (row: ActionItem) => dbUpsert<ActionItem>('exec_action_plan', row)
export const deleteActionItem = (execId: string, id: string) => dbDelete('exec_action_plan', execId, id)

// ─── Relationship Score ───────────────────────────────────────────────────────
export interface RelScore { id?: string; exec_id: string; score: string; reason?: string; recorded_at?: string; created_at?: string }
export const getRelScores = (execId: string) => dbAll<RelScore>('exec_relationship_scores', execId)
export async function addRelScore(row: RelScore): Promise<RelScore> {
  return dbUpsert<RelScore>('exec_relationship_scores', { ...row, recorded_at: new Date().toISOString() })
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export interface Task { id?: string; exec_id: string; task_action: string; status?: string; source?: string; business_unit?: string; due_date?: string; meeting_link?: string; meeting_notes?: string; priority?: string; assigned_to?: string; additional_people_tagged?: string; tab_type?: 'manual'|'meetings'; created_at?: string }
export const getTasks = (execId: string) => dbAll<Task>('exec_tasks', execId)
export const upsertTask = (row: Task) => dbUpsert<Task>('exec_tasks', row)
export const deleteTask = (execId: string, id: string) => dbDelete('exec_tasks', execId, id)

// ─── Account Context Sections ─────────────────────────────────────────────────
// Stores per-sub-section published/draft data for the Account Context page.
export interface ContextSection {
  id?: string
  account_id: string
  sub_section: string   // 'organizationalOverview' | 'companyPerformance' | etc.
  content: string
  structured: any       // metrics[], partners[], pipeline[], insights[]
  version_number: number
  is_draft: boolean
  saved_at: string
}

export async function getAllContextSections(accountId: string): Promise<ContextSection[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('account_context_sections')
      .select('*')
      .eq('account_id', accountId)
      .order('version_number', { ascending: false })
    if (!error && data) {
      localSet(`ctx_sections_${accountId}`, data)
      return data as ContextSection[]
    }
  }
  return localGet<ContextSection>(`ctx_sections_${accountId}`)
}

export async function saveContextSection(section: ContextSection): Promise<ContextSection> {
  const row = { ...section, id: section.id || crypto.randomUUID(), saved_at: new Date().toISOString() }
  if (supabase) {
    const { data, error } = await supabase
      .from('account_context_sections')
      .upsert(row, { onConflict: 'account_id,sub_section,version_number' })
      .select()
      .single()
    if (!error && data) {
      const key = `ctx_sections_${section.account_id}`
      const existing = localGet<ContextSection>(key)
      const idx = existing.findIndex(r => r.account_id === row.account_id && r.sub_section === row.sub_section && r.version_number === row.version_number)
      if (idx >= 0) existing[idx] = data as ContextSection; else existing.unshift(data as ContextSection)
      localSet(key, existing)
      return data as ContextSection
    }
  }
  const key = `ctx_sections_${section.account_id}`
  const existing = localGet<ContextSection>(key)
  const idx = existing.findIndex(r => r.account_id === row.account_id && r.sub_section === row.sub_section && r.version_number === row.version_number)
  if (idx >= 0) existing[idx] = row; else existing.unshift(row)
  localSet(key, existing)
  return row
}

export function getLatestPublishedContext(sections: ContextSection[], subSection: string): ContextSection | null {
  return sections
    .filter(s => s.sub_section === subSection && !s.is_draft)
    .sort((a, b) => b.version_number - a.version_number)[0] ?? null
}

// ─── Account Plan Sections ────────────────────────────────────────────────────
// Each row = one published section version for one account.
// section_key: 'Account Priority' | 'Our Big Bets' | 'Power Centres Responsible' |
//              'Emerging Pipeline' | 'Inferences' | 'Account Review Recap'
export interface PlanSection {
  id?: string
  account_id: string
  section_key: string
  version_number: number
  data: any
  saved_at: string
  is_draft: boolean
}

export async function getAllPlanSections(accountId: string): Promise<PlanSection[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('account_plan_versions')
      .select('*')
      .eq('account_id', accountId)
      .order('version_number', { ascending: false })
    if (!error && data) {
      localSet(`plan_sections_${accountId}`, data)
      return data as PlanSection[]
    }
  }
  return localGet<PlanSection>(`plan_sections_${accountId}`)
}

export async function savePlanSection(section: PlanSection): Promise<PlanSection> {
  const row = { ...section, id: section.id || crypto.randomUUID(), saved_at: new Date().toISOString() }
  if (supabase) {
    const { data, error } = await supabase
      .from('account_plan_versions')
      .upsert(row, { onConflict: 'account_id,section_key,version_number' })
      .select()
      .single()
    if (!error && data) {
      // Update local cache
      const key = `plan_sections_${section.account_id}`
      const existing = localGet<PlanSection>(key)
      const idx = existing.findIndex(r => r.account_id === row.account_id && r.section_key === row.section_key && r.version_number === row.version_number)
      if (idx >= 0) existing[idx] = data as PlanSection; else existing.unshift(data as PlanSection)
      localSet(key, existing)
      return data as PlanSection
    }
  }
  // localStorage fallback
  const key = `plan_sections_${section.account_id}`
  const existing = localGet<PlanSection>(key)
  const idx = existing.findIndex(r => r.account_id === row.account_id && r.section_key === row.section_key && r.version_number === row.version_number)
  if (idx >= 0) existing[idx] = row; else existing.unshift(row)
  localSet(key, existing)
  return row
}

export function getLatestPublishedSection(sections: PlanSection[], sectionKey: string): PlanSection | null {
  return sections
    .filter(s => s.section_key === sectionKey && !s.is_draft)
    .sort((a, b) => b.version_number - a.version_number)[0] ?? null
}

export function getLatestDraftSection(sections: PlanSection[], sectionKey: string): PlanSection | null {
  return sections
    .filter(s => s.section_key === sectionKey && s.is_draft)
    .sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime())[0] ?? null
}
export interface OrgPerson { id: string; name: string; designation: string; relationship: 'hot'|'warm'|'cold'; managerId: string|null }

export async function getOrgChart(accountId: string, fallback: OrgPerson[]): Promise<{ people: OrgPerson[]; orientation: string }> {
  if (supabase) {
    const { data } = await supabase.from('org_charts').select('*').eq('account_id', accountId).single()
    if (data) return { people: data.people, orientation: data.orientation || 'leftright' }
  }
  const stored = localGet<any>(`org_${accountId}`)
  if (stored[0]) return stored[0]
  return { people: fallback, orientation: 'leftright' }
}

export async function saveOrgChart(accountId: string, people: OrgPerson[], orientation: string): Promise<void> {
  const payload = { account_id: accountId, people, orientation }
  if (supabase) { await supabase.from('org_charts').upsert(payload, { onConflict: 'account_id' }) }
  localSet(`org_${accountId}`, [payload])
}

// ─── Executive Profile Seeder ─────────────────────────────────────────────────
// Seeds all exec profile sections from static data into localStorage (and DB).
// Called once on ExecDetailPage mount. Uses a seeded flag to avoid re-seeding.
export async function seedExecProfile(exec: any): Promise<void> {
  const execId = exec.id
  const flagKey = `nudge_seeded_${execId}`
  if (localStorage.getItem(flagKey)) return  // already seeded

  const id = () => crypto.randomUUID()
  const now = new Date().toISOString()

  // 1. OMS (One Minute Summary)
  if (exec.summary) {
    const omsKey = `oms_${execId}`
    if (!localGet(omsKey).length) {
      const oms = {
        currentRole:       exec.summary.currentRole       || '',
        personalityType:   exec.summary.personalityType   || '',
        topPriorities:     exec.summary.topPriorities     || '',
        dosWhenEngaging:   exec.summary.dosWhenEngaging   || '',
        dontsWhenEngaging: exec.summary.dontsWhenEngaging || '',
        leadershipStyle:   exec.summary.leadershipStyle   || '',
        personalMotivation:exec.summary.personalMotivation|| '',
        freyrSellingPoint: exec.summary.freyrSellingPoint || exec.summary.indegeneSellingPoint || '',
      }
      localSet(omsKey, [oms])
      if (supabase) {
        await supabase.from('exec_profiles').upsert(
          { exec_id: execId, company_id: exec.companyId || 'unknown', oms_overrides: oms },
          { onConflict: 'exec_id' }
        )
      }
    }
  }

  // 2. Interests & Hobbies
  if (exec.interests?.length) {
    const key = `exec_interests_${execId}`
    if (!localGet(key).length) {
      const rows = exec.interests.map((x: any, i: number) => ({
        id: id(), exec_id: execId, name: x.name, proof_point: x.proofPoint || '', sort_order: i, created_at: now
      }))
      localSet(key, rows)
      if (supabase) for (const r of rows) await supabase.from('exec_interests').upsert(r)
    }
  }

  // 3. Company Role
  if (exec.companyRole) {
    const key = `exec_company_role_${execId}`
    if (!localGet(key).length) {
      const row = { id: id(), exec_id: execId, content: exec.companyRole }
      localSet(key, [row])
      if (supabase) await supabase.from('exec_company_role').upsert(row, { onConflict: 'exec_id' })
    }
  }

  // 4. Media Appearances
  if (exec.mediaAppearances?.length) {
    const key = `exec_media_appearances_${execId}`
    if (!localGet(key).length) {
      const rows = exec.mediaAppearances.map((x: any, i: number) => ({
        id: id(), exec_id: execId, link: x.link || '', title: x.title || '',
        description: x.description || '', date: x.date || '', source_url: x.sourceUrl || x.source_url || '',
        sort_order: i, created_at: now
      }))
      localSet(key, rows)
      if (supabase) for (const r of rows) await supabase.from('exec_media_appearances').upsert(r)
    }
  }

  // 5. Social Activity
  if (exec.socialActivity?.length) {
    const key = `exec_social_activity_${execId}`
    if (!localGet(key).length) {
      const rows = exec.socialActivity.map((x: any, i: number) => ({
        id: id(), exec_id: execId, link: x.link || '', summary: x.summary || '',
        posted_date: x.postedDate || x.posted_date || '', sort_order: i, created_at: now
      }))
      localSet(key, rows)
      if (supabase) for (const r of rows) await supabase.from('exec_social_activity').upsert(r)
    }
  }

  // 6. Key Traits
  if (exec.keyTraits?.length) {
    const key = `exec_key_traits_${execId}`
    if (!localGet(key).length) {
      const rows = exec.keyTraits.map((x: any, i: number) => ({
        id: id(), exec_id: execId, name: x.name, summary: x.summary || '', sort_order: i, created_at: now
      }))
      localSet(key, rows)
      if (supabase) for (const r of rows) await supabase.from('exec_key_traits').upsert(r)
    }
  }

  // 7. Sales Insights
  if (exec.salesInsights?.length) {
    const key = `exec_sales_insights_${execId}`
    if (!localGet(key).length) {
      const rows = exec.salesInsights.map((x: any, i: number) => ({
        id: id(), exec_id: execId,
        scenario: x.scenario || '',
        dos:   Array.isArray(x.dos)   ? x.dos.join('\n• ')   : (x.dos   || ''),
        donts: Array.isArray(x.donts) ? x.donts.join('\n• ') : (x.donts || ''),
        sort_order: i, created_at: now
      }))
      localSet(key, rows)
      if (supabase) for (const r of rows) await supabase.from('exec_sales_insights').upsert(r)
    }
  }

  // 8. Conference Intelligence — summary + individual conferences
  if (exec.conferenceIntelligence?.length) {
    const summaryKey = `exec_conference_summary_${execId}`
    if (!localGet(summaryKey).length) {
      const summaryRow = { id: id(), exec_id: execId, summary: exec.conferenceIntelligence.join('\n\n') }
      localSet(summaryKey, [summaryRow])
      if (supabase) await supabase.from('exec_conference_summary').upsert(summaryRow, { onConflict: 'exec_id' })
    }
    const confKey = `exec_conferences_${execId}`
    if (!localGet(confKey).length) {
      const rows = exec.conferenceIntelligence.map((c: string, i: number) => ({
        id: id(), exec_id: execId, name: c, occurrences: 1, sort_order: i, created_at: now
      }))
      localSet(confKey, rows)
      if (supabase) for (const r of rows) await supabase.from('exec_conferences').upsert(r)
    }
  }

  // 9. Memberships
  if (exec.memberships?.length) {
    const key = `exec_memberships_${execId}`
    if (!localGet(key).length) {
      const rows = exec.memberships.map((x: any, i: number) => ({
        id: id(), exec_id: execId, name: x.name || '', type: x.type || '',
        description: x.description || '', sort_order: i, created_at: now
      }))
      localSet(key, rows)
      if (supabase) for (const r of rows) await supabase.from('exec_memberships').upsert(r)
    }
  }

  // 10. Awards
  if (exec.awards?.length) {
    const key = `exec_awards_${execId}`
    if (!localGet(key).length) {
      const rows = exec.awards.map((x: any, i: number) => ({
        id: id(), exec_id: execId, name: x.name || '', year: String(x.year || ''),
        organization: x.org || x.organization || '', description: x.description || '',
        sort_order: i, created_at: now
      }))
      localSet(key, rows)
      if (supabase) for (const r of rows) await supabase.from('exec_awards').upsert(r)
    }
  }

  // 11. Freyr Selling Point
  if (exec.sellingPoint || exec.summary?.freyrSellingPoint || exec.summary?.indegeneSellingPoint) {
    const key = `exec_selling_points_${execId}`
    if (!localGet(key).length) {
      const sp = exec.sellingPoint || {}
      const row = {
        id: id(), exec_id: execId,
        department: sp.department || '',
        content: sp.content || exec.summary?.freyrSellingPoint || exec.summary?.indegeneSellingPoint || ''
      }
      localSet(key, [row])
      if (supabase) await supabase.from('exec_selling_points').upsert(row, { onConflict: 'exec_id' })
    }
  }

  // 12. Action Plan
  if (exec.actionPlan?.length) {
    const key = `exec_action_plan_${execId}`
    if (!localGet(key).length) {
      const rows = exec.actionPlan.map((c: string, i: number) => ({
        id: id(), exec_id: execId, content: c, sort_order: i, created_at: now
      }))
      localSet(key, rows)
      if (supabase) for (const r of rows) await supabase.from('exec_action_plan').upsert(r)
    }
  }

  // Mark as seeded
  localStorage.setItem(flagKey, '1')
}

// Clear seed flag (call this to force re-seed on next load)
export function clearExecSeedFlag(execId: string): void {
  localStorage.removeItem(`nudge_seeded_${execId}`)
}
