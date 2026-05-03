import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const ProfileSettings: React.FC = () => {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const qc = useQueryClient();

  const [formData, setFormData] = useState({
    full_name: user?.full_name ?? '',
    phone: user?.phone ?? '',
    timezone: (user as any)?.timezone ?? 'UTC',
    language_preference: (user as any)?.language_preference ?? 'en',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => authApi.updateProfile(data),
    onSuccess: async () => {
      toast.success('Profile updated successfully');
      const updated = await authApi.getProfile();
      setAuth(updated, accessToken!, refreshToken!);
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.phone && formData.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    
    mutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Profile Information</h3>
        <p className="text-sm text-gray-500">Update your personal details and preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            maxLength={10}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
              setFormData({ ...formData, phone: val });
            }}
            placeholder="9876543210"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
          />
          <p className="text-[10px] text-gray-400 mt-1">Exactly 10 digits required</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email (Read-only)</label>
          <input
            value={user?.email ?? ''}
            disabled
            className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">License No. (Read-only)</label>
          <input
            value={(user as any)?.license_number ?? ''}
            disabled
            className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
          >
            <option value="UTC">UTC</option>
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <select
            value={formData.language_preference}
            onChange={(e) => setFormData({ ...formData, language_preference: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d6e6e] outline-none"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>
        
        <div className="md:col-span-2 flex justify-between items-center pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => { useAuthStore.getState().logout(); window.location.href = '/login'; }}
            className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-2"
          >
            Sign Out of Account
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-[#0d6e6e] hover:bg-[#0a5060] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
