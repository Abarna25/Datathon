import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Send } from 'lucide-react';

const QueryInput = ({ onExecute, isLoading }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onExecute(query.trim());
    }
  };

  const suggestions = [
    'Find all suspects matching this case',
    'Show me the evidence timeline',
    'List all seized vehicles in Mysore',
    'Find connections to Rajesh'
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      <form 
        onSubmit={handleSubmit} 
        style={{ 
          display: 'flex', 
          background: 'rgba(19, 26, 42, 0.7)',
          border: `1px solid ${isFocused ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '16px',
          padding: '8px',
          transition: 'all 0.3s ease',
          boxShadow: isFocused ? '0 0 0 4px rgba(59, 130, 246, 0.15)' : '0 4px 20px rgba(0,0,0,0.2)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}>
          <Sparkles size={22} color={isFocused ? '#3b82f6' : '#64748b'} style={{ transition: 'color 0.3s' }} />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="e.g., Show me all suspects involved in gold theft..."
          disabled={isLoading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            fontSize: '16px',
            outline: 'none',
            padding: '12px 0',
            fontWeight: '500'
          }}
        />
        
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          style={{
            padding: '0 24px',
            borderRadius: '12px',
            background: query.trim() ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(255,255,255,0.05)',
            color: query.trim() ? '#ffffff' : '#64748b',
            border: 'none',
            fontWeight: '600',
            cursor: isLoading || !query.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: query.trim() ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none'
          }}
        >
          {isLoading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          {isLoading ? 'Processing...' : 'Execute'}
        </button>
      </form>

      <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Suggested Queries:</span>
        {suggestions.map(suggestion => (
          <button
            key={suggestion}
            onClick={() => setQuery(suggestion)}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8',
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              ':hover': {
                background: 'rgba(255,255,255,0.08)',
                color: '#ffffff'
              }
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(59,130,246,0.1)';
              e.target.style.borderColor = 'rgba(59,130,246,0.3)';
              e.target.style.color = '#60a5fa';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.03)';
              e.target.style.borderColor = 'rgba(255,255,255,0.08)';
              e.target.style.color = '#94a3b8';
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QueryInput;
