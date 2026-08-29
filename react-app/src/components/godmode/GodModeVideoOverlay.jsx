import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Play, AlertTriangle, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { useGodMode, GOD_MODE_VIDEO_ID, GOD_MODE_DURATION } from '../../context/GodModeContext';
import styles from './GodModeVideoOverlay.module.css';

const HUD_TIMELINE_MESSAGES = [
  { start: 0, end: 5, text: 'INITIALIZING DEEP INVESTIGATION', sub: 'ESTABLISHING SECURE CIPHER SESSION' },
  { start: 5, end: 10, text: 'CONNECTING INTELLIGENCE ENGINES', sub: 'MO • TEMPORAL NETWORK • EVIDENCE CHAIN' },
  { start: 10, end: 15, text: 'CORRELATING INVESTIGATION DATA', sub: 'SYNCHRONIZING CROSS-PRECINCT RECORDS' },
  { start: 15, end: 20, text: 'BUILDING EVIDENCE CONTEXT', sub: 'SYNTHESIZING PROVENANCE GRAPHS' },
  { start: 20, end: 21, text: 'INTELLIGENCE CORE READY', sub: 'ENGAGING FULL DEEP INVESTIGATION MATRIX' }
];

const GodModeVideoOverlay = () => {
  const navigate = useNavigate();
  const {
    active,
    phase,
    context,
    completeVideoPhase,
    handleVideoError,
    videoError
  } = useGodMode();

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);
  const hasTransitionedRef = useRef(false);

  // Transition into God Mode Chat
  const transitionToChat = useCallback(() => {
    if (hasTransitionedRef.current) return;
    hasTransitionedRef.current = true;

    // Clean up player
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    } catch (e) {
      console.debug('[GodModeVideo] Cleanup error ignored:', e);
    }
    playerRef.current = null;

    completeVideoPhase();
    navigate('/god-mode');
  }, [completeVideoPhase, navigate]);

  // Lock background scroll while overlay is active
  useEffect(() => {
    if (active && phase === 'video') {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [active, phase]);

  // Keyboard accessibility: Escape to skip or exit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        transitionToChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [transitionToChat]);

  // Initialize YouTube IFrame Player API
  useEffect(() => {
    if (!active || phase !== 'video') return;

    hasTransitionedRef.current = false;
    setCurrentTime(0);
    setErrorMessage(null);
    setAutoplayBlocked(false);

    let isSubscribed = true;

    const onYouTubeReady = () => {
      if (!isSubscribed || !window.YT || !window.YT.Player) return;

      try {
        const playerElement = document.getElementById('god-mode-yt-iframe');
        if (!playerElement) return;

        playerRef.current = new window.YT.Player('god-mode-yt-iframe', {
          videoId: GOD_MODE_VIDEO_ID,
          playerVars: {
            autoplay: 1,
            mute: 0,
            controls: 0,
            disablekb: 1,
            rel: 0,
            playsinline: 1,
            start: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            fs: 0
          },
          events: {
            onReady: (event) => {
              if (!isSubscribed) return;
              try {
                event.target.unMute();
                event.target.setVolume(100);
                event.target.seekTo(0, true);
                event.target.playVideo();
                setIsMuted(false);
              } catch (err) {
                console.debug('[GodModeVideo] Unmuted playback blocked, falling back to muted:', err);
                try {
                  event.target.mute();
                  event.target.seekTo(0, true);
                  event.target.playVideo();
                  setIsMuted(true);
                } catch (e2) {
                  setAutoplayBlocked(true);
                }
              }
            },
            onStateChange: (event) => {
              if (!isSubscribed) return;
              // YT.PlayerState.PLAYING is 1
              if (event.data === 1) {
                setIsPlaying(true);
                setAutoplayBlocked(false);
                try {
                  if (event.target.isMuted()) {
                    setIsMuted(true);
                  } else {
                    setIsMuted(false);
                  }
                } catch (e) {}
                startTracking();
              } else if (event.data === 0) {
                // Video ended early
                transitionToChat();
              }
            },
            onError: (event) => {
              console.warn('[GodModeVideo] YouTube Player Error:', event.data);
              if (isSubscribed) {
                setErrorMessage('Unable to load the God Mode transition.');
                handleVideoError('Player error code ' + event.data);
              }
            }
          }
        });
      } catch (err) {
        console.warn('[GodModeVideo] Player initialization failed:', err);
        if (isSubscribed) {
          setErrorMessage('Unable to load the God Mode transition.');
        }
      }
    };

    const startTracking = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') {
          return;
        }

        try {
          const time = playerRef.current.getCurrentTime() || 0;
          setCurrentTime(time);

          // EXACT 21-SECOND BOUNDARY TERMINATION
          if (time >= GOD_MODE_DURATION) {
            transitionToChat();
          }
        } catch (e) {
          // Player might be unmounting
        }
      }, 100);
    };

    // Load YouTube API script if not already present
    if (!window.YT || !window.YT.Player) {
      if (!document.getElementById('youtube-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        onYouTubeReady();
      };
    } else {
      onYouTubeReady();
    }

    // Safety timeout: If after 4 seconds nothing started and no error, show Enter button
    const autoplayCheckTimeout = setTimeout(() => {
      if (isSubscribed && !isPlaying && !errorMessage) {
        setAutoplayBlocked(true);
      }
    }, 4000);

    return () => {
      isSubscribed = false;
      clearTimeout(autoplayCheckTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      try {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
        }
      } catch (e) {}
      playerRef.current = null;
    };
  }, [active, phase, transitionToChat, handleVideoError]);

  if (!active || phase !== 'video') {
    return null;
  }

  // Active status message based on currentTime (0-21s)
  const currentMsg = HUD_TIMELINE_MESSAGES.find(
    (m) => currentTime >= m.start && (currentTime < m.end || m.end === GOD_MODE_DURATION)
  ) || HUD_TIMELINE_MESSAGES[HUD_TIMELINE_MESSAGES.length - 1];

  const progressPercent = Math.min(100, (currentTime / GOD_MODE_DURATION) * 100);

  const formattedTime = `00:${String(Math.floor(currentTime)).padStart(2, '0')}`;
  const totalFormattedTime = `00:${String(GOD_MODE_DURATION).padStart(2, '0')}`;

  const toggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (playerRef.current.isMuted()) {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (e) {
      console.debug('[GodModeVideo] toggleMute error:', e);
    }
  };

  const handleManualPlay = () => {
    setAutoplayBlocked(false);
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        setIsMuted(false);
        playerRef.current.playVideo();
      } catch (err) {
        transitionToChat();
      }
    } else {
      transitionToChat();
    }
  };

  return (
    <div className={styles.overlay} ref={containerRef} role="dialog" aria-modal="true" aria-label="God Mode Activation">
      {/* Background Video Player */}
      <div className={styles.videoWrapper}>
        <div id="god-mode-yt-iframe" className={styles.videoIframe} />
      </div>

      <div className={styles.vignette} />

      {/* Top HUD Bar */}
      <div className={styles.topHud}>
        <div className={styles.badgeContainer}>
          <div className={styles.protocolBadge}>
            <span className={styles.pulseDot} />
            <Zap size={14} color="#60a5fa" />
            <span>VIKSHANA 2.0 • GOD MODE ACTIVATION</span>
          </div>

          {context?.caseId && (
            <div className={styles.contextTag}>
              TARGET: CASE #{context.caseId} {context.query ? `| QUERY: "${context.query}"` : ''}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className={styles.skipBtn}
            onClick={toggleMute}
            title={isMuted ? "Click to unmute audio" : "Audio active"}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            style={{
              background: isMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(37, 99, 235, 0.25)',
              borderColor: isMuted ? '#ef4444' : 'rgba(59, 130, 246, 0.5)',
              color: isMuted ? '#fca5a5' : '#93c5fd'
            }}
          >
            {isMuted ? <VolumeX size={15} color="#ef4444" /> : <Volume2 size={15} color="#60a5fa" />}
            <span>{isMuted ? 'Unmute Audio' : 'Audio On'}</span>
          </button>

          <button 
            className={styles.skipBtn}
            onClick={transitionToChat}
            title="Skip intro transition (Esc)"
            aria-label="Skip intro transition"
          >
            <span>Skip Intro</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Center Fallback / Autoplay Prompt */}
      {(errorMessage || videoError) && (
        <div className={styles.fallbackCard}>
          <div className={styles.fallbackIcon}>
            <AlertTriangle size={28} />
          </div>
          <h3 className={styles.fallbackTitle}>Unable to load the God Mode transition.</h3>
          <p className={styles.fallbackDesc}>
            Deep Investigation intelligence engines are ready. Click below to enter God Mode Chat directly.
          </p>
          <button className={styles.enterBtn} onClick={transitionToChat}>
            <Zap size={16} />
            ENTER GOD MODE
          </button>
        </div>
      )}

      {autoplayBlocked && !errorMessage && !videoError && !isPlaying && (
        <div className={styles.fallbackCard}>
          <div className={styles.fallbackIcon}>
            <Play size={28} />
          </div>
          <h3 className={styles.fallbackTitle}>Deep Investigation Protocol Initialized</h3>
          <p className={styles.fallbackDesc}>
            Browser autoplay requires interaction. Click below to begin cinematic activation sequence.
          </p>
          <button className={styles.enterBtn} onClick={handleManualPlay}>
            <Play size={16} fill="white" />
            ▶ ENTER GOD MODE
          </button>
        </div>
      )}

      {/* Bottom HUD Timeline & Telemetry */}
      <div className={styles.bottomHud}>
        <div className={styles.statusContainer}>
          <div className={styles.statusPhase}>
            <Shield size={20} color="#3b82f6" />
            <span>{currentMsg.text}</span>
          </div>
          <div className={styles.statusSubtext}>
            {currentMsg.sub}
          </div>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressTrack} role="progressbar" aria-valuenow={Math.round(progressPercent)} aria-valuemin="0" aria-valuemax="100">
          <div 
            className={styles.progressBar} 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className={styles.timeTelemetry}>
          <span>TIME: {formattedTime} / {totalFormattedTime}</span>
          <span>FPS: 60 • ENCRYPTION: AES-GCM-256</span>
          <span>ORCHESTRATION: 7 ENGINES</span>
        </div>
      </div>
    </div>
  );
};

export default GodModeVideoOverlay;
