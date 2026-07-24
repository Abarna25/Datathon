import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Pencil, Trash2, FileText, FileJson, Printer, Shield, Check, Menu, Database, FolderSearch } from 'lucide-react';
import { exportAsMarkdown, exportAsJSON, exportAsPDF } from '../../utils/exportConversation';
import * as conversationService from '../../services/conversationService';
import styles from './ChatHeader.module.css';

const ChatHeader = ({
    conversation,
    messages,
    onRename,
    onDelete,
    onToggleMobileSidebar
}) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const [cases, setCases] = useState([]);
    const [casesLoading, setCasesLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setCasesLoading(true);
        conversationService.listCases()
            .then((res) => {
                if (Array.isArray(res)) {
                    setCases(res);
                } else {
                    setCases([]);
                }
            })
            .catch(() => {
                setCases([]);
            })
            .finally(() => setCasesLoading(false));
    }, []);

    if (!conversation) return null;

    const currentTitle = conversation.title || 'New Investigation';
    const currentCaseId = String(conversation.caseId || '');

    const handleCaseChange = (e) => {
        const selectedId = e.target.value;
        if (selectedId && selectedId !== currentCaseId) {
            navigate(`/investigate/${selectedId}`);
        }
    };

    const startEditing = () => {
        setTitleInput(currentTitle);
        setIsEditingTitle(true);
    };

    const saveTitle = () => {
        if (titleInput.trim() && titleInput.trim() !== currentTitle) {
            onRename(conversation.id, titleInput.trim());
        }
        setIsEditingTitle(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') saveTitle();
        else if (e.key === 'Escape') setIsEditingTitle(false);
    };

    const runExport = (format) => {
        setMenuOpen(false);
        if (format === 'md') exportAsMarkdown(conversation, messages);
        else if (format === 'json') exportAsJSON(conversation, messages);
        else if (format === 'pdf') exportAsPDF();
    };

    return (
        <div className={styles.header}>
            <div className={styles.leftGroup}>
                {onToggleMobileSidebar && (
                    <button type="button" className={styles.mobileMenuBtn} onClick={onToggleMobileSidebar} title="Toggle sidebar">
                        <Menu size={18} />
                    </button>
                )}

                <div className={styles.iconWrap}>
                    <Shield size={18} color="#2563EB" />
                </div>

                {/* Case Selector Dropdown Badge */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    marginRight: '8px'
                }}>
                    <FolderSearch size={14} color="#2563EB" />
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Case:</span>
                    <select
                        value={currentCaseId}
                        onChange={handleCaseChange}
                        disabled={casesLoading}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#1E3A8A',
                            fontWeight: '600',
                            fontSize: '13px',
                            outline: 'none',
                            cursor: 'pointer',
                            paddingRight: '4px'
                        }}
                    >
                        {cases.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                                {c.title || `Case #${c.id}`}
                            </option>
                        ))}
                    </select>
                </div>

                {isEditingTitle ? (
                    <div className={styles.inlineEditWrap}>
                        <input
                            autoFocus
                            className={styles.titleInput}
                            value={titleInput}
                            onChange={(e) => setTitleInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={saveTitle}
                        />
                        <button type="button" className={styles.saveBtn} onClick={saveTitle}>
                            <Check size={14} />
                        </button>
                    </div>
                ) : (
                    <div className={styles.titleContainer} onClick={startEditing} title="Click to edit title">
                        <h2 className={styles.title}>{currentTitle}</h2>
                        <Pencil size={13} className={styles.editIcon} />
                    </div>
                )}
            </div>

            <div className={styles.rightGroup}>
                <div className={styles.overflowWrap}>
                    <button type="button" className={styles.iconBtn} onClick={() => setMenuOpen((prev) => !prev)} title="More actions">
                        <MoreVertical size={18} />
                    </button>

                    {menuOpen && (
                        <div className={styles.dropdownMenu} onMouseLeave={() => setMenuOpen(false)}>
                            <button type="button" onClick={() => { setMenuOpen(false); startEditing(); }}>
                                <Pencil size={14} /> Rename Investigation
                            </button>
                            <button type="button" onClick={() => runExport('md')}>
                                <FileText size={14} /> Export Markdown (.md)
                            </button>
                            <button type="button" onClick={() => runExport('json')}>
                                <FileJson size={14} /> Export JSON (.json)
                            </button>
                            <button type="button" onClick={() => runExport('pdf')}>
                                <Printer size={14} /> Print / Export PDF
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    setMenuOpen(false);
                                    try {
                                        const conversationService = require('../../services/conversationService');
                                        await conversationService.seedDatabase();
                                        alert('Sample case evidence seeded into Catalyst Data Store!');
                                        window.location.reload();
                                    } catch (e) {
                                        alert('Failed to seed database.');
                                    }
                                }}
                            >
                                <Database size={14} /> Seed Sample Case Evidence
                            </button>
                            <div className={styles.menuDivider} />
                            <button
                                type="button"
                                className={styles.deleteOption}
                                onClick={() => {
                                    setMenuOpen(false);
                                    if (window.confirm('Delete this investigation thread?')) {
                                        onDelete(conversation.id);
                                    }
                                }}
                            >
                                <Trash2 size={14} /> Delete Investigation
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatHeader;
