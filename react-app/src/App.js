import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { GodModeProvider } from './context/GodModeContext';
import ProtectedRoute from './auth/ProtectedRoute';
import AutoTranslator from './components/AutoTranslator';

// Auth Pages
import Login from './auth/Login';
import Signup from './auth/Signup';
import ForgotPassword from './auth/ForgotPassword';
import ConfirmPassword from './auth/ConfirmPassword';

// Components & Pages
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import InvestigationWorkspace from './pages/InvestigationWorkspace';
import RelationshipExplorer from './pages/RelationshipExplorer';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import DataExplorer from './pages/DataExplorer';

import ForensicIntelligence from './pages/ForensicIntelligence';
import GodModePage from './pages/GodModePage';
import GodModeVideoOverlay from './components/godmode/GodModeVideoOverlay';

const DashboardLayout = ({ children }) => (
  <div style={{ display: 'flex', minHeight: '100vh', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
    <Sidebar />
    {/* Main Content Area */}
    <div style={{ flex: 1, padding: '20px 24px 24px 0', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', minWidth: 0 }}>
      <Navbar />
      {children}
    </div>
  </div>
);

function App() {
  const ALL_ROLES = ['Administrator', 'Investigator', 'Analyst', 'Supervisor', 'Policymaker', 'Viewer', 'Officer'];
  const INVESTIGATOR_ROLES = ['Administrator', 'Investigator', 'Analyst', 'Supervisor', 'Policymaker', 'Officer'];
  const RELATIONSHIP_ROLES = ['Administrator', 'Investigator', 'Analyst', 'Supervisor', 'Officer'];
  const AUDIT_ROLES = ['Administrator', 'Supervisor'];

  return (
    <AuthProvider>
      <AppProvider>
        <GodModeProvider>
          <LanguageProvider>
            <AutoTranslator />
            <Router>
              <GodModeVideoOverlay />
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/signup" element={<Signup />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/confirm-password" element={<ConfirmPassword />} />

                {/* Protected Dashboard Routes with Strict RBAC Role Guarding */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={ALL_ROLES}>
                      <DashboardLayout><Dashboard /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/investigate"
                  element={
                    <ProtectedRoute allowedRoles={INVESTIGATOR_ROLES}>
                      <DashboardLayout><InvestigationWorkspace /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/investigate/:caseId"
                  element={
                    <ProtectedRoute allowedRoles={INVESTIGATOR_ROLES}>
                      <DashboardLayout><InvestigationWorkspace /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cases/:caseId"
                  element={
                    <ProtectedRoute allowedRoles={INVESTIGATOR_ROLES}>
                      <DashboardLayout><InvestigationWorkspace /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/relationships"
                  element={
                    <ProtectedRoute allowedRoles={RELATIONSHIP_ROLES}>
                      <DashboardLayout><RelationshipExplorer /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />


                <Route
                  path="/forensics"
                  element={
                    <ProtectedRoute allowedRoles={INVESTIGATOR_ROLES}>
                      <DashboardLayout><ForensicIntelligence /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute allowedRoles={ALL_ROLES}>
                      <DashboardLayout><Reports /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/audit-logs"
                  element={
                    <ProtectedRoute allowedRoles={AUDIT_ROLES}>
                      <DashboardLayout><AuditLogs /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/search"
                  element={
                    <ProtectedRoute allowedRoles={ALL_ROLES}>
                      <DashboardLayout><DataExplorer /></DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                {/* ⚡ GOD MODE DEEP INVESTIGATION ROUTE */}
                <Route
                  path="/god-mode"
                  element={
                    <ProtectedRoute allowedRoles={INVESTIGATOR_ROLES}>
                      <GodModePage />
                    </ProtectedRoute>
                  }
                />
                
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Router>
          </LanguageProvider>
        </GodModeProvider>
      </AppProvider>
    </AuthProvider>
  );
}


export default App;