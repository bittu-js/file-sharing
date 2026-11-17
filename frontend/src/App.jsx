import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import MyFiles from './pages/MyFiles';
import SharedWithMe from './pages/SharedWithMe';
import SharedByMe from './pages/SharedByMe';
import RecentPage from './pages/RecentPage';
import FavoritesPage from './pages/FavoritesPage';
import FileRequestsPage from './pages/FileRequestsPage';
import TrashPage from './pages/TrashPage';
import SettingsPage from './pages/SettingsPage';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicSharePage from './pages/PublicSharePage';
import PublicFileRequestPage from './pages/PublicFileRequestPage';
import NotFound from './pages/NotFound';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public Route Guard (Redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Public Shared File Landing Page */}
            <Route path="/share/:token" element={<PublicSharePage />} />

            {/* Public File Request Upload Portal */}
            <Route path="/request/:token" element={<PublicFileRequestPage />} />

            {/* Protected Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="files" element={<MyFiles />} />
              <Route path="shared-with-me" element={<SharedWithMe />} />
              <Route path="shared-by-me" element={<SharedByMe />} />
              <Route path="shared" element={<Navigate to="/shared-by-me" replace />} />
              <Route path="recent" element={<RecentPage />} />
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="file-requests" element={<FileRequestsPage />} />
              <Route path="trash" element={<TrashPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
