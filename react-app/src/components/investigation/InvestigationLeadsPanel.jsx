import React, { useState, useEffect } from 'react';
import { 
    Zap, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, 
    ArrowUpRight, Clock, Users, Database, FileText, Search, Loader2, Sparkles
} from 'lucide-react';
import api from '../../services/api';

const InvestigationLeadsPanel = ({ caseId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLead, setSelectedLead] = useState(null);
    const [xaiModalData, setXaiModalData] = useState(null);

    useEffect(() => {
        if (!caseId) return;
        setLoading(true);
        setError(null);
        api.get(`/intelligence/case/${caseId}/leads`)
            .then(res => {
                if (res.data?.success) {
                    setData(res.data.data);
                    if (res.data.data.leads?.length > 0) {
                        setSelectedLead(res.data.data.leads[0]);
                    }
                } else {
                    setError(res.data?.error || 'Failed to load investigation leads');
                }
            })
            .catch(err => {
                setError(err.message || 'Failed to load investigation leads');
            })
            .finally(() => setLoading(false));
    }, [caseId]);

    if (loading) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px', color: 'var(--accent-primary)' }} />
                <div>Synthesizing Prioritized Investigation Leads...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <AlertTriangle size={36} color="#ef4444" style={{ marginBottom: '12px' }} />
                <div>{error || 'No investigation leads generated for this case.'}</div>
            </div>
        );
    }

    const { leads = [], leadCount = 0, classification = 'EVIDENCE_BACKED' } = data;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header Banner */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Zap size={22} color="#f59e0b" />
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            Investigation Reasoning & Ranked Leads Engine
                        </h2>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Autonomous multi-case correlation, modus operandi analysis, and evidence-grounded next-step reasoning
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                        {leadCount} RANKED LEADS
                    </span>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                        {classification}
                    </span>
                </div>
            </div>

            {/* Leads Split View */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                
                {/* Left Column: Leads List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Prioritized Action Items
                    </h3>
                    {leads.map((lead, idx) => {
                        const isSelected = selectedLead?.leadId === lead.leadId;
                        const isHigh = lead.priority === 'HIGH';
                        const isAction = lead.status === 'ACTION_REQUIRED' || lead.status === 'URGENT';

                        return (
                            <div 
                                key={lead.leadId || idx}
                                onClick={() => setSelectedLead(lead)}
                                style={{
                                    padding: '16px',
                                    borderRadius: '10px',
                                    background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-secondary)',
                                    border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        fontSize: '10px',
                                        fontWeight: '800',
                                        background: isHigh ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                        color: isHigh ? '#ef4444' : '#f59e0b'
                                    }}>
                                        {lead.priority} PRIORITY
                                    </span>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981' }}>
                                        {(lead.confidence * 100).toFixed(0)}% CONFIDENCE
                                    </span>
                                </div>

                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    {lead.title}
                                </div>

                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                    {lead.finding}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                    <span>Type: {lead.type}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontWeight: '600' }}>
                                        Inspect Lead <ChevronRight size={12} />
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right Column: Lead Deep-Dive & Human Verification */}
                {selectedLead && (
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                            <div>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Lead ID: {selectedLead.leadId}</div>
                                <h3 style={{ margin: '4px 0 0 0', fontSize: '17px', color: 'var(--text-primary)' }}>{selectedLead.title}</h3>
                            </div>
                            <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                                {selectedLead.classification}
                            </span>
                        </div>

                        {/* Finding */}
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>INVESTIGATIVE FINDING:</div>
                            <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.5', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px' }}>
                                {selectedLead.finding}
                            </div>
                        </div>

                        {/* Reasoning */}
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>ALGORITHMIC REASONING CHAIN:</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                {selectedLead.reasoning}
                            </div>
                        </div>

                        {/* Supporting Evidence Pills */}
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>SUPPORTING EVIDENCE RECORDS:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedLead.supportingEvidence?.map((ev, i) => (
                                    <span key={i} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontWeight: '600', border: '1px solid rgba(59,130,246,0.2)' }}>
                                        <Database size={11} style={{ display: 'inline', marginRight: '4px' }} /> {ev}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Human Verification Required Action Box */}
                        <div style={{ marginTop: 'auto', padding: '16px', borderRadius: '10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: '700', fontSize: '12px', marginBottom: '6px' }}>
                                <ShieldCheck size={16} /> MANDATORY HUMAN VERIFICATION STEP:
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                                {selectedLead.recommendedVerification}
                            </div>
                        </div>

                        {/* XAI Explanation Trigger Button */}
                        <button
                            onClick={async () => {
                                try {
                                    const res = await api.get(`/intelligence/explain/lead/${caseId}?insightId=${selectedLead.leadId}`);
                                    if (res.data?.success) {
                                        setXaiModalData(res.data.data);
                                    }
                                } catch (e) {
                                    console.error('Failed to fetch XAI explanation', e);
                                }
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
                                border: '1px solid rgba(139,92,246,0.4)',
                                borderRadius: '8px',
                                color: '#a78bfa',
                                fontWeight: '700',
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Sparkles size={16} /> Inspect Explainable AI (XAI) Contract
                        </button>
                    </div>
                )}
            </div>

            {/* XAI Modal Drawer */}
            {xaiModalData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div className="glass-panel" style={{
                        maxWidth: '650px', width: '100%', maxHeight: '85vh', overflowY: 'auto',
                        padding: '28px', borderRadius: '16px', border: '1px solid rgba(139,92,246,0.4)',
                        display: 'flex', flexDirection: 'column', gap: '16px', background: '#0f172a'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#a78bfa' }}>
                                <Sparkles size={20} />
                                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>Explainable AI (XAI) Framework Contract</h3>
                            </div>
                            <button onClick={() => setXaiModalData(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase' }}>1. WHAT (Investigative Finding)</div>
                                <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', marginTop: '4px' }}>{xaiModalData.what}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#8b5cf6', textTransform: 'uppercase' }}>2. WHY (Algorithmic Justification)</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{xaiModalData.why}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase' }}>3. SUPPORTING EVIDENCE RECORDS</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                    {xaiModalData.evidence?.map((ev, idx) => (
                                        <span key={idx} style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '11px', fontWeight: '600' }}>
                                            {ev}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase' }}>4. NUMERICAL CONFIDENCE</div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#f59e0b', marginTop: '2px' }}>
                                        {typeof xaiModalData.confidence === 'number' ? `${(xaiModalData.confidence * 100).toFixed(0)}%` : xaiModalData.confidence}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{xaiModalData.confidenceJustification}</div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#06b6d4', textTransform: 'uppercase' }}>5. INFERENCE CLASSIFICATION</div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: xaiModalData.isAIInferred ? '#f59e0b' : '#10b981', marginTop: '2px' }}>
                                        {xaiModalData.classification}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{xaiModalData.isAIInferred ? 'AI Interpretation' : 'Deterministic Ground Truth'}</div>
                                </div>
                            </div>

                            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase' }}>6. MANDATORY HUMAN INVESTIGATOR VERIFICATION</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>{xaiModalData.humanVerificationRequired}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setXaiModalData(null)} style={{ padding: '8px 18px', borderRadius: '8px', background: 'var(--accent-primary)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Close Explanation</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvestigationLeadsPanel;
