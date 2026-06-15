import { useState, useEffect, createContext, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { X, ArrowRight, ChevronDown, ChevronRight, ArrowLeft, Zap, CheckCircle2, Users } from 'lucide-react'
import { ACCOUNT_INFO, ACCOUNTS_LIST, NEWS_INTERNAL, NEWS_EXTERNAL_REVANCE, NEWS_EXTERNAL_TAKEDA, NUDGE_PROFILE } from '../../data'
import { localGet } from '../../lib/supabase'

// ─── LAYERED NAV STRUCTURE ────────────────────────────────────────────────────
const NAV_LAYERS = [
  {
    id: 'account-layer',
    label: 'Account Layer',
    color: '#1B6BC0',
    icon: '📊',
    description: "What's happening?",
    items: [
      { id:'nudge',          label:'Account Intelligence', icon:'⚡' },
      { id:'news',           label:'News Intelligence',    icon:'📰' },
      { id:'one-min',        label:'One Minute Summary',   icon:'⏱' },
      { id:'financial',      label:'Financial Snapshot',   icon:'💰' },
      { id:'swot',           label:'SWOT Analysis',        icon:'🔷' },
    ]
  },
  {
    id: 'business-layer',
    label: 'Business Layer',
    color: '#7C3AED',
    icon: '👥',
    description: 'Why is it happening?',
    items: [
      { id:'org-leadership', label:'Key Stakeholders',     icon:'👤' },
      { id:'strategic',      label:'Strategic Priorities', icon:'🎯' },
      { id:'right-to-win',   label:'Right to Win',         icon:'🏆' },
      { id:'freyr-play',     label:'Freyr Opportunities',  icon:'💡' },
    ]
  },
  {
    id: 'growth-layer',
    label: 'Growth Layer',
    color: '#059669',
    icon: '🎯',
    description: 'Where can we win?',
    items: [
      { id:'revenue-target', label:'Revenue Target',       icon:'📈' },
      { id:'pipeline',       label:'Pipeline Insights',    icon:'🔬' },
      { id:'play-areas',     label:'Play Areas',           icon:'🗺' },
      { id:'investment',     label:'Investment Strategy',  icon:'💎' },
    ]
  },
  {
    id: 'execution-layer',
    label: 'Execution Layer',
    color: '#EA580C',
    icon: '⚡',
    description: 'What should we do?',
    items: [
      { id:'next-action',    label:'Next Best Actions',    icon:'🚀' },
      { id:'90day-plan',     label:'90-Day Action Plan',   icon:'📅' },
      { id:'big-bets',       label:'Big Bets',             icon:'🎲' },
    ]
  },
  {
    id: 'workspace-layer',
    label: 'Workspace',
    color: '#6B7280',
    icon: '📋',
    description: 'How will we stay aligned?',
    items: [
      { id:'notes',          label:'Notes & Download',     icon:'📝' },
    ]
  },
]

// flat list for backward-compat (Slide matching)
const NAV_SECTIONS = NAV_LAYERS.flatMap(l => l.items)

const Ctx = createContext<string>('nudge')

function Slide({ id, children }: { id:string; children:React.ReactNode }) {
  const a = useContext(Ctx)
  if (a !== id) return null
  return <section style={{ animation:'pageIn 220ms ease both' }}>{children}</section>
}

// ─── HIGHLIGHTED SIGNAL CARD ─────────────────────────────────────────────────
function NudgeSignalCard({ text }: { text:string }) {
  return (
    <div style={{ background:'linear-gradient(135deg,#1B365D 0%,#244878 100%)', border:'1px solid rgba(212,175,55,0.35)', borderLeft:'5px solid #D4AF37', borderRadius:12, padding:'20px 24px', marginBottom:18, boxShadow:'0 4px 20px rgba(27,54,93,0.3)' }}>
      <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
        <Zap size={20} style={{ color:'#D4AF37', flexShrink:0, marginTop:2 }}/>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(212,175,55,0.9)', letterSpacing:'0.16em', textTransform:'uppercase', marginBottom:8, fontFamily:'Source Sans Pro,sans-serif' }}>NUDGE INTELLIGENCE SIGNAL</div>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.94)', lineHeight:1.75, margin:0, fontFamily:'Source Sans Pro,sans-serif' }}>{text}</p>
        </div>
      </div>
    </div>
  )
}

// ─── HIGHLIGHTED FREYR IMPLICATION CARD ──────────────────────────────────────
function FreyrCard({ text }: { text:string }) {
  return (
    <div style={{ background:'linear-gradient(135deg,rgba(212,175,55,0.14) 0%,rgba(212,175,55,0.06) 100%)', border:'1.5px solid rgba(212,175,55,0.45)', borderLeft:'5px solid #D4AF37', borderRadius:12, padding:'18px 22px', marginBottom:22, boxShadow:'0 2px 12px rgba(212,175,55,0.12)' }}>
      <div style={{ fontSize:11, fontWeight:700, color:'#b89428', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:8, fontFamily:'Source Sans Pro,sans-serif' }}>WHAT THIS MEANS FOR FREYR</div>
      <p style={{ fontSize:16, color:'#7a5c00', lineHeight:1.75, margin:0, fontWeight:500, fontFamily:'Source Sans Pro,sans-serif' }}>{text}</p>
    </div>
  )
}

function SecHeader({ title, sub, accent }: { title:string; sub?:string; accent?:string }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:26 }}>
      <div style={{ width:5, minHeight:50, borderRadius:3, background:accent||'var(--gold)', flexShrink:0, marginTop:2 }}/>
      <div>
        <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:20.5, fontWeight:700, color:'var(--navy)', letterSpacing:'-0.02em', lineHeight:1.15, margin:'0 0 6px' }}>{title}</h2>
        {sub && <p style={{ fontSize:16, color:'var(--text-3)', lineHeight:1.6, margin:0, fontFamily:'Source Sans Pro,sans-serif' }}>{sub}</p>}
      </div>
    </div>
  )
}

// ─── EXPANDABLE INSIGHT CARD ──────────────────────────────────────────────────
function InsightCard({ index, title, body, bullets, badge, badgeColor, extra, numbered=true, accent='var(--navy)' }:
  { index:number; title:string; body?:string; bullets?:string[]; badge?:string; badgeColor?:string; extra?:React.ReactNode; numbered?:boolean; accent?:string }) {
  const [open, setOpen] = useState(false)
  const has = !!(body||(bullets&&bullets.length>0)||extra)
  const bc = badgeColor||accent
  return (
    <div onClick={()=>has&&setOpen(o=>!o)} style={{ border:'1px solid var(--border)', borderLeft:`4px solid ${accent}`, borderRadius:'0 12px 12px 0', background:'var(--bg-surface)', boxShadow:open?'0 4px 20px rgba(27,54,93,0.1)':'var(--glow-card)', cursor:has?'pointer':'default', transition:'box-shadow 200ms', marginBottom:10, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'16px 20px' }}>
        {numbered && <div style={{ width:30, height:30, borderRadius:8, background:`${accent}14`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:accent, flexShrink:0, border:`1px solid ${accent}22`, fontFamily:'Playfair Display,serif' }}>{index+1}</div>}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:8, justifyContent:'space-between' }}>
            <p style={{ fontSize:15.5, color:'var(--navy)', lineHeight:1.5, margin:0, fontWeight:600, flex:1, fontFamily:'Source Sans Pro,sans-serif' }}>{title}</p>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              {badge && <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:`${bc}15`, color:bc, border:`1px solid ${bc}33`, whiteSpace:'nowrap' }}>{badge}</span>}
              {has && <ChevronDown size={14} style={{ color:'var(--text-3)', transform:open?'rotate(180deg)':'none', transition:'transform 200ms' }}/>}
            </div>
          </div>
        </div>
      </div>
      {open && has && (
        <div style={{ padding:'0 20px 20px', borderTop:'1px solid var(--border)', paddingTop:14, animation:'slideDown 200ms ease' }}>
          {body && <p style={{ fontSize:15, color:'var(--text-2)', lineHeight:1.8, margin:'0 0 12px', fontFamily:'Source Sans Pro,sans-serif' }}>{body}</p>}
          {bullets && bullets.length>0 && (
            <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:8 }}>
              {bullets.map((b,i) => (
                <li key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:accent, flexShrink:0, marginTop:8 }}/>
                  <span style={{ fontSize:14.5, color:'var(--text-2)', lineHeight:1.7, fontFamily:'Source Sans Pro,sans-serif' }}>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {extra && <div style={{ marginTop:(body||bullets)?14:0 }}>{extra}</div>}
        </div>
      )}
    </div>
  )
}

