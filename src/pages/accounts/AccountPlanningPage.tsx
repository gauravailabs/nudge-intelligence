import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Download, Save, Plus, X, Check, Trash2, ChevronDown, ArrowRight } from 'lucide-react'
import { ACCOUNTS_LIST, ACCOUNT_PLAN, BROWSE_BY_OPTIONS } from '../../data'
import { useVersioning } from '../../lib/versioning'
import { getAllPlanSections, savePlanSection, getLatestPublishedSection, getLatestDraftSection } from '../../lib/supabase'

// ── Version Toolbar ───────────────────────────────────────────────────────────
function VersionToolbar({ vhook, onSave, onPublish }: { vhook: ReturnType<typeof useVersioning>; onSave:()=>void; onPublish:()=>void }) {
  const { versions, selectedVersionId, setSelectedVersionId, hasDraft } = vhook
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
      <span style={{ fontSize:19, color:'var(--text-3)', fontWeight:600 }}>Version</span>
      <select className="select" value={selectedVersionId} onChange={e=>setSelectedVersionId(e.target.value)} style={{ fontSize:19, minWidth:160 }}>
        {versions.map(v => (
          <option key={v.id} value={v.id}>
            {v.label}{v.isDraft?' (Draft)':''} · {v.savedAt ? new Date(v.savedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'2-digit',year:'2-digit'}) : ''}
          </option>
        ))}
      </select>
      <button onClick={onSave} className="btn btn-ghost btn-sm" style={{ display:'flex', gap:5 }}>
        <Save size={13}/> Save Draft
      </button>
      <button onClick={onPublish} className="btn btn-brand btn-sm">PUBLISH</button>
      {hasDraft && <span className="badge badge-amber" style={{ fontSize:16.5 }}>DRAFT</span>}
    </div>
  )
}

// ── Account Review Recap — HORIZONTAL category labels ────────────────────────
const RECAP_GROUPS = ['Significant GTM Development','Significant Deal / RFP / RFI Updates','Miscellaneous Updates','Significant Delivery Updates']
const BUS = ['ECS','EMS','OTHERS']

