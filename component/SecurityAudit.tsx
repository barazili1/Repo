import React, { useEffect, useState } from 'react';
import { ApiKey } from '../types';
import { analyzeSecurity } from '../services/geminiService';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, RefreshCcw, BrainCircuit } from 'lucide-react';

interface SecurityAuditProps {
  keys: ApiKey[];
}

export const SecurityAudit: React.FC<SecurityAuditProps> = ({ keys }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [auditData, setAuditData] = useState<{
    score: number;
    summary: string;
    recommendations: string[];
  } | null>(null);

  const runAudit = async () => {
    setIsLoading(true);
    try {
      const result = await analyzeSecurity(keys);
      setAuditData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-indigo-400" />
          AI Security Analysis
        </h2>
        <button 
          onClick={runAudit} 
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Re-Analyze
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-slate-800/30 border border-slate-800 rounded-2xl border-dashed animate-pulse">
          <BrainCircuit className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium">Gemini is analyzing your key configurations...</p>
        </div>
      ) : auditData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Score Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className={`absolute inset-0 opacity-5 ${getScoreBg(auditData.score)}`} />
            <div className="relative z-10">
              <div className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Security Score</div>
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(auditData.score)}`}>
                {auditData.score}
              </div>
              <div className="text-slate-500 text-sm">/ 100</div>
              
              <div className="mt-6 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-700/50 inline-flex items-center gap-2">
                {auditData.score >= 90 ? <ShieldCheck className="w-4 h-4 text-emerald-400"/> : <ShieldAlert className="w-4 h-4 text-amber-400"/>}
                <span className="text-sm text-slate-300">
                  {auditData.score >= 90 ? 'Excellent Posture' : auditData.score >= 70 ? 'Needs Attention' : 'Critical Risks'}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-medium text-white mb-4">Executive Summary</h3>
              <p className="text-slate-300 leading-relaxed">{auditData.summary}</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-indigo-400" />
                Recommendations
              </h3>
              <ul className="space-y-3">
                {auditData.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3 group">
                    <div className="mt-1">
                      <CheckCircle className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <span className="text-slate-300 group-hover:text-white transition-colors">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-slate-500">Failed to load audit data.</div>
      )}
    </div>
  );
};
