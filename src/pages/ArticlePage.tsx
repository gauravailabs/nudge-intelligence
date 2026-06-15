import { useParams, useNavigate } from 'react-router-dom'
const ARTICLES: Record<string, any> = {
  'market-signals': {
    tag:'MARKET SIGNALS',
    signal:'Across leading biopharma, the industry is converging on compressing regulated knowledge-work cycle times—via governed, scalable GenAI-driven automation in medical writing, MLR, and commercial content operations—to safeguard launch-readiness and margin under intensifying pricing, portfolio, and supply-chain pressures.',
    sections:[
      { h:'1. Accelerated Regulatory and Launch Readiness Under Compressed Timelines', b:'Biopharma companies face a surge of late-stage clinical readouts and regulatory submission deadlines through 2025–2026, intensifying pressure on regulatory writing, submission planning, and launch content operations. Making cycle-time reduction and right-first-time quality critical to avoid revenue-impacting delays.', eg:"Daiichi Sankyo's focus on converting registrational trials into approvals faster; Vertex's pediatric CF submission factory for H1 2026.", impl:"Pharma service providers must offer GenAI-native medical writing and regulatory workflow orchestration with governance to compress drafting and review cycles." },
      { h:'2. Pricing and Market Access Volatility Driving Agile Commercial Execution', b:'Pricing reforms, biosimilar competition, and payer behavior are compressing net prices and increasing gross-to-net leakage. Companies report significant margin pressure and emphasize the need for rapid, compliant updates to market access materials.', eg:"Amgen's biosimilar pricing pressure; AbbVie's negative price expectations for Skyrizi.", impl:"Partners must deploy agentic forecasting workflows and omnichannel intelligence platforms that enable rapid scenario refresh and compliant content adaptation." },
      { h:'3. Enterprise-Grade GenAI Adoption with Life-Sciences-Specific Governance', b:'The industry is transitioning from AI pilots to industrial-scale, regulated GenAI deployments. Companies emphasize strict governance, auditability, and data privacy controls.', eg:"AstraZeneca's nationwide AI screening rollout; Boehringer Ingelheim's AI/LLM programs.", impl:"Service providers must embed enterprise-grade governance, human-in-the-loop controls, and interoperability." },
    ],
    keyPoints:['Accelerated adoption of AI and GenAI platforms across R&D, regulatory, commercial, and pharmacovigilance workflows.','Biopharma companies face intensified pricing pressures driving urgent needs for gross-to-net controls.','Manufacturing onshoring and capacity expansion are strategic imperatives to mitigate tariff and supply-chain risks.','Late-stage pipeline execution and launch readiness are increasingly time-bound and board-visible.','Enterprise transformation and operating-model redesigns are critical to unlock productivity.'],
  },
  'emerging-priorities': {
    tag:'EMERGING PRIORITIES',
    signal:'Leading pharmaceutical companies are converging on enterprise-wide execution acceleration through governed AI-enabled automation—prioritizing compressed cycle times in regulatory submissions, compliant content supply chains, and omnichannel commercial operations.',
    sections:[
      { h:'1. Accelerate Regulatory and Launch Readiness to Mitigate Pipeline and Market Access Risks', b:'Multiple companies emphasize compressing regulatory submission and launch preparation cycles to protect time-sensitive milestones amid dense late-stage pipelines and heightened regulatory scrutiny.', eg:"Novartis and Daiichi Sankyo are investing in GenAI-native medical writing platforms to reduce cycle times by up to 63%.", impl:"Industry partners must offer scalable, compliant automation solutions that integrate with existing regulatory systems." },
      { h:'2. Defend Revenue and Margin Under Pricing Pressure and LOE', b:"Companies are confronting significant margin erosion from biosimilar competition, pricing reforms, and patent cliffs. AbbVie's Humira sales declined ~55% in Q3 2025.", eg:"Amgen, AbbVie, and J&J are accelerating uptake of newer growth brands to offset LOE losses.", impl:"Commercialization partners must deploy agentic forecasting workflows and omnichannel intelligence platforms." },
    ],
    keyPoints:['Accelerate regulatory throughput using AI-native platforms to meet compressed submission timelines.','Industrialize compliant content and localization workflows to reduce cycle times.','Establish governed, enterprise-scale AI adoption with strict data separation.','Enhance cross-functional execution cadence to manage complex M&A integration.','Scaled patient-access programs are critical to defend revenue at launch and during LOE transitions.'],
  },
  'executive-capital': {
    tag:'EXECUTIVE CAPITAL',
    signal:'Across leading pharmaceutical enterprises, there is a pronounced shift toward consolidating executive authority around governance-grade AI and digital transformation mandates.',
    sections:[
      { h:'1. Board-Level Visibility of AI and Digital Transformation', b:'Digital transformation and AI governance have become board-level agenda items. This elevation reflects both strategic importance and compliance risk.', eg:'Takeda: Gabriele Ricci (CDTO) elevated to CEO-direct report. Lauren Duprey (CTO) newly appointed April 2026.', impl:'Engagements must be framed in terms of board-visible metrics: cycle time, cost leverage, compliance posture.' },
      { h:'2. C-Suite Consolidation Around AI Governance Mandates', b:'C-suite executives are consolidating digital transformation authority. CFOs are increasingly involved in AI investment decisions.', eg:'Crown Laboratories installed simultaneous CEO/COO/CFO troika at Revance (October 2025). Takeda\'s Lauren Duprey moved from CHRO to CTO (April 2026).', impl:'Long-term strategic partnerships are preferred over transactional vendor relationships.' },
    ],
    keyPoints:['AI governance has become a board-level agenda item. C-suite executives are consolidating digital transformation authority.','CFOs are increasingly involved in AI investment decisions. PE-backed companies apply measurable ROI frameworks.','Chief Digital Officers and Chief Data Officers are gaining influence in vendor selection.','Long-term strategic partnerships are preferred. Vendor rationalisation is a standard PE integration step.','The CEO transition window (Takeda, June 2026) creates a 60-90 day opportunity for technology decisions.'],
  },
}

