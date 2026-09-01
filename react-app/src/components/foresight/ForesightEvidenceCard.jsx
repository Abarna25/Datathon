import React from 'react';
import { Database, Link2, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

export default function ForesightEvidenceCard({ evidence = [] }) {
    if (!evidence || evidence.length === 0) {
        return (
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'center', fontSize: '13px' }}>
                No grounded historical evidence records attached.
            </div>
        );
    }

    const getIcon = (type) => {
        switch (type) {
            case 'PRIOR_CASE_HISTORY':
            case 'HISTORICAL_DOCKET_LINKS':
                return <Database size={16} color="#60a5fa" />;
            case 'RECIDIVISM_INTERVAL':
                return <Clock size={16} color="#f59e0b" />;
            case 'GRAVITY_ESCALATION':
                return <AlertTriangle size={16} color="#ef4444" />;
            case 'MO_PATTERN_CONSISTENCY':
                return <Link2 size={16} color="#c084fc" />;
            default:
                return <ShieldCheck size={16} color="#818cf8" />;
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Database size={18} color="#818cf8" />
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Grounded Historical Evidence Trail
                </h3>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Every factor shown to the officer is traceable to verified historical records in the Karnataka Police Datastore.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                {evidence.map((item, index) => (
                    <div
                        key={index}
                        style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '12.5px', color: 'var(--text-primary)' }}>
                                {getIcon(item.type)}
                                <span>{item.title}</span>
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                {item.source}
                            </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', paddingLeft: '24px' }}>
                            {item.detail}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
