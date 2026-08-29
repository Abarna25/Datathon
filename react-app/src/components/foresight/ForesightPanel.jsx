import React, { useState, useEffect } from 'react';
import { Sparkles, Shield, User, Info, CheckCircle2, XCircle, HelpCircle, FileText, Loader2, AlertCircle } from 'lucide-react';
import foresightService from '../../services/foresightService';
import ForesightScoreGauge from './ForesightScoreGauge';
import ForesightShapFactors from './ForesightShapFactors';
import ForesightEvidenceCard from './ForesightEvidenceCard';
import ForesightModelCardModal from './ForesightModelCardModal';

export default function ForesightPanel({ caseId, suspects = [], activeSuspect = null }) {
    const [selectedSuspect, setSelectedSuspect] = useState(activeSuspect || suspects[0]?.name || 'Prakash Kulkarni');
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modelCard, setModelCard] = useState(null);
    const [showModelCard, setShowModelCard] = useState(false);

    // Decision state
    const [decisionModalOpen, setDecisionModalOpen] = useState(false);
    const [pendingDecision, setPendingDecision] = useState(null);
    const [officerNotes, setOfficerNotes] = useState('');
    const [decisionLoading, setDecisionLoading] = useState(false);
    const [latestDecision, setLatestDecision] = useState(null);

    useEffect(() => {
        if (activeSuspect) {
            setSelectedSuspect(activeSuspect);
        } else if (suspects.length > 0 && !selectedSuspect) {
            setSelectedSuspect(suspects[0].name);
        }
    }, [activeSuspect, suspects]);

    useEffect(() => {
        if (selectedSuspect) {
            loadAssessment(selectedSuspect);
        }
        loadModelCard();
    }, [selectedSuspect, caseId]);

    const loadAssessment = async (accusedName) => {
        setLoading(true);
        setError(null);
        try {
            const data = await foresightService.assessAccused(accusedName, caseId);
            setAssessment(data);
            setLatestDecision(null);
        } catch (err) {
            console.error('Failed to load Foresight assessment:', err);
            setError(err.response?.data?.error || err.message || 'Failed to generate assessment');
        } finally {
            setLoading(false);
        }
    };

    const loadModelCard = async () => {
        try {
            const card = await foresightService.getModelCard();
            setModelCard(card);
        } catch (e) {
            console.warn('Could not preload model card:', e);
        }
    };

    const handleOpenDecision = (decisionType) => {
        setPendingDecision(decisionType);
        setOfficerNotes('');
        setDecisionModalOpen(true);
    };

    const handleSubmitDecision = async () => {
        if (!assessment || !pendingDecision) return;
        setDecisionLoading(true);
        try {
            const res = await foresightService.submitOfficerDecision({
                assessmentId: assessment.assessmentId,
                accusedName: selectedSuspect,
                caseId,
                decision: pendingDecision,
                officerNotes
            });
            setLatestDecision(res.decision);
            setDecisionModalOpen(false);
        } catch (err) {
            alert('Failed to record decision: ' + (err.response?.data?.error || err.message));
        } finally {
            setDecisionLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header & Controls */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30 text-indigo-400">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-slate-100 tracking-wide">
                                    VIKSHANA FORESIGHT
                                </h2>
                                <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                    Predictive ML
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Evidence-Grounded Historical Pattern & Recidivism Association Engine
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => setShowModelCard(true)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                        >
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            Model Card & Limitations
                        </button>
                    </div>
                </div>

                {/* Suspect Selector */}
                {suspects.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> Assessed Suspect:
                        </span>
                        {suspects.map((s) => (
                            <button
                                key={s.name}
                                onClick={() => setSelectedSuspect(s.name)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                    selectedSuspect === s.name
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-700/70'
                                }`}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Ethical Guardrail Banner */}
            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-indigo-300">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                    <strong>Investigative Decision Support Only:</strong> This supervised machine learning model discovers statistical associations from historical Karnataka Police dockets. It does <em>not</em> declare guilt, dangerousness, or automate any operational action without explicit human review.
                </p>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-xs font-medium">Extracting time-safe features & computing calibrated statistical score...</p>
                </div>
            ) : error ? (
                <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-6 text-center text-red-400 text-xs space-y-2">
                    <AlertCircle className="w-6 h-6 mx-auto text-red-400" />
                    <p className="font-semibold">{error}</p>
                </div>
            ) : assessment ? (
                <div className="space-y-6">
                    {/* Visual Score Gauge & SHAP Attributions */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-5">
                            <ForesightScoreGauge assessment={assessment} />
                        </div>
                        <div className="lg:col-span-7">
                            <ForesightShapFactors
                                factors={assessment.topContributingFactors}
                                allFactors={assessment.allFactors}
                            />
                        </div>
                    </div>

                    {/* Grounded Historical Evidence Card */}
                    <ForesightEvidenceCard evidence={assessment.groundedEvidence} />

                    {/* Human-in-the-Loop Officer Decision Gate */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-indigo-400" />
                                    Human-in-the-Loop Review Gate
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Officer review required. Record formal acknowledgement before proceeding with case follow-up.
                                </p>
                            </div>

                            {latestDecision ? (
                                <div className="bg-emerald-950/30 border border-emerald-500/30 px-3.5 py-2 rounded-lg text-xs flex items-center gap-2 text-emerald-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>
                                        Decision <strong>{latestDecision.decision}</strong> recorded by {latestDecision.reviewer}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenDecision('ACKNOWLEDGE')}
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Acknowledge
                                    </button>
                                    <button
                                        onClick={() => handleOpenDecision('REQUEST_MORE_INFO')}
                                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                                    >
                                        <HelpCircle className="w-4 h-4 text-amber-400" /> Request Info
                                    </button>
                                    <button
                                        onClick={() => handleOpenDecision('DISMISS')}
                                        className="px-3.5 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                                    >
                                        <XCircle className="w-4 h-4 text-red-400" /> Dismiss
                                    </button>
                                </div>
                            )}
                        </div>

                        {latestDecision && (
                            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                                <span>Digest: {latestDecision.evidenceDigest}</span>
                                <span>Timestamp: {latestDecision.reviewedAt}</span>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Officer Decision Modal */}
            {decisionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-indigo-400" />
                                Record Officer Decision ({pendingDecision})
                            </h3>
                            <button
                                onClick={() => setDecisionModalOpen(false)}
                                className="text-slate-400 hover:text-slate-200"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-xs text-slate-400">
                            Subject: <strong className="text-slate-200">{selectedSuspect}</strong> (Case #{caseId || 'N/A'})
                        </p>

                        <div>
                            <label className="text-xs text-slate-300 block mb-1 font-medium">
                                Officer Investigative Justification / Notes (Optional):
                            </label>
                            <textarea
                                value={officerNotes}
                                onChange={(e) => setOfficerNotes(e.target.value)}
                                placeholder="Enter operational notes or physical docket verification details..."
                                rows={3}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                            Decision will be cryptographically hashed (SHA-256) and logged immutably to the VIKSHANA Forensic Audit Trail.
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setDecisionModalOpen(false)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitDecision}
                                disabled={decisionLoading}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
                            >
                                {decisionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Confirm & Record
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Model Card Modal */}
            <ForesightModelCardModal
                isOpen={showModelCard}
                onClose={() => setShowModelCard(false)}
                modelCard={modelCard}
            />
        </div>
    );
}
