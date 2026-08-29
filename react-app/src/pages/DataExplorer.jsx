import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, User, Send, Sparkles, Mic, MicOff, RotateCcw, 
  Table, Download, Code, Info, ChevronDown, ChevronRight,
  Copy, Check, AlertCircle, FileText, Database, Shield, Zap, ExternalLink
} from 'lucide-react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import { useGodMode } from '../context/GodModeContext';

const STARTER_PROMPTS = [
  {
    icon: FileText,
    title: 'Recent FIRs & Cases',
    prompt: 'Show all cases registered in 2021 with brief facts',
    color: '#3b82f6'
  },
  {
    icon: Shield,
    title: 'Accused & Suspects',
    prompt: 'Find all accused persons and their age and gender',
    color: '#8b5cf6'
  },
  {
    icon: Database,
    title: 'Victim & Witness Records',
    prompt: 'Show all victim details matching this investigation',
    color: '#10b981'
  },
  {
    icon: Zap,
    title: 'Arrest & Chargesheets',
    prompt: 'List all arrest surrender records and police station details',
    color: '#f59e0b'
  }
];

const DataExplorer = () => {
  const navigate = useNavigate();
  const { activeCaseId, currentCase, setActiveCaseId } = useAppContext();
  const { activateGodMode } = useGodMode();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [viewModes, setViewModes] = useState({}); // { [msgId]: 'table' | 'json' }
  const [expandedTrace, setExpandedTrace] = useState({}); // { [msgId]: boolean }


  const handleActivateGodMode = () => {
    const lastUserMsg = messages.filter(m => m.role === 'user').slice(-1)[0];
    activateGodMode({
      source: 'investigation-search',
      query: input.trim() || lastUserMsg?.content || '',
      caseId: activeCaseId || '101',
      entityType: null,
      entityId: null,
      entityName: null
    });
  };

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
            ? `I retrieved **${count} record${count === 1 ? '' : 's'}** from the Catalyst Datastore matching your query.`
            : `The query executed successfully, but no matching records were found in the Datastore for this specific filter.`;
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
          content: `I encountered an issue processing your query: **${errMsg}**.\n\nPlease try refining your search or click any of the starter prompts below.`,
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
      backgroundColor: 'var(--bg-primary, #f8fafc)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 28px',
        backgroundColor: 'var(--bg-secondary, #ffffff)',
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent-primary, #2563eb) 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)'
          }}>
            <Bot size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary, #0f172a)' }}>
                VIKSHANA Search Copilot
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--accent-success, #10b981)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                Dual-LLM ZCQL Engine
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
              {activeCaseId ? `Scoped to Case ${currentCase?.caseNumber || activeCaseId}` : 'Global Datastore Intelligence'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            id="god-mode-activate-btn"
            onClick={handleActivateGodMode}
            title="Activate Deep Investigation Mode"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              border: '1px solid #3b82f6',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 0 14px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s ease',
              letterSpacing: '0.5px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 0 18px rgba(59, 130, 246, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 14px rgba(37, 99, 235, 0.4)';
            }}
          >
            <Zap size={15} color="#fbbf24" fill="#fbbf24" />
            <span>⚡ GOD MODE</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #e2e8f0)',
                backgroundColor: 'var(--bg-secondary, #ffffff)',
                color: 'var(--text-secondary, #64748b)',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary, #2563eb)';
                e.currentTarget.style.color = 'var(--accent-primary, #2563eb)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)';
                e.currentTarget.style.color = 'var(--text-secondary, #64748b)';
              }}
            >
              <RotateCcw size={14} />
              New Chat
            </button>
          )}
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 20px 140px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ width: '100%', maxWidth: '860px' }}>

          {/* Empty Hero State (ChatGPT Style) */}
          {messages.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginTop: '40px',
              marginBottom: '32px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, var(--accent-primary, #2563eb) 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
                marginBottom: '20px'
              }}>
                <Sparkles size={32} color="#ffffff" />
              </div>

              <h1 style={{
                fontSize: '26px',
                fontWeight: '700',
                color: 'var(--text-primary, #0f172a)',
                margin: '0 0 10px 0',
                letterSpacing: '-0.4px'
              }}>
                What would you like to investigate today?
              </h1>

              <p style={{
                fontSize: '15px',
                color: 'var(--text-secondary, #64748b)',
                maxWidth: '540px',
                lineHeight: '1.6',
                margin: '0 0 36px 0'
              }}>
                Ask any question in natural language. The AI autonomously translates your intent into safe ZCQL database queries and provides explainable intelligence.
              </p>

              {/* 2x2 Starter Prompt Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '14px',
                width: '100%'
              }}>
                {STARTER_PROMPTS.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSend(card.prompt)}
                      style={{
                        padding: '16px 18px',
                        backgroundColor: 'var(--bg-secondary, #ffffff)',
                        border: '1px solid var(--border-color, #e2e8f0)',
                        borderRadius: '14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-primary, #2563eb)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08))';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{
                          padding: '6px',
                          borderRadius: '8px',
                          backgroundColor: `${card.color}15`,
                          color: card.color,
                          display: 'flex'
                        }}>
                          <Icon size={18} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary, #0f172a)' }}>
                          {card.title}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, #64748b)', lineHeight: '1.4' }}>
                        "{card.prompt}"
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages Stream */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '14px',
                marginBottom: '28px',
                alignItems: 'flex-start'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: msg.role === 'assistant' 
                  ? (msg.isError ? 'rgba(239, 68, 68, 0.1)' : 'var(--accent-primary, #2563eb)') 
                  : 'var(--bg-tertiary, #f1f5f9)',
                color: msg.role === 'assistant' ? (msg.isError ? '#ef4444' : '#ffffff') : 'var(--text-primary, #0f172a)',
                border: msg.role === 'user' ? '1px solid var(--border-color, #e2e8f0)' : 'none',
                boxShadow: msg.role === 'assistant' && !msg.isError ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none'
              }}>
                {msg.role === 'assistant' ? (msg.isError ? <AlertCircle size={20} /> : <Bot size={20} />) : <User size={20} />}
              </div>

              {/* Message Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary, #0f172a)' }}>
                    {msg.role === 'assistant' ? 'VIKSHANA Copilot' : 'You'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted, #9ca3af)' }}>
                    {msg.timestamp}
                  </span>
                </div>

                {/* Bubble Container */}
                <div style={{
                  backgroundColor: msg.role === 'user' ? 'var(--bg-secondary, #ffffff)' : 'transparent',
                  padding: msg.role === 'user' ? '14px 18px' : '0',
                  borderRadius: '14px',
                  border: msg.role === 'user' ? '1px solid var(--border-color, #e2e8f0)' : 'none',
                  boxShadow: msg.role === 'user' ? 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))' : 'none'
                }}>
                  
                  {/* Markdown Content */}
                  <div style={{
                    fontSize: '15px',
                    lineHeight: '1.6',
                    color: 'var(--text-primary, #0f172a)',
                    whiteSpace: 'pre-wrap',
                    marginBottom: msg.results && msg.results.length > 0 ? '16px' : '0'
                  }}>
                    {msg.content}
                  </div>


                  {/* Embedded Interactive Data Table / JSON */}
                  {msg.results && msg.results.length > 0 && (
                    <div style={{
                      backgroundColor: 'var(--bg-secondary, #ffffff)',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))'
                    }}>
                      {/* Table Header Bar */}
                      <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-color, #e2e8f0)',
                        backgroundColor: 'var(--bg-secondary, #ffffff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Table size={16} color="var(--accent-primary, #2563eb)" />
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary, #0f172a)' }}>
                            Records ({msg.results.length})
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', background: 'var(--bg-tertiary, #f1f5f9)', borderRadius: '6px', padding: '2px' }}>
                            <button
                              onClick={() => setViewModes(prev => ({ ...prev, [msg.id]: 'table' }))}
                              style={{
                                padding: '4px 10px',
                                border: 'none',
                                borderRadius: '4px',
                                background: (viewModes[msg.id] || 'table') === 'table' ? 'var(--bg-secondary, #ffffff)' : 'transparent',
                                color: (viewModes[msg.id] || 'table') === 'table' ? 'var(--accent-primary, #2563eb)' : 'var(--text-secondary, #64748b)',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: (viewModes[msg.id] || 'table') === 'table' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
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
                                background: viewModes[msg.id] === 'json' ? 'var(--bg-secondary, #ffffff)' : 'transparent',
                                color: viewModes[msg.id] === 'json' ? 'var(--accent-primary, #2563eb)' : 'var(--text-secondary, #64748b)',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: viewModes[msg.id] === 'json' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                              }}
                            >
                              JSON
                            </button>
                          </div>

                          <button
                            onClick={() => exportCSV(msg.results, `vikshana_query_${Date.now()}.csv`)}
                            style={{
                              padding: '5px 12px',
                              backgroundColor: 'var(--bg-secondary, #ffffff)',
                              border: '1px solid var(--border-color, #e2e8f0)',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: 'var(--text-secondary, #64748b)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = 'var(--accent-primary, #2563eb)';
                              e.currentTarget.style.color = 'var(--accent-primary, #2563eb)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)';
                              e.currentTarget.style.color = 'var(--text-secondary, #64748b)';
                            }}
                          >
                            <Download size={13} />
                            Export CSV
                          </button>
                        </div>
                      </div>

                      {/* Content Render */}
                      <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
                        {(viewModes[msg.id] || 'table') === 'table' ? (
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-tertiary, #f8fafc)', zIndex: 1 }}>
                              <tr>
                                {Object.keys(msg.results[0] || {}).filter(k => k !== '_tableName').map(col => (
                                  <th key={col} style={{
                                    padding: '10px 14px',
                                    color: 'var(--text-secondary, #64748b)',
                                    fontWeight: '600',
                                    borderBottom: '1px solid var(--border-color, #e2e8f0)',
                                    textTransform: 'uppercase',
                                    fontSize: '11px',
                                    letterSpacing: '0.5px'
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
                                    borderBottom: '1px solid var(--border-color, #e2e8f0)',
                                    backgroundColor: rIdx % 2 === 0 ? 'var(--bg-secondary, #ffffff)' : 'var(--bg-primary, #f8fafc)',
                                    transition: 'background 0.15s'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = rIdx % 2 === 0 ? 'var(--bg-secondary, #ffffff)' : 'var(--bg-primary, #f8fafc)'}
                                >
                                  {Object.keys(msg.results[0] || {}).filter(k => k !== '_tableName').map(col => (
                                    <td 
                                      key={col} 
                                      style={{
                                        padding: '10px 14px',
                                        color: 'var(--text-primary, #0f172a)',
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
                          <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary, #f8fafc)' }}>
                            <pre style={{ margin: 0, color: 'var(--text-primary, #0f172a)', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                              {JSON.stringify(msg.results, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Investigation Quick Action Buttons */}
                  {msg.role === 'assistant' && msg.results && msg.results.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
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
                            padding: '6px 12px',
                            backgroundColor: 'var(--bg-secondary, #ffffff)',
                            border: '1px solid var(--border-color, #e2e8f0)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: 'var(--accent-primary, #2563eb)',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))'
                          }}
                        >
                          <FileText size={13} />
                          <span>View Case Dossier #{msg.results[0].CaseMasterID}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          activateGodMode({
                            source: 'investigation-search-result',
                            query: msg.content.slice(0, 80),
                            caseId: msg.results[0]?.CaseMasterID || activeCaseId || '101'
                          });
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(245, 158, 11, 0.15) 100%)',
                          border: '1px solid rgba(234, 179, 8, 0.3)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#b45309',
                          cursor: 'pointer'
                        }}
                      >
                        <Zap size={13} />
                        <span>God Mode Deep Dive</span>
                      </button>
                    </div>
                  )}

                  {/* Collapsed Investigation Trace Component */}
                  {msg.role === 'assistant' && (msg.sql || msg.trace) && !msg.isError && (
                    <div style={{ marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setExpandedTrace(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          backgroundColor: expandedTrace[msg.id] ? '#f1f5f9' : 'transparent',
                          border: '1px solid var(--border-color, #e2e8f0)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: 'var(--text-secondary, #64748b)',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <Code size={13} color="var(--accent-primary, #2563eb)" />
                        <span>{expandedTrace[msg.id] ? 'Hide Investigation Trace' : 'View Investigation Trace'}</span>
                        {expandedTrace[msg.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>

                      {expandedTrace[msg.id] && (
                        <div style={{
                          marginTop: '10px',
                          padding: '14px 16px',
                          backgroundColor: 'var(--bg-secondary, #ffffff)',
                          border: '1px solid var(--border-color, #e2e8f0)',
                          borderRadius: '12px',
                          boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
                          fontSize: '13px'
                        }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#2563eb', fontSize: '11px', fontWeight: '600' }}>
                              Intent: {msg.trace?.intent || 'INVESTIGATION_SEARCH'}
                            </span>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: '#f5f3ff', color: '#7c3aed', fontSize: '11px', fontWeight: '600' }}>
                              Entity: {msg.trace?.primaryEntity || 'CaseMaster'}
                            </span>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: '#ecfdf5', color: '#059669', fontSize: '11px', fontWeight: '600' }}>
                              Execution: {msg.trace?.executionTimeMs ? `${msg.trace.executionTimeMs}ms` : '<1ms'}
                            </span>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: '#fffbeb', color: '#d97706', fontSize: '11px', fontWeight: '600' }}>
                              Confidence: {msg.trace?.confidence || 'High'}
                            </span>
                          </div>

                          {msg.sql && (
                            <div style={{ marginTop: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
                                  Internal ZCQL Query:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(msg.sql, `sql-${msg.id}`)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--accent-primary, #2563eb)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '11px'
                                  }}
                                >
                                  {copiedIndex === `sql-${msg.id}` ? <Check size={12} /> : <Copy size={12} />}
                                  {copiedIndex === `sql-${msg.id}` ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <pre style={{
                                margin: 0,
                                padding: '8px 12px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontFamily: '"Fira Code", monospace',
                                fontSize: '12px',
                                color: '#334155',
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
              </div>
            </div>
          ))}

          {/* Loading Indicator Bubble */}
          {isLoading && (
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--accent-primary, #2563eb)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
              }}>
                <Bot size={20} color="#ffffff" />
              </div>
              <div style={{
                padding: '12px 18px',
                backgroundColor: 'var(--bg-secondary, #ffffff)',
                borderRadius: '14px',
                border: '1px solid var(--border-color, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-secondary, #64748b)',
                fontSize: '14px',
                boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))'
              }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary, #2563eb)', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary, #2563eb)', animation: 'bounce 1.4s infinite ease-in-out 0.2s both' }} />
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary, #2563eb)', animation: 'bounce 1.4s infinite ease-in-out 0.4s both' }} />
                </div>
                <span>Synthesizing Datastore records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating ChatGPT-Style Bottom Input Bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to top, var(--bg-primary, #f8fafc) 70%, rgba(248, 250, 252, 0) 100%)',
        padding: '16px 20px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 20
      }}>
        <div style={{ width: '100%', maxWidth: '860px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-secondary, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '24px',
            padding: '6px 10px 6px 18px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s ease'
          }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask VIKSHANA about cases, suspects, FIRs, or legal sections..."
              disabled={isLoading}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '15px',
                resize: 'none',
                maxHeight: '120px',
                fontFamily: 'inherit',
                padding: '8px 0',
                lineHeight: '1.4'
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Mic / Speech-to-Text Button */}
              <button
                type="button"
                onClick={toggleListening}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: isListening ? '#ef4444' : 'var(--bg-tertiary, #f1f5f9)',
                  color: isListening ? '#ffffff' : 'var(--text-secondary, #64748b)',
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
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: input.trim() ? 'var(--accent-primary, #2563eb)' : 'var(--bg-tertiary, #f1f5f9)',
                  color: input.trim() ? '#ffffff' : 'var(--text-muted, #9ca3af)',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: input.trim() ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none'
                }}
                title="Send query"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted, #9ca3af)',
            textAlign: 'center',
            marginTop: '8px'
          }}>
            VIKSHANA AI synthesizes live Catalyst Datastore records. Verify findings before court submission.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExplorer;
