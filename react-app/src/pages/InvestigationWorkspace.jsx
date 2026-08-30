import React, { useState, useEffect, useRef } from 'react';
import { Loader2, FileText, Database, Compass, Clock, MapPin, Search, Bot, Layers, Network, ChevronRight, ChevronLeft, Users, Share2, LayoutList } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ConversationProvider } from '../context/ConversationContext';
import api from '../services/api';
import styles from './InvestigationWorkspace.module.css';

// Panels & Components
import FIRSummaryPanel from '../components/investigation/FIRSummaryPanel';
import DecisionSupportPanel from '../components/investigation/DecisionSupportPanel';
import HistoricalIntelligencePanel from '../components/investigation/HistoricalIntelligencePanel';
import TimelineIntelligencePanel from '../components/investigation/TimelineIntelligencePanel';
import EvidenceSummaryCards from '../components/evidence/EvidenceSummaryCards';
import EvidenceTimeline from '../components/evidence/EvidenceTimeline';
import EvidenceCorrelationGraph from '../components/evidence/EvidenceCorrelationGraph';
import EvidenceGapAnalysis from '../components/evidence/EvidenceGapAnalysis';
import InvestigationChat from '../components/chat/InvestigationChat';
import EvidenceIntegrityView from '../components/investigation/EvidenceIntegrityView';

import EntityCards from '../components/fir/EntityCards';
import VictimPanel from '../components/fir/VictimPanel';
import AccusedPanel from '../components/fir/AccusedPanel';
import CaseCompletenessCard from '../components/advanced-intelligence/CaseCompletenessCard';

