import React, { useState, useEffect } from 'react';
import { getAdminUsage, getAdminLogs, getAdminPrompts, updateAdminPrompt } from '../services/api';
import { Activity, Database, MessageSquareCode, Save } from 'lucide-react';
import { showToast } from '../components/layout/Toast';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('usage'); // usage, logs, prompts
  const [usage, setUsage] = useState(null);
  const [logs, setLogs] = useState([]);
  const [prompts, setPrompts] = useState({});
  const [editingPrompt, setEditingPrompt] = useState(null);

  useEffect(() => {
    if (activeTab === 'usage') {
      getAdminUsage().then(data => setUsage(data)).catch(() => showToast('Failed to load usage', 'error'));
    } else if (activeTab === 'logs') {
      getAdminLogs({ limit: 50 }).then(data => setLogs(data.logs || [])).catch(() => showToast('Failed to load logs', 'error'));
    } else if (activeTab === 'prompts') {
      getAdminPrompts().then(data => {
        const extracted = {};
        for (const [key, val] of Object.entries(data.prompts || {})) {
          extracted[key] = typeof val === 'object' ? (val.text || '') : val;
        }
        setPrompts(extracted);
      }).catch(() => showToast('Failed to load prompts', 'error'));
    }
  }, [activeTab]);

  const handleSavePrompt = async (feature) => {
    try {
      await updateAdminPrompt(feature, prompts[feature]);
      showToast(`Prompt for ${feature} updated successfully`);
      setEditingPrompt(null);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold font-serif mb-8">Admin Dashboard</h1>

      <div className="flex gap-4 mb-8 border-b border-[var(--color-border)]">
        <button onClick={() => setActiveTab('usage')} className={`pb-4 px-2 font-medium font-mono text-sm uppercase tracking-wider flex items-center gap-2 ${activeTab === 'usage' ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
          <Activity className="w-4 h-4" /> Quota & Usage
        </button>
        <button onClick={() => setActiveTab('logs')} className={`pb-4 px-2 font-medium font-mono text-sm uppercase tracking-wider flex items-center gap-2 ${activeTab === 'logs' ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
          <Database className="w-4 h-4" /> Request Logs
        </button>
        <button onClick={() => setActiveTab('prompts')} className={`pb-4 px-2 font-medium font-mono text-sm uppercase tracking-wider flex items-center gap-2 ${activeTab === 'prompts' ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
          <MessageSquareCode className="w-4 h-4" /> System Prompts
        </button>
      </div>

      {activeTab === 'usage' && usage && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass p-6 rounded-xl border border-[var(--color-border)]">
            <h3 className="text-lg font-bold mb-4 text-[var(--color-text-secondary)]">NewsAPI Usage (Today)</h3>
            <div className="text-4xl font-black gradient-text mb-2">{usage.newsApi?.calls || 0}</div>
            <p className="text-[var(--color-text-muted)] text-sm">Limit: {usage.newsApi?.limit} calls/day</p>
            <div className="w-full bg-[var(--color-bg-secondary)] h-2 rounded-full mt-4">
              <div className="bg-[var(--color-accent)] h-2 rounded-full transition-all" style={{ width: `${Math.min(((usage.newsApi?.calls || 0)/usage.newsApi?.limit)*100, 100)}%` }}></div>
            </div>
          </div>
          <div className="glass p-6 rounded-xl border border-[var(--color-border)]">
            <h3 className="text-lg font-bold mb-4 text-[var(--color-text-secondary)]">Groq LLaMA Usage (Today)</h3>
            <div className="text-4xl font-black gradient-text mb-2">{usage.groq?.tokensUsed || 0}</div>
            <p className="text-[var(--color-text-muted)] text-sm">Limit: {usage.groq?.limit} tokens/day ({usage.groq?.callCount || 0} requests)</p>
            <div className="w-full bg-[var(--color-bg-secondary)] h-2 rounded-full mt-4">
              <div className="bg-[var(--color-accent)] h-2 rounded-full transition-all" style={{ width: `${Math.min(((usage.groq?.tokensUsed || 0)/usage.groq?.limit)*100, 100)}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="glass rounded-xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]">
              <tr>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">User ID</th>
                <th className="px-6 py-3">Route</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-card-hover)] transition-colors">
                  <td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-muted)]">{log.userId || 'anonymous'}</td>
                  <td className="px-6 py-4 font-mono text-[var(--color-text-secondary)]">{log.route}</td>
                  <td className="px-6 py-4">
                    {log.success ? 
                      <span className="text-[var(--color-success)] bg-[var(--color-success)]/10 px-2 py-1 rounded">Success</span> : 
                      <span className="text-[var(--color-error)] bg-[var(--color-error)]/10 px-2 py-1 rounded" title={log.errorType}>Error</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'prompts' && (
        <div className="space-y-6">
          {Object.entries(prompts).map(([feature, promptText]) => (
            <div key={feature} className="glass p-6 rounded-xl border border-[var(--color-border)]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold font-mono text-[var(--color-accent)]">{feature}</h3>
                {editingPrompt === feature ? (
                  <div className="flex gap-2">
                    <button onClick={() => setEditingPrompt(null)} className="px-3 py-1.5 text-sm hover:bg-[var(--color-bg-secondary)] rounded transition-colors">Cancel</button>
                    <button onClick={() => handleSavePrompt(feature)} className="px-3 py-1.5 text-sm bg-[var(--color-success)] text-[#0e0b16] rounded font-semibold flex items-center gap-1 hover:brightness-110">
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingPrompt(feature)} className="px-3 py-1.5 text-sm border border-[var(--color-border)] hover:border-[var(--color-accent)] rounded transition-colors">
                    Edit
                  </button>
                )}
              </div>
              
              {editingPrompt === feature ? (
                <textarea 
                  value={promptText}
                  onChange={(e) => setPrompts({...prompts, [feature]: e.target.value})}
                  className="w-full h-40 bg-[var(--color-bg-secondary)] border border-[var(--color-accent-dim)] rounded-lg p-4 font-mono text-sm focus:outline-none transition-colors"
                />
              ) : (
                <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 font-mono text-sm whitespace-pre-wrap text-[var(--color-text-secondary)] border border-transparent">
                  {promptText}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
