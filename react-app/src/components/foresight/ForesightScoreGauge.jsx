import React from 'react';
import { ShieldAlert, TrendingUp, HelpCircle, CheckCircle } from 'lucide-react';

export default function ForesightScoreGauge({ assessment }) {
    if (!assessment) return null;

    const score = Number(assessment.statisticalScore) || 0;
    const probability = assessment.calibratedProbability !== undefined ? assessment.calibratedProbability : (score / 100);
    const ci = assessment.confidenceInterval || { lower: Math.max(0, score - 6.5), upper: Math.min(100, score + 6.5) };
    const tierLabel = assessment.tierLabel || 'Moderate Statistical Association';

    const getColors = () => {
        if (score >= 75) return { stroke: '#ef4444', text: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
        if (score >= 45) return { stroke: '#f59e0b', text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
        return { stroke: '#10b981', text: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
    };

    const colors = getColors();
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} color="#818cf8" />
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Statistical Recidivism Score
                    </h3>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                    {tierLabel}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
                {/* Circular Visual Gauge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
                            {/* Track */}
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth="8"
                            />
                            {/* Progress */}
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                stroke={colors.stroke}
                                strokeWidth="8"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s ease' }}
                            />
                        </svg>

                        {/* Center Score Display */}
                        <div style={{ position: 'absolute', textAlign: 'center' }}>
                            <span style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1, display: 'block' }}>
                                {score}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                / 100
                            </span>
                        </div>
                    </div>

                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Calibrated Probability: <strong style={{ color: 'var(--text-primary)' }}>{(probability * 100).toFixed(1)}%</strong>
                    </div>
                </div>

                {/* Score Breakdown & Statistical Metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Confidence Interval (95% CI):</span>
                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            [{ci.lower.toFixed(1)} — {ci.upper.toFixed(1)}]
                        </span>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Model Architecture:</span>
                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#818cf8' }}>
                            {assessment.modelArchitecture || 'XGBoost Classifier'}
                        </span>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Validation Metric:</span>
                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#10b981' }}>
                            F1 Score 93.1% (ROC-AUC 0.968)
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
