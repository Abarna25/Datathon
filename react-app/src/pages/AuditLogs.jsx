import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, Download, FileText, Calendar, Activity, Clock } from 'lucide-react';
import api from '../services/api';
import { exportAuditLogsPDF } from '../utils/pdfExport';
import { exportToCSV } from '../utils/csvExport';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // View toggle
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'timeline'

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (actionFilter) params.action = actionFilter;
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/audit', { params });
      if (response.data.success) {
        setLogs(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch logs');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchLogs();
  };

  // Client-side search for quick filtering
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (log.user_name && log.user_name.toLowerCase().includes(term)) ||
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.case_id && log.case_id.toLowerCase().includes(term)) ||
      (log.resource && log.resource.toLowerCase().includes(term))
    );
  });

  const handleExportCSV = async () => {
    exportToCSV(filteredLogs, `vikshana_audit_logs_${Date.now()}.csv`);
    try {
      await api.post('/audit', { action: 'Exported Report', resource: 'Audit Logs CSV' });
    } catch (e) {}
  };

  const handleExportPDF = async () => {
    await exportAuditLogsPDF(filteredLogs);
    try {
      await api.post('/audit', { action: 'Downloaded PDF', resource: 'Audit Logs PDF' });
    } catch (e) {}
  };

  const uniqueActions = [...new Set(logs.map(l => l.action))].filter(Boolean);

  return (
    <div style={{ padding: '20px', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', fontWeight: '800' }}>
            <Shield size={28} color="#ef4444" /> Security Audit Logs
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
            System Access & Accountability Monitoring
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setViewMode('table')} style={{ background: viewMode === 'table' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Table</button>
          <button onClick={() => setViewMode('timeline')} style={{ background: viewMode === 'timeline' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Timeline</button>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="User, Case, Action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 32px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Action Filter</label>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}>
            <option value="">All Actions</option>
            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Status Filter</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }}>
            <option value="">All Status</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '7px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '7px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' }} />
        </div>

        <button onClick={handleApplyFilters} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
          Apply
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
            <FileText size={16} /> CSV
          </button>
          <button onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      

      {/* Main Content */}
      <div className="glass-panel" style={{ padding: '20px', minHeight: '400px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>Loading Audit Logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>No audit logs found.</div>
        ) : viewMode === 'table' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px' }}>Timestamp</th>
                  <th style={{ padding: '12px' }}>User</th>
                  <th style={{ padding: '12px' }}>Action</th>
                  <th style={{ padding: '12px' }}>Resource</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>IP / Browser</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.log_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '600' }}>{log.user_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{log.role}</div>
                    </td>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#e2e8f0' }}>{log.action}</td>
                    <td style={{ padding: '12px' }}>
                      <div>{log.resource || '-'}</div>
                      {log.case_id && <div style={{ fontSize: '11px', color: '#3b82f6' }}>{log.case_id}</div>}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '800',
                        background: log.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: log.status === 'SUCCESS' ? '#10b981' : '#ef4444'
                      }}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <div>{log.ip_address}</div>
                      <div style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.browser}>{log.browser}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '30px' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '15px', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
            {filteredLogs.map(log => (
              <div key={log.log_id} style={{ position: 'relative', marginBottom: '24px' }}>
                <div style={{ 
                  position: 'absolute', left: '-21px', top: '4px', width: '10px', height: '10px', borderRadius: '50%',
                  background: log.status === 'SUCCESS' ? '#10b981' : '#ef4444',
                  boxShadow: `0 0 10px ${log.status === 'SUCCESS' ? '#10b981' : '#ef4444'}`
                }}></div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ minWidth: '150px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                    <div style={{ fontWeight: '600' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>{log.action}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{log.ip_address}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span style={{ color: '#93c5fd' }}>{log.user_name} ({log.role})</span> accessed <span style={{ color: '#e2e8f0' }}>{log.resource || 'System'}</span>
                      {log.case_id && <span> for case {log.case_id}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
