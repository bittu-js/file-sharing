import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Inbox, User, Calendar } from 'lucide-react';
import { formatBytes, formatDate } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';
import api from '../services/api';

const PublicFileRequestPage = () => {
  const { token } = useParams();
  const [requestInfo, setRequestInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploaderName, setUploaderName] = useState('');
  const [uploaderEmail, setUploaderEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [submissionReceipt, setSubmissionReceipt] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/file-requests/public/${token}`);
        if (res.data.success) {
          setRequestInfo(res.data.request);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'This upload request is invalid, closed, or expired.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchInfo();
  }, [token]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    // Validate uploader credentials
    const trimmedName = uploaderName.trim();
    const trimmedEmail = uploaderEmail.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('uploaderName', trimmedName);
    formData.append('uploaderEmail', trimmedEmail);
    selectedFiles.forEach((file) => formData.append('files', file));

    try {
      const res = await api.post(`/file-requests/public/${token}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (pe) => {
          if (pe.total) {
            setProgress(Math.round((pe.loaded * 100) / pe.total));
          }
        }
      });

      if (res.data.success) {
        setSubmittedCount(selectedFiles.length);
        setSubmissionReceipt({
          name: trimmedName,
          email: trimmedEmail,
          count: selectedFiles.length,
          timestamp: new Date()
        });
        setSubmitted(true);
        setSelectedFiles([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex items-center justify-center p-4">
        <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md p-8 max-w-sm w-full text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-accent" />
          <p className="text-xs text-secondary-light dark:text-secondary-dark font-mono">
            Loading upload portal...
          </p>
        </div>
      </div>
    );
  }

  if (error || !requestInfo) {
    return (
      <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex items-center justify-center p-4">
        <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md p-8 max-w-sm w-full text-center shadow-panel">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-primary-light dark:text-primary-dark">
            Upload Request Closed
          </h2>
          <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1.5 leading-relaxed">
            {error || 'This link is no longer accepting files or has been revoked.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex flex-col justify-between items-center p-4 select-none">
      {/* Brand Top Header */}
      <div className="pt-8 flex items-center gap-2">
        <div className="w-7 h-7 rounded-sm bg-primary-light dark:bg-primary-dark text-white dark:text-black flex items-center justify-center font-bold text-xs tracking-tight">
          VD
        </div>
        <span className="font-semibold text-xs tracking-tight text-primary-light dark:text-primary-dark">
          VaultDrop Portal
        </span>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md my-8">
        <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md p-6 shadow-panel">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-primary-light dark:text-primary-dark">
                  Files Submitted Successfully!
                </h2>
                <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1">
                  Thank you, <strong className="text-primary-light dark:text-primary-dark">{submissionReceipt?.name}</strong>.
                </p>
                <p className="text-xs text-secondary-light dark:text-secondary-dark mt-0.5">
                  {submittedCount} file(s) have been delivered securely to{' '}
                  <span className="font-medium text-primary-light dark:text-primary-dark">{requestInfo.requesterName}</span>'s VaultDrop workspace.
                </p>
              </div>

              {/* Receipt Summary */}
              {submissionReceipt && (
                <div className="bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs p-3 text-left space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-secondary-light dark:text-secondary-dark font-mono text-[11px]">Uploader:</span>
                    <span className="font-medium text-primary-light dark:text-primary-dark">{submissionReceipt.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-light dark:text-secondary-dark font-mono text-[11px]">Email:</span>
                    <span className="font-mono text-primary-light dark:text-primary-dark">{submissionReceipt.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-light dark:text-secondary-dark font-mono text-[11px]">Delivered:</span>
                    <span className="text-primary-light dark:text-primary-dark font-mono text-[11px]">
                      {formatDate(submissionReceipt.timestamp)}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setSubmitted(false);
                  setSubmissionReceipt(null);
                }}
                className="mt-2 px-4 py-1.5 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 rounded-xs transition-opacity"
              >
                Submit More Files
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="pb-3 border-b border-line-light dark:border-line-dark">
                <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold block mb-0.5">
                  FILE REQUEST
                </span>
                <h1 className="text-base font-semibold text-primary-light dark:text-primary-dark">
                  {requestInfo.title}
                </h1>
                {requestInfo.description && (
                  <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1">
                    {requestInfo.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-tertiary-light dark:text-tertiary-dark font-mono mt-2 pt-2 border-t border-line-light/50 dark:border-line-dark/50">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {requestInfo.requesterName}
                  </span>
                  {requestInfo.expiresAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Expires {formatDate(requestInfo.expiresAt).split(',')[0]}
                    </span>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xs text-xs text-rose-600 dark:text-rose-400">
                  {error}
                </div>
              )}

              {/* UPLOADER IDENTIFICATION FORM */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-secondary-light dark:text-secondary-dark mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={uploaderName}
                    onChange={(e) => {
                      setUploaderName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g. Dr. Evelyn Reed"
                    className="w-full text-xs px-3 py-2 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs text-primary-light dark:text-primary-dark placeholder:text-tertiary-light dark:placeholder:text-tertiary-dark focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-secondary-light dark:text-secondary-dark mb-1">
                    Your Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={uploaderEmail}
                    onChange={(e) => {
                      setUploaderEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g. evelyn.reed@lab.org"
                    className="w-full text-xs px-3 py-2 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs text-primary-light dark:text-primary-dark placeholder:text-tertiary-light dark:placeholder:text-tertiary-dark focus:outline-none focus:border-accent transition-colors"
                  />
                  <p className="text-[10px] text-tertiary-light dark:text-tertiary-dark font-mono mt-1">
                    No account required. Used by the requester to identify your submission.
                  </p>
                </div>
              </div>

              {/* Upload Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-line-light dark:border-line-dark hover:border-accent p-6 rounded-xs text-center cursor-pointer transition-colors bg-subtle-light/40 dark:bg-subtle-dark/40"
              >
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-tertiary-light dark:text-tertiary-dark mx-auto mb-1.5" />
                <p className="text-xs font-medium text-primary-light dark:text-primary-dark">
                  <span className="text-accent underline">Click to choose files</span> or drag here
                </p>
                <p className="text-[10px] font-mono text-tertiary-light dark:text-tertiary-dark mt-1">
                  Uploads go directly to requester's workspace
                </p>
              </div>

              {/* Queue */}
              {selectedFiles.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedFiles.map((f, i) => (
                    <div
                      key={i}
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
                          onClick={() => removeFile(i)}
                          className="text-tertiary-light dark:text-tertiary-dark hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {uploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-secondary-light dark:text-secondary-dark">
                    <span>Uploading files...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-subtle-light dark:bg-subtle-dark h-1.5 rounded-xs overflow-hidden">
                    <div className="bg-accent h-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
                className="w-full py-2 px-4 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 rounded-xs disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit {selectedFiles.length > 0 ? `(${selectedFiles.length}) Files` : ''}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="pb-6 text-center text-[11px] text-tertiary-light dark:text-tertiary-dark font-mono">
        Encrypted & Powered by <strong className="text-primary-light dark:text-primary-dark">VaultDrop</strong>
      </footer>
    </div>
  );
};

export default PublicFileRequestPage;
