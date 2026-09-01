import React from 'react';
import { 
  ShieldAlert, Clock, AlertTriangle, Fingerprint, 
  Database, TrendingUp, CheckCircle2, Info 
} from 'lucide-react';

export default function SentinelPriorityBreakdown({ breakdown, totalScore, severity, evidenceSources = [] }) {
  if (!breakdown) return null;

  const severityColors = {
    CRITICAL: { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444' },
    HIGH: { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b' },
    MEDIUM: { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6' },
    LOW: { text: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981' },
    INFORMATIONAL: { text: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: '#94a3b8' }
  };

  const activeColor = severityColors[severity] || severityColors.MEDIUM;

  const dimensions = [
    { key: 'risk', label: 'Offense & Suspect Risk', icon: ShieldAlert, data: breakdown.risk, color: '#ef4444' },
    { key: 'staleness', label: 'Case Inactivity & Staleness', icon: Clock, data: breakdown.staleness, color: '#f59e0b' },
    { key: 'investigationGap', label: 'Procedural Investigation Gaps', icon: AlertTriangle, data: breakdown.investigationGap, color: '#dc2626' },
    { key: 'moIntelligence', label: 'Modus Operandi & Syndicate Overlap', icon: Fingerprint, data: breakdown.moIntelligence, color: '#8b5cf6' },
    { key: 'evidenceDeficit', label: 'Evidentiary Completeness Deficit', icon: Database, data: breakdown.evidenceDeficit, color: '#06b6d4' },
    { key: 'patternSurge', label: 'Precinct Crime Pattern Surge', icon: TrendingUp, data: breakdown.patternSurge, color: '#10b981' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Score Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', background: activeColor.bg, borderRadius: '8px',
        border: `1px solid ${activeColor.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: activeColor.text, lineHeight: 1 }}>
            {totalScore}<span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>/100</span>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: activeColor.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {severity} PRIORITY
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Deterministic Multi-Vector Triage Score
            </div>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' }}>
          Strict Evidence Provenance Verified
        </div>
      </div>

      {/* 6 Dimensions Breakdown Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {dimensions.map((dim) => {
          const score = dim.data?.score || 0;
          const max = dim.data?.max || 10;
          const pct = Math.min(100, Math.round((score / max) * 100));
          const reasons = dim.data?.reasons || [];

          return (
            <div key={dim.key} style={{
              background: 'rgba(255,255,255,0.03)', padding: '10px 14px',
              borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <dim.icon size={15} color={dim.color} />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {dim.label}
                  </span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: dim.color }}>
                  {score} / {max} pts
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: dim.color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
              </div>

              {/* Reason Snippet */}
              {reasons.length > 0 && (
                <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.4', marginTop: '4px' }}>
                  • {reasons[0]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Traceable Evidence Sources */}
      {evidenceSources && evidenceSources.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
            Traceable Evidence Sources ({evidenceSources.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {evidenceSources.map((ev, idx) => (
              <span key={idx} style={{
                fontSize: '11px', padding: '3px 8px', borderRadius: '4px',
                background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}>
                <CheckCircle2 size={11} color="#3b82f6" />
                <span>[{ev.type}]: {ev.label || ev.id}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
