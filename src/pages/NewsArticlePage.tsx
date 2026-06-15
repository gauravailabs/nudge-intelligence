import { useParams, useNavigate } from 'react-router-dom'
import { NEWS_INTERNAL } from '../data'
export default function NewsArticlePage() {
  const { id } = useParams()
  const nav = useNavigate()
  const article = NEWS_INTERNAL.find(n => n.id === id) ?? NEWS_INTERNAL[0]
  return (
    <div>
      <button onClick={() => nav('/executive-summary')} style={{ background:'none',border:'none',cursor:'pointer',fontSize:19,color:'var(--text-3)',marginBottom:20,fontFamily:'inherit',display:'flex',alignItems:'center',gap:5 }}>← Back to Executive Summary</button>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 280px',gap:20 }}>
        <div className="card" style={{ padding:28 }}>
          <p style={{ fontSize:16,fontWeight:700,letterSpacing:'0.1em',color:'var(--brand)',textTransform:'uppercase',marginBottom:8 }}>Internal News · {article.date}</p>
          <h1 style={{ fontSize:32,fontWeight:800,margin:'0 0 16px',fontFamily:'Sora,sans-serif',color:'var(--text-1)' }}>{article.title}</h1>
          <div style={{ height:2,background:'linear-gradient(90deg, var(--brand), transparent)',marginBottom:20,borderRadius:2 }} />
          <p style={{ fontSize:21,color:'var(--text-2)',lineHeight:1.8 }}>{article.body}</p>
          <a href="#" onClick={e => e.preventDefault()} style={{ display:'inline-flex',alignItems:'center',gap:6,marginTop:20,padding:'10px 20px',borderRadius:8,background:'var(--gold)',color:'#000',fontSize:19,fontWeight:700,textDecoration:'none' }}>Read full article ↗</a>
        </div>
        <div className="card" style={{ padding:0,overflow:'hidden' }}>
          <div style={{ padding:'12px 16px',borderBottom:'1px solid var(--border)',fontSize:16,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.08em' }}>Internal News</div>
          {NEWS_INTERNAL.map(item => (
            <div key={item.id} onClick={() => nav(`/executive-summary/news/${item.id}`)}
              style={{ padding:'11px 14px',borderBottom:'1px solid var(--border)',cursor:'pointer',fontSize:19,color:item.id===id?'var(--brand)':'var(--text-1)',background:item.id===id?'var(--brand-bg)':'transparent',lineHeight:1.5 }}>
              {item.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
