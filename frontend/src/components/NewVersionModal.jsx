import React, { useState, useRef } from 'react';
import { X, Upload, File, AlertCircle, Loader2 } from 'lucide-react';
import { formatBytes } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';
import api from '../services/api';

const NewVersionModal = ({ file, isOpen, onClose, onVersionUploaded }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen || !file) return null;

  const nextVersion = (file.version || 1) + 1;

  const handleFileChange = (e) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post(`/files/${file._id}/versions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        onVersionUploaded && onVersionUploaded(res.data.file);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload new version.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md max-w-sm w-full shadow-panel overflow-hidden animate-in fade-in duration-150">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line-light dark:border-line-dark">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-semibold text-primary-light dark:text-primary-dark">
              Upload New Version
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-4 space-y-4 text-xs">
          {error && (
            <div className="p-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xs text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <div className="p-2.5 bg-subtle-light dark:bg-subtle-dark rounded-xs border border-line-light dark:border-line-dark space-y-1">
            <p className="font-medium text-primary-light dark:text-primary-dark truncate">
              {file.originalName}
            </p>
            <p className="text-[11px] text-tertiary-light dark:text-tertiary-dark font-mono">
              Current: v{file.version || 1} ({formatBytes(file.fileSize)}) → New: <strong className="text-accent">v{nextVersion}</strong>
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-line-light dark:border-line-dark hover:border-accent p-6 rounded-xs text-center cursor-pointer transition-colors bg-subtle-light/40 dark:bg-subtle-dark/40"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <div className="space-y-1">
                <p className="font-semibold text-primary-light dark:text-primary-dark truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] font-mono text-tertiary-light dark:text-tertiary-dark">
                  {formatBytes(selectedFile.size)}
                </p>
              </div>
            ) : (
              <div>
                <Upload className="w-6 h-6 text-tertiary-light dark:text-tertiary-dark mx-auto mb-1.5" />
                <p className="text-xs font-medium text-primary-light dark:text-primary-dark">
                  Click to select replacement file
                </p>
                <p className="text-[10px] text-tertiary-light dark:text-tertiary-dark mt-0.5">
                  Previous version will be preserved in version history
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line-light dark:border-line-dark">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-3 py-1.5 text-xs text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark border border-line-light dark:border-line-dark rounded-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 rounded-xs disabled:opacity-50"
            >
              {uploading && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Upload v{nextVersion}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewVersionModal;
