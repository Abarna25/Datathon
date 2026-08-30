import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader2, ArrowUpRight, ArrowDownRight, Minus, AlertCircle } from 'lucide-react';

const EvidenceImpactTimeline = ({ caseId }) => {
    const [impacts, setImpacts] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadImpacts = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/server/vikshana_function/cases/${caseId}/evidence/impact`);
            if (res.data?.success) {
                setImpacts(res.data.data.sort((a,b) => new Date(b.Timestamp) - new Date(a.Timestamp)));
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (caseId) loadImpacts();
    }, [caseId]);

    const getImpactIcon = (type) => {
        switch(type) {
            case 'STRENGTHENED': return <ArrowUpRight color="#10b981" size={20} />;
            case 'WEAKENED': return <ArrowDownRight color="#f59e0b" size={20} />;
            case 'CONTRADICTED': return <AlertCircle color="#ef4444" size={20} />;
            default: return <Minus color="#64748b" size={20} />;
        }
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}><Loader2 className="spin" /></div>;

    if (impacts.length === 0) {
        return (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No material evidence impacts recorded yet.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>What Changed? (Evidence Impact)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '2px solid var(--glass-border)', paddingLeft: '16px', marginLeft: '8px' }}>
                {impacts.map((impact, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-25px', top: '16px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px solid var(--accent-primary)' }} />
                        <div className="glass-panel" style={{ padding: '16px', borderLeft: `4px solid ${impact.ImpactType === 'STRENGTHENED' ? '#10b981' : impact.ImpactType === 'WEAKENED' ? '#f59e0b' : impact.ImpactType === 'CONTRADICTED' ? '#ef4444' : '#64748b'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        {getImpactIcon(impact.ImpactType)}
                                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                            {impact.ImpactType} Hypothesis {impact.HypothesisID}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                        {impact.Explanation}
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        <div><strong>Before:</strong> {impact.PreviousStatus} ({impact.PreviousScore})</div>
                                        <div><strong>After:</strong> {impact.NewStatus} ({impact.NewScore})</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {new Date(impact.Timestamp).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EvidenceImpactTimeline;
