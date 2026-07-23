import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentForm from './pages/StudentForm';
import StudentProfile from './pages/StudentProfile';
import Payments from './pages/Payments';
import Receipt from './pages/Receipt';
import ModelTests from './pages/ModelTests';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
      <Route path="/students/add" element={<ProtectedRoute><StudentForm /></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
      <Route path="/students/:id/edit" element={<ProtectedRoute><StudentForm /></ProtectedRoute>} />
      {/* Receiving a payment is now done inline via PaymentModal (from a student's
          profile, the Students list, or the Payments ledger) — no separate page. */}
      <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="/receipt/:id" element={<ProtectedRoute><Receipt /></ProtectedRoute>} />
      <Route path="/model-tests" element={<ProtectedRoute><ModelTests /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}