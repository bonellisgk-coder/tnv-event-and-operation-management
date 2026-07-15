import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, CheckSquare, Clock, AlertTriangle, CheckCircle, ShieldAlert, X } from 'lucide-react';

interface User {
  id: string;
  name: string;
  role: string;
  department?: { name: string } | null;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  deadline: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export const Tasks: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Task creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTasks();
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'DEPARTMENT_ADMIN') {
      fetchCoordinators();
    }
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/tasks');
      setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoordinators = async () => {
    try {
      const data = await apiFetch('/auth/coordinators');
      setCoordinators(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      await apiFetch(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setSuccess('Task progress updated');
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDesc || !taskDeadline) {
      setError('Please fill in title, description, and deadline fields');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          assigneeId: taskAssignee || null,
          priority: taskPriority,
          deadline: taskDeadline
        }),
      });

      setSuccess('New task successfully assigned and email notification triggered');
      setShowCreateModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskAssignee('');
      setTaskPriority('MEDIUM');
      setTaskDeadline('');
      
      fetchTasks();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
      setSuccess('Task deleted');
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'text-danger bg-danger-light border-danger/10';
      case 'MEDIUM':
        return 'text-accent-hover bg-accent-light border-accent/15';
      case 'LOW':
        return 'text-gray-medium bg-gray-light border-gray-border';
      default:
        return 'text-gray-medium bg-gray-light';
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'TODO': return 'To Do';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
    }
  };

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'DEPARTMENT_ADMIN';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary font-serif">Task Coordination Roster</h1>
          <p className="text-gray-medium text-sm">Assign, track, and execute operations tasks for volunteer drives</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg border-b-2 border-accent transition-all shadow-md self-start"
          >
            <Plus className="w-5 h-5" />
            <span>Assign Task</span>
          </button>
        )}
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

      {/* Tasks listing */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-medium text-sm">Loading coordination tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-border">
          <CheckSquare className="w-12 h-12 text-gray-medium mx-auto mb-3" />
          <h3 className="text-lg font-bold text-primary font-serif">No Tasks Assigned</h3>
          <p className="text-gray-medium text-sm max-w-md mx-auto mt-1">There are no volunteer coordination tasks currently listed on your board.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((task) => {
            const formattedDeadline = new Date(task.deadline).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return (
              <div 
                key={task.id}
                className="bg-white rounded-xl border border-gray-border shadow-soft overflow-hidden p-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Status & Priority Badge */}
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                      {task.priority} Priority
                    </span>
                    <select
                      className="text-xs bg-background hover:bg-gray-light border border-gray-border font-bold px-2.5 py-1 rounded outline-none cursor-pointer text-primary"
                      value={task.status}
                      onChange={(e) => handleUpdateStatus(task.id, e.target.value as any)}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>

                  {/* Task Metadata */}
                  <div>
                    <h3 className={`text-lg font-bold text-primary font-serif ${task.status === 'COMPLETED' ? 'line-through opacity-65' : ''}`}>
                      {task.title}
                    </h3>
                    <p className="text-gray-medium text-sm mt-1 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  {/* Assignee Details */}
                  <div className="pt-3 border-t border-gray-light space-y-1.5 text-xs text-gray-medium">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>Deadline: <strong className="text-gray-dark font-semibold">{formattedDeadline}</strong></span>
                    </div>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary-light text-primary font-bold flex justify-center items-center text-[10px]">
                          {task.assignee.name.charAt(0)}
                        </div>
                        <span>Assigned to: <strong className="text-gray-dark font-semibold">{task.assignee.name}</strong></span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-danger">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Unassigned Task</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete task button for admins */}
                {isAdmin && (
                  <div className="flex justify-end pt-4 border-t border-gray-light mt-4">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-xs text-danger hover:underline font-bold"
                    >
                      Remove Task
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-gray-border shadow-premium w-full max-w-lg overflow-hidden animate-slide-in">
            {/* Modal Header */}
            <div className="bg-primary-light text-primary p-6 border-b border-primary-mid flex justify-between items-center">
              <h3 className="font-serif font-bold text-lg text-primary">Assign Coordination Task</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-full hover:bg-primary-mid text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium"
                  placeholder="e.g. Refreshments coordinator"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-1">Task Description *</label>
                <textarea
                  rows={3}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium text-sm"
                  placeholder="Describe the duties, instructions, and responsibilities for this task..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Assignee */}
                <div>
                  <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-1">Assign Coordinator</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium text-sm"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                  >
                    <option value="">Select volunteer coordinator</option>
                    {coordinators.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.role === 'DEPARTMENT_ADMIN' ? 'Dept Coord' : 'Volunteer'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-1">Task Priority</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium text-sm"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                {/* Deadline */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-medium uppercase tracking-wider mb-1">Deadline Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background/20 font-medium text-sm"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-gray-light flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-border text-gray-medium font-bold hover:bg-gray-light text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-background font-bold rounded-lg shadow-md border-b-2 border-accent transition-all text-xs disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Assign & Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
