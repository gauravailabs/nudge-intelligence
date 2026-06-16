import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mail, Eye, MapPin, Briefcase, GraduationCap, X, Plus, Check, Trash2, ArrowLeft, ChevronDown, Edit2, Save, ChevronRight, ExternalLink } from 'lucide-react'
import { ALL_EXECS } from '../../data'
import {
  getOmsOverrides, setOmsOverride,
  getInterests, upsertInterest, deleteInterest,
  getCompanyRole, saveCompanyRole,
  getMediaAppearances, upsertMediaAppearance, deleteMediaAppearance,
  getSocialActivity, upsertSocialPost, deleteSocialPost,
  getKeyTraits, upsertKeyTrait, deleteKeyTrait,
  getSalesInsights, upsertSalesInsight, deleteSalesInsight,
  getConferenceSummary, saveConferenceSummary, getConferences, upsertConference, deleteConference,
  getGameTimeTags, upsertGameTimeTag, deleteGameTimeTag,
  getMemberships, upsertMembership, deleteMembership,
  getAwards, upsertAward, deleteAward,
  getNotes, upsertNote, deleteNote,
  getSellingPoint, saveSellingPoint,
  getActionPlan, upsertActionItem, deleteActionItem,
  getRelScores, addRelScore,
  getTasks, upsertTask, deleteTask,
  seedExecProfile,
} from '../../lib/supabase'

// ─── Sidebar categories (exact order from video) ──────────────────────────
const CATEGORIES = [
  'One Minute Summary','Interests And Hobbies','Company Role',
  'Media Appearances','Social Activity','Key Traits','Sales Insights',
  'Conference Intelligence','Game Time Tags','Memberships And Affiliations',
  'Awards And Recognitions','Notes',
  'Freyr Selling Point','Action Plan','Relationship Score','Tasks',
  'Download Profile Link',
]

// ─── Shared UI primitives ─────────────────────────────────────────────────
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:'0 16px', alignItems:'start', padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
      <div style={{ fontSize:13, fontWeight:600, color:'var(--text-3)', paddingTop:10, fontFamily:'Source Sans 3,sans-serif' }}>{label}:</div>
      <div>{children}</div>
    </div>
  )
}

function FieldInput({ value, onChange, placeholder, multiline=false }: { value:string; onChange:(v:string)=>void; placeholder?:string; multiline?:boolean }) {
  if (multiline) return (
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      rows={3} style={{ width:'100%', padding:'8px 0', border:'none', outline:'none', background:'transparent', fontSize:14, color:'var(--text-1)', fontFamily:'Source Sans 3,sans-serif', lineHeight:1.65, resize:'vertical' }}/>
  )
  return (
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{ width:'100%', padding:'8px 0', border:'none', outline:'none', background:'transparent', fontSize:14, color:'var(--text-1)', fontFamily:'Source Sans 3,sans-serif' }}/>
  )
}

function ItemCard({ onDelete, children, isNew=false }: { onDelete:()=>void; children:React.ReactNode; isNew?:boolean }) {
  return (
    <div style={{ border:`1px ${isNew?'dashed':'solid'} ${isNew?'var(--navy)':'var(--border)'}`, borderRadius:8, marginBottom:8, background:isNew?'rgba(27,54,93,0.02)':'var(--bg-surface)', position:'relative' }}>
      <button onClick={onDelete} style={{ position:'absolute', top:8, right:8, width:22, height:22, borderRadius:4, border:'none', background:'transparent', cursor:'pointer', color:'var(--red)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
        <X size={14}/>
      </button>
      {children}
    </div>
  )
}

function SectionHeader({ title, onSave, saving }: { title:string; onSave:()=>void; saving:boolean }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
      <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:18, color:'var(--navy)', margin:0 }}>{title}</h3>
      <button onClick={onSave} disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, border:'none', background:'var(--navy)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'Source Sans 3,sans-serif', opacity:saving?0.7:1 }}>
        <Save size={13}/> {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

function AddFieldBtn({ onClick, label='Add Field' }: { onClick:()=>void; label?:string }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', border:'1px dashed var(--border)', borderRadius:8, background:'transparent', cursor:'pointer', fontSize:13, color:'var(--text-3)', fontFamily:'Source Sans 3,sans-serif', marginTop:8, width:'fit-content' }}>
      <Plus size={13}/> {label}
    </button>
  )
}

// ─── ONE MINUTE SUMMARY ────────────────────────────────────────────────────
function OneMinuteSummary({ exec, execId }: { exec:any; execId:string }) {
  const fields = [
    { key:'currentRole',          label:'Current Role',           icon:'🏢', accent:'#1B365D' },
    { key:'personalityType',      label:'Personality Type',       icon:'🧠', accent:'#7C3AED' },
    { key:'topPriorities',        label:'Top Priorities',         icon:'🎯', accent:'#059669' },
    { key:'dosWhenEngaging',      label:'Dos When Engaging',      icon:'✅', accent:'#10b981' },
    { key:'dontsWhenEngaging',    label:"Don'ts When Engaging",   icon:'🚫', accent:'#dc2626' },
    { key:'leadershipStyle',      label:'Leadership Style',       icon:'🏅', accent:'#b89428' },
    { key:'personalMotivation',   label:'Personal Motivation',    icon:'💡', accent:'#0891b2' },
    { key:'freyrSellingPoint', label:'Freyr Selling Point', icon:'⚡', accent:'#EA580C' },
  ]

  const [vals, setVals] = useState<Record<string,string>>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getOmsOverrides(execId).then(o => { setVals(o as Record<string,string>); setLoaded(true) })
  }, [execId])

  const get = (k:string) => vals[k] ?? (exec.summary as any)?.[k] ?? ''

  return (
    <div>
      <style>{`
        .exec-flip-card { perspective:1500px; cursor:pointer; }
        .exec-flip-inner { position:relative; width:100%; height:100%; transform-style:preserve-3d; transition:transform 0.7s cubic-bezier(0.4,0,0.2,1); }
        .exec-flip-card.flipped .exec-flip-inner { transform:rotateY(180deg); }
        .exec-flip-face { position:absolute; inset:0; border-radius:18px; backface-visibility:hidden; overflow:hidden; padding:20px; display:flex; flex-direction:column; }
        .exec-flip-front { background:white; border:1px solid #E5E7EB; border-top:5px solid #D4AF37; box-shadow:0 10px 28px rgba(27,54,93,0.09); }
        .exec-flip-back { background:linear-gradient(135deg,#1B365D 0%,#243e6b 100%); color:white; transform:rotateY(180deg); box-shadow:0 10px 28px rgba(27,54,93,0.22); }
        .exec-flip-card:hover:not(.flipped) { transform:translateY(-4px); transition:transform 0.2s; }
      `}</style>
      <p style={{ fontSize:14, color:'var(--text-3)', marginBottom:20, fontFamily:'Source Sans Pro,sans-serif' }}>Click any card to flip for detail</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:22 }}>
        {fields.map((f, i) => {
          const value = loaded ? get(f.key) : '…'
          return <ExecFlipCard key={f.key} field={f} value={value} execId={execId} onUpdate={(k,v)=>setVals(prev=>({...prev,[k]:v}))}/>
        })}
      </div>
    </div>
  )
}

