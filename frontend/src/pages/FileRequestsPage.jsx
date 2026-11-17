import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Inbox, Plus, Copy, Check, Trash2, Folder, ExternalLink, Eye, Users } from 'lucide-react';
import Header from '../components/Header';
import RequestSubmissionsModal from '../components/RequestSubmissionsModal';
import { formatDate } from '../utils/formatters';
import api from '../services/api';

const FileRequestsPage = () => {
  const { onOpenCreateRequest, onPreview, refreshTrigger } = useOutletContext();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [submissionsModalRequest, setSubmissionsModalRequest] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/file-requests');
      if (res.data.success) {
        setRequests(res.data.fileRequests || []);
      }
    } catch (err) {
      console.error('Failed to load file requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [refreshTrigger]);

  const handleCopy = (req) => {
    const origin = window.location.origin;
    const url = `${origin}/request/${req.requestToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(req._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (id) => {
    if (!confirm('Revoke and deactivate this upload portal?')) return;
    try {
      await api.delete(`/file-requests/${id}`);
      fetchRequests();
    } catch (err) {
      alert('Failed to revoke file request.');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-canvas-light dark:bg-canvas-dark min-h-screen">
      <Header
        title="File Request Portals"
        subtitle="Invite external users to upload files directly into your workspace"
      />

      <div className="p-6 space-y-4 max-w-7xl w-full mx-auto">
        <div className="flex justify-between items-center">
          <p className="text-xs text-secondary-light dark:text-secondary-dark">
            Upload portals allow clients, students or teammates to submit files securely without creating an account.
          </p>
          <button
            onClick={onOpenCreateRequest}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 rounded-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Request</span>
          </button>
        </div>

        {loading ? (
          <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm p-12 text-center text-xs text-secondary-light dark:text-secondary-dark">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="font-mono">Loading request portals...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm p-12 text-center">
            <div className="w-10 h-10 rounded-sm bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark mx-auto flex items-center justify-center text-tertiary-light dark:text-tertiary-dark mb-3">
              <Inbox className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-light dark:text-primary-dark font-mono">
              No active file requests
            </h3>
            <p className="text-[11px] text-tertiary-light dark:text-tertiary-dark mt-1 max-w-xs mx-auto">
              Create a request link to receive files directly into your folders from anyone.
            </p>
            <button
              onClick={onOpenCreateRequest}
              className="mt-4 px-3 py-1.5 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark rounded-sm"
            >
              Create File Request
            </button>
          </div>
        ) : (
          <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line-light dark:border-line-dark bg-subtle-light/60 dark:bg-subtle-dark/60 text-[10px] font-semibold text-tertiary-light dark:text-tertiary-dark uppercase tracking-wider font-mono">
                  <th className="py-2.5 px-3">Title & Destination</th>
                  <th className="py-2.5 px-3 w-32 font-mono text-center">Submissions</th>
                  <th className="py-2.5 px-3 w-40">Expiration</th>
                  <th className="py-2.5 px-3 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-light dark:divide-line-dark text-xs">
                {requests.map((req) => {
                  const isCopied = copiedId === req._id;
                  return (
                    <tr key={req._id} className="hover:bg-subtle-light/70 dark:hover:bg-subtle-dark/70 transition-colors">
                      <td className="py-2 px-3">
                        <p className="font-medium text-primary-light dark:text-primary-dark">
                          {req.title}
                        </p>
                        <p className="text-[10px] text-tertiary-light dark:text-tertiary-dark font-mono flex items-center gap-1 mt-0.5">
                          <Folder className="w-3 h-3 text-blue-500" />
                          Destination: {req.destinationFolder?.name || 'Root (My Files)'}
                        </p>
                      </td>

                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => setSubmissionsModalRequest(req)}
                          title="Click to view submitted files and uploader identities"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-subtle-light dark:bg-subtle-dark hover:bg-accent/10 border border-line-light dark:border-line-dark hover:border-accent text-primary-light dark:text-primary-dark transition-colors font-mono font-semibold text-xs"
                        >
                          <Users className="w-3 h-3 text-accent" />
                          <span>{req.submissionsCount || 0}</span>
                        </button>
                      </td>

                      <td className="py-2 px-3 text-secondary-light dark:text-secondary-dark font-mono text-[11px]">
                        {req.expiresAt ? formatDate(req.expiresAt) : 'Never'}
                      </td>

                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSubmissionsModalRequest(req)}
                            title="View submissions log"
                            className="flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded-xs border border-line-light dark:border-line-dark bg-panel-light dark:bg-panel-dark text-secondary-light dark:text-secondary-dark hover:text-accent hover:border-accent hover:bg-subtle-light dark:hover:bg-subtle-dark transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleCopy(req)}
                            className={`flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded-xs border transition-colors ${
                              isCopied
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-panel-light dark:bg-panel-dark text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark border-line-light dark:border-line-dark hover:bg-subtle-light dark:hover:bg-subtle-dark'
                            }`}
                          >
                            {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                          </button>
                          <button
                            onClick={() => handleRevoke(req._id)}
                            title="Revoke request portal"
                            className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-rose-500 rounded-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submissions Detail Modal */}
      {submissionsModalRequest && (
        <RequestSubmissionsModal
          isOpen={!!submissionsModalRequest}
          request={submissionsModalRequest}
          onClose={() => setSubmissionsModalRequest(null)}
          onPreviewFile={onPreview}
        />
      )}
    </div>
  );
};

export default FileRequestsPage;