const InvestigationWorkspace = () => {
    const { activeCaseId, loadingCases, currentCase } = useAppContext();
    const [activeTab, setActiveTab] = useState('overview');
    const scrollContainerRef = useRef(null);
    
    const scrollTabs = (direction) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
        }
    };
    
    // For Evidence Intelligence data
    const [evidenceData, setEvidenceData] = useState(null);
    const [loadingEvidence, setLoadingEvidence] = useState(false);

    // Track the case ID that evidenceData was fetched for
    const [evidenceCaseId, setEvidenceCaseId] = useState(null);

    useEffect(() => {
        if (activeTab === 'evidence' && activeCaseId && evidenceCaseId !== activeCaseId) {
            setLoadingEvidence(true);
            api.get(`/evidence-intelligence/workspace?caseId=${activeCaseId}`)
                .then(res => {
                    if (res.data.success) {
                        setEvidenceData(res.data.data);
                        setEvidenceCaseId(activeCaseId);
                    }
                })
                .catch(console.error)
                .finally(() => setLoadingEvidence(false));
        }
    }, [activeTab, activeCaseId, evidenceData]);

    if (loadingCases || !activeCaseId || activeCaseId === 'all') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.4) 0%, transparent 70%)' }}>
                {(!activeCaseId || activeCaseId === 'all') && !loadingCases ? (
                    <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', maxWidth: '500px', borderTop: '4px solid #3b82f6', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', marginBottom: '24px' }}>
                            <Search size={40} color="#3b82f6" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.5))' }} />
                        </div>
                        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 12px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Command Center Idle</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
                            Awaiting case context. Please select an active investigation or global search from the top navigation to initialize the intelligence workspace.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(59,130,246,0.5)', animation: 'pulse 1.5s infinite' }}></div>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(59,130,246,0.3)', animation: 'pulse 1.5s infinite 0.2s' }}></div>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', animation: 'pulse 1.5s infinite 0.4s' }}></div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite' }}></div>
                            <Loader2 size={32} color="#3b82f6" />
                        </div>
                        <p style={{ marginTop: '24px', color: '#3b82f6', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Synchronizing Datastore...</p>
                    </div>
                )}
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Case Overview', icon: FileText },
        { id: 'evidence', label: 'Evidence Intelligence', icon: Database },
        { id: 'timeline', label: 'Timeline Intelligence', icon: Clock },
        { id: 'leads', label: 'Investigation Leads', icon: Search },
        { id: 'historical', label: 'Historical Intelligence', icon: Share2 },
        { id: 'relationships', label: 'Relationships', icon: Share2 },
        { id: 'decision-support', label: 'Decision Support', icon: Compass },
        { id: 'copilot', label: 'VIKSHANA Copilot', icon: Bot },
        { id: 'report', label: 'Investigation Report', icon: Layers }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Header / Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '20px', paddingBottom: '16px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px' }}>
                        <Search size={24} color="#3b82f6" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)', whiteSpace: 'nowrap', fontWeight: '800', letterSpacing: '-0.5px' }}>Intelligence Command</h2>
                        <span style={{ fontSize: '12px', color: '#3b82f6', whiteSpace: 'nowrap', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Case: {currentCase?.caseNumber || activeCaseId}</span>
                    </div>
                </div>
                
                <div className={styles.hideScrollbar} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1, padding: '4px' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px',
                                background: activeTab === tab.id 
                                    ? (tab.id === 'copilot' ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : '#3b82f6') 
                                    : (tab.id === 'copilot' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.03)'),
                                border: '1px solid',
                                borderColor: activeTab === tab.id 
                                    ? (tab.id === 'copilot' ? '#a78bfa' : '#60a5fa') 
                                    : (tab.id === 'copilot' ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.05)'),
                                color: activeTab === tab.id 
                                    ? '#ffffff' 
                                    : (tab.id === 'copilot' ? '#a78bfa' : 'var(--text-secondary)'),
                                fontWeight: activeTab === tab.id || tab.id === 'copilot' ? '700' : '500',
                                cursor: 'pointer', borderRadius: '12px', transition: 'all 0.2s',
                                whiteSpace: 'nowrap', flexShrink: 0,
                                boxShadow: activeTab === tab.id 
                                    ? (tab.id === 'copilot' ? '0 4px 15px rgba(139, 92, 246, 0.4)' : '0 4px 12px rgba(59, 130, 246, 0.3)') 
                                    : 'none'
                            }}
                        >
                            <tab.icon size={16} color={activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)'} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                {activeTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <FIRSummaryPanel bundle={currentCase} />
                            </div>
                            <div style={{ width: '350px' }}>
                                <CaseCompletenessCard caseId={activeCaseId} />
                            </div>
                        </div>
                        <div className="glass-panel" style={{ padding: '20px' }}>
                            <h3 style={{ marginTop: 0 }}>Case Context & FIR Narrative</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                {currentCase?.firSummary?.firText || currentCase?.briefFacts || 'No brief facts available for this case.'}
                            </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <VictimPanel victims={currentCase?.victims || []} />
                            <AccusedPanel accused={currentCase?.suspects || []} />
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
                                <EvidenceGapAnalysis gapAnalysis={evidenceData.gapAnalysis} recommendations={evidenceData.recommendations} />
                                <EvidenceIntegrityView caseId={activeCaseId} />

                            </>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Insufficient evidence data.</div>
                        )}
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
                        <TimelineIntelligencePanel caseId={activeCaseId} />
                    </div>
                )}

                {activeTab === 'leads' && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <h3>Investigation Leads</h3>
                        <p>Actionable leads derived from case evidence will appear here.</p>
                        <p><i>(Lead generation engine actively indexing...)</i></p>
                    </div>
                )}

                {activeTab === 'historical' && (
                    <div style={{ padding: '10px' }}>
                        <HistoricalIntelligencePanel caseId={activeCaseId} />
                    </div>
                )}

                {activeTab === 'relationships' && (
                    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                        <Network size={48} color="var(--accent-primary)" style={{ marginBottom: '16px', opacity: 0.8 }} />
                        <h2>Criminal Network Intelligence</h2>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 24px', lineHeight: '1.6' }}>
                            The Relationships module (Framework 5) constructs a visual entity graph connecting suspects, victims, vehicles, and aliases across multiple FIRs. It is designed to uncover hidden syndicates and repeat offenders by traversing multi-hop node linkages.
                        </p>
                        <p style={{ color: 'var(--text-muted)' }}>
                            <i>Cross-case entity resolution is actively running in the background.</i>
                        </p>
                    </div>
                )}

                {activeTab === 'decision-support' && (
                    <div style={{ padding: '10px' }}>
                        <DecisionSupportPanel caseId={activeCaseId} defaultExpanded={true} />
                    </div>
                )}

                {activeTab === 'copilot' && (
                    <div style={{ height: 'calc(100vh - 200px)', border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden' }}>
                        <ConversationProvider caseId={activeCaseId}>
                            <InvestigationChat caseId={activeCaseId} />
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
                        <button style={{ padding: '10px 24px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Generate Report for Case {activeCaseId}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvestigationWorkspace;
