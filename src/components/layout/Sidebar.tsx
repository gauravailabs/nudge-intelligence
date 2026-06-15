import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutGrid, Building2, ChevronDown, TrendingUp, BarChart3, CheckCircle2, Users, Target, FileText, BookOpen } from 'lucide-react'

const MODULES_SUB = [
  { label: 'Sales & Growth',  path: '/executive-summary', icon: TrendingUp },
  { label: 'Marketing',       path: '#', icon: BarChart3,    soon: true },
  { label: 'Delivery Health', path: '#', icon: CheckCircle2, soon: true },
  { label: 'Talent Internal', path: '#', icon: Users,        soon: true },
  { label: 'Competition',     path: '#', icon: Target,       soon: true },
  { label: 'RFP/RFI Hub',    path: '#', icon: FileText,     soon: true },
]
const ACCOUNTS_SUB = [
  { label: 'Account Planning', path: '/accounts/planning',     icon: FileText },
  { label: 'Exec Capital',     path: '/accounts/exec-capital', icon: Users },
  { label: 'Account Info',     path: '/accounts',              icon: BookOpen },
]

export default function Sidebar() {
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState<Record<string,boolean>>({ modules: true, accounts: true })

  const isActive = (path: string) => {
    if (path === '/accounts') return loc.pathname === '/accounts'
    return loc.pathname === path || loc.pathname.startsWith(path + '/')
  }
  const sectionActive = (paths: string[]) => paths.some(p => isActive(p))
  const toggle = (k: string) => setOpen(o => ({ ...o, [k]: !o[k] }))

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflowX:'hidden' }}>
      {/* Logo */}
      <div onClick={() => nav('/modules')} style={{
        padding: '22px 20px 18px',
        borderBottom: '1px solid rgba(212,175,55,0.18)',
        cursor: 'pointer', flexShrink: 0,
        background: 'linear-gradient(180deg, rgba(212,175,55,0.05), transparent)',
      }}>
        {/* Triple gold chevrons */}
        <div style={{ display:'flex', gap: 5, marginBottom: 10, alignItems:'center' }}>
          {[0,1,2].map(i => (
            <svg key={i} width="16" height="16" viewBox="0 0 14 14" fill="none"
              style={{ filter:`drop-shadow(0 0 ${3+i*2}px rgba(212,175,55,${0.5+i*0.2}))` }}>
              <polyline points="2,12 7,2 12,12"
                stroke={i===0?'#D4AF37':i===1?'#e8c547':'#f5d875'}
                strokeWidth="2.2" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
            </svg>
          ))}
        </div>
        <div style={{ fontSize:7.5, letterSpacing:'0.24em', color:'rgba(255,255,255,0.35)', fontWeight:600, textTransform:'uppercase', fontFamily:'Source Sans 3, sans-serif' }}>The</div>
        <div style={{ fontSize:32, fontWeight:700, color:'#ffffff', letterSpacing:'0.06em', lineHeight:1.1, fontFamily:'Playfair Display, serif', textShadow:'0 0 20px rgba(212,175,55,0.3)' }}>NUDGE</div>
        <div style={{ fontSize:7.5, letterSpacing:'0.24em', color:'rgba(255,255,255,0.35)', fontWeight:600, textTransform:'uppercase', marginTop:1, fontFamily:'Source Sans 3, sans-serif' }}>Intelligence</div>
      </div>

      {/* Nav */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'14px 0 8px' }}>
        <div style={{ padding:'0 20px 10px', fontSize:9.5, letterSpacing:'0.18em', color:'rgba(255,255,255,0.28)', fontWeight:600, textTransform:'uppercase', fontFamily:'Source Sans 3, sans-serif' }}>
          Main Menu
        </div>

        {/* Modules */}
        <div>
          <div className={`nav-item${sectionActive(['/modules','/executive-summary'])?' active':''}`}
            onClick={() => { toggle('modules'); nav('/modules') }}>
            <LayoutGrid size={15} style={{ flexShrink:0 }}/>
            <span style={{ flex:1 }}>Modules</span>
            <ChevronDown size={13} style={{ opacity:0.5, transform:open.modules?'rotate(180deg)':'none', transition:'transform 200ms', flexShrink:0 }}/>
          </div>
          {open.modules && MODULES_SUB.map(item => {
            const Icon = item.icon
            return (
              <div key={item.path} className={`sub-nav-item${isActive(item.path)?' active':''}`}
                style={{ opacity:item.soon?0.4:1, cursor:item.soon?'default':'pointer' }}
                onClick={() => !item.soon && nav(item.path)}>
                <Icon size={12} style={{ flexShrink:0 }}/>
                <span>{item.label}</span>
                {item.soon && <span style={{ fontSize:9, marginLeft:'auto', color:'rgba(255,255,255,0.22)', letterSpacing:'0.06em' }}>soon</span>}
              </div>
            )
          })}
        </div>

        {/* Accounts */}
        <div style={{ marginTop:6 }}>
          <div className={`nav-item${sectionActive(['/accounts',...ACCOUNTS_SUB.map(a=>a.path)])?' active':''}`}
            onClick={() => { toggle('accounts'); nav('/accounts') }}>
            <Building2 size={15} style={{ flexShrink:0 }}/>
            <span style={{ flex:1 }}>Accounts</span>
            <ChevronDown size={13} style={{ opacity:0.5, transform:open.accounts?'rotate(180deg)':'none', transition:'transform 200ms', flexShrink:0 }}/>
          </div>
          {open.accounts && ACCOUNTS_SUB.map(item => {
            const Icon = item.icon
            return (
              <div key={item.path} className={`sub-nav-item${isActive(item.path)?' active':''}`}
                onClick={() => nav(item.path)}>
                <Icon size={12} style={{ flexShrink:0 }}/>
                <span>{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(212,175,55,0.12)', fontSize:16, color:'rgba(255,255,255,0.22)', fontFamily:'Source Sans 3, sans-serif' }}>
        © 2026 The Nudge Intelligence
      </div>
    </div>
  )
}
