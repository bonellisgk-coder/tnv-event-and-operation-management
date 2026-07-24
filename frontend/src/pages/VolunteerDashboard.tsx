import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  CheckSquare, 
  Clock, 
  MapPin, 
  QrCode, 
  Camera,
  CheckCircle,
  Briefcase,
  AlertCircle
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
  checkinEnabled: boolean;
  department?: { id: string; name: string } | null;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  deadline: string;
}

export const VolunteerDashboard: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [taskSuccessMessage, setTaskSuccessMessage] = useState('');

  useEffect(() => {
    fetchVolunteerDashboardData();
  }, []);

  const fetchVolunteerDashboardData = async () => {
    try {
      setLoading(true);
      const [eventsData, tasksData] = await Promise.all([
        apiFetch('/events'),
        apiFetch('/tasks') // Backend scopes this to assigneeId === userId
      ]);
      setEvents(eventsData);
      setTasks(tasksData);
    } catch (err: any) {
      setError(err.message || 'Failed to load volunteer workspace details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      setUpdatingTaskId(taskId);
      setError('');
      setTaskSuccessMessage('');

      const updated = await apiFetch(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      // Update local state
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      setTaskSuccessMessage('Task status updated successfully!');
      setTimeout(() => setTaskSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border border-rose-250 font-bold';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border border-amber-250 font-bold';
      case 'LOW':
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200 font-bold';
    }
  };

  const completedTasksCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Greeting Header Banner */}
      <div className="bg-gradient-to-r from-sky-800 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #075985 0%, #3730A3 100%)' }}>
        <div className="absolute right-0 bottom-0 opacity-10 translate-y-6 translate-x-6">
          <Briefcase className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white font-bold text-xs uppercase tracking-wider px-2.5 py-1 rounded-full">
              Volunteer Workspace
            </span>
            <span className="bg-white/20 text-white font-bold text-xs uppercase tracking-wider px-2.5 py-1 rounded-full">
              {user?.departmentName || 'State Volunteer'}
            </span>
          </div>
          <h1 className="text-3xl font-bold font-serif">Vanakkam, {user?.name}!</h1>
          <p className="text-sky-100 text-sm max-w-xl">
            Track your assigned event tasks, update statuses, and access your event check-in scanner portal.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft flex items-center justify-between hover:shadow-premium transition-all">
          <div className="space-y-1">
            <p className="text-gray-medium text-xs font-bold uppercase tracking-wider">Assigned Tasks</p>
            <h3 className="text-3xl font-black text-gray-dark">{tasks.length}</h3>
            <p className="text-[10px] text-gray-medium">Assigned by department admins</p>
          </div>
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft flex items-center justify-between hover:shadow-premium transition-all">
          <div className="space-y-1">
            <p className="text-gray-medium text-xs font-bold uppercase tracking-wider">Completed Tasks</p>
            <h3 className="text-3xl font-black text-gray-dark text-emerald-600">{completedTasksCount}</h3>
            <p className="text-[10px] text-gray-medium">Marked completed</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-soft flex items-center justify-between hover:shadow-premium transition-all">
          <div className="space-y-1">
            <p className="text-gray-medium text-xs font-bold uppercase tracking-wider">Pending Work</p>
            <h3 className="text-3xl font-black text-gray-dark text-amber-600">{pendingTasksCount}</h3>
            <p className="text-[10px] text-gray-medium">Require action status</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-sm">
          {error}
        </div>
      )}

      {taskSuccessMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs font-semibold">
          {taskSuccessMessage}
        </div>
      )}

      {/* Main workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width) - Tasks checklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-6 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-dark font-serif">My Assigned Tasks Checklist</h2>
              <p className="text-gray-medium text-xs">Update your task statuses interactively to alert coordinators</p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-800 border-t-transparent rounded-full mb-2"></div>
                <p className="text-gray-medium text-xs">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
                <CheckSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-medium text-sm font-semibold">No tasks assigned to you</p>
                <p className="text-gray-medium text-xs mt-1">If there are duties, your department administrator will allocate them.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {tasks.map(t => (
                  <div 
                    key={t.id} 
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                      t.status === 'COMPLETED' 
                        ? 'bg-emerald-50/20 border-emerald-150 shadow-sm opacity-80' 
                        : 'bg-white border-gray-200 hover:border-indigo-300 shadow-soft'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-bold ${t.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-dark'}`}>
                          {t.title}
                        </h4>
                        <span className={`text-[9px] px-1.5 py-0.25 rounded uppercase tracking-wider ${getPriorityBadge(t.priority)}`}>
                          {t.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-medium leading-relaxed">{t.description}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-medium">
                        <Clock className="w-3.5 h-3.5 text-indigo-700" />
                        <span>Deadline: {new Date(t.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-bold text-gray-medium uppercase tracking-wider">Status:</label>
                      <select
                        value={t.status}
                        onChange={e => handleStatusChange(t.id, e.target.value as Task['status'])}
                        disabled={updatingTaskId === t.id}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white ${
                          t.status === 'COMPLETED' 
                            ? 'text-emerald-700 border-emerald-250 bg-emerald-50/40' 
                            : t.status === 'IN_PROGRESS'
                            ? 'text-blue-700 border-blue-250 bg-blue-50/40'
                            : 'text-gray-medium border-gray-250'
                        }`}
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3 width) - Service events & Scanner duty */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-dark font-serif">Service Events</h2>
              <p className="text-gray-medium text-xs">Verify schedules and scanner coordinates</p>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin inline-block w-4 h-4 border-2 border-indigo-800 border-t-transparent rounded-full mb-1"></div>
              </div>
            ) : events.length === 0 ? (
              <p className="text-xs text-gray-medium text-center py-4">No active events found.</p>
            ) : (
              <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                {events.map(e => {
                  const isOngoing = e.status === 'ONGOING';
                  const isCheckinActive = e.checkinEnabled && isOngoing;

                  return (
                    <div 
                      key={e.id} 
                      className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${
                        isCheckinActive 
                          ? 'border-indigo-400 bg-indigo-50/10 shadow' 
                          : 'border-gray-250 bg-gray-50/40'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs font-bold text-gray-dark line-clamp-1">{e.title}</span>
                          {isCheckinActive ? (
                            <span className="flex items-center gap-1 text-[9px] font-black text-rose-600 animate-pulse bg-rose-50 border border-rose-200 px-1.5 py-0.25 rounded uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              Scanner Duty Live
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-gray-medium bg-white border border-gray-250 px-1.5 py-0.25 rounded uppercase">
                              {e.status}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-medium font-semibold uppercase">{e.department?.name || 'General'}</p>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-1 text-[10px] text-gray-medium pt-1.5 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-700" />
                          <span>{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-700" />
                          <span className="truncate">{e.venue}</span>
                        </div>
                      </div>

                      {/* Scanner button */}
                      {isCheckinActive && (
                        <Link
                          to={`/dashboard/events/${e.id}/scan`}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 bg-indigo-800 hover:bg-indigo-900 text-white font-bold rounded-lg text-xs shadow transition-all"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Open Scanner Portal</span>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
