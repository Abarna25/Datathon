import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const GodModeContext = createContext();

export const GOD_MODE_VIDEO_ID = 'L5Z-1JlL5ss';
export const GOD_MODE_DURATION = 21; // Exactly 21 seconds

export const GodModeProvider = ({ children }) => {
    // Phases: 'idle' | 'activating' | 'video' | 'initializing' | 'chat' | 'error'
    const [phase, setPhase] = useState('idle');
    const [active, setActive] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [videoError, setVideoError] = useState(null);
    const [autoplayBlocked, setAutoplayBlocked] = useState(false);

    // Preserved Investigation Context
    const [context, setContext] = useState({
        source: 'investigation-search',
        query: '',
        caseId: '101',
        entityType: null,
        entityId: null,
        entityName: null,
        timestamp: null
    });

    const timerRef = useRef(null);

    /**
     * Activate God Mode with preserved investigation context
     */
    const activateGodMode = useCallback((customContext = {}) => {
        const initialContext = {
            source: customContext.source || 'investigation-search',
            query: customContext.query || '',
            caseId: customContext.caseId || '101',
            entityType: customContext.entityType || null,
            entityId: customContext.entityId || null,
            entityName: customContext.entityName || null,
            timestamp: new Date().toISOString()
        };

        setContext(initialContext);
        setVideoError(null);
        setAutoplayBlocked(false);
        setCurrentTime(0);
        setActive(true);
        setPhase('video');
    }, []);

    /**
     * Complete video phase and transition to chat
     */
    const completeVideoPhase = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setPhase('chat');
        setActive(true);
    }, []);

    /**
     * Exit God Mode cleanly and restore state
     */
    const exitGodMode = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setActive(false);
        setPhase('idle');
        setCurrentTime(0);
        setVideoError(null);
        setAutoplayBlocked(false);
    }, []);

    const handleVideoError = useCallback((err) => {
        setVideoError(err || 'Video playback encountered an error');
        setPhase('error');
    }, []);

    return (
        <GodModeContext.Provider value={{
            active,
            phase,
            currentTime,
            setCurrentTime,
            videoDuration: GOD_MODE_DURATION,
            videoId: GOD_MODE_VIDEO_ID,
            videoError,
            autoplayBlocked,
            setAutoplayBlocked,
            context,
            setContext,
            setPhase,
            activateGodMode,
            completeVideoPhase,
            exitGodMode,
            handleVideoError
        }}>
            {children}
        </GodModeContext.Provider>
    );
};

export const useGodMode = () => {
    const ctx = useContext(GodModeContext);
    if (!ctx) {
        throw new Error('useGodMode must be used within a GodModeProvider');
    }
    return ctx;
};

export default GodModeContext;
