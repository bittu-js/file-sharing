import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Invalid email or password.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-primary-light dark:text-primary-dark flex flex-col justify-center items-center px-4 py-12 select-none">
      <div className="w-full max-w-sm">
        {/* Logo and Brand Title */}
        <div className="text-center mb-8">
          <div className="w-9 h-9 rounded-sm bg-primary-light dark:bg-primary-dark text-white dark:text-black flex items-center justify-center font-bold text-xs mx-auto mb-3 shadow-panel tracking-tight">
            VD
          </div>
          <h1 className="text-base font-semibold tracking-tight text-primary-light dark:text-primary-dark">
            VaultDrop Workspace
          </h1>
          <p className="text-xs text-secondary-light dark:text-secondary-dark mt-0.5">
            Sign in to access your files and collaborations
          </p>
        </div>

        {/* Card */}
        <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md p-6 shadow-panel">
          {error && (
            <div className="mb-4 flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xs text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-mono uppercase text-secondary-light dark:text-secondary-dark mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-tertiary-light dark:text-tertiary-dark absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs text-primary-light dark:text-primary-dark focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-secondary-light dark:text-secondary-dark mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-tertiary-light dark:text-tertiary-dark absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs text-primary-light dark:text-primary-dark focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-4 bg-primary-light dark:bg-primary-dark hover:opacity-90 disabled:opacity-50 text-white dark:text-black text-xs font-medium rounded-xs transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-4 pt-3 border-t border-line-light dark:border-line-dark text-center">
            <p className="text-[10px] font-mono text-tertiary-light dark:text-tertiary-dark">
              Demo: alex@college.edu • password123
            </p>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-secondary-light dark:text-secondary-dark mt-4">
          Don't have an account?{' '}
          <NavLink
            to="/register"
            className="text-accent font-medium hover:underline"
          >
            Create account
          </NavLink>
        </p>
      </div>
    </div>
  );
};

export default Login;
