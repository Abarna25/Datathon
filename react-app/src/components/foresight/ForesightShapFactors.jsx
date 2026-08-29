import React, { useState } from 'react';
import { BarChart3, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp } from 'lucide-react';

export default function ForesightShapFactors({ factors = [], allFactors = [] }) {
    const [showAll, setShowAll] = useState(false);
    const displayList = showAll && allFactors.length > 0 ? allFactors : factors;

    if (!factors || factors.length === 0) {
        return (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 text-center text-slate-400 text-sm">
                No feature attribution factors available.
            </div>
        );
    }

    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                        Key Contributing Factors (SHAP Attributions)
                    </h3>
                </div>
                {allFactors.length > factors.length && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors"
                    >
                        {showAll ? (
                            <>Show Top 5 <ChevronUp className="w-3.5 h-3.5" /></>
                        ) : (
                            <>View All 14 Factors <ChevronDown className="w-3.5 h-3.5" /></>
                        )}
                    </button>
                )}
            </div>

            <p className="text-xs text-slate-400 mb-4">
                Features extracted strictly from time-safe historical records occurring on or before reference intake ($T$).
            </p>

            <div className="space-y-3.5">
                {displayList.map((factor, index) => {
                    const isIncreasing = factor.direction === 'INCREASING_ASSOCIATION';
                    const barWidth = Math.min(100, Math.max(10, factor.impactScore * 1.5));

                    return (
                        <div key={factor.feature || index} className="space-y-1.5 bg-slate-850/40 p-2.5 rounded-lg border border-slate-800/80">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                    {isIncreasing ? (
                                        <ArrowUpRight className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                    ) : (
                                        <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    )}
                                    <span className="font-medium text-slate-200">{factor.label}</span>
                                </div>
                                <div className="flex items-center gap-2 font-mono">
                                    <span className="text-[11px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                        Value: <strong className="text-slate-200">{factor.rawValue}</strong>
                                    </span>
                                    <span className={`text-[11px] font-semibold ${isIncreasing ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {isIncreasing ? '+' : '-'}{factor.impactScore}%
                                    </span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        isIncreasing ? 'bg-gradient-to-r from-red-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                    }`}
                                    style={{ width: `${barWidth}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
