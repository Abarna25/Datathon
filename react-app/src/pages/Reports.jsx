import React, { useState, useEffect } from 'react';
import { FileText, Download, Loader2, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import AIAssistantPanel from '../components/AIAssistantPanel';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [generating, setGenerating] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const { activeCaseId } = useAppContext();

  useEffect(() => {
    if (!activeCaseId) return;

    const fetchReports = async () => {
      try {
        setLoading(true);
        setActiveReport(null); // Reset open report view on case change
        const response = await api.get('/reports');
        if (response.data.success) {
          // Filter to only display the report for the globally active case
          const filtered = (response.data.data || []).filter(
            r => String(r.id) === String(activeCaseId)
          );
          setReports(filtered);
        }
      } catch (error) {
        // Silently fall back to empty array via interceptor
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [activeCaseId]);

  const handleGenerate = async (caseId) => {
    setGenerating(caseId);
    try {
      const response = await api.post('/reports/generate', { caseId });
      if (response.data.success) {
        setActiveReport({ id: caseId, markdown: response.data.data.markdown });
      }
    } catch (error) {
      // API interceptor handles fallback gracefully
    } finally {
      setGenerating(null);
    }
  };

  if (activeReport) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Generated AI Report</h2>
          <button onClick={() => setActiveReport(null)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
            Back to List
          </button>
        </div>
        <div className="glass-panel" style={{ padding: '24px', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: '1.6', overflowY: 'auto', flex: 1 }}>
          {activeReport.markdown}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '28px', color: 'var(--text-primary)' }}>Investigation Reports</h1>
        <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)' }}>Generate professional PDFs backed by AI findings for the active investigation.</p>
      </div>

      <AIAssistantPanel 
        title="AI Officer Brief" 
        content="Before generating the final PDF, ensure all recent forensic lab updates have synchronized with the datastore. The current draft includes all evidence collected up to 04:00 PM today."
        delay={400}
      />

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading reports...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {reports.length > 0 ? (
            reports.map(report => (
              <div key={report.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <FileText size={24} color="var(--accent-primary)" />
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px' }}>{report.title}</h3>
                  </div>
                  <div style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                    {report.status}
                  </div>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', flex: 1 }}>{report.summary}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(report.date).toLocaleDateString()}</span>
                  <button 
                    onClick={() => handleGenerate(report.id)}
                    disabled={generating === report.id}
                    style={{ background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {generating === report.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
                    {generating === report.id ? 'Synthesizing...' : 'Generate AI Report'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={36} color="var(--accent-warning)" />
              <p>No active case report details found in the datastore.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
