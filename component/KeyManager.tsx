import React, { useState } from 'react';
import { ApiKey, KeyType } from '../types';
import { generateAIKey } from '../services/geminiService';
import { Copy, Trash2, Ban, Plus, Sparkles, RefreshCw, Eye, EyeOff, Clock, AlertTriangle } from 'lucide-react';

interface KeyManagerProps {
  keys: ApiKey[];
  onCreateKey: (key: ApiKey) => void;
  onRevokeKey: (id: string) => void;
  onDeleteKey: (id: string) => void;
}

type ExpiryUnit = 'hours' | 'days' | 'weeks' | 'months' | 'years';

export const KeyManager: React.FC<KeyManagerProps> = ({ keys, onCreateKey, onRevokeKey, onDeleteKey }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyConfig, setNewKeyConfig] = useState({
    name: '',
    type: KeyType.PERMANENT as KeyType,
    generationMethod: 'random' as 'random' | 'mnemonic',
    expiryValue: 7,
    expiryUnit: 'days' as ExpiryUnit
  });
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const toggleKeyVisibility = (id: string) => {
    const next = new Set(visibleKeys);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setVisibleKeys(next);
  };

  const handleCreate = async () => {
    if (!newKeyConfig.name) return;
    
    setIsGenerating(true);
    const generatedKeyString = await generateAIKey(newKeyConfig.generationMethod);
    
    let expiryDate: string | undefined;

    if (newKeyConfig.type === KeyType.TEMPORARY) {
      const now = new Date();
      const val = newKeyConfig.expiryValue;
      
      // Calculate expiry based on unit
      switch (newKeyConfig.expiryUnit) {
        case 'hours':
          now.setHours(now.getHours() + val);
          break;
        case 'days':
          now.setDate(now.getDate() + val);
          break;
        case 'weeks':
          now.setDate(now.getDate() + (val * 7));
          break;
        case 'months':
          now.setMonth(now.getMonth() + val);
          break;
        case 'years':
          now.setFullYear(now.getFullYear() + val);
          break;
      }
      expiryDate = now.toISOString();
    }

    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyConfig.name,
      key: generatedKeyString,
      type: newKeyConfig.type,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: expiryDate,
      usageCount: 0
    };

    onCreateKey(newKey);
    setIsGenerating(false);
    setIsModalOpen(false);
    // Reset state
    setNewKeyConfig({ 
      name: '', 
      type: KeyType.PERMANENT, 
      generationMethod: 'random', 
      expiryValue: 7, 
      expiryUnit: 'days' 
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getExpiryStatus = (key: ApiKey) => {
    if (key.type !== KeyType.TEMPORARY || !key.expiresAt || key.status !== 'active') return null;
    
    const now = new Date();
    const expiry = new Date(key.expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffHours / 24);

    if (diffMs < 0) return <span className="text-rose-400 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Expired</span>;
    
    if (diffHours < 24) {
      return (
        <span className="text-amber-400 text-xs flex items-center gap-1 font-medium bg-amber-400/10 px-2 py-0.5 rounded">
          <Clock className="w-3 h-3" /> Expiring in {Math.ceil(diffHours)}h
        </span>
      );
    }
    
    if (diffDays <= 3) {
      return (
        <span className="text-amber-300 text-xs flex items-center gap-1">
          Expiring in {diffDays} days
        </span>
      );
    }

    return <span className="text-slate-500 text-xs">Expires in {diffDays} days</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Your API Keys</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Generate New Key
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400 font-medium">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Key String</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {keys.map(key => (
                <tr key={key.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-200">{key.name}</span>
                      <span className="text-xs text-slate-500 mt-0.5">Created {new Date(key.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-950/50 px-2 py-1 rounded border border-slate-800 min-w-[180px]">
                        {visibleKeys.has(key.id) 
                          ? key.key 
                          : key.key.substring(0, 8) + '•'.repeat(12) + key.key.substring(key.key.length - 4)}
                      </div>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => toggleKeyVisibility(key.id)} 
                          className="p-1.5 hover:text-indigo-400 transition-colors rounded hover:bg-indigo-400/10"
                          title={visibleKeys.has(key.id) ? "Hide" : "Show"}
                        >
                          {visibleKeys.has(key.id) ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                        </button>
                        <button 
                          onClick={() => copyToClipboard(key.key)} 
                          className="p-1.5 hover:text-indigo-400 transition-colors rounded hover:bg-indigo-400/10"
                          title="Copy to Clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center w-fit px-2 py-1 rounded text-xs font-medium ${
                        key.type === KeyType.PERMANENT 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {key.type}
                      </span>
                      {getExpiryStatus(key)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        key.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                        key.status === 'revoked' ? 'bg-rose-500' : 'bg-slate-500'
                      }`} />
                      <span className="text-sm capitalize text-slate-300">{key.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {key.status === 'active' && (
                        <button 
                          onClick={() => onRevokeKey(key.id)}
                          title="Revoke Key"
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => onDeleteKey(key.id)}
                        title="Delete Key"
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {keys.length === 0 && (
            <div className="text-center py-16 px-4">
               <div className="bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-slate-600" />
               </div>
              <p className="text-slate-400 font-medium mb-2">No API keys found</p>
              <p className="text-slate-500 text-sm">Generate a secure key to authenticate your applications.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Generate New API Key
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Key Name / Identifier</label>
                <input 
                  type="text" 
                  value={newKeyConfig.name}
                  onChange={(e) => setNewKeyConfig({...newKeyConfig, name: e.target.value})}
                  placeholder="e.g., Mobile App Production v2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Key Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setNewKeyConfig({...newKeyConfig, type: KeyType.PERMANENT})}
                    className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all flex flex-col items-center gap-1 ${
                      newKeyConfig.type === KeyType.PERMANENT 
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="font-semibold">Permanent Key</span>
                    <span className="text-xs opacity-80 font-normal">Never expires</span>
                  </button>
                  <button 
                    onClick={() => setNewKeyConfig({...newKeyConfig, type: KeyType.TEMPORARY})}
                    className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all flex flex-col items-center gap-1 ${
                      newKeyConfig.type === KeyType.TEMPORARY 
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="font-semibold">Temporary Key</span>
                    <span className="text-xs opacity-80 font-normal">Auto-expires</span>
                  </button>
                </div>
              </div>

              {newKeyConfig.type === KeyType.TEMPORARY && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                   <label className="block text-sm font-medium text-slate-400 mb-1.5">Valid For</label>
                   <div className="flex gap-3">
                     <input 
                      type="number" 
                      min="1" 
                      value={newKeyConfig.expiryValue}
                      onChange={(e) => setNewKeyConfig({...newKeyConfig, expiryValue: parseInt(e.target.value) || 1})}
                      className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                     />
                     <select 
                       value={newKeyConfig.expiryUnit}
                       onChange={(e) => setNewKeyConfig({...newKeyConfig, expiryUnit: e.target.value as ExpiryUnit})}
                       className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                     >
                       <option value="hours">Hours</option>
                       <option value="days">Days</option>
                       <option value="weeks">Weeks</option>
                       <option value="months">Months</option>
                       <option value="years">Years</option>
                     </select>
                   </div>
                   <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                     <Clock className="w-3 h-3" /> Key will automatically revoke after this period.
                   </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Generation Method</label>
                <select 
                  value={newKeyConfig.generationMethod}
                  onChange={(e) => setNewKeyConfig({...newKeyConfig, generationMethod: e.target.value as any})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                >
                  <option value="random">High Entropy Random (Secure)</option>
                  <option value="mnemonic">Mnemonic Phrase (Readable)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-slate-800">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                disabled={isGenerating || !newKeyConfig.name}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                {isGenerating ? 'AI Generating...' : 'Create API Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};