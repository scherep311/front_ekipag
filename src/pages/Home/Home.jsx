// src/pages/Home/Home.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import BottomNav from "../../components/BottomNav/BottomNav";
import { getProfile, getUpcoming, cancelBooking, getNotificationsCount } from "../../api/student";

function hoursWord(n) {
  if (n % 10 === 1 && n % 100 !== 11) return "час";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "часа";
  return "часов";
}


const MONTH_GEN = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const DAY_SHORT = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];

function formatDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return `${d.getDate()} ${MONTH_GEN[d.getMonth()]}, ${DAY_SHORT[d.getDay()]}`;
}

function fmt(t) { return t ? t.slice(0, 5).replace(":", ".") : ""; }

function normalizePractice(slot) {
  return {
    id: slot.id, date: formatDate(slot.date),
    time: `${fmt(slot.start_time)}-${fmt(slot.end_time)}`,
    address: slot.car_info || "", type: "practice",
    rawId: slot.id, rawDate: slot.date, rawStartTime: slot.start_time,
  };
}

function normalizeTheory(slot) {
  const dayName = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"][slot.weekday - 1] ?? "";
  return {
    id: `theory-${slot.id}`,
    date: `${slot.weekday_display ?? dayName}`,
    time: `${fmt(slot.start_time)}-${fmt(slot.end_time)}`,
    address: "ул. Энтузиастов, 12 офис 302", type: "theory",
  };
}

function canCancelLesson(lesson) {
  if (!lesson.rawDate || !lesson.rawStartTime) return true;
  const [y, m, d] = lesson.rawDate.split("-").map(Number);
  const [h, min]  = lesson.rawStartTime.split(":").map(Number);
  const lessonDt  = new Date(y, m - 1, d, h, min, 0);
  return (lessonDt - Date.now()) / 3600000 >= 24;
}