function ExecFlipCard({ field, value, execId, onUpdate }: { field:any; value:string; execId:string; onUpdate:(k:string,v:string)=>void }) {
  const [flipped, setFlipped] = useState(false)
  const preview = value && value.length > 60 ? value.slice(0, 58) + '…' : value

  return (
    <div
      className={`exec-flip-card${flipped?' flipped':''}`}
      style={{ height:250 }}
      onClick={() => setFlipped(f => !f)}
    >
      <div className="exec-flip-inner">
        {/* FRONT */}
        <div className="exec-flip-face exec-flip-front" style={{ borderTop:`4px solid ${field.accent}` }}>
          <div style={{ width:46, height:46, borderRadius:'50%', background:field.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, marginBottom:10, flexShrink:0 }}>
            {field.icon}
          </div>
          <div style={{ fontSize:10.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', color:field.accent, marginBottom:6, fontFamily:'Source Sans Pro,sans-serif', flex:'0 0 auto' }}>{field.label}</div>
          <div style={{ fontFamily:'Source Sans Pro,sans-serif', fontSize:14, fontWeight:600, color:'#1B365D', lineHeight:1.45, flex:1, overflow:'hidden' }}>
            {preview || <span style={{ color:'#aaa', fontStyle:'italic', fontSize:12 }}>No data yet</span>}
          </div>
          <div style={{ marginTop:6, fontSize:11, color:'#aab4c0', fontFamily:'Source Sans Pro,sans-serif', flex:'0 0 auto' }}>Click to read full →</div>
        </div>
        {/* BACK */}
        <div className="exec-flip-face exec-flip-back">
          <div style={{ fontSize:10.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', color:field.accent === '#1B365D' ? '#D4AF37' : field.accent, marginBottom:8, fontFamily:'Source Sans Pro,sans-serif', flex:'0 0 auto', borderBottom:'1px solid rgba(255,255,255,0.15)', paddingBottom:8, lineHeight:1.2 }}>{field.label}</div>
          {/* Content — scrollable when text overflows */}
          <div style={{ flex:1, overflowY:'auto', paddingRight:2 }}>
            <p style={{ fontSize:13, lineHeight:1.8, color:'rgba(255,255,255,0.92)', margin:0, fontFamily:'Source Sans Pro,sans-serif' }}>
              {value || <span style={{ opacity:0.5, fontStyle:'italic' }}>No information yet.</span>}
            </p>
          </div>
          <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.35)', marginTop:6, flex:'0 0 auto', fontFamily:'Source Sans Pro,sans-serif' }}>↑ Scroll · Click to flip back</div>
        </div>
      </div>
    </div>
  )
}

// ─── INTERESTS AND HOBBIES ─────────────────────────────────────────────────
// Each item: Name + Proof Point. + Add Field button.
function InterestsHobbies({ execId }: { execId:string }) {
  const [items, setItems] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { getInterests(execId).then(setItems) }, [execId])

  const add = () => setItems(p => [...p, { id:'new_'+Date.now(), exec_id:execId, name:'', proof_point:'', _new:true }])
  const update = (id:string, field:string, val:string) => setItems(p => p.map(i => i.id===id ? {...i,[field]:val} : i))
  const remove = async (item:any) => {
    if (!item._new) await deleteInterest(execId, item.id)
    setItems(p => p.filter(i => i.id!==item.id))
  }
  const saveAll = async () => {
    setSaving(true)
    for (const item of items) {
      if (!item.name.trim()) continue
      const { _new, ...row } = item
      await upsertInterest(_new ? { ...row, id: undefined } : row)
    }
    const fresh = await getInterests(execId)
    setItems(fresh); setSaving(false)
  }

  return (
    <div>
      <SectionHeader title="Interests And Hobbies" onSave={saveAll} saving={saving}/>
      {items.map(item => (
        <ItemCard key={item.id} onDelete={()=>remove(item)} isNew={!!item._new}>
          <FieldRow label="Name">
            <FieldInput value={item.name} onChange={v=>update(item.id,'name',v)} placeholder="Enter name"/>
          </FieldRow>
          <FieldRow label="Proof Point">
            <FieldInput value={item.proof_point||''} onChange={v=>update(item.id,'proof_point',v)} placeholder="Enter proof point" multiline/>
          </FieldRow>
        </ItemCard>
      ))}
      <AddFieldBtn onClick={add}/>
    </div>
  )
}

// ─── COMPANY ROLE ──────────────────────────────────────────────────────────
// Single long-form text block. + Add Field.
function CompanyRoleSection({ execId }: { execId:string }) {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { getCompanyRole(execId).then(r => { if(r) setContent(r.content||'') }) }, [execId])

  const save = async () => {
    setSaving(true)
    await saveCompanyRole({ exec_id:execId, content })
    setSaving(false)
  }

  return (
    <div>
      <SectionHeader title="Company Role" onSave={save} saving={saving}/>
      <div style={{ border:'1px solid var(--border)', borderRadius:8, background:'var(--bg-surface)' }}>
        <FieldRow label="Company Role:">
          <textarea value={content} onChange={e=>setContent(e.target.value)}
            rows={10} style={{ width:'100%', padding:'8px 0', border:'none', outline:'none', background:'transparent', fontSize:14, color:'var(--text-1)', fontFamily:'Source Sans 3,sans-serif', lineHeight:1.75, resize:'vertical' }}
            placeholder="Enter company role description..."/>
        </FieldRow>
      </div>
      <AddFieldBtn onClick={()=>{}}/>
    </div>
  )
}

// ─── MEDIA APPEARANCES ─────────────────────────────────────────────────────
// Each item: Link + Title + Description + Date + Source URL
function MediaAppearances({ execId }: { execId:string }) {
  const [items, setItems] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { getMediaAppearances(execId).then(setItems) }, [execId])

  const add = () => setItems(p => [...p, { id:'new_'+Date.now(), exec_id:execId, link:'', title:'', description:'', date:'', source_url:'', _new:true }])
  const update = (id:string, f:string, v:string) => setItems(p => p.map(i => i.id===id ? {...i,[f]:v} : i))
  const remove = async (item:any) => {
    if (!item._new) await deleteMediaAppearance(execId, item.id)
    setItems(p => p.filter(i => i.id!==item.id))
  }
  const saveAll = async () => {
    setSaving(true)
    for (const item of items) {
      const { _new, ...row } = item
      await upsertMediaAppearance(_new ? {...row, id:undefined} : row)
    }
    const fresh = await getMediaAppearances(execId); setItems(fresh); setSaving(false)
  }

  return (
    <div>
      <SectionHeader title="Media Appearances" onSave={saveAll} saving={saving}/>
      {items.map(item => (
        <ItemCard key={item.id} onDelete={()=>remove(item)} isNew={!!item._new}>
          <FieldRow label="Link"><FieldInput value={item.link||''} onChange={v=>update(item.id,'link',v)} placeholder="Enter Link"/></FieldRow>
          <FieldRow label="Title"><FieldInput value={item.title||''} onChange={v=>update(item.id,'title',v)} placeholder="Enter Title"/></FieldRow>
          <FieldRow label="Description"><FieldInput value={item.description||''} onChange={v=>update(item.id,'description',v)} placeholder="Enter Description" multiline/></FieldRow>
          <FieldRow label="Date"><FieldInput value={item.date||''} onChange={v=>update(item.id,'date',v)} placeholder="Enter Date"/></FieldRow>
          <FieldRow label="Source Url"><FieldInput value={item.source_url||''} onChange={v=>update(item.id,'source_url',v)} placeholder="Enter Source Url"/></FieldRow>
        </ItemCard>
      ))}
      <AddFieldBtn onClick={add}/>
    </div>
  )
}

// ─── SOCIAL ACTIVITY ───────────────────────────────────────────────────────
// Each item: Link + Summary + Posted Date
function SocialActivity({ execId }: { execId:string }) {
  const [items, setItems] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { getSocialActivity(execId).then(setItems) }, [execId])

  const add = () => setItems(p => [...p, { id:'new_'+Date.now(), exec_id:execId, link:'', summary:'', posted_date:'', _new:true }])
  const update = (id:string, f:string, v:string) => setItems(p => p.map(i => i.id===id ? {...i,[f]:v} : i))
  const remove = async (item:any) => {
    if (!item._new) await deleteSocialPost(execId, item.id)
    setItems(p => p.filter(i => i.id!==item.id))
  }
  const saveAll = async () => {
    setSaving(true)
    for (const item of items) {
      const { _new, ...row } = item
      await upsertSocialPost(_new ? {...row,id:undefined} : row)
    }
    const fresh = await getSocialActivity(execId); setItems(fresh); setSaving(false)
  }

  return (
    <div>
      <SectionHeader title="Social Activity" onSave={saveAll} saving={saving}/>
      {items.map(item => (
        <ItemCard key={item.id} onDelete={()=>remove(item)} isNew={!!item._new}>
          <FieldRow label="Link"><FieldInput value={item.link||''} onChange={v=>update(item.id,'link',v)} placeholder="Enter Link"/></FieldRow>
          <FieldRow label="Summary"><FieldInput value={item.summary||''} onChange={v=>update(item.id,'summary',v)} placeholder="Enter Summary" multiline/></FieldRow>
          <FieldRow label="Posted Date"><FieldInput value={item.posted_date||''} onChange={v=>update(item.id,'posted_date',v)} placeholder="Enter Posted Date"/></FieldRow>
        </ItemCard>
      ))}
      <AddFieldBtn onClick={add}/>
    </div>
  )
}

// ─── KEY TRAITS ────────────────────────────────────────────────────────────
// Each item: Name + Summary
function KeyTraits({ exec, execId }: { exec:any; execId:string }) {
  const [items, setItems] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getKeyTraits(execId).then(db => {
      if (db.length > 0) { setItems(db); return }
      // seed from static data
      const seed = (exec.keyTraits||[]).map((t:any,i:number) => ({
        id:'seed_'+i, exec_id:execId, name:t.name||'', summary:t.summary||'', _seed:true
      }))
      setItems(seed)
    })
  }, [execId])

  const add = () => setItems(p => [...p, { id:'new_'+Date.now(), exec_id:execId, name:'', summary:'', _new:true }])
  const update = (id:string, f:string, v:string) => setItems(p => p.map(i => i.id===id ? {...i,[f]:v} : i))
  const remove = async (item:any) => {
    if (!item._new && !item._seed) await deleteKeyTrait(execId, item.id)
    setItems(p => p.filter(i => i.id!==item.id))
  }
  const saveAll = async () => {
    setSaving(true)
    for (const item of items) {
      if (!item.name.trim()) continue
      const { _new, _seed, ...row } = item
      await upsertKeyTrait((_new||_seed) ? {...row,id:undefined} : row)
    }
    const fresh = await getKeyTraits(execId); setItems(fresh); setSaving(false)
  }

  return (
    <div>
      <SectionHeader title="Key Traits" onSave={saveAll} saving={saving}/>
      {items.map(item => (
        <ItemCard key={item.id} onDelete={()=>remove(item)} isNew={!!item._new}>
          <FieldRow label="Name"><FieldInput value={item.name||''} onChange={v=>update(item.id,'name',v)} placeholder="Enter Name"/></FieldRow>
          <FieldRow label="Summary"><FieldInput value={item.summary||''} onChange={v=>update(item.id,'summary',v)} placeholder="Enter Summary" multiline/></FieldRow>
        </ItemCard>
      ))}
      <AddFieldBtn onClick={add}/>
    </div>
  )
}

