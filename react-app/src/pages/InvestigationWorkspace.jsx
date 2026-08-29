import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader2, FileText, Database, Compass, Clock, Search, Bot, Layers, Network, ChevronRight, Users, Share2, LayoutList, Zap, Fingerprint, Link as LinkIcon, BrainCircuit, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useGodMode } from '../context/GodModeContext';
import { ConversationProvider } from '../context/ConversationContext';
import api from '../services/api';
import styles from './InvestigationWorkspace.module.css';

// Panels & Components
import FIRSummaryPanel from '../components/investigation/FIRSummaryPanel';
import DecisionSupportPanel from '../components/investigation/DecisionSupportPanel';
import TimelineIntelligencePanel from '../components/investigation/TimelineIntelligencePanel';
import InvestigationLeadsPanel from '../components/investigation/InvestigationLeadsPanel';
import MOProfilePanel from '../components/investigation/MOProfilePanel';
import EvidenceChainView from '../components/investigation/EvidenceChainView';
import SociologicalAssistant from '../components/sociological/SociologicalAssistant';
import ForesightPanel from '../components/foresight/ForesightPanel';

import EvidenceSummaryCards from '../components/evidence/EvidenceSummaryCards';
import EvidenceTimeline from '../components/evidence/EvidenceTimeline';
import EvidenceCorrelationGraph from '../components/evidence/EvidenceCorrelationGraph';
import InvestigationChat from '../components/chat/InvestigationChat';
import DataExplorer from './DataExplorer';
import RelationshipExplorer from './RelationshipExplorer';
import EntityCards from '../components/fir/EntityCards';
import TimelineView from '../components/fir/TimelineView';

