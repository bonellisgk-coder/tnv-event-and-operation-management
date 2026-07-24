import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Users, 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Award,
  AlertTriangle
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

interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
  assignee?: { name: string } | null;
}

export const ManagerDashboard: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchManagerDashboardData();
  }, []);

  const fetchManagerDashboardData = async () => {
    try {
      setLoading(true);
      const [eventsData, volsData, tasksData] = await Promise.all([
        apiFetch('/events'),
        apiFetch('/auth/coordinators'), // Scoped by backend to department volunteers
        apiFetch('/tasks') // Scoped by backend to department tasks
      ]);
      setEvents(eventsData);
      setVolunteers(volsData);
      setTasks(tasksData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch department manager dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Event['status']) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'PUBLISHED':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
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

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === '' || e.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingTasksCount = tasks.filter(t => t.status !== 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-750 to-amber-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #78350F 0%, #B45309 100%)' }}>
        <div className="absolute right-0 bottom-0 opacity-10 translate-y-6 translate-x-6">
          <Calendar className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white font-bold text-xs uppercase tracking-wider px-2.5 py-1 rounded-full">
              Department Portal
            </span>
            <span className="bg-white/20 text-white font-bold text-xs uppercase tracking-wider px-2.5 py-1 rounded-full">
              {user?.departmentName || 'Coordinator'}
            </span>
          </div>
          <h1 className="text-3xl font-bold font-serif">Welcome, Dept Admin {user?.name}</h1>
          <p className="text-amber-100 text-sm max-w-xl">
            Manage events, allocate tasks to volunteers, inspect event check-in sheets, and build volunteer certificates.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Department Events */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft flex items-center justify-between hover:shadow-premium transition-all">
          <div className="space-y-1">
            <p className="text-gray-medium text-xs font-bold uppercase tracking-wider">Dept Events</p>
            <h3 className="text-3xl font-black text-gray-dark">{events.length}</h3>
            <p className="text-[10px] text-gray-medium">Scoped under your department</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Assigned Volunteers */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft flex items-center justify-between hover:shadow-premium transition-all">
          <div className="space-y-1">
            <p className="text-gray-medium text-xs font-bold uppercase tracking-wider">Volunteers</p>
            <h3 className="text-3xl font-black text-gray-dark">{volunteers.length}</h3>
            <p className="text-[10px] text-gray-medium">Under your department jurisdiction</p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft flex items-center justify-between hover:shadow-premium transition-all">
          <div className="space-y-1">
            <p className="text-gray-medium text-xs font-bold uppercase tracking-wider">Pending Tasks</p>
            <h3 className="text-3xl font-black text-gray-dark">{pendingTasksCount}</h3>
            <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Unresolved items</span>
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-sm">
          {error}
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3 width) - Department events */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-dark font-serif">Department Events Registry</h2>
                <p className="text-gray-medium text-xs">Verify scheduling, self check-in status, and volunteer rosters</p>
              </div>
              <Link
                to="/dashboard/events/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg text-sm shadow transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event</span>
              </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                />
              </div>

              <div className="w-40 relative">
                <span className="absolute left-3 top-2.5 text-gray-400">
                  <Filter className="w-3.5 h-3.5" />
                </span>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent bg-white appearance-none"
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

            {/* List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-amber-700 border-t-transparent rounded-full mb-2"></div>
                <p className="text-gray-medium text-xs">Loading department records...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-medium text-sm font-semibold">No records match filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-medium font-semibold text-xs uppercase bg-gray-50/50">
                      <th className="py-3 px-4">Event details</th>
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
                              <Calendar className="w-3 h-3 text-amber-700" />
                              {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-700" />
                              <span className="truncate max-w-[150px]">{e.venue}</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getStatusBadge(e.status)}`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/dashboard/events/${e.id}`}
                            className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline transition-all"
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

        {/* Right column (1/3 width) - Tasks & quick controls */}
        <div className="space-y-6">
          {/* Recent tasks list */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-dark font-serif">Task Distributions</h2>
              <p className="text-gray-medium text-xs">Recent active coordinate tasks</p>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin inline-block w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full mb-1"></div>
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-xs text-gray-medium text-center py-4">No tasks allocated yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {tasks.slice(0, 5).map(t => (
                  <div key={t.id} className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex flex-col gap-1">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-gray-dark truncate">{t.title}</span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.25 rounded ${
                        t.status === 'COMPLETED' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-medium">
                      <span>To: {t.assignee?.name || 'Unassigned'}</span>
                      <span>By: {new Date(t.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/dashboard/tasks"
              className="block text-center text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors pt-2 border-t border-gray-100"
            >
              Go to Task Manager
            </Link>
          </div>

          {/* Manager Quick links */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-dark font-serif">Quick Deploy Actions</h2>
            <div className="grid grid-cols-1 gap-2.5">
              <Link
                to="/dashboard/events/create"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-amber-250 hover:bg-amber-50 text-amber-700 font-bold text-xs transition-colors text-left"
              >
                <span>Publish Department Event</span>
                <Plus className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard/certificates"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-250 hover:bg-gray-50 text-gray-medium font-bold text-xs transition-colors text-left"
              >
                <span>Design Department Certificates</span>
                <Award className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
