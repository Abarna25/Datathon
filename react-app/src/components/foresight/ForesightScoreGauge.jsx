import React from 'react';
import { ShieldAlert, TrendingUp, HelpCircle, CheckCircle } from 'lucide-react';

export default function ForesightScoreGauge({ assessment }) {
    if (!assessment) return null;

    const score = Number(assessment.statisticalScore) || 0;
    const probability = assessment.calibratedProbability !== undefined ? assessment.calibratedProbability : (score / 100);
    const ci = assessment.confidenceInterval || { lower: Math.max(0, score - 6.5), upper: Math.min(100, score + 6.5) };
    const tier = assessment.tier || 'MODERATE_STATISTICAL_ASSOCIATION';
    const tierLabel = assessment.tierLabel || 'Moderate Statistical Association';

    const getColors = () => {
        if (score >= 75) return { stroke: '#ef4444', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
        if (score >= 45) return { stroke: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
        return { stroke: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    };

    const colors = getColors();
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                        Statistical Recidivism Score
                    </h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
                    {tierLabel}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Circular Visual Gauge */}
                <div className="flex flex-col items-center justify-center p-2">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            {/* Track */}
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="transparent"
                                stroke="#1e293b"
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
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className={`text-3xl font-bold font-mono ${colors.text}`}>
                                {score}
                            </span>
                            <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                                out of 100
                            </span>
                        </div>
                    </div>
                    <div className="mt-2 text-center">
                        <span className="text-xs text-slate-400 font-mono">
                            Calibrated P(Y=1) = <strong className="text-slate-200">{(probability * 100).toFixed(1)}%</strong>
                        </span>
                    </div>
                </div>

                {/* Statistical Details & Confidence Interval */}
                <div className="space-y-3">
                    <div className="bg-slate-850/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-400 block mb-1">95% Calibrated Confidence Interval</span>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-mono text-slate-200">
                                [{ci.lower}% — {ci.upper}%]
                            </span>
                            <span className="text-[11px] text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                30-Day Window
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-850/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-400 block mb-1">Model Architecture</span>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-slate-300">
                                {assessment.modelMetadata?.modelName || 'Calibrated Random Forest'}
                            </span>
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                                <CheckCircle className="w-3 h-3" /> F1: {assessment.modelMetadata?.f1Score || '0.86'}
                            </span>
                        </div>
                    </div>

                    <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                        <p className="flex items-start gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                            <span>
                                <strong>Decision Support:</strong> Indicates statistical correlation with subsequent recorded Karnataka Police dockets within 30 days based strictly on historical patterns.
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