const InvestigationWorkspace = () => {
    const navigate = useNavigate();
    const { caseId: paramCaseId } = useParams();
    const [searchParams] = useSearchParams();
    const { activeCaseId, setActiveCaseId, loadingCases, currentCase, cases } = useAppContext();
    const { activateGodMode } = useGodMode();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

    // Sync query param tab if changed
    useEffect(() => {
        const queryTab = searchParams.get('tab');
        if (queryTab && queryTab !== activeTab) {
            setActiveTab(queryTab);
        }
    }, [searchParams, activeTab]);

    // Sync URL param with activeCaseId or select default first case
    useEffect(() => {
        if (paramCaseId && paramCaseId !== activeCaseId && setActiveCaseId) {
            setActiveCaseId(paramCaseId);
        } else if (!activeCaseId && cases && cases.length > 0 && setActiveCaseId) {
            setActiveCaseId(String(cases[0].id));
        }
    }, [paramCaseId, activeCaseId, cases, setActiveCaseId]);

    const effectiveCaseId = paramCaseId || (activeCaseId !== 'all' ? activeCaseId : (cases && cases[0]?.id)) || '101';
    
    // For Evidence Intelligence data
    const [evidenceData, setEvidenceData] = useState(null);
    const [loadingEvidence, setLoadingEvidence] = useState(false);

    useEffect(() => {
        if (activeTab === 'evidence' && effectiveCaseId && !evidenceData) {
            setLoadingEvidence(true);
            api.get(`/evidence-intelligence/workspace?caseId=${effectiveCaseId}`)
                .then(res => {
                    if (res.data.success) {
                        setEvidenceData(res.data.data);
                    }
                })
                .catch(console.error)
                .finally(() => setLoadingEvidence(false));
        }
    }, [activeTab, effectiveCaseId, evidenceData]);

    if (loadingCases && !currentCase) {
        return (
            <div className={styles.loadingState} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader2 size={36} className="spin" color="var(--accent-primary)" />
                <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading active case bundle...</p>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Case Overview', icon: FileText },
        { id: 'foresight', label: '🔮 Foresight (Predictive ML)', icon: Sparkles },
        { id: 'leads', label: 'Investigation Leads', icon: Zap },
        { id: 'mo', label: 'MO Intelligence', icon: Fingerprint },
        { id: 'chain', label: 'Evidence Chain', icon: LinkIcon },
        { id: 'fir', label: 'FIR Intelligence', icon: FileText },
        { id: 'evidence', label: 'Evidence Intelligence', icon: Database },
        { id: 'entities', label: 'Entities', icon: Users },
        { id: 'relationships', label: 'Relationship Explorer', icon: Network },
        { id: 'timeline', label: 'Investigation Timeline', icon: LayoutList },
        { id: 'timeline-intel', label: 'Timeline Intelligence', icon: Clock },
        { id: 'sociological', label: 'Sociological Intelligence', icon: BrainCircuit },
        { id: 'similar', label: 'Similar Cases', icon: Share2 },
        { id: 'decision', label: 'Decision Support', icon: Compass },
        { id: 'search', label: 'Investigation Search', icon: Search },
        { id: 'copilot', label: 'VIKSHANA Copilot', icon: Bot },
        { id: 'report', label: 'Investigation Report', icon: Layers }
    ];


    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Header / Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '24px' }}>
                    <Search size={20} color="var(--accent-primary)" />
                    <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Investigation Workspace</h2>
                    <ChevronRight size={14} color="var(--text-secondary)" />
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Case {currentCase?.caseNumber || activeCaseId}</span>
                </div>

                <button
                    id="workspace-god-mode-btn"
                    onClick={() => activateGodMode({
                        source: 'investigation-workspace',
                        query: `Case ${currentCase?.caseNumber || effectiveCaseId}`,
                        caseId: effectiveCaseId,
                        entityType: null,
                        entityId: null,
                        entityName: null
                    })}
                    title="Activate Deep Investigation Mode"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
                        background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)',
                        border: '1px solid #3b82f6',
                        borderRadius: '6px',
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 0 10px rgba(37,99,235,0.4)',
                        marginRight: '16px',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <Zap size={14} color="#fbbf24" fill="#fbbf24" />
                    <span>⚡ GOD MODE</span>
                </button>
                
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                                background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                                color: activeTab === tab.id ? '#3b82f6' : 'var(--text-secondary)',
                                fontWeight: activeTab === tab.id ? '600' : '500',
                                cursor: 'pointer', borderRadius: '6px 6px 0 0', transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                {activeTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <FIRSummaryPanel bundle={currentCase} />
                        <div className="glass-panel" style={{ padding: '20px' }}>
                            <h3 style={{ marginTop: 0 }}>Case Context</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                {currentCase?.briefFacts || 'No brief facts available for this case.'}
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'foresight' && (
                    <ForesightPanel
                        caseId={effectiveCaseId}
                        suspects={currentCase?.suspects || []}
                    />
                )}


                {activeTab === 'fir' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <FIRSummaryPanel bundle={currentCase} />
                        <div className="glass-panel" style={{ padding: '20px' }}>
                            <h3 style={{ marginTop: 0 }}>FIR Narrative</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                {currentCase?.firSummary?.firText || currentCase?.briefFacts || 'FIR narrative not available.'}
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'evidence' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {loadingEvidence ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}><Loader2 className="spin" size={24} /></div>
                        ) : evidenceData ? (
                            <>
                                <EvidenceSummaryCards summary={evidenceData.unified_evidence?.summary} />
                                <EvidenceTimeline evidence={evidenceData.unified_evidence?.evidence} />
                                <EvidenceCorrelationGraph correlations={evidenceData.correlations} evidence={evidenceData.unified_evidence?.evidence || []} caseId={activeCaseId} />
                            </>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Insufficient evidence data.</div>
                        )}
                    </div>
                )}

                {activeTab === 'entities' && (
                    <div style={{ padding: '10px' }}>
                        <EntityCards entities={currentCase?.entities || []} />
                        {(!currentCase?.entities || currentCase.entities.length === 0) && (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No entities extracted from this case.</div>
                        )}
                    </div>
                )}

                {activeTab === 'relationships' && (
                    <div style={{ height: 'calc(100vh - 200px)', borderRadius: '12px', overflow: 'hidden' }}>
                        <RelationshipExplorer embedded={true} />
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <div style={{ padding: '10px' }}>
                        <TimelineView timeline={currentCase?.timeline || []} />
                        {(!currentCase?.timeline || currentCase.timeline.length === 0) && (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No timeline events available for this case.</div>
                        )}
                    </div>
                )}

                {activeTab === 'leads' && (
                    <InvestigationLeadsPanel caseId={effectiveCaseId} />
                )}

                {activeTab === 'mo' && (
                    <MOProfilePanel caseId={effectiveCaseId} />
                )}

                {activeTab === 'chain' && (
                    <EvidenceChainView caseId={effectiveCaseId} />
                )}

                {activeTab === 'timeline-intel' && (
                    <TimelineIntelligencePanel caseId={effectiveCaseId} />
                )}

                {activeTab === 'sociological' && (
                    <SociologicalAssistant caseId={effectiveCaseId} />
                )}

                {activeTab === 'similar' && (
                    <div style={{ padding: '10px' }}>
                        <DecisionSupportPanel caseId={effectiveCaseId} defaultExpanded={true} />
                    </div>
                )}

                {activeTab === 'decision' && (
                    <DecisionSupportPanel caseId={effectiveCaseId} defaultExpanded={true} />
                )}

                {activeTab === 'search' && (
                    <div style={{ height: 'calc(100vh - 200px)', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                        <DataExplorer embedded={true} />
                    </div>
                )}

                {activeTab === 'copilot' && (
                    <div style={{ height: 'calc(100vh - 200px)', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden' }}>
                        <ConversationProvider caseId={effectiveCaseId}>
                            <InvestigationChat caseId={effectiveCaseId} />
                        </ConversationProvider>
                    </div>
                )}

                {activeTab === 'report' && (
                    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                        <Layers size={48} color="var(--accent-primary)" style={{ marginBottom: '16px', opacity: 0.8 }} />
                        <h2>Investigation Report</h2>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 24px' }}>
                            Generate a comprehensive court-ready report consolidating FIR details, evidence correlation, timeline intelligence, and AI decision support.
                        </p>
                        <button 
                            onClick={() => navigate('/reports')}
                            style={{ padding: '10px 24px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Generate Report for Case {effectiveCaseId}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvestigationWorkspace;
