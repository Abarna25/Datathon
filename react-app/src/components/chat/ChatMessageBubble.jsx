import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { motion } from 'framer-motion';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Check, Shield, AlertTriangle, Volume2, VolumeX, MoreHorizontal } from 'lucide-react';
import MermaidBlock from './MermaidBlock';
import EvidenceCard from './EvidenceCard';
import FollowUpChips from './FollowUpChips';
import StructuredResponseCard from './StructuredResponseCard';
import 'highlight.js/styles/github.css';
import styles from './ChatMessageBubble.module.css';

const CITATION_REGEX = /\[(Case|Victim|Suspect|Witness|CCTV|PhoneRecord|FinancialTransaction|TimelineEvent|Attachment)\s*#([\w-]+)\]/g;

function injectEvidenceLinks(text) {
    return text.replace(CITATION_REGEX, (full, type, id) => `[${type} #${id}](evidence://${type}/${id})`);
}

function CodeBlock({ inline, className, children }) {
    const langMatch = /language-(\w+)/.exec(className || '');
    const codeText = String(children).replace(/\n$/, '');
    if (!inline && langMatch && langMatch[1] === 'mermaid') {
        return <MermaidBlock chart={codeText} />;
    }
    if (inline) return <code className={className}>{children}</code>;
    return (
        <pre>
            <code className={className}>{children}</code>
        </pre>
    );
}

function parseMessageContent(content, streaming) {
    let text = content || '';
    if (streaming) {
        text += ' [cursor](cursor://)';
    }

    const thinkStart = text.indexOf('<think>');
    if (thinkStart === -1) {
        return { thinking: null, body: injectEvidenceLinks(text), isThinkingComplete: true };
    }

    const thinkEnd = text.indexOf('</think>');
    if (thinkEnd !== -1) {
        const thinking = text.slice(thinkStart + 7, thinkEnd).trim();
        const body = text.slice(thinkEnd + 8).trim();
        return { thinking, body: injectEvidenceLinks(body), isThinkingComplete: true };
    } else {
        const thinking = text.slice(thinkStart + 7).trim();
        return { thinking, body: '', isThinkingComplete: false };
    }
}

const ChatMessageBubble = ({ message, onOpenEvidence, onFollowUp, onRegenerate, isLast, streaming, error }) => {
    const [copied, setCopied] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const isUser = message.role === 'user';

    const { thinking, body } = useMemo(() => {
        return parseMessageContent(message.content, streaming);
    }, [message.content, streaming]);

    const isStructuredContent = false;

    function LinkRenderer({ href, children }) {
        if (href === 'cursor://') {
            return <span className="vik-streaming-cursor" />;
        }
        if (href && href.startsWith('evidence://')) {
            const match = href.match(/^evidence:\/\/([^/]+)\/(.+)$/);
            const [, type, id] = match || [];
            const citation = (message.citations || []).find((c) => c.type === type && String(c.refId) === id) || {
                type,
                refId: id,
                label: `${type} #${id}`
            };
            return (
                <a
                    href="#evidence"
                    className="vik-evidence-link"
                    onClick={(e) => {
                        e.preventDefault();
                        onOpenEvidence(citation);
                    }}
                >
                    {children}
                </a>
            );
        }
        return (
            <a href={href} target="_blank" rel="noreferrer">
                {children}
            </a>
        );
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleReadAloud = () => {
        if (!('speechSynthesis' in window)) {
            // Browser not supported, fail gracefully without alert
            return;
        }
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        let speechText = (body || message.content || '')
            .replace(/\[(Case|Victim|Suspect|Witness|CCTV|PhoneRecord|FinancialTransaction|TimelineEvent|Attachment)\s*#[\w-]+\]/g, '')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/[*#~_-]+/g, ' ')
            .replace(/:\s*/g, ', ')
            .replace(/\n+/g, '. ')
            .trim();

        if (!speechText) return;

        const utterance = new SpeechSynthesisUtterance(speechText);
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find((v) => {
            const name = (v.name || '').toLowerCase();
            return (
                name.includes('female') || name.includes('zira') || name.includes('samantha') ||
                name.includes('victoria') || name.includes('google uk english female') ||
                name.includes('google us english') || name.includes('karen') || name.includes('fiona')
            );
        }) || voices.find((v) => v.lang && v.lang.startsWith('en'));

        if (femaleVoice) utterance.voice = femaleVoice;
        utterance.rate = 0.96;
        utterance.pitch = 1.15;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAssistant}`}
        >
            <div className={styles.bubbleContainer}>
                {/* User Message */}
                {isUser ? (
                    <div className={styles.bubbleUser}>
                        <div className={styles.userText}>{message.content}</div>
                    </div>
                ) : (
                    /* Assistant Message: Clean, cardless style */
                    <div className={styles.bubbleAssistant}>
                        {/* Minimal label */}
                        <div className={styles.assistantLabel}>
                            <Shield size={13} color="#2563EB" />
                            <span>Vikshana AI</span>
                            {message.createdAt && (
                                <span className={styles.timestamp}>
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>

                        {/* Investigating indicator */}
                        {streaming && !body && !thinking && (
                            <div className={styles.investigatingIndicator}>
                                <div className={styles.pulsingDot} />
                                <span>Analyzing case evidence...</span>
                            </div>
                        )}

                        {/* Fake confidence removed as per zero-fabrication mandate */}
                        {/* AI Reasoning Panel */}
                        {thinking && (
                            <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', borderLeft: '3px solid #60a5fa', fontSize: '13px', color: '#94a3b8' }}>
                                <div style={{ fontWeight: '600', marginBottom: '4px', color: '#60a5fa', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>AI Reasoning Log</div>
                                <div style={{ fontStyle: 'italic' }}>{thinking}</div>
                            </div>
                        )}

                        {/* Body */}
                        {body && (
                            <div className="vik-markdown">
                                {isStructuredContent ? (
                                    <StructuredResponseCard content={body} />
                                ) : (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeHighlight]}
                                        components={{ code: CodeBlock, a: LinkRenderer }}
                                    >
                                        {body}
                                    </ReactMarkdown>
                                )}
                            </div>
                        )}

                        {/* Inline Error */}
                        {error && (
                            <div className={styles.inlineErrorBanner}>
                                <AlertTriangle size={14} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Evidence Citations - Enhanced for Trail Transparency */}
                        {!streaming && message.citations && message.citations.length > 0 && (
                            <div className={styles.evidenceRow} style={{ marginTop: '16px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--accent-primary)' }}>
                                <div className={styles.evidenceLabel} style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Shield size={14} color="var(--accent-primary)" />
                                    Evidence Chain (Source of Truth)
                                </div>
                                <div className={styles.evidenceGrid}>
                                    {message.citations.map((c, i) => (
                                        <EvidenceCard key={i} citation={c} onOpen={onOpenEvidence} compact />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hover Actions */}
                        {!streaming && (
                            <div className={styles.actionsBar}>
                                <button type="button" className={styles.actionBtn} onClick={handleCopy} title="Copy">
                                    {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.actionBtn} ${isSpeaking ? styles.active : ''}`}
                                    onClick={handleReadAloud}
                                    title={isSpeaking ? 'Stop' : 'Read aloud'}
                                >
                                    {isSpeaking ? <VolumeX size={12} color="#EF4444" /> : <Volume2 size={12} />}
                                </button>

                                {/* More menu for additional actions */}
                                <div className={styles.moreWrap}>
                                    <button
                                        type="button"
                                        className={styles.actionBtn}
                                        onClick={() => setShowMore(!showMore)}
                                        title="More"
                                    >
                                        <MoreHorizontal size={12} />
                                    </button>
                                    {showMore && (
                                        <div className={styles.moreMenu} onMouseLeave={() => setShowMore(false)}>
                                            <button
                                                type="button"
                                                className={`${feedback === 'up' ? styles.menuActive : ''}`}
                                                onClick={() => { setFeedback('up'); setShowMore(false); }}
                                            >
                                                <ThumbsUp size={12} /> Helpful
                                            </button>
                                            <button
                                                type="button"
                                                className={`${feedback === 'down' ? styles.menuActive : ''}`}
                                                onClick={() => { setFeedback('down'); setShowMore(false); }}
                                            >
                                                <ThumbsDown size={12} /> Not helpful
                                            </button>
                                            {isLast && (
                                                <button type="button" onClick={() => { onRegenerate(); setShowMore(false); }}>
                                                    <RotateCcw size={12} /> Regenerate
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Follow-up Suggestions */}
                        {!streaming && isLast && message.suggestions && message.suggestions.length > 0 && (
                            <FollowUpChips suggestions={message.suggestions} onSelect={onFollowUp} />
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ChatMessageBubble;
