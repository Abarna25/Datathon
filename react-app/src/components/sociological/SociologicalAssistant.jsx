/**
 * SociologicalAssistant.jsx
 *
 * Production-ready AI chat interface for the Sociological Insights module.
 *
 * Features:
 * - Full Explainable AI (XAI) drawer per response:
 *   reasoning chain, supporting records, evidence references, data sources, model ID, timestamp
 * - Conversation history (multi-turn context)
 * - Abort controller to cancel in-flight requests on unmount
 * - React.memo + useCallback to prevent unnecessary re-renders
 * - Full ARIA labelling for accessibility
 * - No unused imports or dead code
 */

import React, { useState, useRef, useEffect, useCallback, memo, useContext } from 'react';
import {
    BrainCircuit, Send, User, Sparkles, AlertCircle,
    CheckCircle2, AlertTriangle, Minus, ChevronRight,
    MapPin, FileText, Lightbulb, RefreshCw, Trash2, Bot,
    FlaskConical, Database, BookMarked, Clock, Hash, Cpu,
    FileDown, Check, Loader2
} from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { exportConversationToPDF } from '../../utils/pdfExport';

// ─── CONSTANTS ──────────────────────────────────────────────────────────────────
const STARTER_PROMPTS = [
    'What is the relationship between youth unemployment and crime rates in Sector 3?',
    'Which districts have the highest recidivism risk and why?',
    'How does education disparity contribute to organized crime recruitment?',
    'Suggest policy interventions to reduce property crime in urban-dense areas.',
    'Compare the social risk profiles of Central and Peri-Urban districts.',
];

const CONFIDENCE_CFG = {
    HIGH:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  Icon: CheckCircle2  },
    MEDIUM: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  Icon: AlertTriangle },
    LOW:    { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', Icon: Minus         },
};

const CREDIBILITY_CFG = {
    HIGH:   { color: '#10b981' },
    MEDIUM: { color: '#f59e0b' },
    LOW:    { color: '#ef4444' },
};

// Injected once at module level — prevents re-injection on re-renders
const BOUNCE_STYLE = `@keyframes soc-bounce{0%,80%,100%{transform:scale(0.8);opacity:0.5}40%{transform:scale(1.2);opacity:1}}`;
if (typeof document !== 'undefined' && !document.getElementById('soc-bounce-style')) {
    const s = document.createElement('style');
    s.id = 'soc-bounce-style';
    s.textContent = BOUNCE_STYLE;
    document.head.appendChild(s);
}

// ─── UTILITY ─────────────────────────────────────────────────────────────────────
const formatTimestamp = (iso) => {
    if (!iso) return null;
    try {
        return new Date(iso).toLocaleString('en-IN', {
            dateStyle: 'medium', timeStyle: 'short', hour12: true
        });
    } catch { return iso; }
};

// ─── REUSABLE SUB-COMPONENTS (all memo-wrapped) ──────────────────────────────────

const ConfidenceBadge = memo(({ level }) => {
    const c = CONFIDENCE_CFG[level] || CONFIDENCE_CFG.LOW;
    const { Icon } = c;
    return (
        <span
            role="status"
            aria-label={`Confidence level: ${level}`}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 9px', borderRadius: '12px',
                background: c.bg, color: c.color,
                fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px'
            }}
        >
            <Icon size={12} aria-hidden="true" /> {level} CONFIDENCE
        </span>
    );
});

const TypingDots = memo(() => (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '4px 0' }} aria-hidden="true">
        {[0, 1, 2].map(i => (
            <div key={i} style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: 'var(--accent-primary)',
                animation: 'soc-bounce 1.2s infinite ease-in-out',
                animationDelay: `${i * 0.2}s`,
            }} />
        ))}
    </div>
));

/**
 * ExplainabilityPanel — expandable XAI drawer.
 * Shows: Reasoning Chain, Supporting Records, Evidence References, Data Sources, Model metadata, Timestamp.
 */
