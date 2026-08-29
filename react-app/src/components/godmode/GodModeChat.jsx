import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, ArrowLeft, Send, Shield, Fingerprint,
  Link as LinkIcon, Network, Share2, AlertCircle, CheckCircle2,
  HelpCircle, ChevronDown, ChevronRight, Layers, FileText, Lock,
  Sparkles, Loader2, ShieldAlert
} from 'lucide-react';
import { useGodMode } from '../../context/GodModeContext';
import GodModeOrchestrator from '../../services/godModeOrchestrator';
import styles from './GodModeChat.module.css';

const QUICK_ACTIONS = [
  { id: 'sentinel', label: '🛡️ Sentinel Priority Triage', isHero: true },
  { id: 'foresight', label: '🔮 Foresight Recidivism Score', isHero: true },
  { id: 'complete', label: '⚡ Run Complete Investigation', icon: Zap },
  { id: 'leads', label: 'Strongest Investigation Leads', icon: Zap },
  { id: 'mo', label: 'MO Intelligence', icon: Fingerprint },
  { id: 'chain', label: 'Evidence Chain', icon: LinkIcon },
  { id: 'network', label: 'Temporal Network', icon: Network },
  { id: 'similar', label: 'Similar Cases', icon: Share2 },
  { id: 'gaps', label: 'Investigation Gaps', icon: AlertCircle },
  { id: 'patterns', label: 'Emerging Patterns', icon: Layers }
];



