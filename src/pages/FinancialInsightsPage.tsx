import { useNavigate } from 'react-router-dom'
export default function FinancialInsightsPage() {
  const nav = useNavigate()
  return (
    <div>
      <button onClick={() => nav('/executive-summary')} style={{ background:'none',border:'none',cursor:'pointer',fontSize:19,color:'var(--text-3)',marginBottom:20,fontFamily:'inherit',display:'flex',alignItems:'center',gap:5 }}>← Back</button>
      <div className="card" style={{ padding:'60px 40px',textAlign:'center' }}>
        <div style={{ fontSize:48,marginBottom:16 }}>💰</div>
        <div style={{ fontSize:26,fontWeight:700,color:'var(--text-1)',marginBottom:8,fontFamily:'Sora,sans-serif' }}>Financial Insights</div>
        <p style={{ fontSize:20.5,color:'var(--text-3)' }}>Coming soon — track revenue signals, spend themes, and budget posture.</p>
      </div>
    </div>
  )
}
