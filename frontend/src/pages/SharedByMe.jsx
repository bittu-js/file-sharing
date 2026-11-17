import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Share2, Copy, Check, Lock, Trash2, ExternalLink } from 'lucide-react';
import Header from '../components/Header';
import { formatBytes, formatDate } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';
import api from '../services/api';

const SharedByMe = () => {
  const { onPreview, refreshTrigger, triggerRefresh } = useOutletContext();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shares');
      if (res.data.success) {
        setShares(res.data.shares || []);
      }
    } catch (err) {
      console.error('Failed to load shared files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, [refreshTrigger]);

  const handleCopy = (share) => {
    const origin = window.location.origin;
    const url = `${origin}/share/${share.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (shareId) => {
    if (!confirm('Are you sure you want to revoke and delete this sharing link?')) {
      return;
    }
    try {
      await api.delete(`/shares/${shareId}`);
      fetchShares();
      triggerRefresh();
    } catch (err) {
      alert('Failed to revoke link.');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-canvas-light dark:bg-canvas-dark min-h-screen">
      <Header
        title="Shared By Me"
        subtitle="Active public links, password configurations, and download analytics"
      />

      <div className="p-6 space-y-4 max-w-7xl w-full mx-auto">
        {loading ? (
          <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm p-12 text-center text-xs text-secondary-light dark:text-secondary-dark">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="font-mono">Loading shared links...</span>
          </div>
        ) : shares.length === 0 ? (
          <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm p-12 text-center">
            <div className="w-10 h-10 rounded-sm bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark mx-auto flex items-center justify-center text-tertiary-light dark:text-tertiary-dark mb-3">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-light dark:text-primary-dark font-mono">
              No active shared links
            </h3>
            <p className="text-[11px] text-tertiary-light dark:text-tertiary-dark mt-1 max-w-xs mx-auto">
              Select any file and click Share to create secure public or password-protected links.
            </p>
          </div>
        ) : (
          <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line-light dark:border-line-dark bg-subtle-light/60 dark:bg-subtle-dark/60 text-[10px] font-semibold text-tertiary-light dark:text-tertiary-dark uppercase tracking-wider font-mono">
                    <th className="py-2.5 px-3">Shared File</th>
                    <th className="py-2.5 px-3 w-32">Security</th>
                    <th className="py-2.5 px-3 w-40">Expiration</th>
                    <th className="py-2.5 px-3 w-28 text-center font-mono">Downloads</th>
                    <th className="py-2.5 px-3 text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-light dark:divide-line-dark text-xs">
                  {shares.map((share) => {
                    const isCopied = copiedId === share.id;
                    const file = share.file;
                    if (!file) return null;

                    return (
                      <tr key={share.id} className="hover:bg-subtle-light/70 dark:hover:bg-subtle-dark/70 transition-colors">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            {getFileIcon(file.fileType, file.originalName, 'w-4 h-4 flex-shrink-0')}
                            <div className="overflow-hidden">
                              <span
                                onClick={() => onPreview && onPreview(file)}
                                className="font-medium text-primary-light dark:text-primary-dark block truncate hover:text-accent cursor-pointer transition-colors"
                              >
                                {file.originalName}
                              </span>
                              <span className="text-[10px] text-tertiary-light dark:text-tertiary-dark font-mono block">
                                {formatBytes(file.fileSize)} • Created {formatDate(share.createdAt)}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2 px-3 whitespace-nowrap">
                          {share.isPasswordProtected ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs text-[10px] font-mono font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Password</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-xs text-[10px] font-mono uppercase bg-subtle-light dark:bg-subtle-dark text-tertiary-light dark:text-tertiary-dark border border-line-light dark:border-line-dark">
                              Public
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-3 whitespace-nowrap text-secondary-light dark:text-secondary-dark font-mono text-[11px]">
                          {share.isExpired ? (
                            <span className="text-rose-500 font-semibold">Expired</span>
                          ) : share.expiresAt ? (
                            formatDate(share.expiresAt)
                          ) : (
                            'Never'
                          )}
                        </td>

                        <td className="py-2 px-3 whitespace-nowrap text-center font-mono font-bold text-primary-light dark:text-primary-dark">
                          {share.downloadCount}
                        </td>

                        <td className="py-2 px-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCopy(share)}
                              className={`flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded-xs border transition-colors ${
                                isCopied
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-panel-light dark:bg-panel-dark text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark border-line-light dark:border-line-dark hover:bg-subtle-light dark:hover:bg-subtle-dark'
                              }`}
                            >
                              {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                            </button>
                            <button
                              onClick={() => handleRevoke(share.id)}
                              title="Revoke Link"
                              className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-rose-500 rounded-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedByMe;