const ExplainabilityPanel = memo(({ structuredData }) => {
    const [open, setOpen] = useState(false);
    const {
        reasoningSummary = [],
        supportingRecords = [],
        evidenceReferences = [],
        dataSources = [],
        generatedAt,
        modelId
    } = structuredData || {};

    const hasXAI = reasoningSummary.length > 0 || supportingRecords.length > 0 ||
                   evidenceReferences.length > 0 || dataSources.length > 0;
    if (!hasXAI) return null;

    const total = reasoningSummary.length + supportingRecords.length +
                  evidenceReferences.length + dataSources.length;

    return (
        <div style={{
            borderRadius: '10px', overflow: 'hidden',
            border: '1px solid rgba(139,92,246,0.25)',
            background: 'rgba(139,92,246,0.04)'
        }}>
            {/* Toggle Header */}
            <button
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                aria-controls="xai-panel-content"
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left'
                }}
            >
                <FlaskConical size={14} color="#8b5cf6" aria-hidden="true" />
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#8b5cf6', flex: 1 }}>
                    Explainability — {total} signals
                </span>
                {generatedAt && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} aria-hidden="true" /> {formatTimestamp(generatedAt)}
                    </span>
                )}
                <ChevronRight
                    size={14} color="#8b5cf6" aria-hidden="true"
                    style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
                />
            </button>

            {/* Panel Body */}
            {open && (
                <div id="xai-panel-content" style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Reasoning Chain */}
                    {reasoningSummary.length > 0 && (
                        <section aria-labelledby="reasoning-heading">
                            <div id="reasoning-heading" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <Cpu size={12} color="#8b5cf6" aria-hidden="true" />
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reasoning Chain</span>
                            </div>
                            <ol style={{ margin: 0, paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {reasoningSummary.map((step, i) => (
                                    <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                        <span style={{
                                            flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%',
                                            background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                                            fontSize: '10px', fontWeight: '800', color: '#8b5cf6',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>{i + 1}</span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', paddingTop: '2px' }}>{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    )}

                    {/* Supporting Records */}
                    {supportingRecords.length > 0 && (
                        <section aria-labelledby="records-heading">
                            <div id="records-heading" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <BookMarked size={12} color="var(--accent-primary)" aria-hidden="true" />
                                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supporting Records</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {supportingRecords.map((rec, i) => (
                                    <div key={i} style={{
                                        padding: '8px 12px', borderRadius: '8px',
                                        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                        display: 'flex', gap: '10px', alignItems: 'flex-start'
                                    }}>
                                        <Hash size={11} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '3px' }} aria-hidden="true" />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{rec.title}</span>
                                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)' }}>{rec.type}</span>
                                                    {rec.year && <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{rec.year}</span>}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{rec.id}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Evidence References */}
                    {evidenceReferences.length > 0 && (
                        <section aria-labelledby="refs-heading">
                            <div id="refs-heading" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <FileText size={12} color="var(--accent-warning)" aria-hidden="true" />
                                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-warning)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evidence References</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {evidenceReferences.map((ref, i) => {
                                    const credColor = (CREDIBILITY_CFG[ref.credibility] || CREDIBILITY_CFG.MEDIUM).color;
                                    return (
                                        <div key={i} style={{
                                            padding: '8px 12px', borderRadius: '8px',
                                            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{ref.source}</span>
                                                <span style={{ fontSize: '10px', fontWeight: '700', color: credColor }}>{ref.credibility} credibility</span>
                                            </div>
                                            {ref.note && <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{ref.note}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Data Sources + Model */}
                    <section aria-labelledby="sources-heading" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {dataSources.length > 0 && (
                            <>
                                <div id="sources-heading" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <Database size={12} color="#10b981" aria-hidden="true" />
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data Sources</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {dataSources.map((src, i) => (
                                        <span key={i} style={{
                                            padding: '4px 10px', borderRadius: '12px', fontSize: '11px',
                                            background: 'rgba(16,185,129,0.1)', color: '#10b981',
                                            border: '1px solid rgba(16,185,129,0.2)', fontWeight: '500'
                                        }}>{src}</span>
                                    ))}
                                </div>
                            </>
                        )}
                        {modelId && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '4px' }}>
                                <Cpu size={11} color="var(--text-muted)" aria-hidden="true" />
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Model: <strong style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{modelId}</strong></span>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
});

// ─── ASSISTANT BUBBLE ─────────────────────────────────────────────────────────────
const AssistantBubble = memo(({ turn, onFollowUp }) => {
    const { structuredData, suggestions } = turn;
    const {
        answer, confidence, confidenceReason,
        evidence = [], relatedDistricts = [], policyImplication
    } = structuredData || {};
    const [evidenceOpen, setEvidenceOpen] = useState(false);

    const handleFollowUp = useCallback((s) => onFollowUp(s), [onFollowUp]);

    return (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }} role="article" aria-label="AI response">
            {/* Avatar */}
            <div
                aria-hidden="true"
                style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 12px rgba(59,130,246,0.4)'
                }}
            >
                <Bot size={18} color="#fff" />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
                {/* Confidence */}
                {confidence && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <ConfidenceBadge level={confidence} />
                        {confidenceReason && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{confidenceReason}</span>
                        )}
                    </div>
                )}

                {/* Main Answer */}
                <div
                    role="region" aria-label="AI analysis"
                    style={{
                        padding: '16px', borderRadius: '12px',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                        fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.7',
                        wordBreak: 'break-word'
                    }}
                >
                    {answer}
                </div>

                {/* ── Explainability Panel ─────────────────────────────────── */}
                <ExplainabilityPanel structuredData={structuredData} />

                {/* Supporting Evidence indicators (from evidence[] field) */}
                {evidence.length > 0 && (
                    <div style={{ borderRadius: '10px', border: '1px solid var(--border-color)', overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                        <button
                            onClick={() => setEvidenceOpen(o => !o)}
                            aria-expanded={evidenceOpen}
                            aria-controls="evidence-list"
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                            <FileText size={14} color="var(--accent-primary)" aria-hidden="true" />
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', flex: 1 }}>
                                Supporting Indicators ({evidence.length})
                            </span>
                            <ChevronRight
                                size={14} color="var(--accent-primary)" aria-hidden="true"
                                style={{ transform: evidenceOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                            />
                        </button>
                        {evidenceOpen && (
                            <div id="evidence-list" style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {evidence.map((ev, idx) => (
                                    <div key={idx} style={{
                                        padding: '10px 12px', background: 'var(--bg-secondary)',
                                        borderRadius: '8px', borderLeft: '3px solid var(--accent-primary)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{ev.label}</span>
                                            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-primary)' }}>{ev.value}</span>
                                        </div>
                                        {ev.implication && (
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', display: 'block' }}>{ev.implication}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Related Districts */}
                {relatedDistricts.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <MapPin size={13} color="var(--text-muted)" aria-hidden="true" />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Related districts:</span>
                        {relatedDistricts.map((d, i) => (
                            <span key={i} style={{
                                padding: '3px 10px', borderRadius: '12px', fontSize: '12px',
                                background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)',
                                fontWeight: '600', border: '1px solid rgba(59,130,246,0.2)'
                            }}>{d}</span>
                        ))}
                    </div>
                )}

                {/* Policy Implication */}
                {policyImplication && (
                    <div
                        role="note" aria-label="Policy recommendation"
                        style={{
                            padding: '12px 14px', borderRadius: '10px',
                            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                            display: 'flex', gap: '10px', alignItems: 'flex-start'
                        }}
                    >
                        <Lightbulb size={15} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#f59e0b', marginBottom: '3px' }}>POLICY RECOMMENDATION</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>{policyImplication}</div>
                        </div>
                    </div>
                )}

                {/* Follow-up chips */}
                {suggestions?.length > 0 && (
                    <div role="navigation" aria-label="Follow-up questions">
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Sparkles size={11} aria-hidden="true" /> Suggested follow-ups
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleFollowUp(s)}
                                    aria-label={`Ask: ${s}`}
                                    style={{
                                        padding: '6px 12px', borderRadius: '20px', fontSize: '12px',
                                        background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                                        color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500',
                                        transition: 'border-color 0.15s'
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

// ─── USER BUBBLE ─────────────────────────────────────────────────────────────────
const UserBubble = memo(({ content, userName }) => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexDirection: 'row-reverse' }} role="article" aria-label="Your message">
        <div
            aria-hidden="true"
            title={userName || 'You'}
            style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
        >
            <User size={16} color="var(--text-secondary)" />
        </div>
        <div style={{
            padding: '12px 16px', borderRadius: '12px',
            background: 'var(--accent-primary)', color: '#fff',
            fontSize: '14px', lineHeight: '1.6', maxWidth: '75%', wordBreak: 'break-word'
        }}>
            {content}
        </div>
    </div>
));

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────────
const SociologicalAssistant = ({ caseId }) => {
    const { user } = useContext(AuthContext);
    const { t, language } = useLanguage();
    const [history, setHistory] = useState([]);
    const [input, setInput]     = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError]     = useState(null);

    // Export PDF states
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [toastMessage, setToastMessage]     = useState(null);

    const bottomRef  = useRef(null);
    const inputRef   = useRef(null);
    const abortRef   = useRef(null);

    // Scroll to latest message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isLoading]);

    // Cancel pending request on unmount
    useEffect(() => () => abortRef.current?.abort(), []);

    const showToast = useCallback((msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    }, []);

    const handleExportPDF = useCallback(async () => {
        if (history.length === 0 || isExportingPdf) return;
        setIsExportingPdf(true);
        setError(null);

        try {
            await exportConversationToPDF({
                conversationTitle: t('assistant.title', 'Sociological AI Analysis Docket'),
                messages: history,
                officerName: user?.name || 'Officer Kanishk',
                officerRole: user?.role || t('common.activeRole', 'Senior Investigator'),
                caseId: caseId || `CASE-SOC-${Date.now().toString(36).toUpperCase()}`,
                language
            });
            showToast(t('assistant.exportSuccess', 'PDF Exported Successfully!'));

        } catch (err) {
            console.debug('[SociologicalAssistant] PDF export error:', err);
            setError(t('assistant.exportError', 'Failed to export PDF. Please try again.'));
        } finally {
            setIsExportingPdf(false);
        }
    }, [history, isExportingPdf, user, language, t, showToast, caseId]);

    const sendQuestion = useCallback(async (question) => {
        const trimmed = question.trim();
        if (!trimmed || isLoading) return;

        abortRef.current?.abort();
        abortRef.current = new AbortController();

        setInput('');
        setError(null);
        setHistory(prev => [...prev, { role: 'user', content: trimmed, createdAt: new Date().toISOString() }]);
        setIsLoading(true);

        try {
            const priorHistory = history.slice(-8);
            const res = await api.post(
                '/sociological/assistant/ask',
                { question: trimmed, history: priorHistory, language },
                { signal: abortRef.current.signal }
            );

            if (res.data.success) {
                const { structuredData, suggestions } = res.data.data;
                setHistory(prev => [...prev, {
                    role: 'assistant',
                    content: structuredData.answer,
                    structuredData,
                    suggestions,
                    createdAt: new Date().toISOString()
                }]);
            } else {
                throw new Error(res.data.error || 'Unknown AI error');
            }
        } catch (err) {
            if (err.name === 'CanceledError' || err.name === 'AbortError') return;
            console.debug('[SociologicalAssistant]', err);
            setError(err.response?.data?.error || err.message || 'Failed to get AI response. Please try again.');
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [history, isLoading, language]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        sendQuestion(input);
    }, [input, sendQuestion]);

    const handleClear = useCallback(() => {
        abortRef.current?.abort();
        setHistory([]);
        setError(null);
        inputRef.current?.focus();
    }, []);

    const isEmpty = history.length === 0 && !isLoading;

    return (
        <div
            role="region"
            aria-label="AI Sociological Assistant"
            className="glass-panel"
            style={{ display: 'flex', flexDirection: 'column', height: '720px', overflow: 'hidden', position: 'relative' }}
        >
            {/* Toast Notification */}
            {toastMessage && (
                <div style={{
                    position: 'absolute', top: '16px', right: '16px', zIndex: 1000,
                    padding: '10px 16px', borderRadius: '8px',
                    background: '#10b981', color: '#ffffff', fontSize: '13px', fontWeight: '600',
                    boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    animation: 'fadeIn 0.2s ease-in-out'
                }}>
                    <Check size={16} /> {toastMessage}
                </div>
            )}

            {/* ── Header ── */}
            <div style={{
                padding: '14px 18px', borderBottom: '1px solid var(--border-color)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div aria-hidden="true" style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <BrainCircuit size={16} color="#fff" />
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{t('assistant.title', 'AI Sociological Assistant')}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {t('assistant.subtitle', 'Powered by GLM · Explainable AI enabled')}
                            {user?.role && <span style={{ marginLeft: '6px', color: 'var(--accent-primary)' }}>· {user.role}</span>}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* PDF Export Button */}
                    <button
                        onClick={handleExportPDF}
                        disabled={history.length === 0 || isExportingPdf}
                        title={history.length === 0 ? "Ask a question first to export PDF" : t('assistant.exportPdf', 'Export PDF')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 14px', borderRadius: '8px', cursor: history.length > 0 && !isExportingPdf ? 'pointer' : 'not-allowed',
                            background: history.length > 0 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)',
                            border: 'none',
                            color: history.length > 0 ? '#ffffff' : 'var(--text-muted)',
                            fontSize: '12px', fontWeight: '600',
                            transition: 'all 0.2s ease', opacity: history.length === 0 ? 0.6 : 1
                        }}
                    >
                        {isExportingPdf ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
                        {isExportingPdf ? t('assistant.exportingPdf', 'Generating PDF...') : t('assistant.exportPdf', 'Export PDF')}
                    </button>

                    {history.length > 0 && (
                        <button
                            onClick={handleClear}
                            aria-label={t('assistant.clearConversation', 'Clear')}
                            title={t('assistant.clearTooltip', 'Clear conversation history')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                                background: 'transparent', border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500'
                            }}
                        >
                            <Trash2 size={13} aria-hidden="true" /> {t('assistant.clearConversation', 'Clear')}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Messages ── */}
            <div
                role="log"
                aria-live="polite"
                aria-label="Conversation history"
                style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
                {/* Empty State */}
                {isEmpty && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '22px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div aria-hidden="true" style={{
                                width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 14px',
                                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
                                border: '1px solid rgba(59,130,246,0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <BrainCircuit size={28} color="var(--accent-primary)" />
                            </div>
                            <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                {t('assistant.askHeader', 'Ask the Sociological Intelligence Assistant')}
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: '1.5' }}>
                                {t('assistant.askSubheader', 'Analyse crime-linked socio-economic factors, district profiles, and get evidence-backed policy recommendations.')}
                            </p>
                        </div>
                        <nav aria-label="Suggested starter questions" style={{ width: '100%', maxWidth: '540px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {STARTER_PROMPTS.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendQuestion(p)}
                                    aria-label={`Ask: ${p}`}
                                    style={{
                                        padding: '11px 16px', borderRadius: '10px', textAlign: 'left',
                                        background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        transition: 'border-color 0.15s'
                                    }}
                                >
                                    <Sparkles size={14} color="var(--accent-primary)" aria-hidden="true" />
                                    {p}
                                </button>
                            ))}
                        </nav>
                    </div>
                )}

                {/* Conversation turns */}
                {history.map((turn, idx) =>
                    turn.role === 'user'
                        ? <UserBubble key={idx} content={turn.content} userName={user?.name} />
                        : <AssistantBubble key={idx} turn={turn} onFollowUp={sendQuestion} />
                )}

                {/* Loading */}
                {isLoading && (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }} aria-label="AI is thinking" role="status">
                        <div aria-hidden="true" style={{
                            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Bot size={18} color="#fff" />
                        </div>
                        <div style={{
                            padding: '14px 18px', borderRadius: '12px',
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', gap: '12px'
                        }}>
                            <TypingDots />
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('assistant.thinkingMessage', 'Analysing socio-economic patterns...')}</span>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{
                        padding: '12px 16px', borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px'
                    }}>
                        <AlertCircle size={16} color="var(--accent-danger)" aria-hidden="true" />
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1 }}>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            aria-label="Dismiss error"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
                        >
                            <RefreshCw size={14} color="var(--text-muted)" aria-hidden="true" />
                        </button>
                    </div>
                )}

                <div ref={bottomRef} aria-hidden="true" />
            </div>

            {/* ── Input ── */}
            <div style={{ borderTop: '1px solid var(--border-color)', padding: '12px 16px', flexShrink: 0 }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }} noValidate>
                    <label htmlFor="soc-input" className="sr-only">{t('assistant.yourQuestionLabel', 'Your question')}</label>
                    <textarea
                        id="soc-input"
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendQuestion(input);
                            }
                        }}
                        placeholder={t('assistant.inputPlaceholder', 'Ask about socio-economic factors, district risks, policy recommendations... (English / ಕನ್ನಡ)')}
                        disabled={isLoading}
                        rows={2}
                        aria-label="Your question to the AI assistant"
                        aria-describedby="input-hint"
                        style={{
                            flex: 1, resize: 'none', padding: '10px 14px', borderRadius: '10px',
                            background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.5',
                            outline: 'none', fontFamily: 'inherit'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        aria-label="Send question"
                        style={{
                            padding: '10px 16px', borderRadius: '10px', border: 'none', height: '52px',
                            background: input.trim() && !isLoading ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)',
                            color: input.trim() && !isLoading ? '#fff' : 'var(--text-muted)',
                            cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                            transition: 'background 0.2s, color 0.2s',
                            display: 'flex', alignItems: 'center', gap: '7px',
                            fontWeight: '600', fontSize: '13px', flexShrink: 0
                        }}
                    >
                        <Send size={15} aria-hidden="true" />
                        {t('assistant.sendButton', 'Send')}
                    </button>
                </form>
                <div id="input-hint" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '7px' }}>
                    {t('assistant.keyboardHint', 'Press Enter to send · Shift+Enter for new line')}
                </div>
            </div>
        </div>
    );
};

export default SociologicalAssistant;
