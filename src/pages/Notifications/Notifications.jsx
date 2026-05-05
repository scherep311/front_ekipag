// src/pages/Notifications/Notifications.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Notifications.css";
import { getNotifications, markAllNotificationsRead } from "../../api/student";

const TYPE_CONFIG = {
  booking_new:    { label: "Новая запись!",         emoji: "🔔" },
  booking_cancel: { label: "Отмена занятия!",        emoji: "❌" },
  reminder_24h:   { label: "Предстоящее занятие!",   emoji: "🗓️" },
  reminder_2h:    { label: "Предстоящее занятие!",   emoji: "🗓️" },
  slot_added:     { label: "Новое расписание!",      emoji: "🔔" },
  instructor_set: { label: "Инструктор назначен!",   emoji: "👤" },
  invoice_status: { label: "Оплата",                emoji: "💳" },
};

function timeAgo(isoStr) {
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 1000);
  if (diff < 60)   return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  const d = new Date(isoStr);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return `Сегодня, ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
  if (d.toDateString() === yesterday.toDateString()) return `Вчера, ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth()+1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

const BackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M15 19l-7-7 7-7" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getNotifications();
        if (!cancelled) setNotifications(data);
      } catch (err) {
        if (err.message === "session_expired") { navigate("/login"); return; }
      } finally {
        if (!cancelled) setLoading(false);
      }

      markAllNotificationsRead().catch(() => {});
    }

    load();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="notif-screen">
      <div className="notif-header">
        <button className="notif-back-btn" onClick={() => navigate(-1)} aria-label="Назад">
          <BackIcon />
        </button>
        <h1 className="notif-title">Уведомления</h1>
      </div>

      <div className="notif-scroll">
        {loading ? (
          <p className="notif-loading">Загрузка...</p>
        ) : notifications.length === 0 ? (
          <p className="notif-empty">Уведомлений пока нет</p>
        ) : (
          <div className="notif-card">
            {notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type] ?? { label: "Уведомление", emoji: "🔔" };
              return (
                <div key={n.id} className="notif-item">
                  <div className="notif-title-row">
                    <span className="notif-emoji">{cfg.emoji}</span>
                    <span className="notif-label">{cfg.label}</span>
                  </div>
                  <div className="notif-text">{n.text}</div>
                  <div className="notif-time">{timeAgo(n.created_at)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}