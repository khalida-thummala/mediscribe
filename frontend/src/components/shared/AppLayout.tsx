import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  const { theme, sidebarOpen, toggleSidebar } = useUIStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)', color: 'var(--text-1)', position: 'relative' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={toggleSidebar}
          className="mobile-only"
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', zIndex: 40, backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <Sidebar />
      <div style={{ 
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        width: '100%' 
      }}>
        <Topbar />
        <main style={{ 
          flex: 1, overflowY: 'auto', padding: '16px 20px', 
          background: 'var(--bg)', transition: 'background 0.3s ease' 
        }}>
          <div className="fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
