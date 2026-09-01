import React, { useState, useEffect } from 'react';
import { Sparkles, Shield, User, Info, CheckCircle2, XCircle, HelpCircle, FileText, Loader2, AlertCircle } from 'lucide-react';
import foresightService from '../../services/foresightService';
import ForesightScoreGauge from './ForesightScoreGauge';
import ForesightShapFactors from './ForesightShapFactors';
import ForesightEvidenceCard from './ForesightEvidenceCard';
import ForesightModelCardModal from './ForesightModelCardModal';

export default function ForesightPanel({ caseId, suspects = [], activeSuspect = null }) {
    const [selectedSuspect, setSelectedSuspect] = useState(activeSuspect || suspects[0]?.name || 'Prakash Kulkarni');
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modelCard, setModelCard] = useState(null);
    const [showModelCard, setShowModelCard] = useState(false);

    // Decision state
    const [decisionModalOpen, setDecisionModalOpen] = useState(false);
    const [pendingDecision, setPendingDecision] = useState(null);
    const [officerNotes, setOfficerNotes] = useState('');
    const [decisionLoading, setDecisionLoading] = useState(false);
    const [latestDecision, setLatestDecision] = useState(null);

    useEffect(() => {
        if (activeSuspect) {
            setSelectedSuspect(activeSuspect);
        } else if (suspects.length > 0 && !selectedSuspect) {
            setSelectedSuspect(suspects[0].name);
        }
    }, [activeSuspect, suspects]);

    useEffect(() => {
        if (selectedSuspect) {
            loadAssessment(selectedSuspect);
        }
        loadModelCard();
    }, [selectedSuspect, caseId]);

    const loadAssessment = async (accusedName) => {
        setLoading(true);
        setError(null);
        try {
            const data = await foresightService.assessAccused(accusedName, caseId);
            setAssessment(data);
            setLatestDecision(null);
        } catch (err) {
            console.error('Failed to load Foresight assessment:', err);
            setError(err.response?.data?.error || err.message || 'Failed to generate assessment');
        } finally {
            setLoading(false);
        }
    };

    const loadModelCard = async () => {
        try {
            const card = await foresightService.getModelCard();
            setModelCard(card);
        } catch (e) {
            console.warn('Could not preload model card:', e);
        }
    };

    const handleOpenDecision = (decisionType) => {
        setPendingDecision(decisionType);
        setOfficerNotes('');
        setDecisionModalOpen(true);
    };

    const handleSubmitDecision = async () => {
        if (!assessment || !pendingDecision) return;
        setDecisionLoading(true);
        try {
            const res = await foresightService.submitOfficerDecision({
                assessmentId: assessment.assessmentId,
                accusedName: selectedSuspect,
                caseId,
                decision: pendingDecision,
                officerNotes
            });
            setLatestDecision(res.decision);
            setDecisionModalOpen(false);
        } catch (err) {
            alert('Failed to record decision: ' + (err.response?.data?.error || err.message));
        } finally {
            setDecisionLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header & Controls */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '10px', borderRadius: '10px', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                            <Sparkles size={22} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                                    VIKSHANA FORESIGHT
                                </h2>
                                <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                                    Predictive ML
                                </span>
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                                Evidence-Grounded Historical Pattern & Recidivism Association Engine
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                            onClick={() => setShowModelCard(true)}
                            style={{
                                background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)',
                                color: '#818cf8', padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                                fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <FileText size={14} />
                            Model Card & Limitations
                        </button>
                    </div>
                </div>

                {/* Suspect Selector */}
                {suspects.length > 0 && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                            <User size={14} /> Assessed Suspect:
                        </span>
                        {suspects.map((s) => (
                            <button
                                key={s.name}
                                onClick={() => setSelectedSuspect(s.name)}
                                style={{
                                    padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    background: selectedSuspect === s.name ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                    color: selectedSuspect === s.name ? '#ffffff' : 'var(--text-secondary)',
                                    border: selectedSuspect === s.name ? '1px solid #60a5fa' : '1px solid var(--border-color)'
                                }}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Ethical Guardrail Banner */}
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '12px 16px', borderRadius: '10px', display: 'flex', items: 'flex-start', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                <Info size={16} color="#818cf8" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Investigative Decision Support Only:</strong> This supervised machine learning model discovers statistical associations from historical Karnataka Police dockets. It does <em>not</em> declare guilt, dangerousness, or automate any operational action without explicit human review.
                </div>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}>
                    <Loader2 size={32} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        Extracting time-safe features & computing calibrated statistical score...
                    </p>
                </div>
            ) : error ? (
                <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#f87171', fontSize: '13px' }}>
                    <AlertCircle size={24} color="#ef4444" style={{ margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontWeight: '700' }}>{error}</p>
                </div>
            ) : assessment ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Visual Score Gauge & SHAP Attributions */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                        <div>
                            <ForesightScoreGauge assessment={assessment} />
                        </div>
                        <div>
                            <ForesightShapFactors
                                factors={assessment.topContributingFactors}
                                allFactors={assessment.allFactors}
                            />
                        </div>
                    </div>

                    {/* Grounded Historical Evidence Card */}
                    <ForesightEvidenceCard evidence={assessment.groundedEvidence} />

                    {/* Human-in-the-Loop Officer Decision Gate */}
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Shield size={16} color="#818cf8" />
                                    Human-in-the-Loop Review Gate
                                </h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    Officer review required. Record formal acknowledgement before proceeding with case follow-up.
                                </p>
                            </div>

                            {latestDecision ? (
                                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                                    <CheckCircle2 size={16} color="#10b981" />
                                    <span>
                                        Decision <strong>{latestDecision.decision}</strong> recorded by {latestDecision.reviewer}
                                    </span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                        onClick={() => handleOpenDecision('ACKNOWLEDGE')}
                                        style={{
                                            background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
                                            color: '#ffffff', padding: '8px 16px', borderRadius: '8px', fontSize: '12px',
                                            fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                        }}
                                    >
                                        <CheckCircle2 size={14} /> Acknowledge
                                    </button>
                                    <button
                                        onClick={() => handleOpenDecision('REQUEST_MORE_INFO')}
                                        style={{
                                            background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)',
                                            color: '#f59e0b', padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                                            fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                        }}
                                    >
                                        <HelpCircle size={14} /> Request Info
                                    </button>
                                    <button
                                        onClick={() => handleOpenDecision('DISMISS')}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
                                            color: '#f87171', padding: '8px 14px', borderRadius: '8px', fontSize: '12px',
                                            fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                        }}
                                    >
                                        <XCircle size={14} /> Dismiss
                                    </button>
                                </div>
                            )}
                        </div>

                        {latestDecision && (
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Digest: {latestDecision.evidenceDigest}</span>
                                <span>Timestamp: {latestDecision.reviewedAt}</span>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Officer Decision Modal */}
            {decisionModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={16} color="#818cf8" />
                                Record Officer Decision ({pendingDecision})
                            </h3>
                            <button
                                onClick={() => setDecisionModalOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
                            >
                                ✕
                            </button>
                        </div>

                        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)' }}>
                            Subject: <strong style={{ color: 'var(--text-primary)' }}>{selectedSuspect}</strong> (Case #{caseId || 'N/A'})
                        </p>

                        <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                                Officer Investigative Justification / Notes (Optional):
                            </label>
                            <textarea
                                value={officerNotes}
                                onChange={(e) => setOfficerNotes(e.target.value)}
                                placeholder="Enter operational notes or physical docket verification details..."
                                rows={3}
                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none' }}
                            />
                        </div>

                        <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)' }}>
                            Decision will be cryptographically hashed (SHA-256) and logged immutably to the VIKSHANA Forensic Audit Trail.
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                                onClick={() => setDecisionModalOpen(false)}
                                style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitDecision}
                                disabled={decisionLoading}
                                style={{ padding: '8px 18px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                {decisionLoading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                                Confirm & Record
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Model Card Modal */}
            <ForesightModelCardModal
                isOpen={showModelCard}
                onClose={() => setShowModelCard(false)}
                modelCard={modelCard}
            />
        </div>
    );
}
