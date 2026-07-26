import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff, Check, Loader2, X } from 'lucide-react';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notification/hooks/useNotifications';
import { useToast } from '@/lib/toast/toast-context';
import type { AppNotification } from '@/features/notification/types';

type NotificationTab = 'All' | 'Unread' | 'Scans' | 'Issues' | 'System';

const TABS: { value: NotificationTab; labelKey: string }[] = [
  { value: 'All', labelKey: 'NOTIFICATION.TAB_ALL' },
  { value: 'Unread', labelKey: 'NOTIFICATION.TAB_UNREAD' },
  { value: 'Scans', labelKey: 'NOTIFICATION.TAB_SCANS' },
  { value: 'Issues', labelKey: 'NOTIFICATION.TAB_ISSUES' },
  { value: 'System', labelKey: 'NOTIFICATION.TAB_SYSTEM' },
];

const PAGE_SIZE = 5;

function useTimeAgo() {
  const { t } = useTranslation();
  return (value: string): string => {
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) {
      return t('NOTIFICATION.JUST_NOW');
    }
    const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(seconds / 86400);

    if (minutes < 1) {
      return t('NOTIFICATION.JUST_NOW');
    }
    if (minutes < 60) {
      return t('NOTIFICATION.MINUTES_AGO', { count: minutes });
    }
    if (hours < 24) {
      return t('NOTIFICATION.HOURS_AGO', { count: hours });
    }
    return t('NOTIFICATION.DAYS_AGO', { count: days });
  };
}

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const timeAgo = useTimeAgo();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>('All');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = useMemo(() => data ?? [], [data]);
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const visible = useMemo(() => {
    let filtered = notifications;
    if (activeTab === 'Unread') {
      filtered = filtered.filter((item) => !item.isRead);
    } else if (activeTab !== 'All') {
      filtered = filtered.filter((item) => item.type === activeTab);
    }
    return filtered
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, displayCount);
  }, [activeTab, displayCount, notifications]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function selectTab(tab: NotificationTab) {
    setActiveTab(tab);
    setDisplayCount(PAGE_SIZE);
  }

  function consume(notification: AppNotification) {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
  }

  function openTarget(notification: AppNotification) {
    consume(notification);
    setIsOpen(false);

    if (notification.type === 'Issues') {
      if (!notification.relatedIssueId) {
        showToast({
          tone: 'error',
          title: t('NOTIFICATION.CANNOT_OPEN_ISSUE'),
        });
        return;
      }
      navigate(`/issuedetail/${notification.relatedIssueId}`);
      return;
    }

    if (notification.type === 'Scans') {
      if (!notification.relatedScanId) {
        showToast({ tone: 'error', title: t('NOTIFICATION.CANNOT_OPEN_SCAN') });
        return;
      }
      navigate(`/scanresult/${notification.relatedScanId}`);
      return;
    }

    const title = notification.title ?? '';
    if (title.includes('Generate') || title.includes('Report')) {
      navigate('/reporthistory');
      return;
    }
    if (title.includes('Quality Gate')) {
      if (notification.relatedProjectId) {
        navigate(`/detailrepo/${notification.relatedProjectId}`);
      } else {
        showToast({
          tone: 'error',
          title: t('NOTIFICATION.CANNOT_OPEN_PROJECT'),
        });
      }
      return;
    }
    if (notification.relatedIssueId) {
      navigate(`/issuedetail/${notification.relatedIssueId}`);
      return;
    }
    if (notification.relatedScanId) {
      navigate(`/scanresult/${notification.relatedScanId}`);
      return;
    }
    if (notification.relatedProjectId) {
      navigate(`/detailrepo/${notification.relatedProjectId}`);
      return;
    }
    showToast({ tone: 'info', title: t('NOTIFICATION.NO_DETAILS') });
  }

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 20) {
      setDisplayCount((count) => count + PAGE_SIZE);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={t('NOTIFICATION.TITLE')}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted transition-colors hover:text-fg active:scale-95"
      >
        <Bell size={16} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 font-mono text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-11 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-xl shadow-black/10">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <p className="flex-1 text-sm font-semibold text-fg">{t('NOTIFICATION.TITLE')}</p>
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary-subtle disabled:cursor-not-allowed disabled:text-faint disabled:hover:bg-transparent"
            >
              <Check size={12} />
              {t('NOTIFICATION.MARK_ALL_READ')}
            </button>
            <button
              type="button"
              aria-label={t('COMMON.CLOSE')}
              onClick={() => setIsOpen(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1 border-b border-border px-3 py-2">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => selectTab(tab.value)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  activeTab === tab.value
                    ? 'bg-primary-subtle text-primary'
                    : 'text-muted hover:bg-surface-2 hover:text-fg'
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          <div className="max-h-80 overflow-y-auto" onScroll={handleScroll}>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-xs text-muted">
                <Loader2 size={14} className="animate-spin" />
                {t('COMMON.LOADING')}
              </div>
            ) : null}

            {isError ? (
              <p className="px-4 py-10 text-center text-xs text-danger">
                {t('NOTIFICATION.LOAD_ERROR')}
              </p>
            ) : null}

            {!isLoading && !isError && visible.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <BellOff size={20} className="text-faint" />
                <p className="text-xs text-muted">{t('NOTIFICATION.EMPTY')}</p>
              </div>
            ) : null}

            {visible.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => openTarget(notification)}
                className={`flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-2 ${
                  notification.isRead ? '' : 'bg-primary-subtle/40'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      notification.isRead ? 'bg-transparent' : 'bg-primary'
                    }`}
                  />
                  <span className="min-w-0 flex-1 text-xs font-semibold text-fg">
                    {notification.title}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-faint">
                    {timeAgo(notification.createdAt)}
                  </span>
                </div>
                <p className="pl-3.5 text-[11px] leading-relaxed text-muted">
                  {notification.message}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
