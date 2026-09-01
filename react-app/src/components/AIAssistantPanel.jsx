import React, { useState, useEffect } from 'react';
import { BrainCircuit, Sparkles, AlertTriangle, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AIAssistantPanel = ({ 
    title = 'AI Insight', 
    content, 
    type = 'insight', // 'insight', 'alert', 'action'
    loading = false,
    delay = 0 
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    if (!isVisible) return null;

    const getStyles = () => {
        switch(type) {
            case 'alert':
                return {
                    bg: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    icon: <AlertTriangle size={16} color="#ef4444" />,
                    titleColor: '#ef4444'
                };
            case 'action':
                return {
                    bg: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    icon: <Sparkles size={16} color="#10b981" />,
                    titleColor: '#10b981'
                };
            default:
                return {
                    bg: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    icon: <BrainCircuit size={16} color="var(--accent-primary)" />,
                    titleColor: 'var(--accent-primary)'
                };
        }
    };

    const styles = getStyles();

    return (
        <div style={{
            background: styles.bg,
            border: styles.border,
            borderRadius: '10px',
            padding: '16px',
            animation: 'fadeIn 0.5s ease-out',
            marginBottom: '16px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                {styles.icon}
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: styles.titleColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {title}
                </h4>
            </div>
            
            {loading ? (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '24px' }}>
                    <div className="vik-streaming-cursor" style={{ background: styles.titleColor }}></div>
                </div>
            ) : (
                <div className="vik-markdown" style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6', fontWeight: '400' }}>
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            )}
        </div>
    );
};

export default AIAssistantPanel;
