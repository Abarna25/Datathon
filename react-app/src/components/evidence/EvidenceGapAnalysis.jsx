import React from 'react';
import { AlertTriangle, AlertCircle, Info, FileSearch, ShieldAlert, CheckCircle2 } from 'lucide-react';

const EvidenceGapAnalysis = ({ gaps = [], recommendations = [] }) => {
  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#3b82f6';
      default: return '#94a3b8';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return <ShieldAlert size={16} />;
      case 'HIGH': return <AlertTriangle size={16} />;
      case 'MEDIUM': return <AlertCircle size={16} />;
      default: return <Info size={16} />;
    }
  };

  const getLabelColor = (label) => {
    switch (label) {
      case 'EVIDENCE_GAP': return '#ef4444';
      case 'MISSING_METADATA': return '#f59e0b';
      case 'UNRESOLVED_LINK': return '#f97316';
      case 'DUPLICATE_RECORD': return '#3b82f6';
      default: return '#94a3b8';
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
      {/* Gaps Panel */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="#ef4444" />
          Evidence Gaps
        </h3>
        
        {(!gaps || gaps.length === 0) ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
            No evidence gaps detected.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {gaps.map((gap, i) => {
              const pColor = getPriorityColor(gap.priority);
              const lColor = getLabelColor(gap.label);
              return (
                <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${pColor}`, borderRadius: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', padding: '2px 6px', background: `${lColor}20`, color: lColor, borderRadius: '4px', fontWeight: 'bold' }}>
                      {gap.label || 'GAP'}
                    </span>
                    <span style={{ fontSize: '10px', padding: '2px 6px', background: `${pColor}20`, color: pColor, borderRadius: '4px', marginLeft: 'auto' }}>
                      {gap.priority}
                    </span>
                  </div>
                  
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {getPriorityIcon(gap.priority)} {gap.what}
                  </div>
                  
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
                    {gap.why}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span><strong>Source:</strong> {gap.source}</span>
                    <span><strong>Confidence:</strong> {gap.confidence}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions Panel */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileSearch size={18} color="#10b981" />
          Investigation Actions
        </h3>
        
        {(!recommendations || recommendations.length === 0) ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
            No actions recommended.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recommendations.map((rec, i) => (
              <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid #10b981`, borderRadius: '4px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <CheckCircle2 size={16} color="#10b981" /> {rec.action}
                </div>
                
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
                  {rec.reason}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  <strong>Triggered by:</strong> {rec.source}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EvidenceGapAnalysis;
