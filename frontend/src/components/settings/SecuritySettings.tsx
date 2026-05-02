import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import toast from 'react-hot-toast';

const SecuritySettings: React.FC = () => {
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => authApi.updateSecurity(data),
    onSuccess: () => {
      toast.success('Password updated successfully');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to update password'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    mutation.mutate(pwForm);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Security Settings</h3>
        <p className="text-sm text-gray-500">Manage your password and account security.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
          <input
            type="password"
            required
            value={pwForm.current_password}
            onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            type="password"
            required
            value={pwForm.new_password}
            onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            required
            value={pwForm.confirm_password}
            onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
          />
        </div>
        
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-[#0d6e6e] hover:bg-[#0a5060] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default SecuritySettings;
