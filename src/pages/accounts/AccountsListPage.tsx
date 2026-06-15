import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, ArrowRight, Users, TrendingUp, AlertTriangle, Target, LayoutList, LayoutGrid, Building2, DollarSign, MapPin, Zap } from 'lucide-react'
import { ACCOUNTS_LIST } from '../../data'

export default function AccountsListPage() {
  const nav = useNavigate()
  const [view, setView] = useState<'card'|'list'>('card')

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <p style={{ fontSize:16, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--brand)', marginBottom:4 }}>ACCOUNT INTELLIGENCE</p>
          <h1 style={{ fontSize:37.5, fontWeight:800, letterSpacing:'-0.03em', fontFamily:'Sora, sans-serif', color:'var(--text-1)', margin:0 }}>Nudge Command Center</h1>
          <p style={{ fontSize:20.5, color:'var(--text-2)', marginTop:6 }}>Strategic account intelligence — {ACCOUNTS_LIST.length} accounts mapped</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* View toggle — FIXED: 'card' shows cards, 'list' shows list */}
          <div style={{ display:'flex', background:'var(--bg-raised)', border:'1.5px solid var(--border)', borderRadius:10, padding:3, gap:3 }}>
            <button onClick={() => setView('card')} style={{
              padding:'7px 14px', borderRadius:7, border:'none', cursor:'pointer',
              background: view==='card' ? 'var(--navy)' : 'transparent',
              color: view==='card' ? '#fff' : 'var(--text-3)',
              display:'flex', alignItems:'center', gap:6,
              fontSize:18, fontWeight:600, fontFamily:'DM Sans, sans-serif',
              transition:'all 180ms',
            }}>
              <LayoutGrid size={13}/> Card View
            </button>
            <button onClick={() => setView('list')} style={{
              padding:'7px 14px', borderRadius:7, border:'none', cursor:'pointer',
              background: view==='list' ? 'var(--navy)' : 'transparent',
              color: view==='list' ? '#fff' : 'var(--text-3)',
              display:'flex', alignItems:'center', gap:6,
              fontSize:18, fontWeight:600, fontFamily:'DM Sans, sans-serif',
              transition:'all 180ms',
            }}>
              <LayoutList size={13}/> List View
            </button>
          </div>
          <button className="btn btn-brand" style={{ fontSize:18 }}>Discover &amp; Analyze</button>
        </div>
      </div>

      {view === 'card' ? <CardView nav={nav}/> : <ListView nav={nav}/>}
    </div>
  )
}

