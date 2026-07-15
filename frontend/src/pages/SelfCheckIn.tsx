import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Award, CheckCircle, ShieldAlert } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  slug: string;
  venue: string;
  date: string;
}

export const SelfCheckIn: React.FC = () => {
  const { slug } = useParams();
  const { apiFetch } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [checkedName, setCheckedName] = useState('');

  useEffect(() => {
    if (slug) {
      fetchEventDetails();
    }
  }, [slug]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/events/public/${slug}`);
      setEvent(data);
    } catch (err: any) {
      setError(err.message || 'Event not found or closed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email or phone number');
      return;
    }

    setCheckingIn(true);
    setError('');

    try {
      const data = await apiFetch('/participants/self-checkin', {
        method: 'POST',
        body: JSON.stringify({
          slug,
          identifier: identifier.trim()
        }),
      });

      setCheckedName(data.participant.name);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Self check-in failed. Please verify your email/phone or register.');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-4">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
        <p className="text-gray-medium text-sm">Preparing check-in terminal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col py-12 px-4 justify-between items-center">
      {/* Platform Branding Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex justify-center items-center w-14 h-14 rounded-full bg-primary text-accent mb-3 border border-accent">
          <Award className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-primary font-serif">தமிழ்நாடு தன்னார்வலர்கள்</h1>
        <p className="text-accent font-sans font-bold tracking-widest text-[10px] uppercase mt-0.5">Self Check-In Portal</p>
      </div>

      {success ? (
        <div className="w-full max-w-md bg-white rounded-xl shadow-premium border border-gray-border p-8 text-center space-y-6">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-success-light text-success mb-2 border border-success/25">
            <CheckCircle className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-primary font-serif">Check-In Successful!</h2>
          <p className="text-sm font-semibold text-gray-dark leading-relaxed">
            Vanakkam <strong className="text-primary">{checkedName}</strong>. Your attendance for the event <strong className="text-gray-dark">{event?.title}</strong> is marked present.
          </p>

          <p className="text-xs text-gray-medium">You can close this window now. Thank you for your service!</p>
        </div>
      ) : (
        <div className="w-full max-w-md bg-white rounded-xl shadow-premium border border-gray-border overflow-hidden">
          {/* Header banner */}
          <div className="bg-primary-light text-primary p-6 border-b-2 border-primary-mid text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-accent text-primary px-2.5 py-0.5 rounded block w-max mx-auto mb-2">
              Attendance Terminal
            </span>
            <h2 className="text-2xl font-bold text-primary font-serif leading-tight">
              {event?.title}
            </h2>
            <p className="text-xs text-gray-medium mt-1 font-medium">{event?.venue}</p>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {error && (
              <div className="p-3 bg-danger-light text-danger rounded-lg text-xs flex items-center gap-2 border border-danger/10">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="font-serif font-bold text-primary text-lg text-center mb-1">Verify Your Registration</h3>
                <p className="text-gray-medium text-center text-xs mb-6">Enter your registered email address or phone number to confirm check-in</p>

                <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-2">Email or Phone Number</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium text-sm"
                  placeholder="e.g. volunteer@example.com or 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={checkingIn}
                />
              </div>

              <button
                type="submit"
                disabled={checkingIn}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg shadow-md border-b-2 border-accent transition-all disabled:opacity-50 flex justify-center items-center text-sm"
              >
                {checkingIn ? 'Verifying...' : 'Confirm My Attendance'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer credits */}
      <div className="text-center mt-8 text-xs text-gray-medium font-medium">
        Youth Welfare and Sports Development Department, Government of Tamil Nadu.
      </div>
    </div>
  );
};
