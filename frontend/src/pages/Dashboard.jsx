import React, { useState, useEffect } from 'react';
import { useOutletContext, NavLink } from 'react-router-dom';
import {
  Upload,
  ArrowRight,
  Clock,
  HardDrive,
  Files,
  Folder,
  Star,
  Users,
  Activity as ActivityIcon,
  CheckCircle2,
  Share2
} from 'lucide-react';
import Header from '../components/Header';
import { formatBytes, formatDate } from '../utils/formatters';
import { getFileIcon, getFolderIcon } from '../utils/fileIcons';
import api from '../services/api';

const Dashboard = () => {
  const {
    onOpenUpload,
    onOpenCreateFolder,
    onOpenCreateRequest,
    onFileClick,
    onPreview,
    onDownload,
    onShare,
    onTrashFile,
    refreshTrigger
  } = useOutletContext();

  const [stats, setStats] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/stats/dashboard');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentFiles(res.data.stats.recentFiles || []);
        setRecentActivities(res.data.stats.recentActivities || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  const categories = [
    { key: 'documents', label: 'Docs', color: 'bg-blue-500' },
    { key: 'images', label: 'Images', color: 'bg-amber-500' },
    { key: 'archives', label: 'Archives', color: 'bg-orange-500' },
    { key: 'media', label: 'Media', color: 'bg-purple-500' },
    { key: 'other', label: 'Other', color: 'bg-zinc-400' }
  ];

  const totalUsed = stats?.totalStorageBytes || 0;
  const userQuota = stats?.storageQuota || 500 * 1024 * 1024;
  const quotaPercent = stats?.quotaPercentage || 0;

  return (
    <div className="flex-1 flex flex-col bg-canvas-light dark:bg-canvas-dark min-h-screen">
      <Header
        title="Workspace Overview"
        subtitle="Storage quotas, recent audit events, and quick file management"
        onOpenUpload={onOpenUpload}
        onOpenCreateFolder={onOpenCreateFolder}
        onOpenCreateRequest={onOpenCreateRequest}
      />

      <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* TOP METRIC CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Files',
              value: stats?.totalFiles ?? 0,
              sub: `${stats?.totalFolders ?? 0} folders created`,
              icon: Files
            },
            {
              label: 'Storage Quota',
              value: formatBytes(totalUsed),
              sub: `${quotaPercent}% of ${formatBytes(userQuota)}`,
              icon: HardDrive
            },
            {
              label: 'Public Links',
              value: stats?.totalShares ?? 0,
              sub: 'Active share portals',
              icon: Share2
            },
            {
              label: 'Total Downloads',
              value: stats?.totalDownloads ?? 0,
              sub: 'Transferred via VaultDrop',
              icon: CheckCircle2
            }
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark p-4 rounded-sm flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-tertiary-light dark:text-tertiary-dark text-[10px] font-mono uppercase tracking-wider">
                  <span>{card.label}</span>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="mt-2">
                  <div className="text-xl font-bold font-mono text-primary-light dark:text-primary-dark tracking-tight">
                    {card.value}
                  </div>
                  <div className="text-[11px] text-secondary-light dark:text-secondary-dark mt-0.5">
                    {card.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* STORAGE BREAKDOWN BAR */}
        <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark p-4 rounded-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-primary-light dark:text-primary-dark uppercase text-[10px] font-mono tracking-wider">
              STORAGE USAGE & DISTRIBUTION
            </span>
            <span className="font-mono text-xs text-secondary-light dark:text-secondary-dark">
              {formatBytes(totalUsed)} / {formatBytes(userQuota)} ({quotaPercent}%)
            </span>
          </div>

          <div className="h-2 w-full bg-subtle-light dark:bg-subtle-dark rounded-xs overflow-hidden flex">
            {categories.map((c) => {
              const b = stats?.breakdown?.[c.key]?.bytes || 0;
              const p = totalUsed > 0 ? (b / totalUsed) * 100 : 0;
              if (p <= 0) return null;
              return (
                <div
                  key={c.key}
                  title={`${c.label}: ${formatBytes(b)}`}
                  className={`${c.color} h-full transition-all`}
                  style={{ width: `${Math.max(p, 1)}%` }}
                />
              );
            })}
            {totalUsed === 0 && <div className="w-full bg-subtle-light dark:bg-subtle-dark h-full" />}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-line-light dark:border-line-dark text-[10px] font-mono">
            {categories.map((c) => {
              const item = stats?.breakdown?.[c.key] || { count: 0, bytes: 0 };
              return (
                <div key={c.key} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-xs ${c.color}`} />
                  <span className="text-secondary-light dark:text-secondary-dark">{c.label}:</span>
                  <span className="font-bold text-primary-light dark:text-primary-dark">
                    {formatBytes(item.bytes)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* TWO COLUMN ROW: RECENT FILES & ACTIVITY TIMELINE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recently Uploaded Files (2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-tertiary-light dark:text-tertiary-dark font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>Recently Uploaded Files</span>
              </div>
              <NavLink
                to="/files"
                className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
              >
                <span>View all files</span>
                <ArrowRight className="w-3 h-3" />
              </NavLink>
            </div>

            <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm divide-y divide-line-light dark:divide-line-dark">
              {recentFiles.length === 0 ? (
                <div className="p-8 text-center text-xs text-tertiary-light dark:text-tertiary-dark">
                  No files uploaded yet.
                </div>
              ) : (
                recentFiles.map((file) => (
                  <div
                    key={file._id}
                    onClick={() => onFileClick && onFileClick(file)}
                    className="p-3 flex items-center justify-between hover:bg-subtle-light/70 dark:hover:bg-subtle-dark/70 transition-colors cursor-pointer group text-xs"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {getFileIcon(file.fileType, file.originalName, 'w-4 h-4 flex-shrink-0')}
                      <div className="overflow-hidden">
                        <p className="font-medium text-primary-light dark:text-primary-dark truncate group-hover:text-accent transition-colors">
                          {file.originalName}
                        </p>
                        <p className="text-[10px] text-tertiary-light dark:text-tertiary-dark font-mono">
                          {formatBytes(file.fileSize)} • {formatDate(file.uploadDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreview(file);
                        }}
                        className="px-2 py-1 text-[11px] font-medium border border-line-light dark:border-line-dark rounded-xs hover:bg-panel-light dark:hover:bg-panel-dark"
                      >
                        Preview
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload(file);
                        }}
                        className="px-2 py-1 text-[11px] font-medium border border-line-light dark:border-line-dark rounded-xs hover:bg-panel-light dark:hover:bg-panel-dark"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit Trail Timeline (1 Col) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-tertiary-light dark:text-tertiary-dark font-mono">
                <ActivityIcon className="w-3.5 h-3.5 text-accent" />
                <span>Audit Activity</span>
              </div>
            </div>

            <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm p-4 space-y-3.5">
              {recentActivities.length === 0 ? (
                <div className="py-6 text-center text-xs text-tertiary-light dark:text-tertiary-dark">
                  No activity recorded yet.
                </div>
              ) : (
                <div className="space-y-3 border-l border-line-light dark:border-line-dark pl-3 ml-1 text-xs">
                  {recentActivities.slice(0, 7).map((act) => (
                    <div key={act._id} className="relative space-y-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent absolute -left-[16px] top-1.5" />
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-primary-light dark:text-primary-dark capitalize">
                          {act.action.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-tertiary-light dark:text-tertiary-dark font-mono">
                          {formatDate(act.createdAt).split(',')[0]}
                        </span>
                      </div>
                      <p className="text-[11px] text-secondary-light dark:text-secondary-dark truncate">
                        {act.targetName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