// ─── SALES INSIGHTS ────────────────────────────────────────────────────────
// Each item: Do (multiline) + Don'ts (multiline) + Scenario
function SalesInsights({ exec, execId }: { exec:any; execId:string }) {
  const [items, setItems] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSalesInsights(execId).then(db => {
      if (db.length > 0) { setItems(db); return }
      const seed = (exec.salesInsights||[]).map((s:any,i:number) => ({
        id:'seed_'+i, exec_id:execId,
        scenario: s.scenario||'',
        dos: Array.isArray(s.dos) ? s.dos.join('\n') : (s.dos||''),
        donts: Array.isArray(s.donts) ? s.donts.join('\n') : (s.donts||''),
        _seed:true
      }))
      setItems(seed)
    })
  }, [execId])

  const add = () => setItems(p => [...p, { id:'new_'+Date.now(), exec_id:execId, dos:'', donts:'', scenario:'', _new:true }])
  const update = (id:string, f:string, v:string) => setItems(p => p.map(i => i.id===id ? {...i,[f]:v} : i))
  const remove = async (item:any) => {
    if (!item._new && !item._seed) await deleteSalesInsight(execId, item.id)
    setItems(p => p.filter(i => i.id!==item.id))
  }
  const saveAll = async () => {
    setSaving(true)
    for (const item of items) {
      const { _new, _seed, ...row } = item
      await upsertSalesInsight((_new||_seed) ? {...row,id:undefined} : row)
    }
    const fresh = await getSalesInsights(execId); setItems(fresh); setSaving(false)
  }

  return (
    <div>
      <SectionHeader title="Sales Insights" onSave={saveAll} saving={saving}/>
      {items.map(item => (
        <ItemCard key={item.id} onDelete={()=>remove(item)} isNew={!!item._new}>
          <FieldRow label="Do:"><FieldInput value={item.dos||''} onChange={v=>update(item.id,'dos',v)} placeholder="Enter do's (one per line)" multiline/></FieldRow>
          <FieldRow label="Don'ts:"><FieldInput value={item.donts||''} onChange={v=>update(item.id,'donts',v)} placeholder="Enter don'ts (one per line)" multiline/></FieldRow>
          <FieldRow label="Scenario:"><FieldInput value={item.scenario||''} onChange={v=>update(item.id,'scenario',v)} placeholder="e.g. During A Call Or A Meeting"/></FieldRow>
        </ItemCard>
      ))}
      <AddFieldBtn onClick={add}/>
    </div>
  )
}

