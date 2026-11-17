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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/60">
      <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md max-w-4xl w-full max-h-[90vh] flex flex-col shadow-panel overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line-light dark:border-line-dark bg-panel-light dark:bg-panel-dark">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {getFileIcon(file.fileType, file.originalName, 'w-4 h-4 flex-shrink-0')}
            <div className="overflow-hidden">
              <h2 className="text-xs font-semibold text-primary-light dark:text-primary-dark truncate">
                {file.originalName}
              </h2>
              <p className="text-[11px] text-tertiary-light dark:text-tertiary-dark font-mono">
                {formatBytes(file.fileSize)} • Uploaded {formatDate(file.uploadDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onShare && (
              <button
                onClick={() => onShare(file)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark border border-line-light dark:border-line-dark rounded-xs hover:bg-subtle-light dark:hover:bg-subtle-dark transition-colors"
                title="Share link"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 rounded-xs transition-opacity"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-subtle-light/60 dark:bg-canvas-dark flex items-center justify-center min-h-[400px] max-h-[calc(90vh-120px)] p-4">
          {loadingPreview ? (
            <div className="flex flex-col items-center justify-center gap-2 text-xs text-secondary-light dark:text-secondary-dark">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
              <span className="font-mono text-[11px]">Loading preview...</span>
            </div>
          ) : isImage && blobUrl && !loadError ? (
            /* IMAGE PREVIEW */
            <div className="max-w-full max-h-full flex items-center justify-center bg-panel-light dark:bg-panel-dark rounded-xs border border-line-light dark:border-line-dark p-2 shadow-2xs">
              <img
                src={blobUrl}
                alt={file.originalName}
                onError={() => setLoadError(true)}
                className="max-h-[60vh] max-w-full object-contain rounded-xs"
              />
            </div>
          ) : isPdf && blobUrl && !loadError ? (
            /* PDF PREVIEW */
            <div className="w-full h-full min-h-[550px] bg-panel-light dark:bg-panel-dark rounded-xs border border-line-light dark:border-line-dark overflow-hidden shadow-2xs">
              <iframe
                src={`${blobUrl}#toolbar=1&navpanes=0`}
                title={file.originalName}
                className="w-full h-[550px] border-none"
                onError={() => setLoadError(true)}
              />
            </div>
          ) : (
            /* UNSUPPORTED / INFO PREVIEW */
            <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md p-8 max-w-md w-full text-center shadow-panel">
              <div className="w-14 h-14 rounded-full bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark mx-auto flex items-center justify-center text-tertiary-light dark:text-tertiary-dark mb-4">
                {getFileIcon(file.fileType, file.originalName, 'w-7 h-7')}
              </div>
              <h3 className="text-sm font-semibold text-primary-light dark:text-primary-dark truncate">
                {file.originalName}
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1">
                {loadError
                  ? 'Failed to load preview for this file.'
                  : `Direct in-browser preview is not available for .${getFileExtension(
                      file.originalName
                    )} files.`}
              </p>

              {/* Metadata Details */}
              <div className="mt-5 p-3 bg-subtle-light dark:bg-subtle-dark rounded-xs border border-line-light dark:border-line-dark text-left space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-secondary-light dark:text-secondary-dark">File size:</span>
                  <span className="font-mono text-primary-light dark:text-primary-dark">
                    {formatBytes(file.fileSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-light dark:text-secondary-dark">MIME type:</span>
                  <span className="font-mono text-primary-light dark:text-primary-dark truncate max-w-[200px]">
                    {file.fileType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-light dark:text-secondary-dark">Total downloads:</span>
                  <span className="font-mono text-primary-light dark:text-primary-dark">
                    {file.downloadCount || 0}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => onDownload(file)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 rounded-xs transition-opacity shadow-2xs"
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
