import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Download,
  Eye,
  Lock,
  Calendar,
  User,
  AlertCircle,
  FileCheck,
  Clock,
  ShieldCheck,
  Loader2,
  X
} from 'lucide-react';
import { formatBytes, formatDate } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';
import api from '../services/api';

const PublicSharePage = () => {
  const { token } = useParams();

  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const fetchShareMeta = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/shares/${token}`);
        if (res.data.success) {
          setShareData(res.data.share);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || 'The shared file link is invalid, expired, or has been revoked.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchShareMeta();
    }
  }, [token]);

  const handleDownload = async (e) => {
    if (e) e.preventDefault();
    setDownloading(true);
    setDownloadError('');

    try {
      const response = await api.post(
        `/shares/${token}/download`,
        { password: password || undefined },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', shareData?.fileName || 'downloaded_file');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Increment local count display
      setShareData((prev) =>
        prev ? { ...prev, downloadCount: (prev.downloadCount || 0) + 1 } : prev
      );
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          setDownloadError(parsed.message || 'Incorrect password or download error.');
        } catch {
          setDownloadError('Incorrect password or download failed.');
        }
      } else {
        setDownloadError(err.response?.data?.message || 'Download failed.');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenPreview = async () => {
    setPreviewLoading(true);
    setDownloadError('');

    try {
      const response = await api.post(
        `/shares/${token}/download`,
        { password: password || undefined },
        { responseType: 'blob' }
      );

      const isPdf =
        shareData.fileType?.includes('pdf') ||
        shareData.fileName?.toLowerCase().endsWith('.pdf');
      const blobType = shareData.fileType || (isPdf ? 'application/pdf' : 'image/png');
      const blob = new Blob([response.data], { type: blobType });
      const url = window.URL.createObjectURL(blob);

      setPreviewBlobUrl(url);
      setPreviewOpen(true);
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          setDownloadError(parsed.message || 'Incorrect password to preview file.');
        } catch {
          setDownloadError('Password required to preview file.');
        }
      } else {
        setDownloadError(err.response?.data?.message || 'Preview authorization failed.');
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const isImage =
    shareData?.fileType?.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
      shareData?.fileName?.split('.').pop()?.toLowerCase()
    );

  const isPdf =
    shareData?.fileType?.includes('pdf') ||
    shareData?.fileName?.toLowerCase().endsWith('.pdf');

  const canPreview = isImage || isPdf;

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex items-center justify-center p-4">
        <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md p-8 max-w-sm w-full text-center shadow-panel">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-accent" />
          <p className="text-xs text-secondary-light dark:text-secondary-dark font-mono">Verifying shared link...</p>
        </div>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex items-center justify-center p-4">
        <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md p-8 max-w-sm w-full text-center shadow-panel">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 mx-auto flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-semibold text-primary-light dark:text-primary-dark">
            Link Unavailable
          </h2>
          <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1.5 leading-relaxed">
            {error || 'This link may have expired or was deactivated by the sender.'}
          </p>
          <div className="mt-6 pt-4 border-t border-line-light dark:border-line-dark">
            <a
              href="/login"
              className="text-xs font-medium text-accent hover:underline font-mono"
            >
              Go to VaultDrop Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex flex-col justify-between items-center p-4 select-none">
      {/* Top Brand Logo */}
      <div className="pt-8 flex items-center gap-2">
        <div className="w-7 h-7 rounded-sm bg-primary-light dark:bg-primary-dark text-white dark:text-black flex items-center justify-center font-bold text-xs tracking-tight">
          VD
        </div>
        <span className="font-semibold text-xs tracking-tight text-primary-light dark:text-primary-dark">
          VaultDrop Share
        </span>
      </div>

      {/* Main File Card */}
      <div className="w-full max-w-md my-8">
        <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md p-6 shadow-panel">
          {/* File Header */}
          <div className="flex items-start gap-3.5 pb-4 border-b border-line-light dark:border-line-dark">
            <div className="w-12 h-12 rounded-xs bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark flex items-center justify-center flex-shrink-0">
              {getFileIcon(shareData.fileType, shareData.fileName, 'w-6 h-6')}
            </div>
            <div className="overflow-hidden">
              <h1 className="text-sm font-semibold text-primary-light dark:text-primary-dark break-all">
                {shareData.fileName}
              </h1>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-mono mt-0.5">
                {formatBytes(shareData.fileSize)}
              </p>
            </div>
          </div>

          {/* Details & Badges */}
          <div className="py-4 space-y-2.5 text-xs text-secondary-light dark:text-secondary-dark">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-tertiary-light dark:text-tertiary-dark">
                <User className="w-3.5 h-3.5" /> Shared by
              </span>
              <span className="font-medium text-primary-light dark:text-primary-dark">
                {shareData.sharedBy}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-tertiary-light dark:text-tertiary-dark">
                <Calendar className="w-3.5 h-3.5" /> Shared date
              </span>
              <span className="text-primary-light dark:text-primary-dark font-mono text-[11px]">
                {formatDate(shareData.createdAt)}
              </span>
            </div>

            {shareData.expiresAt && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-tertiary-light dark:text-tertiary-dark">
                  <Clock className="w-3.5 h-3.5" /> Expires
                </span>
                <span className="text-primary-light dark:text-primary-dark font-mono text-[11px] font-medium">
                  {formatDate(shareData.expiresAt)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-tertiary-light dark:text-tertiary-dark">
                <ShieldCheck className="w-3.5 h-3.5" /> Security
              </span>
              {shareData.isPasswordProtected ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-xs border border-amber-200 dark:border-amber-800">
                  <Lock className="w-2.5 h-2.5" /> Password Protected
                </span>
              ) : (
                <span className="inline-flex items-center text-[10px] font-mono text-secondary-light dark:text-secondary-dark bg-subtle-light dark:bg-subtle-dark px-2 py-0.5 rounded-xs border border-line-light dark:border-line-dark">
                  Public Direct
                </span>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {downloadError && (
            <div className="mb-4 flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xs text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{downloadError}</span>
            </div>
          )}

          {/* Download & Preview Actions */}
          <form onSubmit={handleDownload} className="space-y-3 pt-2">
            {shareData.isPasswordProtected && (
              <div>
                <label className="block text-xs font-medium text-primary-light dark:text-primary-dark mb-1.5">
                  Enter Password to Access File
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-tertiary-light dark:text-tertiary-dark absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter link password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs placeholder:text-tertiary-light dark:placeholder:text-tertiary-dark text-primary-light dark:text-primary-dark focus:border-accent focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              {canPreview && (
                <button
                  type="button"
                  onClick={handleOpenPreview}
                  disabled={previewLoading || downloading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-primary-light dark:text-primary-dark bg-subtle-light dark:bg-subtle-dark hover:bg-line-light dark:hover:bg-line-dark border border-line-light dark:border-line-dark rounded-xs transition-colors"
                >
                  {previewLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span>Preview</span>
                </button>
              )}

              <button
                type="submit"
                disabled={downloading || previewLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 disabled:opacity-50 rounded-xs transition-opacity shadow-2xs"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="pb-6 text-center text-xs text-tertiary-light dark:text-tertiary-dark font-mono">
        <span>Shared securely via </span>
        <strong className="text-primary-light dark:text-primary-dark font-semibold">VaultDrop</strong>
      </footer>

      {/* Inline Preview Modal for Public Share */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/60">
          <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md max-w-4xl w-full max-h-[90vh] flex flex-col shadow-panel overflow-hidden animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-5 py-3 border-b border-line-light dark:border-line-dark bg-panel-light dark:bg-panel-dark">
              <span className="text-xs font-semibold text-primary-light dark:text-primary-dark truncate">
                {shareData.fileName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 rounded-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => {
                    setPreviewOpen(false);
                    if (previewBlobUrl) window.URL.revokeObjectURL(previewBlobUrl);
                    setPreviewBlobUrl(null);
                  }}
                  className="p-1.5 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-subtle-light/70 dark:bg-canvas-dark flex items-center justify-center min-h-[400px] p-4">
              {isImage && previewBlobUrl ? (
                <div className="bg-panel-light dark:bg-panel-dark rounded-xs border border-line-light dark:border-line-dark p-2">
                  <img
                    src={previewBlobUrl}
                    alt={shareData.fileName}
                    className="max-h-[65vh] max-w-full object-contain rounded-xs"
                  />
                </div>
              ) : isPdf && previewBlobUrl ? (
                <div className="w-full h-full min-h-[550px] bg-panel-light dark:bg-panel-dark rounded-xs border border-line-light dark:border-line-dark overflow-hidden">
                  <iframe
                    src={`${previewBlobUrl}#toolbar=1`}
                    title={shareData.fileName}
                    className="w-full h-[550px] border-none"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicSharePage;
