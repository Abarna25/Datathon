import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader2, Plus, Target, CheckCircle, AlertTriangle, HelpCircle, XCircle } from 'lucide-react';

const HypothesisPanel = ({ caseId }) => {
    const [hypotheses, setHypotheses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newStatement, setNewStatement] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadHypotheses = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/server/vikshana_function/cases/${caseId}/hypotheses`);
            if (res.data?.success) {
                setHypotheses(res.data.data);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (caseId) loadHypotheses();
    }, [caseId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newStatement.trim()) return;
        setSubmitting(true);
        try {
            await api.post(`/server/vikshana_function/cases/${caseId}/hypotheses`, { statement: newStatement });
            setNewStatement('');
            await loadHypotheses();
        } catch (e) {
            console.error(e);
        }
        setSubmitting(false);
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'SUPPORTED': return <CheckCircle color="#10b981" size={20} />;
            case 'PARTIALLY_SUPPORTED': return <AlertTriangle color="#f59e0b" size={20} />;
            case 'CONTRADICTED': return <XCircle color="#ef4444" size={20} />;
            default: return <HelpCircle color="#64748b" size={20} />;
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'SUPPORTED': return '#10b981';
            case 'PARTIALLY_SUPPORTED': return '#f59e0b';
            case 'CONTRADICTED': return '#ef4444';
            default: return '#64748b';
        }
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}><Loader2 className="spin" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={20} color="#3b82f6" />
                    Evaluate New Hypothesis
                </h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
                    <input 
                        type="text" 
                        value={newStatement}
                        onChange={e => setNewStatement(e.target.value)}
                        placeholder="e.g. Person A was present at Location X between 20:00 and 20:30."
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        disabled={submitting}
                    />
                    <button 
                        type="submit" 
                        disabled={submitting || !newStatement.trim()}
                        style={{ padding: '0 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                    >
                        {submitting ? <Loader2 size={16} className="spin" /> : 'Evaluate'}
                    </button>
                </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {hypotheses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No hypotheses evaluated yet.
                    </div>
                ) : (
                    hypotheses.map((hr, idx) => (
                        <div key={idx} className="glass-panel" style={{ padding: '20px', borderLeft: `4px solid ${getStatusColor(hr.hypothesis.Status)}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        HYPOTHESIS {hr.hypothesis.HypothesisID}
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                        {hr.hypothesis.Statement}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '20px' }}>
                                    {getStatusIcon(hr.hypothesis.Status)}
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: getStatusColor(hr.hypothesis.Status) }}>
                                        {hr.hypothesis.Status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>Evidence Support</div>
                                <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${hr.hypothesis.EvidenceSupportScore}%`, height: '100%', background: getStatusColor(hr.hypothesis.Status), transition: 'width 0.5s' }} />
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px', textAlign: 'right', fontWeight: 'bold' }}>
                                    {hr.hypothesis.EvidenceSupportScore}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981', textTransform: 'uppercase', marginBottom: '8px' }}>Supporting Evidence</div>
                                    {hr.supportingEvidence.length === 0 ? <span style={{color:'var(--text-muted)', fontSize: '13px'}}>None found</span> : hr.supportingEvidence.map((e, i) => (
                                        <div key={i} style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>✓ {e.EvidenceID}: {e.SourceType}</div>
                                    ))}
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#ef4444', textTransform: 'uppercase', marginBottom: '8px' }}>Contradicting Evidence</div>
                                    {hr.contradictingEvidence.length === 0 ? <span style={{color:'var(--text-muted)', fontSize: '13px'}}>None found</span> : hr.contradictingEvidence.map((e, i) => (
                                        <div key={i} style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>! {e.EvidenceID}: {e.SourceType}</div>
                                    ))}
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '8px' }}>Missing Evidence (Gaps)</div>
                                    {hr.missingEvidence.length === 0 ? <span style={{color:'var(--text-muted)', fontSize: '13px'}}>None found</span> : hr.missingEvidence.map((e, i) => (
                                        <div key={i} style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>? {e.gap}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HypothesisPanel;
