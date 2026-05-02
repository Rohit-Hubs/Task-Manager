import React, { useState, useEffect } from 'react';
import { getUsers, updateTask } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineUsers, 
  HiOutlineShieldCheck, 
  HiOutlineUser, 
  HiOutlineMail, 
  HiOutlineCalendar,
  HiOutlineDotsVertical,
  HiOutlineTrash,
  HiOutlineUserCircle
} from 'react-icons/hi';
import './TeamPage.css';

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (loading) return <div className="page-loading"><div className="spinner-lg" /></div>;

  const admins = users.filter(u => u.role === 'admin');
  const members = users.filter(u => u.role === 'member');

  return (
    <div className="team-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Directory</h1>
          <p className="page-subtitle">Collaborate with your workspace members and manage permissions.</p>
        </div>
        <div className="team-stats-card glass">
          <div className="team-stat">
            <span className="stat-num">{users.length}</span>
            <span className="stat-desc">Total</span>
          </div>
          <div className="stat-divider" />
          <div className="team-stat">
            <span className="stat-num admin">{admins.length}</span>
            <span className="stat-desc">Admins</span>
          </div>
          <div className="stat-divider" />
          <div className="team-stat">
            <span className="stat-num member">{members.length}</span>
            <span className="stat-desc">Members</span>
          </div>
        </div>
      </div>

      <div className="team-sections">
        {admins.length > 0 && (
          <div className="team-section">
            <div className="section-header">
                <HiOutlineShieldCheck className="section-icon admin" />
                <h2 className="section-title">Administrators</h2>
            </div>
            <div className="team-grid">
              {admins.map((u, i) => (
                <div key={u.id} className="member-card glass" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="member-top">
                    <div className="member-avatar admin-gradient">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-basic">
                      <span className="member-name">{u.username}</span>
                      <span className="member-role-badge admin">Administrator</span>
                    </div>
                  </div>
                  <div className="member-details">
                    {u.email && (
                        <div className="detail-item">
                            <HiOutlineMail />
                            <span>{u.email}</span>
                        </div>
                    )}
                    <div className="detail-item">
                        <HiOutlineCalendar />
                        <span>Joined {u.date_joined || 'Recently'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {members.length > 0 && (
          <div className="team-section">
            <div className="section-header">
                <HiOutlineUser className="section-icon member" />
                <h2 className="section-title">Team Members</h2>
            </div>
            <div className="team-grid">
              {members.map((u, i) => (
                <div key={u.id} className="member-card glass" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="member-top">
                    <div className="member-avatar member-gradient">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-basic">
                      <span className="member-name">{u.username}</span>
                      <span className="member-role-badge member">Team Member</span>
                    </div>
                  </div>
                  <div className="member-details">
                    {u.email && (
                        <div className="detail-item">
                            <HiOutlineMail />
                            <span>{u.email}</span>
                        </div>
                    )}
                    <div className="detail-item">
                        <HiOutlineCalendar />
                        <span>Joined {u.date_joined || 'Recently'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {users.length === 0 && (
        <div className="empty-state glass">
          <div className="empty-icon"><HiOutlineUsers /></div>
          <h3>The workspace is quiet</h3>
          <p>No other team members have joined yet.</p>
        </div>
      )}
    </div>
  );
}
