import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import useSocket from './hooks/useSocket';
import Toast from './components/common/Toast';

// Layout & Protected Route
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Core Modules Pages
import Dashboard from './pages/Dashboard';
import Complaints from './pages/Complaints';
import LostFound from './pages/LostFound';
import StudyMaterials from './pages/StudyMaterials';
import Announcements from './pages/Announcements';
import Forum from './pages/Forum';
import Events from './pages/Events';
import AdminPanel from './pages/AdminPanel';

function App() {
  const { checkAuth, isLoading } = useAuthStore();

  // Initialize Socket connection
  useSocket();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Private Campus Portal Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="lost-found" element={<LostFound />} />
          <Route path="notes" element={<StudyMaterials />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="forum" element={<Forum />} />
          <Route path="events" element={<Events />} />
          
          {/* Admin Dedicated route */}
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </BrowserRouter>
  );
}

export default App;
