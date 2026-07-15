import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Award, CheckCircle, ShieldAlert, Plus, Trash2 } from 'lucide-react';

export const EditRegistration: React.FC = () => {
  const { apiFetch } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [additionalMembers, setAdditionalMembers] = useState<{ name: string; email: string }[]>([]);
  const [eventTitle, setEventTitle] = useState('');

  useEffect(() => {
    if (token) {
      fetchRegistrationDetails();
    } else {
      setError('Registration edit token is missing. Please check your confirmation email link.');
      setLoading(false);
    }
  }, [token]);

  const fetchRegistrationDetails = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/participants/edit/${token}`);
      setName(data.name);
      setEmail(data.email);
      setPhone(data.phone);
      setAdditionalMembers(data.additionalMembers || []);
      setEventTitle(data.event.title);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired registration link');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    setAdditionalMembers([...additionalMembers, { name: '', email: '' }]);
  };

  const handleRemoveMember = (index: number) => {
    const updated = [...additionalMembers];
    updated.splice(index, 1);
    setAdditionalMembers(updated);
  };

  const handleMemberChange = (index: number, field: 'name' | 'email', value: string) => {
    const updated = [...additionalMembers];
    updated[index][field] = value;
    setAdditionalMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      setError('Please fill in name, email, and phone number fields');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      await apiFetch(`/participants/edit/${token}`, {
        method: 'PUT',
        body: JSON.stringify({
          name,
          email,
          phone,
          additionalMembers: additionalMembers.filter(m => m.name && m.email)
        }),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to update registration');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-4">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
        <p className="text-gray-medium text-sm">Fetching registration credentials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-4">
        <div className="bg-white rounded-xl border border-gray-border shadow-soft p-8 max-w-md text-center">
          <ShieldAlert className="w-12 h-12 text-danger mx-auto mb-3" />
          <h2 className="text-xl font-bold text-primary font-serif">Invalid Link</h2>
          <p className="text-gray-medium text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col py-12 px-4 justify-between items-center">
      <div className="text-center mb-8">
        <div className="inline-flex justify-center items-center w-14 h-14 rounded-full bg-primary text-accent mb-3 border border-accent">
          <Award className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-primary font-serif">தமிழ்நாடு தன்னார்வலர்கள்</h1>
        <p className="text-accent font-sans font-bold tracking-widest text-[10px] uppercase mt-0.5">Manage Registration</p>
      </div>

      <div className="w-full max-w-xl bg-white rounded-xl shadow-premium border border-gray-border p-8">
        <div className="border-b border-gray-light pb-4 mb-6">
          <h2 className="text-xl font-bold text-primary font-serif">Edit Your Registration Details</h2>
          <p className="text-xs text-gray-medium mt-0.5">Event: <strong className="text-gray-dark font-semibold">{eventTitle}</strong></p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-danger-light text-danger rounded-lg text-xs flex items-center gap-2 border border-danger/10">
            <ShieldAlert className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-success-light text-success rounded-lg text-xs flex items-center gap-2 border border-success/15 font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>Registration updated successfully! Confirmation dispatched.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-1">Mobile Number</label>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Group members */}
          <div className="space-y-4 pt-4 border-t border-gray-light">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-primary text-base">
                Additional Team Members
              </h3>
              <button
                type="button"
                onClick={handleAddMember}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-accent transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>

            {additionalMembers.length > 0 && (
              <div className="space-y-3">
                {additionalMembers.map((m, index) => (
                  <div key={index} className="flex gap-3 items-end bg-background/10 p-3 rounded-lg border border-gray-light">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-medium uppercase mb-1">Member Name</label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-1.5 rounded border border-gray-border text-xs focus:ring-1 focus:ring-primary outline-none"
                          placeholder="Member name"
                          value={m.name}
                          onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-medium uppercase mb-1">Member Email</label>
                        <input
                          type="email"
                          required
                          className="w-full px-3 py-1.5 rounded border border-gray-border text-xs focus:ring-1 focus:ring-primary outline-none"
                          placeholder="member@example.com"
                          value={m.email}
                          onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMember(index)}
                      className="p-2 text-danger hover:bg-danger-light rounded transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-light flex justify-end gap-4">
            <button
              type="submit"
              disabled={updating}
              className="w-full md:w-auto px-6 py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg border-b-2 border-accent transition-all disabled:opacity-50 text-sm shadow-md"
            >
              {updating ? 'Updating...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </div>

      <div className="text-center mt-8 text-xs text-gray-medium font-medium">
        Youth Welfare and Sports Development Department, Government of Tamil Nadu.
      </div>
    </div>
  );
};
