import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { getInitials } from '@/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/auth'

type SettingsTab = 'profile' | 'security' | 'notifications' | 'integrations' | 'billing'

const SETTINGS_NAV: { key: SettingsTab; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'security', label: 'Security & 2FA' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'billing', label: 'Billing & Plan' },
]

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <div onClick={() => setOn(!on)} style={{ position: 'relative', width: 42, height: 24, flexShrink: 0, cursor: 'pointer' }}>
      <div style={{ position: 'absolute', inset: 0, background: on ? 'var(--teal)' : 'var(--border-2)', borderRadius: 24, transition: '0.2s' }} />
      <div style={{ position: 'absolute', width: 18, height: 18, background: '#fff', borderRadius: '50%', top: 3, left: on ? 21 : 3, transition: '0.2s' }} />
    </div>
  )
}

function Row({ label, sub, defaultChecked = false }: { label: string; sub?: string; defaultChecked?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub}</div>}
      </div>
      <Toggle defaultChecked={defaultChecked} />
    </div>
  )
}

const INTEGRATIONS = [
  { icon: '🎙', name: 'Azure Speech Services', desc: 'Medical terminology · 97%+ accuracy', connected: true },
  { icon: '✦', name: 'OpenAI GPT-4', desc: 'SOAP generation · AI analysis', connected: true },
  { icon: '📧', name: 'Email Service (SendGrid)', desc: 'Report delivery & notifications', connected: true },
  { icon: '🏥', name: 'EHR System (HL7 FHIR)', desc: 'Electronic Health Records integration', connected: false },
]

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('profile')
  const { user, setAuth } = useAuthStore()
  const queryClient = useQueryClient()

  // Profile form state
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [licenseNumber, setLicenseNumber] = useState(user?.license_number || '')

  // Security form state
  const [password, setPassword] = useState('')

  const profileMutation = useMutation({
    mutationFn: (data: any) => authApi.updateProfile(data),
    onSuccess: (data) => {
      toast.success('Profile updated')
      // Update local store with new user data
      const state = useAuthStore.getState()
      setAuth(data.user, state.accessToken || '', state.refreshToken || '')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: () => toast.error('Failed to update profile')
  })

  const securityMutation = useMutation({
    mutationFn: (data: any) => authApi.updateSecurity(data),
    onSuccess: () => {
      toast.success('Security settings updated')
      setPassword('')
    },
    onError: () => toast.error('Failed to update security settings')
  })

  const handleSaveProfile = () => {
    profileMutation.mutate({
      full_name: fullName,
      email: email,
      license_number: licenseNumber
    })
  }

  const handleUpdatePassword = () => {
    if (!password) return toast.error('Enter a new password')
    securityMutation.mutate({ password })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
      {/* Nav */}
      <div className="card" style={{ overflow: 'hidden', height: 'fit-content' }}>
        {SETTINGS_NAV.map(({ key, label }) => (
          <div key={key} onClick={() => setTab(key)} style={{ padding: '11px 16px', fontSize: 13.5, cursor: 'pointer', borderBottom: '1px solid var(--border)', fontWeight: 500, background: tab === key ? 'var(--teal-light)' : 'transparent', color: tab === key ? 'var(--teal)' : 'var(--text-2)', transition: 'background 0.15s' }}>
            {label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div>
        {tab === 'profile' && (
          <div className="card">
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 16 }}>Profile Information</h3></div>
            <div style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600 }}>
                  {user ? getInitials(user.full_name) : 'DS'}
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>{user?.full_name ?? 'Dr. Deepak Sharma'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Practitioner · City General Hospital</div>
                  <button className="btn btn-sm" style={{ marginTop: 6 }}>Change Photo</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Full Name</label>
                  <input className="form-control" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>License Number</label>
                  <input className="form-control" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Email</label>
                  <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Phone</label>
                  <input className="form-control" defaultValue="+91-9876543210" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Timezone</label>
                  <select className="form-control"><option>Asia/Kolkata (IST)</option><option>UTC</option></select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Language</label>
                  <select className="form-control"><option>English (en)</option><option>हिंदी (hi)</option></select>
                </div>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={handleSaveProfile} disabled={profileMutation.isPending}>
                {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className="card">
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 16 }}>Security Settings</h3></div>
            <div style={{ padding: '22px 24px' }}>
              <Row label="Two-Factor Authentication (TOTP)" sub="Required for admin accounts · Google Authenticator" defaultChecked />
              <Row label="SMS Fallback Authentication" sub="Use SMS code if TOTP unavailable" />
              <Row label="Session IP Validation" sub="Re-authenticate on IP address change" defaultChecked />
              <div style={{ paddingTop: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Change Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" placeholder="New password" style={{ maxWidth: 320, marginBottom: 12 }} />
                <button className="btn btn-primary" onClick={handleUpdatePassword} disabled={securityMutation.isPending}>
                  {securityMutation.isPending ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="card">
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 16 }}>Notification Preferences</h3></div>
            <div style={{ padding: '22px 24px' }}>
              <Row label="Consultation complete email" defaultChecked />
              <Row label="SOAP note ready alert" defaultChecked />
              <Row label="AI analysis completion" defaultChecked />
              <Row label="Security login alerts" defaultChecked />
            </div>
          </div>
        )}

        {tab === 'integrations' && (
          <div className="card">
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 16 }}>Integrations</h3></div>
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {INTEGRATIONS.map((intg) => (
                <div key={intg.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 24 }}>{intg.icon}</span>
                    <div>
                      <div style={{ fontWeight: 500 }}>{intg.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{intg.desc}</div>
                    </div>
                  </div>
                  {intg.connected
                    ? <span className="badge badge-green">Connected</span>
                    : <button className="btn btn-sm btn-primary" onClick={() => toast.success(`${intg.name} connected!`)}>Connect</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'billing' && (
          <div className="card">
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}><h3 style={{ fontSize: 16 }}>Billing & Plan</h3></div>
            <div style={{ padding: '22px 24px' }}>
              <div style={{ background: 'var(--teal-light)', border: '1px solid var(--teal-mid)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--teal)', marginBottom: 4 }}>Current Plan</div>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, color: 'var(--teal)' }}>Enterprise</div>
                <div style={{ fontSize: 13, color: 'var(--teal)' }}>Unlimited consultations · HIPAA + GDPR · Priority support</div>
              </div>
              {[
                { k: 'Next billing date', v: 'May 28, 2026' },
                { k: 'Monthly amount', v: '$599/month' },
                { k: 'Users included', v: '25 practitioners' },
                { k: 'Storage', v: '500 GB' },
              ].map(({ k, v }) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13.5 }}>
                  <span style={{ color: 'var(--text-3)' }}>{k}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
