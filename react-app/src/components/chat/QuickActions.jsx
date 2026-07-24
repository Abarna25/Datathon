import React from 'react';
import styles from './QuickActions.module.css';

const PRIMARY_ACTIONS = [
    { label: 'Summarize', command: '/summary' },
    { label: 'Evidence', command: '/evidence' },
    { label: 'Timeline', command: '/timeline' },
    { label: 'Generate Report', command: '/report' }
];

const QuickActions = ({ onRun }) => {
    return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {PRIMARY_ACTIONS.map((qa) => (
                <button 
                    key={qa.label} 
                    type="button" 
                    className={styles.chip} 
                    onClick={() => onRun(qa)}
                    style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--glass-border)',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {qa.label}
                </button>
            ))}
        </div>
    );
};

export default QuickActions;
