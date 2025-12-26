import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { HomePage } from './pages/website/HomePage';
import { LoginPage } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { AdminLayout } from './components/layout/AdminLayout';
import { PatientList } from './pages/admin/PatientList';
import { PatientDetail } from './pages/admin/PatientDetail';
import { AddPatient } from './pages/admin/AddPatient';
import { Treatments } from './pages/admin/Treatments';
import { UserManagement } from './pages/admin/UserManagement';
import { useAuthStore } from './store/authStore';
import { ToastContainer } from './components/ui/Toast';

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <AdminLayout><Outlet /></AdminLayout> : <Navigate to="/admin/login" replace />;
};

const App: React.FC = () => {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        {/* Public Website Routes */}
        {/* Redirect Root to Login */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/treatments" element={<Treatments />} />
          <Route path="/admin/patients" element={<PatientList />} />
          <Route path="/admin/patients/new" element={<AddPatient />} />
          <Route path="/admin/patients/:id" element={<PatientDetail />} />
          <Route path="/admin/users" element={<UserManagement />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;