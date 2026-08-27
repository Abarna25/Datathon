import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAppContext } from '../context/AppContext';

const LanguageSwitcher = ({ style = {} }) => {
  const { language, supportedLanguages, switchLanguage } = useLanguage();
  const { theme } = useAppContext() || { theme: 'light' };
  const [hoveredCode, setHoveredCode] = useState(null);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '3px',
        gap: '2px',
        ...style
      }}
      role="group"
      aria-label="Language Selector"
    >
      <div style={{ paddingLeft: '8px', paddingRight: '4px', display: 'flex', alignItems: 'center' }}>
        <Globe size={14} color="var(--accent-primary)" />
      </div>

      {supportedLanguages.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => switchLanguage(code)}
          aria-pressed={language === code}
          title={code === 'en' ? 'English' : code === 'kn' ? 'Kannada' : 'Hindi'}
          onMouseEnter={() => setHoveredCode(code)}
          onMouseLeave={() => setHoveredCode(null)}
          style={{
            padding: '4px 10px',
            borderRadius: '16px',
            border: 'none',
            background: language === code 
              ? 'var(--accent-primary)' 
              : hoveredCode === code 
                ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)') 
                : 'transparent',
            color: language === code ? '#ffffff' : 'var(--text-secondary)',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            whiteSpace: 'nowrap'
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
