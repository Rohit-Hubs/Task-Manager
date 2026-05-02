import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineFolder,
  HiOutlineClipboardCheck,
  HiOutlineUserGroup,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
} from 'react-icons/hi';
import './Layout.css';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { path: '/projects', icon: HiOutlineFolder, label: 'Projects' },
    { path: '/tasks', icon: HiOutlineClipboardCheck, label: 'Tasks' },
    { path: '/team', icon: HiOutlineUserGroup, label: 'Team' },
  ];

  return (
    <div className={`layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={() => navigate('/dashboard')}>
            <div className="logo-icon ttm-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="6" fill="currentColor" fillOpacity="0.2"/>
                <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="900" style={{letterSpacing: '-0.5px'}}>TTM</text>
              </svg>
            </div>
            <div className="sidebar-brand-group">
                <span className="sidebar-brand">Team Task</span>
                <span className="sidebar-brand-sub">Manager</span>
            </div>
          </div>
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            {collapsed ? <HiOutlineMenu size={18} /> : <HiOutlineX size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.username}</span>
              <span className={`user-role role-${user?.role}`}>{user?.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign Out" aria-label="Sign Out">
            <HiOutlineLogout size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
