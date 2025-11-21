import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NavItem {
  id: 'dashboard' | 'keys' | 'audit';
  label: string;
  icon: LucideIcon;
}

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: 'dashboard' | 'keys' | 'audit') => void;
  items: NavItem[];
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, items }) => {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
