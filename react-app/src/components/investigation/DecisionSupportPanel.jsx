import React, { useState, useEffect } from 'react';
import { Layers, ArrowRight, Share2, AlertTriangle, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const DecisionSupportPanel = ({ caseId = '', defaultExpanded = true }) => {
    const navigate = useNavigate();
    const [similarCases, setSimilarCases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!caseId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        api.get(`/decision/similar-cases/${caseId}`)
            .then((simRes) => {
                if (simRes.data?.success) setSimilarCases(simRes.data.data);
                setLoading(false);
            })
            .catch(err => {
                console.debug('[DecisionSupportPanel] Error loading similar cases:', err);
                setLoading(false);
            });
    }, [caseId]);

    if (loading) {
        return (
            <div className="glass-panel" style={{ padding: '24px', color: 'var(--text-muted)', fontSize: '14px', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spin"><Compass size={24} color="var(--accent-primary)" /></div>
                Querying historical datastores for similar precedents...
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
                <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <Share2 size={24} color="#8b5cf6" />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        Historical Intelligence
                    </h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Identifying statistically similar historical cases in the datastore to inform investigation strategy.
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {similarCases.length > 0 ? similarCases.map((c, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', background: 'rgba(139,92,246,0.03)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Case #{c.caseId}
                                    <span style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.3)' }}>
                                        Similarity: {c.similarityScore}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        {c.matchDetails && (
                            <div style={{ marginTop: '4px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Intersection Points:</div>
                                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#cbd5e1' }}>
                                    {c.matchDetails.crimeType && <li><strong style={{ color: '#94a3b8' }}>Crime Type:</strong> {c.matchDetails.crimeType}</li>}
                                    {c.matchDetails.mo && <li><strong style={{ color: '#94a3b8' }}>M.O.:</strong> {c.matchDetails.mo}</li>}
                                    {c.matchDetails.location && <li><strong style={{ color: '#94a3b8' }}>Location:</strong> {c.matchDetails.location}</li>}
                                    {c.matchDetails.temporal && <li><strong style={{ color: '#94a3b8' }}>Temporal:</strong> {c.matchDetails.temporal}</li>}
                                    {c.matchDetails.sharedEntities && <li><strong style={{ color: '#94a3b8' }}>Entities:</strong> {c.matchDetails.sharedEntities}</li>}
                                </ul>
                            </div>
                        )}
                        <button 
                            onClick={() => navigate(`/cases/${c.caseId}`)} 
                            style={{ alignSelf: 'flex-start', padding: '8px 16px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '6px', color: '#c4b5fd', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(139,92,246,0.2)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(139,92,246,0.1)'}
                        >
                            Open Case Record <ArrowRight size={14} />
                        </button>
                    </div>
                )) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--glass-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <AlertTriangle size={32} color="var(--text-muted)" />
                        <div>Insufficient historical data available to compute statistical similarities.</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DecisionSupportPanel;
