import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Clock, Plus, Trash2, Award, CheckCircle, ShieldAlert } from 'lucide-react';

interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  type: string;
  department?: { name: string } | null;
}

export const PublicRegister: React.FC = () => {
  const { slug } = useParams();
  const { apiFetch } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [additionalMembers, setAdditionalMembers] = useState<{ name: string; email: string }[]>([]);

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
      setError(err.message || 'Event not found or closed for registration');
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
      setError('Please fill in your name, email, and phone number');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await apiFetch('/participants/register', {
        method: 'POST',
        body: JSON.stringify({
          eventId: event?.id,
          name,
          email,
          phone,
          additionalMembers: additionalMembers.filter(m => m.name && m.email)
        }),
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. A user with this email or phone is already registered.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-4">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
        <p className="text-gray-medium text-sm">Loading event registration page...</p>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-4">
        <div className="bg-white rounded-xl border border-gray-border shadow-soft p-8 max-w-md text-center">
          <ShieldAlert className="w-12 h-12 text-danger mx-auto mb-3" />
          <h2 className="text-xl font-bold text-primary font-serif">Registration Closed</h2>
          <p className="text-gray-medium text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const formattedDate = event ? new Date(event.date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) : '';

  return (
    <div className="min-h-screen bg-background flex flex-col py-12 px-4 justify-between items-center">
      {/* Brand Logo Header */}
      <div className="text-center mb-8">
        <div className="inline-flex justify-center items-center w-14 h-14 rounded-full bg-primary text-accent mb-3 border border-accent">
          <Award className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-primary font-serif">தமிழ்நாடு தன்னார்வலர்கள்</h1>
        <p className="text-accent font-sans font-bold tracking-widest text-[10px] uppercase mt-0.5">Volunteer Registration Portal</p>
      </div>

      {success ? (
        <div className="w-full max-w-xl bg-white rounded-xl shadow-premium border border-gray-border p-8 text-center space-y-6">
          <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-success-light text-success mb-2 border border-success/25">
            <CheckCircle className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold text-primary font-serif">Registration Confirmed!</h2>
          <p className="text-gray-medium text-sm leading-relaxed">
            Vanakkam <strong className="text-gray-dark">{name}</strong>. Your registration for <strong className="text-gray-dark">{event?.title}</strong> is confirmed.
          </p>

          <div className="p-4 bg-background/40 rounded-lg text-xs text-gray-medium space-y-2 border border-gray-light text-left max-w-md mx-auto font-medium">
            <p>1. A confirmation email has been dispatched to <strong className="text-gray-dark">{email}</strong>.</p>
            <p>2. The email contains a secure edit link to update your details or register team members.</p>
            <p>3. Dynamic check-in QR credentials have been generated and sent to you.</p>
          </div>

          <div className="pt-4 border-t border-gray-light text-center">
            <p className="text-xs text-gray-medium">Thank you for stepping forward to serve your state.</p>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-premium border border-gray-border overflow-hidden">
          {/* Top banner summary */}
          <div className="bg-primary-light text-primary p-6 border-b-2 border-primary-mid">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-accent text-primary px-2 py-0.5 rounded mb-2">
              {event?.type}
            </span>
            <h2 className="text-2xl font-bold text-primary font-serif leading-tight">
              {event?.title}
            </h2>
            {event?.department && (
              <p className="text-xs text-accent font-semibold tracking-wider uppercase mt-1">
                {event.department.name}
              </p>
            )}
          </div>

          {/* Event description block */}
          <div className="p-6 bg-background/25 border-b border-gray-light grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-medium font-semibold">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{event?.startTime} - {event?.endTime}</span>
            </div>
            <div className="flex items-center gap-2 md:col-span-1">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="truncate">{event?.venue}</span>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="text-xs text-gray-medium leading-relaxed bg-background/20 p-4 rounded-lg border border-gray-light">
              <strong className="text-primary block text-sm font-serif mb-1">About the Event:</strong>
              {event?.description}
            </div>

            {error && (
              <div className="p-3 bg-danger-light text-danger rounded-lg text-xs flex items-center gap-2 border border-danger/10">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="font-serif font-bold text-primary text-lg pb-1.5 border-b border-gray-light">
                Primary Registrant Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/15 font-medium text-sm"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/15 font-medium text-sm"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/15 font-medium text-sm"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Additional Group Members section */}
              <div className="space-y-4 pt-4 border-t border-gray-light">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-primary text-base">
                    Register Additional Team Members
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

                {additionalMembers.length === 0 ? (
                  <p className="text-xs text-gray-medium italic">No additional team members added. Add members if you are registering as a group.</p>
                ) : (
                  <div className="space-y-3">
                    {additionalMembers.map((m, index) => (
                      <div key={index} className="flex gap-3 items-end bg-background/10 p-3 rounded-lg border border-gray-light">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-medium uppercase mb-1">Member Name *</label>
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
                            <label className="block text-[10px] font-semibold text-gray-medium uppercase mb-1">Member Email *</label>
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

              {/* Submit Row */}
              <div className="pt-4 border-t border-gray-light text-right">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full md:w-auto px-6 py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg shadow-md border-b-2 border-accent transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {submitting ? 'Submitting Registration...' : 'Submit Volunteer Registration'}
                </button>
              </div>
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
