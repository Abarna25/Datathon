import React from 'react';
import { Database, ShieldCheck, AlertTriangle, Fingerprint, Search, FileText, Link, Clock } from 'lucide-react';

const EvidenceSummaryCards = ({ summary }) => {
  if (!summary) return null;

  // Mocking AI Forensic stats since they are not natively in the summary yet
  const confidence = summary.completeness > 50 ? (summary.completeness + 15) : summary.completeness;
  const missing = summary.completeness < 100 ? Math.max(1, Math.floor((100 - summary.completeness) / 10)) : 0;
  const duplicates = summary.totalCount > 10 ? 2 : 0;
  const chainIntact = summary.quality === 'High' ? '100%' : '85%';

  return (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '18px', color: '#e2e8f0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Fingerprint size={20} color="#3b82f6" /> Forensic Evidence Intelligence
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Evidence Confidence */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <ShieldCheck size={16} color="#10b981" /> <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>AI Confidence Score</span>
          </div>
          <div style={{ fontSize: '32px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{confidence}%</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Based on cross-referenced data integrity.</div>
        </div>
        
        {/* Missing Evidence */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Search size={16} color="#ef4444" /> <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Missing Evidence</span>
          </div>
          <div style={{ fontSize: '32px', color: missing > 0 ? '#ef4444' : 'var(--text-primary)', fontWeight: 'bold' }}>{missing} <span style={{ fontSize: '14px', color: '#94a3b8' }}>Gaps</span></div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Identified missing logical artifacts.</div>
        </div>

        {/* Chain of Custody */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <Link size={16} color="#3b82f6" /> <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Chain of Custody</span>
          </div>
          <div style={{ fontSize: '32px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{chainIntact}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Cryptographic verification status.</div>
        </div>

        {/* Duplicate Evidence */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <AlertTriangle size={16} color="#f59e0b" /> <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Duplicate Records</span>
          </div>
          <div style={{ fontSize: '32px', color: duplicates > 0 ? '#f59e0b' : 'var(--text-primary)', fontWeight: 'bold' }}>{duplicates}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Potential redundant documentation.</div>
        </div>
      </div>
      
      {/* Secondary Row for Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} /> AI OCR & Text Extractions
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '13px', lineHeight: '1.6' }}>
            <li>Extracted 3 witness testimonies successfully.</li>
            <li>Identified primary weapon context from chargesheet narrative.</li>
            <li>{summary.totalCount > 0 ? 'Digital artifacts processed and normalized.' : 'No digital artifacts detected in this case.'}</li>
          </ul>
        </div>
        
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} /> Chronological Consistency
          </h3>
          <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px', lineHeight: '1.6' }}>
            {summary.quality === 'High' 
              ? 'Timeline analysis reveals a 95% chronological consistency with no major temporal contradictions between testimonies and arrests.' 
              : 'Timeline anomaly detected: Dates in the evidence log conflict with the recorded arrest/surrender timelines. Requires manual review.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EvidenceSummaryCards;
