import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertOctagon, BookOpen, Scale, Layers } from 'lucide-react';

export default function ForesightModelCardModal({ isOpen, onClose, modelCard }) {
    if (!isOpen || !modelCard) return null;

    const metrics = modelCard.performance_metrics || {};
    const dataset = modelCard.training_dataset || {};
    const comparisons = modelCard.model_comparison || {};
    const subgroups = modelCard.subgroup_evaluation || {};

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '8px', borderRadius: '8px', color: '#818cf8' }}>
                            <BookOpen size={20} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                VIKSHANA FORESIGHT — OFFICIAL MODEL CARD
                            </h2>
                            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                                Version {modelCard.model_version || '3.0.1'} | Released {modelCard.release_date || '2026-08-29'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '12px' }}>
                    {/* 1. Model Overview & Performance Grid */}
                    <div>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Layers size={16} /> Validated Out-of-Time Metrics
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', display: 'block' }}>Accuracy</span>
                                <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{metrics.Accuracy || 0.7716}</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', display: 'block' }}>Precision</span>
                                <span style={{ fontSize: '16px', fontWeight: '800', color: '#34d399' }}>{metrics.Precision || 0.7709}</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', display: 'block' }}>Recall</span>
                                <span style={{ fontSize: '16px', fontWeight: '800', color: '#60a5fa' }}>{metrics.Recall || 0.9717}</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', display: 'block' }}>F1 Score</span>
                                <span style={{ fontSize: '16px', fontWeight: '800', color: '#818cf8' }}>{metrics.F1_Score || 0.8597}</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', display: 'block' }}>ROC-AUC</span>
                                <span style={{ fontSize: '16px', fontWeight: '800', color: '#c084fc' }}>{metrics.ROC_AUC || 0.7725}</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', display: 'block' }}>PR-AUC</span>
                                <span style={{ fontSize: '16px', fontWeight: '800', color: '#f59e0b' }}>{metrics.PR_AUC || 0.8530}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Model Selection Rationale */}
                    <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Why XGBoost was Selected:</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            {modelCard.model_selection_rationale || 'XGBoost achieved the optimal balance of recall (0.9717) and F1 Score (0.8597) while maintaining fast GPU/CPU inference (<15ms) across non-linear spatial co-location features.'}
                        </p>
                    </div>

                    {/* 3. Temporal Leakage Prevention */}
                    <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <CheckCircle2 size={18} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Temporal Data Leakage Prevention Strategy</h4>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                {dataset.leakage_prevention || 'Historical features (prior cases, co-locations, time windows) are strictly constrained to records indexed on or before reference timestamp T. Future dockets are excluded from training.'}
                            </p>
                        </div>
                    </div>

                    {/* 4. Ethical Safeguards & Fair Use */}
                    <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <ShieldAlert size={18} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Responsible AI Mandate & Human Oversight</h4>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                VIKSHANA Foresight is purely an investigative decision-support system. Statistical associations from historical dockets must be corroborated by physical evidence and verified by human investigators before any operational action.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
