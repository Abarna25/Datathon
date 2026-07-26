import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, Search, FolderSearch, LogOut, Languages, Loader, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import useAuth from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import TranslationStatus from '../services/TranslationStatus';
import api from '../services/api';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, isEnglish } = useLanguage();
  const { officer, cases, activeCaseId, setActiveCaseId, loadingCases } = useAppContext();
  const [translating, setTranslating] = useState(false);
  const [translateCount, setTranslateCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searching, setSearching] = useState(false);

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
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '20px',
      padding: '16px 24px',
      borderRadius: '16px'
    }} className="glass-panel">
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Global Search */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '8px 16px', borderRadius: '8px', width: '280px' }}>
            {searching ? (
              <Loader2 size={18} className="spin" style={{ marginRight: '8px', flexShrink: 0, color: 'var(--text-muted)' }} />
            ) : (
              <Search size={18} color="var(--text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
            )}
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t ? t('nav.searchPlaceholder') : 'Search cases, FIRs, entities...'}
              style={{ 
                background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '13px'
              }} 
            />
          </div>
          {showSearchResults && searchResults.length > 0 && (
            <div className="glass-panel" style={{
              position: 'absolute',
              top: '45px',
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
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid transparent',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(37, 99, 235, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.borderColor = 'transparent';
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

        {/* Global Case Selector Option - Premium Redesign */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
          padding: '6px 12px 6px 16px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)',
            display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}>
            <FolderSearch size={13} color="#60A5FA" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '9px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {t ? t('nav.activeCase') : 'Global Workspace'}
            </span>
            {loadingCases ? (
              <span style={{ fontSize: '13px', color: '#F1F5F9', fontWeight: '500' }}>Loading cases...</span>
            ) : (
              <select
                value={activeCaseId || 'all'}
                onChange={handleCaseSelect}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#F8FAFC',
                  fontWeight: '600',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  width: '220px',
                  textOverflow: 'ellipsis'
                }}
              >
                <option value="all" style={{ background: '#0F172A', color: '#F8FAFC' }}>
                  🌐 All Cases (Global View)
                </option>
                {cases.map((c) => (
                  <option key={c.id} value={String(c.id)} style={{ background: '#1E293B', color: '#F8FAFC' }}>
                    {c.caseNumber} - {c.briefFacts ? (c.briefFacts.length > 40 ? c.briefFacts.substring(0, 37) + '...' : c.briefFacts) : 'No Brief Facts'}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Live translation indicator — only visible when Zia NLP is active */}
        {!isEnglish && (
          <div
            title={translating ? `Translating ${translateCount} strings via Zia NLP...` : 'Page translated'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: '600',
              padding: '4px 10px',
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

        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell size={22} color="var(--text-secondary)" />
          <span style={{ 
            position: 'absolute', top: '-4px', right: '-4px', background: 'var(--accent-danger)', 
            width: '10px', height: '10px', borderRadius: '50%' 
          }}></span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>{displayName}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '2px' }}>
              <span style={{ 
                background: getRoleColor(displayRole), 
                color: 'white', 
                fontSize: '10px', 
                padding: '2px 6px', 
                borderRadius: '4px', 
                fontWeight: 'bold' 
              }}>
                {displayRole}
              </span>
            </div>
          </div>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-primary)', 
            display: 'flex', justifyContent: 'center', alignItems: 'center' 
          }}>
            <User size={20} color="white" />
          </div>
          
          <button 
            onClick={logout}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              marginLeft: '8px',
              color: 'var(--text-secondary)'
            }}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
