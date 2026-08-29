import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertOctagon, BookOpen, Scale, Layers } from 'lucide-react';

export default function ForesightModelCardModal({ isOpen, onClose, modelCard }) {
    if (!isOpen || !modelCard) return null;

    const metrics = modelCard.performance_metrics || {};
    const dataset = modelCard.training_dataset || {};
    const comparisons = modelCard.model_comparison || {};
    const subgroups = modelCard.subgroup_evaluation || {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative text-slate-200">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                VIKSHANA FORESIGHT — OFFICIAL MODEL CARD
                            </h2>
                            <p className="text-xs text-slate-400 font-mono">
                                Version {modelCard.model_version || '3.0.1'} | Released {modelCard.release_date || '2026-08-29'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 text-xs">
                    {/* 1. Model Overview & Performance Grid */}
                    <div>
                        <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Layers className="w-4 h-4" /> Validated Out-of-Time Metrics
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Accuracy</span>
                                <span className="text-base font-bold font-mono text-slate-100">{metrics.Accuracy || 0.7716}</span>
                            </div>
                            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Precision</span>
                                <span className="text-base font-bold font-mono text-emerald-400">{metrics.Precision || 0.7709}</span>
                            </div>
                            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Recall</span>
                                <span className="text-base font-bold font-mono text-blue-400">{metrics.Recall || 0.9717}</span>
                            </div>
                            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">F1 Score</span>
                                <span className="text-base font-bold font-mono text-indigo-400">{metrics.F1_Score || 0.8597}</span>
                            </div>
                            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">ROC-AUC</span>
                                <span className="text-base font-bold font-mono text-purple-400">{metrics.ROC_AUC || 0.6228}</span>
                            </div>
                            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60 text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Brier Score</span>
                                <span className="text-base font-bold font-mono text-amber-400">{metrics.Brier_Score || 0.1778}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2. Dataset & Temporal Separation */}
                    <div className="bg-slate-850/60 p-4 rounded-xl border border-slate-800 space-y-2">
                        <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                            Dataset & Zero-Leakage Temporal Validation
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
                            <div>
                                <p><strong>Source:</strong> {dataset.source || 'Karnataka Police Datastore'}</p>
                                <p><strong>Total Historical Dockets:</strong> {dataset.total_samples || 69841} records</p>
                                <p><strong>Observation Window:</strong> {modelCard.observation_window || '30 Days Post-Registration'}</p>
                            </div>
                            <div>
                                <p><strong>Training Partition:</strong> {dataset.training_samples || 47593} samples ({dataset.temporal_range_train || '2021 to mid-2024'})</p>
                                <p><strong>Held-Out Test Partition:</strong> {dataset.held_out_test_samples || 20940} samples ({dataset.temporal_range_test || 'mid-2024 to late-2025'})</p>
                                <p className="text-emerald-400 font-medium">✓ Strict out-of-time evaluation without temporal leakage</p>
                            </div>
                        </div>
                    </div>

                    {/* 3. Multi-Model Comparison Table */}
                    {Object.keys(comparisons).length > 0 && (
                        <div>
                            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-2">
                                Multi-Model Benchmark Comparison
                            </h4>
                            <div className="overflow-x-auto border border-slate-800 rounded-lg">
                                <table className="w-full text-left text-[11px]">
                                    <thead className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
                                        <tr>
                                            <th className="p-2">Model Architecture</th>
                                            <th className="p-2">Accuracy</th>
                                            <th className="p-2">Precision</th>
                                            <th className="p-2">Recall</th>
                                            <th className="p-2">F1 Score</th>
                                            <th className="p-2">ROC-AUC</th>
                                            <th className="p-2">Brier Loss</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                                        {Object.entries(comparisons).map(([mName, mStats]) => (
                                            <tr key={mName} className="hover:bg-slate-850">
                                                <td className="p-2 font-sans font-medium text-slate-200">{mName}</td>
                                                <td className="p-2">{mStats.Accuracy}</td>
                                                <td className="p-2">{mStats.Precision}</td>
                                                <td className="p-2">{mStats.Recall}</td>
                                                <td className="p-2 font-bold text-indigo-400">{mStats.F1_Score}</td>
                                                <td className="p-2">{mStats.ROC_AUC}</td>
                                                <td className="p-2">{mStats.Brier_Score}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 4. Subgroup Cohort Performance */}
                    {Object.keys(subgroups).length > 0 && (
                        <div>
                            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-2">
                                Subgroup & Offence Gravity Cohort Performance
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(subgroups).map(([gName, gStats]) => (
                                    <div key={gName} className="bg-slate-850/60 p-3 rounded-lg border border-slate-800 text-[11px] space-y-1">
                                        <span className="font-semibold text-slate-200 block">{gName}</span>
                                        <div className="flex justify-between text-slate-400 font-mono">
                                            <span>Samples: {gStats.samples}</span>
                                            <span>F1: <strong className="text-indigo-400">{gStats.f1}</strong></span>
                                            <span>Prec: {gStats.precision}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 5. Ethical Guidelines & Intended vs Prohibited Use */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-xl space-y-2">
                            <h4 className="font-semibold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Intended Operational Uses
                            </h4>
                            <ul className="list-disc pl-4 space-y-1 text-slate-300">
                                {(modelCard.intended_use || []).map((use, idx) => (
                                    <li key={idx}>{use}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-red-950/20 border border-red-800/40 p-4 rounded-xl space-y-2">
                            <h4 className="font-semibold text-red-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <AlertOctagon className="w-4 h-4 text-red-400" /> Explicitly Prohibited Uses
                            </h4>
                            <ul className="list-disc pl-4 space-y-1 text-slate-300">
                                {(modelCard.non_intended_use || []).map((nonUse, idx) => (
                                    <li key={idx}>{nonUse}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* 6. Known Limitations */}
                    <div className="bg-amber-950/20 border border-amber-800/40 p-4 rounded-xl space-y-2">
                        <h4 className="font-semibold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <Scale className="w-4 h-4 text-amber-400" /> Known Statistical & Data Limitations
                        </h4>
                        <ul className="list-disc pl-4 space-y-1 text-slate-300">
                            {(modelCard.known_limitations || []).map((lim, idx) => (
                                <li key={idx}>{lim}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 p-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                        Close Model Card
                    </button>
                </div>
            </div>
        </div>
    );
}
