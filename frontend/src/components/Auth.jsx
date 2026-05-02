import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup, getMe } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineMail,
  HiOutlineShieldCheck,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import './Auth.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login({ username, password });
      if (data.access) {
        localStorage.setItem('token', data.access);
        const userData = await getMe();
        loginUser(data.access, userData.username, userData.role);
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch {
      setError('Connection error. Is the server running?');
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const data = await signup({ username, password, email, role });
      if (data.message) {
        setSuccess('Account created! You can now sign in.');
        setTimeout(() => setIsLogin(true), 1500);
      } else {
        const errorMsg = data.username?.[0] || data.password?.[0] || data.email?.[0] || 'Signup failed. Please try again.';
        setError(errorMsg);
      }
    } catch {
      setError('Connection error. Is the server running?');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-gradient auth-gradient-1" />
        <div className="auth-gradient auth-gradient-2" />
        <div className="auth-gradient auth-gradient-3" />
        <div className="auth-grid" />
      </div>

      <div className="auth-container">
        <div className="auth-card glass">
          <div className="auth-header">
            <div className="auth-logo">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#authGrad)" />
                <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="authGrad" x1="0" y1="0" x2="24" y2="24">
                    <stop stopColor="#818cf8" />
                    <stop offset="1" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="auth-title">Team Task Manager</h1>
            <p className="auth-subtitle">Professional Collaboration Platform</p>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
            >
              Sign Up
            </button>
            <div className={`auth-tab-indicator ${isLogin ? 'left' : 'right'}`} />
          </div>

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="auth-form">
            {error && (
              <div className="auth-alert error">
                <HiOutlineExclamationCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="auth-alert success">
                <HiOutlineCheckCircle size={16} />
                <span>{success}</span>
              </div>
            )}

            {!isLogin && (
              <>
                <div className="form-group">
                  <label htmlFor="auth-email">Email Address</label>
                  <div className="input-wrap">
                    <HiOutlineMail className="input-icon" />
                    <input
                      id="auth-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="auth-role">Account Role</label>
                  <div className="input-wrap">
                    <HiOutlineShieldCheck className="input-icon" />
                    <select
                      id="auth-role"
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      required
                    >
                      <option value="member">Team Member</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="auth-username">Username</label>
              <div className="input-wrap">
                <HiOutlineUser className="input-icon" />
                <input
                  id="auth-username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="auth-password">Password</label>
              <div className="input-wrap">
                <HiOutlineLockClosed className="input-icon" />
                <input
                  id="auth-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <HiOutlineArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="auth-footer-text">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              className="auth-switch-link"
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
