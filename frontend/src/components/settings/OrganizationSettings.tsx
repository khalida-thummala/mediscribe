import React from 'react';
import { useAuthStore } from '@/store/authStore';

const OrganizationSettings: React.FC = () => {
  const { user } = useAuthStore();

  const details = [
    { label: 'Organization ID', value: (user as any)?.organization_id },
    { label: 'Role', value: user?.role },
    { label: 'Account Status', value: user?.status },
    { label: 'Organization Name', value: (user as any)?.organization_name || 'N/A' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Organization Information</h3>
        <p className="text-sm text-gray-500">Details about your healthcare facility and membership.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {details.map((item) => (
          <div key={item.label} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{item.label}</div>
            <div className="text-sm font-mono text-gray-800 break-all">{item.value || '—'}</div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <h4 className="text-sm font-semibold text-blue-900 mb-1">Subscription Plan</h4>
        <p className="text-xs text-blue-700 mb-3">You are currently on the Professional Plan.</p>
        <button className="text-xs font-bold text-blue-600 hover:underline">View Billing Details →</button>
      </div>
    </div>
  );
};

export default OrganizationSettings;
