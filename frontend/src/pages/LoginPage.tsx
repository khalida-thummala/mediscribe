import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout, LoginForm, RegisterForm, OTPVerification } from '@/components/auth';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register' | 'verify'>('login');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleRegisterSuccess = (_email: string, userId: string) => {
    setPendingUserId(userId);
    setTab('login');
  };

  return (
    <AuthLayout 
      title="MediScribe" 
      subtitle="Production-Grade Healthcare Documentation Platform"
    >
      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-8">
        {(['login', 'register'] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setPendingUserId(null);
            }}
            className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
              tab === t || (tab === 'verify' && t === 'register')
                ? 'border-[#0d6e6e] text-[#0d6e6e]' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      {tab === 'login' && <LoginForm />}
      
      {tab === 'register' && (
        <RegisterForm onSuccess={handleRegisterSuccess} />
      )}

      {tab === 'verify' && pendingUserId && (
        <OTPVerification 
          userId={pendingUserId} 
          onSuccess={() => setTab('login')} 
          onBack={() => setTab('register')}
        />
      )}

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
          Trusted by 500+ Medical Professionals
        </p>
      </div>
    </AuthLayout>
  );
}