// ─── CONFERENCE INTELLIGENCE ────────────────────────────────────────────────
// Summary block (editable) + Conferences list (Name, occurrences, expandable sub-fields)
function ConferenceIntelligence({ exec, execId }: { exec:any; execId:string }) {
  const [summary, setSummary] = useState('')
  const [conferences, setConferences] = useState<any[]>([])
  const [expanded, setExpanded] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getConferenceSummary(execId).then(r => { if(r) setSummary(r.summary||'') })
    getConferences(execId).then(db => {
      if (db.length > 0) { setConferences(db); return }
      const seed = (exec.conferenceIntelligence||[]).map((c:string,i:number) => ({
        id:'seed_'+i, exec_id:execId, name:c, occurrences:1, role:'Unknown', year:'', evidence:'', source_url:'', major_topics:'', _seed:true
      }))
      setConferences(seed)
    })
  }, [execId])

  const addConf = () => setConferences(p => [...p, { id:'new_'+Date.now(), exec_id:execId, name:'', occurrences:1, role:'', year:'', evidence:'', source_url:'', major_topics:'', _new:true }])
  const updateConf = (id:string, f:string, v:any) => setConferences(p => p.map(c => c.id===id ? {...c,[f]:v} : c))
  const removeConf = async (item:any) => {
    if (!item._new && !item._seed) await deleteConference(execId, item.id)
    setConferences(p => p.filter(c => c.id!==item.id))
  }

  const saveAll = async () => {
    setSaving(true)
    await saveConferenceSummary({ exec_id:execId, summary })
    for (const c of conferences) {
      const { _new, _seed, ...row } = c
      await upsertConference((_new||_seed) ? {...row,id:undefined} : row)
    }
    const fresh = await getConferences(execId); setConferences(fresh); setSaving(false)
  }

  return (
    <div>
      <SectionHeader title="Conference Intelligence" onSave={saveAll} saving={saving}/>
      {/* Summary block */}
      <div style={{ border:'1px solid var(--border)', borderRadius:8, marginBottom:20, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'var(--bg-raised)', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontSize:14, fontWeight:700, color:'var(--navy)' }}>Summary</span>
          <button onClick={async()=>{await saveConferenceSummary({exec_id:execId,summary})}} style={{ fontSize:12, fontWeight:700, color:'var(--navy)', background:'transparent', border:'1px solid var(--border)', borderRadius:6, padding:'4px 12px', cursor:'pointer' }}>Save</button>
        </div>
        <div style={{ padding:'12px 16px' }}>
          <textarea value={summary} onChange={e=>setSummary(e.target.value)} rows={8}
            style={{ width:'100%', border:'none', outline:'none', background:'transparent', fontSize:13.5, color:'var(--text-1)', lineHeight:1.75, fontFamily:'Source Sans 3,sans-serif', resize:'vertical', boxSizing:'border-box' }}
            placeholder="Enter conference intelligence summary..."/>
        </div>
      </div>

      {/* Conferences list */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <span style={{ fontSize:15, fontWeight:700, color:'var(--navy)' }}>Conferences</span>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={saveAll} style={{ fontSize:12, fontWeight:700, color:'var(--navy)', background:'transparent', border:'1px solid var(--border)', borderRadius:6, padding:'4px 12px', cursor:'pointer' }}>Save</button>
          <button onClick={addConf} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:700, color:'var(--navy)', background:'transparent', border:'1px solid var(--navy)', borderRadius:6, padding:'4px 12px', cursor:'pointer' }}>
            <Plus size={11}/> Add new conference
          </button>
        </div>
      </div>

      {conferences.map(conf => (
        <div key={conf.id} style={{ border:'1px solid var(--border)', borderRadius:8, marginBottom:6, background:'var(--bg-surface)', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', padding:'10px 14px', cursor:'pointer' }}
            onClick={()=>setExpanded(expanded===conf.id ? null : conf.id)}>
            {expanded===conf.id
              ? <input value={conf.name||''} onChange={e=>updateConf(conf.id,'name',e.target.value)} onClick={e=>e.stopPropagation()}
                  style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:14, fontWeight:600, color:'var(--navy)', fontFamily:'Source Sans 3,sans-serif' }}
                  placeholder="Conference name"/>
              : <span style={{ flex:1, fontSize:14, fontWeight:500, color:'var(--text-1)' }}>{conf.name||'New Conference'}</span>
            }
            <span style={{ fontSize:12, color:'var(--text-3)', marginRight:12 }}>{conf.occurrences||1} occurrence{(conf.occurrences||1)>1?'s':''}</span>
            <button onClick={e=>{e.stopPropagation();removeConf(conf)}} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--red)', marginRight:6 }}><X size={13}/></button>
            <ChevronDown size={14} style={{ color:'var(--text-3)', transform:expanded===conf.id?'rotate(180deg)':'none', transition:'transform 200ms' }}/>
          </div>
          {expanded===conf.id && (
            <div style={{ borderTop:'1px solid var(--border)' }}>
              <FieldRow label="Occurrences"><input type="number" value={conf.occurrences||1} onChange={e=>updateConf(conf.id,'occurrences',parseInt(e.target.value)||1)} style={{ padding:'6px 0', border:'none', outline:'none', background:'transparent', fontSize:14, fontFamily:'Source Sans 3,sans-serif', width:'80px' }}/></FieldRow>
              <FieldRow label="Role"><FieldInput value={conf.role||''} onChange={v=>updateConf(conf.id,'role',v)} placeholder="Role"/></FieldRow>
              <FieldRow label="Year"><FieldInput value={conf.year||''} onChange={v=>updateConf(conf.id,'year',v)} placeholder="Year"/></FieldRow>
              <FieldRow label="Evidence"><FieldInput value={conf.evidence||''} onChange={v=>updateConf(conf.id,'evidence',v)} placeholder="Evidence" multiline/></FieldRow>
              <FieldRow label="Source Url"><FieldInput value={conf.source_url||''} onChange={v=>updateConf(conf.id,'source_url',v)} placeholder="Source URL"/></FieldRow>
              <FieldRow label="Major Topics"><FieldInput value={conf.major_topics||''} onChange={v=>updateConf(conf.id,'major_topics',v)} placeholder="Major topics"/></FieldRow>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── GAME TIME TAGS ────────────────────────────────────────────────────────
// Each item: Name + Type + Position + Source URL + Start Date + Description + Org Represented
function GameTimeTags({ execId }: { execId:string }) {
  const [items, setItems] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { getGameTimeTags(execId).then(setItems) }, [execId])

  const add = () => setItems(p => [...p, { id:'new_'+Date.now(), exec_id:execId, name:'', type:'', position:'', source_url:'', start_date:'', description:'', org_represented:'', _new:true }])
  const update = (id:string, f:string, v:string) => setItems(p => p.map(i => i.id===id ? {...i,[f]:v} : i))
  const remove = async (item:any) => {
    if (!item._new) await deleteGameTimeTag(execId, item.id)
    setItems(p => p.filter(i => i.id!==item.id))
  }
  const saveAll = async () => {
    setSaving(true)
    for (const item of items) {
      const { _new, ...row } = item
      await upsertGameTimeTag(_new ? {...row,id:undefined} : row)
    }
    const fresh = await getGameTimeTags(execId); setItems(fresh); setSaving(false)
  }

  return (
    <div>
      <SectionHeader title="Game Time Tags" onSave={saveAll} saving={saving}/>
      {items.map(item => (
        <ItemCard key={item.id} onDelete={()=>remove(item)} isNew={!!item._new}>
          <FieldRow label="Name"><FieldInput value={item.name||''} onChange={v=>update(item.id,'name',v)} placeholder="Enter Name"/></FieldRow>
          <FieldRow label="Type"><FieldInput value={item.type||''} onChange={v=>update(item.id,'type',v)} placeholder="e.g. Industry Leadership"/></FieldRow>
          <FieldRow label="Position"><FieldInput value={item.position||''} onChange={v=>update(item.id,'position',v)} placeholder="Position"/></FieldRow>
          <FieldRow label="Source Url"><FieldInput value={item.source_url||''} onChange={v=>update(item.id,'source_url',v)} placeholder="Enter Source Url"/></FieldRow>
          <FieldRow label="Start Date"><FieldInput value={item.start_date||''} onChange={v=>update(item.id,'start_date',v)} placeholder="Start Date"/></FieldRow>
          <FieldRow label="Description"><FieldInput value={item.description||''} onChange={v=>update(item.id,'description',v)} placeholder="Enter Description" multiline/></FieldRow>
          <FieldRow label="Organization Represented"><FieldInput value={item.org_represented||''} onChange={v=>update(item.id,'org_represented',v)} placeholder="Organization Represented"/></FieldRow>
        </ItemCard>
      ))}
      <AddFieldBtn onClick={add}/>
    </div>
  )
}

// ─── MEMBERSHIPS AND AFFILIATIONS ──────────────────────────────────────────
// Same structure as Game Time Tags
function MembershipsAffiliations({ exec, execId }: { exec:any; execId:string }) {
  const [items, setItems] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getMemberships(execId).then(db => {
      if (db.length > 0) { setItems(db); return }
      // seed from static publications if available
    })
  }, [execId])

  const add = () => setItems(p => [...p, { id:'new_'+Date.now(), exec_id:execId, name:'', type:'', position:'', source_url:'', start_date:'', description:'', org_represented:'', _new:true }])
  const update = (id:string, f:string, v:string) => setItems(p => p.map(i => i.id===id ? {...i,[f]:v} : i))
  const remove = async (item:any) => {
    if (!item._new) await deleteMembership(execId, item.id)
    setItems(p => p.filter(i => i.id!==item.id))
  }
  const saveAll = async () => {
    setSaving(true)
    for (const item of items) {
      const { _new, ...row } = item
      await upsertMembership(_new ? {...row,id:undefined} : row)
    }
    const fresh = await getMemberships(execId); setItems(fresh); setSaving(false)
  }

  return (
    <div>
      <SectionHeader title="Memberships And Affiliations" onSave={saveAll} saving={saving}/>
      {items.map(item => (
        <ItemCard key={item.id} onDelete={()=>remove(item)} isNew={!!item._new}>
          <FieldRow label="Name"><FieldInput value={item.name||''} onChange={v=>update(item.id,'name',v)} placeholder="Enter Name"/></FieldRow>
          <FieldRow label="Type"><FieldInput value={item.type||''} onChange={v=>update(item.id,'type',v)} placeholder="e.g. Academic Affiliation"/></FieldRow>
          <FieldRow label="Position"><FieldInput value={item.position||''} onChange={v=>update(item.id,'position',v)} placeholder="Position"/></FieldRow>
          <FieldRow label="Source Url"><FieldInput value={item.source_url||''} onChange={v=>update(item.id,'source_url',v)} placeholder="Enter Source Url"/></FieldRow>
          <FieldRow label="Start Date"><FieldInput value={item.start_date||''} onChange={v=>update(item.id,'start_date',v)} placeholder="Start Date"/></FieldRow>
          <FieldRow label="Description"><FieldInput value={item.description||''} onChange={v=>update(item.id,'description',v)} placeholder="Enter Description" multiline/></FieldRow>
          <FieldRow label="Organization Represented"><FieldInput value={item.org_represented||''} onChange={v=>update(item.id,'org_represented',v)} placeholder="Organization Represented"/></FieldRow>
        </ItemCard>
      ))}
      <AddFieldBtn onClick={add}/>
      {/* Publications sub-section */}
      {exec.publications && exec.publications.length > 0 && (
        <div style={{ marginTop:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Publications</div>
          {exec.publications.map((p:any,i:number) => (
            <div key={i} style={{ padding:'12px 16px', background:'var(--bg-raised)', borderRadius:8, border:'1px solid var(--border)', marginBottom:6 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text-1)', marginBottom:2 }}>{p.title}</div>
              <div style={{ fontSize:13, color:'var(--navy)', fontWeight:600 }}>{p.journal} · {p.year}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AWARDS AND RECOGNITIONS ────────────────────────────────────────────────
// Each item: Name + Year + Organization + Description + Source URL
function AwardsRecognitions({ exec, execId }: { exec:any; execId:string }) {
  const [items, setItems] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAwards(execId).then(db => {
      if (db.length > 0) { setItems(db); return }
      const seed = (exec.awards||[]).map((a:any,i:number) => ({
        id:'seed_'+i, exec_id:execId, name:a.name||'', year:'', organization:a.org||'', description:'', source_url:'', _seed:true
      }))
      setItems(seed)
    })
  }, [execId])

  const add = () => setItems(p => [...p, { id:'new_'+Date.now(), exec_id:execId, name:'', year:'', organization:'', description:'', source_url:'', _new:true }])
  const update = (id:string, f:string, v:string) => setItems(p => p.map(i => i.id===id ? {...i,[f]:v} : i))
  const remove = async (item:any) => {
    if (!item._new && !item._seed) await deleteAward(execId, item.id)
    setItems(p => p.filter(i => i.id!==item.id))
  }
  const saveAll = async () => {
    setSaving(true)
    for (const item of items) {
      const { _new, _seed, ...row } = item
      await upsertAward((_new||_seed) ? {...row,id:undefined} : row)
    }
    const fresh = await getAwards(execId); setItems(fresh); setSaving(false)
  }

  return (
    <div>
      <SectionHeader title="Awards And Recognitions" onSave={saveAll} saving={saving}/>
      {items.map(item => (
        <ItemCard key={item.id} onDelete={()=>remove(item)} isNew={!!item._new}>
          <FieldRow label="Name"><FieldInput value={item.name||''} onChange={v=>update(item.id,'name',v)} placeholder="Enter Name"/></FieldRow>
          <FieldRow label="Year"><FieldInput value={item.year||''} onChange={v=>update(item.id,'year',v)} placeholder="Enter Year"/></FieldRow>
          <FieldRow label="Organization"><FieldInput value={item.organization||''} onChange={v=>update(item.id,'organization',v)} placeholder="Enter Organization"/></FieldRow>
          <FieldRow label="Description"><FieldInput value={item.description||''} onChange={v=>update(item.id,'description',v)} placeholder="Enter Description" multiline/></FieldRow>
          <FieldRow label="Source Url"><FieldInput value={item.source_url||''} onChange={v=>update(item.id,'source_url',v)} placeholder="Enter Source Url"/></FieldRow>
        </ItemCard>
      ))}
      <AddFieldBtn onClick={add}/>
    </div>
  )
}

// ─── NOTES ─────────────────────────────────────────────────────────────────
// Note Header + Note Content + Version (auto) + Updated By. Add note link.
function NotesSection({ execId }: { execId:string }) {
  const [header, setHeader] = useState('')
  const [content, setContent] = useState('')
  const [editId, setEditId] = useState<string|null>(null)
  const [notes, setNotes] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { getNotes(execId).then(setNotes) }, [execId])

  const save = async () => {
    if (!header.trim() && !content.trim()) return
    setSaving(true)
    const saved = await upsertNote({ exec_id:execId, note_header:header, note_content:content, id:editId||undefined, updated_by:'Ritesh Dogra' })
    setNotes(p => editId ? p.map(n=>n.id===editId?saved:n) : [saved,...p])
    setHeader(''); setContent(''); setEditId(null); setSaving(false)
  }
  const del = async (id:string) => { await deleteNote(execId,id); setNotes(p=>p.filter(n=>n.id!==id)) }
  const edit = (n:any) => { setEditId(n.id); setHeader(n.note_header||''); setContent(n.note_content||'') }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <button onClick={save} disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, border:'none', background:'var(--navy)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'Source Sans 3,sans-serif' }}>
          <Save size={13}/> {saving?'Saving…':'Save Note'}
        </button>
        {editId && <button onClick={()=>{setEditId(null);setHeader('');setContent('')}} style={{ fontSize:12, color:'var(--text-3)', background:'transparent', border:'none', cursor:'pointer' }}>Cancel edit</button>}
      </div>
      <div style={{ border:'1px solid var(--border)', borderRadius:8, marginBottom:16, background:'var(--bg-surface)' }}>
        <FieldRow label="Note Header:"><FieldInput value={header} onChange={setHeader} placeholder="Note header"/></FieldRow>
        <FieldRow label="Note Content:"><FieldInput value={content} onChange={setContent} placeholder="Note content" multiline/></FieldRow>
        <div style={{ padding:'8px 16px', borderTop:'1px solid var(--border)' }}>
          <span style={{ fontSize:13, color:'var(--text-3)' }}>Version: <strong>{notes.length + 1}</strong></span>
        </div>
      </div>
      <button onClick={()=>{setEditId(null);setHeader('');setContent('')}} style={{ fontSize:13, color:'var(--navy)', background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:5, marginBottom:16 }}>
        <Plus size={13}/> Add note
      </button>
      {notes.map(note => (
        <div key={note.id} style={{ padding:'14px 16px', background:'var(--bg-raised)', borderRadius:8, border:'1px solid var(--border)', marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ flex:1 }}>
              <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:'4px 12px', fontSize:13.5 }}>
                <span style={{ color:'var(--text-3)', fontWeight:600 }}>Note Header:</span><span style={{ color:'var(--text-1)', fontWeight:600 }}>{note.note_header}</span>
                <span style={{ color:'var(--text-3)', fontWeight:600 }}>Note Content:</span><span style={{ color:'var(--text-1)' }}>{note.note_content}</span>
                <span style={{ color:'var(--text-3)', fontWeight:600 }}>Version:</span><span style={{ color:'var(--navy)', fontWeight:700 }}>v{note.version||1}</span>
                <span style={{ color:'var(--text-3)', fontWeight:600 }}>Updated By:</span><span style={{ color:'var(--text-2)' }}>{note.updated_by||'system'}</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={()=>edit(note)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', padding:4 }}><Edit2 size={13}/></button>
              <button onClick={()=>del(note.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)', padding:4 }}><Trash2 size={13}/></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── FREYR SELLING POINT ─────────────────────────────────────────────────
// Department field + content text
function FreyrSellingPoint({ exec, execId }: { exec:any; execId:string }) {
  const [dept, setDept] = useState('')
  const [content, setContent] = useState(exec.summary?.freyrSellingPoint||'')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSellingPoint(execId).then(r => {
      if (r) { setDept(r.department||''); setContent(r.content||exec.summary?.freyrSellingPoint||'') }
    })
  }, [execId])

  const save = async () => {
    setSaving(true)
    await saveSellingPoint({ exec_id:execId, department:dept, content })
    setSaving(false)
  }

  return (
    <div>
      <SectionHeader title="Freyr Selling Point" onSave={save} saving={saving}/>
      <div style={{ border:'1px solid var(--border)', borderRadius:8, background:'var(--bg-surface)' }}>
        <FieldRow label="Department">
          <FieldInput value={dept} onChange={setDept} placeholder="e.g. EMS"/>
        </FieldRow>
        <FieldRow label="Selling Point">
          <FieldInput value={content} onChange={setContent} placeholder="Enter Freyr selling point..." multiline/>
        </FieldRow>
      </div>
    </div>
  )
}

// ─── ACTION PLAN ───────────────────────────────────────────────────────────
// List of action items
function ActionPlan({ exec, execId }: { exec:any; execId:string }) {
  const [items, setItems] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getActionPlan(execId).then(db => {
      if (db.length > 0) { setItems(db); return }
      const seed = (exec.actionPlan||[]).map((a:string,i:number) => ({
        id:'seed_'+i, exec_id:execId, content:a, sort_order:i, _seed:true
      }))
      setItems(seed)
    })
  }, [execId])

  const add = () => setItems(p => [...p, { id:'new_'+Date.now(), exec_id:execId, content:'', sort_order:p.length, _new:true }])
  const update = (id:string, v:string) => setItems(p => p.map(i => i.id===id ? {...i,content:v} : i))
  const remove = async (item:any) => {
    if (!item._new && !item._seed) await deleteActionItem(execId, item.id)
    setItems(p => p.filter(i => i.id!==item.id))
  }
  const saveAll = async () => {
    setSaving(true)
    for (const item of items) {
      const { _new, _seed, ...row } = item
      await upsertActionItem((_new||_seed) ? {...row,id:undefined} : row)
    }
    const fresh = await getActionPlan(execId); setItems(fresh); setSaving(false)
  }

  return (
    <div>
      <SectionHeader title="Action Plan" onSave={saveAll} saving={saving}/>
      {items.map(item => (
        <ItemCard key={item.id} onDelete={()=>remove(item)} isNew={!!item._new}>
          <FieldRow label="Action">
            <FieldInput value={item.content||''} onChange={v=>update(item.id,v)} placeholder="Enter action item..." multiline/>
          </FieldRow>
        </ItemCard>
      ))}
      <AddFieldBtn onClick={add} label="Add Action"/>
    </div>
  )
}

// ─── RELATIONSHIP SCORE ────────────────────────────────────────────────────
// Current + dropdown (Hot/Warm/Cold/Friends of Freyr) + Reason + history
function RelationshipScore({ exec, execId }: { exec:any; execId:string }) {
  const [score, setScore] = useState('Cold')
  const [reason, setReason] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { getRelScores(execId).then(h => { setHistory(h); if(h[0]) setScore(h[0].score) }) }, [execId])

  const SCORES = [
    { label:'Hot', color:'#ef4444', bg:'rgba(239,68,68,0.1)' },
    { label:'Warm', color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
    { label:'Cold', color:'#3b82f6', bg:'rgba(59,130,246,0.1)' },
    { label:'Friends of Freyr', color:'#10b981', bg:'rgba(16,185,129,0.1)' },
  ]

  const save = async () => {
    setSaving(true)
    const r = await addRelScore({ exec_id:execId, score, reason })
    setHistory(p => [r,...p]); setReason(''); setSaving(false)
  }

  const currentScore = SCORES.find(s=>s.label===score)||SCORES[2]

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:18, color:'var(--navy)', margin:0 }}>Relationship score</h3>
        <button onClick={save} disabled={saving} style={{ padding:'7px 16px', borderRadius:8, border:'none', background:'var(--navy)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'Source Sans 3,sans-serif' }}>
          {saving?'Saving…':'Save'}
        </button>
      </div>
      <div style={{ padding:'14px 16px', background:'var(--bg-raised)', borderRadius:8, border:'1px solid var(--border)', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <span style={{ fontSize:13, color:'var(--text-3)', fontWeight:600 }}>Current:</span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:currentScore.bg, color:currentScore.color, fontSize:12, fontWeight:700 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:currentScore.color }}/>{score.toUpperCase()}
          </span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:'0 16px', alignItems:'center', marginBottom:12 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text-3)' }}>Relationship Score:</span>
          <select value={score} onChange={e=>setScore(e.target.value)}
            style={{ padding:'8px 12px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-surface)', fontSize:14, fontFamily:'Source Sans 3,sans-serif', color:'var(--text-1)', cursor:'pointer' }}>
            {SCORES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
          </select>
        </div>
        {/* Score buttons */}
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          {SCORES.map(s => (
            <button key={s.label} onClick={()=>setScore(s.label)}
              style={{ padding:'5px 14px', borderRadius:20, border:`1px solid ${score===s.label?s.color:s.color+'40'}`, background:score===s.label?s.bg:'transparent', color:s.color, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Source Sans 3,sans-serif' }}>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:'0 16px', alignItems:'start' }}>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text-3)', paddingTop:10 }}>Reason:</span>
          <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Add reason"
            rows={3} style={{ padding:'8px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg-surface)', fontSize:14, fontFamily:'Source Sans 3,sans-serif', resize:'vertical', outline:'none', width:'100%', boxSizing:'border-box' }}/>
        </div>
      </div>

      {/* History */}
      {history.map((h,i) => {
        const sc = SCORES.find(s=>s.label===h.score)||SCORES[2]
        const date = h.recorded_at ? new Date(h.recorded_at).toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—'
        return (
          <div key={h.id||i} style={{ padding:'12px 16px', background:'var(--bg-raised)', borderRadius:8, border:'1px solid var(--border)', marginBottom:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'2px 10px', borderRadius:20, background:sc.bg, color:sc.color, fontSize:11.5, fontWeight:700 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:sc.color }}/>{h.score}
              </span>
              <div style={{ flex:1, height:6, borderRadius:3, background:sc.color, opacity:0.6 }}/>
              <span style={{ fontSize:11, color:'var(--text-3)', whiteSpace:'nowrap' }}>{date}</span>
            </div>
            {h.reason && <div style={{ fontSize:13, color:'var(--text-3)' }}>Reason: {h.reason}</div>}
          </div>
        )
      })}

      {history.length > 0 && (
        <div style={{ padding:'12px 16px', background:'var(--bg-raised)', borderRadius:8, border:'1px solid var(--border)', marginTop:8 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text-2)', marginBottom:10 }}>Relationship score history</div>
          {history.map((h,i) => {
            const sc = SCORES.find(s=>s.label===h.score)||SCORES[2]
            const date = h.recorded_at ? new Date(h.recorded_at).toLocaleDateString('en-GB') : '—'
            return (
              <div key={h.id||i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 10px', borderRadius:20, background:sc.bg, color:sc.color, fontSize:11, fontWeight:700, minWidth:50 }}>
                  <span style={{ width:5,height:5,borderRadius:'50%',background:sc.color }}/>{h.score}
                </span>
                <div style={{ flex:1, height:6, borderRadius:3, background:`linear-gradient(90deg, ${sc.color}, ${sc.color}80)` }}/>
                <span style={{ fontSize:11, color:'var(--text-3)', whiteSpace:'nowrap' }}>{date}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── TASKS ─────────────────────────────────────────────────────────────────
function TasksSection({ execId }: { execId:string }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getTasks(execId).then(t => { setTasks(t); setLoading(false) }) }, [execId])

  const handleSave = async (form:any) => {
    const saved = await upsertTask({ ...form, exec_id:execId })
    setTasks(p => [saved,...p.filter(t=>t.id!==saved.id)])
    setShowModal(false)
  }
  const handleDel = async (id:string) => { await deleteTask(execId,id); setTasks(p=>p.filter(t=>t.id!==id)) }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
        <button onClick={()=>setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, border:'none', background:'var(--navy)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'Source Sans 3,sans-serif' }}>
          <Plus size={13}/> New Task
        </button>
      </div>
      {loading && <div style={{ color:'var(--text-3)', fontSize:13 }}>Loading...</div>}
      {!loading && tasks.length===0 && <div style={{ textAlign:'center', color:'var(--text-3)', padding:'24px 0', fontSize:14 }}>No tasks yet.</div>}
      {tasks.map(task => (
        <div key={task.id} style={{ border:'1px solid var(--border)', borderRadius:8, padding:'12px 16px', background:'var(--bg-raised)', marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', gap:10 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text-1)', marginBottom:5 }}>{task.task_action}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {task.business_unit && <span style={{ padding:'1px 8px', borderRadius:20, background:'rgba(27,54,93,0.08)', color:'var(--navy)', fontSize:11, fontWeight:600 }}>{task.business_unit}</span>}
                {task.priority && <span style={{ padding:'1px 8px', borderRadius:20, background:'rgba(217,119,6,0.1)', color:'#d97706', fontSize:11, fontWeight:600 }}>{task.priority}</span>}
                {task.due_date && <span style={{ padding:'1px 8px', borderRadius:20, border:'1px solid var(--border)', color:'var(--text-3)', fontSize:11, fontWeight:600 }}>📅 {task.due_date}</span>}
                <span style={{ padding:'1px 8px', borderRadius:20, border:'1px solid var(--border)', background:task.status==='Completed'?'rgba(16,185,129,0.1)':'transparent', color:task.status==='Completed'?'#10b981':'var(--text-3)', fontSize:11, fontWeight:600 }}>{task.status}</span>
              </div>
            </div>
            <button onClick={()=>handleDel(task.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', padding:4 }}><Trash2 size={13}/></button>
          </div>
        </div>
      ))}
      {showModal && <TaskModal execId={execId} onSave={handleSave} onClose={()=>setShowModal(false)}/>}
    </div>
  )
}

// ─── TASK MODAL ────────────────────────────────────────────────────────────
function TaskModal({ execId, onSave, onClose }: { execId:string; onSave:(t:any)=>void; onClose:()=>void }) {
  const [tab, setTab] = useState<'manual'|'meetings'>('manual')
  const [form, setForm] = useState<any>({ status:'To be started', business_unit:'ECS', priority:'Medium', tab_type:'manual' })
  const set = (k:string,v:string) => setForm((f:any)=>({...f,[k]:v}))

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20 }}>
      <div style={{ background:'var(--bg-surface)', borderRadius:16, padding:28, width:660, maxWidth:'94vw', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
          <span style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color:'var(--navy)' }}>New task</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)' }}><X size={18}/></button>
        </div>
        <p style={{ fontSize:12.5, color:'var(--text-3)', marginBottom:18, fontWeight:600 }}>Owner: Ritesh Dogra</p>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <span style={{ fontSize:13.5, color:'var(--text-2)', fontWeight:600 }}>How would you like to add tasks?</span>
          <div style={{ display:'flex', borderRadius:8, overflow:'hidden', border:'1.5px solid var(--border)' }}>
            {(['manual','meetings'] as const).map(t => (
              <button key={t} onClick={()=>{setTab(t);set('tab_type',t)}} style={{ padding:'6px 18px', background:tab===t?'var(--navy)':'transparent', color:tab===t?'#fff':'var(--text-2)', border:'none', cursor:'pointer', fontSize:13, fontWeight:tab===t?700:500, fontFamily:'Source Sans 3,sans-serif', transition:'all 180ms', textTransform:'capitalize' }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gap:12 }}>
          {[
            { label:'Status', key:'status', type:'select', opts:['To be started','In Progress','Completed','On Hold'] },
            { label:'Source of Action Plan *', key:'source', type:'select', opts:['Select','Executive Profile','Account Plan','Meeting Notes'] },
            { label:'Business Unit *', key:'business_unit', type:'select', opts:['Select','ECS','EMS','Cult','Clinical','Consulting'] },
            { label:'Due Date (Optional)', key:'due_date', type:'date' },
            ...(tab==='meetings' ? [
              { label:'Meeting Link (Optional)', key:'meeting_link', type:'text', placeholder:'https://teams.microsoft.com/meet' },
              { label:'Meeting Notes', key:'meeting_notes', type:'textarea', placeholder:'' },
            ] : []),
            { label:'Task/Action *', key:'task_action', type:'textarea', placeholder:'' },
            { label:'Priority *', key:'priority', type:'select', opts:['Select','High','Medium','Low'] },
            { label:'Assigned To', key:'assigned_to', type:'text', placeholder:'Search people (recent shown first)' },
            { label:'Additional People Tagged (Optional)', key:'additional_people_tagged', type:'text', placeholder:'Search and add people' },
          ].map((f:any) => (
            <div key={f.key} style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:12, alignItems:'start' }}>
              <label style={{ fontSize:13.5, color:'var(--text-2)', paddingTop:10, fontWeight:600 }}>{f.label}</label>
              {f.type==='select' ? (
                <select className="select" value={form[f.key]||''} onChange={e=>set(f.key,e.target.value)}>
                  {(f.opts||[]).map((o:string) => <option key={o}>{o}</option>)}
                </select>
              ) : f.type==='textarea' ? (
                <textarea className="input" rows={3} style={{ resize:'vertical', fontFamily:'Source Sans 3,sans-serif', fontSize:14 }} value={form[f.key]||''} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder}/>
              ) : (
                <input className="input" type={f.type==='date'?'date':'text'} placeholder={f.placeholder||''} value={form[f.key]||''} onChange={e=>set(f.key,e.target.value)}/>
              )}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:20, paddingTop:16, borderTop:'1px solid var(--border)' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', cursor:'pointer', fontSize:13, fontFamily:'Source Sans 3,sans-serif' }}>Cancel</button>
          <button onClick={()=>onSave(form)} style={{ padding:'8px 18px', borderRadius:8, border:'none', background:'var(--navy)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'Source Sans 3,sans-serif', display:'flex', alignItems:'center', gap:6 }}>
            <Check size={13}/> Save Task
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SECTION ROUTER ────────────────────────────────────────────────────────
function SectionContent({ cat, exec, execId }: { cat:string; exec:any; execId:string }) {
  if (cat==='One Minute Summary')          return <OneMinuteSummary exec={exec} execId={execId}/>
  if (cat==='Interests And Hobbies')       return <InterestsHobbies execId={execId}/>
  if (cat==='Company Role')                return <CompanyRoleSection execId={execId}/>
  if (cat==='Media Appearances')           return <MediaAppearances execId={execId}/>
  if (cat==='Social Activity')             return <SocialActivity execId={execId}/>
  if (cat==='Key Traits')                  return <KeyTraits exec={exec} execId={execId}/>
  if (cat==='Sales Insights')              return <SalesInsights exec={exec} execId={execId}/>
  if (cat==='Conference Intelligence')     return <ConferenceIntelligence exec={exec} execId={execId}/>
  if (cat==='Game Time Tags')              return <GameTimeTags execId={execId}/>
  if (cat==='Memberships And Affiliations')return <MembershipsAffiliations exec={exec} execId={execId}/>
  if (cat==='Awards And Recognitions')     return <AwardsRecognitions exec={exec} execId={execId}/>
  if (cat==='Notes')                       return <NotesSection execId={execId}/>
  if (cat==='Freyr Selling Point')      return <FreyrSellingPoint exec={exec} execId={execId}/>
  if (cat==='Action Plan')                 return <ActionPlan exec={exec} execId={execId}/>
  if (cat==='Relationship Score')          return <RelationshipScore exec={exec} execId={execId}/>
  if (cat==='Tasks')                       return <TasksSection execId={execId}/>
  if (cat==='Download Profile Link')       return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, alignItems:'flex-start' }}>
      <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:18, color:'var(--navy)', margin:0 }}>Download Profile</h3>
      <p style={{ fontSize:14, color:'var(--text-2)', lineHeight:1.7, margin:0 }}>
        Downloads a complete formatted executive profile as an HTML file — open in any browser and use <strong>Print → Save as PDF</strong> to get a PDF copy. Contains all sections: One Minute Summary, Company Role, Key Traits, Sales Insights, Conference Intelligence, Interests, Awards, Freyr Selling Point, Action Plan, Work History, Education, and Publications.
      </p>
      <button onClick={()=>downloadExecProfile(exec)} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:10, border:'none', background:'var(--navy)', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:700, fontFamily:'Source Sans 3,sans-serif' }}>
        <ExternalLink size={15}/> Download Full Profile
      </button>
    </div>
  )
  return null
}

// ─── EXEC PROFILE HTML GENERATOR ───────────────────────────────────────────
function generateExecProfileHtml(exec: any): string {
  const esc = (s: any) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const navy = '#1B365D'
  const gold = '#D4AF37'

  const section = (title: string, content: string) => content ? `
    <div class="section">
      <div class="section-title">${esc(title)}</div>
      ${content}
    </div>` : ''

  const field = (label: string, value: string) => value ? `
    <div class="field">
      <div class="field-label">${esc(label)}</div>
      <div class="field-value">${esc(value)}</div>
    </div>` : ''

  const s = exec.summary || {}

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(exec.name)} — Executive Profile</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',system-ui,sans-serif; font-size:14px; color:#1a2a3a; background:#f4f6fa; }
  .page { max-width:900px; margin:0 auto; padding:40px 32px; background:#fff; min-height:100vh; }
  .header { display:flex; align-items:center; gap:22px; padding:28px 32px; background:${navy}; border-radius:16px; margin-bottom:32px; }
  .avatar { width:72px; height:72px; border-radius:50%; background:${gold}; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:800; color:#fff; flex-shrink:0; }
  .header-info { flex:1; }
  .header-name { font-size:26px; font-weight:800; color:#fff; margin-bottom:4px; }
  .header-title { font-size:14px; color:rgba(255,255,255,0.8); margin-bottom:2px; }
  .header-company { font-size:13px; color:${gold}; font-weight:600; }
  .header-meta { display:flex; gap:16px; margin-top:10px; flex-wrap:wrap; }
  .meta-chip { font-size:12px; color:rgba(255,255,255,0.7); display:flex; align-items:center; gap:4px; }
  .section { margin-bottom:28px; }
  .section-title { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; color:${gold}; margin-bottom:14px; padding-bottom:8px; border-bottom:2px solid #e8edf5; }
  .field { margin-bottom:16px; }
  .field-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#5a7499; margin-bottom:5px; }
  .field-value { font-size:14px; color:#1B365D; line-height:1.75; white-space:pre-wrap; }
  .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .card { background:#f4f6fa; border-radius:10px; padding:16px; border:1px solid #e0e8f0; }
  .card-title { font-size:13px; font-weight:700; color:${navy}; margin-bottom:6px; }
  .card-body { font-size:13px; color:#4a6080; line-height:1.65; }
  .tag { display:inline-block; padding:3px 10px; border-radius:20px; background:#e8edf5; color:${navy}; font-size:11px; font-weight:600; margin:3px 3px 3px 0; }
  .action-item { padding:10px 14px; background:#f4f6fa; border-left:3px solid ${gold}; border-radius:0 8px 8px 0; margin-bottom:8px; font-size:13px; color:${navy}; line-height:1.6; }
  .work-item { margin-bottom:12px; }
  .work-company { font-size:13px; font-weight:700; color:${navy}; }
  .work-role { font-size:13px; color:#4a6080; }
  .work-period { font-size:12px; color:#8a9baf; }
  .award-item { padding:12px 16px; background:#f4f6fa; border-radius:8px; margin-bottom:8px; }
  .award-name { font-size:13px; font-weight:700; color:${navy}; }
  .award-org { font-size:12px; color:#5a7499; margin-top:2px; }
  .award-desc { font-size:12.5px; color:#4a6080; margin-top:6px; line-height:1.6; }
  .footer { text-align:center; padding:24px; color:#8a9baf; font-size:12px; border-top:1px solid #e0e8f0; margin-top:32px; }
  @media print {
    body { background:#fff; }
    .page { padding:20px; }
    .header { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="avatar">${esc(exec.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2))}</div>
    <div class="header-info">
      <div class="header-name">${esc(exec.name)}</div>
      <div class="header-title">${esc(exec.title)}</div>
      <div class="header-company">${esc(exec.company)}</div>
      <div class="header-meta">
        ${exec.tenure ? `<span class="meta-chip">📅 ${esc(exec.tenure)}</span>` : ''}
        ${exec.location ? `<span class="meta-chip">📍 ${esc(exec.location)}</span>` : ''}
        ${exec.linkedIn ? `<span class="meta-chip">🔗 ${esc(exec.linkedIn)}</span>` : ''}
        <span class="meta-chip">🔵 ${esc(exec.status?.toUpperCase())}</span>
      </div>
    </div>
  </div>

  <!-- One Minute Summary -->
  ${section('One Minute Summary', [
    field('Current Role', s.currentRole),
    field('Personality Type', s.personalityType),
    field('Top Priorities', s.topPriorities),
    field('Dos When Engaging', s.dosWhenEngaging),
    s.dontsWhenEngaging ? field("Don'ts When Engaging", s.dontsWhenEngaging) : '',
    field('Leadership Style', s.leadershipStyle),
    field('Personal Motivation', s.personalMotivation),
    field('Freyr Selling Point', s.freyrSellingPoint || s.freyrSellingPoint || ''),
  ].join(''))}

  <!-- Interests & Hobbies -->
  ${(exec.interests||[]).length ? section('Interests & Hobbies', `
    <div class="grid-2">
      ${(exec.interests||[]).map((x:any)=>`
        <div class="card">
          <div class="card-title">${esc(x.name)}</div>
          <div class="card-body">${esc(x.proofPoint)}</div>
        </div>`).join('')}
    </div>`) : ''}

  <!-- Company Role -->
  ${exec.companyRole ? section('Company Role', `<div class="field-value">${esc(exec.companyRole)}</div>`) : ''}

  <!-- Key Traits -->
  ${(exec.keyTraits||[]).length ? section('Key Traits', `
    ${(exec.keyTraits||[]).map((t:any)=>`
      <div class="card" style="margin-bottom:10px;">
        <div class="card-title">${esc(t.name)}</div>
        <div class="card-body">${esc(t.summary)}</div>
      </div>`).join('')}`) : ''}

  <!-- Sales Insights -->
  ${(exec.salesInsights||[]).length ? section('Sales Insights', `
    ${(exec.salesInsights||[]).map((si:any)=>`
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:700;color:#5a7499;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">${esc(si.scenario)}</div>
        ${Array.isArray(si.dos) ? `<div class="field-label">DO:</div>${si.dos.map((d:string)=>`<div class="action-item">✓ ${esc(d)}</div>`).join('')}` : si.dos ? `<div class="field-label">DO:</div><div class="action-item">${esc(si.dos)}</div>` : ''}
        ${Array.isArray(si.donts) ? `<div class="field-label" style="margin-top:10px;">DON'T:</div>${si.donts.map((d:string)=>`<div class="action-item" style="border-color:#dc2626;">✗ ${esc(d)}</div>`).join('')}` : si.donts ? `<div class="field-label" style="margin-top:10px;">DON'T:</div><div class="action-item" style="border-color:#dc2626;">${esc(si.donts)}</div>` : ''}
      </div>`).join('')}`) : ''}

  <!-- Conference Intelligence -->
  ${(exec.conferenceIntelligence||[]).length ? section('Conference Intelligence', `
    ${(exec.conferenceIntelligence||[]).map((c:string)=>`
      <div class="action-item" style="border-color:#1B365D;">📅 ${esc(c)}</div>`).join('')}`) : ''}

  <!-- Publications -->
  ${(exec.publications||[]).length ? section('Publications', `
    ${(exec.publications||[]).map((p:any)=>`
      <div class="award-item">
        <div class="award-name">${esc(p.title)}</div>
        <div class="award-org">${esc(p.journal)} · ${esc(p.year)}</div>
      </div>`).join('')}`) : ''}

  <!-- Memberships -->
  ${(exec.memberships||[]).length ? section('Memberships & Affiliations', `
    ${(exec.memberships||[]).map((m:any)=>`
      <div class="award-item">
        <div class="award-name">${esc(m.name)}</div>
        <div class="award-org">${esc(m.type)}</div>
        <div class="award-desc">${esc(m.description)}</div>
      </div>`).join('')}`) : ''}

  <!-- Awards -->
  ${(exec.awards||[]).length ? section('Awards & Recognitions', `
    ${(exec.awards||[]).map((a:any)=>`
      <div class="award-item">
        <div class="award-name">${esc(a.name)} ${a.year ? `(${esc(a.year)})` : ''}</div>
        <div class="award-org">${esc(a.org||a.organization)}</div>
        <div class="award-desc">${esc(a.description)}</div>
      </div>`).join('')}`) : ''}

  <!-- Freyr Selling Point -->
  ${exec.sellingPoint ? section('Freyr Selling Point', `
    <div class="field-label">${esc(exec.sellingPoint.department)}</div>
    <div class="field-value">${esc(exec.sellingPoint.content)}</div>`) : ''}

  <!-- Action Plan -->
  ${(exec.actionPlan||[]).length ? section('Action Plan', `
    ${(exec.actionPlan||[]).map((a:string,i:number)=>`
      <div class="action-item"><strong>${i+1}.</strong> ${esc(a)}</div>`).join('')}`) : ''}

  <!-- Work History -->
  ${(exec.workHistory||[]).length ? section('Work History', `
    ${(exec.workHistory||[]).map((w:any)=>`
      <div class="work-item">
        <div class="work-company">${esc(w.company)}</div>
        <div class="work-role">${esc(w.role)}</div>
        <div class="work-period">${esc(w.period)}</div>
      </div>`).join('')}`) : ''}

  <!-- Education -->
  ${(exec.education||[]).length ? section('Education', `
    ${(exec.education||[]).map((e:any)=>`
      <div class="work-item">
        <div class="work-company">${esc(e.school)}</div>
        <div class="work-role">${esc(e.degree)}</div>
        ${e.period ? `<div class="work-period">${esc(e.period)}</div>` : ''}
      </div>`).join('')}`) : ''}

  <div class="footer">
    The Nudge Intelligence — Powered by Freyr Solutions · Confidential · ${new Date().toLocaleDateString('en-GB',{month:'long',year:'numeric'})}
  </div>
</div>
<script>window.onload=()=>window.print()</script>
</body>
</html>`
}

function downloadExecProfile(exec: any) {
  const html = generateExecProfileHtml(exec)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${exec.name.replace(/[^a-zA-Z0-9]/g,'-')}-Profile.html`
  a.click()
  URL.revokeObjectURL(url)
}
export default function ExecDetailPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const exec = ALL_EXECS.find(e => e.id===id)
  const [cat, setCat] = useState('One Minute Summary')
  const [showEmail, setShowEmail] = useState(false)
  const [showTask, setShowTask] = useState(false)
  const [workOpen, setWorkOpen] = useState(false)
  const [eduOpen, setEduOpen] = useState(false)

  // Seed all profile sections from static data on first load
  useEffect(() => {
    if (exec) seedExecProfile(exec)
  }, [exec?.id])  // eslint-disable-line react-hooks/exhaustive-deps

  if (!exec) return <div style={{ padding:40, textAlign:'center', color:'var(--text-3)' }}>Executive not found.</div>

  const initials = exec.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2)
  const statusColors: any = { cold:'#3b82f6', warm:'#f59e0b', hot:'#ef4444' }
  const sc = statusColors[exec.status]||'#3b82f6'
  const AVATARS = ['#1a56db','#ef4444','#10b981','#f59e0b','#0ea5e9','#7c3aed','#1a4a8a']
  const av = AVATARS[ALL_EXECS.indexOf(exec) % AVATARS.length]

  return (
    <div>
      <button onClick={()=>nav('/accounts/exec-capital')} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', cursor:'pointer', fontSize:13, color:'var(--text-3)', marginBottom:14, fontFamily:'Source Sans 3,sans-serif', fontWeight:600 }}>
        <ArrowLeft size={13}/> Back
      </button>

      {/* Profile header */}
      <div className="card" style={{ padding:'18px 24px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
          <div style={{ width:60, height:60, borderRadius:'50%', background:av, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#fff', flexShrink:0, fontFamily:'Sora,sans-serif' }}>{initials}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:20, fontWeight:800, color:'var(--navy)', marginBottom:2, fontFamily:'Sora,sans-serif' }}>{exec.name}</div>
            <div style={{ fontSize:14, color:'var(--text-2)', marginBottom:10 }}>{exec.title} | {exec.company}</div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:6, background:'var(--bg-raised)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-2)', marginBottom:12, fontWeight:600 }}>🏢 {exec.company}</div>

            {/* Chips */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:7, alignItems:'center' }}>
              {exec.tenure && <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:20, background:'var(--bg-raised)', border:'1px solid var(--border)', fontSize:11.5, color:'var(--text-2)', fontWeight:600 }}><Briefcase size={10}/> {exec.tenure}</span>}
              {exec.location && <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:20, background:'var(--bg-raised)', border:'1px solid var(--border)', fontSize:11.5, color:'var(--text-2)', fontWeight:600 }}><MapPin size={10}/> {exec.location}</span>}
              <button onClick={()=>{setWorkOpen(o=>!o);setEduOpen(false)}} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, fontSize:11.5, fontWeight:700, background:workOpen?'var(--navy)':'var(--bg-raised)', color:workOpen?'#fff':'var(--text-2)', border:workOpen?'none':'1px solid var(--border)', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif', transition:'all 180ms' }}>
                <Briefcase size={10}/> Work ({exec.workHistory?.length||0}) <ChevronDown size={10} style={{ transform:workOpen?'rotate(180deg)':'none', transition:'transform 200ms' }}/>
              </button>
              <button onClick={()=>{setEduOpen(o=>!o);setWorkOpen(false)}} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, fontSize:11.5, fontWeight:700, background:eduOpen?'#0ea5e9':'var(--bg-raised)', color:eduOpen?'#fff':'var(--text-2)', border:eduOpen?'none':'1px solid var(--border)', cursor:'pointer', fontFamily:'Source Sans 3,sans-serif', transition:'all 180ms' }}>
                <GraduationCap size={10}/> Education ({exec.education?.length||0}) <ChevronDown size={10} style={{ transform:eduOpen?'rotate(180deg)':'none', transition:'transform 200ms' }}/>
              </button>
              <button onClick={()=>downloadExecProfile(exec)} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:20, background:'var(--bg-raised)', border:'1px solid var(--border)', fontSize:11.5, color:'var(--text-2)', fontWeight:600, cursor:'pointer' }}><Eye size={10}/> Profile PDF</button>
              {exec.linkedIn && (
                <a href={exec.linkedIn} target="_blank" rel="noopener noreferrer" title="View LinkedIn Profile" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:6, background:'#0A66C2', textDecoration:'none', flexShrink:0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="#fff">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
            </div>

            {workOpen && (
              <div style={{ marginTop:12, padding:'14px 18px', background:'var(--bg-raised)', borderRadius:10, border:'1px solid var(--border)', animation:'slideDown 180ms ease', maxHeight:260, overflowY:'auto' }}>
                {(exec.workHistory||[]).map((w:any,i:number) => (
                  <div key={i} style={{ marginBottom:i<(exec.workHistory.length-1)?16:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text-1)', marginBottom:4, fontFamily:'Sora,sans-serif' }}>{w.company}</div>
                    <div style={{ display:'flex', gap:10, paddingLeft:4 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--navy)', flexShrink:0, marginTop:5 }}/>
                      <div>
                        <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text-1)' }}>{w.role}</div>
                        <div style={{ fontSize:12.5, color:'var(--text-3)', fontWeight:600, marginTop:2 }}>{w.period}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {eduOpen && (
              <div style={{ marginTop:12, padding:'14px 18px', background:'var(--bg-raised)', borderRadius:10, border:'1px solid var(--border)', animation:'slideDown 180ms ease', maxHeight:260, overflowY:'auto' }}>
                {(exec.education||[]).map((e:any,i:number) => (
                  <div key={i} style={{ marginBottom:i<(exec.education.length-1)?16:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text-1)', marginBottom:4, fontFamily:'Sora,sans-serif' }}>{e.school}</div>
                    <div style={{ display:'flex', gap:10, paddingLeft:4 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:'#0ea5e9', flexShrink:0, marginTop:5 }}/>
                      <div>
                        <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text-1)' }}>{e.degree}</div>
                        {e.period && <div style={{ fontSize:12.5, color:'var(--text-3)', fontWeight:600, marginTop:2 }}>{e.period}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, background:`${sc}18`, color:sc, fontSize:11, fontWeight:800, letterSpacing:'0.08em', textTransform:'uppercase' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:sc }}/>{exec.status.toUpperCase()}
            </span>
            <button onClick={()=>setShowEmail(true)} style={{ width:34, height:34, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-surface)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-2)' }}><Mail size={15}/></button>
            <button onClick={()=>setShowTask(true)} style={{ padding:'8px 16px', borderRadius:8, border:'none', background:'var(--navy)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'Source Sans 3,sans-serif', letterSpacing:'0.04em' }}>TASK CREATIONS</button>
          </div>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:16, alignItems:'start' }}>
        {/* Sidebar */}
        <div className="card" style={{ padding:'10px 6px', position:'sticky', top:16 }}>
          <div style={{ padding:'0 10px 8px', fontSize:9.5, fontWeight:700, letterSpacing:'0.12em', color:'var(--text-3)', textTransform:'uppercase' }}>Profile Category</div>
          {CATEGORIES.map(c => (
            <button key={c} onClick={()=>setCat(c)} style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 12px', borderRadius:7, border:'none', background:cat===c?'var(--navy)':'transparent', color:cat===c?'#fff':'var(--text-2)', fontSize:13, fontWeight:cat===c?700:400, fontFamily:'Source Sans 3,sans-serif', cursor:'pointer', transition:'all 150ms', borderLeft:cat===c?'3px solid #D4AF37':'3px solid transparent' }}
              onMouseEnter={e=>{if(cat!==c)e.currentTarget.style.background='var(--bg-hover)'}}
              onMouseLeave={e=>{if(cat!==c)e.currentTarget.style.background='transparent'}}>
              {c}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card" style={{ padding:'22px 26px', minHeight:400 }}>
          <div key={cat}>
            <SectionContent cat={cat} exec={exec} execId={id||''}/>
          </div>
        </div>
      </div>

      {showTask && <TaskModal execId={id||''} onSave={async t=>{await upsertTask({...t,exec_id:id||''});setShowTask(false)}} onClose={()=>setShowTask(false)}/>}
    </div>
  )
}
