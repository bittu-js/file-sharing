import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Settings, HardDrive, Moon, Sun, Monitor, User, Shield, Check, Command } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatBytes } from '../utils/formatters';
import api from '../services/api';

const SettingsPage = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { refreshTrigger, triggerRefresh } = useOutletContext();

  const [stats, setStats] = useState(null);
  const [selectedQuota, setSelectedQuota] = useState('524288000'); // 500 MB
  const [savingQuota, setSavingQuota] = useState(false);
  const [quotaSaved, setQuotaSaved] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats/dashboard');
        if (res.data.success) {
          setStats(res.data.stats);
          setSelectedQuota(String(res.data.stats.storageQuota || 524288000));
        }
      } catch (_) {}
    };
    fetchStats();
  }, [refreshTrigger]);

  const quotaOptions = [
    { label: '250 MB', bytes: 250 * 1024 * 1024 },
    { label: '500 MB (Default)', bytes: 500 * 1024 * 1024 },
    { label: '1 GB', bytes: 1024 * 1024 * 1024 },
    { label: '2 GB', bytes: 2 * 1024 * 1024 * 1024 },
    { label: '5 GB', bytes: 5 * 1024 * 1024 * 1024 }
  ];

  const handleSaveQuota = async () => {
    setSavingQuota(true);
    setQuotaSaved(false);
    try {
      const res = await api.patch('/stats/quota', {
        quotaBytes: Number(selectedQuota)
      });
      if (res.data.success) {
        setQuotaSaved(true);
        triggerRefresh();
        setTimeout(() => setQuotaSaved(false), 2500);
      }
    } catch (err) {
      alert('Failed to update storage quota.');
    } finally {
      setSavingQuota(false);
    }
  };

  const shortcuts = [
    { key: 'Click row', desc: 'Open File Details Inspector panel' },
    { key: 'Double Click', desc: 'Quick preview image or PDF' },
    { key: 'Esc', desc: 'Close open panel or modal' },
    { key: 'Ctrl + K or /', desc: 'Focus global search' },
    { key: 'Checkboxes', desc: 'Multi-select for bulk ZIP download & moving' }
  ];

  return (
    <div className="flex-1 flex flex-col bg-canvas-light dark:bg-canvas-dark min-h-screen">
      <Header
        title="Settings & Preferences"
        subtitle="Configure storage quotas, visual themes, and workspace parameters"
      />

      <div className="p-6 space-y-6 max-w-4xl w-full mx-auto text-xs">
        {/* 1. APPEARANCE THEME */}
        <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm p-5 space-y-4 shadow-2xs">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-light dark:text-primary-dark font-mono">
              INTERFACE THEME
            </h3>
            <p className="text-secondary-light dark:text-secondary-dark mt-0.5">
              Choose your preferred visual style across all workspace panels.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark (Editorial)', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor }
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-sm border transition-all ${
                    theme === t.id
                      ? 'border-accent bg-accent/5 dark:bg-accent/15 text-primary-light dark:text-primary-dark font-medium shadow-2xs'
                      : 'border-line-light dark:border-line-dark hover:bg-subtle-light dark:hover:bg-subtle-dark text-secondary-light dark:text-secondary-dark'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1.5" />
                  <span className="text-xs">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. STORAGE QUOTA MANAGEMENT */}
        <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm p-5 space-y-4 shadow-2xs">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-light dark:text-primary-dark font-mono">
              STORAGE QUOTA & ALLOCATION
            </h3>
            <p className="text-secondary-light dark:text-secondary-dark mt-0.5">
              Set user storage limits to prevent disk exhaustion. Uploads exceeding quota will be rejected.
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {quotaOptions.map((opt) => (
                <button
                  key={opt.bytes}
                  type="button"
                  onClick={() => setSelectedQuota(String(opt.bytes))}
                  className={`p-2.5 rounded-sm border text-center transition-all ${
                    selectedQuota === String(opt.bytes)
                      ? 'border-accent bg-accent/10 text-accent font-semibold'
                      : 'border-line-light dark:border-line-dark text-secondary-light dark:text-secondary-dark hover:bg-subtle-light dark:hover:bg-subtle-dark'
                  }`}
                >
                  <span className="font-mono text-xs">{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSaveQuota}
                disabled={savingQuota}
                className="px-4 py-1.5 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 rounded-xs transition-colors flex items-center gap-1.5"
              >
                {quotaSaved && <Check className="w-3.5 h-3.5" />}
                <span>{quotaSaved ? 'Saved' : savingQuota ? 'Updating...' : 'Update Storage Quota'}</span>
              </button>
              {stats && (
                <span className="text-[11px] font-mono text-tertiary-light dark:text-tertiary-dark">
                  Currently using {formatBytes(stats.totalStorageBytes)} ({stats.quotaPercentage}%)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. SHORTCUTS & PRODUCTIVITY */}
        <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm p-5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-light dark:text-primary-dark font-mono">
              KEYBOARD SHORTCUTS & INTERACTIONS
            </h3>
          </div>

          <div className="divide-y divide-line-light dark:divide-line-dark border-t border-line-light dark:border-line-dark pt-1">
            {shortcuts.map((sc, i) => (
              <div key={i} className="py-2 flex items-center justify-between">
                <span className="text-secondary-light dark:text-secondary-dark">{sc.desc}</span>
                <kbd className="px-2 py-0.5 rounded-xs bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark font-mono text-[11px] text-primary-light dark:text-primary-dark">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* 4. ACCOUNT INFORMATION */}
        <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm p-5 space-y-3 shadow-2xs">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-light dark:text-primary-dark font-mono">
            ACCOUNT PROFILE
          </h3>
          <div className="space-y-1.5 font-mono text-[11px]">
            <p className="text-secondary-light dark:text-secondary-dark">
              Name: <strong className="text-primary-light dark:text-primary-dark">{user?.name}</strong>
            </p>
            <p className="text-secondary-light dark:text-secondary-dark">
              Email: <strong className="text-primary-light dark:text-primary-dark">{user?.email}</strong>
            </p>
            <p className="text-secondary-light dark:text-secondary-dark">
              User ID: <span className="text-tertiary-light dark:text-tertiary-dark">{user?.id || user?._id}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
