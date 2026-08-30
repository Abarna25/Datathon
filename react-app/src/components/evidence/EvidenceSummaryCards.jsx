import React from 'react';
import { Database, ShieldCheck, AlertTriangle, Fingerprint, Search, Link, FileText, Activity } from 'lucide-react';

const EvidenceSummaryCards = ({ summary }) => {
  if (!summary) return null;

  const total = summary.total_evidence || 0;
  const linked = summary.linked_entities || 0;
  const incomplete = summary.incomplete_records || 0;
  const duplicates = summary.duplicate_records || 0;

  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '18px', color: '#e2e8f0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Fingerprint size={20} color="#3b82f6" /> Evidence Ledger Summary
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Total Evidence */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Database size={16} color="#3b82f6" /> 
            <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Evidence</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div style={{ fontSize: '32px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{total}</div>
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total investigation artifacts.</div>
        </div>
        
        {/* Linked Entities */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Link size={16} color="#10b981" /> <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Linked Entities</span>
          </div>
          <div style={{ fontSize: '32px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{linked}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Evidence with confirmed person link.</div>
        </div>

        {/* Incomplete Records */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Search size={16} color="#ef4444" /> <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Incomplete Records</span>
          </div>
          <div style={{ fontSize: '32px', color: incomplete > 0 ? '#ef4444' : 'var(--text-primary)', fontWeight: 'bold' }}>{incomplete}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Missing metadata (date, reference).</div>
        </div>

        {/* Duplicate Records */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <AlertTriangle size={16} color="#f59e0b" /> <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Duplicate Records</span>
          </div>
          <div style={{ fontSize: '32px', color: duplicates > 0 ? '#f59e0b' : 'var(--text-primary)', fontWeight: 'bold' }}>{duplicates}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Redundant documentation.</div>
        </div>
      </div>
    </div>
  );
};

export default EvidenceSummaryCards;
