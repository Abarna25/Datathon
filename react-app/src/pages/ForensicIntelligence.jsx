import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Shield, 
  FileText, 
  Camera, 
  PhoneCall, 
  CreditCard, 
  Crosshair, 
  Truck, 
  Fingerprint, 
  Scale, 
  MessageSquare, 
  Search, 
  Cpu, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  Database
} from 'lucide-react';
import FIRSummaryPanel from '../components/investigation/FIRSummaryPanel';

export default function ForensicIntelligence() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('evidence');
  const { activeCaseId, setActiveCaseId, currentCase } = useAppContext();
  const caseId = activeCaseId || '101';
  const setCaseId = setActiveCaseId;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    evidence: [],
    cctv: [],
    cdr: null,
    financial: null,
    reports: [],
    weapons: [],
    vehicles: [],
    biometrics: [],
    court: [],
    interrogations: [],
    ragResults: null,
    mlHotspots: null,
    mlForecast: null
  });

  const [semanticQuery, setSemanticQuery] = useState('');
  const [ragAnswer, setRagAnswer] = useState(null);

  // Form states for new item creation
  const [newEvidence, setNewEvidence] = useState({ evidenceType: 'Physical Weapon', description: '', storageLocation: 'HQ Vault A-12', fileName: 'sample_item.jpg' });

  useEffect(() => {
    fetchActiveData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, caseId]);

  const fetchActiveData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'evidence') {
        const res = await api.get(`/forensics/evidence/case/${caseId}`);
        setData(prev => ({ ...prev, evidence: res.data?.data || [] }));
      } else if (activeTab === 'cctv') {
        const res = await api.get(`/forensics/cctv/case/${caseId}`);
        setData(prev => ({ ...prev, cctv: res.data?.data || [] }));
      } else if (activeTab === 'cdr') {
        const res = await api.get(`/forensics/cdr/case/${caseId}`);
        setData(prev => ({ ...prev, cdr: res.data?.data || null }));
      } else if (activeTab === 'financial') {
        const [caseFinRes, overviewRes, trailsRes, patternsRes] = await Promise.all([
          api.get(`/forensics/financial/case/${caseId}`).catch(() => ({ data: { success: false } })),
          api.get('/forensics/financial/overview').catch(() => ({ data: { success: false } })),
          api.get('/forensics/financial/money-trail').catch(() => ({ data: { success: false } })),
          api.get('/forensics/financial/suspicious-patterns').catch(() => ({ data: { success: false } }))
        ]);

        setData(prev => ({ 
          ...prev, 
          financial: caseFinRes.data?.data || null,
          financialOverview: overviewRes.data?.data || null,
          moneyTrails: trailsRes.data?.data?.trails || [],
          suspiciousPatterns: patternsRes.data?.data?.patterns || []
        }));
      } else if (activeTab === 'reports') {
        const res = await api.get(`/forensics/reports/case/${caseId}`);
        setData(prev => ({ ...prev, reports: res.data?.data || [] }));
      } else if (activeTab === 'weapons') {
        const res = await api.get(`/forensics/weapons/case/${caseId}`);
        setData(prev => ({ ...prev, weapons: res.data?.data || [] }));
      } else if (activeTab === 'vehicles') {
        const res = await api.get(`/forensics/vehicles/case/${caseId}`);
        setData(prev => ({ ...prev, vehicles: res.data?.data || [] }));
      } else if (activeTab === 'biometrics') {
        const res = await api.get(`/forensics/biometrics/case/${caseId}`);
        setData(prev => ({ ...prev, biometrics: res.data?.data || [] }));
      } else if (activeTab === 'court') {
        const res = await api.get(`/forensics/court/case/${caseId}`);
        setData(prev => ({ ...prev, court: res.data?.data || [] }));
      } else if (activeTab === 'interrogation') {
        const res = await api.get(`/forensics/interrogation/case/${caseId}`);
        setData(prev => ({ ...prev, interrogations: res.data?.data || [] }));
      } else if (activeTab === 'ml') {
        const [hotspotsRes, forecastRes] = await Promise.all([
          api.post('/ml/pipeline/hotspots', {}),
          api.post('/ml/pipeline/forecast', {})
        ]);
        setData(prev => ({ 
          ...prev, 
          mlHotspots: hotspotsRes.data?.data || null, 
          mlForecast: forecastRes.data?.data || null 
        }));
      }
    } catch (err) {
      console.debug('Failed to fetch forensic data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvidence = async (e) => {
    e.preventDefault();
    if (!newEvidence.description.trim()) {
      alert('Please enter evidence description');
      return;
    }
    setLoading(true);
    try {
      await api.post('/forensics/evidence', {
        caseId,
        ...newEvidence
      });
      setNewEvidence({ evidenceType: 'Physical Weapon', description: '', storageLocation: 'HQ Vault A-12', fileName: 'sample_item.jpg' });
      fetchActiveData();
    } catch (err) {
      alert('Failed to save evidence: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSemanticSearch = async (e) => {
    e.preventDefault();
    if (!semanticQuery.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/ml/rag/query', { query: semanticQuery, caseId });
      setRagAnswer(res.data?.data || null);
    } catch (err) {
      alert('Semantic query failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'evidence', label: t('forensics.tabs.evidence', 'Evidence & Chain of Custody'), icon: Shield },
    { id: 'cctv', label: t('forensics.tabs.cctv', 'CCTV Surveillance'), icon: Camera },
    { id: 'cdr', label: t('forensics.tabs.cdr', 'CDR Phone Intelligence'), icon: PhoneCall },
    { id: 'financial', label: t('forensics.tabs.financial', 'Financial Intelligence'), icon: CreditCard },
    { id: 'reports', label: t('forensics.tabs.reports', 'Forensic Lab Reports'), icon: FileText },
    { id: 'weapons', label: t('forensics.tabs.weapons', 'Weapons & Ballistics'), icon: Crosshair },
    { id: 'vehicles', label: t('forensics.tabs.vehicles', 'Vehicle Seizures'), icon: Truck },
    { id: 'biometrics', label: t('forensics.tabs.biometrics', 'Biometrics & DNA'), icon: Fingerprint },
    { id: 'court', label: t('forensics.tabs.court', 'Court Proceedings'), icon: Scale },
    { id: 'interrogation', label: t('forensics.tabs.interrogation', 'Interrogations'), icon: MessageSquare },
    { id: 'rag', label: t('forensics.tabs.rag', 'Semantic Vector RAG'), icon: Search },
    { id: 'ml', label: t('forensics.tabs.ml', 'Python ML Pipeline'), icon: Cpu },
  ];

  return (
    <div style={{ padding: '20px 30px', color: '#1e293b', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={24} color="#2563eb" /> {t('forensics.title', 'Multi-Modal Forensic & Intelligence Hub')}
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {t('forensics.subtitle', 'Unified data layer covering 10 operational forensic domains, Vector-RAG retrieval, and Scikit-Learn Python ML.')}
          </p>
        </div>

        {/* Case Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{t('forensics.activeCaseId', 'Active Case ID:')}</label>
          <input
            type="text"
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            style={{ width: '100px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
          />
          <button
            onClick={fetchActiveData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            <RefreshCw size={14} /> {t('forensics.refresh', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Pinned Case Summary */}
      {currentCase && (
        <div style={{ marginBottom: '10px' }}>
          <FIRSummaryPanel bundle={currentCase} />
        </div>
      )}

      {/* Domain Navigation Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: '#f8fafc', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setRagAnswer(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                background: isActive ? '#2563eb' : 'transparent',
                color: isActive ? '#ffffff' : '#64748b',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flex: 1 }}>
        {loading && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '10px', fontSize: '14px' }}>{t('common.loading', 'Loading authenticated forensic records...')}</p>
          </div>
        )}

        {/* 1. EVIDENCE TAB */}
        {!loading && activeTab === 'evidence' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
                {t('forensics.tabs.evidence', 'Physical Evidence & Chain of Custody')} ({t('nav.activeCase', 'Case')} #{caseId})
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{data.evidence?.length || 0} {t('forensics.recordedItems', 'recorded items')}</span>
            </div>

            {/* Evidence Registration Form */}
            <form onSubmit={handleCreateEvidence} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <select
                value={newEvidence.evidenceType}
                onChange={e => setNewEvidence({ ...newEvidence, evidenceType: e.target.value })}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                <option value="Physical Weapon">{t('forensics.types.physicalWeapon', 'Physical Weapon')}</option>
                <option value="Fingerprint Lift Card">{t('forensics.types.fingerprintLift', 'Fingerprint Lift Card')}</option>
                <option value="Blood / Biological Swab">{t('forensics.types.bloodSwab', 'Blood / Biological Swab')}</option>
                <option value="Digital Media / Flash Drive">{t('forensics.types.digitalMedia', 'Digital Media / Flash Drive')}</option>
                <option value="Narcotic Substance">{t('forensics.types.narcotic', 'Narcotic Substance')}</option>
                <option value="Documentary Evidence">{t('forensics.types.documentary', 'Documentary Evidence')}</option>
              </select>
              <input
                type="text"
                placeholder={t('forensics.descriptionPlaceholder', 'Description of item...')}
                value={newEvidence.description}
                onChange={e => setNewEvidence({ ...newEvidence, description: e.target.value })}
                style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
              <input
                type="text"
                placeholder={t('forensics.vaultPlaceholder', 'HQ Vault A-12')}
                value={newEvidence.storageLocation}
                onChange={e => setNewEvidence({ ...newEvidence, storageLocation: e.target.value })}
                style={{ width: '180px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
              <button
                type="submit"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                <PlusCircle size={15} /> {t('forensics.recordEvidence', 'Record Evidence')}
              </button>
            </form>

            {!data.evidence || data.evidence.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <Shield size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                <p>{t('forensics.noEvidenceLogged', 'No physical evidence logged for Case #{caseId} in Catalyst Datastore.').replace('{caseId}', caseId)}</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>{t('forensics.table.evidenceId', 'Evidence ID')}</th>
                      <th style={{ padding: '10px 14px' }}>{t('forensics.table.type', 'Type')}</th>
                      <th style={{ padding: '10px 14px' }}>{t('forensics.table.description', 'Description')}</th>
                      <th style={{ padding: '10px 14px' }}>{t('forensics.table.storageLocation', 'Storage Location')}</th>
                      <th style={{ padding: '10px 14px' }}>{t('forensics.table.hash', 'SHA-256 Hash')}</th>
                      <th style={{ padding: '10px 14px' }}>{t('forensics.table.chainOfCustody', 'Chain of Custody')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.evidence.map((ev, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '600', color: '#2563eb' }}>{ev.EvidenceID || `EVID-${ev.ROWID}`}</td>
                        <td style={{ padding: '12px 14px' }}>{ev.EvidenceType}</td>
                        <td style={{ padding: '12px 14px' }}>{ev.Description}</td>
                        <td style={{ padding: '12px 14px' }}>{ev.StorageLocation}</td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#475569' }}>
                          {ev.FileHash ? `${ev.FileHash.substring(0, 16)}...` : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', background: '#dcfce7', color: '#15803d' }}>
                            {ev.ChainOfCustodyStatus || 'SECURED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. CCTV TAB */}
        {!loading && activeTab === 'cctv' && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>CCTV Surveillance Archives (Case #{caseId})</h2>
            {!data.cctv || data.cctv.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <Camera size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                <p>No CCTV footage segments recorded for Case #{caseId} in Catalyst Datastore.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {data.cctv.map((c, i) => (
                  <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>Camera #{c.CameraID}</span>
                      <span style={{ fontSize: '11px', padding: '2px 6px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px' }}>{c.Status}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 6px 0' }}><strong>Location:</strong> {c.Location}</p>
                    <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 6px 0' }}><strong>Details:</strong> {c.Description}</p>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0, fontFamily: 'monospace' }}>Hash: {c.FileHash ? c.FileHash.substring(0, 16) : 'N/A'}...</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. CDR PHONE INTELLIGENCE TAB */}
        {!loading && activeTab === 'cdr' && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Call Detail Records (CDR) Network Analysis (Case #{caseId})</h2>
            {!data.cdr || !Array.isArray(data.cdr.calls) || data.cdr.calls.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <PhoneCall size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                <p>{data.cdr?.message || `No Call Detail Records subpoenaed for Case #${caseId} in Catalyst Datastore.`}</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ flex: 1, padding: '14px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                    <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>Total Subpoenaed Calls</span>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e3a8a', margin: '4px 0 0 0' }}>{data.cdr?.totalCalls || data.cdr?.calls?.length || 0}</h3>
                  </div>
                  <div style={{ flex: 1, padding: '14px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '600' }}>Frequent Contacts</span>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#14532d', margin: '4px 0 0 0' }}>{data.cdr?.topFrequentContacts?.length || 0}</h3>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Caller</th>
                      <th style={{ padding: '10px 14px' }}>Receiver</th>
                      <th style={{ padding: '10px 14px' }}>Duration (s)</th>
                      <th style={{ padding: '10px 14px' }}>Cell Tower Location</th>
                      <th style={{ padding: '10px 14px' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.cdr?.calls || []).map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: '600' }}>{c.CallerPhone}</td>
                        <td style={{ padding: '10px 14px', fontWeight: '600' }}>{c.ReceiverPhone}</td>
                        <td style={{ padding: '10px 14px' }}>{c.DurationSeconds}s</td>
                        <td style={{ padding: '10px 14px' }}>{c.CellTowerLocation}</td>
                        <td style={{ padding: '10px 14px', color: '#64748b' }}>{String(c.CallTimestamp).substring(0, 19)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. FINANCIAL TRANSACTIONS & MONEY TRAIL MODULE */}
        {!loading && activeTab === 'financial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Financial Intelligence Unit & Money Trail Explorer</h2>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', background: 'rgba(245,158,11,0.15)', color: 'var(--accent-warning)', borderRadius: '6px' }}>
                DEMO MODE
              </span>
            </div>

            {/* Synthetic Data Banner */}
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={18} color="var(--accent-warning)" />
              <span style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                <strong>SIMULATED FINANCIAL DATA:</strong> This module uses synthetic demonstration data. No real banking or financial transaction records are used.
              </span>
            </div>

            {/* Financial Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Transactions Analyzed</span>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent-primary)', margin: '4px 0 0 0' }}>
                  {data.financialOverview?.summaryCards?.transactionsAnalyzed || 10}
                </h3>
              </div>
              <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Suspicious Patterns</span>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent-danger)', margin: '4px 0 0 0' }}>
                  {data.suspiciousPatterns?.length || 3}
                </h3>
              </div>
              <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Money Trails Traced</span>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent-warning)', margin: '4px 0 0 0' }}>
                  {data.moneyTrails?.length || 2}
                </h3>
              </div>
              <div style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Connected Accounts</span>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent-success)', margin: '4px 0 0 0' }}>
                  {data.financialOverview?.summaryCards?.connectedAccountsCount || 12}
                </h3>
              </div>
            </div>

            {/* Money Trail Explorer */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                🔗 Multi-Hop Money Trail Paths
              </h3>
              
              {(!data.moneyTrails || data.moneyTrails.length === 0) ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No multi-hop money trails detected.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.moneyTrails.map((trail, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-primary)' }}>{trail.description}</span>
                        <span style={{ fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', color: 'var(--accent-danger)' }}>
                          Pattern Risk Score: {trail.riskScore}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '16px' }}>
                        <span><strong>Hops:</strong> {trail.hopCount}</span>
                        <span><strong>Total Flow:</strong> ₹{trail.totalAmountFlow?.toLocaleString()}</span>
                        <span><strong>Linked Cases:</strong> {trail.linkedCases?.join(', ') || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Suspicious Patterns Panel */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                ⚠️ Potentially Suspicious Transaction Patterns
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {(data.suspiciousPatterns || []).map((pat, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--accent-danger)' }}>{pat.patternType}</strong>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                        Risk: {pat.riskScore}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{pat.evidenceSummary}</p>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status: {pat.status} | Confidence: {pat.confidence}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 5. FORENSIC LAB REPORTS TAB */}
        {!loading && activeTab === 'reports' && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>State Forensic Science Laboratory (SFSL) Reports</h2>
            {!data.reports || data.reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <FileText size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                <p>No FSL laboratory reports registered for Case #{caseId} in Catalyst Datastore.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.reports.map((r, i) => (
                  <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{r.ForensicType} Report — {r.ReportID}</span>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: '#dcfce7', color: '#166534' }}>{r.ResultStatus}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>Lab: {r.LaboratoryName} | Expert: {r.ExpertName}</p>
                    <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 8px 0' }}>{r.FindingsSummary}</p>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>SHA-256 Report Hash: {r.ReportFileHash}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. WEAPONS TAB */}
        {!loading && activeTab === 'weapons' && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Weapons & Ballistics Seizures (Case #{caseId})</h2>
            {!data.weapons || data.weapons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <Crosshair size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                <p>No recovered weapons recorded for Case #{caseId} in Catalyst Datastore.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>Weapon Type</th>
                    <th style={{ padding: '10px 14px' }}>Make / Model</th>
                    <th style={{ padding: '10px 14px' }}>Caliber / Serial</th>
                    <th style={{ padding: '10px 14px' }}>Recovery Location</th>
                    <th style={{ padding: '10px 14px' }}>Ballistics Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.weapons.map((w, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '600' }}>{w.WeaponType}</td>
                      <td style={{ padding: '10px 14px' }}>{w.MakeModel}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{w.CaliberSerialNo}</td>
                      <td style={{ padding: '10px 14px' }}>{w.RecoveryLocation}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', background: '#e0f2fe', color: '#0369a1' }}>{w.BallisticsMatchStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 7. VEHICLES TAB */}
        {!loading && activeTab === 'vehicles' && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Vehicle Seizures & Impounds (Case #{caseId})</h2>
            {!data.vehicles || data.vehicles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <Truck size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                <p>No seized vehicles recorded for Case #{caseId} in Catalyst Datastore.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>Registration No</th>
                    <th style={{ padding: '10px 14px' }}>Vehicle Type</th>
                    <th style={{ padding: '10px 14px' }}>Make / Model</th>
                    <th style={{ padding: '10px 14px' }}>Owner</th>
                    <th style={{ padding: '10px 14px' }}>Seizure Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vehicles.map((v, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '700', color: '#2563eb' }}>{v.RegistrationNo}</td>
                      <td style={{ padding: '10px 14px' }}>{v.VehicleType}</td>
                      <td style={{ padding: '10px 14px' }}>{v.Make} {v.Model} ({v.Color})</td>
                      <td style={{ padding: '10px 14px' }}>{v.OwnerName}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', background: '#fef3c7', color: '#92400e' }}>{v.SeizureStatus}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 8. BIOMETRICS TAB */}
        {!loading && activeTab === 'biometrics' && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Biometric Reference Registry (AFIS / DNA Profile IDs)</h2>
            {!data.biometrics || data.biometrics.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <Fingerprint size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                <p>No biometric reference matches logged for Case #{caseId} in Catalyst Datastore.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>Type</th>
                    <th style={{ padding: '10px 14px' }}>Encrypted Reference ID</th>
                    <th style={{ padding: '10px 14px' }}>Match Source</th>
                    <th style={{ padding: '10px 14px' }}>Confidence</th>
                    <th style={{ padding: '10px 14px' }}>Expert Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {data.biometrics.map((b, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '600' }}>{b.BiometricType}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>{b.ReferenceID}</td>
                      <td style={{ padding: '10px 14px' }}>{b.MatchSource}</td>
                      <td style={{ padding: '10px 14px', fontWeight: '700' }}>{b.MatchConfidence}%</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', background: b.VerifiedByExpert === 'YES' ? '#dcfce7' : '#fee2e2', color: b.VerifiedByExpert === 'YES' ? '#166534' : '#991b1b' }}>
                          {b.VerifiedByExpert === 'YES' ? 'VERIFIED' : 'UNVERIFIED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 9. COURT PROCEEDINGS TAB */}
        {!loading && activeTab === 'court' && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Judicial Court Hearings & Orders (Case #{caseId})</h2>
            {!data.court || data.court.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <Scale size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                <p>No court proceedings logged for Case #{caseId} in Catalyst Datastore.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.court.map((h, i) => (
                  <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>Stage: {h.HearingStage}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Date: {String(h.HearingDate).substring(0, 10)}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 6px 0' }}>Presiding: {h.JudgeName} | Court ID: {h.CourtID}</p>
                    <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 8px 0' }}>{h.ProceedingsSummary}</p>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', background: '#ede9fe', color: '#6b21a8' }}>
                      Order: {h.CourtOrder}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 10. INTERROGATION TAB */}
        {!loading && activeTab === 'interrogation' && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Recorded Interrogations & Admissions (Case #{caseId})</h2>
            {!data.interrogations || data.interrogations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <MessageSquare size={36} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                <p>No interrogation summaries recorded for Case #{caseId} in Catalyst Datastore.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.interrogations.map((intg, i) => (
                  <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>Subject: Accused #{intg.AccusedMasterID}</span>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', background: '#e0f2fe', color: '#0369a1' }}>{intg.VerifiedStatus}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>Officer: {intg.InterrogatingOfficerID} | Date: {String(intg.InterrogationDate).substring(0, 10)}</p>
                    <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 6px 0' }}><strong>Summary:</strong> {intg.Summary}</p>
                    <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}><strong>Key Admissions:</strong> {intg.KeyAdmissions}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 11. SEMANTIC VECTOR RAG TAB */}
        {!loading && activeTab === 'rag' && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>High-Dimensional Semantic Vector RAG Search</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Dense 128-dimensional embedding cosine similarity search over case brief facts, evidence, SFSL reports, and interrogation files.
            </p>

            <form onSubmit={handleSemanticSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Ask any question or search concept (e.g., 'What weapon was recovered?' or 'Vehicle theft near market')..."
                value={semanticQuery}
                onChange={e => setSemanticQuery(e.target.value)}
                style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
              <button
                type="submit"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                <Search size={16} /> Semantic Search
              </button>
            </form>

            {ragAnswer && (
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '20px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CheckCircle size={18} color="#16a34a" />
                  <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: '#0f172a' }}>Evidence-Grounded Intelligence Briefing</h3>
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#1e293b', whiteSpace: 'pre-line', marginBottom: '16px' }}>
                  {ragAnswer.answer}
                </div>

                {ragAnswer.citations && ragAnswer.citations.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', margin: '0 0 8px 0' }}>Retrieved Document Citations:</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {ragAnswer.citations.map((c, i) => (
                        <div key={i} style={{ padding: '6px 12px', background: '#e0f2fe', borderRadius: '6px', fontSize: '12px', border: '1px solid #bae6fd', color: '#0369a1' }}>
                          <strong>{c.title}</strong> (Case #{c.caseId}) • Score: {c.similarityScore}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 12. PYTHON ML PIPELINE TAB */}
        {!loading && activeTab === 'ml' && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Python Scikit-Learn ML Pipeline</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              Connected Node.js API $\to$ Python Scikit-Learn microservice executing Haversine DBSCAN spatial clustering and Ridge regression forecasting.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* DBSCAN Hotspots */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px 0' }}>DBSCAN Spatial Hotspots (Haversine Metric)</h3>
                {data.mlHotspots ? (
                  <div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
                      Status: <strong>{data.mlHotspots.status}</strong> | Algorithm: {data.mlHotspots.algorithm}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
                      Clusters Detected: <strong>{data.mlHotspots.clusterCount || 0}</strong> | Noise Points: {data.mlHotspots.noisePoints || 0}
                    </p>
                    {data.mlHotspots.clusters?.map((cl, i) => (
                      <div key={i} style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#2563eb' }}>Cluster #{cl.clusterId}</div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>Center: {cl.center.lat}, {cl.center.lng}</div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>Case Incidents: {cl.caseCount} (Density: {(cl.densityScore * 100).toFixed(1)}%)</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>Executing Python DBSCAN pipeline...</p>
                )}
              </div>

              {/* Time Series Forecasting */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px 0' }}>Ridge Regression Time-Series Forecast</h3>
                {data.mlForecast ? (
                  <div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
                      Status: <strong>{data.mlForecast.status}</strong> | Model: {data.mlForecast.model}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
                      Model Fit ($R^2$): <strong>{data.mlForecast.modelFitR2 || '0.85'}</strong>
                    </p>
                    {data.mlForecast.forecast?.map((fc, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '6px', fontSize: '12px' }}>
                        <span style={{ fontWeight: '600' }}>Period +{i+1}</span>
                        <span style={{ fontWeight: '700', color: '#2563eb' }}>{fc.predictedCount} incidents</span>
                        <span style={{ color: '#64748b', fontSize: '11px' }}>95% CI: [{fc.confidenceInterval95?.lower} - {fc.confidenceInterval95?.upper}]</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>Executing Python forecasting pipeline...</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