function CancelModal({ lessons, onClose, onConfirm, loading }) {
  const [selected, setSelected] = useState([]);

  const toggle = (lesson) => {
    if (!canCancelLesson(lesson)) return;
    setSelected(prev =>
      prev.includes(lesson.rawId) ? prev.filter(x => x !== lesson.rawId) : [...prev, lesson.rawId]
    );
  };

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const cancellableLessons = lessons.filter(l => l.type === "practice" && canCancelLesson(l));

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <line x1="1" y1="1" x2="17" y2="17" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
            <line x1="17" y1="1" x2="1"  y2="17" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <h2 className="modal-title">Выберите записи для отмены</h2>
        <div className="modal-list">
          {cancellableLessons.map((lesson, idx, arr) => {
            const isSelected = selected.includes(lesson.rawId);
            return (
              <div key={lesson.id} className="modal-item" style={{ borderBottom: idx < arr.length - 1 ? "1px solid #E9EAEE" : "none" }} onClick={() => toggle(lesson)}>
                <div className="modal-item-info">
                  <span className="modal-item-date">{lesson.date}</span>
                  <span className="modal-item-time" style={{ color: isSelected ? "#9FA0A2" : "#223BAB" }}>{lesson.time}</span>
                </div>
                <div className={`modal-checkbox${isSelected ? " modal-checkbox--checked" : ""}`}>
                  {isSelected && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <button className={`modal-confirm ${selected.length > 0 ? "modal-confirm--active" : ""}`} onClick={() => selected.length > 0 && onConfirm(selected)} disabled={selected.length === 0 || loading}>
          {loading ? "Отмена..." : "Подтвердить"}
        </button>
      </div>
    </div>
  );
}

function ReferralSheet({ link, onClose }) {
  const [copied, setCopied] = useState(false);
  const sheetRef = useRef(null);
  const startY = useRef(null);
  const currentY = useRef(0);
  const dragging = useRef(false);

  const onTouchStart = (e) => { startY.current = e.touches[0].clientY; dragging.current = true; };
  const onTouchMove = (e) => {
    if (!dragging.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta < 0) return;
    currentY.current = delta;
    if (sheetRef.current) { sheetRef.current.style.transition = "none"; sheetRef.current.style.transform = `translateY(${delta}px)`; }
  };
  const onTouchEnd = () => {
    dragging.current = false;
    if (currentY.current > 80) {
      if (sheetRef.current) { sheetRef.current.style.transition = "transform 0.22s ease"; sheetRef.current.style.transform = "translateY(100%)"; }
      setTimeout(onClose, 220);
    } else {
      if (sheetRef.current) { sheetRef.current.style.transition = "transform 0.22s ease"; sheetRef.current.style.transform = "translateY(0)"; }
    }
    currentY.current = 0;
  };

  const handleCopy = async () => {
    if (!link || copied) return;
    try { await navigator.clipboard.writeText(link); }
    catch {
      const el = document.createElement("textarea");
      el.value = link;
      el.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;font-size:16px;";
      document.body.appendChild(el);
      el.focus(); el.setSelectionRange(0, el.value.length);
      try { document.execCommand("copy"); } catch (_) {}
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="sheet-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" ref={sheetRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">Пригласи друга и получи<br />приятный бонус! 🎁</h2>
        <p className="sheet-subtitle">Поделись своей ссылкой с другом.</p>
        <p className="sheet-subtitle">Когда друг пройдет первое практическое занятие - вы получите бонус.</p>
        <button className="sheet-link-row" onClick={handleCopy}>
          <span className="sheet-link-value">{link}</span>
          <span className="sheet-copy-icon">
            {copied ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="#9FA0A2" strokeWidth="1.8"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="#9FA0A2" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            )}
          </span>
        </button>
        {copied && <p className="sheet-copied sheet-copied--visible">Ссылка скопирована</p>}
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [user,          setUser]          = useState(null);
  const [lessons,       setLessons]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showReferral,  setShowReferral]  = useState(false);
  const [showCancel,    setShowCancel]    = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profile, upcomingData, notifData] = await Promise.all([
        getProfile(),
        getUpcoming(),
        getNotificationsCount(),
      ]);
      setUnreadCount(notifData.unread_count ?? 0);

      const practice = (upcomingData.practice ?? []).map(normalizePractice);
      const theory   = (upcomingData.theory   ?? []).map(normalizeTheory);
      setLessons([...practice, ...theory]);

      const countLessons  = upcomingData.count_lessons  ?? 0;
      const practiceHours = upcomingData.practice_hours ?? 0;
      const token         = profile.referral_token ?? "";
      const referralUrl   = token ? `${window.location.origin}/ref/${token}` : "";

      setUser({
        name:           profile.first_name ?? "",
        hoursCompleted: countLessons,
        hoursTotal:     practiceHours,
        referralLink:   referralUrl,
      });
    } catch (err) {
      if (err.message === "session_expired") { navigate("/login"); return; }
      console.error("Ошибка загрузки данных:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleConfirmCancel = async (rawIds) => {
    setCancelLoading(true);
    try {
      await Promise.all(rawIds.map((id) => cancelBooking(id)));
      setLessons((prev) => prev.filter((l) => !rawIds.includes(l.rawId)));
    } catch (err) {
      console.error("Ошибка отмены:", err);
      await fetchData();
    } finally {
      setCancelLoading(false);
      setShowCancel(false);
    }
  };

  const hasPractice    = lessons.some((l) => l.type === "practice" && canCancelLesson(l));
  const hoursCompleted = user?.hoursCompleted ?? 0;
  const hoursTotal     = user?.hoursTotal     ?? 0;
  const hoursLeft      = Math.max(hoursTotal - hoursCompleted, 0);
  const progressPercent = hoursTotal > 0 ? Math.min(Math.round((hoursCompleted / hoursTotal) * 100), 100) : 0;

  return (
    <div className="home-screen">
      <div className="home-scroll">

        <div className="card-section">
          <div className="greeting-row">
            <span className="greeting-text">Главная</span>
            <button className="bell-btn" aria-label="Уведомления" onClick={() => { setUnreadCount(0); navigate("/notifications"); }}>
              <img src="/icons/nav/bell.svg" alt="уведомления" className="bell-icon" />
              {unreadCount > 0 && (
                <span className="bell-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
            </button>
          </div>
          <div className="progress-section">
            <div className="progress-header">
              <span className="progress-label">Вы прошли обучение</span>
            </div>
            <div className="progress-hours-row">
              <span className="progress-done">{hoursCompleted}</span>
              <span className="progress-sep"> / {hoursTotal} ч</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="progress-hint">Осталось {hoursLeft} {hoursWord(hoursLeft)} до завершения программы</p>
          </div>
        </div>

        <div className="card-section">
          <button className="referral-row" onClick={() => setShowReferral(true)}>
            <span className="referral-text">🎁 Пригласить друга и получить бонус</span>
            <span className="referral-chevron">›</span>
          </button>
        </div>

        <div className="lessons-section">
          <h2 className="section-title">Предстоящие занятия</h2>
          {loading ? (
            <p className="lessons-empty" style={{ padding: "12px 18px" }}>Загрузка...</p>
          ) : lessons.length > 0 ? (
            <div className="lessons-list">
              {lessons.map((lesson, idx) => (
                <React.Fragment key={lesson.id}>
                  <div className="lesson-card">
                    <div className="lesson-info">
                      <span className="lesson-date">{lesson.date}</span>
                      <span className={`lesson-time lesson-time--${lesson.type}`}>{lesson.time}</span>
                    </div>
                    <div className={`lesson-badge lesson-badge--${lesson.type}`}>
                      <img src={lesson.type === "practice" ? "/icons/steering.svg" : "/icons/book-open.svg"} alt={lesson.type} className="badge-icon" />
                      <span>{lesson.type === "practice" ? "Практика" : "Теория"}</span>
                    </div>
                  </div>
                  {idx < lessons.length - 1 && <div className="lesson-divider" />}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="lessons-empty-state">
              <img src="/icons/sleeping-person.png" alt="Нет занятий" className="lessons-empty-img" />
              <p className="lessons-empty-text">Нет предстоящих занятий!</p>
            </div>
          )}
        </div>
      </div>

      {!loading && hasPractice && (
        <div className="cancel-wrap">
          <button className="cancel-btn" onClick={() => setShowCancel(true)}>Отменить занятие</button>
        </div>
      )}

      <BottomNav active="home" />

      {showCancel && (
        <CancelModal
          lessons={lessons}
          loading={cancelLoading}
          onClose={() => { if (!cancelLoading) setShowCancel(false); }}
          onConfirm={handleConfirmCancel}
        />
      )}

      {showReferral && (
        <ReferralSheet link={user?.referralLink ?? ""} onClose={() => setShowReferral(false)} />
      )}
    </div>
  );
}
