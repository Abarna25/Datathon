import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import GodModeChat from '../components/godmode/GodModeChat';
import { useGodMode } from '../context/GodModeContext';
import { useAppContext } from '../context/AppContext';

const GodModePage = () => {
  const [searchParams] = useSearchParams();
  const { setContext, setPhase } = useGodMode();
  const { activeCaseId } = useAppContext();

  // If page is loaded with query params (e.g. /god-mode?caseId=101&q=Ramesh)
  useEffect(() => {
    const q = searchParams.get('q');
    const caseId = searchParams.get('caseId') || activeCaseId || '101';

    if (q || caseId) {
      setContext(prev => ({
        ...prev,
        query: q !== null ? q : prev.query,
        caseId: caseId || prev.caseId || '101'
      }));
    }
    setPhase('chat');
  }, [searchParams, activeCaseId, setContext, setPhase]);

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', background: '#080c16' }}>
      <GodModeChat />
    </div>
  );
};

export default GodModePage;
