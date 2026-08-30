import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Shield, LayoutDashboard, Search, Network, TrendingUp,
  FileText, ShieldAlert, UserCheck, Lock, Database
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import useAuth from '../hooks/useAuth';
import { useAppContext } from '../context/AppContext';

const Sidebar = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { currentCase } = useAppContext();

  const role = user?.role || 'Viewer';

  const roleBadgeColors = {
    Administrator: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
    Investigator: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
    Officer: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
    Analyst: { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' },
    Supervisor: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
    Policymaker: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
    Viewer: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' }
  };

  const activeBadge = roleBadgeColors[role] || roleBadgeColors.Viewer;

    const allItems = [
      { id: 'dashboard', name: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard, path: '/dashboard', roles: ['Administrator', 'Investigator', 'Analyst', 'Supervisor', 'Policymaker', 'Officer'] },
      { id: 'investigate', name: t('nav.investigationWorkspace', 'Investigation Workspace'), icon: Search, path: '/investigate', roles: ['Administrator', 'Investigator', 'Supervisor', 'Officer'] },
      { id: 'forensics', name: 'Forensic Intelligence Hub', icon: Shield, path: '/forensics', roles: ['Administrator', 'Investigator', 'Supervisor', 'Officer'] },
      { id: 'search', name: 'Investigation Search', icon: Database, path: '/search', roles: ['Administrator', 'Investigator', 'Supervisor', 'Analyst', 'Policymaker', 'Officer'] },
      { id: 'sociological', name: 'Sociological Insights', icon: Network, path: '/sociological', roles: ['Administrator', 'Investigator', 'Supervisor', 'Analyst', 'Policymaker', 'Officer'] },
      { id: 'forecasting', name: 'Crime Forecasting', icon: TrendingUp, path: '/forecasting', roles: ['Administrator', 'Investigator', 'Supervisor', 'Analyst', 'Policymaker', 'Officer'] },
      { id: 'reports', name: t('nav.reports', 'Investigation Report'), icon: FileText, path: '/reports', roles: ['Administrator', 'Investigator', 'Analyst', 'Supervisor', 'Policymaker', 'Officer'] },
      { id: 'audit-logs', name: 'Audit Logs', icon: ShieldAlert, path: '/audit-logs', roles: ['Administrator', 'Supervisor'] }
    ];


  const filteredMenuItems = allItems.filter(item => item.roles.includes(role));

  return (
    <aside className="glass-panel" style={{ width: '260px', height: 'calc(100vh - 40px)', margin: '20px', padding: '20px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: 'var(--accent-primary)', flexShrink: 0 }}>
        <Shield size={32} />
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', letterSpacing: '1px' }}>{t('nav.appName', 'VIKSHANA')}</h2>
      </div>

      {/* Role Badge Indicator */}
      <div style={{
        marginBottom: currentCase ? '10px' : '24px',
        padding: '8px 12px',
        borderRadius: '8px',
        background: activeBadge.bg,
        border: `1px solid ${activeBadge.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserCheck size={14} color={activeBadge.text} />
          <span style={{ fontSize: '11px', fontWeight: '800', color: activeBadge.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ROLE: {role}
          </span>
        </div>
        {role === 'Administrator' && <Lock size={12} color={activeBadge.text} />}
      </div>

      {/* Active Case Badge */}
      {currentCase && (
        <div style={{
          marginBottom: '16px', padding: '8px 12px', borderRadius: '8px',
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '2px' }}>Active Investigation</div>
          <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '700' }}>{currentCase.caseNumber || currentCase.caseId}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{currentCase.category || ''}</div>
        </div>
      )}  

      {/* Dynamic Navigation Menu */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
        
        {/* DASHBOARD */}
        {filteredMenuItems.filter(i => i.id === 'dashboard').map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="sidebar-link"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderLeft: isActive ? '4px solid var(--accent-primary)' : '4px solid transparent',
              transition: 'all 0.2s ease', fontWeight: isActive ? '600' : '500', fontSize: '13.5px'
            })}
          >
            <item.icon size={18} /><span>{role === 'Analyst' ? 'Trends & Hotspots' : item.name}</span>
          </NavLink>
        ))}

        {/* PRIMARY ROLE SECTION */}
        <div style={{ marginTop: '16px', marginBottom: '4px', paddingLeft: '12px', fontSize: '11px', fontWeight: '800', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {role === 'Investigator' || role === 'Officer' ? 'Case Workspace' : 
           role === 'Analyst' ? 'Intelligence Hub' : 
           role === 'Supervisor' ? 'Command Overview' : 'Primary Actions'}
        </div>
        {filteredMenuItems.filter(i => ['investigate', 'forensics', 'search'].includes(i.id)).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderLeft: isActive ? '4px solid var(--accent-primary)' : '4px solid transparent',
              transition: 'all 0.2s ease', fontWeight: isActive ? '600' : '500', fontSize: '13.5px'
            })}
          >
            <item.icon size={18} /><span>{item.name}</span>
          </NavLink>
        ))}

        {/* INTELLIGENCE & FORECASTING */}
        <div style={{ marginTop: '16px', marginBottom: '4px', paddingLeft: '12px', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          INTELLIGENCE
        </div>
        {filteredMenuItems.filter(i => ['sociological', 'forecasting'].includes(i.id)).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderLeft: isActive ? '4px solid var(--accent-primary)' : '4px solid transparent',
              transition: 'all 0.2s ease', fontWeight: isActive ? '600' : '500', fontSize: '13.5px'
            })}
          >
            <item.icon size={18} /><span>{item.name}</span>
          </NavLink>
        ))}

        {/* REPORTING & OTHERS */}
        <div style={{ marginTop: '16px', marginBottom: '4px', paddingLeft: '12px', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {role === 'Administrator' ? 'Admin & Reporting' : 'Reporting & Logs'}
        </div>
        {filteredMenuItems.filter(i => ['reports', 'audit-logs'].includes(i.id)).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              borderLeft: isActive ? '4px solid var(--accent-primary)' : '4px solid transparent',
              transition: 'all 0.2s ease', fontWeight: isActive ? '600' : '500', fontSize: '13.5px'
            })}
          >
            <item.icon size={18} /><span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
