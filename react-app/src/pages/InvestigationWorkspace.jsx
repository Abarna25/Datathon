import React, { useCallback, useEffect, useState } from 'react';
import { ConversationProvider, useConversationContext } from '../context/ConversationContext';
import ChatHeader from '../components/chat/ChatHeader';
import ChatMessageList from '../components/chat/ChatMessageList';
import ChatInput from '../components/chat/ChatInput';
import ContextPanel from '../components/chat/ContextPanel';
import EvidenceModal from '../components/chat/EvidenceModal';
import { resolveSlashCommand, SLASH_COMMANDS } from '../utils/slashCommands';
import * as conversationService from '../services/conversationService';
import { exportAsMarkdown } from '../utils/exportConversation';
import { useAppContext } from '../context/AppContext';
import styles from './InvestigationWorkspace.module.css';
import { Loader2, Plus, MessageSquare, Trash2 } from 'lucide-react';

const HELP_TEXT = `**Available commands**\n\n${SLASH_COMMANDS.map((c) => `- \`${c.command}\` — ${c.description}`).join('\n')}`;

const InvestigationChat = ({ caseId }) => {
    const { currentCase } = useAppContext();
    const {
        conversations,
        activeConversationId,
        messages,
        loading,
        selectConversation,
        startNewConversation,
        renameConversation,
        toggleBookmark,
        archiveConversation,
        removeConversation,
        appendMessage,
        send,
        stopGeneration,
        regenerate,
        isStreaming,
        streamedText,
        error
    } = useConversationContext();

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [contextCollapsed, setContextCollapsed] = useState(true);
    const [contextRefreshKey, setContextRefreshKey] = useState(0);
    const [evidenceModal, setEvidenceModal] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!activeConversationId && conversations.length > 0) {
            selectConversation(conversations[0].id);
        }
    }, [conversations, activeConversationId, selectConversation]);

    useEffect(() => {
        setContextRefreshKey((k) => k + 1);
    }, [messages.length]);

    const ensureConversation = useCallback(async () => {
        if (activeConversationId) return activeConversationId;
        const convo = await startNewConversation();
        return convo?.id || `CONV-${Date.now()}`;
    }, [activeConversationId, startNewConversation]);

    const handleSend = useCallback(
        async (text) => {
            if (!text || !text.trim()) return;
            const conversationId = await ensureConversation();
            send(text.trim(), conversationId);
        },
        [ensureConversation, send]
    );

    const executeResolved = useCallback(
        async (resolved) => {
            if (resolved.type === 'chat') {
                handleSend(resolved.prompt);
                return;
            }

            const conversationId = await ensureConversation();

            if (resolved.action === 'help') {
                appendMessage({ id: `local-${Date.now()}`, role: 'assistant', content: HELP_TEXT, citations: [], suggestions: [] });
            } else if (resolved.action === 'reset') {
                await archiveConversation(conversationId, true);
                await startNewConversation();
            } else if (resolved.action === 'export') {
                const convo = conversations.find((c) => c.id === conversationId) || { title: 'Investigation Chat', caseId };
                exportAsMarkdown(convo, messages);
            } else if (resolved.action === 'report') {
                appendMessage({ id: `local-${Date.now()}`, role: 'assistant', content: '_Generating a court-ready report..._', citations: [], suggestions: [] });
                try {
                    const result = await conversationService.generateCaseReport(caseId);
                    appendMessage({ id: `local-${Date.now() + 1}`, role: 'assistant', content: result.markdown, citations: [], suggestions: [] });
                } catch (err) {
                    console.debug('Report generation failed', err);
                    appendMessage({ id: `local-${Date.now() + 2}`, role: 'assistant', content: 'Report generation failed. Please try again.', citations: [], suggestions: [] });
                }
            }
        },
        [handleSend, ensureConversation, appendMessage, archiveConversation, startNewConversation, conversations, caseId, messages]
    );

    const handleRawSend = useCallback(
        (text) => {
            const resolved = resolveSlashCommand(text);
            if (!resolved) {
                handleSend(text);
                return;
            }
            executeResolved(resolved);
        },
        [handleSend, executeResolved]
    );

    const runQuickAction = useCallback(
        (qa) => {
            if (qa.command) {
                const resolved = resolveSlashCommand(qa.command);
                if (resolved) executeResolved(resolved);
            } else if (qa.prompt) {
                handleSend(qa.prompt);
            }
        },
        [executeResolved, handleSend]
    );

    const handleFilesSelected = useCallback(
        async (files) => {
            const conversationId = await ensureConversation();
            setUploading(true);
            try {
                // eslint-disable-next-line no-restricted-syntax
                for (const file of files) {
                    // eslint-disable-next-line no-await-in-loop
                    await conversationService.uploadAttachment(conversationId, caseId, file);
                }
                handleSend(
                    `I've uploaded ${files.length === 1 ? `"${files[0].name}"` : `${files.length} files`}. Please review and summarize the key investigative insights from it.`
                );
            } catch (err) {
                console.debug('Upload failed', err);
                appendMessage({ id: `local-${Date.now()}`, role: 'assistant', content: 'The file upload failed. Please try again.', citations: [], suggestions: [] });
            } finally {
                setUploading(false);
            }
        },
        [ensureConversation, caseId, handleSend, appendMessage]
    );

    return (
        <div className={styles.page}>
            {/* Left Sidebar: Conversation List */}
            <div className={styles.sidebar} data-vik-no-print>
                <div className={styles.sidebarHeader}>
                    <button className={styles.newChatBtn} onClick={startNewConversation}>
                        <Plus size={16} /> New Investigation Chat
                    </button>
                </div>
                
                <div className={styles.conversationList}>
                    {conversations.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                            Start your first investigation conversation.
                        </div>
                    )}
                    {conversations.map((c) => (
                        <div 
                            key={c.id} 
                            className={`${styles.conversationItem} ${c.id === activeConversationId ? styles.conversationItemActive : ''}`}
                            onClick={() => selectConversation(c.id)}
                        >
                            <div className={styles.conversationTitle}>
                                <MessageSquare size={14} />
                                {c.title || 'Investigation Chat'}
                            </div>
                            <button 
                                className={styles.deleteBtn} 
                                onClick={(e) => { e.stopPropagation(); removeConversation(c.id); }}
                                title="Delete Conversation"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Center Area: AI Investigation Copilot */}
            <div className={styles.center} data-vik-print-area>
                {/* Compact Sticky Investigation Header */}
                <div data-vik-no-print>
                    <ChatHeader
                        conversation={conversations.find((c) => c.id === activeConversationId)}
                        activeConversationId={activeConversationId}
                        messages={messages}
                        onRename={renameConversation}
                        onToggleBookmark={toggleBookmark}
                        bundle={currentCase}
                    />
                </div>

                {/* Message List */}
                <div className={styles.messages}>
                    <ChatMessageList
                        messages={messages}
                        isStreaming={isStreaming}
                        streamedText={streamedText}
                        onOpenEvidence={setEvidenceModal}
                        onFollowUp={handleSend}
                        onRegenerate={regenerate}
                    />
                </div>


                {uploading && <div className={styles.uploadBanner} data-vik-no-print>Uploading &amp; analyzing files...</div>}

                {/* Input Area */}
                <div data-vik-no-print>
                    <ChatInput
                        onSend={handleRawSend}
                        onRunQuickAction={runQuickAction}
                        onFilesSelected={handleFilesSelected}
                        isStreaming={isStreaming}
                        onStop={stopGeneration}
                        disabled={loading || uploading}
                    />
                </div>
            </div>

            {/* Right Sidebar: Case Context Accordion Panel */}
            <div data-vik-no-print className={contextCollapsed ? styles.contextCollapsed : styles.contextExpanded}>
                <ContextPanel
                    caseId={caseId}
                    collapsed={contextCollapsed}
                    onToggle={() => setContextCollapsed((v) => !v)}
                    refreshKey={contextRefreshKey}
                />
            </div>

            <EvidenceModal citation={evidenceModal} onClose={() => setEvidenceModal(null)} />
        </div>
    );
};

const InvestigationWorkspace = () => {
    const { activeCaseId, loadingCases } = useAppContext();

    if (loadingCases) {
        return (
            <div className={styles.loadingState}>
                <Loader2 size={36} className="spin" color="var(--accent-primary)" />
                <p>Loading active case bundle...</p>
            </div>
        );
    }

    const effectiveCaseId = activeCaseId || 'global';

    return (
        <ConversationProvider caseId={effectiveCaseId}>
            <InvestigationChat caseId={effectiveCaseId} />
        </ConversationProvider>
    );
};

export default InvestigationWorkspace;
