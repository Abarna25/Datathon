import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, Zap, RefreshCw, AlertTriangle, CheckCircle2, 
  Clock, ArrowUpRight, Search, Filter, Layers, Database, 
  Activity, CheckCircle, XCircle, Info, ExternalLink, Cpu, 
  Flame, Lock, ShieldCheck, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import sentinelService from '../services/sentinelService';
import SentinelActionCard from '../components/sentinel/SentinelActionCard';
import SentinelPriorityBreakdown from '../components/sentinel/SentinelPriorityBreakdown';
import { useAppContext } from '../context/AppContext';
import { useGodMode } from '../context/GodModeContext';

export default function SentinelDashboard() {
  const navigate = useNavigate();
  const { setActiveCaseId } = useAppContext();
  const { activateGodMode } = useGodMode();

  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('priority_cases'); // 'priority_cases' | 'actions' | 'deltas' | 'engine_health'
  const [selectedCaseTriage, setSelectedCaseTriage] = useState(null);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await sentinelService.getDashboard();
      if (res.success) {
        setDashboardData(res);
        if (res.topPriorityCases && res.topPriorityCases.length > 0) {
          setSelectedCaseTriage(res.topPriorityCases[0]);
        }
      }
    } catch (err) {
      console.error('[SentinelDashboard] Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleTriggerScan = async () => {
    try {
      setScanning(true);
      const res = await sentinelService.triggerScan(150);
      if (res.success) {
        setDashboardData(res);
        if (res.topPriorityCases && res.topPriorityCases.length > 0) {
          setSelectedCaseTriage(res.topPriorityCases[0]);
        }
      }
    } catch (err) {
      console.error('[SentinelDashboard] Error running scan:', err);
    } finally {
      setScanning(false);
    }
  };

  const handleDecision = async (actionId, decision, reason) => {
    try {
      setIsProcessingAction(true);
      const res = await sentinelService.recordDecision(actionId, decision, reason);
      if (res.success) {
        // Refresh dashboard data to reflect approved/dismissed status
        await fetchDashboard();
      }
    } catch (err) {
      console.error('[SentinelDashboard] Decision error:', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleCaseSelect = (caseItem) => {
    setSelectedCaseTriage(caseItem);
  };

  const handleOpenWorkspace = (caseId) => {
    if (setActiveCaseId) setActiveCaseId(String(caseId));
    navigate(`/investigate/${caseId}`);
  };

  if (loading && !dashboardData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
        <RefreshCw className="spin" size={36} color="var(--accent-primary)" />
        <div style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '600' }}>
          Synchronizing Sentinel Surveillance Engine...
        </div>
      </div>
    );
  }

  const { summary = {}, topPriorityCases = [], activeActions = [], deltas = [] } = dashboardData || {};

  const filteredActions = activeActions.filter(a => {
    if (actionFilter === 'CRITICAL') return a.severity === 'CRITICAL';
    if (actionFilter === 'HIGH') return a.severity === 'HIGH';
    if (actionFilter === 'AWAITING_REVIEW') return a.status === 'AWAITING_REVIEW';
    if (actionFilter === 'APPROVED') return a.status === 'APPROVED';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '24px', borderRadius: '12px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
        borderLeft: '5px solid #ef4444'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={28} color="#ef4444" />
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
              VIKSHANA SENTINEL
            </h1>
            <span style={{
              fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)'
            }}>
              AUTONOMOUS CASE TRIAGE & ACTION AGENT
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Continuously evaluates active case dockets, cross-correlates multi-jurisdiction suspects, detects procedural gaps, and recommends priority human actions.
          </p>
        </div>

        {/* Scan Trigger & God Mode Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => activateGodMode({
              source: 'sentinel',
              query: 'Show cases needing attention today and explain priority breakdown',
              caseId: selectedCaseTriage?.caseId || '101'
            })}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              background: 'linear-gradient(135deg, #1e3a8a, #1d4ed8)', border: '1px solid #3b82f6',
              borderRadius: '8px', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: 'pointer'
            }}
          >
            <Zap size={14} color="#fbbf24" fill="#fbbf24" />
            <span>GOD MODE QUERY</span>
          </button>

          <button
            onClick={handleTriggerScan}
            disabled={scanning}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px',
              background: 'var(--accent-primary)', border: 'none', borderRadius: '8px',
              color: '#fff', fontWeight: '700', fontSize: '13px', cursor: scanning ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={15} className={scanning ? 'spin' : ''} />
            <span>{scanning ? 'Triage Scan in Progress...' : 'Run Autonomous Scan'}</span>
          </button>
        </div>
      </div>

      {/* Triage Summary Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700' }}>Cases Monitored</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{summary.casesAnalyzed || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Active state dockets</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#ef4444', fontWeight: '700' }}>Critical Priority</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>{summary.criticalCount || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Requires immediate review</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#f59e0b', fontWeight: '700' }}>High Priority</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#f59e0b', marginTop: '4px' }}>{summary.highPriorityCount || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Elevated investigative risk</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#3b82f6', fontWeight: '700' }}>Actions Awaiting</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#3b82f6', marginTop: '4px' }}>{summary.actionsAwaitingReview || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Human sign-off required</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700' }}>Investigation Gaps</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#dc2626', marginTop: '4px' }}>{summary.totalGapsIdentified || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Procedural anomalies flagged</div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700' }}>Pattern Surges</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>{summary.emergingPatternsCount || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Precinct cluster alerts</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('priority_cases')}
          style={{
            background: activeTab === 'priority_cases' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: 'none', borderBottom: activeTab === 'priority_cases' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'priority_cases' ? '#3b82f6' : 'var(--text-secondary)',
            padding: '8px 16px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Flame size={16} color="#ef4444" />
          <span>Top Priority Cases ({topPriorityCases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          style={{
            background: activeTab === 'actions' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: 'none', borderBottom: activeTab === 'actions' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'actions' ? '#3b82f6' : 'var(--text-secondary)',
            padding: '8px 16px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Zap size={16} color="#f59e0b" />
          <span>Action Queue ({activeActions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('deltas')}
          style={{
            background: activeTab === 'deltas' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: 'none', borderBottom: activeTab === 'deltas' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'deltas' ? '#3b82f6' : 'var(--text-secondary)',
            padding: '8px 16px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Activity size={16} color="#06b6d4" />
          <span>Recent Changes & Signals ({deltas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('engine_health')}
          style={{
            background: activeTab === 'engine_health' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: 'none', borderBottom: activeTab === 'engine_health' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'engine_health' ? '#3b82f6' : 'var(--text-secondary)',
            padding: '8px 16px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <Cpu size={16} color="#10b981" />
          <span>Surveillance Engine Health</span>
        </button>
      </div>

      {/* TAB 1: TOP PRIORITY CASES */}
      {activeTab === 'priority_cases' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(400px, 1.3fr)', gap: '20px' }}>
          
          {/* Left Column: Ranked Case List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', paddingLeft: '4px' }}>
              Top Cases Requiring Attention Today
            </div>

            {topPriorityCases.map((caseItem, idx) => {
              const isSelected = selectedCaseTriage?.caseId === caseItem.caseId;
              const severityColor = caseItem.severity === 'CRITICAL' ? '#ef4444' : caseItem.severity === 'HIGH' ? '#f59e0b' : '#3b82f6';

              return (
                <div
                  key={caseItem.caseId}
                  onClick={() => handleCaseSelect(caseItem)}
                  className="glass-panel"
                  style={{
                    padding: '16px', borderRadius: '8px', cursor: 'pointer',
                    borderLeft: `4px solid ${severityColor}`,
                    background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'rgba(15, 23, 42, 0.65)',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)' }}>#{idx + 1}</span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{caseItem.caseNumber}</span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: `${severityColor}22`, color: severityColor, fontWeight: '800' }}>
                        {caseItem.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: severityColor }}>
                      {caseItem.totalScore}<span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/100</span>
                    </div>
                  </div>

                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {caseItem.title}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>{caseItem.jurisdiction} • {caseItem.category}</span>
                    <span style={{ color: caseItem.daysSinceActivity > 30 ? '#ef4444' : 'var(--text-muted)' }}>
                      {caseItem.daysSinceActivity}d inactive
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Case Deep Triage & Score Breakdown */}
          {selectedCaseTriage ? (
            <div className="glass-panel" style={{ padding: '24px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Case Triage Intelligence Dossier
                  </div>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {selectedCaseTriage.caseNumber}
                  </h3>
                </div>

                <button
                  onClick={() => handleOpenWorkspace(selectedCaseTriage.caseId)}
                  style={{
                    background: 'var(--accent-primary)', border: 'none', color: '#fff',
                    padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <span>OPEN FULL WORKSPACE</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Priority Rubric Breakdown */}
              <SentinelPriorityBreakdown
                breakdown={selectedCaseTriage.breakdown}
                totalScore={selectedCaseTriage.totalScore}
                severity={selectedCaseTriage.severity}
                evidenceSources={selectedCaseTriage.evidenceSources}
              />

              {/* Recommended Actions for this Case */}
              {selectedCaseTriage.actions && selectedCaseTriage.actions.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Active Sentinel Action Items ({selectedCaseTriage.actions.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedCaseTriage.actions.map(action => (
                      <SentinelActionCard
                        key={action.actionId}
                        action={action}
                        onDecision={handleDecision}
                        isProcessing={isProcessingAction}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a case on the left to view detailed multi-vector scoring.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTION QUEUE */}
      {activeTab === 'actions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Action Filter Controls */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginRight: '4px' }}>Filter:</span>
            {['ALL', 'AWAITING_REVIEW', 'CRITICAL', 'HIGH', 'APPROVED'].map(f => (
              <button
                key={f}
                onClick={() => setActionFilter(f)}
                style={{
                  background: actionFilter === f ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.04)',
                  border: actionFilter === f ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                  color: actionFilter === f ? '#3b82f6' : 'var(--text-secondary)',
                  padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                }}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Actions List */}
          {filteredActions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredActions.map(action => (
                <SentinelActionCard
                  key={action.actionId}
                  action={action}
                  onDecision={handleDecision}
                  isProcessing={isProcessingAction}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No action items matching the selected filter.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RECENT DELTAS & SIGNALS */}
      {activeTab === 'deltas' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '10px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)' }}>
            Surveillance Deltas & Intelligence Signals
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Sentinel continuously monitors state records and captures delta variations between consecutive scans.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {deltas.map((d, i) => (
              <div key={i} style={{
                padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '12px', alignItems: 'flex-start'
              }}>
                <Activity size={18} color="#06b6d4" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {d.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {d.description}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    {new Date(d.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SURVEILLANCE ENGINE HEALTH */}
      {activeTab === 'engine_health' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '10px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)' }}>
            7 Core Reasoning Engines Synchronization Status
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {[
              { name: 'Investigation Reasoning', id: 'investigationReasoning', desc: 'Cross-case suspect & multi-docket links' },
              { name: 'Modus Operandi Intelligence', id: 'moIntelligence', desc: 'Crime signature & syndicate matching' },
              { name: 'Temporal Crime Network', id: 'temporalNetwork', desc: 'Time-bounded multi-hop graph exploration' },
              { name: 'Emerging Crime Patterns', id: 'emergingPatterns', desc: 'Statistical registration velocity surges' },
              { name: 'Unified Evidence Chain', id: 'evidenceChain', desc: 'Multi-modal custody linking & SHA-256' },
              { name: 'Investigation Gap Detection', id: 'gapDetection', desc: 'Statutory compliance & procedural audit' },
              { name: 'Similar Cases Intelligence', id: 'similarCases', desc: 'Multi-vector narrative & location matching' }
            ].map(eng => {
              const status = summary.engineHealth?.[eng.id] || 'HEALTHY';
              const isHealthy = status === 'HEALTHY';

              return (
                <div key={eng.id} style={{
                  padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)',
                  border: isHealthy ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{eng.name}</span>
                    <span style={{
                      fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px',
                      background: isHealthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: isHealthy ? '#10b981' : '#ef4444'
                    }}>
                      {status}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {eng.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
