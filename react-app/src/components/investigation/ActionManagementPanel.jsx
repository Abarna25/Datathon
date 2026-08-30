import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const ActionManagementPanel = ({ caseId }) => {
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadActions = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/server/vikshana_function/cases/${caseId}/actions`);
            if (res.data?.success) {
                setActions(res.data.data);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (caseId) loadActions();
    }, [caseId]);

    const updateStatus = async (actionId, status) => {
        try {
            await api.post(`/server/vikshana_function/cases/${caseId}/actions/${actionId}/status`, { status });
            await loadActions();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}><Loader2 className="spin" /></div>;

    if (actions.length === 0) {
        return (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No evidence-grounded next actions identified.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Recommended Next Actions</h3>
            {actions.map((action, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '20px', borderLeft: action.Priority === 'CRITICAL' ? '4px solid #ef4444' : '4px solid #f59e0b', opacity: action.Status === 'COMPLETED' || action.Status === 'REJECTED' ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '11px', background: action.Priority === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: action.Priority === 'CRITICAL' ? '#ef4444' : '#f59e0b', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                    {action.Priority} PRIORITY
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    {action.Status}
                                </span>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
                                {action.Description}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <strong>Reason:</strong> {action.Reason}
                            </div>
                        </div>
                        {action.Status !== 'COMPLETED' && action.Status !== 'REJECTED' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => updateStatus(action.ActionID, 'COMPLETED')} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                                    Complete
                                </button>
                                <button onClick={() => updateStatus(action.ActionID, 'REJECTED')} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActionManagementPanel;
