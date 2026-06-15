import { useNavigate } from 'react-router-dom'
import { TrendingUp, BarChart3, CheckCircle2, Users, Target, FileText, ArrowRight } from 'lucide-react'
import { MODULES } from '../data'
const ICONS: Record<string, any> = { TrendingUp, BarChart3, CheckCircle2, Users, Target, FileText }

export default function ModulesPage() {
  const nav = useNavigate()
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 6 }}>INTELLIGENCE PLATFORM</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'Sora, sans-serif', color: 'var(--text-1)' }}>Choose your Module</h1>
        <p style={{ fontSize: 14.5, color: 'var(--text-2)', marginTop: 6 }}>Select a module to access specialised analytical deep-dives and real-time performance metrics.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {MODULES.map(mod => {
          const Icon = ICONS[mod.icon]
          const active = mod.status === 'active'
          return (
            <div key={mod.id} className="card card-clickable" onClick={() => active && (mod as any).path && nav((mod as any).path)}
              style={{ padding: 24, position: 'relative', opacity: active ? 1 : 0.6, cursor: active ? 'pointer' : 'default',
                background: active ? 'var(--bg-surface)' : 'var(--bg-raised)',
              }}>
              {!active && <span className="coming-badge">Coming Soon</span>}
              <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 16,
                background: active ? 'var(--navy)' : 'var(--bg-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: active ? '#fff' : 'var(--text-3)',
              }}><Icon size={21} /></div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 8px', letterSpacing: '-0.01em', fontFamily: 'Sora, sans-serif' }}>{mod.title}</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.65, margin: '0 0 20px' }}>{mod.desc}</p>
              {active ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--brand)', textTransform: 'uppercase' }}>
                  Launch Module <ArrowRight size={13} />
                </div>
              ) : (
                <span className="label" style={{ color: 'var(--text-3)' }}>Coming Soon</span>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: 52, textAlign: 'center', fontSize: 11.5, color: 'var(--text-3)', letterSpacing: '0.06em' }}>© 2026 THE NUDGE INTELLIGENCE. ALL RIGHTS RESERVED.</div>
    </div>
  )
}
