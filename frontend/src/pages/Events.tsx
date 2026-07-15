import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Clock, Tag, ChevronRight, Plus, Search, Filter } from 'lucide-react';

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
  status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  checkinEnabled: boolean;
  department?: { id: string; name: string } | null;
}

export const Events: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchEvents();
    fetchDepartments();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/events');
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await apiFetch('/departments');
      setDepartments(data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const getStatusBadge = (status: Event['status']) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-light text-gray-medium border border-gray-border';
      case 'PUBLISHED':
        return 'bg-accent-light text-accent-hover border border-accent/20';
      case 'ONGOING':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'COMPLETED':
        return 'bg-success-light text-success border border-success/20';
      case 'CANCELLED':
        return 'bg-danger-light text-danger border border-danger/20';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter events locally based on controls
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === '' || event.department?.id === selectedDept;
    const matchesStatus = selectedStatus === '' || event.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const canCreateEvent = user?.role === 'SUPER_ADMIN' || user?.role === 'DEPARTMENT_ADMIN';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary font-serif">Volunteer Events & Drives</h1>
          <p className="text-gray-medium text-sm">Coordinate, manage registrations, and check-in volunteers for active events</p>
        </div>
        
        {canCreateEvent && (
          <Link
            to="/dashboard/events/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg border-b-2 border-accent transition-all shadow-md self-start"
          >
            <Plus className="w-5 h-5" />
            <span>Create Event</span>
          </Link>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-border p-4 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <span className="absolute left-3 top-3 text-gray-medium">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium text-sm"
            placeholder="Search by event title, venue, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Department Filter (Only for Super Admin, as Department Admin is pre-filtered) */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="w-full md:w-64 relative">
            <span className="absolute left-3 top-3 text-gray-medium">
              <Filter className="w-4 h-4" />
            </span>
            <select
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium text-sm appearance-none"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        <div className="w-full md:w-48 relative">
          <span className="absolute left-3 top-3 text-gray-medium">
            <Filter className="w-4 h-4" />
          </span>
          <select
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium text-sm appearance-none"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-light text-danger rounded-xl border border-danger/10 text-sm">
          {error}
        </div>
      )}

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-medium text-sm">Loading events database...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-border">
          <Calendar className="w-12 h-12 text-gray-medium mx-auto mb-3" />
          <h3 className="text-lg font-bold text-primary font-serif">No Events Found</h3>
          <p className="text-gray-medium text-sm max-w-md mx-auto mt-1">There are no volunteer events matching your filter criteria at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const formattedDate = new Date(event.date).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            });

            return (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-soft border border-gray-border overflow-hidden hover:shadow-premium transition-all flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  {/* Status & Department */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-semibold bg-primary-light text-primary px-2.5 py-1 rounded">
                      {event.type}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getStatusBadge(event.status)}`}>
                      {event.status}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-lg font-bold text-primary font-serif line-clamp-1 hover:text-primary-hover">
                      <Link to={`/dashboard/events/${event.id}`}>{event.title}</Link>
                    </h3>
                    {event.department && (
                      <p className="text-[11px] font-semibold text-accent uppercase tracking-wider mt-0.5 truncate">
                        {event.department.name}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-medium text-sm line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>

                  {/* Metadata */}
                  <div className="space-y-2 pt-2 border-t border-gray-light text-xs text-gray-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-6 py-4 bg-background/30 border-t border-gray-light flex justify-between items-center">
                  <span className="text-xs text-gray-medium font-medium">
                    {event.checkinEnabled ? 'Self Check-in Open' : 'Self Check-in Closed'}
                  </span>
                  
                  <Link
                    to={`/dashboard/events/${event.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-accent transition-all"
                  >
                    <span>Manage</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
