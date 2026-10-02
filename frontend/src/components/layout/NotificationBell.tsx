import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { getSocket } from '@/services/socket';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/notificationApi';
import type { NotificationItem } from '@/services/notificationApi';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const refresh = () => {
    listNotifications().then((res) => {
      setItems(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    });
  };

  useEffect(() => {
    refresh();
    const socket = getSocket();
    const onNotification = (n: NotificationItem) => {
      setItems((prev) => [n, ...prev].slice(0, 20));
      setUnreadCount((c) => c + 1);
    };
    socket.on('notification', onNotification);
    return () => {
      socket.off('notification', onNotification);
    };
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const onOpen = () => {
    setOpen((v) => !v);
    if (!open) refresh();
  };

  const onItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markNotificationRead(item._id).catch(() => {});
      setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, isRead: true } : i)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  const onMarkAllRead = async () => {
    await markAllNotificationsRead().catch(() => {});
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative z-50" ref={panelRef}>
      <button
        onClick={onOpen}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/80 hover:bg-black/5"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-route px-1 text-[10px] font-bold text-ink"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-paper-line bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-paper-line px-4 py-3">
              <span className="text-sm font-semibold text-ink">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={onMarkAllRead} className="text-xs font-medium text-route-dim hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-slate">No notifications yet.</p>
              ) : (
                items.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => onItemClick(item)}
                    className={`block w-full border-b border-paper-line px-4 py-3 text-left last:border-0 hover:bg-black/5 ${
                      item.isRead ? '' : 'bg-route/5'
                    }`}
                  >
                    <p className="text-sm font-medium text-ink">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate line-clamp-2">{item.message}</p>
                    <p className="mt-1 text-[10px] text-slate">{timeAgo(item.createdAt)}</p>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
