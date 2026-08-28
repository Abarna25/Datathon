import React, { useState, useEffect } from 'react';
import { 
    Fingerprint, Shield, Clock, Crosshair, Truck, Lock, 
    Share2, AlertTriangle, Loader2, CheckCircle2, ChevronRight, Info
} from 'lucide-react';
import api from '../../services/api';

const MOProfilePanel = ({ caseId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '16px', textAlign: 'center' }}>
                        No historical cases in Karnataka Datastore currently exceed the 40% MO similarity threshold.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MOProfilePanel;
