import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, CheckCircle } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { apiFetch } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(data.message || 'If the account exists, a link will be sent to reset your password.');
    } catch (err: any) {
      setError(err.message || 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary font-serif">Forgot Password</h1>
        <p className="text-gray-medium text-sm mt-1">We will send you a secure email link to reset your account password</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-xl shadow-premium border border-gray-border p-8">
        {error && (
          <div className="mb-4 p-3 bg-danger-light text-danger rounded-lg text-sm flex items-center gap-2 border border-danger/20">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message ? (
          <div className="text-center space-y-4">
            <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-success-light text-success mb-2">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-dark">{message}</p>
            <p className="text-xs text-gray-medium">Password reset links expire in exactly 1 hour for security.</p>
            <div className="pt-4">
              <Link
                to="/login"
                className="px-4 py-2 bg-primary text-background font-bold rounded-lg border-b-2 border-accent transition-all hover:bg-primary-hover inline-block"
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-medium">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/30 transition-all font-medium"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg shadow-md border-b-2 border-accent transition-all disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
