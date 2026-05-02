import React, { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask, getProjects, getUsers } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineClipboardList, 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineClock, 
  HiOutlineRefresh, 
  HiOutlineCheckCircle, 
  HiOutlineExclamation, 
  HiOutlineLightningBolt,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineFolder,
  HiOutlineSearch
} from 'react-icons/hi';
import './TasksPage.css';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ 
    title: '', 
    project: '', 
    assigned_to: '', 
    due_date: '', 
    priority: 'medium', 
    description: '' 
  });
  const { user } = useAuth();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [t, p, u] = await Promise.all([getTasks(), getProjects(), getUsers()]);
      setTasks(Array.isArray(t) ? t : []);
      setProjects(Array.isArray(p) ? p : []);
      setUsers(Array.isArray(u) ? u : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const result = await createTask(form);
      if (result.error) {
          alert(JSON.stringify(result.error));
      } else {
        setForm({ title: '', project: '', assigned_to: '', due_date: '', priority: 'medium', description: '' });
        setShowModal(false);
        loadAll();
      }
    } catch (e) { console.error(e); }
    setCreating(false);
  };

  const cycleStatus = async (task) => {
    const statusCycle = { pending: 'in_progress', in_progress: 'done', done: 'pending' };
    const newStatus = statusCycle[task.status] || 'pending';
    try {
        const result = await updateTask(task.id, { status: newStatus });
        if (result.error) {
            alert(JSON.stringify(result.error));
        } else {
            loadAll();
        }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const result = await deleteTask(id);
      if (result.error) {
        alert(result.error);
      } else {
        loadAll();
      }
    } catch (e) { console.error(e); }
  };

  const today = new Date().toISOString().split('T')[0];
  
  const filtered = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.project_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'in_progress') return t.status === 'in_progress';
    if (filter === 'done') return t.status === 'done';
    if (filter === 'overdue') return (t.status === 'pending' || t.status === 'in_progress') && t.due_date < today;
    if (filter === 'my') return t.assigned_to === user?.id;
    return true;
  });

  const filterCounts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => (t.status === 'pending' || t.status === 'in_progress') && t.due_date < today).length,
    my: tasks.filter(t => t.assigned_to === user?.id).length,
  };

  if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Track, manage and assign team responsibilities.</p>
        </div>
        <button className="create-btn" onClick={() => setShowModal(true)}>
          <HiOutlinePlus /> New Task
        </button>
      </div>

      <div className="task-controls">
        <div className="search-bar glass">
            <HiOutlineSearch className="search-icon" />
            <input 
                type="text" 
                placeholder="Search tasks or projects..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <div className="filter-bar glass">
            {[
            { key: 'all', icon: HiOutlineClipboardList, label: 'All' },
            { key: 'pending', icon: HiOutlineClock, label: 'Pending' },
            { key: 'in_progress', icon: HiOutlineRefresh, label: 'Active' },
            { key: 'done', icon: HiOutlineCheckCircle, label: 'Done' },
            { key: 'overdue', icon: HiOutlineExclamation, label: 'Overdue' },
            { key: 'my', icon: HiOutlineLightningBolt, label: 'Mine' },
            ].map(f => (
            <button key={f.key} className={`filter-btn ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
                <f.icon />
                <span>{f.label}</span>
                <span className="filter-count">{filterCounts[f.key]}</span>
            </button>
            ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-icon"><HiOutlineClipboardList /></div>
          <h3>No tasks found</h3>
          <p>{searchQuery ? 'Try refining your search query.' : 'Get started by creating your team\'s first task.'}</p>
        </div>
      ) : (
        <div className="tasks-container">
          <div className="tasks-list">
            {filtered.map((task, i) => {
              const isOverdue = (task.status === 'pending' || task.status === 'in_progress') && task.due_date < today;
              return (
                <div key={task.id} className={`task-card glass ${isOverdue ? 'overdue' : ''}`} style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="task-main">
                    <button
                      className={`status-toggle status-${task.status} ${task.status === 'done' ? 'checked' : ''}`}
                      onClick={() => cycleStatus(task)}
                      title="Cycle Status"
                    >
                      {task.status === 'done' && <HiOutlineCheckCircle size={20} />}
                      {task.status === 'in_progress' && <HiOutlineRefresh size={20} className="spin-icon" />}
                      {task.status === 'pending' && <HiOutlineClock size={20} />}
                    </button>
                    
                    <div className="task-content">
                      <h4 className={`task-title ${task.status === 'done' ? 'completed' : ''}`}>{task.title}</h4>
                      <div className="task-meta">
                        <div className="meta-tag"><HiOutlineFolder /> {task.project_name}</div>
                        <div className="meta-tag"><HiOutlineUser /> {task.assigned_to_username}</div>
                        <div className={`meta-tag ${isOverdue ? 'date-overdue' : ''}`}>
                            <HiOutlineCalendar /> {task.due_date}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="task-aside">
                    <div className="badge-row">
                        <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                        <span className={`status-badge badge-${isOverdue ? 'overdue' : task.status}`}>
                            {isOverdue ? 'Overdue' : task.status.replace('_', ' ')}
                        </span>
                    </div>
                    {user?.role === 'admin' && (
                      <button className="icon-btn danger" onClick={() => handleDelete(task.id)} title="Delete Task">
                        <HiOutlineTrash />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <h2 className="modal-title">Create New Task</h2>
                <p className="modal-subtitle">Assign a new task to your team member.</p>
            </div>
            <form onSubmit={handleCreate} className="task-form">
              <div className="form-group">
                <label>Task Title</label>
                <input 
                    value={form.title} 
                    onChange={e => setForm({ ...form, title: e.target.value })} 
                    placeholder="Describe the task..." 
                    autoFocus 
                    required 
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                    value={form.description} 
                    onChange={e => setForm({ ...form, description: e.target.value })} 
                    placeholder="Add more details about this task..." 
                    rows="3" 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Project</label>
                  <select value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} required>
                    <option value="">Select project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assignee</label>
                  <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} required>
                    <option value="">Select member</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? <span className="spinner" /> : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
