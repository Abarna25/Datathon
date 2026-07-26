import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import {
    MoreVertical, Pencil, Trash2, FileText, FileJson, Printer,
    Shield, Check, ChevronDown, ChevronUp, Users, Target,
    Database, FolderSearch, Eye
} from 'lucide-react';
import { exportAsMarkdown, exportAsJSON, exportAsPDF } from '../../utils/exportConversation';
import * as conversationService from '../../services/conversationService';
import styles from './ChatHeader.module.css';

const ChatHeader = ({
    conversation,
    conversations,
    activeConversationId,
    onSelect,
    onNew,
    messages,
    onRename,
    onDelete,
    onToggleMobileSidebar,
    bundle
}) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const [cases, setCases] = useState([]);
    const [casesLoading, setCasesLoading] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { setActiveCaseId } = useAppContext();
    const navigate = useNavigate();

    useEffect(() => {
        setCasesLoading(true);
        conversationService.listCases()
            .then((res) => {
                if (Array.isArray(res)) setCases(res);
                else setCases([]);
            })
            .catch(() => setCases([]))
            .finally(() => setCasesLoading(false));
    }, []);

    if (!conversation) return null;

    const currentTitle = conversation.title || 'New Investigation';
    const currentCaseId = String(conversation.caseId || '');

    const fir = bundle?.firSummary || {};
    const isGlobal = currentCaseId === 'global';
    const crime = isGlobal ? 'Global Database Scope' : (fir.crime || bundle?.category || 'General');
    const station = fir.policeStation || bundle?.policeStation || '';
    const victimsCount = fir.victimsCount ?? (bundle?.victims?.length || 0);
    const suspectsCount = fir.suspectsCount ?? (bundle?.suspects?.length || 0);
    const evidenceCount = fir.evidenceCount ?? (bundle?.evidence?.length || 0);
    const witnessesCount = bundle?.witnesses?.length || 0;

    const handleCaseChange = (e) => {
        const selectedId = e.target.value;
        if (selectedId && selectedId !== currentCaseId) {
            setActiveCaseId(selectedId);
            navigate(`/investigate`);
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
        <div className={styles.headerWrapper}>
            {/* Primary Header Bar - Single Compact Line */}
            <div className={styles.header}>
                <div className={styles.leftGroup}>
                    <div className={styles.iconWrap}>
                        <Shield size={15} color="#2563EB" />
                    </div>



                    {/* Crime Type + Station */}
                    <span className={styles.crimeType}>{crime}</span>
                    {station && (
                        <>
                            <span className={styles.separator}>•</span>
                            <span className={styles.station}>{station}</span>
                        </>
                    )}

                    {/* Metadata Pills */}
                    <div className={styles.metaPills}>
                        <span className={styles.pill}>
                            <Users size={11} /> {victimsCount} Victim{victimsCount !== 1 ? 's' : ''}
                        </span>
                        <span className={styles.pill}>
                            <Target size={11} /> {suspectsCount} Suspect{suspectsCount !== 1 ? 's' : ''}
                        </span>
                        <span className={styles.pill}>
                            <Database size={11} /> {evidenceCount} Evidence
                        </span>
                        <span className={styles.pill}>
                            <Eye size={11} /> {witnessesCount} Witness{witnessesCount !== 1 ? 'es' : ''}
                        </span>
                    </div>
                </div>

                <div className={styles.rightGroup}>


                    {/* Title (editable) */}
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
                                <Check size={13} />
                            </button>
                        </div>
                    ) : (
                        <div className={styles.titleContainer} onClick={startEditing} title="Click to edit title">
                            <span className={styles.title}>{currentTitle}</span>
                            <Pencil size={11} className={styles.editIcon} />
                        </div>
                    )}

                    {/* More Menu */}
                    <div className={styles.overflowWrap}>
                        <button type="button" className={styles.iconBtn} onClick={() => setMenuOpen((prev) => !prev)} title="More actions">
                            <MoreVertical size={16} />
                        </button>
                        {menuOpen && (
                            <div className={styles.dropdownMenu} onMouseLeave={() => setMenuOpen(false)}>
                                <button type="button" onClick={() => { setMenuOpen(false); startEditing(); }}>
                                    <Pencil size={13} /> Rename
                                </button>
                                <button type="button" onClick={() => runExport('md')}>
                                    <FileText size={13} /> Export Markdown
                                </button>
                                <button type="button" onClick={() => runExport('json')}>
                                    <FileJson size={13} /> Export JSON
                                </button>
                                <button type="button" onClick={() => runExport('pdf')}>
                                    <Printer size={13} /> Print / PDF
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
                                    <Trash2 size={13} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Expandable Investigation Details Drawer */}
            <button
                type="button"
                className={styles.drawerToggle}
                onClick={() => setDrawerOpen(!drawerOpen)}
            >
                <span>Investigation Details</span>
                {drawerOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {drawerOpen && (
                <div className={styles.drawer}>
                    <div className={styles.drawerGrid}>
                        <div className={styles.drawerField}>
                            <span className={styles.drawerLabel}>Crime Type</span>
                            <span className={styles.drawerValue}>{crime}</span>
                        </div>
                        <div className={styles.drawerField}>
                            <span className={styles.drawerLabel}>Date</span>
                            <span className={styles.drawerValue}>{fir.date || bundle?.date || '—'}</span>
                        </div>
                        <div className={styles.drawerField}>
                            <span className={styles.drawerLabel}>Police Station</span>
                            <span className={styles.drawerValue}>{station || '—'}</span>
                        </div>
                        <div className={styles.drawerField}>
                            <span className={styles.drawerLabel}>Officer</span>
                            <span className={styles.drawerValue}>{fir.officer || bundle?.officer || '—'}</span>
                        </div>
                        <div className={styles.drawerField}>
                            <span className={styles.drawerLabel}>FIR Number</span>
                            <span className={styles.drawerValue}>{fir.firNumber || currentCaseId}</span>
                        </div>
                        <div className={styles.drawerField}>
                            <span className={styles.drawerLabel}>Status</span>
                            <span className={styles.drawerValue}>{fir.status || 'Active'}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatHeader;
