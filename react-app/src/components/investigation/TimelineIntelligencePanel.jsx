import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Target, Link, Database, Info, Activity, UserMinus, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import styles from './TimelineIntelligencePanel.module.css';

const TimelineIntelligencePanel = ({ caseId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (caseId) fetchData();
    }, [caseId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get(`/cases/${caseId}/timeline-intelligence`);
            if (res.data.success) {
                setData(res.data);
            } else {
                throw new Error(res.data.error || 'Failed to load timeline intelligence');
            }
        } catch (err) {
            setError(err.message || 'Error loading timeline intelligence');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <Clock size={20} color="#3b82f6" />
                    <h3 className={styles.title}>Explainable Timeline Intelligence powered by real investigation records.</h3>
                </div>
                <div className={styles.emptyState}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ marginBottom: 16 }}>
                        <Clock size={32} color="#3b82f6" />
                    </motion.div>
                    <div>Analyzing temporal records & alibi gaps...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <Clock size={20} color="#3b82f6" />
                    <h3 className={styles.title}>Explainable Timeline Intelligence</h3>
                </div>
                <div className={styles.emptyState}>
                    <AlertTriangle size={32} color="#ef4444" className={styles.emptyIcon} />
                    <div style={{ color: '#ef4444' }}>Error: {error}</div>
                </div>
            </div>
        );
    }

    if (data.message === 'Insufficient timeline data for gap analysis.') {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <Clock size={20} color="#3b82f6" />
                    <h3 className={styles.title}>Explainable Timeline Intelligence</h3>
                    <div className={styles.badge}>Insufficient Data</div>
                </div>
                <div className={styles.emptyState}>
                    <Info size={32} className={styles.emptyIcon} />
                    <div>Insufficient timeline data for gap analysis.</div>
                </div>
            </div>
        );
    }

    const hasAnomalies = data.gaps?.some(g => g.type !== 'NORMAL') || 
                         (data.contradictions?.length > 0) || 
                         (data.missingRecords?.length > 0) || 
                         (data.alibiInformationGaps?.length > 0);

    const renderIssueCard = (item, idx, customIcon = <AlertTriangle size={16}/>, customColorClass = styles.medium) => (
        <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${styles.issueCard} ${item.severity === 'HIGH' ? styles.high : customColorClass}`}>
            <div className={styles.issueHeader}>
                <div className={styles.issueType}>{item.type.replace(/_/g, ' ')}</div>
                {item.severity && <div className={`${styles.issueSeverity} ${item.severity === 'HIGH' ? styles.high : styles.medium}`}>{item.severity}</div>}
            </div>
            <div className={styles.issueBody}>
                <strong>WHAT:</strong> {item.what} <br/>
                <strong>WHY:</strong> {item.why}
            </div>
            <div className={styles.issueMeta}>
                <span><Database size={12} style={{ marginRight: 4 }}/> SOURCE: {item.source?.join(', ')}</span>
                <span><Target size={12} style={{ marginRight: 4 }}/> CONFIDENCE: {item.confidence}</span>
            </div>
        </motion.div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Clock size={20} color="#3b82f6" />
                <h3 className={styles.title}>Explainable Timeline Intelligence powered by real investigation records.</h3>
            </div>

            <div className={styles.content}>
                
                {/* 7. Data Completeness */}
                <div className={styles.completenessBanner}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Activity size={24} color="#10b981" />
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>Data Completeness Score: {data.dataCompleteness?.score || 0}%</div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>
                                FIR: {data.dataCompleteness?.milestones?.fir ? '✓' : '✗'} | 
                                Occurrence: {data.dataCompleteness?.milestones?.occurrence ? '✓' : '✗'} | 
                                Arrest: {data.dataCompleteness?.milestones?.arrest ? '✓' : '✗'} | 
                                Chargesheet: {data.dataCompleteness?.milestones?.chargesheet ? '✓' : '✗'}
                            </div>
                        </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Source: {data.dataSource} @ {new Date(data.generatedAt).toLocaleTimeString()}</div>
                </div>

                {!hasAnomalies && (
                    <div className={styles.emptyState}>
                        <Info size={32} className={styles.emptyIcon} color="#10b981" />
                        <div style={{ color: '#10b981', fontWeight: 600 }}>No timeline anomalies detected from available records.</div>
                    </div>
                )}

                {hasAnomalies && (
                    <div className={styles.issuesSection}>
                        <div className={styles.sectionTitle}>
                            <ShieldAlert size={18} color="#ef4444" />
                            Detected Anomalies & Gaps
                        </div>
                        <div className={styles.cardGrid}>
                            
                            {/* 3. Date Contradictions */}
                            {data.contradictions?.map((c, idx) => renderIssueCard(c, `c-${idx}`, <AlertTriangle/>, styles.high))}

                            {/* 4. Potential Missing Records */}
                            {data.missingRecords?.map((m, idx) => renderIssueCard(m, `m-${idx}`, <Database/>, styles.medium))}

                            {/* 2. Investigation Gaps (excluding NORMAL) */}
                            {data.gaps?.filter(g => g.type !== 'NORMAL').map((g, idx) => renderIssueCard(g, `g-${idx}`, <Clock/>, g.severity === 'HIGH' ? styles.high : styles.medium))}

                            {/* 5. Alibi Information Gaps */}
                            {data.alibiInformationGaps?.map((a, idx) => renderIssueCard(a, `a-${idx}`, <UserMinus/>, styles.medium))}
                        </div>
                    </div>
                )}

                {/* 6. Next Best Actions */}
                {data.nextBestActions?.length > 0 && (
                    <div className={styles.issuesSection}>
                        <div className={styles.sectionTitle}>
                            <Target size={18} color="#3b82f6" />
                            Next Best Actions
                        </div>
                        <div className={styles.actionList}>
                            {data.nextBestActions.map((action, idx) => (
                                <div key={idx} className={styles.nextAction}>
                                    <div className={styles.nextActionTitle}><Target size={14}/> Action Required</div>
                                    <p className={styles.nextActionText}><strong>WHAT:</strong> {action.action}</p>
                                    <p className={styles.nextActionText} style={{ marginTop: 4, color: '#475569', fontSize: 12 }}><strong>WHY:</strong> {action.reasoning}</p>
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}><Database size={10} style={{marginRight: 4}}/> SOURCE: {action.source?.join(', ')}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 1. Timeline */}
                <div className={styles.timelineSection}>
                    <div className={styles.sectionTitle}>
                        <Link size={18} color="#3b82f6" />
                        Chronological Event Reconstruction
                    </div>
                    
                    <div className={styles.timeline}>
                        {data.timeline?.map((evt, idx) => {
                            const date = new Date(evt.date);
                            return (
                                <motion.div 
                                    key={idx} 
                                    className={styles.timelineItem}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <div className={styles.timelineDot} style={{ borderColor: evt.eventType === 'CRIME_OCCURRENCE' ? '#ef4444' : evt.eventType === 'ARREST_SURRENDER' ? '#f59e0b' : '#3b82f6' }} />
                                    <div className={styles.timelineDate}>
                                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className={styles.timelineContent}>
                                        <div className={styles.timelineType}>{evt.eventType.replace(/_/g, ' ')}</div>
                                        <p className={styles.timelineDesc}>{evt.description}</p>
                                        <div className={styles.timelineSource}>
                                            <Database size={12} /> {evt.sourceTable} • ID: {evt.sourceRecordId}
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TimelineIntelligencePanel;
