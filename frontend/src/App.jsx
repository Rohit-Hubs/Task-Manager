import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Layout from './components/Layout';
import DashboardPage from './components/DashboardPage';
import ProjectsPage from './components/ProjectsPage';
import TasksPage from './components/TasksPage';
import TeamPage from './components/TeamPage';
import './App.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Auth />} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Layout><ProjectsPage /></Layout></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Layout><TasksPage /></Layout></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><Layout><TeamPage /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;