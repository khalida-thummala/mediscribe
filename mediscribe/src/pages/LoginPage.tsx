import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/auth'

export default function LoginPage() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form States
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({
    full_name: '', license_number: '', email: '', organization_name: '', password: '', phone: ''
  })

  const onLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const authRes = await authApi.login({
        email: loginForm.email,
        password: loginForm.password
      })
      
      // Immediately set the tokens so the next API call uses them
      useAuthStore.getState().setTokens(authRes.access_token, authRes.refresh_token)

      // Fetch user profile
      const user = await authApi.getProfile()
      
      setAuth(user, authRes.access_token, authRes.refresh_token)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to complete action')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await authApi.register({
        email: regForm.email,
        password: regForm.password,
        full_name: regForm.full_name,
        phone: regForm.phone || '000-000-0000',
        license_number: regForm.license_number,
        organization_name: regForm.organization_name
      })
      
      toast.success('Account created! Please sign in.')
      setTab('login')
      setLoginForm({ email: regForm.email, password: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to register account')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d6e6e 0%, #0a5060 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 44px', width: 420, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 30, color: 'var(--teal)', marginBottom: 6 }}>MediScribe</div>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 28 }}>Healthcare Documentation Platform</p>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          {(['login', 'register'] as const).map((t) => (
            <div key={t} onClick={() => setTab(t)} style={{ padding: '10px 18px', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', borderBottom: tab === t ? '2px solid var(--teal)' : '2px solid transparent', color: tab === t ? 'var(--teal)' : 'var(--text-3)', marginBottom: -1 }}>
              {t === 'login' ? 'Sign In' : 'Register'}
            </div>
          ))}
        </div>

        {tab === 'login' ? (
          <form onSubmit={onLoginSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Email address</label>
              <input required type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="form-control" placeholder="doctor@clinic.com" />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Password</label>
              <input required type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="form-control" placeholder="••••••••" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" defaultChecked /> Remember me</label>
              <a href="#" style={{ color: 'var(--teal)', textDecoration: 'none' }}>Forgot password?</a>
            </div>
            <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: 11, background: 'var(--teal)', border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Signing in…' : 'Sign In to MediScribe'}
            </button>
          </form>
        ) : (
          <form onSubmit={onRegisterSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
              <div><label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Full Name</label><input required value={regForm.full_name} onChange={e => setRegForm({...regForm, full_name: e.target.value})} className="form-control" placeholder="Dr. First Last" /></div>
              <div><label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>License No.</label><input required value={regForm.license_number} onChange={e => setRegForm({...regForm, license_number: e.target.value})} className="form-control" placeholder="MCI-12345" /></div>
            </div>
            <div style={{ marginBottom: 18 }}><label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Email</label><input required value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} className="form-control" placeholder="doctor@clinic.com" type="email" /></div>
            <div style={{ marginBottom: 18 }}><label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Organization</label><input required value={regForm.organization_name} onChange={e => setRegForm({...regForm, organization_name: e.target.value})} className="form-control" placeholder="City General Hospital" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ gridColumn: '1 / -1'}}><label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Password</label><input required value={regForm.password} onChange={e => setRegForm({...regForm, password: e.target.value})} className="form-control" type="password" /></div>
            </div>
            <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: 11, background: 'var(--teal)', border: 'none', borderRadius: 8, color: '#fff', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
