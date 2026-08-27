import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Check, 
  Inbox
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import styles from './NotificationCenter.module.css';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'critical',
    title: 'Contradiction Alert Detected',
    message: 'AI identified a discrepancy between Occurrence Time and Statement records for FIR #100110486202100001.',
    time: '2m ago',
    unread: true,
    tag: 'Critical Alert',
    actionPath: '/investigate'
  },
  {
    id: 'notif-2',
    type: 'warning',
    title: 'Accused Surrender Logged',
    message: 'Accused ID 1 surrendered at Station 405. Case Master data store synchronized.',
    time: '15m ago',
    unread: true,
    tag: 'Case Update',
    actionPath: '/investigate'
  },
  {
    id: 'notif-3',
    type: 'info',
    title: 'Intelligence Ledger Ready',
    message: 'AI Copilot compiled multi-source correlation ledger with 6 citations for active case.',
    time: '1h ago',
    unread: true,
    tag: 'AI Copilot',
    actionPath: '/investigate'
  },
  {
    id: 'notif-4',
    type: 'success',
    title: 'Pattern Correlation Found',
    message: 'Cross-jurisdiction MO matched 3 cyber stalking FIRs across Davanagere and Ballari.',
    time: '3h ago',
    unread: false,
    tag: 'Intelligence',
    actionPath: '/fir-narratives'
  },
  {
    id: 'notif-5',
    type: 'info',
    title: 'Catalyst Datastore Sync',
    message: '100% of live CaseMaster, Victim, and Accused records indexed in local cache.',
    time: '5h ago',
    unread: false,
    tag: 'System',
    actionPath: '/database'
  }
];

const NotificationCenter = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('vikshana_notifications');
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  const wrapperRef = useRef(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vikshana_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.debug('Failed to save notifications', e);
    }
  }, [notifications]);

  // Click outside and Escape key listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = (e) => {
    e?.stopPropagation();
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const deleteNotification = (e, id) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = (e) => {
    e?.stopPropagation();
    setNotifications([]);
  };

  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    setIsOpen(false);
    if (n.actionPath) {
      navigate(n.actionPath);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return n.unread;
    if (filter === 'critical') return n.type === 'critical' || n.type === 'warning';
    if (filter === 'updates') return n.tag === 'Case Update' || n.tag === 'System';
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'critical':
        return <ShieldAlert size={16} />;
      case 'warning':
        return <AlertTriangle size={16} />;
      case 'success':
        return <CheckCircle2 size={16} />;
      default:
        return <Sparkles size={16} />;
    }
  };

  const getIconClass = (type) => {
    switch (type) {
      case 'critical':
        return styles.iconCritical;
      case 'warning':
        return styles.iconWarning;
      case 'success':
        return styles.iconSuccess;
      default:
        return styles.iconInfo;
    }
  };

  const getTagClass = (type) => {
    switch (type) {
      case 'critical':
        return styles.tagCritical;
      case 'warning':
        return styles.tagWarning;
      case 'success':
        return styles.tagSuccess;
      default:
        return styles.tagInfo;
    }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={`${styles.bellButton} ${isOpen ? styles.bellButtonActive : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open notifications"
        title={t('navbar.notifications', 'Notifications')}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="dialog" aria-modal="true">
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <span>{t('navbar.notifications', 'Notifications')}</span>
              {unreadCount > 0 && (
                <span className={styles.headerBadge}>
                  {unreadCount} {t('navbar.new', 'new')}
                </span>
              )}
            </div>
            <div className={styles.headerActions}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <Check size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {t('navbar.markAllRead', 'Mark all read')}
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className={styles.filterTabs}>
            <button
              type="button"
              className={`${styles.filterTab} ${filter === 'all' ? styles.filterTabActive : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              className={`${styles.filterTab} ${filter === 'unread' ? styles.filterTabActive : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              className={`${styles.filterTab} ${filter === 'critical' ? styles.filterTabActive : ''}`}
              onClick={() => setFilter('critical')}
            >
              Critical
            </button>
            <button
              type="button"
              className={`${styles.filterTab} ${filter === 'updates' ? styles.filterTabActive : ''}`}
              onClick={() => setFilter('updates')}
            >
              Updates
            </button>
          </div>

          {/* Notification List */}
          <div className={styles.list}>
            {filteredNotifications.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Inbox size={22} />
                </div>
                <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>
                  No notifications found
                </div>
                <div style={{ fontSize: '11.5px', maxWidth: '220px' }}>
                  {filter === 'unread' 
                    ? "You're all caught up! No unread notifications."
                    : 'No intelligence or operational alerts matching this filter.'}
                </div>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`${styles.item} ${n.unread ? styles.itemUnread : ''}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className={`${styles.iconWrapper} ${getIconClass(n.type)}`}>
                    {getIcon(n.type)}
                  </div>
                  <div className={styles.content}>
                    <div className={styles.itemHeader}>
                      <span className={styles.title}>{n.title}</span>
                      <span className={styles.time}>{n.time}</span>
                    </div>
                    <p className={styles.message}>{n.message}</p>
                    <div className={styles.tags}>
                      <span className={`${styles.tag} ${getTagClass(n.type)}`}>
                        {n.tag}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => deleteNotification(e, n.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      opacity: 0.6,
                      transition: 'opacity 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                    title="Dismiss"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className={styles.footer}>
              <span className={styles.footerText}>
                {notifications.length} total alert{notifications.length !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                className={styles.footerAction}
                onClick={clearAll}
              >
                Clear all alerts
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
