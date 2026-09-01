import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Sparkles, ShieldAlert, Cpu, Award, ChevronRight, Play, CheckCircle2, Info
} from 'lucide-react';
import ModelComparisonModal from './ml/ModelComparisonModal';

const DEMO_STEPS = [
    { id: 1, title: 'Command Center', path: '/dashboard', icon: '📊', desc: 'Real-Time Case Intelligence Dashboard' },
    { id: 2, title: 'FIR Intelligence', path: '/fir-intelligence', icon: '📄', desc: 'AI Entity & Fact Extraction' },
    { id: 3, title: 'Timeline & Gap Detection', path: '/investigate?tab=timeline', icon: '⏱️', desc: 'Timeline Construction & Alibi Gap Analysis' },
    { id: 4, title: 'Relationship Network', path: '/relationship-intelligence', icon: '🕸️', desc: 'Cross-Case Entity Graph & Connection Strength' },
    { id: 5, title: 'Anomaly Sentinel', path: '/sentinel', icon: '⚠️', desc: 'Contradiction & Anomaly Detection' },
    { id: 6, title: 'Similar Cases', path: '/forensic-intelligence', icon: '🔍', desc: 'Historical Similarity & MO Matching' },
    { id: 7, title: 'Crime Forecasting', path: '/crime-forecasting', icon: '📈', desc: 'Explainable Spatial Risk & DBSCAN Clustering' },
    { id: 8, title: 'Next Best Action', path: '/investigate?tab=actions', icon: '🎯', desc: 'Evidence-Grounded Recommendation Engine' },
];

const GuidedDemoBar = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [showMlModal, setShowMlModal] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleStepClick = (step) => {
        setCurrentStep(step.id);
        navigate(step.path);
    };

    const handleNext = () => {
        const nextId = currentStep < DEMO_STEPS.length ? currentStep + 1 : 1;
        const step = DEMO_STEPS.find(s => s.id === nextId);
        if (step) {
            setCurrentStep(step.id);
            navigate(step.path);
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
            borderBottom: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#f8fafc',
            fontSize: '13px',
            fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            position: 'sticky',
            top: 0,
            zIndex: 1000
        }}>
            {/* Header Ribbon */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                background: 'rgba(0,0,0,0.3)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontWeight: '700',
                        fontSize: '11px',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <Sparkles size={12} /> DATATHON DEMO MODE
                    </span>
                    <span style={{ fontWeight: '600', color: '#cbd5e1' }}>
                        VIKSHANA — AI-Powered Investigation Intelligence Platform
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setShowMlModal(true)}
                        style={{
                            background: 'rgba(99, 102, 241, 0.2)',
                            border: '1px solid rgba(99, 102, 241, 0.4)',
                            color: '#818cf8',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Cpu size={14} /> ML Model Comparison & Metrics
                    </button>

                    <button
                        onClick={handleNext}
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            border: 'none',
                            color: '#fff',
                            padding: '5px 14px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 10px rgba(37, 99, 235, 0.4)'
                        }}
                    >
                        Next Step ({currentStep}/8) <ChevronRight size={14} />
                    </button>

                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '11px'
                        }}
                    >
                        {collapsed ? 'Expand' : 'Minimize'}
                    </button>
                </div>
            </div>

            {/* Stepper Steps */}
            {!collapsed && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                    overflowX: 'auto',
                    gap: '4px'
                }}>
                    {DEMO_STEPS.map((step) => {
                        const isActive = currentStep === step.id;
                        return (
                            <div
                                key={step.id}
                                onClick={() => handleStepClick(step)}
                                style={{
                                    flex: 1,
                                    minWidth: '130px',
                                    padding: '6px 8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    background: isActive ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.03)',
                                    border: isActive ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.05)',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '14px' }}>{step.icon}</span>
                                    <span style={{
                                        fontWeight: isActive ? '700' : '500',
                                        color: isActive ? '#60a5fa' : '#cbd5e1',
                                        fontSize: '11px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {step.id}. {step.title}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '10px',
                                    color: isActive ? '#93c5fd' : '#64748b',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {step.desc}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Responsible AI Disclaimer Banner */}
            <div style={{
                background: 'rgba(15, 23, 42, 0.9)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                padding: '4px 16px',
                fontSize: '11px',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <ShieldAlert size={12} color="#f59e0b" />
                <span>
                    <strong>Responsible AI:</strong> VIKSHANA is an evidence-grounded decision support system. Final law enforcement and judicial decisions rest with human investigators.
                </span>
            </div>

            {/* ML Benchmark Modal */}
            {showMlModal && <ModelComparisonModal onClose={() => setShowMlModal(false)} />}
        </div>
    );
};

export default GuidedDemoBar;
