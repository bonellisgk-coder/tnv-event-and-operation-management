import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/api';
import { 
  ArrowLeft, 
  Search, 
  UserCheck, 
  UserX, 
  FileSpreadsheet, 
  FileText, 
  Mail, 
  Users, 
  CheckCircle,
  Award
} from 'lucide-react';

interface AdditionalMember {
  id: string;
  name: string;
  email: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'PENDING' | 'PRESENT' | 'ABSENT';
  checkinAt: string | null;
  createdAt: string;
  additionalMembers: AdditionalMember[];
}

interface Event {
  id: string;
  title: string;
  slug: string;
  date: string;
  venue: string;
}

export const Attendance: React.FC = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { apiFetch } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingEmails, setSendingEmails] = useState(false);

  // Filters/Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      fetchParticipants();
    }
  }, [eventId, searchTerm, statusFilter, sortBy, sortOrder]);

  const fetchEventDetails = async () => {
    try {
      const data = await apiFetch(`/events/${eventId}`);
      setEvent(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      // Query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const data = await apiFetch(`/participants/event/${eventId}?${params.toString()}`);
      setParticipants(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load participants list');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'PRESENT' | 'ABSENT' | 'PENDING') => {
    try {
      await apiFetch(`/participants/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setSuccess('Participant status updated successfully');
      // Refresh list
      fetchParticipants();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Error updating status');
    }
  };

  const triggerGracePeriodEmails = async () => {
    if (!window.confirm('This will mark all remaining PENDING participants as ABSENT and dispatch notice emails. Proceed?')) {
      return;
    }

    try {
      setSendingEmails(true);
      setError('');
      setSuccess('');
      const data = await apiFetch('/participants/auto-email-absentees', {
        method: 'POST',
        body: JSON.stringify({ eventId }),
      });
      setSuccess(data.message || 'Grace period processed successfully');
      fetchParticipants();
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch warning emails');
    } finally {
      setSendingEmails(false);
    }
  };

  const downloadExcel = () => {
    triggerBlobDownload(`/exports/excel/${eventId}`, `Attendees-${event?.slug}.xlsx`);
  };

  const downloadPDF = () => {
    triggerBlobDownload(`/exports/pdf/${eventId}`, `Attendees-${event?.slug}.pdf`);
  };

  const triggerBlobDownload = async (endpoint: string, filename: string) => {
    try {
      const storedToken = localStorage.getItem('tnv_token');
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Download failed. Please try again.');
    }
  };

  const getStatusChip = (status: Participant['status']) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-success-light text-success font-semibold text-xs px-2.5 py-1 rounded-full border border-success/15';
      case 'ABSENT':
        return 'bg-danger-light text-danger font-semibold text-xs px-2.5 py-1 rounded-full border border-danger/15';
      default:
        return 'bg-gray-light text-gray-medium font-medium text-xs px-2.5 py-1 rounded-full border border-gray-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/dashboard/events/${eventId}`)}
          className="p-2 bg-white hover:bg-gray-light rounded-lg border border-gray-border text-primary transition-all shadow-soft"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary font-serif">
            {event ? event.title : 'Event Attendance'}
          </h1>
          <p className="text-gray-medium text-sm">
            Mark check-in attendance, process grace period emails, and export participant roster sheets
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-light text-danger rounded-xl border border-danger/10 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-success-light text-success rounded-xl border border-success/10 text-sm">
          {success}
        </div>
      )}

      {/* Roster actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search controls */}
        <div className="flex flex-1 min-w-[280px] max-w-md relative">
          <span className="absolute left-3 top-2.5 text-gray-medium">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white text-sm"
            placeholder="Search attendees by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Action button cluster */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Excel Export */}
          <button
            onClick={downloadExcel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-border text-gray-medium font-bold rounded-lg text-xs hover:bg-gray-light transition-all shadow-soft"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-700" />
            <span>Excel Sheet</span>
          </button>

          {/* PDF Report */}
          <button
            onClick={downloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-border text-gray-medium font-bold rounded-lg text-xs hover:bg-gray-light transition-all shadow-soft"
          >
            <FileText className="w-4 h-4 text-red-700" />
            <span>PDF Report</span>
          </button>

          {/* Grace Period trigger */}
          <button
            onClick={triggerGracePeriodEmails}
            disabled={sendingEmails}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg text-xs transition-all shadow-md"
          >
            <Mail className="w-4 h-4 text-accent" />
            <span>{sendingEmails ? 'Processing...' : 'Run Grace Period Job'}</span>
          </button>

          {/* Certificates setup */}
          <Link
            to={`/dashboard/certificates?eventId=${eventId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-primary font-bold hover:bg-accent-hover rounded-lg text-xs transition-all shadow-soft"
          >
            <Award className="w-4 h-4" />
            <span>Certificates Console</span>
          </Link>
        </div>
      </div>

      {/* Main Roster List */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary-light text-primary text-xs uppercase tracking-wider font-semibold border-b border-primary-mid">
                <th className="px-6 py-4">Attendee / Additional Members</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Registration Date</th>
                <th className="px-6 py-4 text-center">Check-in Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-light text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-medium">
                    Loading attendees roster...
                  </td>
                </tr>
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-medium font-medium">
                    No participants have registered for this event yet.
                  </td>
                </tr>
              ) : (
                participants.map((p) => {
                  const regDate = new Date(p.createdAt).toLocaleDateString('en-IN');
                  
                  return (
                    <React.Fragment key={p.id}>
                      {/* Main Participant Row */}
                      <tr className="hover:bg-background/20 font-medium">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">{p.name}</span>
                            {p.additionalMembers.length > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] bg-accent-light text-accent-hover font-bold px-1.5 py-0.5 rounded border border-accent/20">
                                <Users className="w-3 h-3" />
                                <span>+{p.additionalMembers.length}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-medium">{p.email}</td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-medium">{p.phone}</td>
                        <td className="px-6 py-4">{getStatusChip(p.status)}</td>
                        <td className="px-6 py-4 text-xs text-gray-medium">{regDate}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdateStatus(p.id, 'PRESENT')}
                              disabled={p.status === 'PRESENT'}
                              title="Mark Present"
                              className={`p-1.5 rounded-full border transition-all ${
                                p.status === 'PRESENT'
                                  ? 'bg-success-light text-success border-success/30 cursor-not-allowed'
                                  : 'bg-white border-gray-border text-gray-medium hover:text-success hover:border-success/30'
                              }`}
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleUpdateStatus(p.id, 'ABSENT')}
                              disabled={p.status === 'ABSENT'}
                              title="Mark Absent"
                              className={`p-1.5 rounded-full border transition-all ${
                                p.status === 'ABSENT'
                                  ? 'bg-danger-light text-danger border-danger/30 cursor-not-allowed'
                                  : 'bg-white border-gray-border text-gray-medium hover:text-danger hover:border-danger/30'
                              }`}
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Additional Members Sub-rows */}
                      {p.additionalMembers.map((m) => (
                        <tr key={m.id} className="bg-background/10 text-xs text-gray-medium">
                          <td className="pl-12 pr-6 py-2.5 border-l-4 border-accent">
                            <span className="font-semibold text-gray-dark">{m.name}</span>
                            <span className="ml-2 text-[10px] uppercase font-bold text-gray-medium tracking-wider bg-gray-light px-1.5 py-0.5 rounded">
                              Team Member
                            </span>
                          </td>
                          <td className="px-6 py-2.5 font-mono text-[11px]">{m.email}</td>
                          <td className="px-6 py-2.5 text-gray-medium font-mono">—</td>
                          <td className="px-6 py-2.5">
                            <span className="text-[10px] text-gray-medium font-medium bg-gray-light px-2 py-0.5 rounded-full">
                              linked status ({p.status})
                            </span>
                          </td>
                          <td className="px-6 py-2.5">—</td>
                          <td className="px-6 py-2.5 text-center text-gray-medium italic">
                            via primary check-in
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
