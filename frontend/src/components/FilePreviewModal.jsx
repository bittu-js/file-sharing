import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  ExternalLink,
  FileText,
  AlertCircle,
  FileQuestion,
  File,
  Loader2
} from 'lucide-react';
import { formatBytes, formatDate, getFileExtension } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';
import api from '../services/api';

const FilePreviewModal = ({ file, isOpen, onClose, onDownload, onShare }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const isImage =
    file?.fileType?.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
      file?.originalName?.split('.').pop()?.toLowerCase()
    );

  const isPdf =
    file?.fileType?.includes('pdf') ||
    file?.originalName?.toLowerCase().endsWith('.pdf');

  const canPreview = isImage || isPdf;

  useEffect(() => {
    let active = true;
    let createdUrl = null;

    const loadBlob = async () => {
      if (!isOpen || !file || !canPreview) {
        setBlobUrl(null);
        setLoadingPreview(false);
        setLoadError(false);
        return;
      }

      setLoadingPreview(true);
      setLoadError(false);

      try {
        const response = await api.get(`/files/${file._id}/preview`, {
          responseType: 'blob'
        });

        if (active) {
          const blobType = file.fileType || (isPdf ? 'application/pdf' : 'image/png');
          const fileBlob = new Blob([response.data], { type: blobType });
          createdUrl = window.URL.createObjectURL(fileBlob);
          setBlobUrl(createdUrl);
        }
      } catch (err) {
        console.error('Failed to load file preview blob:', err);
        if (active) {
          setLoadError(true);
        }
      } finally {
        if (active) {
          setLoadingPreview(false);
        }
      }
    };

    loadBlob();

    return () => {
      active = false;
      if (createdUrl) {
        window.URL.revokeObjectURL(createdUrl);
      }
    };
  }, [file, isOpen, canPreview]);

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-white border border-border rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-white">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {getFileIcon(file.fileType, file.originalName, 'w-4 h-4 flex-shrink-0')}
            <div className="overflow-hidden">
              <h2 className="text-xs font-semibold text-text-primary truncate">
                {file.originalName}
              </h2>
              <p className="text-[11px] text-text-muted">
                {formatBytes(file.fileSize)} • Uploaded {formatDate(file.uploadDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onShare && (
              <button
                onClick={() => onShare(file)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary border border-border rounded-md hover:bg-surface transition-colors"
                title="Share link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-primary rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-neutral-100 flex items-center justify-center min-h-[400px] max-h-[calc(90vh-120px)] p-4">
          {loadingPreview ? (
            <div className="flex flex-col items-center justify-center gap-2 text-xs text-text-secondary">
              <Loader2 className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin text-brand-600" />
              <span>Loading preview...</span>
            </div>
          ) : isImage && blobUrl && !loadError ? (
            /* IMAGE PREVIEW */
            <div className="max-w-full max-h-full flex items-center justify-center">
              <img
                src={blobUrl}
                alt={file.originalName}
                onError={() => setLoadError(true)}
                className="max-h-[60vh] max-w-full object-contain rounded border border-neutral-300 shadow-xs bg-white"
              />
            </div>
          ) : isPdf && blobUrl && !loadError ? (
            /* PDF PREVIEW */
            <div className="w-full h-full min-h-[550px] bg-white rounded border border-neutral-300 overflow-hidden shadow-xs">
              <iframe
                src={`${blobUrl}#toolbar=1&navpanes=0`}
                title={file.originalName}
                className="w-full h-[550px] border-none"
                onError={() => setLoadError(true)}
              />
            </div>
          ) : (
            /* UNSUPPORTED / INFO PREVIEW */
            <div className="bg-white border border-border rounded-lg p-8 max-w-md w-full text-center shadow-xs">
              <div className="w-14 h-14 rounded-full bg-surface border border-border mx-auto flex items-center justify-center text-text-muted mb-4">
                {getFileIcon(file.fileType, file.originalName, 'w-7 h-7')}
              </div>
              <h3 className="text-sm font-semibold text-text-primary truncate">
                {file.originalName}
              </h3>
              <p className="text-xs text-text-muted mt-1">
                {loadError
                  ? 'Failed to load preview for this file.'
                  : `Direct in-browser preview is not available for .${getFileExtension(
                      file.originalName
                    )} files.`}
              </p>

              {/* Metadata Details */}
              <div className="mt-5 p-3 bg-surface rounded-md border border-border text-left space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">File size:</span>
                  <span className="font-medium text-text-primary">
                    {formatBytes(file.fileSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">MIME type:</span>
                  <span className="font-medium text-text-primary truncate max-w-[200px]">
                    {file.fileType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total downloads:</span>
                  <span className="font-medium text-text-primary">
                    {file.downloadCount || 0}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => onDownload(file)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-text-primary hover:bg-neutral-800 rounded-md transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download file to view</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
