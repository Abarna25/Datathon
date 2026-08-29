import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, FileCheck2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const CaseCompletenessCard = ({ caseId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (caseId) fetchData();
  }, [caseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/decision/completeness/${caseId}`);
      if (res.data.success) {
        setData(res.data.data);
        setError(null);
      } else {
        throw new Error('Failed to load completeness');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error && err.response.data.error.code === 'DATASTORE_UNAVAILABLE') {
        setError('DATASTORE_UNAVAILABLE');
      } else {
        setError(err.message || 'Error loading completeness');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '20px' }}>
        <p style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Calculating Case Completeness...</p>
      </div>
    );
  }

  if (error === 'DATASTORE_UNAVAILABLE') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 16 }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck2 size={18} color="#94a3b8" /> Case Completeness
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px 0' }}>
          <AlertCircle size={32} color="#94a3b8" style={{ marginBottom: 12 }} />
          <div style={{ color: '#64748b', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Unable to calculate</div>
          <div style={{ color: '#94a3b8', fontSize: 13, maxWidth: 200, lineHeight: 1.5 }}>
            Investigation datastore is currently unavailable.
          </div>
          <div style={{ color: '#cbd5e1', fontSize: 11, marginTop: 16 }}>
            No simulated data is being displayed.
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '20px' }}>
        <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>Unable to retrieve case completeness data.</p>
      </div>
    );
  }

  const { score = 0, status = 'UNKNOWN', categories = [], missingItems = [], summary = '' } = data;
  
  // Status Color Logic
  let statusColor = '#ef4444'; // Red for INCOMPLETE
  if (score >= 90) statusColor = '#10b981'; // Green for COMPLETE
  else if (score >= 75) statusColor = '#3b82f6'; // Blue for MOSTLY_COMPLETE
  else if (score >= 50) statusColor = '#f59e0b'; // Orange for PARTIALLY_COMPLETE

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCheck2 size={18} color={statusColor} /> Deterministic Case Completeness
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16, marginBottom: 16 }}>
        {/* Simple Ring Chart */}
        <div style={{ position: 'relative', width: 72, height: 72 }}>
          <svg viewBox="0 0 80 80" width="72" height="72">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <circle 
              cx="40" cy="40" r="36" 
              fill="none" stroke={statusColor} strokeWidth="8" 
              strokeDasharray={`${(score / 100) * (2 * Math.PI * 36)} 999`}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
            />
          </svg>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: '#1e293b' }}>
            {score}%
          </div>
        </div>
        
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: statusColor, textTransform: 'capitalize' }}>
            {(status || 'UNKNOWN').replace(/_/g, ' ').toLowerCase()}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>
            {summary}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <strong style={{ fontSize: 12, color: '#475569', textTransform: 'uppercase' }}>Category Breakdown</strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {categories.map((cat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, background: '#f8fafc', padding: '6px 10px', borderRadius: 6, border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {cat.status === 'complete' ? <CheckCircle2 size={14} color="#10b981" /> : <XCircle size={14} color="#ef4444" />}
                <span style={{ color: '#334155', fontWeight: 500 }}>{cat.label}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: cat.status === 'complete' ? '#10b981' : '#ef4444' }}>
                {cat.score}/{cat.weight}
              </span>
            </div>
          ))}
        </div>
      </div>

      {missingItems.length > 0 && (
        <div style={{ marginTop: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#b91c1c', marginBottom: 8 }}>
            <AlertCircle size={14} /> Missing Required Information
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#991b1b', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {missingItems.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CaseCompletenessCard;
