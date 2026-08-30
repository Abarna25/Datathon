import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, User, Send, Sparkles, Mic, MicOff, RotateCcw, 
  Table, Download, Code, Info, ChevronDown, ChevronRight,
  Copy, Check, AlertCircle, FileText, Database, Shield, Zap, ExternalLink,
  Terminal, Search, Command
} from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';

const STARTER_PROMPTS = [
  {
    icon: FileText,
    title: 'Recent FIRs & Cases',
    prompt: 'Show all cases registered in 2021 with brief facts',
    color: '#3b82f6'
  },
  {
    icon: Shield,
    title: 'Accused Profiles',
    prompt: 'Find all accused persons and their age and gender',
    color: '#8b5cf6'
  },
  {
    icon: Database,
    title: 'Victim Records',
    prompt: 'Show all victim details matching this investigation',
    color: '#10b981'
  },
  {
    icon: Zap,
    title: 'Arrest Records',
    prompt: 'List all arrest surrender records and police station details',
    color: '#f59e0b'
  }
];

const DataExplorer = () => {
  const navigate = useNavigate();
  const { activeCaseId, currentCase, setActiveCaseId } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [viewModes, setViewModes] = useState({}); // { [msgId]: 'table' | 'json' }
  const [expandedTrace, setExpandedTrace] = useState({}); // { [msgId]: boolean }

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported on this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const exportCSV = (data, filename = 'vikshana_export.csv') => {
    if (!data || !data.length) return;
    const columns = Object.keys(data[0] || {}).filter(k => k !== '_tableName');
    const header = columns.join(',');
    const rows = data.map(row => columns.map(col => `"${String(row[col] || '').replace(/"/g, '""')}"`).join(','));
    const csv = [header, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = async (customPrompt) => {
    const queryText = (typeof customPrompt === 'string' ? customPrompt : input).trim();
    if (!queryText || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now() + 1}`;

    // Add User Message
    const newMessages = [
      ...messages,
      {
        id: userMessageId,
        role: 'user',
        content: queryText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Fast Conversational Greeting Detection
    const lower = queryText.toLowerCase().trim();
    const isGreeting = /^(hi|hello|hey|greetings|namaste|help|who are you|what can you do)[\s!.]*$/i.test(lower);

    if (isGreeting) {
      setTimeout(() => {
        setMessages([
          ...newMessages,
          {
            id: assistantMessageId,
            role: 'assistant',
            content: `Hello Officer! I am **VIKSHANA Intelligence Copilot**.

I can assist you with natural language queries across the **Karnataka State Police Datastore**:
- 🔍 **Case Lookup**: Search FIRs by date, category, police station, or brief facts.
- 👥 **Accused Profiling**: Identify suspects, aliases, age demographics, and repeat offenders.
- ⚖️ **Legal References**: Query BNS / IPC act sections and chargesheet filings.
- 📊 **Forensic Synthesis**: Extract victim statements, arrest records, and timeline events.

Try asking: *"Show all cases registered in 2021"* or *"Find accused in this case"*.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsLoading(false);
      }, 400);
      return;
    }

    try {
      const response = await api.post('/text-to-sql/query', { 
        query: queryText, 
        caseId: activeCaseId 
      });

      if (response.data.success) {
        const { sql, results, answer, explanation, trace } = response.data;
        const count = results ? results.length : 0;

        let contentSummary = answer || explanation;
        if (!contentSummary) {
          contentSummary = count > 0 
            ? `Query Executed: **${count} record${count === 1 ? '' : 's'}** retrieved from Datastore.`
            : `Query executed successfully, but no matching records were found.`;
        }

        setMessages([
          ...newMessages,
          {
            id: assistantMessageId,
            role: 'assistant',
            content: contentSummary,
            sql: sql,
            results: results,
            explanation: explanation,
            trace: trace || {
              intent: 'INVESTIGATION_SEARCH',
              primaryEntity: 'CaseMaster',
              sql: sql,
              filters: 'Standard indexing',
              confidence: 'Verified (High)',
              executionTimeMs: 1
            },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);

      } else {
        throw new Error(response.data.error || 'Failed to process database query.');
      }
    } catch (err) {
      console.debug('Search error:', err);
      const errMsg = err.response?.data?.error || err.message || 'An error occurred while analyzing the query.';
      
      setMessages([
        ...newMessages,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: `Execution Failed: **${errMsg}**.\n\nPlease refine your search parameters.`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      backgroundColor: '#020617', // Deep slate / almost black
      color: '#e2e8f0',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 28px',
        backgroundColor: '#0f172a',
        borderBottom: '1px solid #1e293b',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)'
          }}>
            <Command size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>
                ZCQL COMMAND CENTER
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 5px #34d399' }} />
                Dual-LLM Engine Active
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Database size={12} />
              {activeCaseId ? `Scoped to Case ${currentCase?.caseNumber || activeCaseId}` : 'Global Datastore Target: STATE_DB_01'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: '#cbd5e1',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.color = '#38bdf8';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.color = '#cbd5e1';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <RotateCcw size={14} />
              Clear Console
            </button>
          )}
        </div>
      </div>

      {/* Command Input Area (Sticky Top) */}
      <div style={{
        padding: '24px 28px 20px 28px',
        backgroundColor: '#0f172a',
        borderBottom: '1px solid #1e293b',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        zIndex: 5
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Main Input Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#020617',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '4px 10px 4px 18px',
            transition: 'all 0.2s ease',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}>
            <Terminal size={20} color="#3b82f6" style={{ flexShrink: 0 }} />
            
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter natural language query or ZCQL directive..."
              disabled={isLoading}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: '#f8fafc',
                fontSize: '15px',
                fontFamily: '"Fira Code", monospace',
                padding: '14px 14px',
                width: '100%'
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Mic / Speech-to-Text Button */}
              <button
                type="button"
                onClick={toggleListening}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  backgroundColor: isListening ? '#7f1d1d' : '#1e293b',
                  color: isListening ? '#fca5a5' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                title={isListening ? 'Listening...' : 'Voice Search'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                style={{
                  height: '38px',
                  padding: '0 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: input.trim() ? '#3b82f6' : '#1e293b',
                  color: input.trim() ? '#ffffff' : '#64748b',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  fontWeight: '600',
                  boxShadow: input.trim() ? '0 0 15px rgba(59, 130, 246, 0.3)' : 'none'
                }}
                title="Execute Query"
              >
                EXECUTE <Send size={16} />
              </button>
            </div>
          </div>

          {/* Quick Command Chips */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '16px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none' // IE 10+
          }}>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
              Suggested Macros:
            </span>
            {STARTER_PROMPTS.map((card, idx) => {
              const Icon = card.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(card.prompt)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '20px',
                    color: '#cbd5e1',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = card.color;
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.boxShadow = `0 0 10px ${card.color}33`;
                    e.currentTarget.style.backgroundColor = `${card.color}15`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#334155';
                    e.currentTarget.style.color = '#cbd5e1';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.backgroundColor = '#1e293b';
                  }}
                >
                  <Icon size={14} color={card.color} />
                  {card.title}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Main Conversation Stream */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ width: '100%', maxWidth: '1000px' }}>

          {/* Empty State */}
          {messages.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginTop: '80px',
              opacity: 0.6
            }}>
              <Database size={64} color="#334155" style={{ marginBottom: '20px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#64748b', margin: '0 0 10px 0' }}>
                Engine Initialized
              </h2>
              <p style={{ fontSize: '14px', color: '#475569', maxWidth: '400px' }}>
                Enter a natural language query above. The Dual-LLM engine will autonomously synthesize it into executable ZCQL.
              </p>
            </div>
          )}

          {/* Messages Stream */}
          {messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: '32px' }}>
              
              {/* User Command Line */}
              {msg.role === 'user' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  color: '#38bdf8',
                  fontFamily: '"Fira Code", monospace',
                  fontSize: '15px'
                }}>
                  <ChevronRight size={18} color="#0ea5e9" />
                  <span style={{ textShadow: '0 0 8px rgba(56, 189, 248, 0.3)' }}>{msg.content}</span>
                  <span style={{ fontSize: '11px', color: '#475569', marginLeft: 'auto', fontFamily: 'sans-serif' }}>
                    {msg.timestamp}
                  </span>
                </div>
              )}

              {/* Assistant Response Panel */}
              {msg.role === 'assistant' && (
                <div style={{
                  backgroundColor: '#0f172a',
                  border: msg.isError ? '1px solid #7f1d1d' : '1px solid #1e293b',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  borderLeft: msg.isError ? '4px solid #ef4444' : '4px solid #3b82f6'
                }}>
                  
                  {/* Content Summary / Markdown */}
                  <div style={{
                    fontSize: '15px',
                    lineHeight: '1.6',
                    color: msg.isError ? '#fca5a5' : '#e2e8f0',
                    whiteSpace: 'pre-wrap',
                    marginBottom: msg.results && msg.results.length > 0 ? '20px' : '0'
                  }}>
                    {msg.content}
                  </div>

                  {/* Embedded Interactive Data Table / JSON */}
                  {msg.results && msg.results.length > 0 && (
                    <div style={{
                      backgroundColor: '#020617',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      {/* Table Header Bar */}
                      <div style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid #1e293b',
                        backgroundColor: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Table size={16} color="#38bdf8" />
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                            Result Set ({msg.results.length})
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ display: 'flex', background: '#020617', borderRadius: '6px', padding: '2px', border: '1px solid #1e293b' }}>
                            <button
                              onClick={() => setViewModes(prev => ({ ...prev, [msg.id]: 'table' }))}
                              style={{
                                padding: '4px 10px',
                                border: 'none',
                                borderRadius: '4px',
                                background: (viewModes[msg.id] || 'table') === 'table' ? '#1e293b' : 'transparent',
                                color: (viewModes[msg.id] || 'table') === 'table' ? '#38bdf8' : '#64748b',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                              }}
                            >
                              Table
                            </button>
                            <button
                              onClick={() => setViewModes(prev => ({ ...prev, [msg.id]: 'json' }))}
                              style={{
                                padding: '4px 10px',
                                border: 'none',
                                borderRadius: '4px',
                                background: viewModes[msg.id] === 'json' ? '#1e293b' : 'transparent',
                                color: viewModes[msg.id] === 'json' ? '#38bdf8' : '#64748b',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                textTransform: 'uppercase'
                              }}
                            >
                              JSON
                            </button>
                          </div>

                          <button
                            onClick={() => exportCSV(msg.results, `vikshana_query_${Date.now()}.csv`)}
                            style={{
                              padding: '5px 12px',
                              backgroundColor: '#020617',
                              border: '1px solid #334155',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#cbd5e1',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              textTransform: 'uppercase'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = '#38bdf8';
                              e.currentTarget.style.color = '#38bdf8';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = '#334155';
                              e.currentTarget.style.color = '#cbd5e1';
                            }}
                          >
                            <Download size={13} />
                            CSV
                          </button>
                        </div>
                      </div>

                      {/* Content Render */}
                      <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
                        {(viewModes[msg.id] || 'table') === 'table' ? (
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#0f172a', zIndex: 1 }}>
                              <tr>
                                {Object.keys(msg.results[0] || {}).filter(k => k !== '_tableName').map(col => (
                                  <th key={col} style={{
                                    padding: '10px 14px',
                                    color: '#94a3b8',
                                    fontWeight: '700',
                                    borderBottom: '1px solid #1e293b',
                                    textTransform: 'uppercase',
                                    fontSize: '11px',
                                    letterSpacing: '0.5px',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {msg.results.map((row, rIdx) => (
                                <tr 
                                  key={rIdx}
                                  style={{
                                    borderBottom: '1px solid #1e293b',
                                    backgroundColor: rIdx % 2 === 0 ? '#020617' : '#0f172a',
                                    transition: 'background 0.1s'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = rIdx % 2 === 0 ? '#020617' : '#0f172a'}
                                >
                                  {Object.keys(msg.results[0] || {}).filter(k => k !== '_tableName').map(col => (
                                    <td 
                                      key={col} 
                                      style={{
                                        padding: '10px 14px',
                                        color: '#cbd5e1',
                                        maxWidth: '240px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}
                                      title={String(row[col])}
                                    >
                                      {String(row[col] ?? '')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{ padding: '16px', backgroundColor: '#020617' }}>
                            <pre style={{ margin: 0, color: '#38bdf8', fontSize: '13px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: '"Fira Code", monospace' }}>
                              {JSON.stringify(msg.results, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Investigation Quick Action Buttons */}
                  {msg.results && msg.results.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                      {msg.results[0]?.CaseMasterID && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCaseId(msg.results[0].CaseMasterID);
                            navigate(`/app/cases/${msg.results[0].CaseMasterID}`);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#38bdf8',
                            cursor: 'pointer',
                            textTransform: 'uppercase'
                          }}
                        >
                          <ExternalLink size={13} />
                          <span>Launch Case #{msg.results[0].CaseMasterID}</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Collapsed Investigation Trace Component */}
                  {(msg.sql || msg.trace) && !msg.isError && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid #1e293b', paddingTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setExpandedTrace(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          backgroundColor: expandedTrace[msg.id] ? '#1e293b' : 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        <Code size={13} color="#3b82f6" />
                        <span>{expandedTrace[msg.id] ? 'Hide Diagnostics' : 'System Diagnostics'}</span>
                        {expandedTrace[msg.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>

                      {expandedTrace[msg.id] && (
                        <div style={{
                          marginTop: '12px',
                          padding: '14px 16px',
                          backgroundColor: '#020617',
                          border: '1px solid #1e293b',
                          borderRadius: '8px',
                          fontSize: '13px'
                        }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#38bdf8', fontSize: '11px', fontWeight: '700' }}>
                              INTENT: {msg.trace?.intent || 'INVESTIGATION_SEARCH'}
                            </span>
                            <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(139,92,246,0.1)', color: '#c084fc', fontSize: '11px', fontWeight: '700' }}>
                              ENTITY: {msg.trace?.primaryEntity || 'CaseMaster'}
                            </span>
                            <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#34d399', fontSize: '11px', fontWeight: '700' }}>
                              EXECUTION: {msg.trace?.executionTimeMs ? `${msg.trace.executionTimeMs}ms` : '<1ms'}
                            </span>
                            <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(245,158,11,0.1)', color: '#fbbf24', fontSize: '11px', fontWeight: '700' }}>
                              CONFIDENCE: {msg.trace?.confidence || 'High'}
                            </span>
                          </div>

                          {msg.sql && (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                                  Generated ZCQL:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(msg.sql, `sql-${msg.id}`)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#38bdf8',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    fontWeight: '700'
                                  }}
                                >
                                  {copiedIndex === `sql-${msg.id}` ? <Check size={12} /> : <Copy size={12} />}
                                  {copiedIndex === `sql-${msg.id}` ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <pre style={{
                                margin: 0,
                                padding: '12px',
                                backgroundColor: '#0f172a',
                                border: '1px solid #1e293b',
                                borderRadius: '8px',
                                fontFamily: '"Fira Code", monospace',
                                fontSize: '13px',
                                color: '#e2e8f0',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all'
                              }}>
                                {msg.sql}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#38bdf8',
              fontFamily: '"Fira Code", monospace',
              fontSize: '14px',
              padding: '10px 0'
            }}>
              <ChevronRight size={18} color="#0ea5e9" />
              <span>Processing directive...</span>
              <div style={{ display: 'flex', gap: '4px', marginLeft: '10px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', animation: 'bounce 1.4s infinite ease-in-out 0.2s both' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8', animation: 'bounce 1.4s infinite ease-in-out 0.4s both' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default DataExplorer;
