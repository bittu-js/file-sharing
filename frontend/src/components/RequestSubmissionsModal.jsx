import React, { useState, useEffect } from 'react';
import {
  X,
  Inbox,
  Download,
  Mail,
  User,
  Calendar,
  Search,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Folder,
  Eye
} from 'lucide-react';
import { formatBytes, formatDate } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';
import api from '../services/api';

const RequestSubmissionsModal = ({ isOpen, onClose, request, onPreviewFile }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(null);

  useEffect(() => {
    if (isOpen && request?._id) {
      fetchSubmissions();
    }
  }, [isOpen, request?._id]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/file-requests/${request._id}/submissions`);
      if (res.data.success) {
        setSubmissions(res.data.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !request) return null;

  const filteredSubmissions = submissions.filter((sub) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      sub.originalName?.toLowerCase().includes(q) ||
      sub.uploaderName?.toLowerCase().includes(q) ||
      sub.uploaderEmail?.toLowerCase().includes(q)
    );
  });

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleDownloadSubmission = async (sub) => {
    const fileId = sub.file?._id || sub.file;
    if (fileId) {
      window.open(`/api/files/${fileId}/download`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/60">
      <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md max-w-3xl w-full max-h-[85vh] flex flex-col shadow-panel animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line-light dark:border-line-dark">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold">
                SUBMISSION LOG
              </span>
              <span className="text-line-light dark:text-line-dark">•</span>
              <span className="text-[11px] font-mono text-secondary-light dark:text-secondary-dark">
                {request.submissionsCount || submissions.length} total
              </span>
            </div>
            <h2 className="text-sm font-semibold text-primary-light dark:text-primary-dark mt-0.5">
              {request.title}
            </h2>
            <p className="text-[11px] text-tertiary-light dark:text-tertiary-dark font-mono flex items-center gap-1.5 mt-0.5">
              <Folder className="w-3 h-3 text-blue-500" />
              <span>Destination: {request.destinationFolder?.name || 'Root (My Files)'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            title="Close (Esc)"
            className="p-1.5 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="p-3 border-b border-line-light dark:border-line-dark bg-subtle-light/40 dark:bg-subtle-dark/40 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-tertiary-light dark:text-tertiary-dark absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by file name, uploader name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-xs text-primary-light dark:text-primary-dark placeholder:text-tertiary-light dark:placeholder:text-tertiary-dark focus:outline-none focus:border-accent"
            />
          </div>
          <span className="text-[11px] font-mono text-tertiary-light dark:text-tertiary-dark">
            Showing {filteredSubmissions.length} of {submissions.length}
          </span>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {loading ? (
            <div className="p-16 text-center text-xs text-secondary-light dark:text-secondary-dark space-y-2">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-accent" />
              <p className="font-mono">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-10 h-10 rounded-sm bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark mx-auto flex items-center justify-center text-tertiary-light dark:text-tertiary-dark">
                <Inbox className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-semibold text-primary-light dark:text-primary-dark uppercase tracking-wider font-mono">
                No submissions received yet
              </h3>
              <p className="text-[11px] text-tertiary-light dark:text-tertiary-dark max-w-xs mx-auto leading-relaxed">
                External users who upload through your portal link will appear here with their name, email, file metadata, and exact submission timestamp.
              </p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center text-xs text-secondary-light dark:text-secondary-dark">
              No submissions match "{searchQuery}"
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line-light dark:border-line-dark bg-subtle-light/60 dark:bg-subtle-dark/60 text-[10px] font-semibold text-tertiary-light dark:text-tertiary-dark uppercase tracking-wider font-mono">
                  <th className="py-2.5 px-4">Uploaded File</th>
                  <th className="py-2.5 px-4">Uploader Information</th>
                  <th className="py-2.5 px-3 w-24">Size</th>
                  <th className="py-2.5 px-4 w-44">Submitted At</th>
                  <th className="py-2.5 px-4 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-light dark:divide-line-dark text-xs">
                {filteredSubmissions.map((sub, idx) => {
                  const fileDoc = sub.file && typeof sub.file === 'object' ? sub.file : null;
                  const fileId = fileDoc?._id || sub.file;
                  const isEmailCopied = copiedEmail === sub.uploaderEmail;

                  return (
                    <tr
                      key={sub._id || idx}
                      className="hover:bg-subtle-light/70 dark:hover:bg-subtle-dark/70 transition-colors"
                    >
                      {/* File Name */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5 max-w-[220px]">
                          {getFileIcon(sub.fileType, sub.originalName, 'w-4 h-4 flex-shrink-0')}
                          <div className="overflow-hidden">
                            <p className="font-medium text-primary-light dark:text-primary-dark truncate" title={sub.originalName}>
                              {sub.originalName}
                            </p>
                            <span className="text-[10px] text-tertiary-light dark:text-tertiary-dark font-mono uppercase">
                              {sub.fileType?.split('/')[1] || 'file'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Uploader Details */}
                      <td className="py-2.5 px-4">
                        <div>
                          <div className="flex items-center gap-1.5 font-medium text-primary-light dark:text-primary-dark">
                            <User className="w-3 h-3 text-accent flex-shrink-0" />
                            <span>{sub.uploaderName || 'Anonymous'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-secondary-light dark:text-secondary-dark font-mono mt-0.5">
                            <a
                              href={`mailto:${sub.uploaderEmail}`}
                              className="hover:text-accent hover:underline truncate max-w-[180px]"
                              title={`Email ${sub.uploaderName}`}
                            >
                              {sub.uploaderEmail}
                            </a>
                            <button
                              onClick={() => handleCopyEmail(sub.uploaderEmail)}
                              title="Copy email address"
                              className="text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark p-0.5"
                            >
                              {isEmailCopied ? (
                                <Check className="w-2.5 h-2.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* File Size */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-secondary-light dark:text-secondary-dark">
                        {formatBytes(sub.fileSize || 0)}
                      </td>

                      {/* Date & Time */}
                      <td className="py-2.5 px-4 text-secondary-light dark:text-secondary-dark font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-tertiary-light dark:text-tertiary-dark flex-shrink-0" />
                          <span>{formatDate(sub.uploadedAt)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {fileDoc && onPreviewFile && (
                            <button
                              onClick={() => onPreviewFile(fileDoc)}
                              title="Preview file"
                              className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadSubmission(sub)}
                            title="Download file"
                            className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs"
                          >
                            <Download className="w-3.5 h-3.5 text-accent" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-line-light dark:border-line-dark bg-subtle-light/30 dark:bg-subtle-dark/30 flex items-center justify-between text-xs">
          <span className="text-[11px] text-tertiary-light dark:text-tertiary-dark font-mono">
            Files submitted via public portals are owned by your account.
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 text-xs font-medium text-primary-light dark:text-primary-dark hover:bg-subtle-light dark:hover:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestSubmissionsModal;
