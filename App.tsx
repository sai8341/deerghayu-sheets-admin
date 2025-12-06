import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { HomePage } from './pages/website/HomePage';
import { LoginPage } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { AdminLayout } from './components/layout/AdminLayout';
import { PatientList } from './pages/admin/PatientList';
import { PatientDetail } from './pages/admin/PatientDetail';
import { AddPatient } from './pages/admin/AddPatient';
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
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<div className="p-20 text-center">About Page Placeholder</div>} />
        <Route path="/treatments" element={<div className="p-20 text-center">Treatments Page Placeholder</div>} />
        <Route path="/contact" element={<div className="p-20 text-center">Contact Page Placeholder</div>} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<LoginPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/patients" element={<PatientList />} />
          <Route path="/admin/patients/new" element={<AddPatient />} />
          <Route path="/admin/patients/:id" element={<PatientDetail />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;