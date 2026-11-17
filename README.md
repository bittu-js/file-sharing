# VaultDrop — Advanced Secure File Management & Sharing System

A modern, production-grade, editorial-style full-stack MERN (MongoDB, Express.js, React.js, Node.js) file management, versioning, and secure collaboration platform. Designed with Linear precision, Raycast minimalism, and Dropbox-grade file architecture for a high-distinction B.Tech Computer Science capstone project.

---

## 1. Architectural Philosophy: Separation of Binary & Metadata

- **Dedicated Filesystem Storage**: Uploaded binary files are streamed directly to `backend/uploads/` with UUID-prefixed collision-free filenames and strict path-traversal validation.
- **MongoDB Database**: Strictly manages document metadata, hierarchical directory trees, version histories, audit logs, and access control tokens. **File binaries are never stored inside MongoDB**, preventing memory bloat and BSON limits.
- **Dual-Theme Editorial Workspace**: Light (warm canvas, deep charcoal typography) and Dark (rich obsidian `#0C0D0E`, subtle zinc borders `#272A30`, high-contrast readability).

```
┌─────────────────────────────────────────────────────────────┐
│       React 18 + Vite Frontend (Editorial Workspace)        │
│   Tailwind CSS (Dark/Light) | React Router v6 | Lucide      │
│   Sliding Inspector Panel | List/Grid Views | Bulk Bar      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST API (JWT Bearer)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express.js Backend API                      │
│   Multer Storage | SHA-256 Hashing | Archiver (ZIP Stream)  │
│   Audit Trail Logger | Quota Guard | Auth Middleware        │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      MongoDB Database        │ │    Physical File Storage   │
│ - users (storageQuota)       │ │ - /backend/uploads/        │
│ - folders (nested trees)     │ │ - Unique UUID-hash names   │
│ - files (versions, tags)     │ │ - Historical version files │
│ - shares (TTL indexes)       │ │ - Path traversal shielded  │
│ - activities (audit trail)   │ └────────────────────────────┘
│ - fileRequests (portals)     │
└──────────────────────────────┘
```

---

## 2. Advanced Features Implemented

### 1. File Versioning
- Complete version history tracking: every file maintains a historical `versions` array.
- **Upload New Version**: Uploading a revised version automatically archives the previous version with its timestamp, size, and hash, incrementing the version number (`v1` → `v2` → `v3`).
- **Download Historical Versions**: Download any previous iteration on demand.
- **Rollback / Version Restoration**: Roll back to any prior version with one click.

### 2. Hierarchical Folder Management
- Infinite nested folder structures with breadcrumb navigation.
- Color tags for folders (Blue, Emerald, Amber, Purple, Rose, Slate).
- Move files and subfolders between any directory in the workspace.
- Folder renaming and quick folder favorites.

### 3. Starred Favorites & Recent Files
- Star any file or folder to pin to the dedicated **Favorites** view.
- Real-time **Recent Files** view sorted by `lastAccessedAt` and `uploadDate`.

### 4. Activity Tracking (Audit Trail)
- Comprehensive audit log for all workspace actions: `upload`, `download`, `delete`, `restore`, `permanent_delete`, `share`, `revoke_share`, `rename`, `move`, `tag`, `favorite`, `new_version`, `version_restore`, `collaborator_add`, `file_request_upload`.
- Visualized on the **Dashboard** and within the **File Details Inspector Panel**.

### 5. Advanced Permissions & Private Collaboration
- Private sharing with registered users via email.
- Granular roles:
  - **Viewer**: Read, preview, and download.
  - **Editor**: Upload new versions, edit tags, and move.
- Dedicated **Shared with me** and **Shared by me** views.

### 6. Recycle Bin (Soft Delete & Bulk Purge)
- Soft deletion for files and folders.
- Instant item restoration or permanent purge from both disk and database.
- One-click **Empty Trash** and **Restore All** actions.

### 7. Storage Management & Quotas
- User-configurable storage quotas (250 MB, 500 MB, 1 GB, 2 GB, 5 GB) configurable in Settings.
- Pre-upload quota enforcement: uploads that would exceed the user's storage quota are rejected with HTTP 413 and clear warnings.
- Segmented visual breakdown bar categorized by Documents, Images, Archives, Media, and Other.

### 8. Duplicate Detection (SHA-256 Hashing)
- Cryptographic SHA-256 hash calculated during upload.
- Duplicate detection warns users when an uploaded file's content matches an existing file in their workspace.
- One-click hash copying in the File Details Panel for data integrity verification.

### 9. Bulk Actions
- Multi-file selection checkboxes in both List and Grid views.
- **Bulk Download**: Uses `archiver` to stream selected files as a single zipped archive on the fly (`VaultDrop_Bulk.zip`).
- **Bulk Move**: Move multiple selected files and folders into any destination directory.
- **Bulk Trash**: Soft-delete multiple items simultaneously.

### 10. File Request Portals
- Generate standalone public upload request links (e.g. `/request/:token`).
- External parties can securely submit files without creating an account or accessing the user's workspace.
- Uploaded files land automatically in the designated destination folder.
- Configurable portal expiration (24h, 3d, 7d, 30d, or never).

---

## 3. Database Schemas & Relations

