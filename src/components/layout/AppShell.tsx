import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'

const PAGE_TITLES: Record<string, string> = {
  '/modules': 'Modules',
  '/executive-summary': 'Sales & Growth Intelligence',
  '/executive-summary/pipeline-insights': 'Pipeline Insights',
  '/executive-summary/financial-insights': 'Financial Insights',
  '/accounts': 'Account Intelligence',
  '/accounts/planning': 'Account Planning',
  '/accounts/exec-capital': 'Exec Capital',
}
function getTitle(p: string) {
  if (PAGE_TITLES[p]) return PAGE_TITLES[p]
  if (p.startsWith('/accounts/exec-capital/')) return 'Exec Capital'
  if (p.startsWith('/accounts/')) return 'Account Intelligence'
  return 'The Nudge Intelligence'
}

export default function AppShell() {
  const loc = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // AccountInfo pages have their own fixed bi-nav so need extra top padding
  const isAccountInfo = /^\/accounts\/[^/]+$/.test(loc.pathname) && !loc.pathname.startsWith('/accounts/exec-capital') && !loc.pathname.startsWith('/accounts/planning') && loc.pathname !== '/accounts'

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <div className={`sidebar${sidebarOpen?'':' hidden'}`}>
        <Sidebar />
      </div>

      <div className={`main-area${sidebarOpen?'':' sidebar-hidden'}`}
        style={{ marginLeft:sidebarOpen?'var(--sb-w)':0, flex:1, minWidth:0 }}>
        {/* Standard topbar */}
        <header className="topbar">
            <button onClick={() => setSidebarOpen(s=>!s)}
              style={{ width:34, height:34, borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-raised)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-2)', transition:'all 180ms', flexShrink:0 }}>
              {sidebarOpen ? <X size={15}/> : <Menu size={15}/>}
            </button>
            <div style={{ width:1, height:20, background:'var(--border)' }}/>
            <span style={{ fontSize:21, fontWeight:600, color:'var(--navy)', fontFamily:'Source Sans 3, sans-serif' }}>
              {getTitle(loc.pathname)}
            </span>
            <div style={{ flex:1 }}/>
            <div style={{ fontSize:18, color:'var(--text-3)', fontFamily:'Source Sans 3, sans-serif' }}>
              Home / {getTitle(loc.pathname)}
            </div>
            <div style={{ width:1, height:20, background:'var(--border)' }}/>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--navy)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:17.5, fontWeight:700, flexShrink:0, border:'2px solid var(--gold)' }}>RD</div>
            <span style={{ fontSize:19.5, fontWeight:600, color:'var(--navy)', fontFamily:'Source Sans 3, sans-serif' }}>Ritesh Dogra</span>
          </header>

        <main className="page-enter"
          style={{
            padding: isAccountInfo ? '20px 24px 48px' : '24px 28px 48px',
            paddingTop: isAccountInfo ? '20px' : '24px',
            background:'var(--bg-base)',
            minHeight:'calc(100vh - var(--topbar-h))',
            flex:1,
          }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
