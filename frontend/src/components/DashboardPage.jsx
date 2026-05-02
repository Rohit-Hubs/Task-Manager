import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineClipboardList, 
  HiOutlineClock, 
  HiOutlineRefresh, 
  HiOutlineCheckCircle, 
  HiOutlineExclamation, 
  HiOutlineFolder, 
  HiOutlineUsers, 
  HiOutlineLightningBolt,
  HiOutlinePlus
} from 'react-icons/hi';
import './DashboardPage.css';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { 
    loadStats(); 
  }, []);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (e) { 
      console.error(e); 
    }
    setLoading(false);
  };

  if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;

  const cards = [
    { label: 'Total Tasks', value: stats?.total_tasks || 0, icon: HiOutlineClipboardList, color: 'var(--accent)' },
    { label: 'Pending', value: stats?.pending_tasks || 0, icon: HiOutlineClock, color: 'var(--warning)' },
    { label: 'In Progress', value: stats?.in_progress_tasks || 0, icon: HiOutlineRefresh, color: 'var(--info)' },
    { label: 'Completed', value: stats?.done_tasks || 0, icon: HiOutlineCheckCircle, color: 'var(--success)' },
    { label: 'Overdue', value: stats?.overdue_tasks || 0, icon: HiOutlineExclamation, color: 'var(--danger)' },
    { label: 'Projects', value: stats?.total_projects || 0, icon: HiOutlineFolder, color: 'var(--purple)' },
    { label: 'Team', value: stats?.total_users || 0, icon: HiOutlineUsers, color: 'var(--cyan)' },
    { label: 'My Tasks', value: stats?.my_tasks || 0, icon: HiOutlineLightningBolt, color: 'var(--pink)' },
  ];

  const completionRate = stats?.total_tasks ? Math.round((stats.done_tasks / stats.total_tasks) * 100) : 0;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, <span className="gradient-text">{user?.username}</span></h1>
          <p className="page-subtitle">Here's a snapshot of your workspace today.</p>
        </div>
        <div className="header-actions">
          <button className="create-btn" onClick={() => navigate('/tasks')}>
            <HiOutlinePlus /> New Task
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {cards.map((card, i) => (
          <div key={i} className="stat-card glass" style={{ animationDelay: `${i * 0.05}s`, '--card-color': card.color }}>
            <div className="stat-icon-wrap" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
              <card.icon className="stat-icon" />
            </div>
            <div className="stat-info">
              <span className="stat-value">{card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="analytics-card glass">
          <div className="card-header">
            <h3 className="card-title">Performance</h3>
          </div>
          <div className="analytics-content">
            <div className="progress-ring-container">
              <svg className="progress-ring" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" className="progress-bg" />
                <circle 
                  cx="60" 
                  cy="60" 
                  r="54" 
                  className="progress-fill" 
                  style={{ strokeDasharray: `${completionRate * 3.39} 339` }} 
                />
              </svg>
              <div className="progress-text">
                <span className="progress-value">{completionRate}%</span>
                <span className="progress-label">Efficiency</span>
              </div>
            </div>
            <div className="analytics-legend">
              <div className="legend-item">
                <div className="legend-marker" style={{ background: 'var(--success)' }} />
                <div className="legend-info">
                  <span className="legend-label">Resolved</span>
                  <span className="legend-value">{stats?.done_tasks || 0}</span>
                </div>
              </div>
              <div className="legend-item">
                <div className="legend-marker" style={{ background: 'var(--info)' }} />
                <div className="legend-info">
                  <span className="legend-label">Active</span>
                  <span className="legend-value">{(stats?.in_progress_tasks || 0) + (stats?.pending_tasks || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="recent-activity-card glass">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
            <button className="text-btn" onClick={() => navigate('/tasks')}>View All</button>
          </div>
          <div className="activity-list">
            {stats?.recent_tasks?.length > 0 ? stats.recent_tasks.map((task, i) => (
              <div key={i} className="activity-item">
                <div className="activity-icon-wrap" style={{ background: `var(--status-${task.status}-bg)` }}>
                  <div className={`activity-status-indicator status-${task.status}`} />
                </div>
                <div className="activity-body">
                  <div className="activity-title-row">
                    <span className="activity-task-name">{task.title}</span>
                    <span className={`priority-badge priority-${task.priority || 'medium'}`}>{task.priority || 'medium'}</span>
                  </div>
                  <div className="activity-meta">
                    <span className="meta-item"><HiOutlineFolder /> {task.project_name}</span>
                    <span className="meta-divider" />
                    <span className="meta-item"><HiOutlineUsers /> {task.assigned_to_username}</span>
                  </div>
                </div>
                <div className="activity-status">
                   <span className={`status-badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                </div>
              </div>
            )) : (
              <div className="empty-activity">
                <HiOutlineClipboardList size={32} />
                <p>No recent activity found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
