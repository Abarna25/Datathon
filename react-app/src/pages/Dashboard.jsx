import React, { useEffect, useState } from 'react';
import { Shield, FileText, AlertTriangle, TrendingUp, Users, Activity, CheckSquare, Search, Network, Map, Clock, Target, DollarSign, Database, Brain, Cpu, Server } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import { useLanguage } from '../context/LanguageContext';
import useAuth from '../hooks/useAuth';
import api from '../services/api';

const AdminDashboard = ({ data }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
    <DashboardCard title="Platform Statistics" value={data?.stats?.totalCases || 1542} icon={Server} color="#3b82f6" />
    <DashboardCard title="User Statistics" value="128 Active" icon={Users} color="#8b5cf6" />
    <DashboardCard title="Audit Summary" value="99.9% Pass" icon={Shield} color="#10b981" />
    <DashboardCard title="Forecast Summary" value="Processed" icon={TrendingUp} color="#f59e0b" />
    <DashboardCard title="System Health" value="Optimal" icon={Activity} color="#10b981" />
  </div>
);

const InvestigatorDashboard = ({ data }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
    <DashboardCard title="Assigned Investigations" value="7" icon={Search} color="#3b82f6" />
    <DashboardCard title="Active FIRs" value={data?.stats?.todaysFIR || 3} icon={FileText} color="#ef4444" />
    <DashboardCard title="Evidence Status" value="2 Pending Lab" icon={Database} color="#f59e0b" />
    <DashboardCard title="Pending Actions" value="4 Urgent" icon={CheckSquare} color="#ef4444" />
    <DashboardCard title="Offender Alerts" value="1 Match" icon={AlertTriangle} color="#ef4444" />
  </div>
);

const AnalystDashboard = ({ data }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
    <DashboardCard title="Crime Trends" value={data?.stats?.crimeTrend || '+4.2%'} icon={TrendingUp} color="#ef4444" />
    <DashboardCard title="Relationship Graph" value="242 Nodes" icon={Network} color="#8b5cf6" />
    <DashboardCard title="Forecast" value="High Risk (Q3)" icon={Brain} color="#f59e0b" />
    <DashboardCard title="Heatmap" value="Updated" icon={Map} color="#3b82f6" />
    <DashboardCard title="Sociological Analytics" value="Processing" icon={Users} color="#10b981" />
  </div>
);

const SupervisorDashboard = ({ data }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
    <DashboardCard title="Investigation Progress" value="68%" icon={Target} color="#3b82f6" />
    <DashboardCard title="Officer Workload" value="High" icon={Activity} color="#f59e0b" />
    <DashboardCard title="Pending Approvals" value="12" icon={CheckSquare} color="#ef4444" />
    <DashboardCard title="Critical Investigations" value="3" icon={AlertTriangle} color="#ef4444" />
    <DashboardCard title="Audit Summary" value="Clear" icon={Shield} color="#10b981" />
  </div>
);

const PolicymakerDashboard = ({ data }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
    <DashboardCard title="Crime Index" value="7.4/10" icon={Activity} color="#f59e0b" />
    <DashboardCard title="District Comparison" value="Sector 4 Highest" icon={Map} color="#ef4444" />
    <DashboardCard title="Forecast" value="Downward Trend" icon={TrendingUp} color="#10b981" />
    <DashboardCard title="Policy Recommendations" value="5 Available" icon={FileText} color="#3b82f6" />
    <DashboardCard title="Budget Impact" value="$1.2M Saved" icon={DollarSign} color="#10b981" />
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard');
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>{t('common.loading', 'Loading Intelligence Data...')}</div>;
  if (!data) return <div style={{ color: 'var(--accent-danger)' }}>{t('common.error', 'Error')} connecting to VIKSHANA core systems.</div>;

  const role = user?.role || 'Viewer';

  const renderDashboard = () => {
    switch (role) {
      case 'Administrator': return <AdminDashboard data={data} />;
      case 'Investigator': return <InvestigatorDashboard data={data} />;
      case 'Analyst': return <AnalystDashboard data={data} />;
      case 'Supervisor': return <SupervisorDashboard data={data} />;
      case 'Policymaker': return <PolicymakerDashboard data={data} />;
      default: return <div style={{ color: 'var(--text-muted)' }}>No widgets available for {role}.</div>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: 'var(--text-primary)' }}>{t('dashboard.title', 'Command Center')}</h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)' }}>{t('dashboard.subtitle', 'Real-time intelligence tailored for ') + role}.</p>
        </div>
      </div>
      {renderDashboard()}
    </div>
  );
};

export default Dashboard;
