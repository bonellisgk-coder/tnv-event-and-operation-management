import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Trash2, Calendar, MapPin, Tag, QrCode } from 'lucide-react';

export const EventCreateEdit: React.FC = () => {
  const { id } = useParams(); // If present, we are in Edit mode
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user, apiFetch } = useAuth();

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'>('DRAFT');
  const [departmentId, setDepartmentId] = useState('');
  const [checkinEnabled, setCheckinEnabled] = useState(false);

  useEffect(() => {
    fetchDepartments();
    if (isEdit) {
      fetchEventData();
    }
  }, [id]);

  const fetchDepartments = async () => {
    try {
      const data = await apiFetch('/departments');
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/events/${id}`);
      setTitle(data.title);
      setDescription(data.description);
      // Format date to YYYY-MM-DD
      const dateObj = new Date(data.date);
      const formattedDate = dateObj.toISOString().split('T')[0];
      setDate(formattedDate);
      setStartTime(data.startTime);
      setEndTime(data.endTime);
      setVenue(data.venue);
      setType(data.type);
      setStatus(data.status);
      setDepartmentId(data.departmentId || '');
      setCheckinEnabled(data.checkinEnabled);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch event details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date || !startTime || !endTime || !venue || !type) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      title,
      description,
      date,
      startTime,
      endTime,
      venue,
      type,
      status,
      departmentId: departmentId || null,
      checkinEnabled
    };

    try {
      if (isEdit) {
        await apiFetch(`/events/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/events', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error saving event details');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This will also delete all registrations.')) {
      return;
    }

    try {
      await apiFetch(`/events/${id}`, {
        method: 'DELETE',
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
    }
  };

  const downloadQrCard = () => {
    if (!id) return;
    const url = `http://localhost:4000/api/events/${id}/qr-card`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 bg-white hover:bg-gray-light rounded-lg border border-gray-border text-primary transition-all shadow-soft"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary font-serif">
            {isEdit ? 'Modify Event Details' : 'Organize New Event'}
          </h1>
          <p className="text-gray-medium text-sm">
            {isEdit ? 'Update metadata, set check-in status, or download branding materials' : 'Configure a volunteer drive and set up public registration'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-light text-danger rounded-xl border border-danger/10 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-medium text-sm">Loading event configs...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-soft border border-gray-border p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Event Title */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-2">Event Title *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium"
                    placeholder="e.g. Marina Beach Mega Cleanup Drive"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-2">Event Type / Classification *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium"
                    placeholder="e.g. Environmental Cleanup, Medical Relief"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  />
                </div>

                {/* Department Dropdown */}
                {user?.role === 'SUPER_ADMIN' ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-2">Host Department *</label>
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                    >
                      <option value="">General (No specific department)</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-2">Host Department</label>
                    <input
                      type="text"
                      disabled
                      className="w-full px-4 py-3 rounded-lg border border-gray-border bg-gray-light text-gray-medium font-medium outline-none"
                      value={user?.departmentName || 'Your Assigned Department'}
                    />
                  </div>
                )}

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-2">Event Date *</label>
                  <div className="relative">
                    <span className="absolute right-3 top-3.5 text-gray-medium">
                      <Calendar className="w-5 h-5" />
                    </span>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Timings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-2">Start Time *</label>
                    <input
                      type="time"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-2">End Time *</label>
                    <input
                      type="time"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Venue */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-2">Venue / Location Address *</label>
                  <div className="relative">
                    <span className="absolute right-3 top-3.5 text-gray-medium">
                      <MapPin className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium"
                      placeholder="e.g. Gandhi Statue, Marina Beach Road, Chennai"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-2">Description & Volunteer Duties *</label>
                  <textarea
                    rows={4}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium text-sm leading-relaxed"
                    placeholder="Provide details about the event, what duties volunteers will perform, what we provide (certificates, lunch etc.) and contact info."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-gray-light flex flex-wrap justify-between items-center gap-4">
                {isEdit && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-3 rounded-lg border border-danger hover:bg-danger-light text-danger font-bold text-sm transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Event</span>
                  </button>
                )}

                <div className="flex items-center gap-4 ml-auto">
                  <Link
                    to="/dashboard"
                    className="px-5 py-3 rounded-lg border border-gray-border text-gray-medium font-bold hover:bg-gray-light text-sm transition-all"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg shadow-md border-b-2 border-accent transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Event'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar Operations Panel (Only in Edit mode) */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-soft border border-gray-border p-6 space-y-6">
              <h3 className="font-serif font-bold text-primary text-lg pb-2 border-b border-gray-light">
                Event Controls
              </h3>

              {/* Status Select */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider">Event Lifecycle Status</label>
                <select
                  className="w-full px-4 py-3 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published (Open for registrations)</option>
                  <option value="ONGOING">Ongoing (Event is running)</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* QR Self-Check-in Toggle */}
              <div className="flex items-center justify-between p-3 bg-background/30 rounded-lg border border-gray-light">
                <div>
                  <span className="block text-xs font-bold text-primary uppercase tracking-wider">Self Check-in</span>
                  <span className="text-[10px] text-gray-medium font-medium">Allow volunteers to scan QR code</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={checkinEnabled}
                    onChange={(e) => setCheckinEnabled(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Asset Generation / Downloads */}
              {isEdit && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-gray-medium uppercase tracking-wider">Coordinator Assets</h4>
                  
                  <button
                    onClick={downloadQrCard}
                    className="w-full py-3 bg-white hover:bg-gray-light text-primary font-bold border border-primary border-opacity-35 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-soft"
                  >
                    <QrCode className="w-4 h-4 text-accent" />
                    <span>Download QR Card (PNG)</span>
                  </button>

                  <Link
                    to={`/dashboard/events/${id}/attendance`}
                    className="w-full py-3 bg-accent text-primary font-bold hover:bg-accent-hover rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-soft text-center"
                  >
                    <span>Manage Attendance & List</span>
                  </Link>

                  <a
                    href={`/events/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}/register`}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full py-3 bg-primary bg-opacity-5 hover:bg-opacity-10 text-primary font-bold rounded-lg text-xs transition-all text-center border border-dashed border-primary"
                  >
                    Open Public Registration Page
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
