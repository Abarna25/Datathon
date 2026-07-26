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
    // Demo Mock Data
    setFirText("On the night of October 15, 2023, around 11:30 PM, a burglary was reported at the residence of Mr. Rajesh Kumar in Indiranagar, Bangalore. The suspects, described as two males in their late 20s wearing dark hoodies, allegedly broke in through the back window and stole jewelry worth Rs. 5 Lakhs along with a laptop. A neighbor, Mrs. Sharma, reported seeing a suspicious silver Maruti Swift parked nearby with the license plate KA-01-MJ-4592. The suspects fled the scene before the police arrived. Evidence collected at the scene includes fingerprints on the broken glass and muddy footprints leading to the alleyway.");
    
    setAnalysisData({
      summary: {
        summary_text: "A burglary occurred at the residence of Rajesh Kumar in Indiranagar, Bangalore on October 15, 2023. Two suspects broke in, stealing jewelry and a laptop. A suspicious silver Maruti Swift (KA-01-MJ-4592) was seen nearby.",
        primary_offense: "Burglary / Theft",
        location: "Indiranagar, Bangalore",
        date_of_incident: "2023-10-15"
      },
      entities: [
        { entity_type: "Person", entity_value: "Rajesh Kumar", confidence: 0.98, reasoning: "Identified as the resident whose house was burglarized." },
        { entity_type: "Person", entity_value: "Mrs. Sharma", confidence: 0.95, reasoning: "Neighbor who reported seeing the suspicious vehicle." },
        { entity_type: "Vehicle", entity_value: "Maruti Swift", confidence: 0.99, reasoning: "Suspicious vehicle seen parked nearby during the incident." },
        { entity_type: "Evidence ID", entity_value: "Fingerprints", confidence: 0.9, reasoning: "Physical evidence left at the point of entry." }
      ],
      relationships: [
        { source_entity: "Rajesh Kumar", target_entity: "Mrs. Sharma", relationship_type: "Neighbor" },
        { source_entity: "Mrs. Sharma", target_entity: "Maruti Swift", relationship_type: "Observed" },
        { source_entity: "Fingerprints", target_entity: "Rajesh Kumar", relationship_type: "Found at Residence" }
      ],
      aliases: [],
      timeline: [
        { event_time: "2023-10-15 23:30", title: "Burglary Reported", description: "Burglary reported at Rajesh Kumar's residence" },
        { event_time: "2023-10-15 23:30", title: "Suspicious Vehicle Spotted", description: "Neighbor observes suspicious vehicle Maruti Swift" }
      ],
      investigation_leads: [
        { lead: "Trace vehicle ownership for KA-01-MJ-4592", priority: "High", reasoning: "The vehicle was spotted at the scene during the time of the incident." },
        { lead: "Analyze fingerprints found on broken glass", priority: "High", reasoning: "Fingerprints may match known offenders in the database." },
        { lead: "Check CCTV footage around Indiranagar", priority: "Medium", reasoning: "May reveal the suspects' escape route." }
      ]
    });
    
    // Original fetching logic commented out for demo purposes
    /*
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
    */
  }, [activeCaseId]);

  const handleAnalyze = async () => {
    if (!firText.trim()) return;
    // Fake a loading sequence for the demo video so it looks like it's analyzing
    setIsLoading(true);
    setError(null);
    setSelectedEntity(null);
    
    setTimeout(() => {
      setIsLoading(false);
      // Data is already set in useEffect, so it will just show up cleanly
    }, 1500);
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
