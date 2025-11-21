import React, { useState } from 'react';
import { KeyStats, ApiKey, KeyType } from '../types';
import { Activity, Clock, ShieldAlert, CheckCircle2, AlertOctagon, AlertTriangle, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  stats: KeyStats;
  keys: ApiKey[];
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, keys }) => {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Filter keys expiring within 72 hours (3 days)
  const expiringKeys = keys.filter(k => {
    if (k.status !== 'active' || k.type !== KeyType.TEMPORARY || !k.expiresAt) return false;
    const expiry = new Date(k.expiresAt).getTime();
    const now = Date.now();
    const diffHours = (expiry - now) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours < 72;
  }).filter(k => !dismissedAlerts.has(k.id));

  // Prepare chart data: Usage by Key
  const usageData = keys
    .filter(k => k.status === 'active')
    .map(k => ({
      name: k.name.length > 10 ? k.name.substring(0, 10) + '...' : k.name,
      usage: k.usageCount
    }))
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 5);

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex flex-col justify-between hover:border-slate-600 transition-all shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        {subtext && <span className="text-xs font-mono text-slate-500 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">{subtext}</span>}
      </div>
      <div>
        <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      </div>
    </div>
  );

  const handleDismiss = (id: string) => {
    const next = new Set(dismissedAlerts);
    next.add(id);
    setDismissedAlerts(next);
  };

  return (
    <div className="space-y-6">
      {/* Notification Banner for Expiring Keys */}
      {expiringKeys.length > 0 && (
        <div className="animate-in slide-in-from-top-2 duration-300 space-y-2">
          {expiringKeys.map(key => {
             const hoursLeft = Math.max(0, Math.ceil((new Date(key.expiresAt!).getTime() - Date.now()) / (1000 * 60 * 60)));
             const timeText = hoursLeft < 24 ? `${hoursLeft} hours` : `${Math.ceil(hoursLeft/24)} days`;
             
             return (
              <div key={key.id} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start justify-between">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-200">Expiration Warning</h4>
                    <p className="text-sm text-amber-200/70 mt-1">
                      The key <span className="font-mono text-amber-100 bg-amber-500/20 px-1 rounded">{key.name}</span> will expire in {timeText}.
                      Please rotate this key or create a new one to prevent service interruption.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDismiss(key.id)}
                  className="text-amber-400/60 hover:text-amber-400 transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
             );
          })}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Keys" 
          value={stats.active} 
          icon={CheckCircle2} 
          color="text-emerald-400" 
          subtext={`${Math.round((stats.active / Math.max(stats.total, 1)) * 100)}% healthy`}
        />
        <StatCard 
          title="Total Usage (24h)" 
          value={keys.reduce((acc, k) => acc + k.usageCount, 0).toLocaleString()} 
          icon={Activity} 
          color="text-indigo-400" 
        />
        <StatCard 
          title="Expiring Soon" 
          value={expiringKeys.length} 
          icon={Clock} 
          color="text-amber-400" 
          subtext="< 72 Hours"
        />
        <StatCard 
          title="Revoked / Expired" 
          value={stats.revoked + stats.expired} 
          icon={ShieldAlert} 
          color="text-rose-400" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Chart */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Top Active Keys by Usage
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{fill: '#94a3b8'}}
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{fill: '#94a3b8'}}
                />
                <Tooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px' }}
                />
                <Bar dataKey="usage" radius={[4, 4, 0, 0]}>
                  {usageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Alerts */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-slate-400" />
            Recent Events
          </h3>
          <div className="space-y-4 relative">
            {/* Connecting Line */}
            <div className="absolute left-[19px] top-3 bottom-3 w-[1px] bg-slate-800 z-0"></div>
            
            {keys.slice(0, 5).map(key => (
              <div key={key.id} className="relative z-10 flex items-start gap-4 p-3 bg-slate-900/40 rounded-lg border border-slate-800/50 hover:bg-slate-900/80 transition-colors">
                <div className={`w-2.5 h-2.5 mt-2 rounded-full ring-4 ring-slate-900 ${
                  key.status === 'active' ? 'bg-emerald-500' : 
                  key.status === 'revoked' ? 'bg-rose-500' : 'bg-slate-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {key.status === 'active' ? 'Key generated' : `Key ${key.status}`}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-1">{key.name}</p>
                  <p className="text-xs text-slate-600 mt-1">{new Date(key.createdAt).toLocaleDateString()} at {new Date(key.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};