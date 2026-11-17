import React, { useState, useEffect } from 'react';
import {
  Share2,
  X,
  Copy,
  Check,
  Lock,
  Calendar,
  AlertCircle,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { formatBytes, formatDate } from '../utils/formatters';
import api from '../services/api';

const ShareModal = ({ file, isOpen, onClose, onShareUpdated }) => {
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [expirationOption, setExpirationOption] = useState('never');
  const [customDate, setCustomDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeShare, setActiveShare] = useState(null);

  useEffect(() => {
    if (file && isOpen) {
      setError('');
      setCopied(false);
      setPassword('');

      if (file.activeShare) {
        setActiveShare(file.activeShare);
        setPasswordProtected(file.activeShare.isPasswordProtected);
        if (file.activeShare.expiresAt) {
          setExpirationOption('custom');
          setCustomDate(new Date(file.activeShare.expiresAt).toISOString().split('T')[0]);
        } else {
          setExpirationOption('never');
        }
      } else {
        setActiveShare(null);
        setPasswordProtected(false);
        setExpirationOption('never');
      }
    }
  }, [file, isOpen]);

  if (!isOpen || !file) return null;

  const origin = window.location.origin;
  const shareUrl = activeShare ? `${origin}/share/${activeShare.shareToken}` : '';

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveShare = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let expiresAt = null;
      let expiresInHours = null;

      if (expirationOption === '24h') expiresInHours = 24;
      if (expirationOption === '7d') expiresInHours = 168;
      if (expirationOption === '30d') expiresInHours = 720;
      if (expirationOption === 'custom' && customDate) {
        expiresAt = new Date(customDate).toISOString();
      }

      const payload = {
        fileId: file._id,
        password: passwordProtected ? password : null,
        expiresInHours,
        expiresAt
      };

      const res = await api.post('/shares', payload);
      if (res.data.success) {
        setActiveShare({
          shareToken: res.data.share.shareToken,
          isPasswordProtected: res.data.share.isPasswordProtected,
          expiresAt: res.data.share.expiresAt,
          downloadCount: res.data.share.downloadCount || 0
        });
        if (onShareUpdated) onShareUpdated();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to configure sharing link.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!activeShare) return;
    setLoading(true);
    setError('');

    try {
      const sharesRes = await api.get('/shares');
      const shareDoc = sharesRes.data.shares?.find(
        (s) => s.shareToken === activeShare.shareToken
      );

      if (shareDoc) {
        await api.delete(`/shares/${shareDoc.id}`);
        setActiveShare(null);
        setPasswordProtected(false);
        setPassword('');
        if (onShareUpdated) onShareUpdated();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/60">
      <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md max-w-md w-full shadow-panel overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line-light dark:border-line-dark">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-primary-light dark:text-primary-dark">
              Share File Link
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark p-1 rounded-xs transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xs text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Target File Info */}
          <div className="p-3 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs text-xs">
            <p className="font-semibold text-primary-light dark:text-primary-dark truncate">
              {file.originalName}
            </p>
            <p className="text-[11px] text-tertiary-light dark:text-tertiary-dark font-mono mt-0.5">
              {formatBytes(file.fileSize)}
            </p>
          </div>

          {/* Existing Link Display */}
          {activeShare && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-secondary-light dark:text-secondary-dark">
                Public Shareable Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full text-xs font-mono bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs px-3 py-2 text-primary-light dark:text-primary-dark focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xs transition-colors flex-shrink-0 ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-primary-light dark:bg-primary-dark text-white dark:text-black hover:opacity-90'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status and download stats */}
              <div className="flex items-center justify-between text-[11px] text-tertiary-light dark:text-tertiary-dark font-mono px-1 pt-1">
                <span>
                  Downloads: <strong className="text-primary-light dark:text-primary-dark">{activeShare.downloadCount || 0}</strong>
                </span>
                <span>
                  {activeShare.expiresAt ? (
                    `Expires: ${formatDate(activeShare.expiresAt)}`
                  ) : (
                    'No expiration set'
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Form for Configuring Sharing Options */}
          <form onSubmit={handleSaveShare} className="space-y-4 pt-1">
            {/* Password Protection */}
            <div className="space-y-2 pt-2 border-t border-line-light dark:border-line-dark">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-primary-light dark:text-primary-dark">
                <input
                  type="checkbox"
                  checked={passwordProtected}
                  onChange={(e) => setPasswordProtected(e.target.checked)}
                  className="rounded-xs border-line-light dark:border-line-dark text-accent focus:ring-0"
                />
                <Lock className="w-3.5 h-3.5 text-tertiary-light dark:text-tertiary-dark" />
                <span>Require password to download</span>
              </label>

              {passwordProtected && (
                <div className="pl-6 pt-1">
                  <input
                    type="password"
                    placeholder={activeShare?.isPasswordProtected ? 'Enter new password to change' : 'Enter a secret password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!activeShare?.isPasswordProtected}
                    className="w-full text-xs bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs px-3 py-2 text-primary-light dark:text-primary-dark placeholder:text-tertiary-light dark:placeholder:text-tertiary-dark focus:border-accent focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-tertiary-light dark:text-tertiary-dark font-mono mt-1">
                    Recipients must provide this password before downloading.
                  </p>
                </div>
              )}
            </div>

            {/* Expiration Settings */}
            <div className="space-y-2 pt-2 border-t border-line-light dark:border-line-dark">
              <label className="flex items-center gap-2 text-xs font-medium text-primary-light dark:text-primary-dark">
                <Calendar className="w-3.5 h-3.5 text-tertiary-light dark:text-tertiary-dark" />
                <span>Link Expiration</span>
              </label>

              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {[
                  { id: 'never', label: 'Never' },
                  { id: '24h', label: '24 Hours' },
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '30 Days' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExpirationOption(opt.id)}
                    className={`py-1.5 px-2 rounded-xs border text-center transition-colors text-xs font-mono ${
                      expirationOption === opt.id
                        ? 'border-primary-light dark:border-primary-dark bg-primary-light dark:bg-primary-dark text-white dark:text-black font-medium'
                        : 'border-line-light dark:border-line-dark text-secondary-light dark:text-secondary-dark hover:bg-subtle-light dark:hover:bg-subtle-dark'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-line-light dark:border-line-dark flex items-center justify-between">
              {activeShare ? (
                <button
                  type="button"
                  onClick={handleRevokeShare}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revoke Link</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-medium text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark border border-line-light dark:border-line-dark rounded-xs hover:bg-subtle-light dark:hover:bg-subtle-dark transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 disabled:opacity-50 rounded-xs transition-opacity"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{activeShare ? 'Update Link' : 'Generate Link'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
