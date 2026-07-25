import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, MessageSquare, ChevronLeft, ChevronRight, User, Trash2, Pencil } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import styles from './ChatSidebar.module.css';

const groupThreadsByRecency = (threads, query) => {
    const filtered = threads.filter((t) =>
        (t.title || 'New Investigation').toLowerCase().includes(query.toLowerCase())
    );

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;

    const today = [];
    const previous7Days = [];
    const older = [];

    filtered.forEach((t) => {
        const time = t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now();
        if (time >= todayStart) today.push(t);
        else if (time >= sevenDaysAgo) previous7Days.push(t);
        else older.push(t);
    });

    return { today, previous7Days, older };
};

const ChatSidebar = ({
    conversations = [],
    activeConversationId,
    onSelect,
    onNew,
    onRename,
    onDelete,
    collapsed,
    onToggleCollapse
}) => {
    const { officer } = useAppContext();
    const [query, setQuery] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');

    const grouped = useMemo(
        () => groupThreadsByRecency(conversations, query),
        [conversations, query]
    );

    const commitRename = (id) => {
        if (editTitle.trim()) onRename(id, editTitle.trim());
        setEditingId(null);
    };

    const renderThreadItem = (c) => {
        const isActive = c.id === activeConversationId;
        const isEditing = editingId === c.id;

        return (
            <div
                key={c.id}
                className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
                onClick={() => onSelect(c.id)}
            >
                {isActive && <div className={styles.activeAccentBar} />}
                <MessageSquare size={14} className={isActive ? styles.iconActive : styles.iconMuted} />
                
                {isEditing ? (
                    <input
                        autoFocus
                        className={styles.renameInput}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.key === 'Enter' && commitRename(c.id)}
                        onBlur={() => commitRename(c.id)}
                    />
                ) : (
                    <span className={styles.itemTitle}>{c.title || 'New Investigation'}</span>
                )}

                <div className={styles.itemActions} onClick={(e) => e.stopPropagation()}>
                    <button type="button" title="Rename" onClick={() => { setEditingId(c.id); setEditTitle(c.title || 'New Investigation'); }}>
                        <Pencil size={11} />
                    </button>
                    <button type="button" title="Delete" onClick={() => onDelete(c.id)}>
                        <Trash2 size={11} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 52 : 240 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}
        >
            <button
                type="button"
                className={styles.collapseToggleBtn}
                onClick={onToggleCollapse}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div className={styles.topSection}>
                <button type="button" className={styles.newBtn} onClick={onNew} title="New Investigation">
                    <Plus size={16} />
                    {!collapsed && <span>New Investigation</span>}
                </button>
            </div>

            {!collapsed && (
                <>
                    <div className={styles.searchBox}>
                        <Search size={13} className={styles.searchIcon} />
                        <input
                            placeholder="Search..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <div className={styles.listContainer}>
                        {grouped.today.length > 0 && (
                            <div className={styles.group}>
                                <div className={styles.groupTitle}>Today</div>
                                {grouped.today.map(renderThreadItem)}
                            </div>
                        )}
                        {grouped.previous7Days.length > 0 && (
                            <div className={styles.group}>
                                <div className={styles.groupTitle}>Previous 7 Days</div>
                                {grouped.previous7Days.map(renderThreadItem)}
                            </div>
                        )}
                        {grouped.older.length > 0 && (
                            <div className={styles.group}>
                                <div className={styles.groupTitle}>Older</div>
                                {grouped.older.map(renderThreadItem)}
                            </div>
                        )}
                        {conversations.length === 0 && (
                            <div className={styles.emptyHint}>No past investigations yet.</div>
                        )}
                    </div>

                    <div className={styles.userProfileSection}>
                        <div className={styles.userAvatar}>
                            <User size={14} color="#2563EB" />
                        </div>
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>{officer?.name || 'Officer'}</div>
                            <div className={styles.userRole}>Lead Investigator</div>
                        </div>
                    </div>
                </>
            )}
        </motion.aside>
    );
};

export default ChatSidebar;