function AccountReviewRecapView({ planData, publishedData, onChange }: { planData:any; publishedData?:any; onChange:(d:any)=>void }) {
  // publishedData may be {rows:[...]} from DB  OR  the nested {[group]:{[bu]:{...}}} from an old save
  // Normalise to internal nested format for editing, but always emit {rows:[...]} for the PPT
  const toNested = (src: any) => {
    if (!src) return null
    // Already in {rows:[...]} shape
    if (Array.isArray(src.rows)) {
      const init: any = {}
      RECAP_GROUPS.forEach(g => {
        init[g] = {}
        BUS.forEach(b => {
          const row = src.rows.find((r:any)=>r.category===g&&r.bu===b)||{}
          init[g][b] = { left:row.whereWeLeftOff||'', update:row.updateOnProgress||'', next:row.nextSteps||'' }
        })
      })
      return init
    }
    // Already in nested {[group]:{[bu]:{left,update,next}}} shape
    if (typeof src === 'object' && RECAP_GROUPS.some(g => src[g])) return src
    return null
  }

  const toRows = (nested: any) => ({
    rows: RECAP_GROUPS.flatMap(g =>
      BUS.map(b => ({
        category: g, bu: b,
        whereWeLeftOff:    nested[g]?.[b]?.left   || '',
        updateOnProgress:  nested[g]?.[b]?.update || '',
        nextSteps:         nested[g]?.[b]?.next   || '',
      }))
    )
  })

  const seedNested = toNested(publishedData) || toNested({ rows: planData?.accountReviewRecap?.rows }) || (() => {
    const init: any = {}
    RECAP_GROUPS.forEach(g => { init[g] = {}; BUS.forEach(b => { init[g][b] = { left:'', update:'', next:'' } }) })
    return init
  })()

  const [data, setData] = useState<Record<string,Record<string,any>>>(seedNested)

  // Fire onChange on mount so sectionData is always populated
  useEffect(() => { onChange(toRows(data)) }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const update = (g:string, b:string, f:'left'|'update'|'next', val:string) => {
    const n = { ...data, [g]:{ ...data[g],[b]:{ ...data[g][b],[f]:val } } }
    setData(n)
    onChange(toRows(n))  // always emit rows[] format
  }

  return (
    <div>
      <div className="section-heading glow" style={{ fontSize:24, marginBottom:18 }}>What changed since last account review — Recap</div>
      <div style={{ overflowX:'auto' }}>
        <table className="recap-table" style={{ minWidth:900 }}>
          <thead>
            <tr>
              <th style={{ width:150, textAlign:'center' }}></th>
              <th style={{ width:70 }}>BU</th>
              <th>WHERE WE LEFT OFF</th>
              <th>UPDATE ON PROGRESS</th>
              <th>NEXT STEPS</th>
            </tr>
          </thead>
          <tbody>
            {RECAP_GROUPS.map(group => (
              BUS.map((bu, bi) => (
                <tr key={`${group}-${bu}`}>
                  {bi === 0 && (
                    <td rowSpan={BUS.length} style={{
                      verticalAlign:'middle', textAlign:'center',
                      padding:'10px 8px', border:'1px solid var(--border)',
                      background:'linear-gradient(180deg, var(--bg-raised), var(--bg-subtle))',
                      fontSize:19, fontWeight:800, color:'var(--text-1)',
                      lineHeight:1.4, fontFamily:'Nunito,sans-serif',
                    }}>
                      {group}
                    </td>
                  )}
                  <td className="bu-cell">
                    <span style={{
                      display:'inline-block', padding:'3px 8px', borderRadius:5,
                      background: bu==='ECS'?'var(--blue-bg)':bu==='EMS'?'var(--emerald-bg)':'var(--brand-bg)',
                      color: bu==='ECS'?'var(--blue)':bu==='EMS'?'var(--emerald)':'var(--brand-2)',
                      fontWeight:800, fontSize:16.5, letterSpacing:'0.06em',
                    }}>{bu}</span>
                  </td>
                  {(['left','update','next'] as const).map(field => (
                    <td key={field} className="content-cell">
                      <textarea className="textarea-cell"
                        placeholder="Enter details..."
                        value={data[group]?.[bu]?.[field]||''}
                        onChange={e=>update(group,bu,field,e.target.value)}
                        style={{ resize:'both', minHeight:90, fontSize:20.5 }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize:19, color:'var(--text-3)', marginTop:14, fontStyle:'italic' }}>Changes will be saved when you click Save Draft or Publish.</p>
    </div>
  )
}

// ── SWOT Inferences ───────────────────────────────────────────────────────────
function InferencesView({ planData, publishedData, onChange }: { planData:any; publishedData?:any; onChange:(d:any)=>void }) {
  const seed = publishedData || planData
  const [swot, setSwot] = useState<Record<string,string>>(() => {
    const s = seed?.swot || planData?.swot
    if (s) return {
      S: Array.isArray(s.S) ? s.S.join('\n\n') : (s.S||''),
      W: Array.isArray(s.W) ? s.W.join('\n\n') : (s.W||''),
      O: Array.isArray(s.O) ? s.O.join('\n\n') : (s.O||''),
      T: Array.isArray(s.T) ? s.T.join('\n\n') : (s.T||''),
    }
    return { S:'', W:'', O:'', T:'' }
  })
  useEffect(() => { onChange(swot) }, [])  // eslint-disable-line react-hooks/exhaustive-deps
  const update = (k:string, val:string) => { const n={...swot,[k]:val}; setSwot(n); onChange(n) }
  const cells = [
    { key:'S', label:'Strength',    color:'var(--emerald)', bg:'var(--emerald-bg)', icon:'💪' },
    { key:'W', label:'Weakness',    color:'var(--red)',     bg:'var(--red-bg)',     icon:'⚠️' },
    { key:'O', label:'Opportunity', color:'var(--blue)',    bg:'var(--blue-bg)',    icon:'🎯' },
    { key:'T', label:'Threat',      color:'var(--amber)',   bg:'var(--amber-bg)',   icon:'🛡️' },
  ]
  return (
    <div>
      <div className="section-heading glow" style={{ fontSize:24, marginBottom:18 }}>SWOT Analysis — Inferences</div>
      <div className="swot-grid">
        {cells.map(cell => (
          <div key={cell.key} style={{
            background:`linear-gradient(135deg, ${cell.bg}, var(--bg-surface))`,
            border:`1.5px solid ${cell.color}44`, borderRadius:'var(--radius-md)', padding:18,
            boxShadow:`0 0 16px ${cell.color}18`,
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:cell.color, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18.5, fontWeight:900, fontFamily:'Sora,sans-serif', boxShadow:`0 0 12px ${cell.color}55` }}>
                {cell.key}
              </div>
              <div>
                <div className="section-heading" style={{ fontSize:21 }}>{cell.label}</div>
              </div>
              <span style={{ marginLeft:'auto', fontSize:18.5 }}>{cell.icon}</span>
            </div>
            <textarea
              value={swot[cell.key]||''}
              onChange={e=>update(cell.key,e.target.value)}
              style={{ width:'100%', minHeight:140, padding:'10px 12px', background:'rgba(0,0,0,0.15)', border:`1px solid ${cell.color}33`, borderRadius:8, resize:'both', fontSize:21, fontFamily:'Nunito,sans-serif', fontWeight:500, color:'var(--text-1)', outline:'none', lineHeight:1.7 }}
              placeholder={`${cell.label} points, one per line...`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Big Bets — ALL BUs in ONE page, Approved=static, Nudge=editable ───────────
const ALL_BUS = ['ECS','EMS','Clinical','Others']

function OurBigBetsView({ planData, publishedData, onChange }: { planData:any; publishedData?:any; onChange:(d:any)=>void }) {
  const seed = publishedData || planData
  const [tab, setTab] = useState<'approved'|'nudge'>('approved')
  const [nudgeItems, setNudgeItems] = useState<any[]>(() =>
    (seed?.nudgeBigBets || planData?.nudgeBigBets||[]).flatMap((bu:any, bui:number) =>
      (bu.rows||[]).map((r:any, ri:number) => ({
        id:`nudge_${bui}_${ri}`, bu:bu.bu, focus:r.focus, acv:r.acv,
        details:[...(r.details||[])], stakeholder:r.stakeholder, nextSteps:r.nextSteps,
        updates:'', status:'pending' as 'pending'|'approved'|'rejected',
      }))
    )
  )
  const [approvedEdits, setApprovedEdits] = useState<Record<string,string>>({})

  // All approved big bets combined from all BUs
  const allApproved = (seed?.bigBets || planData?.bigBets||[]).flatMap((bu:any) =>
    (bu.rows||[]).map((r:any, i:number) => ({ ...r, bu:bu.bu, _id:`${bu.bu}_${i}` }))
  )
  const approvedFromNudge = nudgeItems.filter(n=>n.status==='approved')
  const combined = [...allApproved, ...approvedFromNudge]

  useEffect(() => { onChange({ bigBets: seed?.bigBets || planData?.bigBets, nudgeBigBets: seed?.nudgeBigBets || planData?.nudgeBigBets }) }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const approveBet = (id:string) => setNudgeItems(prev=>prev.map(n=>n.id===id?{...n,status:'approved'}:n))
  const rejectBet  = (id:string) => setNudgeItems(prev=>prev.map(n=>n.id===id?{...n,status:'rejected'}:n))
  const deleteBet  = (id:string) => setNudgeItems(prev=>prev.filter(n=>n.id!==id))
  const updateNudge = (id:string, field:string, val:string) =>
    setNudgeItems(prev=>{ const n=prev.map(x=>x.id===id?{...x,[field]:val}:x); onChange(n); return n })

  const buColors: Record<string,string> = { ECS:'var(--blue)', EMS:'var(--emerald)', Clinical:'var(--red)', Others:'var(--brand-2)' }
  const buBg:     Record<string,string> = { ECS:'var(--blue-bg)', EMS:'var(--emerald-bg)', Clinical:'var(--red-bg)', Others:'var(--brand-bg)' }

  return (
    <div>
      {/* Tab */}
      <div style={{ display:'flex', borderBottom:'2px solid var(--border)', marginBottom:20 }}>
        {(['approved','nudge'] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:'10px 20px', background:'none', border:'none', cursor:'pointer', fontFamily:'Nunito,sans-serif',
            fontSize:21, fontWeight:tab===t?800:600, color:tab===t?'var(--brand-2)':'var(--text-3)',
            borderBottom:tab===t?'2px solid var(--brand-2)':'2px solid transparent', marginBottom:-2,
            transition:'all 180ms',
          }}>
            {t==='approved'?'Approved Big Bets':'Nudge Recommended'}
            {t==='nudge' && nudgeItems.filter(n=>n.status==='pending').length>0 && (
              <span className="badge badge-brand" style={{ fontSize:15, marginLeft:6 }}>{nudgeItems.filter(n=>n.status==='pending').length}</span>
            )}
          </button>
        ))}
      </div>

      {/* APPROVED — all BUs, static (read-only) */}
      {tab==='approved' && (
        <div>
          {combined.length===0 && (
            <div style={{ padding:'40px', textAlign:'center', color:'var(--text-3)', fontSize:21 }}>
              No approved big bets yet. Approve from Nudge Recommended.
            </div>
          )}
          {ALL_BUS.map(bu => {
            const rows = combined.filter(r=>r.bu===bu)
            if (rows.length===0) return null
            return (
              <div key={bu} style={{ marginBottom:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <span style={{ padding:'4px 14px', borderRadius:20, background:buBg[bu], color:buColors[bu], fontSize:18, fontWeight:800, letterSpacing:'0.06em' }}>{bu}</span>
                  <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:21 }}>
                    <thead>
                      <tr style={{ background:'var(--bg-raised)' }}>
                        {['#','FOCUS AREA','ACV ($M)','DETAILS','STAKEHOLDER','NEXT STEPS','UPDATES'].map(h=>(
                          <th key={h} style={{ padding:'9px 12px', textAlign:'left', fontSize:16.5, fontWeight:800, color:'var(--text-2)', letterSpacing:'0.08em', borderBottom:'2px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, ri) => (
                        <tr key={row._id||ri} style={{ borderBottom:'1px solid var(--border)' }}>
                          <td style={{ padding:'10px 12px', fontSize:19.5, color:'var(--brand-2)', fontWeight:800, verticalAlign:'top' }}>{ri+1}</td>
                          <td style={{ padding:'10px 12px', fontWeight:700, color:'var(--text-1)', fontSize:21, verticalAlign:'top', minWidth:160 }}>{row.focus}</td>
                          <td style={{ padding:'10px 12px', verticalAlign:'top' }}>
                            <span style={{ fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:24, color:'var(--brand-2)' }}>{row.acv}</span>
                          </td>
                          <td style={{ padding:'10px 12px', verticalAlign:'top', minWidth:240 }}>
                            <ul style={{ margin:0, padding:'0 0 0 14px' }}>
                              {(row.details||[]).map((d:string,di:number)=>(
                                <li key={di} style={{ fontSize:20.5, color:'var(--text-2)', lineHeight:1.7, marginBottom:5 }}>{d}</li>
                              ))}
                            </ul>
                          </td>
                          <td style={{ padding:'10px 12px', fontSize:20.5, color:'var(--text-2)', verticalAlign:'top' }}>{row.stakeholder}</td>
                          <td style={{ padding:'10px 12px', fontSize:20.5, color:'var(--text-2)', verticalAlign:'top' }}>{row.nextSteps}</td>
                          <td style={{ padding:'6px', verticalAlign:'top', minWidth:160 }}>
                            <textarea
                              value={approvedEdits[row._id||String(ri)]||''}
                              onChange={e=>setApprovedEdits(prev=>({...prev,[row._id||String(ri)]:e.target.value}))}
                              className="textarea-cell"
                              placeholder="Add updates..."
                              style={{ minHeight:70, resize:'both', fontSize:19.5 }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* NUDGE RECOMMENDED — all BUs, editable */}
      {tab==='nudge' && (
        <div>
          {ALL_BUS.map(bu => {
            const rows = nudgeItems.filter(n=>n.bu===bu&&n.status!=='rejected')
            return (
              <div key={bu} style={{ marginBottom:24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <span style={{ padding:'4px 14px', borderRadius:20, background:buBg[bu], color:buColors[bu], fontSize:18, fontWeight:800, letterSpacing:'0.06em' }}>{bu}</span>
                  <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                </div>
                {rows.length===0 ? (
                  <div style={{ padding:'20px', textAlign:'center', color:'var(--text-3)', fontSize:20.5, background:'var(--bg-raised)', borderRadius:10, border:'1px solid var(--border)' }}>
                    No nudge recommendations for {bu}.
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {rows.map(item => (
                      <div key={item.id} style={{
                        border:`1.5px solid ${item.status==='approved'?'var(--emerald)':'var(--border)'}`,
                        borderRadius:12, padding:18, background:'var(--bg-raised)',
                        boxShadow: item.status==='approved' ? '0 0 16px rgba(16,185,129,0.15)' : 'var(--glow-card)',
                      }}>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                          <div style={{ flex:1 }}>
                            {/* Editable focus */}
                            <textarea
                              value={item.focus}
                              onChange={e=>updateNudge(item.id,'focus',e.target.value)}
                              disabled={item.status==='approved'}
                              style={{ width:'100%', background:'transparent', border:'none', outline:'none', resize:'none', fontSize:21.5, fontFamily:'Nunito,sans-serif', fontWeight:700, color:'var(--text-1)', lineHeight:1.4 }}
                              rows={2}
                            />
                            <div style={{ fontSize:19, color:'var(--brand-2)', fontWeight:600, marginTop:4 }}>ACV: ${item.acv}M · {item.stakeholder}</div>
                          </div>
                          {item.status==='pending' && (
                            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                              <button onClick={()=>approveBet(item.id)} className="btn btn-success btn-xs" style={{ display:'flex',alignItems:'center',gap:4 }}><Check size={11}/> Approve</button>
                              <button onClick={()=>rejectBet(item.id)} className="btn btn-ghost btn-xs" style={{ display:'flex',alignItems:'center',gap:4 }}><X size={11}/> Reject</button>
                              <button onClick={()=>deleteBet(item.id)} className="btn btn-danger btn-xs" style={{ display:'flex',alignItems:'center',gap:4 }}><Trash2 size={11}/> Delete</button>
                            </div>
                          )}
                          {item.status==='approved' && <span className="badge badge-green" style={{ flexShrink:0 }}>✓ Approved</span>}
                        </div>
                        {/* Editable details */}
                        {(item.details||[]).map((d:string, i:number) => (
                          <div key={i} style={{ display:'flex', gap:6, marginBottom:6 }}>
                            <span style={{ color:'var(--brand-2)', flexShrink:0, marginTop:2, fontSize:21 }}>•</span>
                            <textarea
                              value={d}
                              onChange={e => updateNudge(item.id,'details',item.details.map((x:string,xi:number)=>xi===i?e.target.value:x).join('|||'))}
                              disabled={false}
                              style={{ flex:1, background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:7, padding:'6px 10px', fontSize:20.5, fontFamily:'Nunito,sans-serif', fontWeight:500, color:'var(--text-1)', resize:'both', outline:'none', minHeight:36 }}
                            />
                          </div>
                        ))}
                        {/* Updates column */}
                        <div style={{ marginTop:12 }}>
                          <div style={{ fontSize:16.5, fontWeight:800, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>UPDATES</div>
                          <textarea
                            value={item.updates}
                            onChange={e=>updateNudge(item.id,'updates',e.target.value)}
                            className="textarea-cell"
                            placeholder="Add update notes..."
                            style={{ minHeight:60, resize:'both', fontSize:20.5 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Account Priority ──────────────────────────────────────────────────────────
function AccountPriorityView({ planData, publishedData, onChange }: { planData:any; publishedData?:any; onChange:(d:any)=>void }) {
  const seed = publishedData || planData?.accountPriority
  const [items, setItems] = useState<any[]>(() => Array.isArray(seed) ? seed : (planData?.accountPriority||[]))
  useEffect(() => { onChange(items) }, [])  // eslint-disable-line react-hooks/exhaustive-deps
  const update = (i:number, f:string, v:string) => {
    const n=items.map((it,idx)=>idx===i?{...it,[f]:v}:it); setItems(n); onChange(n)
  }
  const urgColors: Record<string,string> = { urgent:'var(--red)', high:'var(--amber)', medium:'var(--blue)' }
  const urgBg:     Record<string,string> = { urgent:'var(--red-bg)', high:'var(--amber-bg)', medium:'var(--blue-bg)' }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {items.map((item,i) => (
        <div key={i} style={{
          borderLeft:`4px solid ${urgColors[item.urgency]||'var(--border)'}`,
          borderRadius:'0 12px 12px 0', padding:18,
          background:'var(--bg-surface)',
          border:`1px solid var(--border)`,
          borderLeftColor:urgColors[item.urgency],
          boxShadow:'var(--glow-card)',
        }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:10 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:urgBg[item.urgency]||'var(--blue-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:19.5, fontWeight:900, color:urgColors[item.urgency]||'var(--blue)', flexShrink:0, fontFamily:'Sora,sans-serif', boxShadow:`0 0 10px ${urgColors[item.urgency]||'var(--blue)'}44` }}>
              {item.priority}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <textarea value={item.title} onChange={e=>update(i,'title',e.target.value)}
                  style={{ fontSize:22.5, fontWeight:800, color:'var(--text-1)', background:'transparent', border:'none', outline:'none', resize:'none', fontFamily:'Sora,sans-serif', width:'100%', lineHeight:1.4 }} rows={1}/>
                <select value={item.urgency} onChange={e=>update(i,'urgency',e.target.value)} className="select"
                  style={{ fontSize:16.5, padding:'3px 22px 3px 8px', width:'auto', flexShrink:0, color:urgColors[item.urgency], background:urgBg[item.urgency], borderColor:urgColors[item.urgency], borderRadius:8 }}>
                  <option value="urgent">URGENT</option>
                  <option value="high">HIGH</option>
                  <option value="medium">MEDIUM</option>
                </select>
              </div>
              <textarea value={item.imperative} onChange={e=>update(i,'imperative',e.target.value)}
                className="textarea-cell" style={{ width:'100%', minHeight:60, marginBottom:10, fontSize:21 }} placeholder="Imperative..."/>
              <div style={{ background:'var(--brand-bg)', borderRadius:8, padding:'8px 12px', display:'flex', gap:6 }}>
                <span style={{ color:'var(--brand-2)', fontWeight:800, flexShrink:0 }}>▸</span>
                <textarea value={item.freyrRelevance} onChange={e=>update(i,'freyrRelevance',e.target.value)}
                  style={{ flex:1, background:'transparent', border:'none', outline:'none', resize:'none', fontSize:20.5, fontFamily:'Nunito,sans-serif', fontWeight:600, color:'var(--text-1)', lineHeight:1.6 }} rows={2} placeholder="Freyr relevance..."/>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button onClick={()=>{const n=[...items,{priority:items.length+1,title:'New Priority',imperative:'',freyrRelevance:'',urgency:'medium'}];setItems(n);onChange(n)}}
        className="btn btn-ghost" style={{ display:'flex',alignItems:'center',gap:5 }}>
        <Plus size={14}/> Add Priority
      </button>
    </div>
  )
}

// ── Emerging Pipeline ─────────────────────────────────────────────────────────
function EmergingPipelineView({ planData, publishedData, onChange }: { planData:any; publishedData?:any; onChange:(d:any)=>void }) {
  const seed = publishedData || planData?.emergingPipeline
  const [worked, setWorked] = useState((seed?.worked || planData?.emergingPipeline?.worked||[]).join('\n'))
  const [didnt,  setDidnt]  = useState((seed?.didntWork || planData?.emergingPipeline?.didntWork||[]).join('\n'))
  const upd = (w:string, d:string) => onChange({ target: seed?.target || planData?.emergingPipeline?.target, worked:w.split('\n').filter(Boolean), didntWork:d.split('\n').filter(Boolean) })
  useEffect(() => { upd(worked, didnt) }, [])  // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      <div className="section-heading glow" style={{ fontSize:22.5, marginBottom:14 }}>Target</div>
      <div style={{ padding:'14px 18px', background:'var(--bg-raised)', borderRadius:10, border:'1px solid var(--border)', fontSize:21.5, color:'var(--text-2)', lineHeight:1.7, marginBottom:22, boxShadow:'var(--glow-card)' }}>
        {planData?.emergingPipeline?.target||'No target data.'}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {[{color:'var(--emerald)',label:'What worked?',val:worked,set:(v:string)=>{setWorked(v);upd(v,didnt)},bg:'var(--emerald-bg)'},{color:'var(--red)',label:"What didn't work?",val:didnt,set:(v:string)=>{setDidnt(v);upd(worked,v)},bg:'var(--red-bg)'}].map(c=>(
          <div key={c.label}>
            <div style={{ fontSize:21.5, fontWeight:800, color:c.color, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:9, height:9, borderRadius:'50%', background:c.color, display:'inline-block', boxShadow:`0 0 8px ${c.color}` }}/>
              {c.label}
            </div>
            <textarea value={c.val} onChange={e=>c.set(e.target.value)}
              className="textarea-cell" style={{ width:'100%', minHeight:180, resize:'both', fontSize:21, background:`linear-gradient(135deg, ${c.bg}, var(--bg-raised))` }}
              placeholder="- Point 1&#10;- Point 2"/>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Power Centres ─────────────────────────────────────────────────────────────
function PowerCentresView({ planData, publishedData, onChange }: { planData:any; publishedData?:any; onChange:(d:any)=>void }) {
  const seed = publishedData || planData?.powerCentres
  const [rows, setRows] = useState<any[]>(()=> Array.isArray(seed) ? seed : (planData?.powerCentres||[]))
  useEffect(() => { onChange(rows) }, [])  // eslint-disable-line react-hooks/exhaustive-deps
  const [editIdx, setEditIdx] = useState<number|null>(null)
  const [editData, setEditData] = useState<any>(null)
  const rel_c: Record<string,string> = { 'Active':'var(--emerald)','Warm — ACTIVE':'var(--emerald)','Cold':'var(--blue)','Warm':'var(--amber)','Cold — HIGHEST PRIORITY':'var(--red)','active':'var(--emerald)' }
  const getColor = (r:string) => rel_c[r] || 'var(--blue)'

  const AVATARS = ['#1a56db','#ef4444','#10b981','#f59e0b','#0ea5e9','#ec4899','#14b8a6','#3b82f6']
  const initials = (name:string) => name.split(' ').map((n:string)=>n[0]).join('').slice(0,2)

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div className="section-heading glow" style={{ fontSize:22.5 }}>Power Centres — Responsible</div>
        <button className="btn btn-brand btn-sm" onClick={()=>{const n={name:'New Person',title:'',budget:'',relationship:'Cold',img:''};setRows(p=>[...p,n]);setEditIdx(rows.length);setEditData({...n})}}>
          <Plus size={13}/> Add Person
        </button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {rows.map((row, i) => {
          const sc = getColor(row.relationship)
          const av = AVATARS[i%AVATARS.length]
          return (
            <div key={i} style={{ border:`1px solid var(--border)`, borderRadius:14, overflow:'hidden', background:'var(--bg-surface)', boxShadow:'var(--glow-card)', transition:'all 200ms' }}
              onMouseEnter={e=>(e.currentTarget.style.boxShadow='var(--glow-card-hover)')}
              onMouseLeave={e=>(e.currentTarget.style.boxShadow='var(--glow-card)')}>
              {/* Header band */}
              <div style={{ height:5, background:`linear-gradient(90deg, ${sc}, ${sc}44)` }}/>
              <div style={{ padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  {/* Avatar */}
                  <div style={{ width:46, height:46, borderRadius:'50%', background:av, border:`2px solid ${av}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, color:'#fff', fontFamily:'Sora,sans-serif', flexShrink:0, boxShadow:`0 4px 12px ${av}55` }}>
                    {initials(row.name||'?')}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:22.5, fontWeight:800, color:'var(--text-1)', fontFamily:'Sora,sans-serif', letterSpacing:'-0.01em' }}>{row.name}</div>
                    <div style={{ fontSize:19.5, color:'var(--text-2)', fontWeight:600 }}>{row.title}</div>
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:`${sc}18`, color:sc, fontSize:16, fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:sc, boxShadow:`0 0 6px ${sc}` }}/>{row.relationship.split(' —')[0]}
                  </span>
                  <div style={{ display:'flex', gap:4 }}>
                    <button onClick={()=>{setEditIdx(i);setEditData({...row})}} style={{ width:26, height:26, borderRadius:7, border:'1px solid var(--border)', background:'var(--bg-raised)', cursor:'pointer', fontSize:18, color:'var(--text-3)', display:'flex', alignItems:'center', justifyContent:'center' }}>✏️</button>
                    <button onClick={()=>{const n=rows.filter((_:any,xi:number)=>xi!==i);setRows(n);onChange(n)}} style={{ width:26, height:26, borderRadius:7, border:'1px solid var(--red)', background:'var(--red-bg)', cursor:'pointer', fontSize:18, color:'var(--red)', display:'flex', alignItems:'center', justifyContent:'center' }}><Trash2 size={10}/></button>
                  </div>
                </div>
                <div style={{ fontSize:20.5, color:'var(--text-2)', lineHeight:1.6 }}>{row.budget}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit modal */}
      {editIdx!==null && editData && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ width:460, padding:26 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <span style={{ fontSize:24, fontWeight:800, color:'var(--text-1)', fontFamily:'Sora,sans-serif' }}>Edit Person</span>
              <button onClick={()=>setEditIdx(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)' }}><X size={18}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[{label:'Name',key:'name'},{label:'Title',key:'title'},{label:'Budget Authority',key:'budget'}].map(f=>(
                <div key={f.key}>
                  <div className="label" style={{ marginBottom:5 }}>{f.label}</div>
                  <input className="input" value={editData[f.key]||''} onChange={e=>setEditData((d:any)=>({...d,[f.key]:e.target.value}))}/>
                </div>
              ))}
              <div>
                <div className="label" style={{ marginBottom:5 }}>Relationship</div>
                <select className="select" value={editData.relationship||'Cold'} onChange={e=>setEditData((d:any)=>({...d,relationship:e.target.value}))}>
                  {['Cold','Warm','Active','Warm — ACTIVE','Cold — HIGHEST PRIORITY'].map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:20 }}>
              <button className="btn btn-ghost" onClick={()=>setEditIdx(null)}>Cancel</button>
              <button className="btn btn-brand" onClick={()=>{
                const n=rows.map((r:any,xi:number)=>xi===editIdx?{...editData}:r)
                setRows(n); onChange(n); setEditIdx(null)
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Full presentation HTML export ─────────────────────────────────────────────
function buildPresentationHtml(
  accountName: string,
  plan: any,
  sectionData: Record<string,any>
): string {
  const navy='#1B365D', gold='#D4AF37', goldM='#b89428', teal='#0891b2', green='#10b981', red='#dc2626'
  const esc = (s:any) => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

  // get() — prefers live sectionData (from React state, always up to date after v11 fix)
  // falls back to plan static seed
  const get = (key: string, fallback: string) => {
    const sd = sectionData[key]
    if (sd !== undefined && sd !== null && !(Array.isArray(sd) ? sd.length === 0 : Object.keys(sd).length === 0)) return sd
    return plan?.[fallback] ?? null
  }

  const accountContext:   any   = get('Account Context',            'accountContext')   ?? {}
  const accountPriority:  any[] = (() => { const d = get('Account Priority', 'accountPriority'); return Array.isArray(d) ? d : [] })()
  const bigBetsRaw:       any   = get('Our Big Bets',               'bigBets')
  // OurBigBetsView emits {bigBets:[...], nudgeBigBets:[...]} OR the raw bigBets array
  const bigBets:          any[] = (() => {
    if (!bigBetsRaw) return []
    if (bigBetsRaw?.bigBets) return bigBetsRaw.bigBets
    if (Array.isArray(bigBetsRaw)) return bigBetsRaw
    return []
  })()
  const powerCentres:     any[] = (() => { const d = get('Power Centres Responsible', 'powerCentres'); return Array.isArray(d) ? d : [] })()
  const emergingPipeline: any   = get('Emerging Pipeline',          'emergingPipeline') ?? {}
  const inferencesRaw:    any   = get('Inferences',                 'inferences')
  // InferencesView edits SWOT (S/W/O/T). The PPT needs inferences[].
  // Use the raw inferences array from plan seed as the canonical source.
  const inferences:       any[] = (() => {
    if (Array.isArray(inferencesRaw)) return inferencesRaw
    if (Array.isArray(inferencesRaw?.inferences)) return inferencesRaw.inferences
    // Fall back to plan seed inferences directly
    return plan?.inferences ?? []
  })()
  const recapRaw:         any   = get('Account Review Recap',       'accountReviewRecap') ?? {}
  // Always normalise to rows[] format — handles both {rows:[...]} and nested object
  const recapRows:        any[] = (() => {
    if (Array.isArray(recapRaw?.rows)) return recapRaw.rows
    if (Array.isArray(recapRaw)) return recapRaw
    // Nested {[group]:{[bu]:{left,update,next}}} shape
    const groups = ['Significant GTM Development','Significant Deal / RFP / RFI Updates','Miscellaneous Updates','Significant Delivery Updates']
    const bus = ['ECS','EMS','OTHERS']
    if (groups.some(g => recapRaw?.[g])) {
      return groups.flatMap(g => bus.map(b => ({
        category: g, bu: b,
        whereWeLeftOff:   recapRaw[g]?.[b]?.left   || '',
        updateOnProgress: recapRaw[g]?.[b]?.update || '',
        nextSteps:        recapRaw[g]?.[b]?.next   || '',
      })))
    }
    return []
  })()

  const RECAP_GROUPS = ['Significant GTM Development','Significant Deal / RFP / RFI Updates','Miscellaneous Updates','Significant Delivery Updates']
  const BUS = ['ECS','EMS','OTHERS']

  const sh = (title:string, sub:string, accent:string) =>
    `<div class="sh"><div class="sh-bar" style="background:${accent}"></div><div><h2>${esc(title)}</h2><p>${esc(sub)}</p></div></div>`

  const urgColor = (u:string) => u==='urgent'||u==='IMMEDIATE'||u==='CRITICAL'?red : u==='high'||u==='Q3 2026'||u==='THIS WEEK'?goldM : navy

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(accountName)} — Account Plan</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'Source Sans 3',sans-serif;background:#f2f5fb;color:${navy};}

/* ── Back button (fixed top-left) ── */
.back-btn{
  position:fixed;top:16px;left:16px;z-index:200;
  display:flex;align-items:center;gap:8px;
  padding:9px 18px;border-radius:8px;
  background:${navy};color:#fff;
  font-size:13px;font-weight:700;font-family:'Source Sans 3',sans-serif;
  border:none;cursor:pointer;
  box-shadow:0 4px 16px rgba(27,54,93,0.35);
  text-decoration:none;
  transition:background 0.15s;
}
.back-btn:hover{background:#243e6b;}

/* ── Side nav ── */
nav.side{
  position:fixed;top:0;left:0;bottom:0;width:220px;z-index:100;
  background:#0f1e36;border-right:1px solid rgba(212,175,55,0.18);
  padding:64px 10px 20px;overflow-y:auto;
}
nav.side .brand{
  font-family:'Playfair Display',serif;font-size:15px;font-weight:700;
  color:#fff;padding:0 10px 4px;line-height:1.3;
}
nav.side .brand small{
  display:block;font-family:'Source Sans 3',sans-serif;
  font-size:10px;font-weight:600;color:#e8c547;margin-top:3px;
}
nav.side .grp{
  font-size:9px;font-weight:800;letter-spacing:.14em;
  color:rgba(212,175,55,0.55);text-transform:uppercase;
  padding:14px 10px 6px;
}
nav.side a{
  display:flex;align-items:center;gap:9px;color:rgba(255,255,255,0.6);
  text-decoration:none;font-size:12.5px;font-weight:500;
  padding:8px 12px;border-radius:8px;margin-bottom:2px;transition:all .15s;
}
nav.side a .n{font-size:10px;opacity:.55;width:18px;font-weight:700;}
nav.side a:hover{color:#e8c547;background:rgba(212,175,55,0.12);}

/* ── Layout ── */
.wrap{margin-left:220px;}
section.slide{
  min-height:100vh;padding:56px 64px;
  display:flex;flex-direction:column;
  border-bottom:1px solid rgba(212,175,55,0.08);background:#fff;
}
section.slide.alt{background:#f2f5fb;}

/* ── Section header ── */
.sh{display:flex;align-items:flex-start;gap:16px;margin-bottom:32px;}
.sh-bar{width:5px;min-height:52px;border-radius:3px;flex-shrink:0;margin-top:2px;}
.sh h2{font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:${navy};letter-spacing:-0.02em;line-height:1.15;}
.sh p{font-size:14px;color:#5a7499;margin-top:5px;line-height:1.6;}

/* ── Cards & grids ── */
.card{background:#fff;border:1px solid rgba(27,54,93,0.1);border-radius:14px;padding:20px 24px;box-shadow:0 2px 10px rgba(27,54,93,0.05);}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
.stat{background:#fff;border:1px solid rgba(27,54,93,0.12);border-radius:14px;padding:16px 20px;position:relative;overflow:hidden;box-shadow:0 3px 12px rgba(27,54,93,0.07);}
.stat-bar{position:absolute;top:0;left:0;right:0;height:3px;}
.stat-val{font-family:'Playfair Display',serif;font-size:24px;font-weight:700;letter-spacing:-0.02em;margin-bottom:5px;}
.stat-label{font-size:12.5px;font-weight:700;color:${navy};margin-bottom:2px;}
.stat-note{font-size:11px;color:#5a7499;}

/* ── Priority cards ── */
.p-card{background:#fff;border:1px solid rgba(27,54,93,0.1);border-radius:14px;padding:18px 22px;margin-bottom:12px;box-shadow:0 2px 10px rgba(27,54,93,0.05);}
.badge{display:inline-flex;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;}

/* ── Big Bet cards ── */
.bb{border-left:4px solid ${navy};background:#fff;border-radius:0 14px 14px 0;padding:18px 22px;margin-bottom:14px;border:1px solid rgba(27,54,93,0.1);border-left-width:4px;box-shadow:0 2px 10px rgba(27,54,93,0.05);}

/* ── Power centre cards ── */
.pc{background:#fff;border:1px solid rgba(27,54,93,0.1);border-radius:12px;padding:16px 18px;box-shadow:0 2px 8px rgba(27,54,93,0.05);}

/* ── Inference cards ── */
.inf{display:flex;align-items:flex-start;gap:14px;padding:16px 20px;background:#fff;border:1px solid rgba(27,54,93,0.08);border-radius:0 12px 12px 0;margin-bottom:12px;box-shadow:0 2px 8px rgba(27,54,93,0.04);}

/* ── Recap table ── */
.recap-tbl{width:100%;border-collapse:collapse;font-size:13px;}
.recap-tbl th{background:${navy};color:#fff;padding:10px 13px;text-align:left;font-size:10.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;}
.recap-tbl td{padding:9px 13px;border:1px solid rgba(27,54,93,0.1);vertical-align:top;line-height:1.6;color:#374151;}
.recap-tbl tr:nth-child(even) td{background:#f8fafc;}
.recap-grp{background:linear-gradient(180deg,#f0f4fa,#e8edf6);font-size:11.5px;font-weight:800;color:${navy};text-align:center;vertical-align:middle;}

/* ── Pipeline table ── */
.pipe-tbl{width:100%;border-collapse:collapse;font-size:13px;}
.pipe-tbl th{background:#059669;color:#fff;padding:10px 13px;text-align:left;font-size:10.5px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;}
.pipe-tbl td{padding:9px 13px;border:1px solid rgba(27,54,93,0.1);vertical-align:top;line-height:1.6;}
.pipe-tbl tr:nth-child(even) td{background:#f8fafc;}

/* ── Footer ── */
.footer{padding-top:28px;border-top:1px solid rgba(27,54,93,0.08);text-align:center;color:#5a7499;font-size:12.5px;margin-top:auto;}
.footer b{font-family:'Playfair Display',serif;color:${navy};}

@media print{
  .back-btn{display:none;}
  nav.side{display:none;}
  .wrap{margin-left:0;}
  section.slide{min-height:auto;page-break-after:always;padding:36px;}
}
</style>
</head>
<body>

<!-- Back button — posts message to parent React app to close the iframe -->
<button class="back-btn" onclick="window.parent.postMessage('close-presentation','*')">← Back to Account Planning</button>

<nav class="side">
  <div class="brand">${esc(accountName)}<small>Account Plan</small></div>
  <div class="grp">Account Planning</div>
  <a href="#ac-overview"><span class="n">01</span>Account Context</a>
  <a href="#priority"><span class="n">02</span>Account Priority</a>
  <a href="#bigbets"><span class="n">03</span>Our Big Bets</a>
  <a href="#powercentres"><span class="n">04</span>Power Centres</a>
  <a href="#pipeline"><span class="n">05</span>Emerging Pipeline</a>
  <a href="#inferences"><span class="n">06</span>Inferences</a>
  <a href="#recap"><span class="n">07</span>Review Recap</a>
</nav>

<div class="wrap">

<!-- 01 ── ACCOUNT CONTEXT (part of Account Planning) -->
<section class="slide" id="ac-overview">
  ${sh('Account Context', `${accountName} — organizational overview, performance, partners, pipeline and insights`, navy)}
  ${[
    { label:'Organizational Overview in FY', key:'organizationalOverview', accent:navy },
    { label:'Company Performance',           key:'companyPerformance',     accent:goldM },
    { label:'Key Partners',                  key:'keyPartners',            accent:teal },
    { label:'Pipeline and Therapy Focus',    key:'pipelineAndTherapyFocus',accent:green },
    { label:'Account Insights',              key:'accountInsights',        accent:'#EA580C' },
  ].map(f => {
    const content = accountContext?.[f.key]?.content || ''
    if (!content) return ''
    return `<div style="margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <div style="width:4px;height:20px;border-radius:2px;background:${f.accent};flex-shrink:0;"></div>
        <div style="font-size:13px;font-weight:800;color:${f.accent};text-transform:uppercase;letter-spacing:0.08em;">${esc(f.label)}</div>
      </div>
      <div style="padding:16px 20px;background:#fff;border:1px solid rgba(27,54,93,0.1);border-left:3px solid ${f.accent};border-radius:0 12px 12px 0;box-shadow:0 2px 8px rgba(27,54,93,0.04);">
        <p style="font-size:14.5px;color:${navy};line-height:1.85;margin:0;white-space:pre-wrap;">${esc(content)}</p>
      </div>
    </div>`
  }).join('')}
</section>

<!-- 06 ── ACCOUNT PRIORITY -->
<section class="slide alt" id="priority">
  ${sh('Account Priority', `${accountName} — ranked strategic imperatives and Freyr relevance`, navy)}
  ${(Array.isArray(accountPriority)?accountPriority:[]).map((p:any,i:number)=>{
    const colors=[red,red,goldM,goldM,teal,teal,green]
    const c=colors[i]||navy
    return `<div class="p-card">
      <div style="display:flex;align-items:flex-start;gap:14px;">
        <div style="width:34px;height:34px;border-radius:9px;background:${c}12;border:1px solid ${c}30;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:${c};flex-shrink:0;font-family:'Playfair Display',serif;">${i+1}</div>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:${navy};flex:1;">${esc(p.title)}</div>
            ${p.urgency?`<span class="badge" style="background:${urgColor(p.urgency)}12;color:${urgColor(p.urgency)};border:1px solid ${urgColor(p.urgency)}30;">${esc(p.urgency)}</span>`:''}
          </div>
          <p style="font-size:13.5px;color:#5a7499;line-height:1.7;margin:0 0 10px;">${esc(p.imperative)}</p>
          <div style="padding:9px 13px;background:${c}06;border:1px solid ${c}18;border-radius:7px;">
            <span style="font-size:10px;font-weight:700;color:${c};text-transform:uppercase;letter-spacing:0.1em;">FREYR RELEVANCE </span>
            <span style="font-size:13px;color:${navy};font-weight:600;">${esc(p.freyrRelevance)}</span>
          </div>
        </div>
      </div>
    </div>`
  }).join('')}
</section>

<!-- 07 ── OUR BIG BETS -->
<section class="slide" id="bigbets">
  ${sh('Our Big Bets', `${accountName} — high-priority strategic bets and revenue targets`, gold)}
  ${(Array.isArray(bigBets)?bigBets:[]).map((bu:any,bi:number)=>{
    const buColors=[navy,goldM,teal,green]; const c=buColors[bi%4]
    return `<div style="margin-bottom:24px;">
      <div style="font-size:11px;font-weight:800;color:${c};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
        <div style="width:24px;height:3px;background:${c};border-radius:2px;"></div>BU: ${esc(bu.bu)}
      </div>
      ${(bu.rows||[]).map((r:any)=>`
      <div class="bb" style="border-left-color:${c};">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:10px;">
          <div style="font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:${navy};">${esc(r.focus)}</div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:20px;font-weight:800;color:${c};font-family:'Playfair Display',serif;">$${esc(r.acv)}M</div>
            <div style="font-size:10px;color:#5a7499;font-weight:600;">ACV</div>
          </div>
        </div>
        <ul style="margin:0 0 10px;padding-left:17px;">
          ${(r.details||[]).map((d:string)=>`<li style="font-size:13px;color:#5a7499;line-height:1.65;margin-bottom:3px;">${esc(d)}</li>`).join('')}
        </ul>
        <div style="font-size:12.5px;color:#5a7499;"><b style="color:${navy};">Stakeholder:</b> ${esc(r.stakeholder)} &nbsp;·&nbsp; <b style="color:${navy};">Next Steps:</b> ${esc(r.nextSteps)}</div>
      </div>`).join('')}
    </div>`
  }).join('')}
</section>

<!-- 08 ── POWER CENTRES RESPONSIBLE -->
<section class="slide alt" id="powercentres">
  ${sh('Power Centres Responsible', `${accountName} — key decision-makers, budget authorities and relationship status`, teal)}
  <div class="grid3">
    ${(Array.isArray(powerCentres)?powerCentres:[]).map((p:any,i:number)=>{
      const relKey=(p.relationship||'').toLowerCase().split(' —')[0].trim()
      const relColors:Record<string,string>={cold:navy,warm:gold,hot:red,active:green,'cold — highest priority':red,'warm — active':gold}
      const sc=relColors[relKey]||relColors[p.relationship?.toLowerCase()]||navy
      const initials=(n:string)=>n.split(' ').filter((_:string,i:number)=>i<2).map((w:string)=>w[0]||'').join('').toUpperCase()
      const avColors=['#1B365D','#7C3AED','#059669','#EA580C','#0891b2','#b89428','#dc2626','#10b981']
      const av=avColors[i%avColors.length]
      return `<div class="pc">
        <div style="height:4px;background:linear-gradient(90deg,${sc},${sc}66);margin:-16px -18px 14px;border-radius:12px 12px 0 0;"></div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:40px;height:40px;border-radius:50%;background:${av};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;flex-shrink:0;">${esc(initials(p.name||'?'))}</div>
          <div>
            <div style="font-size:14px;font-weight:800;color:${navy};">${esc(p.name)}</div>
            <div style="font-size:12px;color:#5a7499;">${esc(p.title)}</div>
          </div>
        </div>
        <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;background:${sc}12;color:${sc};font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">
          <span style="width:5px;height:5px;border-radius:50%;background:${sc};"></span>${esc((p.relationship||'').split(' —')[0])}
        </span>
        <div style="font-size:12px;color:#5a7499;margin-bottom:6px;"><b style="color:${navy};">Budget:</b> ${esc(p.budget)}</div>
        <div style="font-size:12px;color:#5a7499;padding:7px 10px;background:rgba(27,54,93,0.04);border-radius:6px;"><b style="color:${navy};">Next:</b> ${esc(p.nextAction)}</div>
      </div>`
    }).join('')}
  </div>
</section>

<!-- 09 ── EMERGING PIPELINE -->
<section class="slide" id="pipeline">
  ${sh('Emerging Pipeline', `${accountName} — pipeline targets and what worked / didn't work`, green)}
  ${typeof emergingPipeline==='object'&&!Array.isArray(emergingPipeline) ? `
  <div style="padding:18px 22px;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:12px;margin-bottom:22px;">
    <div style="font-size:10.5px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">TARGET</div>
    <p style="font-size:15px;color:${navy};line-height:1.85;font-weight:500;margin:0;">${esc(emergingPipeline.target||'')}</p>
  </div>
  <div class="grid2">
    <div class="card">
      <div style="font-size:10.5px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">✅ WHAT WORKED</div>
      ${(emergingPipeline.worked||[]).map((w:string)=>`<div style="display:flex;gap:9px;margin-bottom:9px;align-items:flex-start;"><span style="color:#059669;font-size:14px;flex-shrink:0;margin-top:1px;">•</span><p style="font-size:13.5px;color:${navy};line-height:1.65;margin:0;">${esc(w)}</p></div>`).join('')}
    </div>
    <div class="card">
      <div style="font-size:10.5px;font-weight:700;color:${red};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">❌ WHAT DIDN'T WORK</div>
      ${(emergingPipeline.didntWork||[]).map((w:string)=>`<div style="display:flex;gap:9px;margin-bottom:9px;align-items:flex-start;"><span style="color:${red};font-size:14px;flex-shrink:0;margin-top:1px;">•</span><p style="font-size:13.5px;color:${navy};line-height:1.65;margin:0;">${esc(w)}</p></div>`).join('')}
    </div>
  </div>` : ''}
</section>

<!-- 10 ── INFERENCES -->
<section class="slide alt" id="inferences">
  ${sh('Inferences', `${accountName} — triangulated signals and strategic implications`, goldM)}
  ${(Array.isArray(inferences)?inferences:[]).map((inf:any)=>{
    const c=urgColor(inf.urgency||'')
    return `<div class="inf" style="border-left:4px solid ${c};">
      <div style="display:flex;flex-direction:column;gap:10px;flex:1;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
          <div style="font-size:14.5px;font-weight:700;color:${navy};line-height:1.4;flex:1;">${esc(inf.signal)}</div>
          ${inf.urgency?`<span class="badge" style="flex-shrink:0;background:${c}12;color:${c};border:1px solid ${c}28;">${esc(inf.urgency)}</span>`:''}
        </div>
        <div style="padding:10px 14px;background:rgba(27,54,93,0.04);border-radius:8px;">
          <div style="font-size:10px;font-weight:700;color:${goldM};text-transform:uppercase;letter-spacing:0.1em;margin-bottom:5px;">IMPLICATION</div>
          <p style="font-size:13.5px;color:${navy};line-height:1.7;margin:0;">${esc(inf.implication)}</p>
        </div>
      </div>
    </div>`
  }).join('')}
</section>

<!-- 11 ── ACCOUNT REVIEW RECAP -->
<section class="slide" id="recap">
  ${sh('Account Review Recap', 'What changed since last account review — by category and business unit', navy)}
  <div style="overflow-x:auto;">
    <table class="recap-tbl">
      <thead>
        <tr>
          <th style="width:150px;">Category</th>
          <th style="width:55px;">BU</th>
          <th>Where We Left Off</th>
          <th>Update on Progress</th>
          <th>Next Steps</th>
        </tr>
      </thead>
      <tbody>
        ${RECAP_GROUPS.map(group => {
          const groupRows = BUS.map(bu => {
            const row = recapRows.find((r:any)=>r.category===group&&r.bu===bu)||{}
            return { bu, left:row.whereWeLeftOff||'—', update:row.updateOnProgress||'—', next:row.nextSteps||'—' }
          })
          return groupRows.map((r,ri) => `
          <tr>
            ${ri===0?`<td rowspan="3" class="recap-grp" style="border:1px solid rgba(27,54,93,0.12);padding:10px 8px;">${esc(group)}</td>`:''}
            <td style="font-weight:700;color:${navy};font-size:11.5px;border:1px solid rgba(27,54,93,0.12);">${esc(r.bu)}</td>
            <td style="border:1px solid rgba(27,54,93,0.12);">${esc(r.left)}</td>
            <td style="border:1px solid rgba(27,54,93,0.12);">${esc(r.update)}</td>
            <td style="border:1px solid rgba(27,54,93,0.12);">${esc(r.next)}</td>
          </tr>`).join('')
        }).join('')}
      </tbody>
    </table>
  </div>
  <div class="footer" style="margin-top:48px;">
    <b>The Nudge Intelligence · Powered by Freyr Solutions</b>
    <div style="margin-top:4px;">Confidential — internal use only · June 2026</div>
  </div>
</section>

</div>
</body>
</html>`
}
// ── Account Context View ──────────────────────────────────────────────────────
const AC_FIELDS = [
  { key:'organizationalOverview', label:'Organizational Overview in FY' },
  { key:'companyPerformance',     label:'Company Performance'           },
  { key:'keyPartners',            label:'Key Partners'                  },
  { key:'pipelineAndTherapyFocus',label:'Pipeline and Therapy Focus'    },
  { key:'accountInsights',        label:'Account Insights'              },
]

function AccountContextView({ planData, publishedData, onChange }: { planData:any; publishedData?:any; onChange:(d:any)=>void }) {
  // Seed: prefer publishedData (from DB), then planData seed, then empty
  const initContent = (key: string): string => {
    if (publishedData?.[key]?.content) return publishedData[key].content
    return planData?.accountContext?.[key]?.content || ''
  }

  const [fields, setFields] = useState<Record<string,string>>(() => {
    const init: Record<string,string> = {}
    AC_FIELDS.forEach(f => { init[f.key] = initContent(f.key) })
    return init
  })

  // Emit on mount so Save/Publish always has data
  useEffect(() => {
    const shaped: Record<string,any> = {}
    AC_FIELDS.forEach(f => { shaped[f.key] = { content: fields[f.key] } })
    onChange(shaped)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (key: string, val: string) => {
    const next = { ...fields, [key]: val }
    setFields(next)
    const shaped: Record<string,any> = {}
    AC_FIELDS.forEach(f => { shaped[f.key] = { content: next[f.key] } })
    onChange(shaped)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h3 style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color:'var(--navy)', margin:0 }}>Account Context</h3>
      </div>

      {AC_FIELDS.map((f, i) => (
        <div key={f.key} style={{ marginBottom:22 }}>
          {/* Field label */}
          <div style={{ fontSize:16, fontWeight:700, color:'var(--text-2)', marginBottom:8, fontFamily:'Source Sans Pro,sans-serif' }}>
            {f.label}
          </div>
          {/* Textarea */}
          <textarea
            value={fields[f.key]}
            onChange={e => handleChange(f.key, e.target.value)}
            placeholder={f.label}
            rows={5}
            style={{
              width:'100%', padding:'14px 18px',
              borderRadius:8, border:'1px solid var(--border)',
              background:'var(--bg-surface)', color:'var(--text-1)',
              fontSize:16, fontFamily:'Source Sans Pro,sans-serif',
              lineHeight:1.75, resize:'vertical', outline:'none',
              transition:'border-color 180ms',
            }}
            onFocus={e => e.target.style.borderColor='var(--brand-2)'}
            onBlur={e  => e.target.style.borderColor='var(--border)'}
          />
        </div>
      ))}

      <p style={{ fontSize:15, color:'var(--text-3)', fontStyle:'italic', fontFamily:'Source Sans Pro,sans-serif', marginTop:4 }}>
        Edit any field above then click Save Draft or Publish — changes will reflect in Open Presentation and Download HTML.
      </p>
    </div>
  )
}

// ── Executive Briefing ────────────────────────────────────────────────────────
function ExecutiveBriefingView({ accountName, plan, sectionData }: { accountName:string; plan:any; sectionData:Record<string,any> }) {
  const [presenting, setPresenting] = useState(false)
  const [iframeSrc, setIframeSrc] = useState('')

  const buildHtml = () => buildPresentationHtml(accountName, plan, sectionData)

  // Open inline — generate blob URL and render in an iframe overlay
  const handleOpen = () => {
    const html = buildHtml()
    const blob = new Blob([html], { type:'text/html' })
    const url  = URL.createObjectURL(blob)
    setIframeSrc(url)
    setPresenting(true)
  }

  const handleClose = () => {
    setPresenting(false)
    if (iframeSrc) URL.revokeObjectURL(iframeSrc)
    setIframeSrc('')
  }

  // Download as HTML file
  const handleDownload = () => {
    const html = buildHtml()
    const blob = new Blob([html], { type:'text/html' })
    const url  = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Account-Plan-${accountName.replace(/\s+/g,'-')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {/* ── Fullscreen iframe overlay ── */}
      {presenting && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#f2f5fb', display:'flex', flexDirection:'column' }}>
          {/* Close bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px', background:'#0f1e36', flexShrink:0, borderBottom:'1px solid rgba(212,175,55,0.2)' }}>
            <span style={{ fontSize:16, fontWeight:700, color:'rgba(255,255,255,0.8)', fontFamily:'Source Sans Pro,sans-serif', letterSpacing:'-0.01em' }}>
              {accountName} — Account Plan
            </span>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleDownload} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 18px', borderRadius:8, background:'rgba(212,175,55,0.18)', border:'1px solid rgba(212,175,55,0.4)', color:'#e8c547', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'Source Sans Pro,sans-serif' }}>
                <Download size={14}/> Download HTML
              </button>
              <button onClick={handleClose} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 20px', borderRadius:8, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'Source Sans Pro,sans-serif' }}>
                ✕ Close Presentation
              </button>
            </div>
          </div>
          <iframe
            src={iframeSrc}
            style={{ flex:1, border:'none', width:'100%' }}
            title="Account Plan Presentation"
            onLoad={e => {
              // Listen for postMessage from iframe "back" button so it closes the overlay
              const handler = (ev: MessageEvent) => { if (ev.data === 'close-presentation') handleClose() }
              window.addEventListener('message', handler)
              ;(e.target as any)._closeHandler = handler
            }}
          />
        </div>
      )}

      {/* ── Executive Briefing card ── */}
      <div style={{ background:'var(--navy)', borderRadius:'var(--radius-md)', padding:'28px 32px', marginBottom:16, border:'1px solid var(--navy-mid)', boxShadow:'var(--shadow-md)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, var(--gold), var(--gold-bright), #f0c96a)' }}/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <div>
            <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'0.16em', color:'var(--gold-bright)', textTransform:'uppercase', marginBottom:5, fontFamily:'Source Sans Pro,sans-serif' }}>EXECUTIVE BRIEFING</div>
            <div style={{ fontFamily:'Playfair Display,serif', fontSize:22, color:'#fff' }}>{accountName}</div>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button onClick={handleDownload}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:8, background:'rgba(212,175,55,0.15)', border:'1px solid rgba(212,175,55,0.4)', color:'var(--gold-bright)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Source Sans Pro,sans-serif' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(212,175,55,0.28)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(212,175,55,0.15)'}>
              <Download size={13}/> Download HTML
            </button>
            <button onClick={handleOpen}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 22px', borderRadius:8, background:'var(--gold)', border:'none', color:'var(--navy)', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:'Source Sans Pro,sans-serif', boxShadow:'0 4px 14px rgba(212,175,55,0.4)' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--gold-bright)'}
              onMouseLeave={e=>e.currentTarget.style.background='var(--gold)'}>
              Open Presentation <ArrowRight size={14}/>
            </button>
          </div>
        </div>
        {(plan?.executiveBriefing||[]).map((s:any,i:number) => (
          <div key={i} style={{ marginBottom:18, paddingBottom:18, borderBottom:i<(plan.executiveBriefing.length-1)?'1px solid rgba(255,255,255,0.07)':'none' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--gold-bright)', marginBottom:6, fontFamily:'Source Sans Pro,sans-serif', letterSpacing:'0.04em' }}>{s.heading}</div>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.8, margin:0, fontFamily:'Source Sans Pro,sans-serif' }}>{s.body}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize:12.5, color:'var(--text-3)', textAlign:'center', fontFamily:'Source Sans Pro,sans-serif', fontStyle:'italic' }}>
        "Open Presentation" opens inline with a back button · "Download HTML" saves an offline copy
      </p>
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AccountPlanningPage() {
  const [selectedId, setSelectedId] = useState('revance')
  const [browseBy, setBrowseBy] = useState('Executive Briefing')

  // ── Persistent section data: keyed by section name, value = latest published data ──
  // This is the single source of truth for buildPresentationHtml.
  // It is populated on mount from DB/localStorage and updated on every Publish.
  const [publishedData, setPublishedData] = useState<Record<string,any>>({})

  // In-session edits (not yet saved). Reset when account changes.
  const [sectionData, setSectionData]   = useState<Record<string,any>>({})
  const [dbSections,  setDbSections]    = useState<any[]>([])  // raw PlanSection[] from DB
  const [loadingDB,   setLoadingDB]     = useState(true)
  const [toast, setToast] = useState<{msg:string;type:string}|null>(null)

  const plan    = ACCOUNT_PLAN[selectedId]
  const account = ACCOUNTS_LIST.find(a=>a.id===selectedId)

  // ── Load all sections for this account from DB/localStorage on mount & account change ──
  useEffect(() => {
    setLoadingDB(true)
    setSectionData({})          // clear in-session edits when account changes
    getAllPlanSections(selectedId).then(sections => {
      setDbSections(sections)
      // Build publishedData map: latest published row per section key
      const pub: Record<string,any> = {}
      BROWSE_BY_OPTIONS.forEach(key => {
        if (key === 'Executive Briefing') return  // briefing has its own storage
        const latest = getLatestPublishedSection(sections, key)
        if (latest) pub[key] = latest.data
      })
      setPublishedData(pub)
      setLoadingDB(false)
    })
  }, [selectedId])

  const vhook = useVersioning(
    browseBy.replace(/\s+/g,'_').toLowerCase(), selectedId,
    plan ? (plan as any)[browseBy.replace(/[\s/]/g,'').toLowerCase()] : {}
  )

  const showToast = (msg:string, type='success') => {
    setToast({msg,type}); setTimeout(()=>setToast(null), 2800)
  }

  // ── Get next version number for a section ──────────────────────────────────
  const getNextVersion = (sectionKey: string): number => {
    const published = dbSections.filter(s => s.section_key === sectionKey && !s.is_draft)
    return published.length > 0 ? Math.max(...published.map((s:any) => s.version_number)) + 1 : 1
  }

  // ── Save Draft: persist to DB as draft ────────────────────────────────────
  const handleSave = useCallback(async () => {
    const data = sectionData[browseBy]
    if (!data || browseBy === 'Executive Briefing') {
      vhook.saveDraft(data || {}); showToast('Saved as Draft ✓'); return
    }
    // Find existing draft for this section, or create new
    const existingDraft = getLatestDraftSection(dbSections, browseBy)
    const version = existingDraft?.version_number ?? getNextVersion(browseBy)
    const row = await savePlanSection({
      id: existingDraft?.id,
      account_id: selectedId,
      section_key: browseBy,
      version_number: version,
      data,
      saved_at: new Date().toISOString(),
      is_draft: true,
    })
    setDbSections(prev => {
      const idx = prev.findIndex(s => s.id === row.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = row; return n }
      return [row, ...prev]
    })
    vhook.saveDraft(data)
    showToast('Saved as Draft ✓')
  }, [browseBy, sectionData, selectedId, dbSections, vhook])

  // ── Publish: mark draft as published, update publishedData ────────────────
  const handlePublish = useCallback(async () => {
    const data = sectionData[browseBy] ?? publishedData[browseBy]
    if (!data || browseBy === 'Executive Briefing') {
      vhook.saveDraft(data || {}); vhook.publish(); showToast('Published ✓'); return
    }
    const existingDraft = getLatestDraftSection(dbSections, browseBy)
    const version = existingDraft?.version_number ?? getNextVersion(browseBy)
    const row = await savePlanSection({
      id: existingDraft?.id,
      account_id: selectedId,
      section_key: browseBy,
      version_number: version,
      data,
      saved_at: new Date().toISOString(),
      is_draft: false,  // ← mark as published
    })
    setDbSections(prev => {
      const idx = prev.findIndex(s => s.id === row.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = row; return n }
      return [row, ...prev]
    })
    // Update publishedData so next PPT generation picks it up immediately
    setPublishedData(prev => ({ ...prev, [browseBy]: data }))
    vhook.saveDraft(data); vhook.publish()
    showToast('Published ✓ — PPT will reflect this data')
  }, [browseBy, sectionData, publishedData, selectedId, dbSections, vhook])

  const handleChange = (d:any) => setSectionData(prev=>({...prev,[browseBy]:d}))

  // ── Merged data for PPT: published DB data > static seed ──────────────────
  // This is what buildPresentationHtml receives. It merges:
  //   1. In-session edits (sectionData) — only available in current tab session
  //   2. Published DB data (publishedData) — persisted across sessions
  //   3. Static seed (ACCOUNT_PLAN) — fallback if nothing ever published
  const pptData: Record<string,any> = {}
  BROWSE_BY_OPTIONS.forEach(key => {
    pptData[key] = sectionData[key] ?? publishedData[key] ?? undefined
  })

  return (
    <div>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:15, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-3)', fontFamily:'Nunito,sans-serif' }}>BROWSE BY</span>
          <select className="select" value={browseBy} onChange={e=>setBrowseBy(e.target.value)} style={{ fontWeight:700, color:'var(--brand-2)', fontSize:16 }}>
            {BROWSE_BY_OPTIONS.map(opt=><option key={opt}>{opt}</option>)}
          </select>
        </div>
        <button className="btn btn-ghost btn-icon btn-icon-sm" title="Refresh" onClick={()=>{ setLoadingDB(true); getAllPlanSections(selectedId).then(s=>{ setDbSections(s); const pub:Record<string,any>={}; BROWSE_BY_OPTIONS.forEach(k=>{ if(k==='Executive Briefing') return; const l=getLatestPublishedSection(s,k); if(l) pub[k]=l.data }); setPublishedData(pub); setLoadingDB(false) }) }}><RefreshCw size={14}/></button>
        <VersionToolbar vhook={vhook} onSave={handleSave} onPublish={handlePublish}/>
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        {/* Company row */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 22px', borderBottom:'1px solid var(--border)', background:'var(--bg-raised)' }}>
          <div style={{ width:4, height:26, borderRadius:3, background:'var(--brand-2)', flexShrink:0 }}/>
          <select className="select" value={selectedId} onChange={e=>setSelectedId(e.target.value)} style={{ maxWidth:400 }}>
            {ACCOUNTS_LIST.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          {/* Show which data source the current section's PPT will use */}
          {browseBy !== 'Executive Briefing' && (
            <span style={{ marginLeft:'auto', fontSize:15, color:'var(--text-3)', fontStyle:'italic' }}>
              PPT uses: {sectionData[browseBy] ? '✏️ unsaved session edit' : publishedData[browseBy] ? '✅ published v' + (getLatestPublishedSection(dbSections, browseBy)?.version_number ?? '?') : '📦 static seed data'}
            </span>
          )}
        </div>

        {/* Section title */}
        <div style={{ padding:'16px 22px 0', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:5, height:22, borderRadius:3, background:'var(--brand-2)', boxShadow:'var(--glow-sm)' }}/>
          <span className="section-heading glow" style={{ fontSize:22 }}>{browseBy}</span>
        </div>

        {/* Content */}
        <div style={{ padding:'18px 22px 28px' }}>
          {plan && browseBy==='Executive Briefing'        && <ExecutiveBriefingView accountName={account?.name||''} plan={plan} sectionData={pptData}/>}
          {plan && browseBy==='Account Context'            && <AccountContextView planData={plan} publishedData={publishedData['Account Context']} onChange={handleChange}/>}
          {plan && browseBy==='Account Priority'          && <AccountPriorityView planData={plan} publishedData={publishedData['Account Priority']} onChange={handleChange}/>}
          {plan && browseBy==='Our Big Bets'              && <OurBigBetsView planData={plan} publishedData={publishedData['Our Big Bets']} onChange={handleChange}/>}
          {plan && browseBy==='Power Centres Responsible' && <PowerCentresView planData={plan} publishedData={publishedData['Power Centres Responsible']} onChange={handleChange}/>}
          {plan && browseBy==='Emerging Pipeline'         && <EmergingPipelineView planData={plan} publishedData={publishedData['Emerging Pipeline']} onChange={handleChange}/>}
          {plan && browseBy==='Inferences'                && <InferencesView planData={plan} publishedData={publishedData['Inferences']} onChange={handleChange}/>}
          {plan && browseBy==='Account Review Recap'      && <AccountReviewRecapView planData={plan} publishedData={publishedData['Account Review Recap']} onChange={handleChange}/>}
          {!plan && <div style={{ padding:'40px', textAlign:'center', color:'var(--text-3)' }}>Select an account to view.</div>}
        </div>
      </div>

      {toast && <div className={`toast ${toast.type==='success'?'toast-success':'toast-error'}`}>{toast.msg}</div>}
    </div>
  )
}
