import React, { useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';
import ChatMessageBubble from './ChatMessageBubble';
import styles from './ChatMessageList.module.css';

const EMPTY_CAPABILITIES = [
    { icon: '📋', text: 'Analyze FIRs' },
    { icon: '🕒', text: 'Generate Timelines' },
    { icon: '🔍', text: 'Cross-check Statements' },
    { icon: '⚠️', text: 'Find Contradictions' },
    { icon: '📄', text: 'Search Evidence' },
    { icon: '📑', text: 'Draft Reports' },
];

const ChatMessageList = ({ messages, isStreaming, streamedText, onOpenEvidence, onFollowUp, onRegenerate }) => {
    const bottomRef = useRef(null);
    const prevMessagesLength = useRef(messages.length);

    useEffect(() => {
        if (bottomRef.current) {
            const container = bottomRef.current.closest(`.${styles.list}`)?.parentElement;
            const hasNewMessage = messages.length !== prevMessagesLength.current;
            prevMessagesLength.current = messages.length;

            if (container) {
                const { scrollTop, scrollHeight, clientHeight } = container;
                const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
                if (hasNewMessage || isNearBottom) {
                    bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
                }
            } else {
                bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
            }
        }
    }, [messages, streamedText]);

    let lastAssistantIndex = -1;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
        if (messages[i].role === 'assistant') {
            lastAssistantIndex = i;
            break;
        }
    }

    if (messages.length === 0 && !isStreaming) {
        return (
            <div className={styles.empty}>
                <div className={styles.emptyIcon}>
                    <Shield size={32} color="#2563EB" />
                </div>
                <h2 className={styles.emptyTitle}>Vikshana Investigation Assistant</h2>
                <div className={styles.capabilitiesGrid}>
                    {EMPTY_CAPABILITIES.map((cap) => (
                        <div key={cap.text} className={styles.capabilityPill}>
                            <span>{cap.icon}</span>
                            <span>{cap.text}</span>
                        </div>
                    ))}
                </div>
                <p className={styles.emptyHint}>Ask anything about this investigation...</p>
            </div>
        );
    }

    return (
        <div className={styles.list}>
            {messages.map((m, i) => (
                <ChatMessageBubble
                    key={m.id || i}
                    message={m}
                    isLast={i === lastAssistantIndex && !isStreaming}
                    onOpenEvidence={onOpenEvidence}
                    onFollowUp={onFollowUp}
                    onRegenerate={onRegenerate}
                />
            ))}

            {isStreaming && (
                <ChatMessageBubble
                    message={{ role: 'assistant', content: streamedText || '' }}
                    isLast={false}
                    onOpenEvidence={onOpenEvidence}
                    onFollowUp={onFollowUp}
                    onRegenerate={onRegenerate}
                    streaming
                />
            )}
            {isStreaming && !streamedText && (
                <div className={styles.thinking}>
                    <div className={styles.thinkingPulse} />
                    <span>Analyzing case evidence</span>
                    <span className={styles.dots}>
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                    </span>
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    );
};

export default ChatMessageList;
