import { useState, useEffect, createContext, useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ACCOUNT_INFO, ACCOUNT_PLAN, ACCOUNTS_LIST } from '../../data'

const NAV_SECTIONS = [
  { id:'cover',      label:'Cover' },
  { id:'snapshot',   label:'Company Snapshot' },
  { id:'financial',  label:'Financial Deep-Dive' },
  { id:'org',        label:'Key Stakeholders' },
  { id:'pipeline',   label:'Pipeline Insights' },
  { id:'bigbets',    label:'Big Bets' },
  { id:'strategic',  label:'Strategic Priorities' },
  { id:'nextaction', label:'Next Best Action' },
  { id:'freyr',      label:'Freyr Play Areas' },
]

const ActiveCtx = createContext<string>('cover')

// Renders only when it is the active section (vertical-nav presentation model)
function Slide({ id, children, alt }: { id:string; children:React.ReactNode; alt?:boolean }) {
  const active = useContext(ActiveCtx)
  if (active !== id) return null
  return (
    <section key={id} id={id} style={{
      minHeight:'calc(100vh - 56px)', padding:'48px 64px',
      display:'flex', flexDirection:'column',
      background: alt ? '#f2f5fb' : '#ffffff',
    }}>
      {children}
    </section>
  )
}

function SectionHeader({ title, sub, accent }: { title:string; sub?:string; accent:string }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:32 }}>
      <div style={{ width:4, minHeight:48, borderRadius:2, background:accent, flexShrink:0, marginTop:2, boxShadow:`0 0 12px ${accent}55` }}/>
      <div>
        <h2 style={{ fontFamily:'Playfair Display, serif', fontSize:30, fontWeight:700, color:'#1B365D', letterSpacing:'-0.02em', margin:0, lineHeight:1.15 }}>{title}</h2>
        {sub && <p style={{ fontSize:21, color:'#5a7499', margin:'5px 0 0', fontFamily:'Source Sans 3, sans-serif', lineHeight:1.6 }}>{sub}</p>}
      </div>
    </div>
  )
}

function StatCard({ value, label, sub, accent }: { value:string; label:string; sub?:string; accent:string }) {
  return (
    <div style={{ background:'#fff', border:'1px solid rgba(27,54,93,0.12)', borderRadius:14, padding:'18px 20px', boxShadow:'0 4px 16px rgba(27,54,93,0.08)', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:accent }}/>
      <div style={{ fontFamily:'Playfair Display, serif', fontSize:28, fontWeight:700, color:accent, letterSpacing:'-0.03em', marginBottom:6 }}>{value}</div>
      <div style={{ fontFamily:'Source Sans 3, sans-serif', fontSize:19.5, fontWeight:600, color:'#1B365D', marginBottom:3 }}>{label}</div>
      {sub && <div style={{ fontFamily:'Source Sans 3, sans-serif', fontSize:17.5, color:'#5a7499' }}>{sub}</div>}
    </div>
  )
}