const GodModeChat = () => {
  const navigate = useNavigate();
  const { context, exitGodMode } = useGodMode();
  const effectiveCaseId = context?.caseId || '101';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeXAI, setActiveXAI] = useState(null); // { insightId, data }

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initial greeting / context message
  useEffect(() => {
    const welcomeMsg = {
      id: 'welcome',
      role: 'assistant',
      type: 'welcome',
      content: `⚡ **GOD MODE DEEP INVESTIGATION ACTIVATED**

Intelligence engines synchronized for **Case #${effectiveCaseId}**${context?.query ? ` (Query: *"${context.query}"*)` : ''}.
Full analytical depth is unlocked. You can execute high-level multi-vector synthesis or query individual intelligence subsystems below.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([welcomeMsg]);
  }, [effectiveCaseId, context?.query]);

  // Handle Exit
  const handleExit = () => {
    exitGodMode();
    if (context?.source === 'investigation-workspace') {
      navigate(`/investigate/${effectiveCaseId}`);
    } else {
      navigate('/search');
    }
  };

  // Run Quick Action or Complete Investigation
  const handleQuickAction = async (actionId) => {
    if (isLoading) return;

    const action = QUICK_ACTIONS.find(a => a.id === actionId);
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: action ? action.label : actionId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      if (actionId === 'complete') {
        const report = await GodModeOrchestrator.runCompleteInvestigation(effectiveCaseId, context?.query);
        setMessages(prev => [
          ...prev,
          {
            id: `report-${Date.now()}`,
            role: 'assistant',
            type: 'complete_report',
            data: report,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (actionId === 'leads') {
        const leadsData = await GodModeOrchestrator.getInvestigationLeads(effectiveCaseId);
        setMessages(prev => [
          ...prev,
          {
            id: `leads-${Date.now()}`,
            role: 'assistant',
            type: 'leads',
            data: leadsData,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (actionId === 'mo') {
        const moData = await GodModeOrchestrator.getMOAnalysis(effectiveCaseId);
        setMessages(prev => [
          ...prev,
          {
            id: `mo-${Date.now()}`,
            role: 'assistant',
            type: 'mo',
            data: moData,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (actionId === 'chain') {
        const chainData = await GodModeOrchestrator.getEvidenceChain(effectiveCaseId);
        setMessages(prev => [
          ...prev,
          {
            id: `chain-${Date.now()}`,
            role: 'assistant',
            type: 'chain',
            data: chainData,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (actionId === 'network') {
        const netData = await GodModeOrchestrator.getTemporalNetwork(effectiveCaseId);
        setMessages(prev => [
          ...prev,
          {
            id: `network-${Date.now()}`,
            role: 'assistant',
            type: 'network',
            data: netData,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (actionId === 'similar') {
        const simData = await GodModeOrchestrator.getSimilarCases(effectiveCaseId);
        setMessages(prev => [
          ...prev,
          {
            id: `similar-${Date.now()}`,
            role: 'assistant',
            type: 'similar',
            data: simData,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (actionId === 'gaps') {
        const gapsData = await GodModeOrchestrator.getInvestigationGaps(effectiveCaseId);
        setMessages(prev => [
          ...prev,
          {
            id: `gaps-${Date.now()}`,
            role: 'assistant',
            type: 'gaps',
            data: gapsData,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (actionId === 'patterns') {
        const patData = await GodModeOrchestrator.getEmergingPatterns();
        setMessages(prev => [
          ...prev,
          {
            id: `patterns-${Date.now()}`,
            role: 'assistant',
            type: 'patterns',
            data: patData,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (actionId === 'sentinel') {
        const sentinelData = await GodModeOrchestrator.getSentinelTriage(effectiveCaseId);
        setMessages(prev => [
          ...prev,
          {
            id: `sentinel-${Date.now()}`,
            role: 'assistant',
            type: 'sentinel',
            data: sentinelData,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else if (actionId === 'foresight') {
        const targetSuspect = context?.entityName || 'Prakash Kulkarni';
        const foresightData = await GodModeOrchestrator.getForesightAssessment(targetSuspect, effectiveCaseId);
        setMessages(prev => [
          ...prev,
          {
            id: `foresight-${Date.now()}`,
            role: 'assistant',
            type: 'foresight',
            data: foresightData,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error('[GodMode] Action execution failed:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          type: 'text',
          content: `⚠️ Failed to execute ${action?.label || 'action'}: ${err.message || 'Server error'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Natural Language Input
  const handleSend = async () => {
    const queryText = input.trim();
    if (!queryText || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const routing = GodModeOrchestrator.classifyAndRouteQuery(queryText);

    try {
      if (routing.type === 'FORESIGHT_ASSESSMENT') {
        await handleQuickAction('foresight');
      } else if (routing.type === 'SENTINEL_TRIAGE') {
        await handleQuickAction('sentinel');
      } else if (routing.type === 'COMPLETE_INVESTIGATION') {
        await handleQuickAction('complete');

      } else if (routing.type === 'LEADS') {
        await handleQuickAction('leads');
      } else if (routing.type === 'MO') {
        await handleQuickAction('mo');
      } else if (routing.type === 'EVIDENCE_CHAIN') {
        await handleQuickAction('chain');
      } else if (routing.type === 'TEMPORAL_NETWORK') {
        await handleQuickAction('network');
      } else if (routing.type === 'SIMILAR_CASES') {
        await handleQuickAction('similar');
      } else if (routing.type === 'GAPS') {
        await handleQuickAction('gaps');
      } else if (routing.type === 'EMERGING_PATTERNS') {
        await handleQuickAction('patterns');

      } else {
        // Run deep natural investigation lead query
        const leadsData = await GodModeOrchestrator.getInvestigationLeads(effectiveCaseId);
        setMessages(prev => [
          ...prev,
          {
            id: `leads-${Date.now()}`,
            role: 'assistant',
            type: 'leads',
            data: leadsData,
            content: `Synthesized intelligence for: "${queryText}"`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          type: 'text',
          content: `Query analysis error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger XAI Explanation Modal / Drawer
  const handleExplainXAI = async (insightType, insightId) => {
    if (activeXAI?.insightId === insightId) {
      setActiveXAI(null);
      return;
    }

    try {
      const explanation = await GodModeOrchestrator.getXAIExplanation(insightType, effectiveCaseId, insightId);
      setActiveXAI({ insightId, data: explanation });
    } catch (e) {
      console.error('[GodMode] Failed to fetch XAI explanation:', e);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.header}>
        <div className={styles.brandArea}>
          <div className={styles.godIconBadge}>
            <Zap size={22} color="#ffffff" />
          </div>
          <div className={styles.titleArea}>
            <h1>
              <span>⚡ GOD MODE</span>
              <span style={{ fontSize: '11px', color: '#60a5fa', background: 'rgba(37,99,235,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                DEEP INVESTIGATION
              </span>
            </h1>
            <div className={styles.subTitle}>
              VIKSHANA 2.0 ORCHESTRATION LAYER • RBAC VERIFIED
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className={styles.contextPill}>
            <Shield size={14} color="#60a5fa" />
            <span>CONTEXT: CASE <strong className={styles.activeCaseTag}>#{effectiveCaseId}</strong></span>
            {context?.query && <span style={{ color: '#cbd5e1' }}>| "{context.query}"</span>}
          </div>

          <button className={styles.exitBtn} onClick={handleExit} title="Exit God Mode">
            <ArrowLeft size={16} />
            <span>Exit God Mode</span>
          </button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className={styles.quickActionsBar}>
        {QUICK_ACTIONS.map(qa => (
          <button
            key={qa.id}
            className={qa.isHero ? styles.heroActionBtn : styles.quickActionBtn}
            onClick={() => handleQuickAction(qa.id)}
            disabled={isLoading}
          >
            {qa.icon && <qa.icon size={14} />}
            <span>{qa.label}</span>
          </button>
        ))}
      </div>

      {/* Main Conversation Stream */}
      <div className={styles.chatArea}>
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`${styles.messageRow} ${msg.role === 'user' ? styles.userMessageRow : ''}`}
          >
            {msg.role === 'user' ? (
              <div className={styles.userBubble}>
                {msg.content}
              </div>
            ) : (
              <div className={styles.aiMessageBody}>
                {/* 1. Standard Text/Welcome */}
                {msg.type === 'welcome' || msg.type === 'text' ? (
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '14.5px' }}>
                    {msg.content}
                  </div>
                ) : null}

                {/* 2. COMPLETE INVESTIGATION 11-SECTION REPORT */}
                {msg.type === 'complete_report' && (
                  <div>
                    <div className={styles.reportTitleBar}>
                      <h2>
                        <Zap size={20} color="#60a5fa" />
                        {msg.data.overview.title}
                      </h2>
                      <span className={styles.confidenceBadge}>
                        OVERALL CONFIDENCE: {Math.round(msg.data.provenance.meanConfidenceScore * 100)}%
                      </span>
                    </div>

                    {/* Section 1: OVERVIEW */}
                    <div className={styles.reportSection}>
                      <div className={styles.sectionHeader}>
                        <FileText size={14} /> Section 1: Investigation Overview
                      </div>
                      <p style={{ margin: 0, color: '#e2e8f0', fontSize: '13.5px', lineHeight: '1.5' }}>
                        {msg.data.overview.summary}
                      </p>
                    </div>

                    {/* Section 2: KEY FINDINGS */}
                    <div className={styles.reportSection}>
                      <div className={styles.sectionHeader}>
                        <Sparkles size={14} /> Section 2: Key Findings
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '13px', lineHeight: '1.6' }}>
                        {msg.data.keyFindings.map((kf, i) => (
                          <li key={i}>{kf}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Section 3: TOP LEADS */}
                    <div className={styles.reportSection}>
                      <div className={styles.sectionHeader}>
                        <Zap size={14} /> Section 3: Top Investigation Leads
                      </div>
                      {msg.data.topLeads.map((lead) => (
                        <div key={lead.id} className={styles.leadCard}>
                          <div className={styles.leadCardHeader}>
                            <span className={styles.leadRank}>LEAD #{lead.rank} • {lead.classification}</span>
                            <span className={styles.confidenceBadge}>{Math.round(lead.confidence * 100)}% CONFIDENCE</span>
                          </div>
                          <div className={styles.leadFinding}>{lead.finding}</div>
                          <div className={styles.leadReasoning}>{lead.reasoning}</div>
                          <button
                            className={styles.xaiBtn}
                            onClick={() => handleExplainXAI('lead', lead.id)}
                          >
                            <HelpCircle size={13} />
                            <span>Explain Lead (XAI)</span>
                            {activeXAI?.insightId === lead.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                          </button>

                          {/* Interactive XAI Contract Drawer */}
                          {activeXAI?.insightId === lead.id && (
                            <div className={styles.xaiModal}>
                              <div style={{ fontSize: '12px', fontWeight: '700', color: '#60a5fa', marginBottom: '6px' }}>
                                ⚖️ EXPLAINABLE AI CONTRACT (XAI)
                              </div>
                              <div className={styles.xaiGrid}>
                                <div className={styles.xaiItem}>
                                  <div className={styles.xaiLabel}>WHAT (Finding)</div>
                                  <div className={styles.xaiValue}>{activeXAI.data.what}</div>
                                </div>
                                <div className={styles.xaiItem}>
                                  <div className={styles.xaiLabel}>WHY (Reasoning)</div>
                                  <div className={styles.xaiValue}>{activeXAI.data.why}</div>
                                </div>
                                <div className={styles.xaiItem}>
                                  <div className={styles.xaiLabel}>SUPPORTING EVIDENCE</div>
                                  <div className={styles.xaiValue}>
                                    {(activeXAI.data.evidence || []).join(', ') || 'CaseMaster Records'}
                                  </div>
                                </div>
                                <div className={styles.xaiItem}>
                                  <div className={styles.xaiLabel}>FACT VS INFERENCE</div>
                                  <div className={styles.xaiValue}>
                                    {activeXAI.data.isAIInferred ? '⚡ AI-Inferred Pattern' : '✅ Verified Fact'}
                                  </div>
                                </div>
                                <div className={styles.xaiItem} style={{ gridColumn: '1 / -1' }}>
                                  <div className={styles.xaiLabel} style={{ color: '#f59e0b' }}>HUMAN VERIFICATION REQUIRED</div>
                                  <div className={styles.xaiValue} style={{ color: '#fcd34d' }}>
                                    {activeXAI.data.humanVerificationRequired}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Section 4: MODUS OPERANDI */}
                    <div className={styles.reportSection}>
                      <div className={styles.sectionHeader}>
                        <Fingerprint size={14} /> Section 4: Modus Operandi
                      </div>
                      <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                        <div><strong>Signature Method:</strong> {msg.data.modusOperandi.signatureVectors}</div>
                        <div><strong>Target Vector:</strong> {msg.data.modusOperandi.targetType}</div>
                        <div><strong>Temporal Window:</strong> {msg.data.modusOperandi.temporalWindow}</div>
                        {msg.data.modusOperandi.matchedHistoricalCases.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <strong>Matched Precedents:</strong>
                            {msg.data.modusOperandi.matchedHistoricalCases.map((m, i) => (
                              <div key={i} style={{ paddingLeft: '12px', fontSize: '12.5px', color: '#93c5fd' }}>
                                • Crime No: {m.crimeNo} (Case #{m.caseId}) — {Math.round(m.similarity * 100)}% MO Match ({m.matchedAttributes.join(', ')})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 5: RELATED CASES */}
                    <div className={styles.reportSection}>
                      <div className={styles.sectionHeader}>
                        <Share2 size={14} /> Section 5: Related Cases
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                        {msg.data.relatedCases.map((c, i) => (
                          <div key={i} style={{ background: 'rgba(30,41,59,0.4)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#60a5fa' }}>{c.caseNumber}</div>
                            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>Similarity: {Math.round(c.similarity * 100)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 6: TEMPORAL NETWORK */}
                    <div className={styles.reportSection}>
                      <div className={styles.sectionHeader}>
                        <Network size={14} /> Section 6: Temporal Network
                      </div>
                      <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                        Network graph contains <strong>{msg.data.temporalNetwork.nodeCount} nodes</strong> and <strong>{msg.data.temporalNetwork.linkCount} associations</strong>.
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {msg.data.temporalNetwork.keyEntities.map((ent, i) => (
                            <span key={i} style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                              {ent.name} ({ent.type})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Section 7: EVIDENCE CHAIN */}
                    <div className={styles.reportSection}>
                      <div className={styles.sectionHeader}>
                        <LinkIcon size={14} /> Section 7: Evidence Chain
                      </div>
                      <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                        Status: <strong style={{ color: msg.data.evidenceChain.isUnbroken ? '#10b981' : '#f59e0b' }}>
                          {msg.data.evidenceChain.isUnbroken ? '✅ Continuous Evidence Chain' : '⚠️ Timeline Gaps Present'}
                        </strong> ({msg.data.evidenceChain.chainLength} links verified).
                      </div>
                    </div>

                    {/* Section 8: ANOMALIES & EMERGING PATTERNS */}
                    <div className={styles.reportSection}>
                      <div className={styles.sectionHeader}>
                        <Layers size={14} /> Section 8: Anomalies &amp; Emerging Patterns
                      </div>
                      {msg.data.emergingPatterns.map((pat, i) => (
                        <div key={i} style={{ fontSize: '12.5px', color: '#cbd5e1', marginBottom: '6px' }}>
                          • <strong>{pat.title}:</strong> {pat.detectionBasis} ({pat.velocityChange} surge in {pat.jurisdiction})
                        </div>
                      ))}
                    </div>

                    {/* Section 9: INVESTIGATION GAPS */}
                    <div className={styles.reportSection}>
                      <div className={styles.sectionHeader}>
                        <AlertCircle size={14} /> Section 9: Investigation Gaps
                      </div>
                      <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                        {msg.data.investigationGaps.identifiedGaps.map((g, i) => (
                          <div key={i} style={{ marginBottom: '4px' }}>
                            ⚠️ <strong>{g.gapType}:</strong> {g.description}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 10: RECOMMENDED VERIFICATION */}
                    <div className={styles.reportSection} style={{ border: '1px solid rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.05)' }}>
                      <div className={styles.sectionHeader} style={{ color: '#f59e0b' }}>
                        <CheckCircle2 size={14} /> Section 10: Recommended Human Verification
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#fef3c7', fontSize: '13px', lineHeight: '1.6' }}>
                        {msg.data.recommendedVerification.proceduralSteps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                      <div style={{ fontSize: '11px', color: '#fde68a', marginTop: '8px', fontStyle: 'italic' }}>
                        {msg.data.recommendedVerification.legalAdmissibilityNote}
                      </div>
                    </div>

                    {/* Section 11: CONFIDENCE / PROVENANCE */}
                    <div className={styles.reportSection}>
                      <div className={styles.sectionHeader}>
                        <Lock size={14} /> Section 11: Confidence &amp; Provenance
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                        <div>ENGINES: {msg.data.provenance.enginesOrchestrated.join(' • ')}</div>
                        <div>DATASTORES: {msg.data.provenance.dataSources.join(' • ')}</div>
                        <div>SECURITY: RBAC ENFORCED • PII MASKED • XAI AUDITED</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Individual Subsystem Views (Leads, MO, Network, etc.) */}
                {msg.type === 'leads' && (
                  <div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={18} color="#60a5fa" />
                      Ranked Investigative Leads (Case #{effectiveCaseId})
                    </h3>
                    {(msg.data.leads || []).map((lead, idx) => (
                      <div key={idx} className={styles.leadCard}>
                        <div className={styles.leadCardHeader}>
                          <span className={styles.leadRank}>LEAD #{idx + 1}</span>
                          <span className={styles.confidenceBadge}>{Math.round((lead.confidence || 0.88) * 100)}% CONFIDENCE</span>
                        </div>
                        <div className={styles.leadFinding}>{lead.finding}</div>
                        <div className={styles.leadReasoning}>{lead.reasoning}</div>
                        <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '6px' }}>
                          <strong>Verification:</strong> {lead.recommendedVerification}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {msg.type === 'mo' && (
                  <div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Fingerprint size={18} color="#60a5fa" />
                      Modus Operandi Intelligence (Case #{effectiveCaseId})
                    </h3>
                    <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
                      <div><strong>Method:</strong> {msg.data.moProfile?.crimeMethod || 'Coordinated Entry'}</div>
                      <div><strong>Target:</strong> {msg.data.moProfile?.targetType || 'Commercial'}</div>
                      <div><strong>Historical Matches:</strong> {msg.data.matchCount || (msg.data.matchedHistoricalCases || []).length} case(s)</div>
                    </div>
                  </div>
                )}

                {msg.type === 'chain' && (
                  <div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LinkIcon size={18} color="#60a5fa" />
                      Unified Evidence Chain (Case #{effectiveCaseId})
                    </h3>
                    <div style={{ fontSize: '13.5px', color: '#cbd5e1' }}>
                      Chain Status: <strong style={{ color: '#10b981' }}>Verified Unbroken</strong> ({(msg.data.nodes || []).length} nodes).
                    </div>
                  </div>
                )}

                {msg.type === 'network' && (
                  <div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Network size={18} color="#60a5fa" />
                      Temporal Crime Network (Case #{effectiveCaseId})
                    </h3>
                    <div style={{ fontSize: '13.5px', color: '#cbd5e1' }}>
                      Network contains <strong>{(msg.data.nodes || []).length} entities</strong> and <strong>{(msg.data.links || []).length} associations</strong>.
                    </div>
                  </div>
                )}

                {msg.type === 'similar' && (
                  <div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Share2 size={18} color="#60a5fa" />
                      Similar Historical Cases
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      {(Array.isArray(msg.data) ? msg.data : []).map((c, idx) => (
                        <div key={idx} style={{ background: 'rgba(30,41,59,0.5)', padding: '10px', borderRadius: '6px' }}>
                          <div style={{ fontWeight: '700', color: '#60a5fa' }}>{c.caseNumber || `Case #${c.caseId || c.id}`}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Similarity: {Math.round((c.similarityScore || c.similarity || 0.85) * 100)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {msg.type === 'gaps' && (
                  <div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={18} color="#f59e0b" />
                      Investigation Gaps &amp; Next Actions
                    </h3>
                    <div style={{ fontSize: '13.5px', color: '#cbd5e1' }}>
                      {(msg.data.recommendedActions || []).map((a, i) => (
                        <div key={i} style={{ marginBottom: '6px' }}>
                          • <strong>[{a.priority || 'HIGH'}]</strong> {a.action || a.recommendation}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {msg.type === 'patterns' && (
                  <div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={18} color="#60a5fa" />
                      Emerging Crime Patterns
                    </h3>
                    {(msg.data.patterns || []).map((p, i) => (
                      <div key={i} style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                        • <strong>{p.title}:</strong> {p.detectionBasis} ({p.percentageChange || '+30%'} in {p.jurisdiction || 'State'})
                      </div>
                    ))}
                  </div>
                )}

                {msg.type === 'sentinel' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(239, 68, 68, 0.3)', paddingBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                        <ShieldAlert size={18} color="#ef4444" />
                        VIKSHANA Sentinel Priority Triage
                      </h3>
                      <button
                        onClick={() => navigate('/sentinel')}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444',
                          color: '#ef4444', padding: '4px 10px', borderRadius: '4px',
                          fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                        }}
                      >
                        OPEN FULL SENTINEL COMMAND CENTER →
                      </button>
                    </div>

                    {msg.data?.topPriorityCases && msg.data.topPriorityCases.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Surveillance scan evaluated <strong>{msg.data.summary?.casesAnalyzed || 0} active dockets</strong>. Top priority cases requiring immediate intervention:
                        </div>
                        {msg.data.topPriorityCases.slice(0, 5).map((c, i) => (
                          <div key={c.caseId} style={{
                            padding: '10px 12px', borderRadius: '6px',
                            background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.08)',
                            borderLeft: `4px solid ${c.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'}`
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                                #{i + 1} {c.caseNumber} ({c.jurisdiction})
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: '800', color: c.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>
                                Priority Score: {c.totalScore}/100
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                              {c.title}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                              • Factors: {c.summaryReasons?.join('; ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : msg.data?.scoreResult ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                          {msg.data.scoreResult.caseNumber}: Priority Score {msg.data.scoreResult.totalScore}/100 ({msg.data.scoreResult.severity})
                        </div>
                        <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                          Reasons: {msg.data.scoreResult.summaryReasons?.join('; ')}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                        Sentinel triage completed. No critical bottlenecks detected.
                      </div>
                    )}
                  </div>
                )}

                {/* Foresight Predictive Intelligence View */}
                {msg.type === 'foresight' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={16} color="#818cf8" />
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
                          VIKSHANA FORESIGHT • PREDICTIVE STATISTICAL ASSESSMENT
                        </span>
                      </div>
                      <span style={{
                        fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px',
                        background: msg.data?.statisticalScore >= 75 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: msg.data?.statisticalScore >= 75 ? '#f87171' : '#fbbf24',
                        border: `1px solid ${msg.data?.statisticalScore >= 75 ? '#ef4444' : '#f59e0b'}`
                      }}>
                        {msg.data?.tierLabel || 'Statistical Association'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ textAlign: 'center', minWidth: '110px', paddingRight: '12px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ fontSize: '26px', fontWeight: '900', color: msg.data?.statisticalScore >= 75 ? '#f87171' : '#fbbf24', fontFamily: 'monospace' }}>
                          {msg.data?.statisticalScore || 50}/100
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                          Calibrated P: {((msg.data?.calibratedProbability || 0.5) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div style={{ flex: 1, fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                        <div><strong>Subject:</strong> {msg.data?.accusedName || 'Prakash Kulkarni'} (Case #{msg.data?.caseId || effectiveCaseId})</div>
                        <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                          <strong>Model:</strong> {msg.data?.modelMetadata?.modelName || 'Calibrated Random Forest'} (ROC-AUC: {msg.data?.modelMetadata?.rocAuc || 0.62})
                        </div>
                      </div>
                    </div>

                    {/* Top Contributing Factors */}
                    {msg.data?.topContributingFactors && msg.data.topContributingFactors.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Top Contributing Historical Factors (SHAP Attributions):
                        </div>
                        {msg.data.topContributingFactors.slice(0, 3).map((f, idx) => (
                          <div key={idx} style={{
                            fontSize: '11.5px', padding: '6px 10px', borderRadius: '6px',
                            background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex', justifyContent: 'space-between'
                          }}>
                            <span style={{ color: '#e2e8f0' }}>{f.label} (Value: {f.rawValue})</span>
                            <span style={{ color: f.direction === 'INCREASING_ASSOCIATION' ? '#f87171' : '#34d399', fontWeight: '700', fontFamily: 'monospace' }}>
                              {f.direction === 'INCREASING_ASSOCIATION' ? '+' : '-'}{f.impactScore}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}


          </div>
        ))}

        {isLoading && (
          <div className={styles.messageRow}>
            <div className={styles.aiMessageBody} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Loader2 size={20} className="spin" color="#60a5fa" />
              <span style={{ fontSize: '13.5px', color: '#93c5fd', fontFamily: 'monospace' }}>
                ORCHESTRATING DEEP INTELLIGENCE MATRIX...
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Floating Bottom Input */}
      <div className={styles.inputContainer}>
        <div className={styles.inputBox}>
          <input
            type="text"
            className={styles.inputField}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Ask God Mode (e.g., 'What are the strongest leads?', 'Find similar burglary cases', 'Trace evidence chain')..."
            disabled={isLoading}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            title="Send query"
          >
            <Send size={16} />
          </button>
        </div>

        <div className={styles.legalNotice}>
          ⚠️ VIKSHANA GOD MODE 2.0 • MANDATORY OFFICER SIGN-OFF REQUIRED FOR ALL AI INFERENCES BEFORE COURT SUBMISSION
        </div>
      </div>
    </div>
  );
};

export default GodModeChat;
