import React, { useState, useEffect } from 'react';
import {
    Compass, Clock, FileText, Sparkles, CheckCircle2,
    Search, MapPin, ArrowRight, ShieldCheck, AlertCircle,
    BookOpen, Layers, Lightbulb, ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const DecisionSupportPanel = ({ caseId = '', defaultExpanded = false }) => {
    const { t } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [activeTab, setActiveTab] = useState('summary');
    const [summary, setSummary] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [similarCases, setSimilarCases] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!caseId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        Promise.all([
            api.get(`/decision/summary/${caseId}`).catch(() => ({ data: { success: false } })),
            api.get(`/decision/timeline/${caseId}`).catch(() => ({ data: { success: false } })),
            api.get(`/decision/similar-cases/${caseId}`).catch(() => ({ data: { success: false } })),
            api.post('/decision/lead-recommendations', { caseId }).catch(() => ({ data: { success: false } }))
        ])
        .then(([sumRes, timeRes, simRes, leadRes]) => {
            if (sumRes.data?.success) setSummary(sumRes.data.data);
            if (timeRes.data?.success) setTimeline(timeRes.data.data);
            if (simRes.data?.success) setSimilarCases(simRes.data.data);
            if (leadRes.data?.success) setLeads(leadRes.data.data);
            setLoading(false);
        })
        .catch(err => {
            console.error('[DecisionSupportPanel] Error:', err);
            setLoading(false);
        });
    }, [caseId]);

    if (loading) {
        return (
            <div className="glass-panel" style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', borderRadius: '8px' }}>
                Synthesising Decision Support Intelligence...
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            
            {/* Header Banner - Collapsible */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }} onClick={() => setIsExpanded(!isExpanded)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Compass size={20} color="var(--accent-primary)" />
                    <div>
                        <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            Investigator Decision Support
                        </h3>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Automated Case Summaries, Timeline Synthesis & Lead Recommendations
                        </div>
                    </div>
                </div>

                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }} 
                    style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', 
                        padding: '6px 12px', borderRadius: '6px', color: 'var(--accent-primary)', 
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', 
                        fontSize: '12px', fontWeight: '600' 
                    }}
                >
                    <span>{isExpanded ? 'Collapse Analysis' : 'Expand Analysis'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    {/* Sub Tabs */}
                    <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', flexWrap: 'wrap' }}>
                        {[
                            { id: 'summary', label: 'Case Summary', icon: FileText },
                            { id: 'timeline', label: 'Automated Timeline', icon: Clock },
                            { id: 'similar', label: 'Similar Precedents', icon: Layers },
                            { id: 'leads', label: 'Lead Recommendations', icon: Lightbulb }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '5px 10px', borderRadius: '6px', border: 'none',
                                    background: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
                                    color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                                    fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                <tab.icon size={13} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab 1: Automatic Case Summary */}
                    {activeTab === 'summary' && summary && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                            <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                                <strong style={{ fontSize: '10.5px', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Overview</strong>
                                <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: '1.4' }}>{summary.overview}</div>
                            </div>
                            <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                                <strong style={{ fontSize: '10.5px', color: '#f59e0b', textTransform: 'uppercase' }}>Victim Summary</strong>
                                <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: '1.4' }}>{summary.victimSummary}</div>
                            </div>
                            <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                                <strong style={{ fontSize: '10.5px', color: '#ef4444', textTransform: 'uppercase' }}>Accused Summary</strong>
                                <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: '1.4' }}>{summary.accusedSummary}</div>
                            </div>
                            <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                                <strong style={{ fontSize: '10.5px', color: '#10b981', textTransform: 'uppercase' }}>Evidence & Status</strong>
                                <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: '1.4' }}>{summary.evidenceSummary}</div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Automatic Timeline Generation */}
                    {activeTab === 'timeline' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {timeline && timeline.length ? (
                                timeline.map((t, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-tertiary)', borderLeft: '3px solid var(--accent-primary)' }}>
                                        <div style={{ flexShrink: 0, fontSize: '10.5px', fontWeight: '700', color: 'var(--accent-primary)', width: '120px' }}>
                                            {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{t.type}</div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)' }}>{t.title}</div>
                                            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.description}</div>
                                            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '3px' }}>Source: {t.source}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '10px' }}>No timeline data available.</div>
                            )}
                        </div>
                    )}

                    {/* Tab 3: Similar Case Precedents */}
                    {activeTab === 'similar' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {similarCases && similarCases.length ? (
                                similarCases.map((c, idx) => (
                                    <div key={idx} style={{ padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{c.title}</strong>
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.caseId}</span>
                                            </div>
                                            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '3px' }}>{c.matchReason}</div>
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                                {c.evidenceMatch && c.evidenceMatch.map((e, i) => (
                                                    <span key={i} style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)' }}>
                                                        {e}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '6px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)' }}>
                                            <div style={{ fontSize: '16px', fontWeight: '800', color: '#10b981' }}>{c.similarityScore}</div>
                                            <div style={{ fontSize: '8.5px', color: 'var(--text-muted)' }}>MATCH</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '10px' }}>No similar cases found.</div>
                            )}
                        </div>
                    )}

                    {/* Tab 4: Investigation Lead Recommendation */}
                    {activeTab === 'leads' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {leads && leads.length ? (
                                leads.map((l, idx) => (
                                    <div key={idx} style={{ padding: '10px 12px', borderRadius: '6px', background: 'var(--bg-tertiary)', borderLeft: '3px solid #f59e0b' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <strong style={{ fontSize: '11px', color: '#f59e0b', textTransform: 'uppercase' }}>{l.category}</strong>
                                            <span style={{ fontSize: '9.5px', fontWeight: '700', padding: '1px 5px', borderRadius: '8px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                                                {l.confidence} CONFIDENCE
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '3px' }}>{l.recommendation}</div>
                                        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>Reason: {l.reason}</div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '10px' }}>No recommendations generated.</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DecisionSupportPanel;