export default function ExecutiveBriefingPresentation() {
  const { accountId } = useParams()
  const nav = useNavigate()
  const [activeSection, setActiveSection] = useState('cover')

  const account = ACCOUNTS_LIST.find(a=>a.id===accountId)
  const info = accountId ? ACCOUNT_INFO[accountId] : null
  const plan = accountId ? ACCOUNT_PLAN[accountId] : null

  useEffect(() => { window.scrollTo({ top:0 }) }, [activeSection])

  const navy = '#1B365D'
  const gold = '#D4AF37'
  const goldM = '#b89428'
  const teal = '#0891b2'
  const green = '#10b981'
  const red = '#dc2626'

  if (!account || !info) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f2f5fb', color:navy, fontSize:26, fontFamily:'Playfair Display, serif' }}>
      Account not found.&nbsp;
      <button onClick={()=>nav('/accounts/planning')} style={{ color:navy, background:'none', border:'none', cursor:'pointer', fontSize:26, fontFamily:'inherit', textDecoration:'underline' }}>← Back</button>
    </div>
  )

  return (
    <ActiveCtx.Provider value={activeSection}>
    <div style={{ fontFamily:'Source Sans 3, sans-serif', background:'#f2f5fb' }}>
      {/* Top bar — brand + back */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 24px', height:56,
        background:'rgba(15,30,54,0.97)',
        borderBottom:'1px solid rgba(212,175,55,0.15)',
        backdropFilter:'blur(14px)',
      }}>
        <div style={{ fontSize:22, fontWeight:700, color:'#fff', fontFamily:'Playfair Display, serif', whiteSpace:'nowrap' }}>
          {account.name} <span style={{ color:'#e8c547', fontSize:17.5, fontWeight:600, fontFamily:'Source Sans 3, sans-serif', marginLeft:8 }}>· Executive Briefing</span>
        </div>
        <button onClick={()=>nav('/accounts/planning')} style={{
          background:'none', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7,
          padding:'5px 12px', cursor:'pointer', color:'rgba(255,255,255,0.55)', fontSize:17.5,
          fontFamily:'Source Sans 3, sans-serif', fontWeight:600, transition:'all 0.2s',
        }}>
          ← Back to Platform
        </button>
      </nav>

      {/* Left vertical section rail */}
      <nav style={{
        position:'fixed', top:56, left:0, bottom:0, width:230, zIndex:90,
        background:'#0f1e36', borderRight:'1px solid rgba(212,175,55,0.15)',
        padding:'18px 12px', overflowY:'auto',
      }}>
        <div style={{ fontSize:9.5, fontWeight:800, letterSpacing:'0.14em', color:'rgba(212,175,55,0.7)', textTransform:'uppercase', padding:'0 10px 10px' }}>Sections</div>
        {NAV_SECTIONS.map((s,i) => (
          <button key={s.id} onClick={()=>setActiveSection(s.id)} style={{
            display:'flex', alignItems:'center', gap:10, width:'100%', textAlign:'left',
            color: activeSection===s.id ? '#0f1e36' : 'rgba(255,255,255,0.62)',
            background: activeSection===s.id ? '#e8c547' : 'transparent',
            border:'none', cursor:'pointer', borderRadius:8, marginBottom:3,
            fontSize:19, fontWeight: activeSection===s.id?700:500, padding:'9px 12px',
            fontFamily:'Source Sans 3, sans-serif', transition:'all 0.15s',
          }}>
            <span style={{ fontSize:16, opacity:0.7, width:16 }}>{String(i+1).padStart(2,'0')}</span>{s.label}
          </button>
        ))}
      </nav>

      <div style={{ paddingTop:56, marginLeft:230 }}>
        {/* Cover */}
        <Slide id="cover">
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', maxWidth:780, position:'relative' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', background:'rgba(27,54,93,0.08)', border:'1px solid rgba(27,54,93,0.15)', borderRadius:20, fontSize:16.5, fontWeight:700, color:navy, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:24, fontFamily:'Source Sans 3, sans-serif' }}>
              ⬥ Strategic Account Review · June 2026 · Confidential
            </div>
            <h1 style={{ fontFamily:'Playfair Display, serif', fontSize:54, fontWeight:700, color:navy, letterSpacing:'-0.04em', lineHeight:1.05, margin:'0 0 20px' }}>
              {account.name}
            </h1>
            <p style={{ fontSize:26, color:'#5a7499', lineHeight:1.75, margin:'0 0 36px', fontFamily:'Source Sans 3, sans-serif' }}>
              Account Intelligence Report — sourced from verified SOT data.
              <br/>Prepared by Freyr Solutions Strategic Intelligence.
            </p>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:32 }}>
              {info.financialSnapshot.slice(0,4).map((f:any,i:number) => (
                <span key={i} style={{ display:'inline-flex', padding:'6px 16px', background:[`${navy}10`,`${gold}18`,`${teal}12`,`${green}12`][i], border:`1px solid ${[navy,gold,teal,green][i]}28`, borderRadius:20, fontSize:19, fontWeight:600, color:[navy,goldM,teal,green][i], fontFamily:'Source Sans 3, sans-serif' }}>
                  {f.label}: {f.value}
                </span>
              ))}
            </div>
            <div style={{ padding:'14px 20px', background:'rgba(27,54,93,0.05)', borderRadius:10, border:'1px solid rgba(27,54,93,0.1)', fontSize:20.5, color:'#5a7499', fontFamily:'Source Sans 3, sans-serif', lineHeight:1.7 }}>
              <strong style={{ color:navy, fontFamily:'Playfair Display, serif' }}>Nudge Intelligence Signal: </strong>
              {info.nudgeSignal.slice(0,200)}...
            </div>
          </div>
        </Slide>

        {/* Snapshot */}
        <Slide id="snapshot" alt>
          <SectionHeader title="Company Snapshot" sub={`${account.name} — overview, key metrics, and strategic context`} accent={gold}/>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:26 }}>
            {info.financialSnapshot.slice(0,4).map((f:any,i:number) => (
              <StatCard key={i} value={f.value} label={f.label} sub={f.sub} accent={[navy,goldM,teal,green][i%4]}/>
            ))}
          </div>
          <div style={{ background:'#fff', border:'1px solid rgba(27,54,93,0.12)', borderRadius:14, padding:'22px 26px', boxShadow:'0 4px 16px rgba(27,54,93,0.06)' }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#5a7499', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10, fontFamily:'Source Sans 3, sans-serif' }}>ACCOUNT CONTEXT</div>
            <p style={{ fontSize:22, color:'#1B365D', lineHeight:1.85, margin:0, fontFamily:'Source Sans 3, sans-serif' }}>{info.accountContext}</p>
          </div>
        </Slide>

        {/* Financial */}
        <Slide id="financial">
          <SectionHeader title="Financial Deep-Dive" sub="Revenue, targets, performance and investment context" accent={navy}/>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            {info.financialSnapshot.map((f:any,i:number) => (
              <StatCard key={i} value={f.value} label={f.label} accent={[navy,goldM,teal,green,navy,goldM,teal,green][i%8]}/>
            ))}
          </div>
        </Slide>

        {/* Org / Leadership */}
        <Slide id="org" alt>
          <SectionHeader title="Key Stakeholders" sub="Decision-maker map, relationship status, and engagement intelligence" accent={gold}/>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {info.orgLeadership.map((row:any,i:number) => {
              const sc=({'cold':navy,'warm':gold,'hot':red,'active':green,'Active':green} as any)[row.relationship]||navy
              const sb=({'cold':'rgba(27,54,93,0.08)','warm':'rgba(212,175,55,0.12)','hot':'rgba(220,38,38,0.08)','active':'rgba(16,185,129,0.08)','Active':'rgba(16,185,129,0.08)'} as any)[row.relationship]||'rgba(27,54,93,0.08)'
              return (
                <div key={i} style={{ background:'#fff', border:'1px solid rgba(27,54,93,0.1)', borderRadius:12, padding:'16px 20px', display:'grid', gridTemplateColumns:'1fr 1.2fr 110px 1.5fr', gap:16, alignItems:'center', boxShadow:'0 2px 12px rgba(27,54,93,0.06)' }}>
                  <div style={{ fontSize:19, color:'#5a7499', fontFamily:'Source Sans 3, sans-serif' }}>{row.role}</div>
                  <div style={{ fontFamily:'Playfair Display, serif', fontSize:23, fontWeight:700, color:navy }}>{row.name}</div>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:20, background:sb, color:sc, fontSize:16, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                    <span style={{ width:5, height:5, borderRadius:'50%', background:sc }}/>{(row.relationship||'').toUpperCase()}
                  </span>
                  <div style={{ fontSize:19.5, color:'#5a7499', fontFamily:'Source Sans 3, sans-serif', lineHeight:1.55 }}>{row.insight}</div>
                </div>
              )
            })}
          </div>
        </Slide>

        {/* Pipeline */}
        <Slide id="pipeline">
          <SectionHeader title="Pipeline Insights" sub="Revenue opportunity analysis and deal stage breakdown" accent={teal}/>
          <div style={{ padding:'16px 20px', background:'#fff', borderRadius:12, border:'1px solid rgba(27,54,93,0.1)', boxShadow:'0 2px 10px rgba(27,54,93,0.05)' }}>
            <p style={{ fontSize:22, color:navy, lineHeight:1.85, margin:0, fontFamily:'Source Sans 3, sans-serif' }}>
              {typeof info.pipelineInsights === 'string' ? info.pipelineInsights : (info.pipelineInsights as any)?.summary || ''}
            </p>
          </div>
        </Slide>

        {/* Big Bets */}
        <Slide id="bigbets" alt>
          <SectionHeader title="Big Bets" sub="High-priority strategic opportunities requiring senior attention" accent={gold}/>
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {info.bigBets.map((bet:any,i:number) => {
              const c=[navy,goldM,teal][i%3]
              return (
                <div key={i} style={{ borderLeft:`4px solid ${c}`, background:'#fff', borderRadius:'0 16px 16px 0', padding:'22px 26px', border:`1px solid ${c}20`, borderLeftWidth:4, borderLeftColor:c, boxShadow:`0 4px 16px rgba(27,54,93,0.06)` }}>
                  <div style={{ fontFamily:'Playfair Display, serif', fontSize:26, fontWeight:700, color:navy, marginBottom:10 }}>{bet.title}</div>
                  <p style={{ fontSize:21, color:'#5a7499', lineHeight:1.85, margin:0, fontFamily:'Source Sans 3, sans-serif' }}>{bet.body}</p>
                </div>
              )
            })}
          </div>
        </Slide>

        {/* Strategic Priorities */}
        <Slide id="strategic">
          <SectionHeader title="Strategic Priorities" sub="Board-level imperatives and execution priorities for 2026" accent={navy}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {(info.strategicPriorities||[]).map((item:any,i:number) => {
              const c=[navy,goldM,teal,green,red][i%5]
              const label = typeof item === 'string' ? item : item.title || ''
              const detail = typeof item === 'string' ? '' : item.body || ''
              return (
                <div key={i} style={{ background:'#fff', border:`1px solid ${c}18`, borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 10px rgba(27,54,93,0.05)' }}>
                  <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:`${c}12`, border:`1px solid ${c}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:19, fontWeight:700, color:c, flexShrink:0, fontFamily:'Playfair Display, serif' }}>{i+1}</div>
                    <div>
                      {item.priority && <div style={{ fontSize:16, fontWeight:700, color:c, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4, fontFamily:'Source Sans 3, sans-serif' }}>{item.priority}</div>}
                      <p style={{ fontSize:20.5, color:navy, lineHeight:1.65, margin:0, fontFamily:'Source Sans 3, sans-serif', fontWeight:600 }}>{label}</p>
                      {detail && <p style={{ fontSize:19, color:'#5a7499', lineHeight:1.6, margin:'6px 0 0', fontFamily:'Source Sans 3, sans-serif' }}>{detail.slice(0, 180)}{detail.length > 180 ? '…' : ''}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Slide>

        {/* Next Best Action */}
        <Slide id="nextaction" alt>
          <SectionHeader title="Next Best Action" sub="Prioritised engagement recommendations for account teams" accent={gold}/>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {(info.nextBestAction||[]).map((item:any,i:number) => {
              const label = typeof item === 'string' ? item : item.action || ''
              const detail = typeof item === 'string' ? '' : item.detail || ''
              const weeks = typeof item === 'string' ? '' : item.priority || ''
              return (
                <div key={i} style={{ display:'flex', gap:14, padding:'18px 22px', background:'linear-gradient(135deg, rgba(27,54,93,0.05), #fff)', borderRadius:12, border:'1px solid rgba(27,54,93,0.1)', boxShadow:'0 2px 10px rgba(27,54,93,0.05)' }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:navy, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:22, fontWeight:700, flexShrink:0, fontFamily:'Playfair Display, serif', boxShadow:'0 4px 12px rgba(27,54,93,0.25)' }}>{i+1}</div>
                  <div style={{ flex:1 }}>
                    {weeks && <div style={{ fontSize:16, fontWeight:700, color:goldM, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4, fontFamily:'Source Sans 3, sans-serif' }}>{weeks}</div>}
                    <p style={{ fontSize:22, color:navy, lineHeight:1.6, margin:0, fontFamily:'Source Sans 3, sans-serif', fontWeight:600 }}>{label}</p>
                    {detail && <p style={{ fontSize:19, color:'#5a7499', lineHeight:1.6, margin:'5px 0 0', fontFamily:'Source Sans 3, sans-serif' }}>{detail.slice(0, 200)}{detail.length > 200 ? '…' : ''}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </Slide>

        {/* Freyr Play Areas */}
        <Slide id="freyr">
          <SectionHeader title="Freyr Play Areas" sub="Service line matching, competitive positioning, and engagement strategy" accent={goldM}/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:48 }}>
            {info.indegenePlays.map((item:string,i:number) => (
              <div key={i} style={{ background:'#fff', border:`1px solid rgba(27,54,93,0.1)`, borderRadius:14, padding:'18px 20px', boxShadow:'0 2px 10px rgba(27,54,93,0.05)' }}>
                <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:gold, flexShrink:0, marginTop:7, boxShadow:`0 0 8px ${gold}55` }}/>
                  <p style={{ fontSize:21, color:navy, lineHeight:1.65, margin:0, fontFamily:'Source Sans 3, sans-serif' }}>{item}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ paddingTop:32, borderTop:'1px solid rgba(27,54,93,0.08)', textAlign:'center', color:'#5a7499', fontSize:19, fontFamily:'Source Sans 3, sans-serif' }}>
            <div style={{ fontFamily:'Playfair Display, serif', fontWeight:700, color:navy, marginBottom:4 }}>The Nudge Intelligence · Powered by Freyr Solutions</div>
            <div>This briefing is confidential and intended for internal use only · June 2026</div>
          </div>
        </Slide>
      </div>
    </div>
    </ActiveCtx.Provider>
  )
}
