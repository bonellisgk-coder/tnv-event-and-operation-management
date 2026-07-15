import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Eye, EyeOff, CheckCircle } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const { apiFetch } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Password reset token is missing. Please request a new link.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired or already been used.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary font-serif">Reset Password</h1>
        <p className="text-gray-medium text-sm mt-1">Set a strong new password for your volunteer account</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-xl shadow-premium border border-gray-border p-8">
        {error && (
          <div className="mb-4 p-3 bg-danger-light text-danger rounded-lg text-sm flex items-center gap-2 border border-danger/20">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4">
            <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-success-light text-success mb-2">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-dark">Password updated successfully!</p>
            <p className="text-xs text-gray-medium">You can now sign in with your new password.</p>
            <div className="pt-4">
              <Link
                to="/login"
                className="px-4 py-2 bg-primary text-background font-bold rounded-lg border-b-2 border-accent transition-all hover:bg-primary-hover inline-block"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/30 transition-all font-medium"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-medium hover:text-primary transition-all"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-2">Confirm New Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/30 transition-all font-medium"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg shadow-md border-b-2 border-accent transition-all disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
