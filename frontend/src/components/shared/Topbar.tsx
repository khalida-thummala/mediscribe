import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/patients': 'Patients',
  '/consultations': 'Consultations',
  '/ai-analysis': 'AI Report Analysis',
  '/reports': 'Reports',
  '/analytics': 'Analytics',
  '/audit': 'Audit Trail',
  '/settings': 'Settings',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? 'MediScribe'

  return (
    <header style={{ height: 60, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, flexShrink: 0 }}>
      <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, flex: 1 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', minWidth: 220 }}>
          <span style={{ color: 'var(--text-3)', fontSize: 13 }}>🔍</span>
          <input placeholder="Search patients, reports…" style={{ border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 13.5, color: 'var(--text)', outline: 'none', flex: 1 }} />
        </div>
        <button
          onClick={() => toast('No new notifications', { icon: '🔔' })}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text)' }}
        >
          🔔
        </button>
        <button
          onClick={() => navigate('/consultations')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--teal)', background: 'var(--teal)', color: '#fff' }}
        >
          + New Consultation
        </button>
      </div>
    </header>
  )
}
