import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, Link, Camera, Truck, PhoneCall, CreditCard, 
    Users, Scale, AlertTriangle, Loader2, CheckCircle2, ChevronRight, Hash
} from 'lucide-react';
import api from '../../services/api';

const EvidenceChainView = ({ caseId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!caseId) return;
        setLoading(true);
        setError(null);
        api.get(`/intelligence/case/${caseId}/evidence-chain`)
            .then(res => {
                if (res.data?.success) {
                    setData(res.data.data);
                } else {
                    setError(res.data?.error || 'Failed to load evidence chain');
                }
            })
            .catch(err => {
                setError(err.message || 'Failed to load evidence chain');
            })
            .finally(() => setLoading(false));
    }, [caseId]);

    if (loading) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px', color: 'var(--accent-primary)' }} />
                <div>Verifying Cryptographic Evidence Chain & SHA-256 Hashes...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <AlertTriangle size={36} color="#ef4444" style={{ marginBottom: '12px' }} />
                <div>{error || 'No evidence chain assembled for this case.'}</div>
            </div>
        );
    }

    const { nodes = [], chainLength = 0, classification = 'EVIDENCE_BACKED' } = data;

    const getNodeIcon = (type) => {
        switch (type) {
            case 'case_root': return ShieldCheck;
            case 'cctv_surveillance': return Camera;
            case 'vehicle_transit': return Truck;
            case 'cdr_telecom': return PhoneCall;
            case 'financial_ledger': return CreditCard;
            case 'accused_entity': return Users;
            case 'court_hearing': return Scale;
            default: return Link;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header Banner */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Link size={22} color="var(--accent-primary)" />
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                            Unified Multi-Modal Evidence Chain of Custody
                        </h2>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        End-to-end evidence linking from initial FIR to CCTV, telecom CDRs, financial forensics, and judicial hearings
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                        <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} /> {chainLength} VERIFIED EVIDENCE NODES
                    </span>
                </div>
            </div>

            {/* Evidence Chain Visual Timeline */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>
                    Chronological Multi-Modal Evidence Flow
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {nodes.map((node, index) => {
                        const Icon = getNodeIcon(node.type);
                        const isLast = index === nodes.length - 1;

                        return (
                            <div key={node.id || index} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                                {/* Timeline stem */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        background: 'rgba(59, 130, 246, 0.15)',
                                        border: '2px solid var(--accent-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--accent-primary)',
                                        zIndex: 2
                                    }}>
                                        <Icon size={18} />
                                    </div>
                                    {!isLast && (
                                        <div style={{ width: '2px', flex: 1, background: 'var(--border-color)', margin: '4px 0' }} />
                                    )}
                                </div>

                                {/* Node Content Box */}
                                <div style={{
                                    flex: 1,
                                    padding: '16px',
                                    borderRadius: '10px',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    marginBottom: !isLast ? '12px' : '0'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                            {node.label}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            Source: <strong>{node.provenance}</strong>
                                        </span>
                                    </div>

                                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                                        {node.description}
                                    </div>

                                    {node.integrityDigest && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '10.5px', color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                                            <Hash size={12} /> SHA-256: {node.integrityDigest} (INTEGRITY VERIFIED)
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default EvidenceChainView;
