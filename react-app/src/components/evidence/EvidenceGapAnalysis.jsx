import React from 'react';
import { Target, AlertTriangle, ShieldAlert, FileSearch, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const EvidenceGapAnalysis = ({ gapAnalysis = null, recommendations = [] }) => {
  if (!gapAnalysis) {
    return (
      <div className="glass-panel" style={{ padding: '20px', color: 'var(--text-secondary)' }}>
        No Evidence Gap Analysis available.
      </div>
    );
  }

  const { confidenceScore = 0, critical = [], important = [], optional = [] } = gapAnalysis;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
      
      {/* Evidence Gap Analysis Panel */}
      <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
        
        {/* Glow effect based on confidence */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '300px', height: '300px',
          background: `radial-gradient(circle at top right, ${confidenceScore > 80 ? 'rgba(16,185,129,0.1)' : confidenceScore > 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'}, transparent 70%)`,
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={20} color="var(--accent-primary)" />
              Evidence Gap Analysis
            </h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>
              Confidence could increase if the following evidence is obtained:
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '4px' }}>
              Current Conclusion Confidence
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: confidenceScore > 80 ? '#10b981' : confidenceScore > 50 ? '#f59e0b' : '#ef4444' }}>
              {confidenceScore}%
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
          {/* Vertical tree line */}
          <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '24px', width: '2px', background: 'rgba(255,255,255,0.1)' }} />

          {/* CRITICAL */}
          {critical.length > 0 && (
            <div style={{ position: 'relative', paddingLeft: '32px' }}>
              <div style={{ position: 'absolute', left: '0', top: '4px', width: '24px', height: '24px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, boxShadow: '0 0 10px rgba(239,68,68,0.5)' }}>
                <ShieldAlert size={14} color="#fff" />
              </div>
              <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>CRITICAL</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {critical.map((item, idx) => (
                  <div key={idx} style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ef4444', marginTop: '8px', flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IMPORTANT */}
          {important.length > 0 && (
            <div style={{ position: 'relative', paddingLeft: '32px' }}>
              <div style={{ position: 'absolute', left: '0', top: '4px', width: '24px', height: '24px', borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, boxShadow: '0 0 10px rgba(245,158,11,0.5)' }}>
                <AlertTriangle size={14} color="#fff" />
              </div>
              <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>IMPORTANT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {important.map((item, idx) => (
                  <div key={idx} style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#f59e0b', marginTop: '8px', flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OPTIONAL */}
          {optional.length > 0 && (
            <div style={{ position: 'relative', paddingLeft: '32px' }}>
              <div style={{ position: 'absolute', left: '0', top: '4px', width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, boxShadow: '0 0 10px rgba(59,130,246,0.5)' }}>
                <Info size={14} color="#fff" />
              </div>
              <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>OPTIONAL</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {optional.map((item, idx) => (
                  <div key={idx} style={{ padding: '10px 14px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#3b82f6', marginTop: '8px', flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {critical.length === 0 && important.length === 0 && optional.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No critical gaps identified. Case file appears robust.
            </div>
          )}
        </div>
      </div>
      
      {/* Actions Panel - Only render if there are explicit actions */}
      {recommendations && recommendations.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSearch size={18} color="#10b981" />
            Recommended Procedural Actions
          </h3>
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
        </div>
      )}
    </div>
  );
};

export default EvidenceGapAnalysis;
