import React, { useState, useEffect } from 'react';
import { getProjects, createProject, deleteProject, getTasks } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineFolder, 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineUser, 
  HiOutlineClipboardCheck,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineRefresh
} from 'react-icons/hi';
import './ProjectsPage.css';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();

  useEffect(() => { 
    loadData(); 
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, tData] = await Promise.all([getProjects(), getTasks()]);
      setProjects(Array.isArray(pData) ? pData : []);
      setAllTasks(Array.isArray(tData) ? tData : []);
    } catch (e) { 
      console.error(e); 
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const result = await createProject({ name: name.trim() });
      if (result.error) {
         alert(JSON.stringify(result.error));
      } else {
        setName('');
        setShowCreateModal(false);
        loadData();
      }
    } catch (e) { console.error(e); }
    setCreating(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project and all its tasks? This action cannot be undone.')) return;
    try {
      await deleteProject(id);
      loadData();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;

  const projectTasks = selectedProject ? allTasks.filter(t => t.project === selectedProject.id) : [];

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Organize and monitor your team's initiatives.</p>
        </div>
        {user?.role === 'admin' && (
          <button className="create-btn" onClick={() => setShowCreateModal(true)}>
            <HiOutlinePlus /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-icon"><HiOutlineFolder /></div>
          <h3>No projects yet</h3>
          <p>Launch your first project to start tracking tasks with your team.</p>
          {user?.role === 'admin' && (
            <button className="btn-primary" style={{marginTop: '20px'}} onClick={() => setShowCreateModal(true)}>
               Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((p, i) => {
            const progress = p.task_count > 0 ? Math.round((p.completed_count / p.task_count) * 100) : 0;
            return (
              <div 
                key={p.id} 
                className="project-card glass clickable" 
                style={{ animationDelay: `${i * 0.05}s` }}
                onClick={() => setSelectedProject(p)}
              >
                <div className="project-card-header">
                  <div className="project-type-icon">
                    <HiOutlineFolder />
                  </div>
                  <div className="project-actions">
                    {user?.role === 'admin' && (
                      <button className="icon-btn danger" onClick={(e) => handleDelete(e, p.id)} title="Delete Project">
                        <HiOutlineTrash />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="project-body">
                  <h3 className="project-name">{p.name}</h3>
                  <div className="project-owner">
                    <HiOutlineUser size={14} />
                    <span>{p.created_by_username}</span>
                  </div>
                </div>

                <div className="project-footer">
                  <div className="project-progress-info">
                    <div className="progress-labels">
                      <span className="progress-percentage">{progress}% Complete</span>
                      <span className="task-counter">{p.completed_count}/{p.task_count} Tasks</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-bar-fill" style={{ width: `${progress}%`, background: progress === 100 ? 'var(--success)' : 'var(--accent)' }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- CREATE PROJECT MODAL --- */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <h2 className="modal-title">Create New Project</h2>
                <p className="modal-subtitle">Define a new space for your team's tasks.</p>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name</label>
                <input 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Website Redesign" 
                  autoFocus 
                  required 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? <span className="spinner" /> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PROJECT DETAIL MODAL --- */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal glass project-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <div className="modal-header-top">
                    <h2 className="modal-title">{selectedProject.name}</h2>
                    <button className="icon-btn" onClick={() => setSelectedProject(null)}><HiOutlineX /></button>
                </div>
                <p className="modal-subtitle">Tasks and assignments for this project.</p>
            </div>
            
            <div className="project-tasks-list">
              {projectTasks.length === 0 ? (
                <div className="empty-tasks">
                  <HiOutlineClipboardCheck size={32} />
                  <p>No tasks created for this project yet.</p>
                </div>
              ) : (
                projectTasks.map((t, idx) => (
                  <div key={t.id} className="detail-task-item glass" style={{animationDelay: `${idx * 0.05}s`}}>
                    <div className="task-status-col">
                      {t.status === 'done' ? <HiOutlineCheckCircle className="status-icon done" /> : 
                       t.status === 'in_progress' ? <HiOutlineRefresh className="status-icon in-progress spin-icon" /> :
                       <HiOutlineClock className="status-icon pending" />}
                    </div>
                    <div className="task-info-col">
                      <span className="detail-task-title">{t.title}</span>
                      <div className="detail-task-assignee">
                        <HiOutlineUser size={12} />
                        <span>Assigned to: <strong>{t.assigned_to_username}</strong></span>
                      </div>
                    </div>
                    <div className="task-badge-col">
                      <span className={`priority-badge priority-${t.priority}`}>{t.priority}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setSelectedProject(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
