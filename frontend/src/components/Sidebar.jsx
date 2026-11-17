import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderClosed,
  Share2,
  Users,
  Clock,
  Star,
  Inbox,
  Trash2,
  Settings,
  LogOut,
  HardDrive,
  Upload,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatBytes } from '../utils/formatters';
import api from '../services/api';

const Sidebar = ({ onOpenUpload }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('vaultdrop_sidebar_collapsed') === 'true';
  });

  const [storageData, setStorageData] = useState({
    usedBytes: 0,
    quotaBytes: 500 * 1024 * 1024,
    percentage: 0
  });

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('vaultdrop_sidebar_collapsed', String(next));
      return next;
    });
  };

  const fetchStorage = async () => {
    try {
      const res = await api.get('/stats/dashboard');
      if (res.data.success && res.data.stats) {
        setStorageData({
          usedBytes: res.data.stats.totalStorageBytes || 0,
          quotaBytes: res.data.stats.storageQuota || 500 * 1024 * 1024,
          percentage: res.data.stats.quotaPercentage || 0
        });
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchStorage();
    const interval = setInterval(fetchStorage, 20000);
    return () => clearInterval(interval);
  }, []);

  const navSections = [
    {
      title: 'WORKSPACE',
      items: [
        { label: 'Overview', path: '/', icon: LayoutDashboard },
        { label: 'My Files', path: '/files', icon: FolderClosed },
        { label: 'Recent', path: '/recent', icon: Clock },
        { label: 'Favorites', path: '/favorites', icon: Star }
      ]
    },
    {
      title: 'COLLABORATION',
      items: [
        { label: 'Shared with me', path: '/shared-with-me', icon: Users },
        { label: 'Shared by me', path: '/shared-by-me', icon: Share2 },
        { label: 'File Requests', path: '/file-requests', icon: Inbox }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Trash', path: '/trash', icon: Trash2 },
        { label: 'Settings', path: '/settings', icon: Settings }
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`border-r border-line-light dark:border-line-dark bg-panel-light dark:bg-panel-dark flex flex-col justify-between h-screen sticky top-0 transition-all duration-200 select-none z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col">
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-line-light dark:border-line-dark">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* <div className="w-7 h-7 rounded-sm bg-primary-light dark:bg-primary-dark text-white dark:text-black flex items-center justify-center font-bold text-xs flex-shrink-0 tracking-tight">
              VD
            </div> */}
            {!collapsed && (
              <div className="leading-tight overflow-hidden">
                <span className="font-semibold text-xs tracking-tight text-primary-light dark:text-primary-dark block truncate">
                  VaultDrop
                </span>
                <span className="text-[10px] text-tertiary-light dark:text-tertiary-dark uppercase tracking-wider block font-mono">
                  PROD v2.4
                </span>
              </div>
            )}
          </div>
          <button
            onClick={toggleCollapse}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-1 rounded-sm text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark hover:bg-subtle-light dark:hover:bg-subtle-dark transition-colors"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Quick Upload Action */}
        <div className="p-2.5">
          <button
            onClick={onOpenUpload}
            title="Upload Files"
            className={`w-full flex items-center justify-center gap-2 bg-primary-light dark:bg-primary-dark text-white dark:text-black text-xs font-medium py-2 rounded-sm transition-colors hover:opacity-90 ${
              collapsed ? 'px-0' : 'px-3'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            {!collapsed && <span>Upload File</span>}
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="px-2 py-1 space-y-4 overflow-y-auto max-h-[calc(100vh-250px)]">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-0.5">
              {!collapsed && (
                <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-tertiary-light dark:text-tertiary-dark uppercase font-mono">
                  {sec.title}
                </div>
              )}
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-sm transition-colors ${
                        isActive
                          ? 'bg-subtle-light dark:bg-subtle-dark text-primary-light dark:text-primary-dark font-medium border-l-2 border-accent'
                          : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark hover:bg-subtle-light/60 dark:hover:bg-subtle-dark/60'
                      } ${collapsed ? 'justify-center px-0' : ''}`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Area: Storage + Theme + User */}
      <div className="p-2.5 border-t border-line-light dark:border-line-dark space-y-2.5 bg-canvas-light/50 dark:bg-canvas-dark/50">
        {/* Storage Bar Indicator */}
        {!collapsed && (
          <div className="p-2.5 rounded-sm border border-line-light dark:border-line-dark bg-panel-light dark:bg-panel-dark text-[11px]">
            <div className="flex items-center justify-between text-secondary-light dark:text-secondary-dark mb-1.5">
              <span className="flex items-center gap-1.5 font-medium">
                <HardDrive className="w-3 h-3 text-tertiary-light dark:text-tertiary-dark" />
                <span>Storage</span>
              </span>
              <span className="font-mono text-[10px]">
                {formatBytes(storageData.usedBytes)} / {formatBytes(storageData.quotaBytes)}
              </span>
            </div>
            <div className="w-full bg-subtle-light dark:bg-subtle-dark h-1.5 rounded-xs overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  storageData.percentage > 90
                    ? 'bg-rose-500'
                    : storageData.percentage > 70
                    ? 'bg-amber-500'
                    : 'bg-primary-light dark:bg-primary-dark'
                }`}
                style={{ width: `${Math.max(storageData.percentage, 2)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-tertiary-light dark:text-tertiary-dark">
              <span>{storageData.percentage}% used</span>
              <NavLink to="/settings" className="hover:text-primary-light dark:hover:text-primary-dark underline">
                Quota
              </NavLink>
            </div>
          </div>
        )}

        {/* User Card & Theme Switcher */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-sm bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark text-primary-light dark:text-primary-dark flex items-center justify-center font-medium text-[11px] flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            {!collapsed && (
              <div className="overflow-hidden leading-tight">
                <p className="text-xs font-medium text-primary-light dark:text-primary-dark truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-tertiary-light dark:text-tertiary-dark truncate font-mono">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-sm transition-colors"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-rose-500 rounded-sm transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
