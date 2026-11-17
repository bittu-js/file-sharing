import React, { useState, useEffect } from 'react';
import { X, Inbox, Copy, Check, Calendar, Folder, Loader2 } from 'lucide-react';
import api from '../services/api';

const CreateFileRequestModal = ({ isOpen, onClose, onRequestCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [destinationFolder, setDestinationFolder] = useState('');
  const [expiresInHours, setExpiresInHours] = useState('72'); // 3 days
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdRequest, setCreatedRequest] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setCreatedRequest(null);
      setError('');
      setCopied(false);
      fetchFolders();
    }
  }, [isOpen]);

  const fetchFolders = async () => {
    try {
      const res = await api.get('/folders?all=true');
      if (res.data.success) {
        setFolders(res.data.folders || []);
      }
    } catch (_) {}
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/file-requests', {
        title: title.trim(),
        description: description.trim(),
        destinationFolder: destinationFolder || null,
        expiresInHours: expiresInHours ? Number(expiresInHours) : null
      });

      if (res.data.success) {
        setCreatedRequest(res.data.fileRequest);
        onRequestCreated && onRequestCreated(res.data.fileRequest);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create file request.');
    } finally {
      setLoading(false);
    }
  };

  const origin = window.location.origin;
  const requestUrl = createdRequest ? `${origin}/request/${createdRequest.requestToken}` : '';

  const handleCopy = () => {
    if (!requestUrl) return;
    navigator.clipboard.writeText(requestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md max-w-md w-full shadow-panel overflow-hidden animate-in fade-in duration-150">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line-light dark:border-line-dark">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-semibold text-primary-light dark:text-primary-dark">
              Create File Request Portal
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          {error && (
            <div className="p-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xs text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {createdRequest ? (
            <div className="space-y-4">
              <div className="p-3 bg-accent/10 border border-accent/20 rounded-xs space-y-1">
                <p className="font-semibold text-primary-light dark:text-primary-dark text-xs">
                  Request Portal Ready
                </p>
                <p className="text-[11px] text-secondary-light dark:text-secondary-dark">
                  Anyone with this link can upload files directly into your account without logging in.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-tertiary-light dark:text-tertiary-dark mb-1">
                  Public Submission Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={requestUrl}
                    className="flex-1 text-xs px-2.5 py-1.5 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs font-mono text-primary-light dark:text-primary-dark select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xs text-white transition-colors ${
                      copied ? 'bg-emerald-600' : 'bg-accent hover:bg-accent-hover'
                    }`}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-line-light dark:border-line-dark">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark rounded-xs"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-secondary-light dark:text-secondary-dark mb-1">
                  Request Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project Deliverables, Student Assignments"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs text-primary-light dark:text-primary-dark focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-secondary-light dark:text-secondary-dark mb-1">
                  Instructions / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please submit your final project reports in PDF or ZIP format."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs text-primary-light dark:text-primary-dark focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-secondary-light dark:text-secondary-dark mb-1">
                  Destination Folder
                </label>
                <select
                  value={destinationFolder}
                  onChange={(e) => setDestinationFolder(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs text-primary-light dark:text-primary-dark focus:outline-none"
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
                  Link Expiration
                </label>
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs text-primary-light dark:text-primary-dark focus:outline-none"
                >
                  <option value="">Never</option>
                  <option value="24">24 Hours</option>
                  <option value="72">3 Days</option>
                  <option value="168">7 Days</option>
                  <option value="720">30 Days</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line-light dark:border-line-dark">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark border border-line-light dark:border-line-dark rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 rounded-xs disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Generate Link</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateFileRequestModal;
