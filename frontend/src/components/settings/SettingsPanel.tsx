import { useState } from 'react';
import { User, Lock, Bell, Shield } from 'lucide-react';
import { ProfileSettings, SecuritySettings, OrganizationSettings } from './index';

type Tab = 'profile' | 'security' | 'notifications' | 'organization';

export default function SettingsPanel() {
  const [tab, setTab] = useState<Tab>('profile');

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'organization', label: 'Organization', icon: Shield },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
      {/* Sidebar Navigation */}
      <div className="bg-white rounded-2xl border border-gray-100 p-2 h-fit space-y-1 shadow-sm">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
              tab === key 
                ? 'bg-[#0d6e6e] text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm min-h-[500px]">
        {tab === 'profile' && <ProfileSettings />}
        {tab === 'security' && <SecuritySettings />}
        {tab === 'organization' && <OrganizationSettings />}
        {tab === 'notifications' && (
          <div className="text-center py-20">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Notification Preferences</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              We're building a comprehensive notification system. Check back soon for email and SMS alerts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
