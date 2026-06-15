import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, AlertCircle, Users, GitBranch, DollarSign, ArrowRight } from 'lucide-react'
import { INSIGHT_CARDS, NEWS_INTERNAL, NEWS_EXTERNAL_REVANCE } from '../data'

const ICONS: Record<string, any> = { TrendingUp, AlertCircle, Users }

export default function ExecutiveSummaryPage() {
  const nav = useNavigate()
  const [newsTab, setNewsTab] = useState<'internal' | 'external'>('internal')
  const [loading, setLoading] = useState(false)
  const news = newsTab === 'internal' ? NEWS_INTERNAL : NEWS_EXTERNAL_REVANCE

  const switchTab = (tab: 'internal' | 'external') => {
    if (tab === newsTab) return
    if (tab === 'external') {
      setLoading(true)
      setTimeout(() => setLoading(false), 700)
    }
    setNewsTab(tab)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 4 }}>SALES & GROWTH</p>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'Sora, sans-serif', color: 'var(--text-1)' }}>Executive Summary</h1>
      </div>

      {/* News panel */}
      <div className="card" style={{ marginBottom: 20, overflow: 'hidden' }}>
        <div className="tab-bar" style={{ padding: '0 20px' }}>
          {(['internal','external'] as const).map(tab => (
            <button key={tab} className={`tab-btn${newsTab===tab?' active':''}`}
              onClick={() => switchTab(tab)} style={{ background:'none',border:'none',cursor:'pointer',fontFamily:'inherit' }}>
              {tab === 'internal' ? 'Internal News' : 'External News'}
            </button>
          ))}
        </div>
        {loading ? (
          <div style={{ padding:'24px 20px',textAlign:'center',color:'var(--text-3)',fontSize:13.5 }}>Loading...</div>
        ) : (
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr' }}>
            {/* Featured */}
            <div style={{ borderRight:'1px solid var(--border)' }}>
              <div style={{ background:'linear-gradient(135deg, #3b1fd4 0%, #1a0a6e 50%, #06080f 100%)', minHeight:130, display:'flex',flexDirection:'column',justifyContent:'flex-end',padding:16,cursor:'pointer' }}
                onClick={() => nav(`/executive-summary/news/${news[0]?.id}`)}>
                <div style={{ fontSize:22,fontWeight:900,color:'#fff',lineHeight:1 }}>2026</div>
                <div style={{ fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.7)',letterSpacing:'0.1em',textTransform:'uppercase',marginTop:2 }}>INTELLIGENCE</div>
              </div>
              <div onClick={() => nav(`/executive-summary/news/${news[0]?.id}`)}
                style={{ padding:'11px 14px',cursor:'pointer',fontSize:13,color:'var(--text-1)',lineHeight:1.5 }}>
                {news[0]?.title}
              </div>
            </div>
            {/* Middle */}
            <div style={{ borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column' }}>
              {news.slice(1,4).map((item,i) => (
                <div key={item.id} onClick={() => nav(`/executive-summary/news/${item.id}`)}
                  style={{ padding:'11px 14px',borderBottom: i<2?'1px solid var(--border)':'none',cursor:'pointer',fontSize:13,color:'var(--text-1)',lineHeight:1.5,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,transition:'background 150ms' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-hover)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                  <span>{item.title}</span><span style={{ color:'var(--text-3)' }}>›</span>
                </div>
              ))}
            </div>
            {/* Right */}
            <div>
              {news.slice(4,6).map((item,i) => (
                <div key={item.id} onClick={() => nav(`/executive-summary/news/${item.id}`)}
                  style={{ padding:'11px 14px',borderBottom:i===0?'1px solid var(--border)':'none',cursor:'pointer',fontSize:13,color:'var(--text-1)',lineHeight:1.5,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,background:'var(--bg-raised)',transition:'background 150ms' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-hover)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='var(--bg-raised)')}>
                  <span style={{ fontWeight:500 }}>{item.title}</span><span style={{ color:'var(--text-3)' }}>›</span>
                </div>
              ))}
              <div style={{ padding:'8px 14px',textAlign:'right' }}>
                <span style={{ fontSize:12,color:'var(--brand)',fontWeight:500,cursor:'pointer' }}>Read more →</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Insight Cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:16 }}>
        {INSIGHT_CARDS.map(card => {
          const Icon = ICONS[card.icon]
          return (
            <div key={card.id} className="card card-clickable" onClick={() => nav(card.path)}
              style={{ padding:20,display:'flex',flexDirection:'column' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14 }}>
                <div style={{ width:38,height:38,borderRadius:10,background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff' }}>
                  {Icon && <Icon size={18} />}
                </div>
                <span className="label" style={{ color:'var(--text-3)' }}>{card.tag}</span>
              </div>
              <p style={{ fontSize:13.5,color:'var(--text-2)',lineHeight:1.7,flex:1,margin:0 }}>{card.preview}</p>
              <div style={{ marginTop:14,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <span style={{ fontSize:11,color:'var(--text-3)',fontWeight:600,letterSpacing:'0.06em' }}>{card.readTime}</span>
                <span style={{ fontSize:12.5,fontWeight:700,color:'var(--text-2)',display:'flex',alignItems:'center',gap:4 }}>Read More <ArrowRight size={12} /></span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pipeline + Financial CTAs */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
        {[
          { tag:'PIPELINE INSIGHTS', icon:GitBranch, text:'Explore pipeline trends by Business Unit and Service Line, with drilldowns and filters.', cta:'View full pipeline insights', path:'/executive-summary/pipeline-insights' },
          { tag:'FINANCIAL INSIGHTS', icon:DollarSign, text:'Track revenue signals, spend themes, and budget posture across key accounts and quarters.', cta:'View financial insights', path:'/executive-summary/financial-insights' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.tag} className="card card-clickable" style={{ padding:20,display:'flex',flexDirection:'column' }} onClick={() => nav(card.path)}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12 }}>
                <div style={{ width:38,height:38,borderRadius:10,background:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff' }}>
                  <Icon size={18} />
                </div>
                <span className="label">{card.tag}</span>
              </div>
              <p style={{ fontSize:13.5,color:'var(--text-2)',lineHeight:1.65,flex:1,margin:'0 0 14px' }}>{card.text}</p>
              <div style={{ fontSize:13,fontWeight:700,color:'var(--brand)',display:'flex',alignItems:'center',gap:4 }}>{card.cta} <ArrowRight size={13} /></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