function CardView({ nav }: { nav: (p:string)=>void }) {
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20 }}>
      {ACCOUNTS_LIST.map(account => {
        const isBookmarked = bookmarked.has(account.id)
        const isTakeda = account.id === 'takeda'
        const accentColor = isTakeda ? '#D4AF37' : '#1B365D'

        return (
          <div key={account.id} style={{
            background:'var(--bg-surface)', border:'1px solid var(--border)',
            borderRadius:16, overflow:'hidden', boxShadow:'var(--glow-card)',
            transition:'box-shadow 200ms, transform 200ms',
            cursor:'pointer',
          }}
            onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 8px 32px rgba(27,54,93,0.12)'; e.currentTarget.style.transform='translateY(-2px)' }}
            onMouseLeave={e=>{ e.currentTarget.style.boxShadow='var(--glow-card)'; e.currentTarget.style.transform='translateY(0)' }}
          >
            {/* Color bar top */}
            <div style={{ height:4, background:`linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }}/>

            {/* Header */}
            <div style={{ padding:'20px 22px 0', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{
                  width:48, height:48, borderRadius:12,
                  background: isTakeda ? 'rgba(212,175,55,0.12)' : 'rgba(27,54,93,0.1)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:32, fontWeight:800, color:accentColor, fontFamily:'Sora, sans-serif',
                  flexShrink:0, border:`1px solid ${accentColor}22`,
                }}>
                  {(account as any).logo || account.name[0]}
                </div>
                <div>
                  <div style={{ fontSize:24.5, fontWeight:800, color:'var(--text-1)', letterSpacing:'-0.02em', fontFamily:'Sora, sans-serif' }}>{account.name}</div>
                  <div style={{ fontSize:17.5, color:'var(--text-3)', marginTop:2 }}>{account.executivesMapped} executives mapped</div>
                  <div style={{ marginTop:5, display:'inline-flex', padding:'2px 9px', borderRadius:20, background: isTakeda?'rgba(212,175,55,0.12)':'rgba(27,54,93,0.08)', color: isTakeda?'#b89428':'var(--navy)', fontSize:16, fontWeight:700, letterSpacing:'0.05em' }}>
                    {isTakeda ? 'STRATEGIC PRIORITY' : 'FOCUSED GROWTH'}
                  </div>
                </div>
              </div>
              <button
                onClick={e=>{ e.stopPropagation(); setBookmarked(b=>{ const n=new Set(b); n.has(account.id)?n.delete(account.id):n.add(account.id); return n }) }}
                style={{ background:'none', border:'none', cursor:'pointer', padding:4, color: isBookmarked?'#D4AF37':'var(--text-3)', transition:'color 150ms', flexShrink:0 }}
              >
                <Bookmark size={16} fill={isBookmarked?'#D4AF37':'none'}/>
              </button>
            </div>

            {/* Metrics grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'16px 22px' }}>
              {[
                { icon:<DollarSign size={12}/>, label:'Current Revenue', value:account.revenues.current },
                { icon:<Target size={12}/>, label:'3-Year Target', value:account.revenues.target3yr },
                { icon:<Building2 size={12}/>, label:'Portfolio Head', value:account.portfolioHead },
                { icon:<Users size={12}/>, label:'Account Owner', value:account.accountOwner },
              ].map(item => (
                <div key={item.label} style={{ background:'var(--bg-raised)', borderRadius:9, padding:'10px 12px', border:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:16, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>
                    {item.icon} {item.label}
                  </div>
                  <div style={{ fontSize:19.5, fontWeight:700, color:'var(--text-1)', fontFamily:'Sora, sans-serif' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Strategic posture */}
            <div style={{ padding:'0 22px 16px' }}>
              <p style={{ fontSize:19, color:'var(--text-2)', lineHeight:1.6, margin:0 }}>{account.strategicPosture}</p>
            </div>

            {/* Investment direction chip row */}
            <div style={{ padding:'0 22px 16px', display:'flex', gap:6, flexWrap:'wrap' }}>
              {account.investmentDirection.split('.').filter(Boolean).slice(0,3).map((tag, i) => (
                <span key={i} style={{
                  padding:'3px 9px', borderRadius:20, fontSize:16, fontWeight:600,
                  background: i===0?`${accentColor}12`:'var(--bg-raised)',
                  color: i===0?accentColor:'var(--text-3)',
                  border:`1px solid ${i===0?accentColor+'33':'var(--border)'}`,
                }}>{tag.trim()}</span>
              ))}
            </div>

            {/* Pressure indicators */}
            <div style={{ borderTop:'1px solid var(--border)', padding:'12px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <Zap size={12} style={{ color:'#dc2626' }}/>
                <span style={{ fontSize:16.5, color:'var(--text-3)', fontWeight:500 }}>{account.pressureVectors.split('.')[0]}</span>
              </div>
              <button
                className="btn btn-brand btn-sm"
                onClick={() => nav(`/accounts/${account.id}`)}
                style={{ fontSize:17.5, display:'flex', alignItems:'center', gap:5 }}
              >
                View Dossier <ArrowRight size={11}/>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListView({ nav }: { nav: (p:string)=>void }) {
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0, border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', background:'var(--bg-surface)' }}>
      {/* Table header */}
      <div style={{
        display:'grid', gridTemplateColumns:'2fr 1.2fr 1.2fr 1.2fr 120px 130px',
        padding:'10px 20px', background:'var(--bg-raised)',
        borderBottom:'2px solid var(--border)',
        fontSize:16, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}><Building2 size={11}/> Account</div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}><Target size={11}/> Strategic Posture</div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}><TrendingUp size={11}/> Revenue Target</div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}><AlertTriangle size={11}/> Pressure</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}><Users size={11}/> Mapped</div>
        <div/>
      </div>

      {ACCOUNTS_LIST.map((account, i) => {
        const isTakeda = account.id === 'takeda'
        const accentColor = isTakeda ? '#D4AF37' : '#1B365D'

        return (
          <div key={account.id} style={{
            display:'grid', gridTemplateColumns:'2fr 1.2fr 1.2fr 1.2fr 120px 130px',
            padding:'14px 20px', alignItems:'center', gap:12,
            borderBottom: i < ACCOUNTS_LIST.length-1 ? '1px solid var(--border)' : 'none',
            background:'transparent', transition:'background 150ms',
          }}
            onMouseEnter={e=>e.currentTarget.style.background='var(--bg-raised)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >
            {/* Account name */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:4, height:36, borderRadius:3, background:accentColor, flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:21, fontWeight:700, color:'var(--text-1)', fontFamily:'Sora, sans-serif' }}>{account.name}</div>
                <div style={{ fontSize:16.5, color:'var(--text-3)', marginTop:1 }}>{account.portfolioHead}</div>
              </div>
              <button
                onClick={e=>{ e.stopPropagation(); setBookmarked(b=>{ const n=new Set(b); n.has(account.id)?n.delete(account.id):n.add(account.id); return n }) }}
                style={{ background:'none', border:'none', cursor:'pointer', color: bookmarked.has(account.id)?'#D4AF37':'var(--text-3)', marginLeft:4 }}
              >
                <Bookmark size={13} fill={bookmarked.has(account.id)?'#D4AF37':'none'}/>
              </button>
            </div>
            {/* Strategic posture */}
            <div style={{ fontSize:18, color:'var(--text-2)', lineHeight:1.55 }}>{account.strategicPosture.slice(0,80)}...</div>
            {/* Revenue */}
            <div>
              <div style={{ fontSize:19, fontWeight:700, color:accentColor }}>{account.revenues.target3yr}</div>
              <div style={{ fontSize:16, color:'var(--text-3)' }}>3-yr target</div>
            </div>
            {/* Pressure */}
            <div style={{ fontSize:17.5, color:'var(--text-3)', lineHeight:1.5 }}>{account.pressureVectors.split('.')[0]}.</div>
            {/* Mapped */}
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:28, fontWeight:900, color:'var(--text-1)', fontFamily:'Sora, sans-serif', lineHeight:1 }}>{account.executivesMapped}</div>
              <div style={{ fontSize:16, color:'var(--text-3)', marginTop:2 }}>execs</div>
            </div>
            {/* Action */}
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn btn-brand btn-sm" onClick={() => nav(`/accounts/${account.id}`)} style={{ fontSize:16.5, width:'100%', justifyContent:'center' }}>
                View Dossier
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
