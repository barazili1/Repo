import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { KeyManager } from './components/KeyManager';
import { SecurityAudit } from './components/SecurityAudit';
import { Navigation } from './components/Navigation';
import { ApiKey, KeyStats, KeyType } from './types';
import { LayoutDashboard, Key, ShieldCheck } from 'lucide-react';

// Mock initial data
const INITIAL_KEYS: ApiKey[] = [
  {
    id: '1',
    name: 'Production Master',
    key: 'pk_live_9d8f7a6s5d4f3g2h1j',
    type: KeyType.PERMANENT,
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
    usageCount: 15420,
  },
  {
    id: '2',
    name: 'Staging Environment',
    key: 'tk_stage_1a2s3d4f5g6h7j8k9l',
    type: KeyType.TEMPORARY,
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(), // Expires in 5 days
    usageCount: 340,
  },
  {
    id: '4',
    name: 'Hackathon Demo Key',
    key: 'tk_hack_9x8y7z',
    type: KeyType.TEMPORARY,
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(), // Expires in 4 hours (Triggers Alert)
    usageCount: 1250,
  },
  {
    id: '3',
    name: 'Legacy Service A',
    key: 'pk_legacy_x9c8v7b6n5m4',
    type: KeyType.PERMANENT,
    status: 'revoked',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    usageCount: 89002,
  }
];

export default function App() {
  const [keys, setKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'keys' | 'audit'>('dashboard');

  // Calculate stats
  const stats: KeyStats = {
    total: keys.length,
    active: keys.filter(k => k.status === 'active').length,
    revoked: keys.filter(k => k.status === 'revoked').length,
    expired: keys.filter(k => k.status === 'expired').length,
    permanent: keys.filter(k => k.type === KeyType.PERMANENT).length,
    temporary: keys.filter(k => k.type === KeyType.TEMPORARY).length,
  };

  // Check for expired keys periodically
  useEffect(() => {
    const checkExpiry = () => {
      setKeys(currentKeys => 
        currentKeys.map(key => {
          if (key.status === 'active' && key.expiresAt && new Date(key.expiresAt) < new Date()) {
            return { ...key, status: 'expired' };
          }
          return key;
        })
      );
    };
    
    // Run immediately on mount then interval
    checkExpiry();
    const interval = setInterval(checkExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleCreateKey = (newKey: ApiKey) => {
    setKeys(prev => [newKey, ...prev]);
  };

  const handleRevokeKey = (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
  };

  const handleDeleteKey = (id: string) => {
    setKeys(prev => prev.filter(k => k.id !== id));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} keys={keys} />;
      case 'keys':
        return (
          <KeyManager 
            keys={keys} 
            onCreateKey={handleCreateKey} 
            onRevokeKey={handleRevokeKey} 
            onDeleteKey={handleDeleteKey} 
          />
        );
      case 'audit':
        return <SecurityAudit keys={keys} />;
      default:
        return <Dashboard stats={stats} keys={keys} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-indigo-500/30">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
             <Key className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">KeyMaster AI</span>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <Navigation 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            items={[
              { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
              { id: 'keys', label: 'Key Management', icon: Key },
              { id: 'audit', label: 'Security Audit', icon: ShieldCheck },
            ]}
          />
        </nav>
        <div className="p-6 border-t border-slate-800">
           <div className="text-xs text-slate-500 font-mono">v1.0.5-beta</div>
           <div className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             System Operational
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen bg-slate-900 p-4 md:p-8 relative">
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 capitalize flex items-center gap-3">
              {activeTab === 'keys' ? 'Key Management' : activeTab === 'audit' ? 'Security Audit' : 'Overview'}
            </h1>
            <p className="text-slate-400 text-lg">
              {activeTab === 'keys' 
                ? 'Generate, revoke, and monitor your API access keys.' 
                : activeTab === 'audit' 
                ? 'AI-powered analysis of your security posture.' 
                : 'Real-time metrics and status of your API keys.'}
            </p>
          </header>
          
          <div className="fade-in-up">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

/* Utility styles */
const styles = `
  .fade-in-up {
    animation: fadeInUp 0.5s ease-out;
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  /* Custom Scrollbar for main content */
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #0f172a; 
  }
  ::-webkit-scrollbar-thumb {
    background: #334155; 
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #475569; 
  }
`;

// Inject style
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);