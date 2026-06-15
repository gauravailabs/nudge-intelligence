import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { PIPELINE_QUARTERLY, PIPELINE_NET_RENEWALS, BU_DATA, MARQUEE_DEALS } from '../data'

const STAGES = ['All','Offer','Qualification','Proposal','Negotiation','Won','Lost']
const FORECASTS = ['All','Commit','Best Case','Pipeline - Qualifying 10-25%','Prospect 10%','Lost/No-go/Omitted']
const QUARTERS = ['Q4-2025','Q1-2026','Q2-2026','Q3-2026']

export default function PipelineInsightsPage() {
  const nav = useNavigate()
  const [metric, setMetric] = useState<'ACV'|'TCV'>('TCV')
  const [stage, setStage] = useState('All')
  const [forecast, setForecast] = useState('All')
  const [quarter, setQuarter] = useState('Q1-2026')
  const [dealStage, setDealStage] = useState('All')
  const navy = '#1a2440'
  const gold = '#c8a84b'

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:20 }}>
        <button onClick={() => nav('/executive-summary')} style={{ background:'none',border:'none',cursor:'pointer',fontSize:19,color:'var(--text-3)',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4 }}>← Back</button>
        <div style={{ flex:1 }}/>
        {(['ACV','TCV'] as const).map(m => (
          <button key={m} onClick={() => setMetric(m)} className={metric===m?'btn btn-brand btn-sm':'btn btn-ghost btn-sm'}>{m==='ACV'?'Annual Contract Value':'Total Contract Value'}</button>
        ))}
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16 }}>
        <div className="card" style={{ padding:20 }}>
          <div className="label" style={{ marginBottom:12 }}>PIPELINE OVERVIEW ({metric})</div>
          <div style={{ display:'flex',gap:8,marginBottom:12 }}>
            <select className="select" value={stage} onChange={e=>setStage(e.target.value)} style={{ flex:1 }}>{STAGES.map(s=><option key={s}>{s}</option>)}</select>
            <select className="select" value={forecast} onChange={e=>setForecast(e.target.value)} style={{ flex:1 }}>{FORECASTS.map(f=><option key={f}>{f}</option>)}</select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PIPELINE_QUARTERLY} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="quarter" tick={{ fontSize:16,fill:'var(--text-3)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:16,fill:'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={(v:number)=>`$${v}M`}/>
              <Tooltip formatter={(v:number)=>[`$${v}M`,metric]} contentStyle={{ borderRadius:10,border:'1px solid var(--border)',background:'var(--bg-surface)',fontSize:17.5 }}/>
              <Bar dataKey="value" fill={navy} radius={[5,5,0,0]} label={{ position:'top',formatter:(v:number)=>`$${v}M`,fontSize:16,fill:'var(--text-3)' }}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card" style={{ padding:20 }}>
          <div className="label" style={{ marginBottom:12 }}>QUARTER BREAKDOWN — NET NEW VS RENEWALS ({metric})</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PIPELINE_NET_RENEWALS} barSize={22} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
              <XAxis dataKey="quarter" tick={{ fontSize:16,fill:'var(--text-3)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:16,fill:'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={(v:number)=>`${v}M`}/>
              <Tooltip contentStyle={{ borderRadius:10,border:'1px solid var(--border)',background:'var(--bg-surface)',fontSize:17.5 }}/>
              <Legend wrapperStyle={{ fontSize:16 }}/>
              <Bar dataKey="netNew" name="Net New" fill={navy} radius={[3,3,0,0]}/>
              <Bar dataKey="renewals" name="Renewals" fill={gold} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ padding:20,marginBottom:16 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
          <div className="label">BU DRILL-DOWN ({quarter})</div>
          <select className="select" value={quarter} onChange={e=>setQuarter(e.target.value)}>{QUARTERS.map(q=><option key={q}>{q}</option>)}</select>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={BU_DATA} barSize={20} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
            <XAxis dataKey="bu" tick={{ fontSize:16,fill:'var(--text-3)' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:16,fill:'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={(v:number)=>`${v}M`}/>
            <Tooltip contentStyle={{ borderRadius:10,border:'1px solid var(--border)',background:'var(--bg-surface)',fontSize:17.5 }}/>
            <Legend wrapperStyle={{ fontSize:16 }}/>
            <Bar dataKey="netNew" name="Net New" fill={navy} radius={[3,3,0,0]}/>
            <Bar dataKey="renewals" name="Renewals" fill={gold} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ padding:20 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
          <div className="label" style={{ fontSize:17.5 }}>V7 — MARQUEE DEALS</div>
          <div style={{ display:'flex',gap:8 }}>
            <select className="select" value={dealStage} onChange={e=>setDealStage(e.target.value)}>{STAGES.map(s=><option key={s}>{s}</option>)}</select>
          </div>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14 }}>
          {MARQUEE_DEALS.map(deal => (
            <div key={deal.id} style={{ borderLeft:'3px solid var(--brand)',background:'var(--bg-raised)',borderRadius:'0 12px 12px 0',padding:'14px 16px',border:'1px solid var(--border)',borderLeftWidth:3,borderLeftColor:'var(--brand)' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8 }}>
                <div style={{ fontSize:19,fontWeight:600,color:'var(--text-1)',lineHeight:1.4,flex:1,marginRight:8 }}>{deal.title}</div>
                <div style={{ display:'flex',flexDirection:'column',gap:3 }}>
                  {deal.badges.map((b:any) => <span key={b.label} className={`badge badge-${b.color}`} style={{ fontSize:16,whiteSpace:'nowrap' }}>{b.label}</span>)}
                </div>
              </div>
              <div style={{ fontSize:17.5,color:'var(--text-2)',marginBottom:8 }}>{deal.company}</div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:4,marginBottom:10 }}>
                {deal.tags.slice(0,3).map((t:string) => <span key={t} className="badge badge-muted" style={{ fontSize:16 }}>{t}</span>)}
              </div>
              <div style={{ display:'flex',gap:6,marginBottom:12,flexWrap:'wrap' }}>
                <span className="badge badge-muted" style={{ fontSize:16 }}>⬡ {deal.stage}</span>
                <span className="badge badge-muted" style={{ fontSize:16 }}>📅 {deal.closeDate}</span>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6 }}>
                {[{l:'ACV',v:deal.acv},{l:'TCV',v:deal.tcv},{l:'Selected',v:deal.selected,h:true}].map(f => (
                  <div key={f.l} style={{ background:f.h?'var(--brand)':'var(--bg-surface)',borderRadius:7,padding:'7px 10px',border:f.h?'none':'1px solid var(--border)' }}>
                    <div style={{ fontSize:16,color:f.h?'rgba(255,255,255,0.55)':'var(--text-3)',marginBottom:2,fontWeight:600,letterSpacing:'0.04em' }}>{f.l}</div>
                    <div style={{ fontSize:20.5,fontWeight:800,color:f.h?'#fff':'var(--text-1)',fontFamily:'Sora,sans-serif' }}>{f.v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
