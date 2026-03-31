import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

import LoginPage         from "./pages/LoginPage";
import DashboardPage     from "./pages/DashboardPage";
import WorkloadDashboard from "./pages/WorkloadDashboard";
import ProjectsPage      from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import TasksPage         from "./pages/TasksPage";
import BoardPage         from "./pages/BoardPage";
import VendorsPage       from "./pages/VendorsPage";
import SupportLogsPage   from "./pages/SupportLogsPage";
import ReportsPage       from "./pages/ReportsPage";
import UsersPage         from "./pages/UsersPage";
import AdminWorkloadPage from "./pages/AdminWorkloadPage";
import SettingsPage      from "./pages/SettingsPage";
import NotFoundPage      from "./pages/NotFoundPage";

// ── Loading splash ──────────────────────────────────────────────
function LoadingSplash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4">
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center shadow-glow"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </motion.div>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-6 h-6 rounded-full border-2 border-brand-500/20 border-t-brand-500"
      />
    </div>
  );
}

// ── Protected route ─────────────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSplash />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

// ── App routes ──────────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />

      {/* Protected */}
      <Route path="/"             element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/projects"     element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
      <Route path="/tasks"        element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
      <Route path="/board"        element={<ProtectedRoute><BoardPage /></ProtectedRoute>} />
      <Route path="/vendors"      element={<ProtectedRoute><VendorsPage /></ProtectedRoute>} />
      <Route path="/support-logs" element={<ProtectedRoute><SupportLogsPage /></ProtectedRoute>} />
      <Route path="/reports"      element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/workload-dashboard" element={<ProtectedRoute><WorkloadDashboard /></ProtectedRoute>} />
      <Route path="/admin-workload" element={<ProtectedRoute><AdminWorkloadPage /></ProtectedRoute>} />
      <Route path="/settings"     element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Admin only */}
      <Route path="/users" element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// ── Root ────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
