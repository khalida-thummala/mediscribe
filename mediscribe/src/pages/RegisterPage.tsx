import { useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div>
        <p>Register page — redirecting to Login</p>
        <button onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    </div>
  )
}
