import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', backgroundColor: '#0f111a', color: '#fff' }}>
        <h2>Authenticating VIKSHANA Session...</h2>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  const userRole = user?.role || 'Viewer';

  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.includes(userRole) || userRole === 'Administrator';

    if (!isAllowed) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
            <h1 style={{ margin: '0 0 16px 0', color: 'var(--accent-danger)' }}>403 Forbidden</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>You do not have permission to access this module.</p>
            <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <div><strong>Required Role:</strong> <span style={{color: 'var(--text-muted)'}}>{allowedRoles.join(', ')}</span></div>
              <div style={{marginTop: '8px'}}><strong>Current Role:</strong> <span style={{color: 'var(--text-muted)'}}>{userRole}</span></div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => window.location.href = '#/dashboard'} style={{ padding: '10px 20px', background: 'var(--accent-primary)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
