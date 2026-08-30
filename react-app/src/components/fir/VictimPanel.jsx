import React from 'react';
import { User, Shield } from 'lucide-react';

const VictimPanel = ({ victims }) => {
    if (!victims || victims.length === 0) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No victims found for this case.
            </div>
        );
    }

    return (
        <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '12px' }}>Victims & Complainants</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {victims.map((victim, i) => (
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
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '50%', color: '#10b981' }}>
                            {victim.isPolice ? <Shield size={24} /> : <User size={24} />}
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{victim.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                Age: {victim.age || 'N/A'} • Gender: {victim.gender || 'N/A'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VictimPanel;
