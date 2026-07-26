import React, { useState, useEffect } from 'react';
import { 
    Activity, ShieldAlert, Sparkles, Navigation, 
    Clock, HeartPulse, BrainCircuit, Target, 
    UserX, Zap, AlertTriangle
} from 'lucide-react';
import api from '../../services/api';

const HackathonAIPanel = ({ caseId }) => {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState(null);

    useEffect(() => {
        if (!caseId) return;
        setLoading(true);

        // Fetch data from existing Evidence Intelligence Workspace endpoint
        api.get(`/evidence-intelligence/workspace?caseId=${caseId}`)
            .then(res => {
                const data = res.data?.data || {};
                const { unified_evidence, correlations = [], gaps = [], recommendations = [] } = data;
                
                const summary = unified_evidence?.summary || {};
                const evidenceList = unified_evidence?.evidence || [];
                
                // 1. Investigation Progress Score (0-100%)
                const progress = summary.completeness || 0;
                
                // 2. Missing Evidence Detector
                const missingEvidence = gaps.length > 0 ? gaps[0].missing_item : 'No critical gaps detected';
                
                // 3. AI Risk Prediction
                const riskLevel = summary.quality === 'Low' || gaps.length > 2 ? 'High Risk' : (summary.quality === 'Medium' ? 'Moderate Risk' : 'Low Risk');
                const riskColor = riskLevel === 'High Risk' ? '#ef4444' : riskLevel === 'Moderate Risk' ? '#f59e0b' : '#10b981';

                // 4. Next Best Investigation Step
                const nextStep = recommendations.length > 0 ? recommendations[0].action : 'Review current evidence';

                // 5. AI Generated Timeline
                const timelineStatus = evidenceList.length > 0 ? `${evidenceList.length} Timeline Events Mapped` : 'Insufficient Data';

                // 6. Investigation Health Meter
                const healthScore = Math.max(0, 100 - (gaps.length * 15));
                const healthStatus = healthScore > 75 ? 'Optimal' : healthScore > 40 ? 'Fair' : 'Critical';

                // 7. Case Complexity Score
                const complexity = correlations.length > 3 ? 'High Complexity' : (correlations.length > 0 ? 'Medium Complexity' : 'Routine Case');

                // 8. Suspect Priority Ranking
                const accusedCount = evidenceList.filter(e => e.source === 'Accused').length;
                const priorityRanking = accusedCount > 0 ? `Tracking ${accusedCount} Prime Suspect(s)` : 'No prime suspects identified';

                // 9. Victim Vulnerability Analysis
                const victims = evidenceList.filter(e => e.source === 'Victim');
                let vulnerability = 'Standard Profile';
                if (victims.some(v => v.description && ((v.description.includes('Age: 1') || v.description.includes('Age: 2')) && v.description.match(/Age: [0-1][0-7]/)))) {
                    vulnerability = 'High Vulnerability (Minor)';
                } else if (victims.length > 0) {
                    vulnerability = `${victims.length} Victim(s) Analyzed`;
                }

                // 10. AI Confidence Meter
                const confidence = Math.min(100, (correlations.length * 10) + (progress / 2) + 40).toFixed(1);

                setMetrics({
                    progress, missingEvidence, riskLevel, riskColor, nextStep,
                    timelineStatus, healthStatus, complexity, priorityRanking,
                    vulnerability, confidence
                });
                setLoading(false);
            })
            .catch(err => {
                console.debug('[HackathonAIPanel] Error fetching metrics:', err);
                setLoading(false);
            });
    }, [caseId]);

    if (loading) {
        return (
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Sparkles className="spin" size={24} style={{ marginBottom: '10px', color: 'var(--accent-primary)' }} />
                <div>Computing AI Investigation Metrics...</div>
            </div>
        );
    }

    if (!metrics) return null;

    const MetricCard = ({ title, value, icon: Icon, color, subtext }) => (
        <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                    padding: '8px', borderRadius: '8px', 
                    background: `linear-gradient(135deg, ${color}22, ${color}11)`,
                    color: color
                }}>
                    <Icon size={20} />
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>{title}</div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {value}
            </div>
            {subtext && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{subtext}</div>}
            
            {/* Background Glow */}
            <div style={{
                position: 'absolute', top: '-20px', right: '-20px', width: '60px', height: '60px',
                background: color, filter: 'blur(40px)', opacity: 0.15, borderRadius: '50%'
            }} />
        </div>
    );

    return (
        <div className="glass-panel" style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', padding: '8px', borderRadius: '8px', color: '#fff' }}>
                    <BrainCircuit size={24} />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        AI Investigation Intelligence
                    </h2>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Real-time hackathon metrics computed dynamically from evidence nodes.
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <MetricCard 
                    title="Investigation Progress" 
                    value={`${metrics.progress}%`} 
                    icon={Activity} 
                    color="#3b82f6" 
                    subtext="Overall case completeness" 
                />
                <MetricCard 
                    title="AI Risk Prediction" 
                    value={metrics.riskLevel} 
                    icon={AlertTriangle} 
                    color={metrics.riskColor} 
                    subtext="Based on evidence gaps" 
                />
                <MetricCard 
                    title="Missing Evidence" 
                    value={metrics.missingEvidence} 
                    icon={ShieldAlert} 
                    color="#ef4444" 
                    subtext="Critical blindspots" 
                />
                <MetricCard 
                    title="Next Best Step" 
                    value={metrics.nextStep} 
                    icon={Navigation} 
                    color="#10b981" 
                    subtext="AI recommended action" 
                />
                <MetricCard 
                    title="Health Meter" 
                    value={metrics.healthStatus} 
                    icon={HeartPulse} 
                    color="#8b5cf6" 
                    subtext="Case viability score" 
                />
                <MetricCard 
                    title="Case Complexity" 
                    value={metrics.complexity} 
                    icon={Target} 
                    color="#f59e0b" 
                    subtext="Node correlation density" 
                />
                <MetricCard 
                    title="Suspect Priority" 
                    value={metrics.priorityRanking} 
                    icon={UserX} 
                    color="#ef4444" 
                    subtext="Active persons of interest" 
                />
                <MetricCard 
                    title="Victim Vulnerability" 
                    value={metrics.vulnerability} 
                    icon={Sparkles} 
                    color="#ec4899" 
                    subtext="Demographic risk analysis" 
                />
                <MetricCard 
                    title="Timeline Status" 
                    value={metrics.timelineStatus} 
                    icon={Clock} 
                    color="#06b6d4" 
                    subtext="Automated chronology" 
                />
                <MetricCard 
                    title="AI Confidence" 
                    value={`${metrics.confidence}%`} 
                    icon={Zap} 
                    color="#10b981" 
                    subtext="Correlation certainty" 
                />
            </div>
        </div>
    );
};

export default HackathonAIPanel;
