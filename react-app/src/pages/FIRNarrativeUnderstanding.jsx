import React, { useState, useEffect } from 'react';
import { FileText, Upload, Loader2, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

import EntityCards from '../components/fir/EntityCards';
import EntityGraph from '../components/fir/EntityGraph';
import TimelineView from '../components/fir/TimelineView';
import InvestigationLeads from '../components/fir/InvestigationLeads';
import AIExplanationPanel from '../components/fir/AIExplanationPanel';

const FIRNarrativeUnderstanding = () => {
  const [firText, setFirText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const { activeCaseId } = useAppContext();

  // Load existing FIR text for the active case on mount or active case change
  useEffect(() => {
    if (!activeCaseId) return;
    
    const loadFIRText = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setAnalysisData(null);
        setSelectedEntity(null);
        
        const res = await api.get(`/cases/${activeCaseId}/full-bundle`);
        if (res.data?.success && res.data.data?.firSummary?.firText) {
          setFirText(res.data.data.firSummary.firText);
        } else {
          setFirText('');
        }
      } catch (err) {
        console.debug('[FIRNarrative] Failed to retrieve case bundle:', err);
        setFirText('');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFIRText();
  }, [activeCaseId]);

  const handleAnalyze = async () => {
    if (!firText.trim()) return;
    setIsLoading(true);
    setError(null);
    setSelectedEntity(null);

    try {
      // POST to our new backend controller
      const response = await api.post('/fir-intelligence/analyze', { firText, caseId: activeCaseId });
      
      if (response.data.success) {
        setAnalysisData(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to analyze FIR.');
      }
    } catch (err) {
      console.debug('FIR Analysis Error:', err);
      setError(err.response?.data?.error || err.message || 'Error communicating with AI service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', paddingBottom: '40px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={32} color="var(--accent-primary)" />
          FIR Intelligence
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '15px' }}>
          Automatically extract entities, resolve aliases, and build investigation timelines from the active case FIR narrative.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {error && (
            <div className="error-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '500' }}>
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px' }}>Input Narrative (Active Case)</h3>
              <button
                onClick={handleAnalyze}
                disabled={isLoading || !firText.trim()}
                style={{
                  padding: '8px 24px', borderRadius: '8px', background: 'var(--accent-primary)',
                  color: 'white', border: 'none', fontWeight: '600', cursor: (isLoading || !firText.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isLoading || !firText.trim()) ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                {isLoading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                Analyze FIR
              </button>
            </div>
            <textarea
              value={firText}
              onChange={(e) => setFirText(e.target.value)}
              placeholder="FIR narrative text is fetched dynamically or can be pasted here..."
              disabled={isLoading}
              style={{
                width: '100%', height: '150px', padding: '16px', borderRadius: '8px',
                border: '1px solid var(--glass-border)', background: 'var(--bg-primary)',
                color: 'var(--text-primary)', fontSize: '14px', resize: 'vertical',
                outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
            />
          </div>

          

          {analysisData && (
            <>
              {analysisData.summary && (
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)' }}>Investigation Summary</h3>
                  <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{analysisData.summary.summary_text}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {Object.entries(analysisData.summary).filter(([k]) => k !== 'summary_text').map(([k, v]) => (
                      <div key={k} style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>{k.replace('_', ' ')}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <EntityCards 
                entities={analysisData.entities} 
                onEntityClick={setSelectedEntity} 
                selectedEntity={selectedEntity} 
              />
              
              <EntityGraph 
                relationships={analysisData.relationships} 
                aliases={analysisData.aliases} 
              />
              
              <TimelineView timeline={analysisData.timeline} />
            </>
          )}

        </div>

        {/* Right Sidebar Area for Explanations and Leads */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <AIExplanationPanel entity={selectedEntity} />
          
          {analysisData?.investigation_leads && (
            <InvestigationLeads leads={analysisData.investigation_leads} />
          )}
        </div>
      </div>
    </div>
  );
};

export default FIRNarrativeUnderstanding;
