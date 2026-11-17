import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  Star,
  Trash2,
  Clock,
  History,
  Tag,
  Copy,
  Check,
  Users,
  Shield,
  FileText,
  Upload,
  RotateCcw,
  ExternalLink,
  Plus,
  Loader2,
  Folder
} from 'lucide-react';
import { formatBytes, formatDate, getFileExtension } from '../utils/formatters';
import { getFileIcon } from '../utils/fileIcons';
import api from '../services/api';

const FileDetailsPanel = ({
  file,
  isOpen,
  onClose,
  onDownload,
  onShare,
  onFavoriteToggle,
  onTrash,
  onOpenNewVersion,
  onFileUpdated
}) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'versions' | 'activity' | 'access'
  const [versions, setVersions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [newCollabEmail, setNewCollabEmail] = useState('');
  const [collabRole, setCollabRole] = useState('viewer');
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabError, setCollabError] = useState('');

  // Fetch versions and activities when file changes or tab changes
  useEffect(() => {
    if (file && isOpen) {
      if (activeTab === 'versions') {
        fetchVersions();
      } else if (activeTab === 'activity') {
        fetchActivities();
      }
    }
  }, [file?._id, activeTab, isOpen]);

  const fetchVersions = async () => {
    if (!file) return;
    setLoadingVersions(true);
    try {
      const res = await api.get(`/files/${file._id}/versions`);
      if (res.data.success) {
        setVersions(res.data.versions || []);
      }
    } catch (err) {
      console.error('Failed to load file versions:', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const fetchActivities = async () => {
    if (!file) return;
    setLoadingActivities(true);
    try {
      const res = await api.get(`/activities/file/${file._id}`);
      if (res.data.success) {
        setActivities(res.data.activities || []);
      }
    } catch (err) {
      console.error('Failed to load file activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  if (!isOpen || !file) return null;

  const isImage =
    file.fileType?.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(
      file.originalName?.split('.').pop()?.toLowerCase()
    );

  const handleCopyHash = () => {
    if (!file.hash) return;
    navigator.clipboard.writeText(file.hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    const newTags = Array.from(new Set([...(file.tags || []), tagInput.trim()]));
    try {
      await api.patch(`/files/${file._id}/tags`, { tags: newTags });
      file.tags = newTags;
      setTagInput('');
      if (onFileUpdated) onFileUpdated();
    } catch (err) {
      alert('Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    const newTags = (file.tags || []).filter((t) => t !== tagToRemove);
    try {
      await api.patch(`/files/${file._id}/tags`, { tags: newTags });
      file.tags = newTags;
      if (onFileUpdated) onFileUpdated();
    } catch (err) {
      alert('Failed to remove tag');
    }
  };

  const handleRestoreVersion = async (vNum) => {
    if (!confirm(`Restore file to Version ${vNum}? Current file will be archived as a prior version.`)) {
      return;
    }
    try {
      const res = await api.post(`/files/${file._id}/versions/${vNum}/restore`);
      if (res.data.success) {
        fetchVersions();
        if (onFileUpdated) onFileUpdated();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore version');
    }
  };

  const handleDownloadVersion = (vNum) => {
    window.open(`/api/files/${file._id}/versions/${vNum}/download`, '_blank');
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!newCollabEmail.trim()) return;
    setCollabLoading(true);
    setCollabError('');
    try {
      const res = await api.post(`/files/${file._id}/collaborators`, {
        email: newCollabEmail.trim(),
        role: collabRole
      });
      if (res.data.success) {
        file.collaborators = res.data.collaborators;
        setNewCollabEmail('');
        if (onFileUpdated) onFileUpdated();
      }
    } catch (err) {
      setCollabError(err.response?.data?.message || 'Failed to add collaborator');
    } finally {
      setCollabLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      await api.delete(`/files/${file._id}/collaborators/${userId}`);
      file.collaborators = (file.collaborators || []).filter((c) => c.user?._id !== userId && c.user !== userId);
      if (onFileUpdated) onFileUpdated();
    } catch (err) {
      alert('Failed to remove collaborator');
    }
  };

  return (
    <aside className="w-80 sm:w-96 border-l border-line-light dark:border-line-dark bg-panel-light dark:bg-panel-dark h-full flex flex-col shadow-panel overflow-hidden transition-all duration-200 z-20">
      {/* Panel Header */}
      <div className="h-14 px-4 border-b border-line-light dark:border-line-dark flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          {getFileIcon(file.fileType, file.originalName, 'w-4 h-4 flex-shrink-0')}
          <span className="text-xs font-semibold text-primary-light dark:text-primary-dark truncate font-sans">
            {file.originalName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onFavoriteToggle && onFavoriteToggle(file)}
            title={file.isFavorite ? 'Remove from Starred' : 'Add to Starred'}
            className={`p-1.5 rounded-sm transition-colors ${
              file.isFavorite
                ? 'text-amber-500 fill-amber-500'
                : 'text-tertiary-light dark:text-tertiary-dark hover:text-amber-500'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${file.isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onClose}
            title="Close Panel (Esc)"
            className="p-1.5 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-sm transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-line-light dark:border-line-dark text-xs px-2 bg-subtle-light/40 dark:bg-subtle-dark/40 font-mono text-[11px]">
        {[
          { id: 'details', label: 'Details' },
          { id: 'versions', label: `v${file.version || 1} Versions` },
          { id: 'access', label: 'Access' },
          { id: 'activity', label: 'Activity' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-2.5 transition-colors border-b-2 -mb-[1px] font-medium ${
              activeTab === tab.id
                ? 'border-accent text-primary-light dark:text-primary-dark'
                : 'border-transparent text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* QUICK ACTIONS BAR */}
        <div className="grid grid-cols-4 gap-1.5 pt-0.5">
          <button
            onClick={() => onDownload && onDownload(file)}
            className="flex flex-col items-center justify-center p-2 rounded-sm border border-line-light dark:border-line-dark hover:bg-subtle-light dark:hover:bg-subtle-dark text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
          >
            <Download className="w-3.5 h-3.5 mb-1 text-primary-light dark:text-primary-dark" />
            <span className="text-[10px]">Download</span>
          </button>
          <button
            onClick={() => onShare && onShare(file)}
            className="flex flex-col items-center justify-center p-2 rounded-sm border border-line-light dark:border-line-dark hover:bg-subtle-light dark:hover:bg-subtle-dark text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 mb-1 text-blue-500" />
            <span className="text-[10px]">Share</span>
          </button>
          <button
            onClick={() => onOpenNewVersion && onOpenNewVersion(file)}
            className="flex flex-col items-center justify-center p-2 rounded-sm border border-line-light dark:border-line-dark hover:bg-subtle-light dark:hover:bg-subtle-dark text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
          >
            <Upload className="w-3.5 h-3.5 mb-1 text-emerald-500" />
            <span className="text-[10px]">New Ver</span>
          </button>
          <button
            onClick={() => onTrash && onTrash(file)}
            className="flex flex-col items-center justify-center p-2 rounded-sm border border-line-light dark:border-line-dark hover:bg-subtle-light dark:hover:bg-subtle-dark text-secondary-light dark:text-secondary-dark hover:text-rose-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 mb-1 text-rose-500" />
            <span className="text-[10px]">Trash</span>
          </button>
        </div>

        {/* TAB 1: DETAILS */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Visual Preview Box */}
            <div className="w-full h-36 rounded-sm bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark flex items-center justify-center overflow-hidden">
              {isImage ? (
                <img
                  src={`/api/files/${file._id}/preview`}
                  alt={file.originalName}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-center p-3">
                  <div className="w-10 h-10 rounded-sm bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark flex items-center justify-center mx-auto mb-2 text-tertiary-light dark:text-tertiary-dark shadow-2xs">
                    {getFileIcon(file.fileType, file.originalName, 'w-5 h-5')}
                  </div>
                  <span className="text-[11px] font-mono text-tertiary-light dark:text-tertiary-dark uppercase">
                    .{getFileExtension(file.originalName)}
                  </span>
                </div>
              )}
            </div>

            {/* Properties List */}
            <div className="space-y-2.5 pt-1">
              <h4 className="text-[10px] font-semibold tracking-wider uppercase text-tertiary-light dark:text-tertiary-dark font-mono">
                FILE INFORMATION
              </h4>
              <div className="space-y-2 border-t border-line-light dark:border-line-dark pt-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-secondary-light dark:text-secondary-dark">Size</span>
                  <span className="font-mono text-primary-light dark:text-primary-dark">
                    {formatBytes(file.fileSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-light dark:text-secondary-dark">Version</span>
                  <span className="font-mono font-medium text-primary-light dark:text-primary-dark">
                    v{file.version || 1}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-light dark:text-secondary-dark">MIME Type</span>
                  <span className="font-mono text-primary-light dark:text-primary-dark truncate max-w-[180px]">
                    {file.fileType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-light dark:text-secondary-dark">Location</span>
                  <span className="text-primary-light dark:text-primary-dark flex items-center gap-1">
                    <Folder className="w-3 h-3 text-blue-500" />
                    {file.folder?.name || 'Root (My Files)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-light dark:text-secondary-dark">Uploaded</span>
                  <span className="text-primary-light dark:text-primary-dark">
                    {formatDate(file.uploadDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-light dark:text-secondary-dark">Last Accessed</span>
                  <span className="text-primary-light dark:text-primary-dark">
                    {formatDate(file.lastAccessedAt || file.uploadDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-light dark:text-secondary-dark">Downloads</span>
                  <span className="font-mono text-primary-light dark:text-primary-dark">
                    {file.downloadCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* SHA-256 Checksum */}
            {file.hash && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-tertiary-light dark:text-tertiary-dark font-mono">
                    SHA-256 HASH
                  </span>
                  <button
                    onClick={handleCopyHash}
                    className="flex items-center gap-1 text-[10px] text-accent hover:underline font-mono"
                  >
                    {copiedHash ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2 bg-subtle-light dark:bg-subtle-dark rounded-sm border border-line-light dark:border-line-dark font-mono text-[10px] text-secondary-light dark:text-secondary-dark break-all select-all">
                  {file.hash}
                </div>
              </div>
            )}

            {/* Tags Editor */}
            <div className="space-y-2 pt-2 border-t border-line-light dark:border-line-dark">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-tertiary-light dark:text-tertiary-dark font-mono block">
                CUSTOM TAGS
              </span>
              <div className="flex flex-wrap gap-1">
                {(file.tags || []).map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-medium bg-subtle-light dark:bg-subtle-dark text-primary-light dark:text-primary-dark border border-line-light dark:border-line-dark"
                  >
                    <Tag className="w-2.5 h-2.5 text-accent" />
                    <span>{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-500 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddTag} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Add tag (e.g. Q4, Finance)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="flex-1 text-xs px-2 py-1 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-sm text-primary-light dark:text-primary-dark placeholder:text-tertiary-light dark:placeholder:text-tertiary-dark focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!tagInput.trim()}
                  className="px-2.5 py-1 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark rounded-sm disabled:opacity-50"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: VERSION HISTORY */}
        {activeTab === 'versions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-tertiary-light dark:text-tertiary-dark font-mono">
                VERSION TIMELINE
              </span>
              <button
                onClick={() => onOpenNewVersion && onOpenNewVersion(file)}
                className="flex items-center gap-1 text-[11px] text-accent hover:underline font-medium"
              >
                <Upload className="w-3 h-3" />
                <span>Upload New Version</span>
              </button>
            </div>

            {loadingVersions ? (
              <div className="p-8 text-center text-xs text-tertiary-light dark:text-tertiary-dark">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-accent" />
                <span>Loading versions...</span>
              </div>
            ) : versions.length === 0 ? (
              <p className="text-xs text-secondary-light dark:text-secondary-dark">No version history available.</p>
            ) : (
              <div className="space-y-2">
                {versions.map((ver) => (
                  <div
                    key={ver.versionNumber}
                    className={`p-2.5 rounded-sm border transition-colors ${
                      ver.isCurrent
                        ? 'border-accent bg-accent/5 dark:bg-accent/10'
                        : 'border-line-light dark:border-line-dark bg-subtle-light/50 dark:bg-subtle-dark/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-primary-light dark:text-primary-dark">
                          v{ver.versionNumber}
                        </span>
                        {ver.isCurrent && (
                          <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-semibold uppercase tracking-wider bg-accent text-white font-mono">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-tertiary-light dark:text-tertiary-dark">
                        {formatBytes(ver.fileSize)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-secondary-light dark:text-secondary-dark">
                      <span>{formatDate(ver.uploadedAt)}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDownloadVersion(ver.versionNumber)}
                          title="Download this version"
                          className="hover:text-primary-light dark:hover:text-primary-dark underline"
                        >
                          Download
                        </button>
                        {!ver.isCurrent && (
                          <button
                            onClick={() => handleRestoreVersion(ver.versionNumber)}
                            title="Restore this version as current"
                            className="hover:text-accent font-medium flex items-center gap-0.5"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Restore</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACCESS & COLLABORATORS */}
        {activeTab === 'access' && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-tertiary-light dark:text-tertiary-dark font-mono block mb-1.5">
                SHARE & PERMISSIONS
              </span>
              <p className="text-[11px] text-secondary-light dark:text-secondary-dark mb-3">
                Grant registered users viewing or editing permissions to this file.
              </p>

              {collabError && (
                <div className="p-2 mb-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-sm text-xs text-rose-600 dark:text-rose-400">
                  {collabError}
                </div>
              )}

              <form onSubmit={handleAddCollaborator} className="space-y-2">
                <input
                  type="email"
                  placeholder="User email (e.g. colin@company.com)..."
                  required
                  value={newCollabEmail}
                  onChange={(e) => setNewCollabEmail(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-sm text-primary-light dark:text-primary-dark focus:outline-none focus:border-accent"
                />
                <div className="flex gap-2">
                  <select
                    value={collabRole}
                    onChange={(e) => setCollabRole(e.target.value)}
                    className="text-xs px-2 py-1.5 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-sm text-primary-light dark:text-primary-dark focus:outline-none"
                  >
                    <option value="viewer">Can View (Viewer)</option>
                    <option value="editor">Can Edit (Editor)</option>
                  </select>
                  <button
                    type="submit"
                    disabled={collabLoading || !newCollabEmail}
                    className="flex-1 py-1.5 px-3 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 rounded-sm disabled:opacity-50"
                  >
                    {collabLoading ? 'Inviting...' : 'Grant Access'}
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Collaborators List */}
            <div className="space-y-2 pt-2 border-t border-line-light dark:border-line-dark">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-tertiary-light dark:text-tertiary-dark font-mono block">
                PEOPLE WITH ACCESS
              </span>
              <div className="space-y-1.5">
                {/* Owner */}
                <div className="flex items-center justify-between p-2 bg-subtle-light dark:bg-subtle-dark rounded-sm text-xs">
                  <div>
                    <p className="font-medium text-primary-light dark:text-primary-dark">
                      {file.owner?.name || 'Owner'}
                    </p>
                    <p className="text-[10px] text-tertiary-light dark:text-tertiary-dark font-mono">
                      {file.owner?.email || ''}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-tertiary-light dark:text-tertiary-dark">
                    Owner
                  </span>
                </div>

                {/* Collaborators */}
                {(file.collaborators || []).map((collab, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm text-xs"
                  >
                    <div>
                      <p className="font-medium text-primary-light dark:text-primary-dark">
                        {collab.user?.name || 'User'}
                      </p>
                      <p className="text-[10px] text-tertiary-light dark:text-tertiary-dark font-mono">
                        {collab.user?.email || 'user@example.com'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-subtle-light dark:bg-subtle-dark text-secondary-light dark:text-secondary-dark">
                        {collab.role}
                      </span>
                      <button
                        onClick={() => handleRemoveCollaborator(collab.user?._id || collab.user)}
                        title="Revoke access"
                        className="text-tertiary-light dark:text-tertiary-dark hover:text-rose-500 p-0.5"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACTIVITY LOG */}
        {activeTab === 'activity' && (
          <div className="space-y-3">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-tertiary-light dark:text-tertiary-dark font-mono block">
              AUDIT TRAIL
            </span>

            {loadingActivities ? (
              <div className="p-8 text-center text-xs text-tertiary-light dark:text-tertiary-dark">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-accent" />
                <span>Loading activity trail...</span>
              </div>
            ) : activities.length === 0 ? (
              <p className="text-xs text-secondary-light dark:text-secondary-dark">No recent activity logged for this file.</p>
            ) : (
              <div className="space-y-2 border-l border-line-light dark:border-line-dark pl-3 ml-1.5">
                {activities.map((act) => (
                  <div key={act._id} className="relative text-xs space-y-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent absolute -left-[16px] top-1.5" />
                    <p className="font-medium text-primary-light dark:text-primary-dark capitalize">
                      {act.action.replace('_', ' ')}
                    </p>
                    <p className="text-[10px] font-mono text-tertiary-light dark:text-tertiary-dark">
                      {formatDate(act.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default FileDetailsPanel;
