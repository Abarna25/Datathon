import React, { useState } from 'react';
import { useCaseData } from '../../hooks/useCaseData';
import {
    PanelRightClose,
    PanelRightOpen,
    Gauge,
    AlertTriangle,
    ShieldCheck,
    Clock,
    Users,
    UserRound,
    Paperclip,
    Pin,
    Database,
    Check,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import * as conversationService from '../../services/conversationService';
import styles from './ContextPanel.module.css';

const RISK_COLORS = { low: 'var(--accent-success)', medium: 'var(--accent-warning)', high: 'var(--accent-danger)' };

const ContextPanel = ({ caseId, collapsed, onToggle, refreshKey }) => {
    const { bundle: summary, loading } = useCaseData();

    // Accordion expand/collapse states
    const [overviewOpen, setOverviewOpen] = useState(true);
    const [suspectsOpen, setSuspectsOpen] = useState(false);
    const [timelineOpen, setTimelineOpen] = useState(false);
    const [evidenceOpen, setEvidenceOpen] = useState(false);
    const [riskOpen, setRiskOpen] = useState(false);

    if (collapsed) {
        return (
            <button type="button" className={styles.collapsedRail} onClick={onToggle} title="Show case context">
                <PanelRightOpen size={18} />
            </button>
        );
    }

    const renderAccordionHeader = (title, isOpen, toggleFunc) => (
        <div 
            onClick={toggleFunc}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
                userSelect: 'none',
                fontWeight: '600',
                fontSize: '13px',
                color: 'var(--text-primary)'
            }}
        >
            <span>{title}</span>
            {isOpen ? <ChevronUp size={14} color="var(--text-secondary)" /> : <ChevronDown size={14} color="var(--text-secondary)" />}
        </div>
    );

    return (
        <aside className={styles.panel} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <div className={styles.header} style={{ borderBottom: '1px solid var(--border-color)', padding: '12px 14px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Case Context</h3>
                <button type="button" className={styles.collapseBtn} onClick={onToggle} title="Hide">
                    <PanelRightClose size={18} />
                </button>
            </div>

            {loading && !summary && <div className={styles.loading} style={{ padding: '14px' }}>Loading case context...</div>}

            {summary && (
                <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
                    
                    {/* SECTION 1: Overview */}
                    <div style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {renderAccordionHeader('Overview', overviewOpen, () => setOverviewOpen(!overviewOpen))}
                        {overviewOpen && (
                            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-secondary)' }}>
                                <div className={styles.caseHeader}>
                                    <span className={styles.caseId} style={{ fontSize: '13.5px' }}>FIR #{summary.case && summary.case.ROWID}</span>
                                    <span className={styles.statusBadge} style={{ fontSize: '10.5px' }}>{(summary.case && summary.case.Status) || 'Active'}</span>
                                </div>
                                <div className={styles.metaRow} style={{ fontSize: '12px', margin: 0 }}>
                                    {(summary.case && summary.case.Jurisdiction) || 'Sector 18 Precinct'}
                                </div>
                                {summary.pinnedFacts && summary.pinnedFacts.length > 0 && (
                                    <div style={{ marginTop: '4px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Pin size={11} /> Pinned Findings
                                        </div>
                                        {summary.pinnedFacts.map((p, i) => (
                                            <div key={i} className={styles.rowItem} style={{ fontSize: '12px', padding: '2px 0' }}>{p.content}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SECTION 2: Suspects */}
                    <div style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {renderAccordionHeader('Suspects', suspectsOpen, () => setSuspectsOpen(!suspectsOpen))}
                        {suspectsOpen && (
                            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-secondary)' }}>
                                <div>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Users size={12} /> Suspects ({(summary.suspects && summary.suspects.length) || 0})
                                    </div>
                                    {summary.suspects && summary.suspects.length ? (
                                        summary.suspects.map((s) => (
                                            <div key={s.ROWID} className={styles.rowItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '3px 0' }}>
                                                <span>{s.name}</span>
                                                <span className={styles.tag} style={{ margin: 0, fontSize: '9px' }}>{s.risk_level}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.emptyHint} style={{ fontSize: '11.5px' }}>None on record.</div>
                                    )}
                                </div>
                                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <UserRound size={12} /> Victims ({(summary.victims && summary.victims.length) || 0})
                                    </div>
                                    {summary.victims && summary.victims.length ? (
                                        summary.victims.map((v, i) => (
                                            <div key={i} className={styles.rowItem} style={{ fontSize: '12.5px', padding: '3px 0' }}>{v.name || v.Name || `Victim #${v.ROWID}`}</div>
                                        ))
                                    ) : (
                                        <div className={styles.emptyHint} style={{ fontSize: '11.5px' }}>None on record.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 3: Timeline */}
                    <div style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {renderAccordionHeader('Timeline', timelineOpen, () => setTimelineOpen(!timelineOpen))}
                        {timelineOpen && (
                            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary)' }}>
                                {summary.timeline && summary.timeline.length ? (
                                    summary.timeline.slice(0, 6).map((t) => (
                                        <div key={t.ROWID} className={styles.timelineItem} style={{ gap: '6px', padding: '2px 0' }}>
                                            <span className={styles.timelineDot} style={{ marginTop: '5px' }} />
                                            <div>
                                                <div className={styles.rowItem} style={{ fontSize: '12px', padding: 0 }}>{t.title}</div>
                                                <div className={styles.timelineTime} style={{ fontSize: '10.5px' }}>{t.event_time}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.emptyHint} style={{ fontSize: '11.5px' }}>No timeline events yet.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: Evidence */}
                    <div style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {renderAccordionHeader('Evidence', evidenceOpen, () => setEvidenceOpen(!evidenceOpen))}
                        {evidenceOpen && (
                            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-secondary)' }}>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <ShieldCheck size={12} /> Evidence Count
                                </div>
                                <div className={styles.evidenceGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                    {Object.entries(summary.evidenceCounts || {}).map(([k, v]) => (
                                        <div key={k} className={styles.evidencePill} style={{ margin: 0, padding: '4px 6px', fontSize: '10.5px' }}>
                                            <span>{v}</span> {k.replace(/([A-Z])/g, ' $1')}
                                        </div>
                                    ))}
                                </div>

                                {summary.recentAttachments && summary.recentAttachments.length > 0 && (
                                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Paperclip size={11} /> Recent Uploads
                                        </div>
                                        {summary.recentAttachments.map((a) => (
                                            <div key={a.ROWID} className={styles.rowItem} style={{ fontSize: '12px', padding: '2px 0' }}>{a.filename}</div>
                                        ))}
                                    </div>
                                )}

                                {/* Seed button removed for final verification */}
                            </div>
                        )}
                    </div>

                    {/* SECTION 5: Risk */}
                    <div style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {renderAccordionHeader('Risk Analysis', riskOpen, () => setRiskOpen(!riskOpen))}
                        {riskOpen && (
                            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-secondary)' }}>
                                <div className={styles.statRow} style={{ display: 'flex', gap: '8px' }}>
                                    <div className={styles.statBox} style={{ flex: 1, padding: '8px', gap: '6px' }}>
                                        <Gauge size={14} color="var(--accent-success)" />
                                        <div>
                                            <div className={styles.statValue} style={{ fontSize: '13.5px' }}>{summary.confidence}%</div>
                                            <div className={styles.statLabel} style={{ fontSize: '9.5px' }}>AI Confidence</div>
                                        </div>
                                    </div>
                                    <div className={styles.statBox} style={{ flex: 1, padding: '8px', gap: '6px' }}>
                                        <AlertTriangle size={14} color={RISK_COLORS[summary.riskLevel] || 'var(--accent-warning)'} />
                                        <div>
                                            <div className={styles.statValue} style={{ textTransform: 'capitalize', fontSize: '13.5px' }}>{summary.riskLevel}</div>
                                            <div className={styles.statLabel} style={{ fontSize: '9.5px' }}>Risk Level</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            )}
        </aside>
    );
};

export default ContextPanel;
