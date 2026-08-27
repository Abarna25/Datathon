import React from 'react';
import { Target, CheckCircle } from 'lucide-react';

const RecommendationPanel = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) return (
    <div className="glass-panel" style={{ padding: '20px', color: 'var(--text-secondary)' }}>
      No actionable recommendations available.
    </div>
  );

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Target size={18} color="var(--accent-primary)" />
        Investigation Action Recommendations
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {recommendations.map((rec, i) => (
          <div key={i} style={{ padding: '16px', background: 'rgba(59,130,246,0.05)', border: '1px solid var(--accent-primary)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{rec.action}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '11px', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                  {rec.priority}
                </span>
                {rec.confidence && (
                  <span style={{ fontSize: '11px', background: '#10b98120', padding: '2px 8px', borderRadius: '4px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={10} /> {(rec.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}>
              <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--accent-primary)' }}>WHY?</strong>
              <div style={{ whiteSpace: 'pre-line' }}>{rec.reason}</div>
            </div>
            
            {rec.evidence_used && rec.evidence_used.length > 0 && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>SOURCE</strong>
                {rec.evidence_used.map((e, idx) => <div key={idx}>• {e}</div>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationPanel;
