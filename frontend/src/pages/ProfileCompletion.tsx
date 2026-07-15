import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Phone, CheckCircle, ShieldAlert } from 'lucide-react';

export const ProfileCompletion: React.FC = () => {
  const { user, updateUser, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Both name and mobile number are required to activate your account');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/auth/profile/complete', {
        method: 'POST',
        body: JSON.stringify({ name, phone }),
      });

      // Update auth context state
      updateUser(data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background py-12">
      <div className="text-center mb-6">
        <img
          src="/logo.png"
          alt="Tamil Nadu Volunteers Logo"
          className="w-20 h-20 object-contain mx-auto mb-4 drop-shadow-md rounded-full bg-white p-1 border border-gray-border"
        />
        <h1 className="text-3xl font-bold text-primary font-serif">Complete Your Profile</h1>
        <p className="text-gray-medium text-sm mt-1">Please verify and update your information before entering the portal</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-xl shadow-premium border border-gray-border p-8">
        {error && (
          <div className="mb-6 p-3 bg-danger-light text-danger rounded-lg text-sm flex items-center gap-2 border border-danger/20">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-gray-medium">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/30 transition-all font-medium"
                placeholder="Thiru. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-2">Mobile Number (10 digits)</label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-gray-medium">
                <Phone className="w-5 h-5" />
              </span>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/30 transition-all font-medium"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-medium mt-1">This number will be used for SMS notifications and QR code check-ins.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg shadow-md border-b-2 border-accent transition-all disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? 'Saving details...' : 'Complete Profile & Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};
