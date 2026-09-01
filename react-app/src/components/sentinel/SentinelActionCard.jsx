import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, AlertTriangle, CheckCircle, XCircle, 
  ExternalLink, Check, X, Clock, FileText, ChevronRight, Lock 
} from 'lucide-react';

export default function SentinelActionCard({ action, onDecision, isProcessing = false }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(null); // 'APPROVE' | 'DISMISS' | null
  const [rationale, setRationale] = useState('');

  if (!action) return null;

  const severityConfigs = {
    CRITICAL: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)', badge: 'CRITICAL ACTION' },
    HIGH: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)', badge: 'HIGH PRIORITY' },
    MEDIUM: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.35)', badge: 'MEDIUM PRIORITY' },
    LOW: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)', badge: 'LOW PRIORITY' },
    INFORMATIONAL: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.35)', badge: 'INFORMATION' }
  };

  const config = severityConfigs[action.severity] || severityConfigs.MEDIUM;

  const handleDrillDown = () => {
    if (action.drillDown?.deepLink) {
      navigate(action.drillDown.deepLink);
    } else {
      navigate(`/investigate/${action.caseId}`);
    }
  };

  const submitDecision = async () => {
    if (!showModal) return;
    await onDecision(action.actionId, showModal, rationale);
    setShowModal(null);
    setRationale('');
  };

  return (
    <div className="glass-panel" style={{
      padding: '20px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '14px',
      borderLeft: `5px solid ${config.color}`, background: 'rgba(30, 41, 59, 0.85)',
      border: '1px solid rgba(255,255,255,0.1)',
      position: 'relative'
    }}>
      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px',
            background: config.bg, color: config.color, border: `1px solid ${config.border}`
          }}>
            {config.badge}
          </span>
          <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#60a5fa' }}>
            {action.caseNumber || `Case #${action.caseId}`}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Score: <strong style={{ color: config.color }}>{action.priorityScore}/100</strong>
          </span>
        </div>

        {/* Status Badge */}
        <div>
          {action.status === 'APPROVED' ? (
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} /> APPROVED BY {action.reviewedBy || 'OFFICER'}
            </span>
          ) : action.status === 'DISMISSED' ? (
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <XCircle size={12} /> DISMISSED
            </span>
          ) : (
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> AWAITING HUMAN REVIEW
            </span>
          )}
        </div>
      </div>

      {/* Action Title & Finding */}
      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#f8fafc', fontWeight: '700' }}>
          {action.title}
        </h4>
        <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', fontWeight: '400' }}>
          {action.finding}
        </p>
      </div>

      {/* Recommended Action Callout */}
      <div style={{
        padding: '12px 14px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)',
        border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', flexDirection: 'column', gap: '4px'
      }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Recommended Procedural Action:
        </div>
        <div style={{ fontSize: '13px', color: '#f8fafc', fontWeight: '500', lineHeight: '1.4' }}>
          {action.recommendedAction}
        </div>
      </div>

      {/* Evidence Sources Preview */}
      {action.evidenceSources && action.evidenceSources.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Evidence:</span>
          {action.evidenceSources.map((ev, i) => (
            <span key={i} style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
              background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
              [{ev.type}] {ev.label || ev.id}
            </span>
          ))}
        </div>
      )}

      {/* Footer Controls & Human Gate */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
        gap: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px', marginTop: '4px'
      }}>
        <button
          onClick={handleDrillDown}
          style={{
            background: 'rgba(59, 130, 246, 0.12)', border: '1px solid #3b82f6', color: '#60a5fa',
            padding: '6px 14px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <ExternalLink size={14} />
          <span>VIEW EVIDENCE IN WORKSPACE</span>
        </button>

        {/* Human-in-the-Loop Decision Buttons */}
        {action.status === 'AWAITING_REVIEW' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowModal('DISMISS')}
              disabled={isProcessing}
              style={{
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171', padding: '6px 14px', borderRadius: '6px', fontSize: '11.5px',
                fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <X size={14} />
              <span>DISMISS</span>
            </button>
            <button
              onClick={() => setShowModal('APPROVE')}
              disabled={isProcessing}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
                color: '#ffffff', padding: '6px 18px', borderRadius: '6px', fontSize: '11.5px',
                fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Check size={14} />
              <span>APPROVE ACTION</span>
            </button>
          </div>
        )}
      </div>

      {/* Decision Rationale Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '480px', padding: '24px', borderRadius: '12px',
            background: '#0f172a', border: '1px solid var(--glass-border)', display: 'flex',
            flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px', fontWeight: '800' }}>
                {showModal === 'APPROVE' ? 'Confirm Action Approval' : 'Dismiss Sentinel Recommendation'}
              </h3>
              <button onClick={() => setShowModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {showModal === 'APPROVE'
                ? `You are signing off on the procedural recommendation for ${action.caseNumber}. This decision will be logged to the immutable security audit trail with cryptographic hashing.`
                : `Provide an optional reason for dismissing this Sentinel recommendation for ${action.caseNumber}.`}
            </p>

            <textarea
              placeholder="Enter optional officer justification/rationale..."
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
              style={{
                width: '100%', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px', padding: '10px', color: '#fff', fontSize: '13px', resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowModal(null)}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-secondary)', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                onClick={submitDecision}
                disabled={isProcessing}
                style={{
                  background: showModal === 'APPROVE' ? 'linear-gradient(135deg, #10b981, #059669)' : '#ef4444',
                  border: 'none', color: '#fff', padding: '8px 18px', borderRadius: '6px',
                  fontWeight: '700', cursor: 'pointer', fontSize: '12px'
                }}
              >
                {isProcessing ? 'Recording...' : `Confirm ${showModal === 'APPROVE' ? 'Approval' : 'Dismissal'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