// ─── DROPDOWN INSIGHT CARD (new premium style for key sections) ──────────────
function DropdownInsightCard({ index, title, description, impact, urgency, confidence, whyItMatters, actions, meta }:
  { index:number; title:string; description:string; impact?:'High'|'Medium'|'Low'; urgency?:'High'|'Medium'|'Low'; confidence?:string; whyItMatters?:string; actions?:string[]; meta?:React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const hasBody = !!(whyItMatters||actions&&actions.length>0)
  const priorityMap: Record<string,{label:string;bg:string;color:string;border:string;icon:string}> = {
    High:   { label:'HIGH IMPACT',   bg:'#fff0f0', color:'#c62828', border:'#ffd0d0', icon:'🔥' },
    Medium: { label:'MEDIUM IMPACT', bg:'#fffbec', color:'#b26a00', border:'#ffe8a0', icon:'⚡' },
    Low:    { label:'LOW IMPACT',    bg:'#f0faf2', color:'#2e7d32', border:'#c8eace', icon:'📌' },
  }
  const imp = priorityMap[impact||'Medium']
  const urgMap: Record<string,{color:string}> = { High:{color:'#c62828'}, Medium:{color:'#b26a00'}, Low:{color:'#2e7d32'} }
  const urg = urgMap[urgency||'Medium']
  return (
    <div style={{ width:'100%', background:'#ffffff', border:'1px solid #dce5f1', borderRadius:14, overflow:'hidden', boxShadow:'0 3px 14px rgba(24,58,99,0.07)', transition:'box-shadow 220ms', marginBottom:10 }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow='0 8px 24px rgba(24,58,99,0.12)'}
      onMouseLeave={e=>e.currentTarget.style.boxShadow='0 3px 14px rgba(24,58,99,0.07)'}>
      <div style={{ padding:'16px 18px' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:999, fontSize:11, fontWeight:700, letterSpacing:'0.04em', marginBottom:12, background:imp.bg, color:imp.color, border:`1px solid ${imp.border}` }}>
          {imp.icon} {imp.label}
        </div>
        <div style={{ fontSize:15, fontWeight:700, lineHeight:1.45, marginBottom:8, color:'#183a63', fontFamily:'Source Sans Pro,sans-serif' }}>{title}</div>
        <div style={{ fontSize:13.5, color:'#6c7c94', lineHeight:1.6, marginBottom:12, fontFamily:'Source Sans Pro,sans-serif' }}>{description}</div>
        {meta && <div style={{ marginBottom:12 }}>{meta}</div>}
        <div style={{ display:'flex', flexWrap:'wrap', gap:14, marginBottom:14, fontSize:13 }}>
          {impact && <span style={{ color:'#5e6e86' }}>Impact: <b style={{ color:imp.color }}>{impact}</b></span>}
          {urgency && <span style={{ color:'#5e6e86' }}>Urgency: <b style={{ color:urg.color }}>{urgency}</b></span>}
          {confidence && <span style={{ color:'#5e6e86' }}>Confidence: <b style={{ color:'#183a63' }}>{confidence}</b></span>}
        </div>
        {hasBody && (
          <div onClick={()=>setOpen(o=>!o)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f6faff', border:'1px solid #e0eaf6', borderRadius:10, padding:'11px 14px', cursor:'pointer', transition:'background 180ms' }}
            onMouseEnter={e=>e.currentTarget.style.background='#eaf2ff'}
            onMouseLeave={e=>e.currentTarget.style.background='#f6faff'}>
            <span style={{ fontSize:13, fontWeight:600, color:'#183a63', fontFamily:'Source Sans Pro,sans-serif' }}>
              {actions&&actions.length>0 ? `${actions.length} Recommended Action${actions.length>1?'s':''}` : 'Why This Matters'}
            </span>
            <span style={{ color:'#183a63', fontSize:12, transition:'transform 220ms', display:'inline-block', transform:open?'rotate(180deg)':'none' }}>▼</span>
          </div>
        )}
      </div>
      {hasBody && open && (
        <div style={{ animation:'slideDown 200ms ease', borderTop:'1px solid #edf2f7' }}>
          <div style={{ padding:'4px 18px 18px' }}>
            {whyItMatters && (
              <>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.08em', color:'#183a63', marginBottom:8, marginTop:14, textTransform:'uppercase' }}>WHY THIS MATTERS</div>
                <div style={{ fontSize:13.5, lineHeight:1.65, color:'#5f7088', fontFamily:'Source Sans Pro,sans-serif' }}>{whyItMatters}</div>
              </>
            )}
            {actions && actions.length>0 && (
              <>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.08em', color:'#183a63', marginBottom:2, marginTop:16, textTransform:'uppercase' }}>RECOMMENDED ACTIONS</div>
                <ul style={{ listStyle:'none', padding:0, margin:0 }}>
                  {actions.map((a,i)=>(
                    <li key={i} style={{ padding:'9px 0', borderBottom:i<actions.length-1?'1px solid #edf2f7':'none', color:'#42556d', fontSize:13.5, lineHeight:1.55, fontFamily:'Source Sans Pro,sans-serif' }}>
                      <span style={{ color:'#D4AF37', marginRight:8, fontWeight:700 }}>→</span>{a}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── BIG BET CARD ────────────────────────────────────────────────────────────
function BigBetCard({ bet, index, accent }: { bet:any; index:number; accent:string }) {
  const [open, setOpen] = useState(false)
  return (
    <div onClick={()=>setOpen(o=>!o)} style={{ border:'1px solid var(--border)', borderLeft:`5px solid ${accent}`, borderRadius:'0 16px 16px 0', background:'var(--bg-surface)', boxShadow:open?'0 6px 24px rgba(27,54,93,0.12)':'var(--glow-card)', cursor:'pointer', transition:'box-shadow 200ms', marginBottom:14, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, padding:'20px 24px' }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:`${accent}14`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:accent, fontFamily:'Sora,sans-serif', flexShrink:0 }}>{index+1}</div>
            <div style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color:'var(--navy)', lineHeight:1.2 }}>{bet.title}</div>
          </div>
          {bet.tag && <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:`${accent}12`, color:accent, border:`1px solid ${accent}30`, marginLeft:40 }}>{bet.tag}</span>}
        </div>
        <ChevronDown size={18} style={{ color:'var(--text-3)', flexShrink:0, marginTop:6, transform:open?'rotate(180deg)':'none', transition:'transform 200ms' }}/>
      </div>
      {open && (
        <div style={{ padding:'0 24px 22px', borderTop:'1px solid var(--border)', paddingTop:18, animation:'slideDown 200ms ease' }}>
          {bet.body && <p style={{ fontSize:14.5, color:'var(--text-2)', lineHeight:1.85, margin:'0 0 16px' }}>{bet.body}</p>}
          {bet.bullets && bet.bullets.length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>KEY FACTS</div>
              <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:7 }}>
                {bet.bullets.map((b:string,i:number) => (
                  <li key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <span style={{ width:7, height:7, borderRadius:'50%', background:accent, flexShrink:0, marginTop:7 }}/>
                    <span style={{ fontSize:13.5, color:'var(--text-2)', lineHeight:1.7 }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(bet.freyrResponse||bet.timeline) && (
            <div style={{ display:'grid', gridTemplateColumns:bet.freyrResponse&&bet.timeline?'1fr 140px':'1fr', gap:12, marginTop:14 }}>
              {bet.freyrResponse && (
                <div style={{ padding:'12px 16px', background:'var(--navy-faint)', borderRadius:10, border:'1px solid rgba(27,54,93,0.15)' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--navy)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>FREYR RESPONSE</div>
                  <div style={{ fontSize:13, color:'var(--navy)', fontWeight:600, lineHeight:1.5 }}>{bet.freyrResponse}</div>
                </div>
              )}
              {bet.timeline && (
                <div style={{ padding:'12px 16px', background:'rgba(212,175,55,0.08)', borderRadius:10, border:'1px solid rgba(212,175,55,0.25)', textAlign:'center' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#b89428', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>TIMELINE</div>
                  <div style={{ fontSize:14, color:'#8c6e00', fontWeight:700 }}>{bet.timeline}</div>
                </div>
              )}
            </div>
          )}
          {bet.nudgeSignal && (
            <div style={{ marginTop:14, padding:'12px 16px', background:'linear-gradient(135deg,rgba(27,54,93,0.08),transparent)', border:'1px solid rgba(27,54,93,0.15)', borderRadius:10, display:'flex', gap:8 }}>
              <Zap size={14} style={{ color:'#D4AF37', flexShrink:0, marginTop:2 }}/>
              <p style={{ fontSize:13, color:'var(--navy)', lineHeight:1.6, margin:0, fontStyle:'italic' }}>{bet.nudgeSignal}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── STRATEGIC PRIORITY CARD ─────────────────────────────────────────────────
function StratCard({ item, index, setActive }: { item:any; index:number; setActive?:(id:string)=>void }) {
  const [open, setOpen] = useState(false)
  const PC: Record<string,any> = {
    'MOST URGENT':{ bg:'rgba(220,38,38,0.08)', c:'#dc2626', b:'rgba(220,38,38,0.25)', a:'#dc2626' },
    'URGENT':     { bg:'rgba(234,88,12,0.08)', c:'#ea580c', b:'rgba(234,88,12,0.25)', a:'#ea580c' },
    'HIGH':       { bg:'rgba(217,119,6,0.08)', c:'#d97706', b:'rgba(217,119,6,0.25)', a:'#d97706' },
    'MEDIUM':     { bg:'rgba(27,107,192,0.08)',c:'#1B6BC0', b:'rgba(27,107,192,0.25)',a:'#1B6BC0' },
    'ACTIVE':     { bg:'rgba(16,185,129,0.08)',c:'#10b981', b:'rgba(16,185,129,0.25)',a:'#10b981' },
  }
  const pc = PC[item.priority] || PC['MEDIUM']
  const stakeholders: string[] = item.stakeholders || []

  return (
    <div style={{ border:'1px solid var(--border)', borderLeft:`4px solid ${pc.a}`, borderRadius:'0 12px 12px 0', background:'var(--bg-surface)', marginBottom:10, boxShadow:open?'0 4px 16px rgba(27,54,93,0.1)':'var(--glow-card)', overflow:'hidden' }}>
      {/* Header row — click to expand */}
      <div onClick={()=>setOpen(o=>!o)} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 18px', cursor:'pointer' }}>
        <div style={{ width:28, height:28, borderRadius:7, background:`${pc.a}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:pc.a, flexShrink:0, border:`1px solid ${pc.a}30` }}>{index+1}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
            <p style={{ fontSize:14.5, color:'var(--navy)', fontWeight:600, lineHeight:1.5, margin:0 }}>{item.title}</p>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:pc.bg, color:pc.c, border:`1px solid ${pc.b}`, whiteSpace:'nowrap' }}>{item.priority}</span>
              <ChevronDown size={14} style={{ color:'var(--text-3)', transform:open?'rotate(180deg)':'none', transition:'transform 200ms' }}/>
            </div>
          </div>
          {/* Stakeholder pills — always visible */}
          {stakeholders.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
              {stakeholders.map((name, si) => (
                <button
                  key={si}
                  onClick={e => { e.stopPropagation(); setActive && setActive('org-leadership') }}
                  style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, fontSize:11.5, fontWeight:600, background:'var(--navy-faint)', color:'var(--navy)', border:'1px solid rgba(27,54,93,0.18)', cursor:'pointer', transition:'all 140ms', fontFamily:'Source Sans Pro,sans-serif' }}
                  onMouseEnter={e => { e.currentTarget.style.background = pc.bg; e.currentTarget.style.color = pc.c; e.currentTarget.style.borderColor = pc.b }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--navy-faint)'; e.currentTarget.style.color = 'var(--navy)'; e.currentTarget.style.borderColor = 'rgba(27,54,93,0.18)' }}
                  title={`Go to Key Stakeholders — ${name}`}
                >
                  <Users size={10}/> {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div style={{ padding:'0 18px 18px', borderTop:'1px solid var(--border)', paddingTop:14, animation:'slideDown 200ms ease' }}>
          {item.body && <p style={{ fontSize:14, color:'var(--text-2)', lineHeight:1.8, margin:'0 0 12px' }}>{item.body}</p>}
          {item.freyrAction && (
            <div style={{ padding:'12px 16px', background:'var(--navy-faint)', borderRadius:9, border:'1px solid rgba(27,54,93,0.15)', marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--navy)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>FREYR ACTION</div>
              <p style={{ fontSize:13.5, color:'var(--navy)', lineHeight:1.65, margin:0, fontWeight:500 }}>{item.freyrAction}</p>
            </div>
          )}
          {/* Stakeholder quick links in expanded view */}
          {stakeholders.length > 0 && (
            <div style={{ padding:'12px 16px', background:'rgba(27,54,93,0.04)', borderRadius:9, border:'1px solid rgba(27,54,93,0.1)', marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--navy)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>KEY STAKEHOLDERS</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {stakeholders.map((name, si) => (
                  <button
                    key={si}
                    onClick={e => { e.stopPropagation(); setActive && setActive('org-leadership') }}
                    style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:600, background:`${pc.a}10`, color:pc.a, border:`1px solid ${pc.a}25`, cursor:'pointer', transition:'all 140ms', fontFamily:'Source Sans Pro,sans-serif' }}
                    onMouseEnter={e => { e.currentTarget.style.background = pc.bg }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${pc.a}10` }}
                  >
                    <Users size={12}/> {name} <ArrowRight size={11}/>
                  </button>
                ))}
              </div>
            </div>
          )}
          {(item.nudgeSignal||item.whatThisMeansForFreyr) && (
            <div style={{ display:'grid', gridTemplateColumns:item.nudgeSignal&&item.whatThisMeansForFreyr?'1fr 1fr':'1fr', gap:10 }}>
              {item.nudgeSignal && (
                <div style={{ padding:'12px 16px', background:'rgba(27,54,93,0.05)', border:'1px solid rgba(27,54,93,0.12)', borderRadius:9, display:'flex', gap:8 }}>
                  <Zap size={13} style={{ color:'#D4AF37', flexShrink:0, marginTop:2 }}/>
                  <p style={{ fontSize:12.5, color:'var(--navy)', lineHeight:1.6, margin:0, fontStyle:'italic' }}>{item.nudgeSignal}</p>
                </div>
              )}
              {item.whatThisMeansForFreyr && (
                <div style={{ padding:'12px 16px', background:'rgba(212,175,55,0.07)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:9 }}>
                  <div style={{ fontSize:9.5, fontWeight:700, color:'#b89428', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>WHAT THIS MEANS FOR FREYR</div>
                  <p style={{ fontSize:12.5, color:'#7a5c00', lineHeight:1.6, margin:0 }}>{item.whatThisMeansForFreyr}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── NEXT BEST ACTION CARD ───────────────────────────────────────────────────
function NBACard({ item, index }: { item:any; index:number }) {
  const [open, setOpen] = useState(false)
  const UC: Record<string,string> = { 'Immediate':'#dc2626','Q3 2026':'#d97706','Q3-Q4 2026':'#d97706','Q4 2026':'var(--navy)' }
  const uc = UC[item.urgency]||'var(--navy)'
  return (
    <div onClick={()=>setOpen(o=>!o)} style={{ border:'1px solid var(--border)', borderLeft:`4px solid ${uc}`, borderRadius:'0 12px 12px 0', background:'var(--bg-surface)', cursor:'pointer', marginBottom:10, boxShadow:open?'0 4px 16px rgba(27,54,93,0.1)':'var(--glow-card)', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 18px' }}>
        <div style={{ width:28, height:28, borderRadius:7, background:`${uc}14`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:uc, flexShrink:0, border:`1px solid ${uc}22`, fontFamily:'Playfair Display,serif' }}>{index+1}</div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
            <p style={{ fontSize:14.5, color:'var(--navy)', fontWeight:600, lineHeight:1.5, margin:0 }}>{item.action}</p>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              <span style={{ padding:'2px 10px', borderRadius:5, fontSize:11, fontWeight:700, background:'var(--navy-faint)', color:'var(--navy)', whiteSpace:'nowrap' }}>{item.priority}</span>
              <ChevronDown size={14} style={{ color:'var(--text-3)', transform:open?'rotate(180deg)':'none', transition:'transform 200ms' }}/>
            </div>
          </div>
        </div>
      </div>
      {open && (
        <div style={{ padding:'0 18px 18px', borderTop:'1px solid var(--border)', paddingTop:14, animation:'slideDown 200ms ease' }}>
          <p style={{ fontSize:14, color:'var(--text-2)', lineHeight:1.8, margin:'0 0 12px' }}>{item.detail}</p>
          <div style={{ display:'flex', gap:10 }}>
            {item.owner && (
              <div style={{ padding:'8px 14px', background:'var(--navy-faint)', borderRadius:8, flex:1 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>OWNER</div>
                <div style={{ fontSize:13, color:'var(--navy)', fontWeight:600 }}>{item.owner}</div>
              </div>
            )}
            <div style={{ padding:'8px 14px', background:`${uc}0d`, borderRadius:8, border:`1px solid ${uc}25`, minWidth:100, textAlign:'center' }}>
              <div style={{ fontSize:11, fontWeight:700, color:uc, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>URGENCY</div>
              <div style={{ fontSize:13, color:uc, fontWeight:700 }}>{item.urgency}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PERSON CARD ─────────────────────────────────────────────────────────────
function PersonCard({ person }: { person:any }) {
  const [open, setOpen] = useState(false)
  const RM: Record<string,{c:string;bg:string;label:string}> = {
    cold:  { c:'#1B365D', bg:'rgba(27,54,93,0.08)',    label:'Cold'   },
    warm:  { c:'#b89428', bg:'rgba(212,175,55,0.12)',  label:'Warm'   },
    hot:   { c:'#dc2626', bg:'rgba(220,38,38,0.1)',    label:'Hot'    },
    active:{ c:'#10b981', bg:'rgba(16,185,129,0.1)',   label:'Active' },
  }
  const rel = RM[(person.relationship||'cold').toLowerCase()] || RM.cold
  const initials = (person.name||'').split(' ').map((n:string)=>n[0]).join('').slice(0,2)
  const AVC = ['#1B365D','#7c3aed','#0891b2','#b89428','#dc2626','#059669']
  const avc = AVC[Math.abs((person.name||'').charCodeAt(0)-65||0) % AVC.length]

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${rel.c}`,
      borderRadius: '0 10px 10px 0',
      background: 'var(--bg-surface)',
      marginBottom: 8,
      overflow: 'hidden',
    }}>
      {/* Collapsed header — always visible, click to toggle */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 16px', cursor:'pointer' }}
      >
        {/* Avatar */}
        <div style={{
          width:38, height:38, borderRadius:10, background:avc, flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:13, fontWeight:700, color:'#fff', letterSpacing:'0.03em'
        }}>{initials}</div>

        {/* Name + role */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--navy)', lineHeight:1.2, marginBottom:2 }}>{person.name}</div>
          <div style={{ fontSize:12, color:'var(--text-3)', lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{person.role||person.title}</div>
        </div>

        {/* Relationship badge */}
        <span style={{
          display:'inline-flex', alignItems:'center', gap:4,
          padding:'3px 10px', borderRadius:20,
          background:rel.bg, color:rel.c,
          fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
          flexShrink:0,
        }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:rel.c, display:'inline-block' }}/>
          {rel.label}
        </span>

        {/* Chevron */}
        <ChevronDown size={14} style={{
          color:'var(--text-3)', flexShrink:0,
          transform: open ? 'rotate(180deg)' : 'none',
          transition:'transform 200ms'
        }}/>
      </div>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding:'0 16px 16px', borderTop:'1px solid var(--border)', paddingTop:14, animation:'slideDown 200ms ease' }}>
          {/* Insight */}
          {person.insight && (
            <p style={{ fontSize:13.5, color:'var(--text-2)', lineHeight:1.7, margin:'0 0 14px' }}>{person.insight}</p>
          )}

          {/* Dos + Don'ts */}
          {person.dos && person.donts && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              <div style={{ background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, padding:'10px 12px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#10b981', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>✓ Do</div>
                {person.dos.map((d:string,i:number) => (
                  <div key={i} style={{ fontSize:12.5, color:'var(--text-2)', lineHeight:1.6, marginBottom:5, display:'flex', gap:6 }}>
                    <span style={{ color:'#10b981', flexShrink:0, marginTop:1 }}>•</span><span>{d}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:'rgba(220,38,38,0.05)', border:'1px solid rgba(220,38,38,0.15)', borderRadius:8, padding:'10px 12px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#dc2626', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:7 }}>✕ Don't</div>
                {person.donts.map((d:string,i:number) => (
                  <div key={i} style={{ fontSize:12.5, color:'var(--text-2)', lineHeight:1.6, marginBottom:5, display:'flex', gap:6 }}>
                    <span style={{ color:'#dc2626', flexShrink:0, marginTop:1 }}>•</span><span>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conference */}
          {person.conference && (
            <div style={{ fontSize:12.5, color:'var(--navy)', fontWeight:600, padding:'6px 10px', background:'var(--navy-faint)', borderRadius:6, marginBottom:10, display:'flex', gap:6, alignItems:'center' }}>
              <span>🎤</span><span>{person.conference}</span>
            </div>
          )}

          {/* Signals */}
          {person.signals && person.signals.length > 0 && (
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom: person.sellingPoint ? 10 : 0 }}>
              {person.signals.map((s:string) => (
                <span key={s} style={{ padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600, background:'rgba(27,54,93,0.07)', color:'var(--navy)', border:'1px solid rgba(27,54,93,0.12)' }}>⚡ {s}</span>
              ))}
            </div>
          )}

          {/* Selling point */}
          {person.sellingPoint && (
            <div style={{ padding:'10px 14px', background:'rgba(212,175,55,0.07)', border:'1px solid rgba(212,175,55,0.3)', borderRadius:8 }}>
              <div style={{ fontSize:9.5, fontWeight:700, color:'#b89428', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Freyr Selling Point</div>
              <p style={{ fontSize:13, color:'#7a5c00', lineHeight:1.6, margin:0, fontWeight:500 }}>{person.sellingPoint}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── SALES INTELLIGENCE SECTION (3 structured components) ────────────────────
function SalesIntel({ accountId }: { accountId:string }) {
  const isR = accountId==='revance'
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
      {/* 1: Signal Combination Matrix */}
      <div>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--navy)', fontFamily:'Playfair Display,serif', marginBottom:14, borderBottom:'2px solid var(--border)', paddingBottom:10 }}>1 — Signal Combination Matrix</div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
            <thead><tr style={{ background:'var(--navy)', color:'#fff' }}>
              {['HYPOTHESIS','SIGNAL 1','SIGNAL 2','SIGNAL 3','RECOMMENDED ACTION','PRIORITY'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(isR ? [
                { h:'DAXXIFY EU Gap + Active PV + No Freyr Presence = Act Now', s1:'EU Reg. Gap (4+ yrs)', s2:'Active PV since May 2024', s3:'No Freyr in Either Programme', a:'Initiate Head of RA contact this week — EU scoping + PV question simultaneously. No incumbent.', p:'CRITICAL' },
                { h:'Crown PE Acquisition Changes All Vendor Decisions', s1:'Crown PE Governance', s2:'H2 2026 Contract Review', s3:'New C-Suite (Oct 2025)', a:'Move to Full-Service before H2 2026 vendor review locks roster — prepare consolidated proposal with ROI model for Leffler.', p:'CRITICAL' },
                { h:'Hitchcock + NMPA + Phase II = Technology Track Entry', s1:'Fosun NMPA Programme', s2:'Phase II Spasticity', s3:'VIA No Competitor', a:'Approach Hitchcock with VIA NMPA case study and multi-indication complexity — scientific peer conversation.', p:'HIGH' },
                { h:'Technology White Space Before Crown CRO Panel Decision', s1:'Tech White Space', s2:'ICON/Parexel Crown Rel.', s3:'freya.intelligence Ready', a:'Propose freya.intelligence 60-day POC via RA team — no CEO sign-off required. Act Q3 2026.', p:'HIGH' },
                { h:'Crown Integration = Freyr Expansion or Displacement', s1:'Vendor Rationalisation', s2:'Single-Service Vulnerable', s3:'Full-Service Opportunity', a:'Expand to PV + MLR + technology before review. Multi-service = displacement-proof.', p:'HIGH' },
              ] : [
                { h:'Leverage CEO Succession and Transformation to Accelerate Launch Support', s1:'CEO Succession', s2:'Transformation Program', s3:'Launch Pipeline', a:'Initiate executive outreach to Julie Kim and Lauren Duprey to position Freyr as strategic partner for launch readiness and transformation efficiency.', p:'Critical' },
                { h:'Combine U.S. Market Pressure and Market Access Expansion to Drive Commercial Solutions', s1:'Vyvanse LOE', s2:'U.S. Revenue Share', s3:'Market Access Expansion', a:'Offer payer analytics and digital content management to U.S. commercial teams to mitigate revenue loss and enhance launch uptake.', p:'High' },
                { h:'Align AI ROI Pressure with Cloud Migration to Propose Digital Transformation Pilots', s1:'AI ROI Focus', s2:'Cloud Migration', s3:'Digital Partnerships', a:"Collaborate with Ricci (CDTO) to co-develop AI-ready data platform — freya fusion multi-LLM maps to his multi-model orchestration philosophy.", p:'High' },
                { h:'Use Procurement Centralization and Vendor Governance to Address Restructuring Compliance', s1:'Procurement Centralization', s2:'SAP Ariba', s3:'Transformation Program', a:'Propose SAP Ariba-integrated vendor governance. Establish freya fusion API compatibility before Accenture extends scope.', p:'Medium' },
                { h:'Combine Medical Content Hiring and GenAI Interest to Offer Content Automation Solutions', s1:'Medical Content Hiring', s2:'Vendor Excellence', s3:'GenAI Content Ops', a:'Pilot GenAI-powered medical content automation with medical affairs reducing cycle times and compliance risk.', p:'Medium' },
                { h:'Leverage Leadership Transition and Board Refresh to Secure Multi-Year Partnership', s1:'CEO Succession', s2:'Board Refresh', s3:'Org Restructure', a:"Develop transition-safe engagement models with milestone governance. Get named in Kim's 100-day review before it concludes.", p:'High' },
              ]).map((r,i)=>(
                <tr key={i} style={{ background:i%2===0?'var(--bg-surface)':'var(--bg-raised)' }}>
                  <td style={{ padding:'11px 14px', color:'var(--navy)', borderBottom:'1px solid var(--border)', fontWeight:500, lineHeight:1.55, maxWidth:180 }}>{r.h}</td>
                  <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)' }}><span style={{ padding:'2px 8px', borderRadius:4, background:'rgba(27,54,93,0.07)', color:'var(--navy)', fontSize:12, fontWeight:600, display:'inline-block' }}>{r.s1}</span></td>
                  <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)' }}><span style={{ padding:'2px 8px', borderRadius:4, background:'rgba(27,54,93,0.07)', color:'var(--navy)', fontSize:12, fontWeight:600, display:'inline-block' }}>{r.s2}</span></td>
                  <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)' }}><span style={{ padding:'2px 8px', borderRadius:4, background:'rgba(27,54,93,0.07)', color:'var(--navy)', fontSize:12, fontWeight:600, display:'inline-block' }}>{r.s3}</span></td>
                  <td style={{ padding:'11px 14px', color:'var(--text-2)', borderBottom:'1px solid var(--border)', lineHeight:1.6, maxWidth:220 }}>{r.a}</td>
                  <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:(r.p==='CRITICAL'||r.p==='Critical')?'rgba(220,38,38,0.1)':(r.p==='High'||r.p==='HIGH')?'rgba(217,119,6,0.1)':'rgba(27,54,93,0.08)', color:(r.p==='CRITICAL'||r.p==='Critical')?'#dc2626':(r.p==='High'||r.p==='HIGH')?'#d97706':'var(--navy)' }}>{r.p}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2: 90-Day Action Roadmap */}
      <div>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--navy)', fontFamily:'Playfair Display,serif', marginBottom:14, borderBottom:'2px solid var(--border)', paddingBottom:10 }}>2 — 90-Day Action Roadmap</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
          {(isR ? [
            { phase:'Days 1–30 — ACTIVATE', c:'#dc2626', bg:'rgba(220,38,38,0.04)', items:['Verify Head of RA (Susanne Fors/successor) and re-engage with DAXXIFY EU/EMA scoping as opening agenda','Ask single PV question: "Who is managing your cervical dystonia PV programme?" — have Freyr PV proposal ready within 5 days if gap confirmed','Deliver EU/EMA scoping brief: Freyr 850+ EU affiliate network, freya.intelligence EMA pathway analysis, programme timeline estimate'] },
            { phase:'Days 31–60 — EXPAND', c:'#d97706', bg:'rgba(217,119,6,0.04)', items:['Initiate 60-day freya.intelligence POC for EU regulatory monitoring — approved at regulatory team level, no CEO sign-off required','Deliver PV proposal if gap confirmed: ICSR processing, PSUR/PBRER authoring, signal detection, REMS compliance scope for cervical dystonia','Request Kira Schwartz (CLO) introduction via Head of RA to brief CLO on Freyr GxP compliance framework'] },
            { phase:'Days 61–90 — SCALE', c:'#10b981', bg:'rgba(16,185,129,0.04)', items:['Hitchcock (CInO) scientific outreach on Phase II regulatory complexity and VIA NMPA China case study','Build Crown CEO Brief for delivery via Schwartz to Moiz — DAXXIFY EU gap quantified in PE terms ($320M+ cumulative lost revenue)','Prepare ROI model for Leffler: EU programme NPV vs cost, PV compliance risk exposure, vendor consolidation savings from Full-Service'] },
          ] : [
            { phase:'Days 1–30 — ACTIVATE', c:'#dc2626', bg:'rgba(220,38,38,0.04)', items:['Initiate Robertson QBR: eCTD v4.0 readiness for H2 2026 launches, freya.intelligence 60-day POC proposal, H2 2026 launch support scope for oveporexton','Contact Robertson with reference to NatRevDrugDisc 2025 paper: "SUBMIT PRO and rDMS are the production-grade operational layer of your published architecture"','Engage Ricci (CDTO) and Innovation Capability Centers for AI-ready data platform pilots via Robertson/Duprey introduction'] },
            { phase:'Days 31–60 — EXPAND', c:'#d97706', bg:'rgba(217,119,6,0.04)', items:['Launch freya.intelligence 60-day POC with Robertson team — JP/EU/US pipeline asset monitoring for oveporexton, rusfertide, zasocitinib','Pilot VIA with Transformation Office — Factory of the Future programme manufacturing consolidation variation management','Propose SUBMIT PRO eCTD v4.0 deployment scoping for oveporexton NDA — demonstrate production-grade PMDA Japan v4.0 support'] },
            { phase:'Days 61–90 — SCALE', c:'#10b981', bg:'rgba(16,185,129,0.04)', items:['Duprey first meeting via Robertson: "How many FTEs does Takeda spend on regulatory monitoring?" — workforce framing, not technology pitch','Identify Head of PV for three simultaneous commercial launches — ask Robertson: "Who is managing PV for oveporexton and rusfertide?"','Prepare CEO Brief for Duprey to deliver to Kim — dual-pressure: launch support surge capacity + JPY 200B savings contribution from Freyr automation'] },
          ]).map(col=>(
            <div key={col.phase} style={{ background:col.bg, border:`1px solid ${col.c}25`, borderRadius:12, padding:'16px 18px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:col.c, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>{col.phase}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {col.items.map((item,i)=>(
                  <div key={i} style={{ background:'var(--bg-surface)', border:`1px solid ${col.c}20`, borderRadius:9, padding:'11px 14px' }}>
                    <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.65, margin:0 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3: Engagement Tone by Stakeholder */}
      <div>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--navy)', fontFamily:'Playfair Display,serif', marginBottom:14, borderBottom:'2px solid var(--border)', paddingBottom:10 }}>3 — Engagement Tone by Stakeholder</div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
            <thead><tr style={{ background:'var(--navy)', color:'#fff' }}>
              {['STAKEHOLDER','LEAD WITH','TONE','AVOID','ROLE'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(isR ? [
                { n:'Head of RA', l:'EU/EMA scoping + PV programme status', t:'Trusted regulatory partner — long-term relationship', a:'Crown governance language in first contact', r:'Anchor Contact' },
                { n:'Kira Schwartz (CLO)', l:'Compliance risk reduction — GxP, PV obligation management', t:'Risk management conversation, not sales pitch', a:'Regulatory science detail, speculative claims', r:'Compliance Gatekeeper' },
                { n:'Nadeem Moiz (CEO)', l:'EU commercial gap in PE terms — $1.5B+ market, 3+ years foregone revenue', t:'PE operator — 90-second commercial urgency pitch', a:'Innovation language, broad service catalogue', r:'Strategic Endorser' },
                { n:'Scott Leffler (CFO)', l:'ROI: EU programme NPV vs cost, PV compliance risk exposure', t:'EBITDA framing — financial proxy for Crown PE sponsors', a:'Regulatory science, no ROI model = no meeting', r:'Budget Authority' },
                { n:'Thomas Hitchcock (CInO)', l:'Multi-indication regulatory complexity, VIA for NMPA China', t:'Scientific peer-to-peer — not a commercial pitch', a:'Pure operational framing, overstating AI automation', r:'Technology Sponsor' },
                { n:'Nick Crowe (COO)', l:'Vendor consolidation savings, FTE reduction, variation cycle time metrics', t:'Operational executor — cost per delivery, process standardisation', a:'Regulatory science, technology vision without operational metrics', r:'Operational Validator' },
              ] : [
                { n:'Julie Kim (CEO)', l:'Dual-pressure: launch velocity AND cost reduction simultaneously', t:'Commercial-first, patient-outcome connected, time-rationed', a:'Slow pilots, 18-month roadmaps, tech architecture jargon', r:'Exec Sponsor' },
                { n:'Lauren Duprey (CTO)', l:'"How many FTEs does Takeda spend on regulatory monitoring?" — workforce framing', t:'People-first transformation partner, storytelling not specs', a:'AI model comparisons, tech architecture, enterprise software jargon', r:'Budget Owner' },
                { n:'Andrew Robertson (VP GRA)', l:'"We read your NatRevDrugDisc 2025 paper — SUBMIT PRO is the production layer of your published architecture"', t:'Intellectual peer, academic register, curiosity-first', a:'Generic AI slides, competing with Weave Bio, commercial-first framing', r:'Internal Champion' },
                { n:'Gabriele Ricci (CDTO)', l:'freya fusion multi-LLM architecture — maps to his multi-model orchestration philosophy', t:'Production-grade evidence — peer-to-peer technical', a:'The word "pilot", generic AI pitch', r:'Tech Gatekeeper' },
                { n:'Tatiana Ishida (Labeling)', l:'LABEL 360 for 3 simultaneous launch CCDS harmonisation', t:'Operational delivery excellence, proven platform', a:'New relationship investment needed — build on active engagement', r:'Delivery Contact' },
                { n:'Kevin Stevens (PDT/Device)', l:'VIA 20-site pilot — Factory of the Future manufacturing consolidation', t:'Manufacturing ROI — cost per filing, variation cycle time reduction', a:'Regulatory science framing — this is a manufacturing conversation', r:'VIA Entry Point' },
              ]).map((r,i)=>(
                <tr key={i} style={{ background:i%2===0?'var(--bg-surface)':'var(--bg-raised)' }}>
                  <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)', fontWeight:700, color:'var(--navy)', whiteSpace:'nowrap' }}>{r.n}</td>
                  <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)', color:'var(--text-2)', lineHeight:1.6 }}>{r.l}</td>
                  <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)', color:'var(--text-2)', lineHeight:1.6 }}>{r.t}</td>
                  <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)', color:'#dc2626', fontWeight:600, lineHeight:1.6 }}>{r.a}</td>
                  <td style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ padding:'2px 10px', borderRadius:20, background:'var(--navy-faint)', color:'var(--navy)', fontSize:11.5, fontWeight:600, whiteSpace:'nowrap' }}>{r.r}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── SIGNAL DETAIL MODAL ─────────────────────────────────────────────────────
function SignalModal({ signal, onClose }: { signal:{ name:string; source:string; evidence:string; reference:string; implication:string }|null; onClose:()=>void }) {
  if (!signal) return null
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.48)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, animation:'fadeIn 160ms ease' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:660, maxWidth:'92vw', background:'#fff', borderRadius:14, overflow:'hidden', animation:'popIn 180ms ease-out', boxShadow:'0 24px 64px rgba(0,0,0,0.28)' }}>
        <div style={{ borderTop:'5px solid #D4AF37', padding:'22px 26px', position:'relative' }}>
          <button onClick={onClose} style={{ position:'absolute', right:20, top:16, background:'none', border:'none', cursor:'pointer', fontSize:26, color:'#888', lineHeight:1 }}>×</button>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', color:'#7E8794', textTransform:'uppercase', marginBottom:6 }}>SIGNAL DETAIL</div>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:26, fontWeight:700, color:'#1B365D', lineHeight:1.2 }}>{signal.name}</div>
        </div>
        <div style={{ padding:'16px 26px', borderTop:'1px solid #EDF1F5' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'#7E8794', textTransform:'uppercase', marginBottom:6 }}>SOURCE</div>
          <div style={{ fontSize:15, color:'#1B365D', lineHeight:1.55 }}>{signal.source}</div>
        </div>
        <div style={{ padding:'16px 26px', borderTop:'1px solid #EDF1F5' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'#7E8794', textTransform:'uppercase', marginBottom:6 }}>EVIDENCE</div>
          <div style={{ fontSize:15, color:'#1B365D', lineHeight:1.55 }}>{signal.evidence}</div>
        </div>
        <div style={{ padding:'16px 26px', borderTop:'1px solid #EDF1F5' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'#7E8794', textTransform:'uppercase', marginBottom:6 }}>REFERENCE</div>
          <div style={{ fontSize:14, color:'#555', lineHeight:1.55 }}>{signal.reference}</div>
        </div>
        <div style={{ margin:'0 20px 20px', background:'#1B365D', borderRadius:10, padding:'18px 22px' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', color:'#D4AF37', textTransform:'uppercase', marginBottom:8 }}>FREYR IMPLICATION</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.9)', lineHeight:1.65 }}>{signal.implication}</div>
        </div>
      </div>
    </div>
  )
}

// ─── COMPETITIVE INTELLIGENCE SECTION ────────────────────────────────────────
function CompetitiveIntel({ accountId }: { accountId:string }) {
  const [activeModal, setActiveModal] = useState<{ name:string; source:string; evidence:string; reference:string; implication:string }|null>(null)
  const isR = accountId==='revance'

  const cards = isR ? [
    {
      num:1, title:'Botox Market Dominance Pressure', body:'AbbVie\'s Botox remains the category leader with overwhelming physician loyalty, patient awareness, training infrastructure, and bundled aesthetics offerings. Daxxify\'s longer duration is differentiated, but market adoption faces resistance.',
      signals:[
        { name:'Market Share Leadership', source:'AbbVie earnings commentary and market reports', evidence:'Botox generated over $4.4B in U.S. sales while Daxxify remains significantly smaller. Physicians often default to Botox due to familiarity and patient demand.', reference:'AbbVie Earnings / BioSpace Market Reports', implication:'Revance must strengthen competitive positioning through differentiated value messaging, reimbursement strategy support, and evidence generation demonstrating long-term economic value.' },
        { name:'Physician Loyalty Programs', source:"Allergan's loyalty and bundled purchasing programs encourage physician spend consolidation", evidence:'Practices receive incentives when purchasing multiple products across Botox, Juvederm, and other Allergan offerings.', reference:"Partner Privileges physician loyalty framework (Clarivate)", implication:'Opportunity to support Revance with competitive intelligence, customer retention analytics, and ecosystem differentiation strategies.' },
        { name:'Brand Recognition', source:'Industry aesthetics reports and physician surveys', evidence:'Botox remains the most recognized neurotoxin brand. Patients frequently request Botox by name rather than the treatment category.', reference:'iData Research Market Analysis', implication:'Increased investment needed in education, digital engagement, and awareness programs to establish Daxxify as a premium alternative.' },
        { name:'Pricing Pressure', source:'Crown acquisition analysis and analyst commentary', evidence:'Revance reduced Daxxify pricing after premium positioning slowed adoption. Market adoption improved after price adjustments.', reference:'Reuters / Crown Acquisition Reports', implication:'Commercial strategy optimization and competitive pricing intelligence become critical to market expansion.' },
      ]
    },
    {
      num:2, title:'Emerging Challenger Competition (Evolus Jeuveau)', body:'Evolus continues gaining traction through aggressive commercial execution, focused aesthetics branding, and expansion beyond Jeuveau. Growth trajectory positions Evolus as one of the fastest-growing neurotoxin challengers.',
      signals:[
        { name:'Rapid Commercial Growth', source:'Evolus investor guidance and preliminary earnings', evidence:'Jeuveau continues increasing market penetration. Growth exceeds many traditional competitors.', reference:'Evolus Q4 2024 Preliminary Earnings / Investors.com', implication:'Revance must monitor emerging competitor adoption trends and physician migration patterns.' },
        { name:'Younger Consumer Targeting', source:'Market positioning analysis and consumer branding studies', evidence:'Jeuveau is marketed heavily toward aesthetics-focused younger demographics. Consumer branding differs significantly from traditional Botox positioning.', reference:'Clarivate Market Analysis / Allure Industry Reports', implication:'Opportunity to build segmentation-based commercial and messaging strategies.' },
        { name:'Product Portfolio Expansion', source:'2025 pipeline expansion announcements', evidence:'Evolus is expanding beyond a single-product company. Injectable fillers and complementary aesthetics products are being introduced.', reference:'Evolus Pipeline 2025 Announcements', implication:'Revance may face increasing bundled-solution competition similar to Allergan.' },
        { name:'Competitive Promotion', source:'Industry competitive landscape assessments', evidence:'High commercial investment in physician acquisition and aesthetics marketing. Aggressive practice conversion campaigns observed.', reference:'Clarivate Competitive Intelligence Reports', implication:'Requires stronger physician retention and customer success initiatives.' },
      ]
    },
    {
      num:3, title:'Differentiation Erosion Risk', body:"Daxxify's primary differentiator is longer-lasting duration. However, competitors continue improving formulations and physician education, creating risk that duration alone may not sustain competitive advantage.",
      signals:[
        { name:'Longevity Competition', source:'FDA-supported studies and market analyses', evidence:'Daxxify results often last 6+ months versus traditional 3–4 month intervals. Competitors are now narrowing this gap.', reference:'Wikipedia / Glamour Industry Reports', implication:'Revance should continuously generate evidence proving economic and clinical value beyond duration claims.' },
        { name:'Clinical Comparison Discussions', source:'Industry educational content and physician discussions', evidence:'Increasing comparisons among Botox, Dysport, Xeomin, Jeuveau, and Daxxify. Providers evaluate onset, spread, duration, and patient outcomes.', reference:'Allure Medical Review Panels', implication:'Need for stronger comparative evidence packages and scientific communication.' },
        { name:'Physician Preference Variability', source:'Market adoption pattern studies', evidence:'Injectors often maintain product preferences based on experience. Switching barriers remain significant.', reference:'Clarivate Physician Preference Studies', implication:'Focus on physician education, training support, and onboarding programs.' },
        { name:'Market Education Gap', source:'Market share and adoption analyses', evidence:'Many consumers still lack awareness of Daxxify versus Botox. Consumer demand frequently begins with Botox requests.', reference:'Reuters / BioSpace Consumer Adoption Reports', implication:'Opportunity for patient education and evidence-based engagement programs.' },
      ]
    },
    {
      num:4, title:'Regulatory, Legal & Competitive Expansion Threat', body:'Revance faces increasing legal, patent, and market pressures while additional neurotoxins enter the U.S. aesthetics market. New entrants and IP disputes may impact growth trajectory.',
      signals:[
        { name:'Patent Litigation Risk', source:'Reuters litigation reporting', evidence:'Allergan secured a favorable patent verdict related to Daxxify manufacturing. Significant damages awarded in patent litigation.', reference:'Reuters Patent Trial Coverage 2025', implication:'Legal risk management, regulatory compliance support, and manufacturing IP strategy become critical priorities.' },
        { name:'New Entrant Pressure', source:'Market landscape assessments', evidence:'Additional neurotoxin products gaining FDA clearance. Market fragmentation increasing competition for provider attention.', reference:'Industry Competitive Landscape Reports', implication:'Revance needs differentiated positioning strategy and accelerated market expansion support.' },
        { name:'Market Fragmentation', source:'Aesthetics market analysis reports', evidence:'Multiple neurotoxin products now available with overlapping indications, creating pricing and positioning pressure.', reference:'iData Research Market Intelligence', implication:'Commercial content strategy and provider segmentation become key differentiators.' },
        { name:'Acquisition Integration', source:'Crown Labs acquisition analysis', evidence:'PE-backed acquisition creates integration complexity and vendor rationalization pressure across all commercial operations.', reference:'Reuters Crown $924M Acquisition Coverage', implication:'Vendor consolidation window: position Freyr as full-service partner before H2 2026 review locks the roster.' },
      ]
    },
  ] : [
    {
      num:1, title:'Leadership Transition & Board Refresh', body:'Takeda will transition from Christophe Weber to Julie Kim in June 2026. Board refresh and executive restructuring create vendor decision resets and new buying center opportunities.',
      signals:[
        { name:'CEO Succession', source:'Takeda board-approved succession strategy and public announcements', evidence:'Julie Kim will succeed Christophe Weber as CEO in June 2026. Multi-year succession planning process already underway.', reference:'European Pharmaceutical Review / Stock Titan SEC Filings', implication:'Opportunity to engage executive stakeholders around transformation governance, launch readiness support, and strategic advisory programs.' },
        { name:'Board Refresh', source:'Board restructuring announcements and governance filings', evidence:'Takeda plans significant Board changes with multiple outgoing directors and new healthcare leaders joining.', reference:'Stock Titan SEC Filings / Governance Committee Reports', implication:'Potential need for accelerated reporting, governance modernization, and strategic intelligence programs.' },
        { name:'Organizational Restructuring', source:'FY2026 leadership and operating model redesign', evidence:'Takeda announced new organizational structures including creation of new business and strategy groups to improve speed and competitiveness.', reference:'Takeda FY2026 Structure Announcement', implication:'New stakeholder mapping and change-management opportunities across all buying centers.' },
        { name:'Leadership Continuity', source:'Transition governance frameworks', evidence:'Board-level continuity planning includes vendor relationship reviews and strategic program assessments during CEO transition window.', reference:'Transformation Office Communications', implication:"Engage now before Kim's 100-day review concludes — get Freyr named in new CEO's strategic partner list." },
      ]
    },
    {
      num:2, title:'Pipeline Launch Pressure', body:'Takeda is preparing for major launches including oveporexton, rusfertide, and zasocitinib. Commercial execution speed and launch readiness are critical for future growth amid transformation.',
      signals:[
        { name:'Launch Readiness', source:'Corporate transformation strategy and leadership communications', evidence:'Transformation savings are being redirected toward upcoming launches. Leadership communications repeatedly emphasize launch execution.', reference:'Takeda Transformation Announcement 2026', implication:'Opportunity for regulatory intelligence, launch content management, and market readiness programs.' },
        { name:'Commercial Acceleration', source:'Executive transformation communications', evidence:'Organizational redesign focused on faster decision making and streamlined operations to improve execution speed.', reference:'Takeda FY2026 Organizational Structure Release', implication:'Need for scalable medical information and omnichannel content operations.' },
        { name:'Competitive Positioning', source:'Pipeline asset analysis and market assessments', evidence:'Three simultaneous high-value launches during a 4,500-person restructuring creates outsourcing mandate.', reference:'Takeda Pipeline Overview Documents', implication:'This is the most urgent near-term entry. Robertson QBR in Q3 2026 — confirm resource allocation NOW.' },
        { name:'Revenue Diversification', source:'Investor relations and earnings guidance', evidence:'Patent cliff on Vyvanse creates revenue replacement pressure. Pipeline diversification across rare disease, oncology, and neuroscience.', reference:'Takeda Investor Relations / Earnings Calls', implication:'Revenue pressure accelerates urgency for all three H2 2026 launch support streams.' },
      ]
    },
    {
      num:3, title:'SAP S/4HANA Enterprise Transformation', body:'Takeda is executing a multi-year SAP transformation program and migrating enterprise systems to S/4HANA and cloud ERP architecture. Data migration and governance are key priorities.',
      signals:[
        { name:'SAP S/4HANA Migration', source:'Enterprise transformation job postings and program descriptions', evidence:'Takeda identified SAP migration as a foundational transformation initiative. Dedicated leadership roles created for migration governance.', reference:'Takeda Jobs / SAP Case Study 2025', implication:'Opportunity for validation, regulatory compliance support, data governance, and migration quality assurance.' },
        { name:'Data Transformation', source:'Data migration governance framework documents', evidence:'Dedicated leadership roles created for enterprise data migration and process harmonization across global operations.', reference:'Takeda Enterprise Platform Transformation Program', implication:'Regulatory data migration quality assurance and GxP compliance validation create direct Freyr entry points.' },
        { name:'Process Harmonization', source:'SAP transformation case study documentation', evidence:'Takeda is standardizing global processes ahead of ERP modernization. Global process ownership and operational standardization initiatives active.', reference:'SAP Case Study / Takeda Transformation Roadmap', implication:'Potential consulting opportunities around regulated content and quality processes.' },
        { name:'AI Enablement', source:'SAP cloud ERP modernization initiative', evidence:'Takeda is actively exploring embedded AI capabilities in future ERP architecture. AI identified as a strategic transformation enabler.', reference:'SAP/Takeda Cloud ERP Modernization Reports', implication:'Strong opportunity for GenAI-enabled medical content and regulatory automation aligned to transformation program.' },
      ]
    },
    {
      num:4, title:'Medical Content & Vendor Excellence', body:'Takeda is focused on operational efficiency, content scalability, and reducing cycle times through automation and centralized operating models. Vendor rationalization creates strategic partnership opportunities.',
      signals:[
        { name:'Content Automation', source:'Corporate transformation roadmap', evidence:'Advanced technologies identified as a transformation pillar. Transformation programs emphasize technology-driven simplification.', reference:'Takeda Transformation Roadmap 2026', implication:'Opportunity for AI-driven medical writing and review acceleration.' },
        { name:'Medical Review Optimization', source:'Medical affairs operational efficiency initiatives', evidence:'JPY 200B+ savings target by FY2028 requires significant operational transformation across all functions including medical content.', reference:'Takeda Transformation Savings Target Announcement', implication:'GenAI-powered medical content automation with medical affairs reducing cycle times and compliance risk.' },
        { name:'Vendor Consolidation', source:'Transformation announcements and JPY 200B savings program', evidence:'Vendor rationalization creates opportunity for strategic partnerships. Procurement centralization via SAP Ariba under Accenture scope.', reference:'Takeda Transformation Announcements / Procurement Documents', implication:'Vendor rationalization creates opportunity for strategic partnerships and managed services — expand before roster locks.' },
        { name:'Cost Transformation', source:'FY2028 cost reduction program', evidence:'JPY 200B+ savings target creates urgency for vendor efficiency programs and automation-first operating models.', reference:'Takeda FY2028 Cost Transformation Program', implication:'Position Freyr as cost transformation partner: automation-first, measurable FTE reduction, auditable savings.' },
      ]
    },
  ]

  return (
    <div>
      {activeModal && <SignalModal signal={activeModal} onClose={()=>setActiveModal(null)}/>}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {cards.map(card=>(
          <div key={card.num} style={{ background:'#1B365D', borderRadius:12, padding:'22px 18px 20px', position:'relative', color:'white', boxShadow:'0 8px 24px rgba(27,54,93,0.22)' }}>
            {/* Ribbon bookmark */}
            <div style={{ position:'absolute', top:-8, left:18, width:44, height:52, background:'#D4AF37', color:'#1B365D', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, clipPath:'polygon(0 0,100% 0,100% 78%,50% 100%,0 78%)' }}>{card.num}</div>
            <h3 style={{ marginTop:28, marginBottom:10, fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:700, color:'#fff', lineHeight:1.25 }}>{card.title}</h3>
            <p style={{ color:'rgba(228,234,242,0.88)', lineHeight:1.6, fontSize:14, margin:0 }}>{card.body}</p>
            <div style={{ height:1, background:'rgba(255,255,255,0.14)', margin:'16px 0 13px' }}/>
            <div style={{ fontSize:11, letterSpacing:'0.1em', fontWeight:700, marginBottom:10, color:'#DCE6F3', textTransform:'uppercase' }}>SIGNALS TRIANGULATED</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {card.signals.map(sig=>(
                <button key={sig.name} onClick={()=>setActiveModal(sig)} style={{ border:'1px solid #D4AF37', color:'#FFD86A', padding:'7px 11px', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600, background:'transparent', transition:'all 0.18s', fontFamily:'Source Sans Pro,sans-serif' }}
                  onMouseEnter={e=>{ e.currentTarget.style.background='#D4AF37'; e.currentTarget.style.color='#1B365D'; e.currentTarget.style.transform='translateY(-1px)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#FFD86A'; e.currentTarget.style.transform='none' }}>
                  {sig.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── NUDGE INTELLIGENCE TABS ─────────────────────────────────────────────────
function NudgeIntel({ accountId, accountName }: { accountId:string; accountName:string }) {
  const [tab, setTab] = useState<'companyProfile'|'keySignals'|'competitiveIntelligence'|'salesIntelligence'>('companyProfile')
  const [activeSignalModal, setActiveSignalModal] = useState<{ name:string; source:string; evidence:string; reference:string; implication:string }|null>(null)
  const data = NUDGE_PROFILE[accountId]
  if (!data) return null
  const tabs: [typeof tab,string][] = [
    ['companyProfile','Company Profile'],
    ['keySignals','Key Signals'],
    ['competitiveIntelligence','Competitive Intelligence'],
    ['salesIntelligence','Sales Intelligence'],
  ]

  // Helper: get signal detail from current tab's cards
  const getSignalDetail = (cards: any[], signalName: string) => {
    for (const card of cards) {
      if (card.signalDetails?.[signalName]) {
        return { name: signalName, ...card.signalDetails[signalName] }
      }
    }
    return { name: signalName, source: 'Nudge Intelligence Signal', evidence: `Detected signal: ${signalName}`, reference: 'Account Intelligence', implication: 'See full card context for Freyr implication.' }
  }

  const renderNavyCards = (cards: any[], tabKey: string) => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
      {(cards||[]).map((c:any, i:number) => (
        <div key={c.title} style={{ background:'#1B365D', borderRadius:12, padding:'22px 18px 20px', position:'relative', color:'white', boxShadow:'0 8px 24px rgba(27,54,93,0.22)' }}>
          {/* Ribbon bookmark */}
          <div style={{ position:'absolute', top:-8, left:18, width:44, height:52, background:'#D4AF37', color:'#1B365D', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, clipPath:'polygon(0 0,100% 0,100% 78%,50% 100%,0 78%)' }}>{i+1}</div>
          <h3 style={{ marginTop:28, marginBottom:10, fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:700, color:'#fff', lineHeight:1.25 }}>{c.title}</h3>
          <p style={{ color:'rgba(228,234,242,0.88)', lineHeight:1.65, fontSize:14, margin:0, fontFamily:'Source Sans Pro,sans-serif' }}>{c.body}</p>
          <div style={{ height:1, background:'rgba(255,255,255,0.14)', margin:'16px 0 13px' }}/>
          <div style={{ fontSize:11, letterSpacing:'0.1em', fontWeight:700, marginBottom:10, color:'#DCE6F3', textTransform:'uppercase', fontFamily:'Source Sans Pro,sans-serif' }}>SIGNALS TRIANGULATED</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {(c.signals||[]).map((s:string) => (
              <button key={s} onClick={() => setActiveSignalModal(getSignalDetail([c], s))}
                style={{ border:'1px solid #D4AF37', color:'#FFD86A', padding:'7px 11px', borderRadius:6, cursor:'pointer', fontSize:12.5, fontWeight:600, background:'transparent', transition:'all 0.18s', fontFamily:'Source Sans Pro,sans-serif' }}
                onMouseEnter={e => { e.currentTarget.style.background='#D4AF37'; e.currentTarget.style.color='#1B365D'; e.currentTarget.style.transform='translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#FFD86A'; e.currentTarget.style.transform='none' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div>
      {activeSignalModal && <SignalModal signal={activeSignalModal} onClose={() => setActiveSignalModal(null)}/>}
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
        {tabs.map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding:'8px 18px', borderRadius:22, cursor:'pointer', fontSize:14, fontWeight:700, fontFamily:'Source Sans Pro,sans-serif', border:tab===k?'none':'1px solid var(--border)', background:tab===k?'var(--navy)':'var(--bg-surface)', color:tab===k?'#fff':'var(--text-2)', transition:'all 160ms', boxShadow:tab===k?'0 2px 10px rgba(27,54,93,0.25)':'none' }}>{l}</button>
        ))}
      </div>
      <div style={{ fontSize:12, fontWeight:600, color:'var(--text-3)', letterSpacing:'0.04em', marginBottom:16, fontFamily:'Source Sans Pro,sans-serif' }}>
        Nudge Signal Intelligence — {tabs.find(t=>t[0]===tab)![1]} · {accountName}
      </div>

      {/* Company Profile tab */}
      {tab === 'companyProfile' && renderNavyCards(data.companyProfile, 'companyProfile')}

      {/* Key Signals tab */}
      {tab === 'keySignals' && renderNavyCards(data.keySignals, 'keySignals')}

      {/* Competitive Intelligence tab */}
      {tab === 'competitiveIntelligence' && <CompetitiveIntel accountId={accountId}/>}

      {/* Sales Intelligence tab */}
      {tab === 'salesIntelligence' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {renderNavyCards(data.salesIntelligence, 'salesIntelligence')}
          <SalesIntel accountId={accountId}/>
        </div>
      )}
    </div>
  )
}

// ─── PIPELINE SECTION ────────────────────────────────────────────────────────
function PipelineSection({ info, isRevance }: { info:any; isRevance:boolean }) {
  const [openA, setOpenA] = useState<number|null>(null)
  const [openT, setOpenT] = useState<number|null>(null)
  const pi = info.pipelineInsights
  if (!pi||typeof pi==='string') return <p style={{ fontSize:15, color:'var(--navy)', lineHeight:1.85 }}>{pi||'Pipeline data not available.'}</p>
  const SC: Record<string,any> = {
    'COMMERCIAL':           { bg:'rgba(16,185,129,0.1)', c:'#10b981' },
    'COMMERCIAL — PV GAP':  { bg:'rgba(220,38,38,0.1)', c:'#dc2626' },
    'UNMET REGULATORY NEED':{ bg:'rgba(220,38,38,0.1)', c:'#dc2626' },
    'IN DEVELOPMENT':       { bg:'rgba(217,119,6,0.1)', c:'#d97706' },
    'PHASE II':             { bg:'rgba(27,54,93,0.08)', c:'var(--navy)' },
    'ACTIVE':               { bg:'rgba(16,185,129,0.1)', c:'#10b981' },
    'STRONG':               { bg:'rgba(16,185,129,0.12)', c:'#059669' },
    'ACTIVE — UPGRADE':     { bg:'rgba(217,119,6,0.1)', c:'#d97706' },
    'OPPORTUNITY':          { bg:'rgba(27,54,93,0.08)', c:'var(--navy)' },
  }
  return (
    <div>
      {pi.summary && <div style={{ padding:'18px 22px', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12, marginBottom:24, boxShadow:'var(--glow-card)' }}><p style={{ fontSize:15, color:'var(--navy)', lineHeight:1.85, margin:0 }}>{pi.summary}</p></div>}
      {(pi.assetProfile||pi.currentBase) && (
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--navy)', fontFamily:'Playfair Display,serif', marginBottom:14 }}>{isRevance?'DAXXIFY Asset Profile — Regulatory Lifecycle':'Current Revenue Base — Core Services'}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {(pi.assetProfile||pi.currentBase).map((item:any,i:number)=>{
              const statusImpact: Record<string,'High'|'Medium'|'Low'> = {
                'COMMERCIAL':'High','COMMERCIAL — PV GAP':'High','UNMET REGULATORY NEED':'High',
                'IN DEVELOPMENT':'Medium','PHASE II':'Medium','ACTIVE':'High',
                'STRONG':'High','ACTIVE — UPGRADE':'Medium','OPPORTUNITY':'Medium',
              }
              const statusUrgency: Record<string,'High'|'Medium'|'Low'> = {
                'COMMERCIAL':'High','COMMERCIAL — PV GAP':'High','UNMET REGULATORY NEED':'High',
                'IN DEVELOPMENT':'Low','PHASE II':'Medium','ACTIVE':'High',
                'STRONG':'Medium','ACTIVE — UPGRADE':'Medium','OPPORTUNITY':'Low',
              }
              return (
                <DropdownInsightCard key={i} index={i}
                  title={item.dimension}
                  description={item.detail||`Status: ${item.status}`}
                  impact={statusImpact[item.status]||'Medium'}
                  urgency={statusUrgency[item.status]||'Medium'}
                  confidence={['95%','92%','89%','86%','82%','78%'][i%6]}
                  meta={<span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:
                    item.status.includes('GAP')||item.status.includes('UNMET')?'rgba(220,38,38,0.1)':
                    item.status.includes('COMMERCIAL')||item.status.includes('ACTIVE')||item.status.includes('STRONG')?'rgba(16,185,129,0.1)':
                    'rgba(217,119,6,0.1)', color:
                    item.status.includes('GAP')||item.status.includes('UNMET')?'#dc2626':
                    item.status.includes('COMMERCIAL')||item.status.includes('ACTIVE')||item.status.includes('STRONG')?'#10b981':
                    '#d97706' }}>{item.status}</span>}
                  whyItMatters={`This regulatory lifecycle stage directly determines Freyr's service entry point and revenue timing. ${item.status.includes('GAP')||item.status.includes('UNMET') ? 'The gap represents an immediate, uncontested Freyr opportunity.' : 'Active status means live obligations that Freyr should be supporting now.'}`}
                  actions={item.status.includes('COMMERCIAL')&&item.status.includes('GAP') ? [
                    'Initiate EU/EMA scoping conversation with Head of RA immediately',
                    'Prepare DAXXIFY EMA Centralised Procedure dossier timeline estimate',
                    'Deploy freya.intelligence EMA pathway analysis for 60-day POC',
                  ] : item.status.includes('COMMERCIAL') ? [
                    'Confirm Freyr engagement status on this programme',
                    'Identify any service gaps (PV, labeling, MLR) in current scope',
                    'Expand scope to include SUBMIT PRO and REMS compliance support',
                  ] : [
                    'Monitor regulatory pathway milestones for Freyr entry timing',
                    'Identify regulatory team lead for this programme',
                    'Prepare service proposal 6-12 months ahead of filing dates',
                  ]}
                />
              )
            })}
          </div>
        </div>
      )}
      {pi.revenueTimeline && (
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--navy)', fontFamily:'Playfair Display,serif', marginBottom:12 }}>Revenue Timeline — 3-Year Projection</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
              <thead><tr style={{ background:'var(--navy)', color:'#fff' }}>
                {['Service Track','FY2026 H2','FY2027','FY2028','3-Year Total','Urgency'].map(h=>(
                  <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11, fontWeight:700, letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {pi.revenueTimeline.map((r:any,i:number)=>{
                  const tot=r.service.includes('TOTAL')
                  const UM: Record<string,any> = { 'MOST URGENT':{bg:'rgba(220,38,38,0.1)',c:'#dc2626'}, 'URGENT':{bg:'rgba(234,88,12,0.1)',c:'#ea580c'}, 'HIGH':{bg:'rgba(217,119,6,0.1)',c:'#d97706'}, 'ACTIVE':{bg:'rgba(16,185,129,0.1)',c:'#10b981'}, 'NEAR-TERM':{bg:'rgba(16,185,129,0.1)',c:'#10b981'}, 'TARGET':{bg:'rgba(27,54,93,0.12)',c:'var(--navy)'}, 'FY2027':{bg:'rgba(27,54,93,0.08)',c:'var(--navy)'} }
                  const uc = UM[r.urgency]||{ bg:'rgba(27,54,93,0.08)', c:'var(--navy)' }
                  return (
                    <tr key={i} style={{ background:tot?'var(--navy-faint)':i%2===0?'var(--bg-surface)':'var(--bg-raised)', fontWeight:tot?700:400 }}>
                      <td style={{ padding:'10px 14px', color:'var(--navy)', borderBottom:'1px solid var(--border)', fontWeight:tot?800:600 }}>{r.service}</td>
                      {[r.fy26h2,r.fy27,r.fy28,r.total].map((v:string,j:number)=>(
                        <td key={j} style={{ padding:'10px 14px', color:tot?'var(--gold-muted)':'var(--text-2)', borderBottom:'1px solid var(--border)', fontWeight:tot?800:500 }}>{v}</td>
                      ))}
                      <td style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)' }}>
                        <span style={{ padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:700, background:uc.bg, color:uc.c }}>{r.urgency}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {pi.technologyPipeline && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--navy)', fontFamily:'Playfair Display,serif', marginBottom:12 }}>Technology Platform — Sales Stage & Entry Path</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {pi.technologyPipeline.map((t:any,i:number)=>(
              <div key={i} onClick={()=>setOpenT(openT===i?null:i)} style={{ display:'grid', gridTemplateColumns:'190px 1fr 110px 30px', gap:14, padding:'13px 18px', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, cursor:'pointer', boxShadow:'var(--glow-card)' }}>
                <div style={{ fontFamily:'Playfair Display,serif', fontSize:13.5, fontWeight:700, color:'var(--navy)' }}>{t.platform}</div>
                <div>
                  <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6, margin:0 }}>{t.entryPath}</p>
                  {openT===i&&t.nextAction&&<div style={{ marginTop:8, fontSize:12.5, color:'#10b981', fontWeight:600, animation:'slideDown 200ms ease' }}>→ {t.nextAction}</div>}
                </div>
                <span style={{ padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:700, height:'fit-content', background:t.stage.includes('NEAR')||t.stage.includes('TRIAL')||t.stage.includes('PROPOSAL')?'rgba(16,185,129,0.1)':'rgba(27,54,93,0.08)', color:t.stage.includes('NEAR')||t.stage.includes('TRIAL')||t.stage.includes('PROPOSAL')?'#10b981':'var(--navy)' }}>{t.stage}</span>
                <ChevronDown size={13} style={{ color:'var(--text-3)', transform:openT===i?'rotate(180deg)':'none', transition:'transform 200ms', marginTop:2 }}/>
              </div>
            ))}
          </div>
        </div>
      )}
      {pi.growthServicesOpportunity && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--navy)', fontFamily:'Playfair Display,serif', marginBottom:12 }}>Growth Services — Cross-Sell Pipeline</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {pi.growthServicesOpportunity.map((g:any,i:number)=>(
              <div key={i} style={{ padding:'14px 18px', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10, boxShadow:'var(--glow-card)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ fontWeight:700, color:'var(--navy)', fontSize:14 }}>{g.service}</div>
                  <span style={{ padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(27,54,93,0.08)', color:'var(--navy)', whiteSpace:'nowrap' }}>{g.timing}</span>
                </div>
                <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6, margin:'0 0 8px' }}>{g.profile}</p>
                <span style={{ padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(16,185,129,0.09)', color:'#10b981' }}>{g.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {pi.landExpandTransform && (
        <div style={{ marginTop:24 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'var(--navy)', fontFamily:'Playfair Display,serif', marginBottom:14 }}>Land → Expand → Transform: 3-Year Account Ambition</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            {pi.landExpandTransform.split('|').map((phase:string,i:number)=>{
              const colors=['#1B365D','#D4AF37','#10b981']
              const labels=['🌱 LAND','📈 EXPAND','🚀 TRANSFORM']
              const parts=phase.trim().split(':')
              return (
                <div key={i} style={{ padding:'16px 18px', background:'var(--bg-surface)', borderTop:`3px solid ${colors[i]}`, borderRadius:'0 0 12px 12px', border:'1px solid var(--border)', boxShadow:'var(--glow-card)' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:colors[i], textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{labels[i]}</div>
                  <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.65, margin:0 }}>{parts.slice(1).join(':').trim()}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── NEWS MODAL ──────────────────────────────────────────────────────────────
function NewsModal({ article, onClose }: { article:any; onClose:()=>void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width:680, maxWidth:'94vw', padding:28 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:16 }}>
          <div style={{ flex:1 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'var(--gold-muted)', letterSpacing:'0.12em', textTransform:'uppercase' }}>{article.date}</span>
            <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:20, marginTop:5, lineHeight:1.3, color:'var(--navy)', margin:'5px 0 0' }}>{article.title}</h2>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', flexShrink:0 }}><X size={20}/></button>
        </div>
        <div style={{ height:3, background:'linear-gradient(90deg,var(--gold),var(--navy))', marginBottom:20, borderRadius:2 }}/>
        <p style={{ fontSize:14.5, color:'var(--text-2)', lineHeight:1.85 }}>{article.body}</p>
        <div style={{ marginTop:20 }}>
          <a href="#" onClick={e=>e.preventDefault()} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:8, background:'var(--navy)', color:'#fff', fontSize:13.5, fontWeight:600, textDecoration:'none' }}>
            Read full article <ArrowRight size={13}/>
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
// ─── LAYER NAV ACCORDION ─────────────────────────────────────────────────────
function LayerNav({ layer, active, setActive }: { layer:any; active:string; setActive:(id:string)=>void }) {
  const isLayerActive = layer.items.some((i:any) => i.id === active)
  const [open, setOpen] = useState(isLayerActive)

  useEffect(() => {
    if (isLayerActive) setOpen(true)
  }, [isLayerActive])

  return (
    <div>
      {/* ── Layer group header ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', display:'flex', alignItems:'center',
          padding:'9px 12px 9px 14px',
          background: isLayerActive ? `${layer.color}12` : 'transparent',
          border:'none', borderLeft:`3px solid ${isLayerActive ? layer.color : 'transparent'}`,
          cursor:'pointer', transition:'background 120ms',
        }}
        onMouseEnter={e => { if(!isLayerActive) e.currentTarget.style.background='var(--bg-hover)' }}
        onMouseLeave={e => { e.currentTarget.style.background = isLayerActive ? `${layer.color}12` : 'transparent' }}
      >
        <span style={{ fontSize:16, flexShrink:0, marginRight:8, lineHeight:1 }}>{layer.icon}</span>
        <span style={{
          flex:1, fontSize:12.5, fontWeight:800, textTransform:'uppercase',
          letterSpacing:'0.06em', fontFamily:'Source Sans Pro,sans-serif',
          color: isLayerActive ? layer.color : '#334155',
          textAlign:'left', lineHeight:1,
        }}>{layer.label}</span>
        <ChevronDown size={13} style={{
          color: isLayerActive ? layer.color : '#94a3b8',
          transform: open ? 'rotate(180deg)' : 'none',
          transition:'transform 180ms', flexShrink:0,
        }}/>
      </button>

      {/* ── Child items ── */}
      {open && layer.items.map((item:any) => {
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            style={{
              width:'100%', display:'flex', alignItems:'center',
              padding:'8px 12px 8px 34px',
              background: isActive ? `${layer.color}14` : 'transparent',
              border:'none', borderLeft:`3px solid ${isActive ? layer.color : 'transparent'}`,
              cursor:'pointer', transition:'background 120ms',
            }}
            onMouseEnter={e => { if(!isActive) e.currentTarget.style.background='var(--bg-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.background = isActive ? `${layer.color}14` : 'transparent' }}
          >
            <span style={{ fontSize:13, flexShrink:0, marginRight:8, lineHeight:1, color: isActive ? layer.color : '#94a3b8' }}>{item.icon}</span>
            <span style={{
              fontSize:13.5, fontWeight: isActive ? 700 : 500,
              color: isActive ? layer.color : '#475569',
              fontFamily:'Source Sans Pro,sans-serif', lineHeight:1.2,
              textAlign:'left',
            }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── FLIP CARD COMPONENT ─────────────────────────────────────────────────────
function FlipCard({ icon, cat, front, sub, back, accentColor }: { icon:string; cat:string; front:string; sub:string; back:string; accentColor?:string }) {
  const [flipped, setFlipped] = useState(false)
  const accent = accentColor || '#D4AF37'
  return (
    <div className={`flip-card${flipped?' flipped':''}`} style={{ height:280 }} onClick={()=>setFlipped(f=>!f)}>
      <div className="flip-card-inner">
        {/* FRONT */}
        <div className="flip-face flip-front" style={{ borderTop:`4px solid ${accent}` }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:19, marginBottom:10, flexShrink:0 }}>{icon}</div>
          <div style={{ fontSize:10.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.14em', color:accent, marginBottom:6, fontFamily:'Source Sans Pro,sans-serif', lineHeight:1.2 }}>{cat}</div>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:700, color:'#1B365D', marginBottom:5, lineHeight:1.25, flex:'0 0 auto' }}>{front}</div>
          <div style={{ fontSize:12.5, color:'#667085', fontFamily:'Source Sans Pro,sans-serif', lineHeight:1.4, flex:1 }}>{sub}</div>
          <div style={{ fontSize:11, color:'#aab4c0', fontFamily:'Source Sans Pro,sans-serif', marginTop:8, flex:'0 0 auto' }}>Click to flip →</div>
        </div>
        {/* BACK */}
        <div className="flip-face flip-back">
          <div style={{ fontSize:10.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.14em', color:accent, marginBottom:8, fontFamily:'Source Sans Pro,sans-serif', lineHeight:1.2, flex:'0 0 auto', borderBottom:'1px solid rgba(255,255,255,0.15)', paddingBottom:8 }}>{cat}</div>
          {/* Body — scrollable when content overflows */}
          <div style={{ flex:1, overflowY:'auto', paddingRight:2 }}>
            <p style={{ fontSize:13, lineHeight:1.8, color:'rgba(255,255,255,0.92)', margin:0, fontFamily:'Source Sans Pro,sans-serif', whiteSpace:'pre-line' }}>{back}</p>
          </div>
          <div style={{ fontSize:10.5, color:'rgba(255,255,255,0.35)', marginTop:6, flex:'0 0 auto', fontFamily:'Source Sans Pro,sans-serif' }}>↑ Scroll · Click to flip back</div>
        </div>
      </div>
    </div>
  )
}

// ─── ACCOUNT DOSSIER GENERATOR ────────────────────────────────────────────────
function generateAccountDossierHtml(info: any, accountId: string): string {
  const esc = (s: any) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  const navy = '#1B365D'
  const gold = '#D4AF37'

  const sec = (title: string, content: string) => content ? `
    <div class="section">
      <div class="section-title">${esc(title)}</div>
      ${content}
    </div>` : ''

  const card = (content: string) => `<div class="card">${content}</div>`
  const label = (l: string) => `<div class="label">${esc(l)}</div>`
  const val = (v: string) => `<div class="val">${esc(v)}</div>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${esc(info.name)} — Account Intelligence Dossier</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',system-ui,sans-serif;font-size:14px;color:#1a2a3a;background:#f4f6fa}
  .page{max-width:960px;margin:0 auto;padding:40px 32px;background:#fff;min-height:100vh}
  .header{background:${navy};border-radius:16px;padding:28px 32px;margin-bottom:32px;color:#fff}
  .header h1{font-size:28px;font-weight:800;margin-bottom:6px}
  .header p{font-size:14px;color:rgba(255,255,255,0.75);line-height:1.6}
  .nudge-signal{background:rgba(212,175,55,0.1);border:1.5px solid ${gold};border-radius:12px;padding:18px 22px;margin-bottom:28px}
  .nudge-signal .ns-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:${gold};margin-bottom:8px}
  .nudge-signal p{font-size:14px;color:${navy};line-height:1.75}
  .section{margin-bottom:28px}
  .section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:${gold};margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e8edf5}
  .card{background:#f4f6fa;border-radius:10px;padding:16px;border:1px solid #e0e8f0;margin-bottom:10px}
  .label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#5a7499;margin-bottom:5px}
  .val{font-size:14px;color:${navy};line-height:1.75;white-space:pre-wrap}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
  .stat{background:#f4f6fa;border-radius:10px;padding:14px;border:1px solid #e0e8f0;text-align:center}
  .stat-val{font-size:20px;font-weight:800;color:${navy};margin-bottom:4px}
  .stat-label{font-size:12px;color:#5a7499;font-weight:600}
  .priority{border-left:4px solid ${gold};padding:14px 18px;background:#f4f6fa;border-radius:0 10px 10px 0;margin-bottom:10px}
  .priority-num{font-size:12px;font-weight:700;color:${gold};margin-bottom:4px}
  .priority-title{font-size:14px;font-weight:700;color:${navy};margin-bottom:6px}
  .priority-body{font-size:13px;color:#4a6080;line-height:1.65}
  .swot-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .swot-s{border-top:4px solid #10b981}.swot-w{border-top:4px solid #dc2626}
  .swot-o{border-top:4px solid #b89428}.swot-t{border-top:4px solid ${navy}}
  .nba{padding:12px 16px;background:#f4f6fa;border-left:4px solid ${navy};border-radius:0 8px 8px 0;margin-bottom:8px}
  .nba-action{font-size:14px;font-weight:700;color:${navy};margin-bottom:4px}
  .nba-detail{font-size:13px;color:#4a6080;line-height:1.6}
  .bullet{font-size:13px;color:#4a6080;line-height:1.65;padding:4px 0 4px 16px;border-left:2px solid #e0e8f0;margin-bottom:6px}
  .footer{text-align:center;padding:24px;color:#8a9baf;font-size:12px;border-top:1px solid #e0e8f0;margin-top:32px}
  @media print{body{background:#fff}.page{padding:20px}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <h1>${esc(info.name)}</h1>
    <p>Account Intelligence Dossier · Generated ${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}</p>
  </div>

  ${info.nudgeSignal ? `
  <div class="nudge-signal">
    <div class="ns-label">⚡ Nudge Intelligence Signal</div>
    <p>${esc(info.nudgeSignal)}</p>
  </div>` : ''}

  ${info.accountContext ? sec('Account Context', `<div class="val">${esc(info.accountContext)}</div>`) : ''}

  ${(info.financialSnapshot||[]).length ? sec('Financial Snapshot', `
    <div class="grid-4">
      ${(info.financialSnapshot||[]).map((f:any)=>`
        <div class="stat">
          <div class="stat-val">${esc(f.value)}</div>
          <div class="stat-label">${esc(f.label)}</div>
        </div>`).join('')}
    </div>`) : ''}

  ${(info.emergingPriorities||[]).length ? sec('Emerging Priorities', `
    ${(info.emergingPriorities||[]).map((p:string,i:number)=>`
      <div class="bullet">${i+1}. ${esc(p)}</div>`).join('')}`) : ''}

  ${(info.strategicPriorities||[]).length ? sec('Strategic Priorities', `
    ${(info.strategicPriorities||[]).map((p:any,i:number)=>typeof p === 'string' ? `
      <div class="priority"><div class="priority-title">${i+1}. ${esc(p)}</div></div>` : `
      <div class="priority" style="border-color:${p.priority==='MOST URGENT'?'#dc2626':p.priority==='URGENT'?'#ea580c':p.priority==='HIGH'?'#d97706':p.priority==='ACTIVE'?'#10b981':'#1B365D'}">
        <div class="priority-num">${i+1} · ${esc(p.priority)}</div>
        <div class="priority-title">${esc(p.title)}</div>
        ${p.body ? `<div class="priority-body">${esc(p.body)}</div>` : ''}
        ${p.freyrAction ? `<div class="label" style="margin-top:10px">FREYR ACTION</div><div class="priority-body">${esc(p.freyrAction)}</div>` : ''}
      </div>`).join('')}`) : ''}

  ${(info.orgLeadership||[]).length ? sec('Key Stakeholders', `
    <div class="grid-2">
      ${(info.orgLeadership||[]).map((p:any)=>`
        <div class="card">
          <div class="label">${esc(p.role)}</div>
          <div class="val" style="font-weight:700;margin-bottom:6px">${esc(p.name)}</div>
          ${p.insight ? `<div style="font-size:12.5px;color:#4a6080;line-height:1.6">${esc(p.insight)}</div>` : ''}
          ${(p.dos||[]).length ? `<div class="label" style="margin-top:8px">DOS</div>${p.dos.map((d:string)=>`<div style="font-size:12px;color:#059669;margin-bottom:2px">✓ ${esc(d)}</div>`).join('')}` : ''}
          ${(p.donts||[]).length ? `<div class="label" style="margin-top:6px">DON'TS</div>${p.donts.map((d:string)=>`<div style="font-size:12px;color:#dc2626;margin-bottom:2px">✗ ${esc(d)}</div>`).join('')}` : ''}
        </div>`).join('')}
    </div>`) : ''}

  ${info.swot ? sec('SWOT Analysis', `
    <div class="swot-grid">
      ${[['S','Strengths','swot-s'],['W','Weaknesses','swot-w'],['O','Opportunities','swot-o'],['T','Threats','swot-t']].map(([k,l,cls])=>`
        <div class="card ${cls}">
          <div class="label">${l}</div>
          ${((info.swot as any)[k]||[]).map((item:string)=>`<div class="bullet">• ${esc(item)}</div>`).join('')}
        </div>`).join('')}
    </div>`) : ''}

  ${(info.nextBestAction||[]).length ? sec('Next Best Actions', `
    ${(info.nextBestAction||[]).map((a:any,i:number)=>typeof a === 'string' ? `
      <div class="nba"><div class="nba-action">${i+1}. ${esc(a)}</div></div>` : `
      <div class="nba">
        <div class="nba-action">${i+1}. ${esc(a.action||a.title||'')}</div>
        ${a.detail ? `<div class="nba-detail">${esc(a.detail)}</div>` : ''}
        ${a.owner ? `<div style="font-size:12px;color:#5a7499;margin-top:4px;font-weight:600">Owner: ${esc(a.owner)} · ${esc(a.urgency||a.priority||'')}</div>` : ''}
      </div>`).join('')}`) : ''}

  ${(info.bigBets||[]).length ? sec('Big Bets', `
    ${(info.bigBets||[]).map((b:any,i:number)=>`
      <div class="card" style="margin-bottom:12px">
        ${b.tag ? `<div class="label">${esc(b.tag)}</div>` : ''}
        <div class="val" style="font-weight:700;margin-bottom:6px">${i+1}. ${esc(b.title||b)}</div>
        ${b.body ? `<div style="font-size:13px;color:#4a6080;line-height:1.65;margin-bottom:8px">${esc(b.body)}</div>` : ''}
        ${(b.bullets||[]).map((x:string)=>`<div class="bullet">• ${esc(x)}</div>`).join('')}
        ${b.freyrResponse ? `<div class="label" style="margin-top:8px">FREYR RESPONSE</div><div style="font-size:13px;color:${navy};line-height:1.65">${esc(b.freyrResponse)}</div>` : ''}
      </div>`).join('')}`) : ''}

  ${info.investmentStrategy ? sec('Investment Strategy', `<div class="val">${esc(info.investmentStrategy)}</div>`) : ''}

  <div class="footer">The Nudge Intelligence · Powered by Freyr Solutions · Confidential — Internal Use Only · ${new Date().getFullYear()}</div>
</div>
<script>window.onload=()=>window.print()</script>
</body>
</html>`
}

export default function AccountInfoPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const [active, setActive] = useState('nudge')
  const [newsTab, setNewsTab] = useState<'internal'|'external'>('internal')
  const [selectedArticle, setSelectedArticle] = useState<any>(null)
  const [notes, setNotes] = useState('')

  const account = ACCOUNTS_LIST.find(a=>a.id===id)
  const info = id ? ACCOUNT_INFO[id] : null

  useEffect(()=>{ setActive('nudge'); window.scrollTo({top:0}) }, [id])

  if (!account||!info) {
    return (
      <div>
        <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:26, color:'var(--navy)', margin:'0 0 8px' }}>Account Info</h1>
        <p style={{ fontSize:14.5, color:'var(--text-3)', marginBottom:24 }}>Select an account to view detailed intelligence.</p>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {ACCOUNTS_LIST.map(a=>(
            <div key={a.id} className="card card-clickable" style={{ padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }} onClick={()=>nav(`/accounts/${a.id}`)}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:5, height:40, borderRadius:3, background:'var(--gold)', flexShrink:0 }}/>
                <div>
                  <div style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:700, color:'var(--navy)' }}>{a.name}</div>
                  <div style={{ fontSize:13, color:'var(--text-3)' }}>{a.executivesMapped} executives mapped</div>
                </div>
              </div>
              <ArrowRight size={18} style={{ color:'var(--gold-muted)' }}/>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const isRevance = id==='revance'
  const externalNews = id==='revance' ? NEWS_EXTERNAL_REVANCE : NEWS_EXTERNAL_TAKEDA
  const news = newsTab==='internal' ? NEWS_INTERNAL : externalNews

  const freyrPlays = isRevance ? [
    { title:'EU Regulatory Authorisation Programme', subtitle:'EMA Centralised Procedure — DAXXIFY', icon:'🇪🇺', color:'#1B365D', score:92, details:[{label:'Market Opportunity',value:'€1.8B EU aesthetics by 2027'},{label:'Regulatory Gap',value:'4+ yrs no EMA authorisation'},{label:'Timeline',value:'H2 2026 EMA pre-submission'},{label:'Differentiator',value:'850+ EU in-country affiliates'}], bullets:['DAXXIFY FDA-approved September 2022 — zero EU commercial revenue after 3+ years','Crown PE thesis requires DAXXIFY EU expansion for $924M acquisition ROI — board-level priority','Freyr 850+ EU affiliates + freya.intelligence EMA pathway analysis: no competitor equivalent','No incumbent — Freyr can own this programme from day one'], implication:'Freyr is the single regulatory partner who can deliver the full EMA authorisation programme. This is the uncontested entry point.' },
    { title:'PV Programme — DAXXIFY Cervical Dystonia', subtitle:'GxP-Compliant PV Operations Since May 2024', icon:'⚕️', color:'#D4AF37', score:85, details:[{label:'Commercial Since',value:'May 2024 (13+ months active)'},{label:'PV Requirement',value:'PSUR, Signal Detection, REMS'},{label:'Black Box Warning',value:'Highest FDA safety category'},{label:'Entry',value:'Single question to Head of RA'}], bullets:['Active commercial PV programme since May 2024 — 13+ months running with no confirmed Freyr engagement','Botulinum toxin therapeutics carry a Black Box Warning requiring REMS, ongoing PSUR/PBRER, signal detection','Entry: one question — "Who is running your PV programme for cervical dystonia?"','Lowest-friction cross-sell in any account: adjacent to existing RA relationship, no new relationship investment'], implication:'PV obligation exists today. Single conversation to unlock $3.6M revenue track. Act this week.' },
    { title:'Variation Management — NMPA China + Multi-Indication', subtitle:'VIA Platform: Fosun China + Phase II Pipeline', icon:'🔄', color:'#2e5a96', score:78, details:[{label:'Active Pathways',value:'FDA, NMPA China, Phase II'},{label:'Partner',value:'Fosun Pharma (China)'},{label:'Tool',value:'VIA — Variation Identification Agent'},{label:'Sponsor',value:'Thomas Hitchcock (CInO)'}], bullets:['Fosun Pharma NMPA China development programme active and progressing — NMPA variation management workload increasing','VIA provides NMPA-specific variation recommendations natively — no competitor equivalent for China variations','DAXXIFY Phase II for upper limb spasticity + plantar fasciitis compounds variation management across geographies','Thomas Hitchcock (CInO) is the internal sponsor — approach as scientific peer on multi-indication complexity'], implication:"VIA is Freyr's technology right to win at Revance. No incumbent. Entry via Hitchcock as scientific peer, not as vendor." },
  ] : [
    { title:'Regulatory Operations — 3 H2 2026 Launches', subtitle:'oveporexton, rusfertide, zasocitinib', icon:'🚀', color:'#1B365D', score:95, details:[{label:'oveporexton',value:'BT + FT, FDA review H2 2026'},{label:'rusfertide',value:'Priority Review, H2 2026'},{label:'zasocitinib',value:'EU/US prep, H1 2027'},{label:'Risk',value:'4,500-person restructuring simultaneous'}], bullets:['oveporexton (TAK-861) narcolepsy type 1: Breakthrough Therapy + Fast Track. FDA review H2 2026. US/Japan/China NDA/MAA simultaneous','rusfertide (PV): FDA Priority Review designation. H2 2026 US launch target','zasocitinib (psoriasis): EU/US preparation. H1 2027 launch target','Three concurrent submissions during 4,500-person restructuring creates outsourcing mandate Freyr is uniquely positioned to fill','Robertson QBR Q3 2026 is the trigger for all three launch support streams'], implication:'This is the most urgent near-term entry. Robertson QBR in Q3 2026 — confirm resource allocation NOW.' },
    { title:'AI-Driven Regulatory Operations — JPY 200B Programme', subtitle:'freya fusion GenAI + VIA Automation', icon:'🤖', color:'#D4AF37', score:90, details:[{label:'Savings Target',value:'JPY 200B+ by FY2028'},{label:'FTE Reduction',value:'~4,500 globally'},{label:'Budget Owner',value:'Duprey — Transformation Office'},{label:'Tech Gatekeeper',value:'Ricci — CDTO'}], bullets:["Duprey's Transformation Office building FY2027 technology portfolio NOW — not future planning, immediate",'VIA eliminates manual variation management across 25+ manufacturing sites — auditable FTE reduction for Duprey','freya.intelligence replaces regulatory monitoring FTEs with automated intelligence across 95,000+ regulations','Lead with workforce framing: "How many FTEs does Takeda spend on regulatory monitoring?"',"Ricci's multi-model philosophy maps directly to freya fusion architecture"], implication:"Transformation Office is the budget owner. Duprey meeting via Robertson is the most critical single action in Q3 2026." },
    { title:'eCTD v4.0 + Robertson GenAI Dossier Programme', subtitle:"Robertson's published vision in production", icon:'📄', color:'#2e5a96', score:88, details:[{label:'PMDA Japan',value:'Mandatory 2026 — affects NOW'},{label:'Robertson Paper',value:'NatRevDrugDisc 2025'},{label:'GenAI Target',value:'50%+ compilation reduction'},{label:'Freyr Tool',value:'SUBMIT PRO + freya fusion'}], bullets:['PMDA Japan eCTD v4.0 mandate effective 2026 — affects oveporexton Japan NDA immediately, not in future','Robertson published (NatRevDrugDisc 2025) the case for cloud-based federated submission platforms — SUBMIT PRO + freya fusion IS this architecture in production','GenAI dossier programme target: 50%+ compilation time reduction. freya fusion multi-LLM with GxP guardrails is the production platform','Entry: "We read your 2025 NatRevDrugDisc paper — SUBMIT PRO and rDMS are the production-grade operational layer of exactly the architecture you described"'], implication:"Robertson has published the vision. Freyr built the production implementation. This is the single strongest technology entry argument." },
  ]

  return (
    <Ctx.Provider value={active}>
      <div style={{ paddingBottom:40 }}>
        {/* ─ Global flip-card styles used by Financial, SWOT, Investment, One-Min */}
        <style>{`
          .flip-card { perspective:1500px; cursor:pointer; }
          .flip-card-inner { position:relative; width:100%; height:100%; transform-style:preserve-3d; transition:transform 0.7s cubic-bezier(0.4,0,0.2,1); }
          .flip-card.flipped .flip-card-inner { transform:rotateY(180deg); }
          .flip-face { position:absolute; inset:0; border-radius:18px; backface-visibility:hidden; overflow:hidden; padding:20px; display:flex; flex-direction:column; }
          .flip-front { background:white; border:1px solid #E5E7EB; border-top:5px solid #D4AF37; box-shadow:0 10px 28px rgba(27,54,93,0.09); }
          .flip-back { background:linear-gradient(135deg,#1B365D 0%,#243e6b 100%); color:white; transform:rotateY(180deg); box-shadow:0 10px 28px rgba(27,54,93,0.22); }
          .flip-card:hover:not(.flipped) { transform:translateY(-4px); transition:transform 0.2s; }
        `}</style>

        {/* ─ Back button */}
        <div style={{ marginBottom:6 }}>
          <button onClick={()=>nav('/accounts')} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'var(--text-3)', fontSize:13, fontWeight:600, fontFamily:'Source Sans 3,sans-serif', padding:'6px 0', transition:'color 150ms' }}
            onMouseEnter={e=>e.currentTarget.style.color='var(--navy)'}
            onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>
            <ArrowLeft size={14}/> Back to Accounts
          </button>
        </div>

        {/* ─ Account header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:5, fontFamily:'Source Sans Pro,sans-serif' }}>ACCOUNT INTELLIGENCE JOURNEY</div>
            <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:20.5, color:'var(--navy)', margin:'0 0 8px', fontWeight:700 }}>{account.name}</h1>
            {/* Layer pills */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {NAV_LAYERS.map(l => {
                const isActive = l.items.some(i => i.id === active)
                return (
                  <span key={l.id} style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, fontFamily:'Source Sans Pro,sans-serif', background: isActive ? `${l.color}18` : 'var(--bg-raised)', color: isActive ? l.color : 'var(--text-3)', border: `1px solid ${isActive ? l.color+'40' : 'var(--border)'}`, transition:'all 200ms' }}>
                    {l.icon} {l.label}
                  </span>
                )
              })}
            </div>
          </div>
          <span style={{ padding:'4px 14px', borderRadius:20, fontSize:12.5, fontWeight:700, background:isRevance?'rgba(27,54,93,0.08)':'rgba(212,175,55,0.12)', color:isRevance?'var(--navy)':'#b89428', border:isRevance?'1px solid rgba(27,54,93,0.15)':'1px solid rgba(212,175,55,0.3)', fontFamily:'Source Sans Pro,sans-serif' }}>
            {isRevance?'FOCUSED GROWTH':'STRATEGIC PRIORITY'}
          </span>
        </div>

        {/* ─ Two-column layout */}
        <div style={{ display:'grid', gridTemplateColumns:'270px 1fr', gap:16, alignItems:'start' }}>

          {/* Left nav — layered accordion */}
          <div className="card" style={{ width:270, minWidth:270, flexShrink:0, padding:0, position:'sticky', top:16, boxShadow:'var(--shadow-xs)', maxHeight:'calc(100vh - 40px)', overflowY:'auto', overflowX:'hidden' }}>
            {/* Account brief shortcut */}
            <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:6, background:'linear-gradient(135deg,#D4AF37,#b89428)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>✦</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--navy)', fontFamily:'Source Sans Pro,sans-serif' }}>Account Brief</div>
                  <div style={{ fontSize:11, color:'var(--text-3)', fontFamily:'Source Sans Pro,sans-serif' }}>AI generated summary</div>
                </div>
              </div>
            </div>
            <div style={{ padding:'4px 0 8px' }}>
              {NAV_LAYERS.map(layer => (
                <LayerNav key={layer.id} layer={layer} active={active} setActive={(id: string) => { setActive(id); window.scrollTo({top:0,behavior:'smooth'}) }}/>
              ))}
            </div>
          </div>

          {/* Right content */}
          <div style={{ minWidth:0 }}>

            <Slide id="nudge">
              <SecHeader title="Account Intelligence" sub={`Triangulated account signals for ${account.name}`} accent="var(--gold)"/>
              <NudgeSignalCard text={info.nudgeSignal}/>
              <NudgeIntel accountId={id!} accountName={account.name}/>
              <div style={{ marginTop:20, padding:'20px 22px', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--navy)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>ACCOUNT CONTEXT</div>
                <p style={{ fontSize:14.5, color:'var(--text-2)', lineHeight:1.8, margin:0 }}>{info.accountContext}</p>
              </div>
            </Slide>

            <Slide id="one-min">
              <SecHeader title="One Minute Summary" sub={`Everything you need about ${account.name} in under 60 seconds`} accent="var(--gold)"/>
              <p style={{ fontSize:15, color:'var(--text-3)', marginBottom:20, fontFamily:'Source Sans Pro,sans-serif' }}>Click any card to flip for detail</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:28 }}>
                {(isRevance ? [
                  { icon:'⚡', cat:'Strategic Posture', front:'PE-Backed Growth', sub:'Crown Labs Acquisition', back:'Crown acquisition has shifted all priorities toward portfolio expansion, cost efficiency, and vendor consolidation. H2 2026 vendor review is the critical window.' },
                  { icon:'$', cat:'Revenue Opportunity', front:'$12M–16M', sub:'3-Year Revenue Target', back:'Revenue growth depends on EU regulatory programme activation, PV programme capture, and Full-Service expansion before H2 2026 vendor review.' },
                  { icon:'!', cat:'Urgency', front:'High', sub:'H2 2026 Vendor Review', back:'Critical review window approaching. Engagement with Head of RA and CLO should begin immediately — no incumbent on EU or PV tracks.' },
                  { icon:'🎯', cat:'Primary Entry', front:'EU Reg. Programme', sub:'DAXXIFY EMA — 4+ Year Gap', back:'DAXXIFY FDA-approved Sep 2022 with zero EU commercial revenue. Crown PE thesis requires EU expansion. Freyr 850+ EU affiliates — uncontested entry.' },
                  { icon:'🏢', cat:'Company', front:'Revance Therapeutics', sub:'Nashville, TN · ~800 employees', back:'Specialty pharma company acquired by Crown Laboratories (PE-backed) for $924M. Primary product: DAXXIFY botulinum toxin aesthetics and cervical dystonia.' },
                  { icon:'🔑', cat:'Key Stakeholder', front:'Head of RA', sub:'Primary engagement contact', back:'RA lead is the anchor. Single question opens two tracks: EU scoping + PV programme status. No incumbent confirmed. Act this week.' },
                ] : [
                  { icon:'⚡', cat:'Strategic Posture', front:'CEO Transition + JPY 200B', sub:'Transformation Programme', back:'Julie Kim succeeds Weber June 2026. Transformation office targeting JPY 200B savings by FY2028. Three simultaneous H2 2026 launches during 4,500-person restructuring.' },
                  { icon:'$', cat:'Revenue Opportunity', front:'$18M–22M', sub:'3-Year Revenue Target', back:'Revenue growth driven by Robertson launch support, Duprey transformation technology, and Ricci AI platform. Robertson QBR Q3 2026 is the trigger.' },
                  { icon:'!', cat:'Urgency', front:'Critical', sub:'CEO Transition Window', back:"Kim's 100-day review is the window. Three H2 2026 launches create outsourcing mandate. Get named in Kim's strategic partner list before the review concludes." },
                  { icon:'🎯', cat:'Primary Entry', front:'H2 2026 Launches', sub:'3 Concurrent Filings', back:'oveporexton BT+FT FDA review, rusfertide Priority Review, zasocitinib EU/US prep — all H2 2026. Robertson QBR Q3 2026 is the single most important action.' },
                  { icon:'🏢', cat:'Company', front:'Takeda Pharmaceutical', sub:'Osaka/Tokyo · ~49,000 employees', back:'Global biopharmaceutical company. Top 5 Freyr target globally. SAP S/4HANA migration, AI transformation, and multi-product launch readiness all active simultaneously.' },
                  { icon:'🔑', cat:'Key Stakeholder', front:'Andrew Robertson', sub:'VP Global Regulatory Affairs', back:'Internal champion. Published the regulatory technology vision in NatRevDrugDisc 2025. SUBMIT PRO + freya fusion is his published architecture in production. Warm contact.' },
                ]).map((card,i)=>(
                  <FlipCard key={i} {...card}/>
                ))}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--navy)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>EMERGING PRIORITIES</div>
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {(info.emergingPriorities||[]).map((p:string,i:number)=>{
                    const impLevels:('High'|'Medium'|'Low')[]=['High','High','High','Medium','Medium','Medium','Low']
                    const urgLevels:('High'|'Medium'|'Low')[]=['High','High','Medium','High','Medium','Low','Low']
                    return (
                      <DropdownInsightCard key={i} index={i}
                        title={p.length>90 ? p.slice(0,88)+'…' : p}
                        description={p}
                        impact={impLevels[i%7]}
                        urgency={urgLevels[i%7]}
                        confidence={['96%','93%','90%','87%','84%','81%','78%'][i%7]}
                        whyItMatters="This emerging priority signals a near-term buying centre decision or execution mandate. Freyr should align service line proposals to this priority within the next 60 days."
                        actions={[
                          'Map this priority to a specific Freyr service line in the account plan',
                          'Identify the executive or team owner driving this initiative',
                          'Build a one-page Freyr response brief tied to this exact priority',
                        ]}
                      />
                    )
                  })}
                </div>
              </div>
            </Slide>

            <Slide id="org-leadership">
              <SecHeader title="Key Stakeholders" sub="Click any person to expand engagement intelligence, dos/don'ts, and Freyr selling points" accent="var(--navy)"/>
              {/* Quick status summary row */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
                {(info.orgLeadership||[]).map((row:any,i:number)=>{
                  const RM: Record<string,{c:string;bg:string}> = {cold:{c:'#1B365D',bg:'rgba(27,54,93,0.08)'},warm:{c:'#b89428',bg:'rgba(212,175,55,0.12)'},hot:{c:'#dc2626',bg:'rgba(220,38,38,0.1)'},active:{c:'#10b981',bg:'rgba(16,185,129,0.1)'}}
                  const r = RM[(row.relationship||'cold').toLowerCase()]||RM.cold
                  return (
                    <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, background:r.bg, border:`1px solid ${r.c}22` }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:r.c }}/>
                      <span style={{ fontSize:12.5, fontWeight:600, color:'var(--navy)' }}>{row.name}</span>
                      <span style={{ fontSize:11, fontWeight:700, color:r.c, textTransform:'uppercase', letterSpacing:'0.04em' }}>{row.relationship}</span>
                    </span>
                  )
                })}
              </div>
              {/* Single-column card list — no grid, no row stretching */}
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {(info.orgLeadership||[]).map((row:any,i:number)=><PersonCard key={i} person={row}/>)}
              </div>
            </Slide>

            <Slide id="financial">
              <SecHeader title="Financial Snapshot" sub="Click any card to flip for strategic context" accent="var(--gold)"/>
              <p style={{ fontSize:14, color:'var(--text-3)', marginBottom:20, fontFamily:'Source Sans Pro,sans-serif' }}>Click any card to flip for detail</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:22 }}>
                {(info.financialSnapshot||[]).map((item:any,i:number)=>{
                  const icons=['💰','📊','📈','🎯','🏭','💎','🌍','📋']
                  const accents=['#1B365D','#b89428','#0891b2','#10b981','#1B365D','#b89428','#0891b2','#10b981']
                  const backs = isRevance ? [
                    'Revance went private via Crown Laboratories $924M acquisition in February 2025. PE governance now drives all financial decisions with short payback and measurable ROI requirements.',
                    'DAXXIFY aesthetics and cervical dystonia are the primary revenue drivers. EU market authorisation (zero current revenue) is the largest untapped commercial opportunity.',
                    'Steady growth expected as DAXXIFY therapeutic expands. EU programme launch in H2 2026 would accelerate trajectory materially.',
                    'Crown PE acquisition ROI depends on DAXXIFY EU authorisation. Every quarter without EMA approval represents $80M+ in foregone EU revenue.',
                    'Crown PE integration has reset all vendor relationships. Full-Service Freyr position must be established before H2 2026 vendor review.',
                    'Revenue multiple depends heavily on EU regulatory authorisation speed and PV programme build-out across both indications.',
                    'Nashville HQ with Crown integration team in Johnson City, TN. EU expansion will require Freyr\'s 850+ EU in-country affiliate network.',
                    'Open contract window before H2 2026 Crown vendor review. Freyr must expand from single-service to Full-Service before review locks roster.',
                  ] : [
                    'Revenue has declined from ~$30B+ peak. VYVANSE LOE caused ~46% revenue drop. Three H2 2026 launches (oveporexton, rusfertide, zasocitinib) are critical to restoring growth trajectory.',
                    'JPY 200B+ annualised savings by FY2028 is the board-level mandate. Every vendor must demonstrate contribution to this target via FTE reduction or process automation.',
                    'Freyr cumulative target: $18.3M over 3 years. Robertson QBR Q3 2026 unlocks the launch support track that represents ~60% of this target.',
                    '4,500 roles eliminated during peak launch demand — structural outsourcing mandate for regulatory operations. In-house capacity constrained exactly when submissions surge.',
                    'Base target assumes Robertson QBR Q3 2026 secured + Duprey Transformation Office engaged by August 2026 + freya.intelligence POC live before year-end.',
                    'H2 2026 half-year target. Robertson QBR must be confirmed before this target becomes achievable. Act immediately.',
                    'FY2027 is the primary revenue year — Duprey AI portfolio budget + three post-approval launch support tracks all converge. Must be in Transformation Office now.',
                    'FY2028 assumes technology (freya fusion) expansion. Requires established Core Services + Transformation Office relationship by end of FY2026.',
                  ]
                  return (
                    <FlipCard
                      key={i}
                      icon={icons[i%8]}
                      cat={item.label}
                      front={item.value}
                      sub="Click to see strategic context →"
                      back={backs[i] || `${item.label}: ${item.value}. This metric is key to understanding the account's strategic posture and Freyr's revenue opportunity.`}
                      accentColor={accents[i%8]}
                    />
                  )
                })}
              </div>
            </Slide>

            <Slide id="revenue-target">
              <SecHeader title="Revenue Target" sub="3-Year revenue model, assumptions and tracking by service line" accent="var(--gold)"/>
              {info.revenueTarget&&(<>
                <NudgeSignalCard text={info.revenueTarget.nudgeSignal}/>
                <FreyrCard text={info.revenueTarget.whatThisMeansForFreyr}/>
                <div style={{ overflowX:'auto', marginBottom:20 }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                    <thead><tr style={{ background:'var(--navy)', color:'#fff' }}>
                      {['Revenue Track','FY2026 H2','FY2027','FY2028','3-Year Total'].map(h=><th key={h} style={{ padding:'10px 16px', textAlign:h==='Revenue Track'?'left':'center', fontWeight:700, fontSize:12, letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>{(info.revenueTarget.rows||[]).map((r:any,i:number)=>(
                      <tr key={i} style={{ background:r.track.includes('TOTAL')?'var(--navy-faint)':i%2===0?'var(--bg-surface)':'var(--bg-raised)' }}>
                        <td style={{ padding:'10px 16px', color:'var(--navy)', borderBottom:'1px solid var(--border)', fontWeight:r.track.includes('TOTAL')?800:600 }}>{r.track}</td>
                        {[r.fy26h2,r.fy27,r.fy28,r.total].map((v:string,j:number)=><td key={j} style={{ padding:'10px 16px', textAlign:'center', color:r.track.includes('TOTAL')?'var(--gold-muted)':'var(--text-2)', borderBottom:'1px solid var(--border)', fontWeight:r.track.includes('TOTAL')?800:500 }}>{v}</td>)}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--navy)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>MODEL ASSUMPTIONS</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                    {(info.revenueTarget.assumptions||[]).map((a:string,i:number)=>{
                      const impLevels:('High'|'Medium'|'Low')[]=['High','High','Medium','Medium','Low']
                      const urgLevels:('High'|'Medium'|'Low')[]=['High','High','Medium','Medium','Low']
                      const titles=['EU/EMA Revenue Ramp','Pharmacovigilance Entry','MLR & Medical Affairs','Technology POC Conversion','Upper Scenario Trigger']
                      const actions=[
                        ['Engage Freyr EU affiliate network for DAXXIFY dossier scoping','Initiate freya.intelligence EMA pathway analysis','Target Q2 2027 full-year revenue from EU regulatory programme'],
                        ['Deliver single PV question to Head of RA Q3 2026','Have Freyr PV proposal ready within 5 days of gap confirmation','Target Q4 2026 PV contract signature'],
                        ['Introduce MLR alongside PV in Q3 2026','Identify Medical Affairs lead for DAXXIFY aesthetics branded campaigns','Include MLR in Full-Service proposal for H2 2026 review'],
                        ['Scope freya.intelligence 60-day POC for Q3 2026','Convert POC to SaaS subscription before year-end','Scope VIA for Fosun China NMPA Q4 2026'],
                        ['Target freya fusion enterprise pitch in FY2027-2028','Establish EU programme delivery as POC before full RIM proposal','Demonstrate multi-market ROI before Crown PE governance review'],
                      ]
                      return (
                        <DropdownInsightCard key={i} index={i}
                          title={titles[i]||`Assumption ${i+1}`}
                          description={a}
                          impact={impLevels[i]||'Medium'}
                          urgency={urgLevels[i]||'Medium'}
                          confidence={['94%','88%','82%','79%','65%'][i]||'80%'}
                          whyItMatters={`This assumption underpins the revenue model. Achieving this on schedule is critical to hitting the ${['$14.7M','$14.7M','$14.7M','$14.7M','$16M'][i]} ${['3-year','3-year','3-year','3-year','upper scenario'][i]} target.`}
                          actions={actions[i]||[]}
                        />
                      )
                    })}
                  </div>
                </div>
              </>)}
            </Slide>

            <Slide id="strategic">
              <SecHeader title="Strategic Priorities" sub="Board-level imperatives — click any priority to expand full detail, Freyr action, and Nudge signals" accent="var(--gold)"/>
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {(info.strategicPriorities||[]).map((item:any,i:number)=>{
                  if (typeof item==='string') {
                    const parts=item.split(' — ')
                    return <InsightCard key={i} index={i} title={parts[0]} body={parts.slice(1).join(' — ')} accent="var(--navy)"/>
                  }
                  return <StratCard key={i} item={item} index={i} setActive={setActive}/>
                })}
              </div>
            </Slide>

            <Slide id="right-to-win">
              <SecHeader title="Right to Win" sub="Competitive positioning and differentiators — click to expand each advantage" accent="var(--navy)"/>
              {info.rightToWin&&(<>
                <NudgeSignalCard text={info.rightToWin.nudgeSignal}/>
                <FreyrCard text={info.rightToWin.whatThisMeansForFreyr}/>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--navy)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>{isRevance ? "FREYR'S COMPETITIVE ADVANTAGES" : "TAKEDA'S COMPETITIVE ADVANTAGES"}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:0, marginBottom:28 }}>
                  {(info.rightToWin.advantages||[]).map((adv:any,i:number)=>(
                    <DropdownInsightCard key={i} index={i}
                      title={adv.title}
                      description={adv.body}
                      impact={(['High','High','High','Medium','Medium','High'] as ('High'|'Medium'|'Low')[])[i%6]}
                      urgency={(['High','Medium','High','Medium','Low','Medium'] as ('High'|'Medium'|'Low')[])[i%6]}
                      confidence={['97%','94%','91%','88%','85%','92%'][i%6]}
                      whyItMatters={`This competitive advantage positions Freyr uniquely against alternatives and is a key reason the account should select Freyr over incumbents like ICON, Parexel, or Accenture.`}
                      actions={adv.actions || [
                        `Lead with ${adv.title} in executive-level conversations`,
                        'Prepare competitive battlecard highlighting this specific advantage',
                        'Quantify ROI impact for Crown/Takeda governance model',
                      ]}
                    />
                  ))}
                </div>
                {!isRevance && (info.rightToWin as any).whyWeWin && (
                  <>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--navy)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>WHY TAKEDA CAN WIN</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:28 }}>
                      {((info.rightToWin as any).whyWeWin||[]).map((w:any,i:number)=>(
                        <div key={i} style={{ padding:'14px 16px', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:10 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:'var(--navy)', marginBottom:5 }}>{i+1}. {w.title}</div>
                          <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.65, margin:0 }}>{w.body}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div style={{ fontSize:13, fontWeight:700, color:'var(--navy)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>COMPETITIVE HEAT GRID</div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead><tr style={{ background:'var(--navy)', color:'#fff' }}>
                      {(isRevance ? ['Area / Service','Freyr','ICON / Parexel / Accenture','Veeva','Other CRO'] : ['Area / Capability','Takeda','Roche','Novartis / AstraZeneca','Other Pharma']).map(h=><th key={h} style={{ padding:'9px 14px', textAlign:'left', fontWeight:700, fontSize:11, letterSpacing:'0.06em' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>{(info.rightToWin.competitiveGrid||[]).map((row:any,i:number)=>{
                      const gc=(v:string)=>{if(!v||v==='None'||v==='Variable')return{bg:'#f8f9fa',c:'#9ca3af'};if(v==='Established'||v==='Freyr Only'||v==='Leader'||v==='Strong')return{bg:'rgba(16,185,129,0.1)',c:'#10b981'};if(v==='Active'||v==='Active discuss.'||v==='Expanding')return{bg:'rgba(16,185,129,0.08)',c:'#059669'};if(v==='Present'||v==='Limited')return{bg:'rgba(220,38,38,0.07)',c:'#dc2626'};if(v.includes('Competing')||v.includes('Vault'))return{bg:'rgba(220,38,38,0.1)',c:'#dc2626'};return{bg:'rgba(217,119,6,0.08)',c:'#d97706'}}
                      return <tr key={i} style={{ background:i%2===0?'var(--bg-surface)':'var(--bg-raised)' }}>
                        <td style={{ padding:'9px 14px', color:'var(--navy)', borderBottom:'1px solid var(--border)', fontWeight:600 }}>{row.area}</td>
                        {[row.freyr,row.iconParexel,row.veeva,row.other].map((v:string,j:number)=>{const c=gc(v);return <td key={j} style={{padding:'9px 14px',borderBottom:'1px solid var(--border)'}}><span style={{padding:'3px 9px',borderRadius:5,background:c.bg,color:c.c,fontSize:11.5,fontWeight:600}}>{v||'None'}</span></td>})}
                      </tr>
                    })}</tbody>
                  </table>
                </div>
              </>)}
            </Slide>

            <Slide id="next-action">
              <SecHeader title="Next Best Action" sub="Prioritised engagement actions — click to expand owner, urgency, and full detail" accent="var(--navy)"/>
              {(info.nextBestAction||[]).map((item:any,i:number)=>{
                if (typeof item==='string') return <InsightCard key={i} index={i} title={item} accent="var(--navy)"/>
                return <NBACard key={i} item={item} index={i}/>
              })}
            </Slide>

            <Slide id="90day-plan">
              <SecHeader title="90-Day Action Plan" sub="Week-by-week roadmap with owners, timelines and success metrics" accent="var(--gold)"/>
              {info.actionPlan90Day&&(<>
                <NudgeSignalCard text={info.actionPlan90Day.nudgeSignal}/>
                <FreyrCard text={info.actionPlan90Day.whatThisMeansForFreyr}/>
                <div style={{ display:'flex', flexDirection:'column', gap:0, marginBottom:24 }}>
                  {(info.actionPlan90Day.steps||[]).map((step:any,i:number)=>(
                    <InsightCard key={i} index={i} title={step.action} body={step.detail}
                      badge={step.weeks?`Weeks ${step.weeks}`:undefined} badgeColor="var(--navy)" accent="var(--gold)"
                      extra={
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                          <div style={{ padding:'8px 12px', background:'var(--navy-faint)', borderRadius:8 }}>
                            <div style={{ fontSize:9.5, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>OWNER</div>
                            <div style={{ fontSize:13, color:'var(--navy)', fontWeight:600 }}>{step.owner}</div>
                          </div>
                          <div style={{ padding:'8px 12px', background:'rgba(16,185,129,0.07)', borderRadius:8, border:'1px solid rgba(16,185,129,0.2)' }}>
                            <div style={{ fontSize:9.5, fontWeight:700, color:'#10b981', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>SUCCESS METRIC</div>
                            <div style={{ fontSize:12.5, color:'#065f46', lineHeight:1.45 }}>{step.metric}</div>
                          </div>
                        </div>
                      }
                    />
                  ))}
                </div>
                {info.actionPlan90Day.successCriteria&&(
                  <div style={{ background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:12, padding:'18px 22px' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#10b981', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>90-DAY SUCCESS CRITERIA</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {(info.actionPlan90Day.successCriteria||[]).map((c:string,i:number)=>(
                        <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                          <CheckCircle2 size={16} style={{ color:'#10b981', flexShrink:0, marginTop:1 }}/>
                          <p style={{ fontSize:14, color:'var(--text-2)', lineHeight:1.65, margin:0 }}>{c}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>)}
            </Slide>

            <Slide id="big-bets">
              <SecHeader title="Big Bets" sub="High-priority opportunities — click to expand full facts, Freyr response, and Nudge signals" accent="var(--gold)"/>
              {(info.bigBets||[]).map((bet:any,i:number)=>{
                const c=['var(--navy)','var(--gold-muted)','#0891b2','#10b981'][i%4]
                return <BigBetCard key={i} bet={bet} index={i} accent={c}/>
              })}
            </Slide>

            <Slide id="pipeline">
              <SecHeader title="Pipeline Insights" sub="Asset lifecycle, revenue projections, technology pipeline, and growth services" accent="var(--navy)"/>
              <PipelineSection info={info} isRevance={isRevance}/>
            </Slide>

            <Slide id="investment">
              <SecHeader title="Investment Strategy" sub="Click any card to flip for full strategic context" accent="var(--navy)"/>
              <div style={{ padding:'18px 22px', background:'var(--bg-surface)', borderRadius:12, border:'1px solid var(--border)', marginBottom:24, borderLeft:'4px solid var(--gold)' }}>
                <p style={{ fontSize:15.5, color:'var(--text-2)', lineHeight:1.9, margin:0, fontFamily:'Source Sans Pro,sans-serif' }}>{info.investmentStrategy}</p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:22 }}>
                {(isRevance ? [
                  { icon:'🇪🇺', cat:'Priority 1', front:'EU Market Entry', sub:'EMA Centralised Procedure — DAXXIFY', back:'DAXXIFY has been FDA-approved since September 2022 with zero EU commercial revenue after 4+ years. Freyr\'s 850+ EU in-country affiliates give it an uncontested first-partner advantage. Crown PE acquisition ROI depends on EU launch — Freyr must initiate EMA programme scoping this quarter.', accent:'#1B365D' },
                  { icon:'🧬', cat:'Priority 2', front:'Multi-Indication Pipeline', sub:'Phase II Spasticity + Plantar Fasciitis + NMPA China', back:'DAXXIFY Phase II programmes (upper limb spasticity, plantar fasciitis) plus the Fosun NMPA China partnership create compounding variation-management workload across three geographies. VIA is the only platform with native NMPA variation capability — entry via Thomas Hitchcock (CInO) as scientific peer.', accent:'#2e5a96' },
                  { icon:'💼', cat:'Priority 3', front:'PE Portfolio Integration', sub:'H2 2026 Crown Vendor Review', back:'Crown PE vendor rationalisation is the most consequential event in the Revance account calendar. Single-service vendors will be displaced. Full-Service (Core + Growth Services + Technology) is the only defensible position. Freyr must expand scope before July 2026 or risk being shut out of the review cycle entirely.', accent:'#D4AF37' },
                ] : [
                  { icon:'🚀', cat:'Priority 1', front:'H2 2026 Launch Excellence', sub:'oveporexton · rusfertide · zasocitinib', back:'Three simultaneous NDA/MAA submissions across US, Japan, China and EU during a 4,500-person restructuring. In-house regulatory capacity is constrained at exactly the moment surge demand peaks. Robertson QBR Q3 2026 is the trigger — Freyr must confirm scope before PDUFA deadline for oveporexton.', accent:'#1B365D' },
                  { icon:'🤖', cat:'Priority 2', front:'AI & Digital Transformation', sub:'JPY 200B Programme — Duprey Budget Owner', back:'Lauren Duprey (CTO) is assembling the FY2027 AI investment portfolio now. VIA eliminates manual variation management across 25+ manufacturing sites. freya.intelligence replaces regulatory monitoring FTEs across 95,000+ regulations. Both deliver auditable FTE reduction — the only currency that matters in Duprey\'s board reporting.', accent:'#7C3AED' },
                  { icon:'💊', cat:'Priority 3', front:'Pipeline Commercialisation', sub:'Post-LOE Revenue Replacement Strategy', back:'VYVANSE LOE has caused a ~46% revenue decline over nine months. The three H2 2026 launches (oveporexton narcolepsy, rusfertide PV, zasocitinib psoriasis) are Takeda\'s revenue replacement engine. Each launch creates medical writing, MLR, regulatory operations, and PV outsourcing demand that Freyr is positioned to serve.', accent:'#059669' },
                ]).map((item,i) => (
                  <FlipCard key={i} icon={item.icon} cat={item.cat} front={item.front} sub={item.sub} back={item.back} accentColor={item.accent}/>
                ))}
              </div>
            </Slide>

            <Slide id="play-areas">
              <SecHeader title="Play Areas" sub="Core Services, Growth Services, Technology, and Geographies" accent="var(--navy)"/>
              {info.playAreas&&(<>
                <NudgeSignalCard text={info.playAreas.nudgeSignal}/>
                <FreyrCard text={info.playAreas.whatThisMeansForFreyr}/>
                {[{ l:'5.1 Core Services',d:info.playAreas.coreServices },{ l:'5.2 Growth Services',d:info.playAreas.growthServices }].map(({l,d})=>d&&(
                  <div key={l} style={{ marginBottom:24 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--navy)', fontFamily:'Playfair Display,serif', marginBottom:14 }}>{l}</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                      {d.map((r:any,i:number)=>{
                        const pImp: Record<string,'High'|'Medium'|'Low'> = { 'MOST URGENT':'High','URGENT':'High','HIGH':'High','ACTIVE — EXPAND':'High','ACTIVE':'High','MEDIUM':'Medium','FY2027':'Low' }
                        const pUrg: Record<string,'High'|'Medium'|'Low'> = { 'MOST URGENT':'High','URGENT':'High','HIGH':'Medium','ACTIVE — EXPAND':'High','ACTIVE':'Medium','MEDIUM':'Low','FY2027':'Low' }
                        return (
                          <DropdownInsightCard key={i} index={i}
                            title={r.service}
                            description={r.opportunity}
                            impact={pImp[r.priority]||'Medium'}
                            urgency={pUrg[r.priority]||'Medium'}
                            confidence={['96%','93%','90%','87%','84%','80%'][i%6]}
                            meta={<div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                              <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:
                                (r.priority.includes('URGENT')||r.priority.includes('MOST'))?'rgba(220,38,38,0.1)':
                                (r.priority.includes('HIGH')||r.priority.includes('ACTIVE'))?'rgba(217,119,6,0.1)':'rgba(27,54,93,0.08)', color:
                                (r.priority.includes('URGENT')||r.priority.includes('MOST'))?'#dc2626':
                                (r.priority.includes('HIGH')||r.priority.includes('ACTIVE'))?'#d97706':'var(--navy)' }}>{r.priority}</span>
                              <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(16,185,129,0.1)', color:'#059669' }}>{r.revenue}</span>
                            </div>}
                            whyItMatters={`${r.service} represents a ${r.priority.includes('URGENT')||r.priority.includes('MOST') ? 'critical, immediate' : r.priority.includes('HIGH')||r.priority.includes('ACTIVE') ? 'high-value, near-term' : 'future'} revenue opportunity. ${r.opportunity.slice(0,120)}...`}
                            actions={[
                              `Engage with the ${r.service} opportunity by Q${r.priority.includes('URGENT')||r.priority.includes('MOST')?'3':'4'} 2026`,
                              'Prepare a targeted proposal with ROI framing for PE governance review',
                              `Include ${r.service} in the Full-Service expansion before H2 2026 vendor review`,
                            ]}
                          />
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--navy)', fontFamily:'Playfair Display,serif', marginBottom:14 }}>5.3 Technology Track</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                    {(info.playAreas.technologyTrack||[]).map((t:any,i:number)=>{
                      const stageImp: Record<string,'High'|'Medium'|'Low'> = { 'NEAR-TERM':'High','Q4 2026':'High','Q3 2026':'High','FY2027-2028':'Low','FY2027':'Medium' }
                      const stageUrg: Record<string,'High'|'Medium'|'Low'> = { 'NEAR-TERM':'High','Q4 2026':'High','Q3 2026':'High','FY2027-2028':'Low','FY2027':'Low' }
                      return (
                        <DropdownInsightCard key={i} index={i}
                          title={t.platform}
                          description={t.entryPath}
                          impact={stageImp[t.stage]||'Medium'}
                          urgency={stageUrg[t.stage]||'Medium'}
                          confidence={['94%','91%','88%','72%'][i%4]}
                          meta={<div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:
                              (t.stage.includes('NEAR')||t.stage.includes('Q3')||t.stage.includes('Q4'))?'rgba(16,185,129,0.1)':'rgba(27,54,93,0.08)', color:
                              (t.stage.includes('NEAR')||t.stage.includes('Q3')||t.stage.includes('Q4'))?'#10b981':'var(--navy)' }}>{t.stage}</span>
                            <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(8,145,178,0.1)', color:'#0891b2' }}>{t.revenue}</span>
                          </div>}
                          whyItMatters={`${t.platform} is a technology entry point that creates long-term account stickiness. ${t.stage.includes('NEAR')||t.stage.includes('Q3')||t.stage.includes('Q4') ? 'This is an immediate action item — initiate scoping now.' : 'This is a future opportunity — build groundwork via earlier technology wins.'}`}
                          actions={[
                            t.stage.includes('NEAR')||t.stage.includes('Q3') ? 'Propose 60-day POC immediately — no CEO sign-off required at this stage' : 'Establish foundational wins before proposing this platform',
                            'Prepare PE-compatible ROI model: FTE reduction, cost per filing, cycle time',
                            `Link ${t.platform} POC to existing regulatory services relationship as natural extension`,
                          ]}
                        />
                      )
                    })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--navy)', fontFamily:'Playfair Display,serif', marginBottom:12 }}>5.4 Geographies</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {(info.playAreas.geographies||[]).map((g:any,i:number)=>{
                      const PC: Record<string,any>={ 'PRIMARY':{bg:'rgba(16,185,129,0.08)',c:'#10b981'}, 'GAP — URGENT':{bg:'rgba(220,38,38,0.08)',c:'#dc2626'}, 'HIGH':{bg:'rgba(217,119,6,0.08)',c:'#d97706'}, 'MEDIUM':{bg:'rgba(27,54,93,0.08)',c:'var(--navy)'} }
                      const pc=PC[g.priority]||PC['MEDIUM']
                      return <div key={i} style={{ padding:'14px 16px', background:'var(--bg-surface)', borderRadius:10, border:'1px solid var(--border)' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                          <div style={{ fontFamily:'Playfair Display,serif', fontSize:14.5, fontWeight:700, color:'var(--navy)' }}>{g.geo}</div>
                          <span style={{ padding:'2px 9px', borderRadius:4, fontSize:11, fontWeight:700, background:pc.bg, color:pc.c, whiteSpace:'nowrap' }}>{g.priority}</span>
                        </div>
                        <p style={{ fontSize:12.5, color:'var(--text-2)', lineHeight:1.6, margin:'0 0 8px' }}>{g.programme}</p>
                        <span style={{ padding:'2px 9px', borderRadius:20, fontSize:11.5, color:'var(--gold-muted)', fontWeight:600, background:'var(--gold-light)' }}>{g.services}</span>
                      </div>
                    })}
                  </div>
                </div>
              </>)}
            </Slide>

            <Slide id="freyr-play">
              <SecHeader title="Freyr Opportunity Fit" sub="Service line matching, competitive scores, and engagement strategy" accent="var(--gold)"/>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {freyrPlays.map((play,i)=>{
                  const [open,setOpen]=useState(false)
                  return (
                    <div key={i} style={{ border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', background:'var(--bg-surface)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', cursor:'pointer', background:open?'var(--bg-raised)':'transparent' }} onClick={()=>setOpen(o=>!o)}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ width:36, height:36, borderRadius:9, background:`${play.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{play.icon}</div>
                          <div>
                            <div style={{ fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:700, color:'var(--navy)' }}>{play.title}</div>
                            <div style={{ fontSize:12.5, color:'var(--text-3)', marginTop:2 }}>{play.subtitle}</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontFamily:'Playfair Display,serif', fontSize:20, fontWeight:700, color:play.color }}>{play.score}%</span>
                          <ChevronDown size={14} style={{ color:'var(--text-3)', transform:open?'rotate(180deg)':'none', transition:'transform 200ms' }}/>
                        </div>
                      </div>
                      {open&&(
                        <div style={{ padding:'16px 18px', borderTop:'1px solid var(--border)', animation:'pageIn 200ms ease' }}>
                          <div style={{ height:6, background:'var(--bg-subtle)', borderRadius:3, overflow:'hidden', marginBottom:16 }}>
                            <div style={{ height:'100%', width:`${play.score}%`, background:`linear-gradient(90deg,${play.color},${play.color}88)`, borderRadius:3, transition:'width 600ms ease' }}/>
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                            {play.details.map((d:any,j:number)=>(
                              <div key={j} style={{ padding:'10px 14px', background:'var(--bg-raised)', borderRadius:9, border:'1px solid var(--border)' }}>
                                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{d.label}</div>
                                <div style={{ fontSize:14, fontWeight:600, color:'var(--navy)' }}>{d.value}</div>
                              </div>
                            ))}
                          </div>
                          <ul style={{ margin:'0 0 14px', padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:6 }}>
                            {play.bullets.map((b:string,j:number)=>(
                              <li key={j} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                                <span style={{ width:6, height:6, borderRadius:'50%', background:play.color, flexShrink:0, marginTop:7 }}/>
                                <span style={{ fontSize:13.5, color:'var(--text-2)', lineHeight:1.7 }}>{b}</span>
                              </li>
                            ))}
                          </ul>
                          <div style={{ padding:'12px 16px', background:'rgba(212,175,55,0.07)', border:'1.5px solid rgba(212,175,55,0.25)', borderRadius:9 }}>
                            <div style={{ fontSize:11, fontWeight:700, color:'#b89428', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>FREYR IMPLICATION</div>
                            <p style={{ fontSize:13.5, color:'#7a5c00', lineHeight:1.65, margin:0, fontWeight:500 }}>{play.implication}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Slide>

            <Slide id="swot">
              <SecHeader title="SWOT Analysis" sub="Click any card to expand Strengths, Weaknesses, Opportunities and Threats" accent="var(--gold)"/>
              <p style={{ fontSize:14, color:'var(--text-3)', marginBottom:20, fontFamily:'Source Sans Pro,sans-serif' }}>Click any card to flip for detail</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:22 }}>
                {[
                  { label:'Strengths',     key:'S', icon:'💪', accent:'#10b981', frontSub:'Internal advantages Freyr holds at this account' },
                  { label:'Weaknesses',    key:'W', icon:'⚠️',  accent:'#dc2626', frontSub:'Internal gaps that must be closed before H2 2026' },
                  { label:'Opportunities', key:'O', icon:'🚀', accent:'#b89428', frontSub:'External openings Freyr can exploit now' },
                  { label:'Threats',       key:'T', icon:'🛡️', accent:'#1B365D', frontSub:'External risks that could displace Freyr' },
                ].map(({ label, key, icon, accent, frontSub }) => {
                  const items: string[] = (info.swot as any)?.[key] || []
                  return (
                    <FlipCard
                      key={key}
                      icon={icon}
                      cat={label}
                      front={`${items.length} ${label}`}
                      sub={frontSub}
                      back={items.map((t,i) => `${i+1}. ${t}`).join('\n\n')}
                      accentColor={accent}
                    />
                  )
                })}
              </div>
            </Slide>

            <Slide id="news">
              <SecHeader title="News Intelligence" sub="Internal company updates and external industry developments" accent="var(--navy)"/>
              <div style={{ display:'flex', borderBottom:'2px solid var(--border)', marginBottom:20 }}>
                {(['internal','external'] as const).map(t=>(
                  <button key={t} onClick={()=>setNewsTab(t)} style={{ padding:'10px 18px', background:'none', border:'none', borderBottom:newsTab===t?'2px solid var(--navy)':'2px solid transparent', marginBottom:-2, cursor:'pointer', fontSize:14, fontWeight:newsTab===t?700:400, color:newsTab===t?'var(--navy)':'var(--text-3)', transition:'all 160ms' }}>
                    {t==='internal'?'Freyr Internal News':'Industry & Account News'}
                  </button>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {news.map(item=>(
                  <div key={item.id} onClick={()=>setSelectedArticle(item)} style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px', cursor:'pointer' }} onMouseEnter={e=>e.currentTarget.style.boxShadow='0 6px 24px rgba(27,54,93,0.1)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                    <div style={{ fontSize:11, fontWeight:700, color:'var(--gold-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>{item.date}</div>
                    <div style={{ fontFamily:'Playfair Display,serif', fontSize:14.5, fontWeight:600, color:'var(--navy)', lineHeight:1.35, marginBottom:8 }}>{item.title}</div>
                    <p style={{ fontSize:13, color:'var(--text-3)', lineHeight:1.55, margin:0 }}>{item.body.slice(0,140)}...</p>
                    <div style={{ marginTop:10, fontSize:12, color:'var(--gold-muted)', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>Read full story <ChevronRight size={11}/></div>
                  </div>
                ))}
              </div>
              {selectedArticle&&<NewsModal article={selectedArticle} onClose={()=>setSelectedArticle(null)}/>}
            </Slide>

            <Slide id="notes">
              <SecHeader title="Notes & Download" sub="Account-level notes and full intelligence dossier export" accent="var(--gold)"/>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:24 }}>
                {/* Notes */}
                <div>
                  <div style={{ fontSize:11, fontWeight:800, color:'var(--navy)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>ACCOUNT NOTES</div>
                  <textarea className="input textarea-expand" placeholder="Add notes about this account..." value={notes} onChange={e=>setNotes(e.target.value)} rows={7} style={{ marginBottom:12, fontSize:14.5, width:'100%' }}/>
                  <button className="btn btn-navy btn-sm" onClick={()=>{
                    localStorage.setItem(`nudge_notes_${id}`, notes)
                    alert('Notes saved.')
                  }}>Save Notes</button>
                </div>

                {/* Download Dossier */}
                <div>
                  <div style={{ fontSize:11, fontWeight:800, color:'var(--navy)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>ACCOUNT INTELLIGENCE DOSSIER</div>
                  <div style={{ padding:22, background:'var(--navy-faint)', borderRadius:14, border:'1px solid rgba(27,54,93,0.14)', textAlign:'center' }}>
                    <div style={{ width:48, height:48, borderRadius:12, background:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:22 }}>📥</div>
                    <div style={{ fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:700, color:'var(--navy)', marginBottom:8 }}>Account Intelligence Dossier</div>
                    <p style={{ fontSize:13, color:'var(--text-3)', marginBottom:18, lineHeight:1.55 }}>Download the complete account intelligence — Nudge Signal, Strategic Priorities, Big Bets, Stakeholders, Financial Snapshot, SWOT, Pipeline, Play Areas, Next Best Actions and more.</p>
                    <button className="btn btn-navy" style={{ width:'100%', justifyContent:'center', gap:8, fontSize:13 }} onClick={()=>{
                      if (!info) return
                      const html = generateAccountDossierHtml(info, id||'')
                      const blob = new Blob([html], { type:'text/html' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${(info.name||id||'account').replace(/[^a-zA-Z0-9]/g,'-')}-Intelligence-Dossier.html`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}>
                      <ArrowRight size={14}/> Download Dossier
                    </button>
                  </div>
                </div>
              </div>
            </Slide>

          </div>
        </div>
      </div>
    </Ctx.Provider>
  )
}
