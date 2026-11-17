import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Share2,
  Copy,
  Check,
  Lock,
  Trash2,
  ExternalLink,
  Clock,
  DownloadCloud,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import Header from '../components/Header';
import { formatBytes, formatDate } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';
import api from '../services/api';

const SharedFiles = () => {
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
    <div className="flex-1 flex flex-col">
      <Header
        title="Shared Links"
        subtitle="Track active public links, password rules, and download analytics"
      />

      <div className="p-6 space-y-4 max-w-7xl w-full mx-auto">
        {loading ? (
          <div className="bg-white border border-border rounded-lg p-12 text-center text-xs text-text-secondary">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading shared links...</span>
          </div>
        ) : shares.length === 0 ? (
          <div className="bg-white border border-border rounded-lg p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-surface border border-border mx-auto flex items-center justify-center text-text-muted mb-3">
              <Share2 className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-xs font-semibold text-text-primary">
              No active shared links
            </h3>
            <p className="text-[11px] text-text-muted mt-1 max-w-xs mx-auto">
              Share any file from My Files to create public or password-protected download links.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-lg overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                    <th className="py-3 px-4">Shared File</th>
                    <th className="py-3 px-4 w-32">Security</th>
                    <th className="py-3 px-4 w-44">Expiration</th>
                    <th className="py-3 px-4 w-32 text-center">Downloads</th>
                    <th className="py-3 px-4 text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {shares.map((share) => {
                    const isCopied = copiedId === share.id;
                    const file = share.file;
                    if (!file) return null;

                    return (
                      <tr key={share.id} className="hover:bg-surface/70 transition-colors">
                        {/* File details */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 overflow-hidden">
                            {getFileIcon(file.fileType, file.originalName, 'w-4 h-4 flex-shrink-0')}
                            <div className="overflow-hidden">
                              <span
                                onClick={() => onPreview && onPreview(file)}
                                className="font-medium text-text-primary block truncate hover:text-brand-600 cursor-pointer transition-colors"
                              >
                                {file.originalName}
                              </span>
                              <span className="text-[11px] text-text-muted block mt-0.5">
                                {formatBytes(file.fileSize)} • Created {formatDate(share.createdAt)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Security */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {share.isPasswordProtected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Password</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface text-text-muted border border-border">
                              Public
                            </span>
                          )}
                        </td>

                        {/* Expiration */}
                        <td className="py-3 px-4 whitespace-nowrap text-text-muted">
                          {share.isExpired ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                              <AlertCircle className="w-3 h-3" />
                              <span>Expired</span>
                            </span>
                          ) : share.expiresAt ? (
                            <span className="text-text-secondary text-[11px]">
                              {formatDate(share.expiresAt)}
                            </span>
                          ) : (
                            <span className="text-text-muted text-[11px]">Never</span>
                          )}
                        </td>

                        {/* Downloads count */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <span className="font-semibold text-text-primary">
                            {share.downloadCount}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCopy(share)}
                              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors ${
                                isCopied
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white text-text-secondary hover:text-text-primary border-border hover:bg-surface'
                              }`}
                              title="Copy link"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleRevoke(share.id)}
                              title="Revoke and disable link"
                              className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
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

export default SharedFiles;
