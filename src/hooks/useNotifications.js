// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from "react";
import {
  getNotificationsCount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/student";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);

  // Загружаем счётчик каждые 30 секунд
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getNotificationsCount();
        setUnreadCount(data.unread_count ?? 0);
      } catch {}
    };
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const loadAll = useCallback(async () => {
    const data = await getNotifications();
    setNotifications(data);
    setUnreadCount(data.filter((n) => !n.is_read).length);
  }, []);

  const markRead = useCallback(async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, loadAll, markRead, markAllRead };
}
