import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getInitials } from '@/utils'

const NAV = [
  { label: 'Main', items: [
    { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
    { to: '/patients', icon: '👥', label: 'Patients', badge: '248' },
    { to: '/consultations', icon: '🎙', label: 'Consultations' },
  ]},
  { label: 'Clinical', items: [
    { to: '/ai-analysis', icon: '✦', label: 'AI Analysis', badge: 'New', badgeColor: '#5a3fad' },
    { to: '/reports', icon: '📄', label: 'Reports' },
  ]},
  { label: 'Insights', items: [
    { to: '/analytics', icon: '📊', label: 'Analytics' },
    { to: '/audit', icon: '🛡', label: 'Audit Trail' },
  ]},
  { label: 'Account', items: [
    { to: '/settings', icon: '⚙', label: 'Settings' },
  ]},
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  return (
    <nav style={{ width: 240, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Brand */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: 'var(--teal)' }}>MediScribe</div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Healthcare Platform v2.0</div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV.map((section) => (
          <div key={section.label}>
            <div style={{ padding: '12px 12px 4px', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
              {section.label}
            </div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 14px', margin: '1px 8px', borderRadius: 8,
                  cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
                  textDecoration: 'none',
                  background: isActive ? 'var(--teal-light)' : 'transparent',
                  color: isActive ? 'var(--teal)' : 'var(--text-2)',
                  transition: 'all 0.15s',
                })}
              >
                <span style={{ width: 18, textAlign: 'center', fontSize: 15 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{ background: (item as any).badgeColor || 'var(--teal)', color: '#fff', fontSize: 10, borderRadius: 20, padding: '2px 7px', fontWeight: 600 }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* User */}
      <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border)' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}
          onClick={() => { logout(); navigate('/login') }}
          title="Click to sign out"
        >
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
            {user ? getInitials(user.full_name) : 'DS'}
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{user?.full_name ?? 'Dr. D. Sharma'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Practitioner · HIPAA</div>
          </div>
        </div>
      </div>
    </nav>
  )
}
