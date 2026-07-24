import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Users, 
  Building, 
  ShieldCheck, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  Clock, 
  MapPin,
  TrendingUp
} from 'lucide-react';

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
  department?: { id: string; name: string } | null;
}

interface Department {
  id: string;
  name: string;
}

interface Volunteer {
  id: string;
  name: string;
  role: string;
  department?: { name: string } | null;
}

export const AdminDashboard: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [eventsData, deptsData, volsData] = await Promise.all([
        apiFetch('/events'),
        apiFetch('/departments'),
        apiFetch('/auth/coordinators') // Fetches volunteers & dept admins
      ]);
      setEvents(eventsData);
      setDepartments(deptsData);
      setVolunteers(volsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch administrator dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Event['status']) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'PUBLISHED':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'ONGOING':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'COMPLETED':
        return 'bg-teal-50 text-teal-700 border border-teal-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  // Filter lists
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === '' || e.department?.id === selectedDept;
    const matchesStatus = selectedStatus === '' || e.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const totalVolunteersCount = volunteers.filter(v => v.role === 'VOLUNTEER').length;

  return (
    <div className="space-y-6">
      {/* Header Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-y-6 translate-x-6">
          <ShieldCheck className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white font-bold text-xs uppercase tracking-wider px-2.5 py-1 rounded-full">
              System Admin Console
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-200 text-xs font-semibold">Active Session</span>
          </div>
          <h1 className="text-3xl font-bold font-serif">Welcome back, {user?.name}</h1>
          <p className="text-emerald-100 text-sm max-w-xl">
            State-level coordination control active. Monitor events, analyze deployment metrics, and manage departments.
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Events */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft flex items-center justify-between hover:shadow-premium transition-all">
          <div className="space-y-1">
            <p className="text-gray-medium text-xs font-bold uppercase tracking-wider">Total Events</p>
            <h3 className="text-3xl font-black text-gray-dark">{events.length}</h3>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Statewide active drives</span>
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Total Volunteers */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft flex items-center justify-between hover:shadow-premium transition-all">
          <div className="space-y-1">
            <p className="text-gray-medium text-xs font-bold uppercase tracking-wider">Volunteers</p>
            <h3 className="text-3xl font-black text-gray-dark">{totalVolunteersCount}</h3>
            <p className="text-[10px] text-gray-medium">Registered coordinators</p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Departments */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft flex items-center justify-between hover:shadow-premium transition-all">
          <div className="space-y-1">
            <p className="text-gray-medium text-xs font-bold uppercase tracking-wider">Departments</p>
            <h3 className="text-3xl font-black text-gray-dark">{departments.length}</h3>
            <p className="text-[10px] text-gray-medium">Govt agencies onboarded</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Building className="w-6 h-6" />
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft flex items-center justify-between hover:shadow-premium transition-all">
          <div className="space-y-1">
            <p className="text-gray-medium text-xs font-bold uppercase tracking-wider">Network Server</p>
            <h3 className="text-xl font-bold text-emerald-600">OPERATIONAL</h3>
            <p className="text-[10px] text-gray-medium">Response latency: Normal</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-sm">
          {error}
        </div>
      )}

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Section: Event Coordination Hub */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-dark font-serif">State Event Registry</h2>
                <p className="text-gray-medium text-xs">Verify schedule and coordination statuses of active events</p>
              </div>
              <Link
                to="/dashboard/events/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-sm shadow transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event</span>
              </Link>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                />
              </div>

              {/* Dept select */}
              <div className="w-full sm:w-48 relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Filter className="w-3.5 h-3.5" />
                </span>
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent bg-white appearance-none"
                >
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Status select */}
              <div className="w-full sm:w-36 relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Filter className="w-3.5 h-3.5" />
                </span>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent bg-white appearance-none"
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

            {/* List Table */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-emerald-800 border-t-transparent rounded-full mb-2"></div>
                <p className="text-gray-medium text-xs">Fetching event records...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-medium text-sm font-semibold">No records match criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-medium font-semibold text-xs uppercase bg-gray-50/50">
                      <th className="py-3 px-4">Event Details</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEvents.map(e => (
                      <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-dark line-clamp-1">{e.title}</div>
                          <div className="flex items-center gap-3 text-gray-medium text-[11px] mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-emerald-700" />
                              {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-700" />
                              <span className="truncate max-w-[120px]">{e.venue}</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-semibold text-gray-medium max-w-[150px] truncate block">
                            {e.department?.name || 'General'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getStatusBadge(e.status)}`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/dashboard/events/${e.id}`}
                            className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline transition-all"
                          >
                            <span>Manage</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Quick Links & Departments List */}
        <div className="space-y-6">
          {/* Departments list */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-dark font-serif">Departments</h2>
              <p className="text-gray-medium text-xs">Active agencies and department mappings</p>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin inline-block w-4 h-4 border-2 border-emerald-800 border-t-transparent rounded-full mb-1"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {departments.map(d => {
                  const eventsCount = events.filter(e => e.department?.id === d.id).length;
                  return (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50/70 border border-gray-150 rounded-xl hover:bg-gray-50 transition-colors">
                      <span className="text-xs font-bold text-gray-dark truncate max-w-[150px]">{d.name}</span>
                      <span className="text-[10px] bg-white text-gray-medium font-bold border border-gray-250 px-2 py-0.5 rounded-full">
                        {eventsCount} {eventsCount === 1 ? 'event' : 'events'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-dark font-serif font-serif">Quick Operations</h2>
            <div className="grid grid-cols-1 gap-2.5">
              <Link
                to="/dashboard/events/create"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-emerald-250 hover:bg-emerald-50 text-emerald-800 font-bold text-xs transition-colors text-left"
              >
                <span>Deploy New Voluntarism Event</span>
                <Plus className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard/tasks"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-250 hover:bg-gray-50 text-gray-medium font-bold text-xs transition-colors text-left"
              >
                <span>Task Distribution & Tracking</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard/certificates"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-250 hover:bg-gray-50 text-gray-medium font-bold text-xs transition-colors text-left"
              >
                <span>Design Certificate Templates</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
