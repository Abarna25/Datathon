import React, { useState, useEffect } from 'react';
import { 
    Fingerprint, Shield, Clock, Crosshair, Truck, Lock, 
    Share2, AlertTriangle, Loader2, CheckCircle2, ChevronRight, Info, Sparkles
} from 'lucide-react';
import api from '../../services/api';

const MOProfilePanel = ({ caseId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [xaiModalData, setXaiModalData] = useState(null);

    useEffect(() => {
        if (!caseId) return;
        setLoading(true);
        setError(null);
        api.get(`/intelligence/case/${caseId}/mo`)
            .then(res => {
                if (res.data?.success) {
                    setData(res.data.data);
                } else {
                    setError(res.data?.error || 'Failed to load MO intelligence');
                }
            })
            .catch(err => {
                setError(err.message || 'Failed to load MO intelligence');
            })
            .finally(() => setLoading(false));
    }, [caseId]);

    if (loading) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px', color: 'var(--accent-primary)' }} />
                <div>Extracting Modus Operandi Pattern Dimensions...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <AlertTriangle size={36} color="#ef4444" style={{ marginBottom: '12px' }} />
                <div>{error || 'No MO intelligence available for this case.'}</div>
            </div>
        );
    }

    const { moProfile, matchedHistoricalCases = [], totalHistoricalAnalyzed = 0 } = data;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header Banner */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Fingerprint size={22} color="var(--accent-primary)" />
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            Modus Operandi (MO) Pattern Intelligence
                        </h2>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Deterministic multi-dimensional criminal signature extraction and weighted historical case matching
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                        {matchedHistoricalCases.length} PATTERN MATCHES
                    </span>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                        {totalHistoricalAnalyzed} CASES ANALYZED
                    </span>
                </div>
            </div>

            {/* Extracted MO Profile Dimensions Grid */}
            {moProfile && (
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>
                        Extracted Criminal Operational Profile — Case #{caseId}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        {[
                            { label: 'Entry Method', val: moProfile.entryMethod, icon: Lock, color: '#3b82f6', weight: '25%' },
                            { label: 'Target Category', val: moProfile.targetCategory, icon: Crosshair, color: '#8b5cf6', weight: '20%' },
                            { label: 'Time Window', val: moProfile.timeWindow, icon: Clock, color: '#f59e0b', weight: '15%' },
                            { label: 'Precinct Sector', val: moProfile.precinctLocation, icon: Shield, color: '#10b981', weight: '15%' },
                            { label: 'Weapon Profile', val: moProfile.weaponUsed, icon: Crosshair, color: '#ef4444', weight: '10%' },
                            { label: 'Vehicle Transit', val: moProfile.vehicleUsed, icon: Truck, color: '#06b6d4', weight: '10%' }
                        ].map((dim, i) => (
                            <div key={i} style={{ padding: '14px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <dim.icon size={13} color={dim.color} /> {dim.label}
                                    </span>
                                    <span style={{ fontWeight: '700' }}>{dim.weight}</span>
                                </div>
                                <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    {dim.val}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Matched Historical Cases */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>
                    Historical Modus Operandi Pattern Matches
                </h3>

                {matchedHistoricalCases.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                        {matchedHistoricalCases.map((match, idx) => (
                            <div key={match.caseId || idx} style={{ padding: '16px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                                        Case #{match.caseId} ({match.crimeNo})
                                    </span>
                                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                                        {(match.moSimilarity * 100).toFixed(0)}% MO MATCH
                                    </span>
                                </div>

                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                    {match.briefFacts}
                                </div>

                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    <strong>Matching Factors:</strong> {match.matchedAttributes.join(', ')}
                                </div>

                                <div style={{ marginTop: 'auto', padding: '8px', borderRadius: '6px', background: 'rgba(59,130,246,0.06)', fontSize: '11px', color: 'var(--accent-primary)' }}>
                                    <strong>Pattern Explanation:</strong> {match.explanation}
                                </div>

                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await api.get(`/intelligence/explain/mo/${caseId}`);
                                            if (res.data?.success) {
                                                setXaiModalData(res.data.data);
                                            }
                                        } catch (e) {
                                            console.error('Failed to fetch XAI MO explanation', e);
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        background: 'rgba(139,92,246,0.15)',
                                        border: '1px solid rgba(139,92,246,0.3)',
                                        borderRadius: '6px',
                                        color: '#a78bfa',
                                        fontSize: '11.5px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        marginTop: '6px'
                                    }}
                                >
                                    <Sparkles size={13} /> View XAI Attribution
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '16px', textAlign: 'center' }}>
                        No historical cases in Karnataka Datastore currently exceed the 40% MO similarity threshold.
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
                                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>Explainable AI (XAI) — MO Similarity Breakdown</h3>
                            </div>
                            <button onClick={() => setXaiModalData(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase' }}>1. WHAT (MO Correlation)</div>
                                <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', marginTop: '4px' }}>{xaiModalData.what}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#8b5cf6', textTransform: 'uppercase' }}>2. WHY (Signature Matching)</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{xaiModalData.why}</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase' }}>3. MATCHED EVIDENCE & CRIME NOS</div>
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
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase' }}>4. WEIGHTED JACCARD SCORE</div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#f59e0b', marginTop: '2px' }}>
                                        {typeof xaiModalData.confidence === 'number' ? `${(xaiModalData.confidence * 100).toFixed(0)}%` : xaiModalData.confidence}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{xaiModalData.confidenceJustification}</div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#06b6d4', textTransform: 'uppercase' }}>5. CLASSIFICATION</div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#10b981', marginTop: '2px' }}>
                                        {xaiModalData.classification}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Deterministic Signature Matching</div>
                                </div>
                            </div>

                            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase' }}>6. MANDATORY HUMAN VERIFICATION</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>{xaiModalData.humanVerificationRequired}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setXaiModalData(null)} style={{ padding: '8px 18px', borderRadius: '8px', background: 'var(--accent-primary)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MOProfilePanel;
