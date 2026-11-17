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
      // If response is blob containing JSON error
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
        `/shares/${token}/preview`,
        { password: password || undefined },
        { responseType: 'blob' }
      );

      const blobType = shareData?.fileType || 'application/octet-stream';
      const fileBlob = new Blob([response.data], { type: blobType });
      const url = window.URL.createObjectURL(fileBlob);
      setPreviewBlobUrl(url);
      setPreviewOpen(true);
    } catch (err) {
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          setDownloadError(parsed.message || 'Incorrect password to preview.');
        } catch {
          setDownloadError('Incorrect password.');
        }
      } else {
        setDownloadError('Failed to load preview.');
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
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white border border-border rounded-lg p-8 max-w-sm w-full text-center shadow-xs">
          <Loader2 className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-text-secondary">Verifying shared link...</p>
        </div>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-white border border-border rounded-lg p-8 max-w-sm w-full text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 mx-auto flex items-center justify-center text-rose-600 mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-semibold text-text-primary">
            Link Unavailable
          </h2>
          <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
            {error || 'This link may have expired or was deactivated by the sender.'}
          </p>
          <div className="mt-6 pt-4 border-t border-border">
            <a
              href="/login"
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Go to VaultDrop Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between items-center p-4">
      {/* Top Brand Logo */}
      <div className="pt-8">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand-500 text-white flex items-center justify-center font-semibold text-xs shadow-xs">
            <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight text-text-primary">
            VaultDrop
          </span>
        </div>
      </div>

      {/* Main File Card */}
      <div className="w-full max-w-md my-8">
        <div className="bg-white border border-border rounded-lg p-6 shadow-2xs">
          {/* File Header */}
          <div className="flex items-start gap-3.5 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
              {getFileIcon(shareData.fileType, shareData.fileName, 'w-6 h-6')}
            </div>
            <div className="overflow-hidden">
              <h1 className="text-sm font-semibold text-text-primary break-all">
                {shareData.fileName}
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                {formatBytes(shareData.fileSize)}
              </p>
            </div>
          </div>

          {/* Details & Badges */}
          <div className="py-4 space-y-2.5 text-xs text-text-secondary">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-text-muted">
                <User className="w-3.5 h-3.5" /> Shared by
              </span>
              <span className="font-medium text-text-primary">
                {shareData.sharedBy}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-text-muted">
                <Calendar className="w-3.5 h-3.5" /> Shared date
              </span>
              <span className="text-text-primary">
                {formatDate(shareData.createdAt)}
              </span>
            </div>

            {shareData.expiresAt && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-text-muted">
                  <Clock className="w-3.5 h-3.5" /> Expires
                </span>
                <span className="text-text-primary font-medium">
                  {formatDate(shareData.expiresAt)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-text-muted">
                <ShieldCheck className="w-3.5 h-3.5" /> Link security
              </span>
              {shareData.isPasswordProtected ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Lock className="w-2.5 h-2.5" /> Password Protected
                </span>
              ) : (
                <span className="inline-flex items-center text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                  Public Direct
                </span>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {downloadError && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{downloadError}</span>
            </div>
          )}

          {/* Download & Preview Actions */}
          <form onSubmit={handleDownload} className="space-y-3 pt-2">
            {shareData.isPasswordProtected && (
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1.5">
                  Enter Password to Access File
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Enter link password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-border rounded-md placeholder:text-text-muted text-text-primary focus:border-brand-500 focus:outline-none transition-colors"
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
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-text-primary bg-surface hover:bg-surface-hover border border-border rounded-md transition-colors"
                >
                  {previewLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                  <span>Preview</span>
                </button>
              )}

              <button
                type="submit"
                disabled={downloading || previewLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-md transition-colors shadow-2xs"
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
      <footer className="pb-6 text-center text-xs text-text-muted">
        <span>Shared securely via </span>
        <strong className="text-text-primary font-semibold">VaultDrop</strong>
      </footer>

      {/* Inline Preview Modal for Public Share */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="bg-white border border-border rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white">
              <span className="text-xs font-semibold text-text-primary truncate">
                {shareData.fileName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md"
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
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-neutral-100 flex items-center justify-center min-h-[400px] p-4">
              {isImage && previewBlobUrl ? (
                <img
                  src={previewBlobUrl}
                  alt={shareData.fileName}
                  className="max-h-[65vh] max-w-full object-contain rounded border border-neutral-300 shadow-xs bg-white"
                />
              ) : isPdf && previewBlobUrl ? (
                <iframe
                  src={`${previewBlobUrl}#toolbar=1`}
                  title={shareData.fileName}
                  className="w-full h-[550px] border-none bg-white rounded shadow-xs"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicSharePage;
