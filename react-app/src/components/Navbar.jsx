import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Search, FolderSearch, LogOut, Languages, Loader, Loader2, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import useAuth from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationCenter from './NotificationCenter';
import TranslationStatus from '../services/TranslationStatus';
import api from '../services/api';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, isEnglish } = useLanguage();
  const { theme, officer, cases, activeCaseId, setActiveCaseId, loadingCases } = useAppContext();
  const [translating, setTranslating] = useState(false);
  const [translateCount, setTranslateCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearchChange = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/cases/search', { params: { q } });
      if (res.data?.success) {
        setSearchResults(res.data.data);
        setShowSearchResults(true);
      }
    } catch (err) {
      console.debug('[Search] Failed:', err);
    } finally {
      setSearching(false);
    }
  };

  // Subscribe to translation progress from AutoTranslator
  useEffect(() => {
    const unsub = TranslationStatus.subscribe(({ translating, count }) => {
      setTranslating(translating);
      setTranslateCount(count);
    });
    return unsub;
  }, []);

  const displayName = user?.name || officer?.name || 'Unknown User';
  const displayRole = user?.role || officer?.role || 'Viewer';
  const displayUserName = displayName.toLowerCase() === 'administrator' ? 'Admin User' : displayName;
  const getRoleColor = (role) => {
    switch(role) {
      case 'Administrator': return '#ef4444'; // Red
      case 'Investigator': return '#3b82f6'; // Blue
      case 'Officer': return '#3b82f6';
      case 'Analyst': return '#a855f7'; // Purple
      case 'Supervisor': return '#f97316'; // Orange
      case 'Policymaker': return '#10b981'; // Green
      default: return '#64748b'; // Gray
    }
  };

  const handleCaseSelect = (e) => {
    const selectedId = e.target.value;
    if (setActiveCaseId) {
      setActiveCaseId(selectedId === 'all' ? null : selectedId);
    }
    if (selectedId !== 'all') {
      navigate(`/investigate/${selectedId}`);
    }
  };

  return (
    <header style={{ 
      position: 'relative',
      zIndex: 100,
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '20px',
      padding: '12px 24px',
      borderRadius: '16px',
      gap: '16px'
    }} className="glass-panel">
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 auto', minWidth: 0 }}>
        {/* Global Search */}
        <div style={{ position: 'relative', flex: '0 1 300px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'var(--bg-tertiary)', 
            padding: '0 14px', 
            borderRadius: '10px', 
            height: '40px',
            border: isSearchFocused ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
            boxShadow: isSearchFocused ? '0 0 0 2px rgba(37, 99, 235, 0.15)' : 'none',
            transition: 'all 0.2s ease'
          }}>
            {searching ? (
              <Loader2 size={16} className="spin" style={{ marginRight: '8px', flexShrink: 0, color: 'var(--text-muted)' }} />
            ) : (
              <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
            )}
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder={t ? t('nav.searchPlaceholder') : 'Search cases, FIRs, entities...'}
              style={{ 
                background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '13px'
              }} 
            />
          </div>
          {showSearchResults && searchResults.length > 0 && (
            <div className="glass-panel" style={{
              position: 'absolute',
              top: '46px',
              left: 0,
              width: '320px',
              maxHeight: '350px',
              overflowY: 'auto',
              zIndex: 1000,
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              background: 'var(--bg-secondary)'
            }}>
              {searchResults.map((r, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    if (r.id) {
                      setActiveCaseId(String(r.id));
                    }
                    setShowSearchResults(false);
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'var(--bg-primary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>{r.title}</span>
                    <span style={{ fontSize: '9px', textTransform: 'uppercase', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>{r.type}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{r.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Case Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-tertiary)',
          height: '40px',
          padding: '0 12px',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          maxWidth: '300px',
          flex: '0 1 260px'
        }}>
          <FolderSearch size={15} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, position: 'relative' }}>
            <span style={{ fontSize: '8.5px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1 }}>
              {t ? t('nav.activeCase') : 'Workspace'}
            </span>
            {loadingCases ? (
              <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '500' }}>Loading...</span>
            ) : (
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select
                  value={activeCaseId || 'all'}
                  onChange={handleCaseSelect}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontWeight: '600',
                    fontSize: '12px',
                    outline: 'none',
                    cursor: 'pointer',
                    padding: '0 16px 0 0',
                    width: '100%',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none'
                  }}
                >
                  <option value="all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    🌐 All Cases (Global View)
                  </option>
                  {cases.map((c) => (
                    <option key={c.id} value={String(c.id)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {c.caseNumber} - {c.briefFacts ? (c.briefFacts.length > 30 ? c.briefFacts.substring(0, 27) + '...' : c.briefFacts) : 'No Facts'}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} color="var(--text-secondary)" style={{ position: 'absolute', right: 0, pointerEvents: 'none' }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Live translation indicator */}
        {!isEnglish && (
          <div
            title={translating ? `Translating ${translateCount} strings via Zia NLP...` : 'Page translated'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: '600',
              padding: '4px 8px',
              borderRadius: '20px',
              background: translating
                ? 'rgba(99, 102, 241, 0.12)'
                : 'rgba(16, 185, 129, 0.1)',
              border: translating
                ? '1px solid rgba(99, 102, 241, 0.3)'
                : '1px solid rgba(16, 185, 129, 0.25)',
              color: translating ? '#6366F1' : '#10B981',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {translating ? (
              <>
                <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} />
                <span>NLP...</span>
              </>
            ) : (
              <>
                <Languages size={11} />
                <span>ಅನುವಾದಿಸಲಾಗಿದೆ</span>
              </>
            )}
          </div>
        )}

        <NotificationCenter />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid var(--border-color)', paddingLeft: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.2 }}>{displayUserName}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '3px' }}>
              <span style={{ 
                background: getRoleColor(displayRole), 
                color: 'white', 
                fontSize: '9.5px', 
                padding: '1px 6px', 
                borderRadius: '4px', 
                fontWeight: '700',
                letterSpacing: '0.3px',
                textTransform: 'uppercase'
              }}>
                {displayRole}
              </span>
            </div>
          </div>
          <div 
            style={{ 
              width: '36px', height: '36px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--accent-primary), #1d4ed8)', 
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <User size={18} color="white" />
          </div>
          
          <button 
            onClick={logout}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-danger)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
