import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, AlertCircle, CheckCircle2, Loader2, Folder, Tag, AlertTriangle } from 'lucide-react';
import { formatBytes } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';
import api from '../services/api';

const FileUploadModal = ({ isOpen, onClose, currentFolderId = null, onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [folders, setFolders] = useState([]);
  const [destinationFolder, setDestinationFolder] = useState(currentFolderId || '');
  const [tagsInput, setTagsInput] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setDestinationFolder(currentFolderId || '');
      setSelectedFiles([]);
      setError('');
      setDuplicateWarning(null);
      setProgress(0);
      fetchFolders();
    }
  }, [isOpen, currentFolderId]);

  const fetchFolders = async () => {
    try {
      const res = await api.get('/folders?all=true');
      if (res.data.success) {
        setFolders(res.data.folders || []);
      }
    } catch (_) {}
  };

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setError('');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    setError('');
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles) => {
    const MAX_SIZE = 50 * 1024 * 1024;
    const oversized = newFiles.filter((f) => f.size > MAX_SIZE);

    if (oversized.length > 0) {
      setError(`Files exceeding 50 MB: ${oversized.map((f) => f.name).join(', ')}`);
      return;
    }

    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const filtered = newFiles.filter((f) => !existingNames.has(f.name));
      return [...prev, ...filtered];
    });
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setProgress(0);
    setError('');
    setDuplicateWarning(null);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    if (destinationFolder) {
      formData.append('folderId', destinationFolder);
    }
    if (tagsInput.trim()) {
      formData.append('tags', tagsInput.trim());
    }

    try {
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        }
      });

      if (res.data.success) {
        if (res.data.duplicates && res.data.duplicates.length > 0) {
          setDuplicateWarning(res.data.duplicates);
        }

        setTimeout(() => {
          setUploading(false);
          onUploadSuccess && onUploadSuccess();
          if (!res.data.duplicates || res.data.duplicates.length === 0) {
            onClose();
          }
        }, 500);
      }
    } catch (err) {
      setUploading(false);
      setError(
        err.response?.data?.message || 'Upload failed. Check storage quota or file permissions.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md max-w-lg w-full shadow-panel overflow-hidden animate-in fade-in duration-150">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line-light dark:border-line-dark">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-semibold text-primary-light dark:text-primary-dark">
              Upload Files
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 text-xs">
          {error && (
            <div className="flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xs text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {duplicateWarning && duplicateWarning.length > 0 && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xs text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Identical File Content Detected (SHA-256 Match)</span>
              </div>
              <p className="text-[11px] leading-tight">
                {duplicateWarning.map((d, i) => (
                  <span key={i} className="block">
                    "{d.uploadedName}" has identical content to existing file "{d.duplicateOf}".
                  </span>
                ))}
              </p>
            </div>
          )}

          {/* Folder & Tag Controls */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div>
              <label className="block text-[10px] font-mono uppercase text-secondary-light dark:text-secondary-dark mb-1">
                Destination Folder
              </label>
              <select
                value={destinationFolder}
                onChange={(e) => setDestinationFolder(e.target.value)}
                className="w-full text-xs px-2 py-1.5 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs text-primary-light dark:text-primary-dark focus:outline-none"
              >
                <option value="">Root (My Files)</option>
                {folders.map((f) => (
                  <option key={f._id} value={f._id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-secondary-light dark:text-secondary-dark mb-1">
                Custom Tags
              </label>
              <input
                type="text"
                placeholder="e.g. Finance, Q4, Final"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs text-primary-light dark:text-primary-dark focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xs p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-accent bg-accent/5'
                : 'border-line-light dark:border-line-dark hover:border-accent bg-subtle-light/40 dark:bg-subtle-dark/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              multiple
              className="hidden"
            />
            <Upload className="w-6 h-6 text-tertiary-light dark:text-tertiary-dark mx-auto mb-1.5" />
            <p className="text-xs font-medium text-primary-light dark:text-primary-dark">
              <span className="text-accent underline">Click to browse</span> or drag and drop files here
            </p>
            <p className="text-[10px] font-mono text-tertiary-light dark:text-tertiary-dark mt-1">
              Supports all common formats • Up to 50 MB each • SHA-256 verified
            </p>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              <div className="flex justify-between text-[11px] font-mono text-tertiary-light dark:text-tertiary-dark pb-0.5">
                <span>Selected: {selectedFiles.length} files</span>
                <span>
                  {formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                </span>
              </div>
              {selectedFiles.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xs border border-line-light dark:border-line-dark bg-subtle-light dark:bg-subtle-dark text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {getFileIcon(f.type, f.name, 'w-3.5 h-3.5 flex-shrink-0')}
                    <span className="truncate text-primary-light dark:text-primary-dark font-medium">
                      {f.name}
                    </span>
                    <span className="font-mono text-[10px] text-tertiary-light dark:text-tertiary-dark">
                      ({formatBytes(f.size)})
                    </span>
                  </div>
                  {!uploading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="text-tertiary-light dark:text-tertiary-dark hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-mono text-secondary-light dark:text-secondary-dark">
                <span>Uploading files...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-subtle-light dark:bg-subtle-dark h-1.5 rounded-xs overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

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
              type="button"
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 rounded-xs disabled:opacity-50"
            >
              {uploading && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
