import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, AlertTriangle, FileSearch, Scale, Target, 
  FileText, MessageSquare, Radar, Crosshair, HelpCircle, Star, Search
} from 'lucide-react';
import { Radar as RechartsRadar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import styles from './AdvancedIntelligence.module.css';
import CaseCompletenessCard from './CaseCompletenessCard';

const ExplainAIWrapper = ({ explainData, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!explainData) return <>{children}</>;
  return (
    <div className={styles.explainWrapper}>
      {children}
      <button className={styles.explainBtn} onClick={() => setIsOpen(!isOpen)}>
        <BrainCircuit size={14} /> Explain AI
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className={styles.explainPopover}
          >
            <div className={styles.explainTitle}>AI Reasoning Context</div>
            <div className={styles.explainBody}>{explainData.reasoning}</div>
            <div className={styles.evidenceTags}>
              {explainData.evidenceUsed?.map((e, i) => <span key={i} className={styles.evidenceTag}>{e}</span>)}
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
              Confidence: {explainData.confidence}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CircularGauge = ({ value, label, color = "#3b82f6" }) => {
  const circumference = 2 * Math.PI * 36;
  const strokeDasharray = `${(value / 100) * circumference} ${circumference}`;
  return (
    <div className={styles.gaugeWrap}>
      <div className={styles.circle}>
        <svg viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" className={styles.circleBg} />
          <circle cx="40" cy="40" r="36" className={styles.circleFill} style={{ stroke: color, strokeDasharray }} />
        </svg>
        <div className={styles.circleText}>{value}%</div>
      </div>
      <div className={styles.gaugeLabel}>{label}</div>
    </div>
  );
};

const AdvancedIntelligenceHub = ({ caseId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (caseId) fetchData();
  }, [caseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/advanced-intelligence/full-scan/${caseId}`);
      if (res.data.success) setData(res.data.data);
      else throw new Error('Failed to load intelligence');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className={styles.hubContainer} style={{ alignItems: 'center', padding: '40px' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
        <BrainCircuit size={48} color="#3b82f6" />
      </motion.div>
      <p style={{ marginTop: 16, color: '#64748b', fontWeight: 600 }}>Running Deep AI Investigation Scan...</p>
    </div>
  );

  if (error || !data) return null;

  return (
    <div className={styles.hubContainer}>
      <div className={styles.hubHeader}>
        <div className={styles.hubTitle}>
          <BrainCircuit color="#3b82f6" size={28} />
          Enterprise Intelligence Core
        </div>
        <div className={styles.badge}>Live Scan Complete</div>
      </div>

      <div className={styles.grid}>
        
        {/* Case Completeness Metric */}
        <motion.div className={styles.col4} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <CaseCompletenessCard caseId={caseId} />
        </motion.div>

        {/* Hypotheses */}
        <motion.div className={`${styles.card} ${styles.col6}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}><Target size={18} color="#8b5cf6" /> AI Investigation Hypotheses</div>
          </div>
          <ExplainAIWrapper explainData={data.explainAI?.hypotheses}>
            <div className={styles.list}>
              {data.hypotheses?.map((h, i) => (
                <div key={i} className={styles.listItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong style={{ color: '#1e293b' }}>Hypothesis #{i+1}</strong>
                    <span className={styles.priorityTag} style={{ background: '#dbeafe', color: '#2563eb' }}>{h.confidence}% Conf</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', margin: '0 0 8px 0' }}>{h.summary}</p>
                  <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Action: {h.recommendedAction}</div>
                </div>
              ))}
            </div>
          </ExplainAIWrapper>
        </motion.div>

        {/* Action Recommendations */}
        <motion.div className={`${styles.card} ${styles.col6}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}><Crosshair size={18} color="#ef4444" /> Action Recommendation Engine</div>
          </div>
          <div className={styles.list}>
            {data.recommendations?.map((r, i) => (
              <div key={i} className={styles.listItem} style={{ borderLeft: `4px solid ${r.priority === 1 ? '#ef4444' : '#f59e0b'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ color: '#1e293b', fontSize: 14 }}>{r.action}</strong>
                  <span className={`${styles.priorityTag} ${r.priority === 1 ? styles['p-High'] : styles['p-Medium']}`}>P{r.priority}</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{r.why}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Court Readiness */}
        <motion.div className={`${styles.card} ${styles.col4}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}><Scale size={18} color="#10b981" /> Court Readiness Engine</div>
          </div>
          <ExplainAIWrapper explainData={data.explainAI?.courtReadiness}>
            <div className={styles.readinessGrid} style={{ marginTop: 16 }}>
              <CircularGauge value={data.courtReadiness?.evidence || 0} label="Evidence" color="#3b82f6" />
              <CircularGauge value={data.courtReadiness?.witness || 0} label="Witness" color="#f59e0b" />
              <CircularGauge value={data.courtReadiness?.legal || 0} label="Legal" color="#10b981" />
              <CircularGauge value={data.courtReadiness?.documentation || 0} label="Docs" color="#8b5cf6" />
            </div>
          </ExplainAIWrapper>
        </motion.div>

        {/* Readiness Radar */}
        <motion.div className={`${styles.card} ${styles.col4}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}><Radar size={18} color="#06b6d4" /> Readiness Radar</div>
          </div>
          <div style={{ height: 220, width: '100%' }}>
            <ResponsiveContainer>
              <RadarChart data={data.readinessRadar || []} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <RechartsRadar name="Case" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Crime Signature */}
        <motion.div className={`${styles.card} ${styles.col4}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}><FileSearch size={18} color="#f59e0b" /> Crime Signature Engine</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 16 }}>
            {Object.entries(data.crimeSignature || {}).map(([key, val], i) => (
              <div key={i} className={styles.starRow}>
                <span className={styles.starLabel} style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                <div className={styles.stars}>
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} size={14} fill={star <= val ? '#f59e0b' : 'none'} color={star <= val ? '#f59e0b' : '#cbd5e1'} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contradictions & Gaps */}
        <motion.div className={`${styles.card} ${styles.col6}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}><AlertTriangle size={18} color="#ef4444" /> Contradiction Detector</div>
          </div>
          <div className={styles.list}>
            {(data.contradictions || []).length === 0 ? (
              <div style={{ color: '#10b981', fontSize: 13, fontWeight: 600 }}>✓ No contradictions detected in current context.</div>
            ) : (
              data.contradictions.map((c, i) => (
                <div key={i} className={styles.listItem} style={{ borderLeft: '4px solid #ef4444' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>{c.type || 'Contradiction Detected'}</span>
                    <span className={styles.priorityTag} style={{ background: '#fee2e2', color: '#ef4444' }}>{c.severity}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>{c.explanation || c.description}</div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                    {c.source_a && c.source_b ? (
                        <>Conflict between <span style={{color: '#3b82f6'}}>{c.source_a}</span> and <span style={{color: '#3b82f6'}}>{c.source_b}</span></>
                    ) : (
                        <>Action: {c.recommendation}</>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div className={`${styles.card} ${styles.col6}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}><Search size={18} color="#3b82f6" /> Missing Evidence Advisor</div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600 }}>
              <span style={{ color: '#475569' }}>Evidence Gap Score</span>
              <span style={{ color: '#ef4444' }}>{data.missingEvidence?.score || 0}% Missing</span>
            </div>
            <div className={styles.progressTrack}>
              <motion.div className={styles.progressFill} style={{ background: '#ef4444' }} initial={{ width: 0 }} animate={{ width: `${data.missingEvidence?.score || 0}%` }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {data.missingEvidence?.missingItems?.map((item, i) => (
                <div key={i} style={{ border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: 4, fontSize: 12, color: '#475569', background: '#f8fafc' }}>
                  □ {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Officer Brief & Questions */}
        <motion.div className={`${styles.card} ${styles.col4}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}><FileText size={18} color="#6366f1" /> AI Officer Brief</div>
          </div>
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>{data.officerBrief?.title}</h4>
            <div style={{ fontSize: 13, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Status:</span> <strong>{data.officerBrief?.status}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Risk:</span> <strong style={{ color: data.officerBrief?.highRisk ? '#ef4444' : '#10b981' }}>{data.officerBrief?.highRisk ? 'HIGH' : 'NORMAL'}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Victims/Suspects:</span> <strong>{data.officerBrief?.victimsCount} / {data.officerBrief?.suspectsCount}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Expected Duration:</span> <strong>{data.officerBrief?.expectedDuration}</strong></div>
              <div style={{ marginTop: 8, color: '#3b82f6', fontWeight: 600 }}>Next: {data.officerBrief?.recommendedAction}</div>
            </div>
          </div>
        </motion.div>

        <motion.div className={`${styles.card} ${styles.col8}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}><HelpCircle size={18} color="#8b5cf6" /> AI Interview Question Generator</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {Object.entries(data.interviewQuestions || {}).map(([category, questions], i) => (
              <div key={i}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>{category} Questions</div>
                <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {questions.map((q, j) => <li key={j}>{q}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default AdvancedIntelligenceHub;
