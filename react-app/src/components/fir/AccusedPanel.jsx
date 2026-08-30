import React from 'react';
import { User, AlertTriangle } from 'lucide-react';

const AccusedPanel = ({ accused }) => {
    if (!accused || accused.length === 0) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No accused records found for this case.
            </div>
        );
    }

    return (
        <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '12px' }}>Accused / Suspects</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {accused.map((person, i) => (
                    <div 
                        key={i}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '16px', borderRadius: '12px',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '50%', color: '#ef4444' }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{person.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                Age: {person.age || 'N/A'} • Gender: {person.gender || 'N/A'}
                            </div>
                            {person.alias && (
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Alias: {person.alias}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AccusedPanel;
