import React, { useState, useEffect } from 'react';
import { Bot, Send, Loader2, User, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';

const CopilotAssistantPanel = ({ caseId }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AI Copilot for this investigation. Ask me to summarize the case, list suspects, find investigation gaps, or generate a charge sheet.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (!caseId || caseId === 'UNASSIGNED') return;
    let isMounted = true;
    
    const fetchHistory = async () => {
      setIsHistoryLoading(true);
      try {
        const res = await api.get(`/evidence-intelligence/copilot/history/${caseId}`);
        if (res.data.success && res.data.messages && res.data.messages.length > 0) {
          if (isMounted) {
            setMessages(res.data.messages.map(m => ({
              role: m.role,
              content: m.content,
              evidenceUsed: m.citations,
              isError: false
            })));
          }
        } else {
          if (isMounted) {
             setMessages([{ role: 'assistant', content: 'Hello! I am your AI Copilot for this investigation. Ask me to summarize the case, list suspects, find investigation gaps, or generate a charge sheet.' }]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch copilot history", err);
      } finally {
        if (isMounted) setIsHistoryLoading(false);
      }
    };
    
    fetchHistory();
    
    return () => { isMounted = false; };
  }, [caseId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await api.post('/evidence-intelligence/copilot', { caseId, prompt: userMsg });
      if (res.data.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: res.data.data.answer,
          evidenceUsed: res.data.data.evidence_used,
          confidence: res.data.data.confidence,
          reasoning: res.data.data.reasoning,
          actions: res.data.data.recommended_actions
        }]);
      } else {
        throw new Error(res.data.error || 'Failed to get response');
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error communicating with AI Copilot.', isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Bot size={20} color="var(--accent-primary)" />
        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>Investigation Copilot</h3>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isHistoryLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            <Loader2 className="spin" size={24} style={{ marginRight: '8px' }} /> Loading previous conversation...
          </div>
        ) : (
          messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              background: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} color="white" />}
            </div>
            <div style={{ 
              background: msg.role === 'user' ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.1)', 
              border: msg.role === 'assistant' && !msg.isError ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
              padding: '12px 16px', borderRadius: '8px', maxWidth: '85%',
              color: msg.isError ? '#ef4444' : 'var(--text-primary)',
              fontSize: '14px', lineHeight: '1.5'
            }}>
              <div className="copilot-markdown">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              
              {msg.reasoning && (
                <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <strong>AI Reasoning:</strong> {msg.reasoning}
                </div>
              )}

              {msg.actions && msg.actions.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <strong style={{ fontSize: '12px', color: '#10b981' }}>Recommended Actions:</strong>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', fontSize: '12px', color: '#e2e8f0' }}>
                    {msg.actions.map((act, idx) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {msg.evidenceUsed && msg.evidenceUsed.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--accent-primary)' }}>
                  <strong>Citations:</strong> {msg.evidenceUsed.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', gap: '12px' }}>
             <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="white" />
            </div>
            <div style={{ background: 'rgba(59,130,246,0.1)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <Loader2 size={16} className="spin" color="var(--accent-primary)" />
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '0 16px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {['Analyze Crime Pattern', 'Find Similar Cases', 'Check Investigation Gaps', 'Find Emerging Crimes', 'Analyze Hotspots', 'Find Repeat Offenders', 'Generate Investigation Brief'].map(action => (
          <button 
            key={action}
            onClick={() => {
              setInput(action);
            }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '6px 12px',
              borderRadius: '16px',
              color: '#e2e8f0',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(59,130,246,0.2)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
          >
            {action}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
             if (e.key === 'Enter') handleSend();
          }}
          placeholder="Ask Copilot (e.g. 'What is missing?' or 'Summarize case')..."
          disabled={isLoading}
          style={{ 
            flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', 
            padding: '10px 16px', borderRadius: '20px', color: 'var(--text-primary)', outline: 'none' 
          }}
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          style={{ 
            background: 'var(--accent-primary)', border: 'none', width: '40px', height: '40px', 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer', opacity: (!input.trim() || isLoading) ? 0.5 : 1
          }}
        >
          <Send size={16} color="white" />
        </button>
      </div>
    </div>
  );
};

export default CopilotAssistantPanel;