### Folder Schema (`backend/models/Folder.js`)
```javascript
{
  name: { type: String, required: true },
  parent: { type: ObjectId, ref: 'Folder', default: null, index: true },
  owner: { type: ObjectId, ref: 'User', required: true, index: true },
  color: { type: String, default: 'blue' },
  isTrash: { type: Boolean, default: false, index: true },
  isFavorite: { type: Boolean, default: false, index: true },
  collaborators: [{ user: ObjectId, role: 'viewer' | 'editor' }]
}
```

### File Schema (`backend/models/File.js`)
```javascript
{
  originalName: { type: String, required: true },
  storedName: { type: String, required: true, unique: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  filePath: { type: String, required: true },
  owner: { type: ObjectId, ref: 'User', required: true, index: true },
  folder: { type: ObjectId, ref: 'Folder', default: null, index: true },
  hash: { type: String, index: true }, // SHA-256
  version: { type: Number, default: 1 },
  versions: [{
    versionNumber: Number,
    storedName: String,
    fileSize: Number,
    fileType: String,
    filePath: String,
    hash: String,
    uploadedAt: Date
  }],
  isFavorite: { type: Boolean, default: false, index: true },
  tags: [String],
  collaborators: [{ user: ObjectId, role: 'viewer' | 'editor' }],
  uploadDate: { type: Date, default: Date.now },
  lastAccessedAt: { type: Date, default: Date.now },
  downloadCount: { type: Number, default: 0 },
  isTrash: { type: Boolean, default: false, index: true }
}
```

### Activity Schema (`backend/models/Activity.js`)
```javascript
{
  user: { type: ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true },
  targetType: { type: String, enum: ['file', 'folder', 'share', 'file_request'] },
  targetId: { type: ObjectId, index: true },
  targetName: { type: String, required: true },
  details: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now, index: true }
}
```

### FileRequest Schema (`backend/models/FileRequest.js`)
```javascript
{
  title: { type: String, required: true },
  description: { type: String, default: '' },
  destinationFolder: { type: ObjectId, ref: 'Folder', default: null },
  requestToken: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, default: null }, // TTL Index
  isActive: { type: Boolean, default: true },
  submissionsCount: { type: Number, default: 0 },
  createdBy: { type: ObjectId, ref: 'User', required: true, index: true }
}
```

---

## 4. RESTful API Endpoints Summary

### Folders (`/api/folders`)
- `POST /api/folders`: Create folder
- `GET /api/folders`: List folders (by parentId or all)
- `GET /api/folders/:id/breadcrumbs`: Get ancestor folder path
- `PATCH /api/folders/:id`: Rename or change color
- `PATCH /api/folders/:id/move`: Move to new parent
- `PATCH /api/folders/:id/favorite`: Toggle favorite
- `PATCH /api/folders/:id/trash`: Soft delete
- `DELETE /api/folders/:id`: Permanent delete

### Versioning & Files (`/api/files`)
- `POST /api/files/upload`: Multi-file upload with quota and duplicate checks
- `POST /api/files/:id/versions`: Upload new version
- `GET /api/files/:id/versions`: Get version history
- `POST /api/files/:id/versions/:vNum/restore`: Restore historical version
- `GET /api/files/:id/versions/:vNum/download`: Download historical version
- `PATCH /api/files/:id/move`: Move file to folder
- `PATCH /api/files/:id/tags`: Update tags
- `PATCH /api/files/:id/favorite`: Toggle favorite
- `POST /api/files/:id/collaborators`: Add viewer/editor
- `DELETE /api/files/:id/collaborators/:userId`: Remove collaborator
- `GET /api/files/shared-with-me`: Collaborator files
- `GET /api/files/shared-by-me`: Shared files
- `POST /api/files/bulk/download`: Stream ZIP archive
- `POST /api/files/bulk/move`: Move multiple items
- `POST /api/files/bulk/trash`: Bulk trash
- `POST /api/files/trash/empty`: Permanent empty
- `POST /api/files/trash/restore-all`: Restore all trashed items

### File Requests (`/api/file-requests`)
- `POST /api/file-requests`: Create upload portal
- `GET /api/file-requests`: List user's requests
- `DELETE /api/file-requests/:id`: Revoke request
- `GET /api/file-requests/public/:token`: Public portal info
- `POST /api/file-requests/public/:token/upload`: Public upload submission

### Activity & Stats (`/api/activities`, `/api/stats`)
- `GET /api/activities`: Workspace audit timeline
- `GET /api/activities/file/:fileId`: Specific file audit log
- `GET /api/stats/dashboard`: Aggregated metrics, quota, storage distribution
- `PATCH /api/stats/quota`: Update user storage quota limit

---

## 5. Running the Application

### 1. Start MongoDB
Ensure MongoDB is running locally on port `27017` (e.g. `mongodb://127.0.0.1:27017/filesharing_db`).

### 2. Start Backend API
```bash
cd backend
npm install
npm start
# Server listens on http://localhost:5000
```

### 3. Start Frontend Client
```bash
cd frontend
npm install
npm run dev
# Vite server listens on http://localhost:5173
```

### Demo Credentials
- **Email**: `alex@college.edu`
- **Password**: `password123`
