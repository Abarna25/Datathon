import React, { useState } from 'react';
import { Loader2, Sparkles, Send } from 'lucide-react';

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
    'Show all cases registered in 2021',
    'Find all suspects and accused',
    'List all crime incidents',
    'Show all victim details'
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      <form 
        onSubmit={handleSubmit} 
        style={{ 
          display: 'flex', 
          background: 'var(--bg-secondary)',
          border: `1px solid ${isFocused ? 'var(--accent-primary)' : 'var(--border-color)'}`,
          borderRadius: '14px',
          padding: '6px 8px',
          transition: 'all 0.2s ease',
          boxShadow: isFocused ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'var(--shadow-sm)'
        }}
      >
        <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center' }}>
          <Sparkles size={20} color={isFocused ? 'var(--accent-primary)' : 'var(--text-muted)'} style={{ transition: 'color 0.2s' }} />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="e.g., Show all cases registered in 2021..."
          disabled={isLoading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '15px',
            outline: 'none',
            padding: '10px 0',
            fontWeight: '500'
          }}
        />
        
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          style={{
            padding: '0 20px',
            borderRadius: '10px',
            background: query.trim() ? 'linear-gradient(135deg, var(--accent-primary) 0%, #1d4ed8 100%)' : 'var(--bg-tertiary)',
            color: query.trim() ? '#ffffff' : 'var(--text-muted)',
            border: 'none',
            fontWeight: '600',
            cursor: isLoading || !query.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: query.trim() ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
            fontSize: '14px'
          }}
        >
          {isLoading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
          {isLoading ? 'Processing...' : 'Execute'}
        </button>
      </form>

      <div style={{ marginTop: '14px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Suggested Queries:</span>
        {suggestions.map(suggestion => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              setQuery(suggestion);
              onExecute(suggestion);
            }}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: '20px',
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.color = 'var(--accent-primary)';
              e.currentTarget.style.background = 'var(--color-primary-light, #eff6ff)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'var(--bg-secondary)';
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