export default function ArticlePage() {
  const { type } = useParams()
  const nav = useNavigate()
  const article = type ? ARTICLES[type] : null
  if (!article) return <div style={{ padding:40,textAlign:'center',color:'var(--text-3)' }}>Article not found.</div>
  return (
    <div>
      <button onClick={() => nav('/executive-summary')} style={{ background:'none',border:'none',cursor:'pointer',fontSize:19,color:'var(--text-3)',marginBottom:20,fontFamily:'inherit',display:'flex',alignItems:'center',gap:5 }}>← Back to Executive Summary</button>
      <div style={{ display:'grid',gridTemplateColumns:'210px 1fr 260px',gap:20,alignItems:'start' }}>
        <div className="card" style={{ padding:18,position:'sticky',top:80 }}>
          <div style={{ fontSize:16,fontWeight:700,color:'var(--text-1)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.06em' }}>Overarching Signal</div>
          <p style={{ fontSize:19,color:'var(--text-2)',lineHeight:1.7,margin:0 }}>{article.signal}</p>
        </div>
        <div className="card" style={{ padding:24 }}>
          <h2 style={{ fontSize:26,fontWeight:800,margin:'0 0 20px',color:'var(--text-1)',textAlign:'center',fontFamily:'Sora,sans-serif' }}>Detailed Insights</h2>
          {article.sections.map((s:any,i:number) => (
            <div key={i} style={{ marginBottom:28 }}>
              <h3 style={{ fontSize:22,fontWeight:700,color:'var(--text-1)',margin:'0 0 10px' }}>{s.h}</h3>
              <p style={{ fontSize:20.5,color:'var(--text-2)',lineHeight:1.75,margin:'0 0 10px' }}>{s.b}</p>
              {s.eg && <p style={{ fontSize:19.5,color:'var(--text-2)',lineHeight:1.7,margin:'0 0 8px' }}><strong style={{ color:'var(--text-1)' }}>Examples:</strong> {s.eg}</p>}
              {s.impl && <p style={{ fontSize:19.5,color:'var(--text-2)',lineHeight:1.7,margin:0 }}><strong style={{ color:'var(--text-1)' }}>Strategic Implications:</strong> {s.impl}</p>}
            </div>
          ))}
        </div>
        <div style={{ position:'sticky',top:80 }}>
          {article.keyPoints.map((pt:string,i:number) => (
            <div key={i} style={{ marginBottom:22 }}>
              <div style={{ fontSize:35,fontWeight:900,color:'var(--brand)',borderBottom:'2px solid var(--brand)',paddingBottom:4,marginBottom:8,display:'inline-block',minWidth:36,fontFamily:'Sora,sans-serif' }}>{String(i+1).padStart(2,'0')}</div>
              <p style={{ fontSize:19,color:'var(--text-2)',lineHeight:1.65,margin:0 }}>{pt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
