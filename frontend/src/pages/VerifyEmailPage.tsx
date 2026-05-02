import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import toast from 'react-hot-toast';
import { ShieldCheck, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      toast.error('No verification token found');
      return;
    }

    const verify = async () => {
      try {
        await authApi.verifyEmail(token);
        setStatus('success');
        toast.success('Email verified successfully!');
        // Auto redirect after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
      } catch (err: any) {
        setStatus('error');
        toast.error(err.response?.data?.detail || 'Verification failed');
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#0d6e6e]/10 rounded-full flex items-center justify-center text-[#0d6e6e]">
            <ShieldCheck size={32} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Verification</h1>
        <p className="text-gray-600 mb-8">
          We are verifying your clinical credentials and email address.
        </p>

        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin text-[#0d6e6e] mb-4" size={40} />
            <p className="text-sm text-gray-500 font-medium">Processing your request...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle2 className="text-green-500 mb-4" size={48} />
            <h2 className="text-lg font-semibold text-green-700">Verified!</h2>
            <p className="text-sm text-gray-500 mt-2">
              Your account is now active. Redirecting you to login...
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="mt-6 w-full bg-[#0d6e6e] text-white py-2.5 rounded-lg font-bold hover:bg-[#0a5060] transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <XCircle className="text-red-500 mb-4" size={48} />
            <h2 className="text-lg font-semibold text-red-700">Verification Link Invalid</h2>
            <p className="text-sm text-gray-500 mt-2">
              This link may have expired or is incorrect. Please contact support if you believe this is an error.
            </p>
            <button 
              onClick={() => navigate('/register')}
              className="mt-6 w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition-colors"
            >
              Back to Registration
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
