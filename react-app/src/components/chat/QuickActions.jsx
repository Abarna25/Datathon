import React from 'react';
import { FileText, Paperclip, Clock, FileBarChart } from 'lucide-react';
import styles from './QuickActions.module.css';

const PRIMARY_ACTIONS = [
    { label: 'Summary', command: '/summary', icon: FileText },
    { label: 'Evidence', command: '/evidence', icon: Paperclip },
    { label: 'Timeline', command: '/timeline', icon: Clock },
    { label: 'Report', command: '/report', icon: FileBarChart },
];

const QuickActions = ({ onRun }) => {
    return (
        <div className={styles.row}>
            {PRIMARY_ACTIONS.map((qa) => {
                const Icon = qa.icon;
                return (
                    <button
                        key={qa.label}
                        type="button"
                        className={styles.pill}
                        onClick={() => onRun(qa)}
                    >
                        <Icon size={12} />
                        <span>{qa.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default QuickActions;
