import React, { useState } from 'react';
import { BarChart3, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp } from 'lucide-react';

export default function ForesightShapFactors({ factors = [], allFactors = [] }) {
    const [showAll, setShowAll] = useState(false);
    const displayList = showAll && allFactors.length > 0 ? allFactors : factors;

    if (!factors || factors.length === 0) {
        return (
            <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'center', fontSize: '13px' }}>
                No feature attribution factors available.
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={18} color="#818cf8" />
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Key Contributing Factors (SHAP Attributions)
                    </h3>
                </div>
                {allFactors.length > factors.length && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        style={{ background: 'transparent', border: 'none', color: '#818cf8', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        {showAll ? (
                            <>Show Top 5 <ChevronUp size={14} /></>
                        ) : (
                            <>View All 14 Factors <ChevronDown size={14} /></>
                        )}
                    </button>
                )}
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Features extracted strictly from time-safe historical records occurring on or before reference intake ($T$).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {displayList.map((factor, index) => {
                    const isIncreasing = factor.direction === 'INCREASING_ASSOCIATION';
                    const barWidth = Math.min(100, Math.max(10, factor.impactScore * 1.5));

                    return (
                        <div key={factor.feature || index} style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {isIncreasing ? (
                                        <ArrowUpRight size={15} color="#ef4444" />
                                    ) : (
                                        <ArrowDownRight size={15} color="#10b981" />
                                    )}
                                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{factor.label}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {factor.valueDisplay || 'Present'}
                                    </span>
                                    <span style={{ fontWeight: '800', color: isIncreasing ? '#f87171' : '#34d399', fontSize: '12px' }}>
                                        {isIncreasing ? '+' : '-'}{factor.impactScore}%
                                    </span>
                                </div>
                            </div>

                            {/* SHAP Bar */}
                            <div style={{ height: '5px', width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${barWidth}%`, background: isIncreasing ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
