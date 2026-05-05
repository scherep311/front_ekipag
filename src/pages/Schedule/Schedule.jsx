// src/pages/Schedule/Schedule.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Schedule.css";
import BottomNav from "../../components/BottomNav/BottomNav";
import { getSlots, bookSlot } from "../../api/student";

const DAY_NAMES   = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];
const MONTH_NAMES = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

function getMonday(d) {
  const date = new Date(d);
  const day  = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d, n) { const date = new Date(d); date.setDate(date.getDate() + n); return date; }

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function isSameDay(a, b) { return toISO(a) === toISO(b); }
function fmt(t) { return t ? t.slice(0, 5).replace(":", ".") : ""; }

function fmtDate(d) {
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}`;
}

function LimitModal({ onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="sched-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sched-modal">
        <button className="sched-modal-close" onClick={onClose} aria-label="Закрыть">✕</button>
        <div className="sched-modal-icon sched-modal-icon--warn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v5M12 16h.01" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="sched-modal-title">Лимит записей исчерпан</p>
        <p className="sched-modal-note">
          Вы не можете записаться на практическое занятие, так как превышен лимит записей за неделю.
        </p>
        <button className="sched-modal-btn sched-modal-btn--warn" onClick={onClose}>
          Понятно
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({ loading, onClose, onConfirm }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="sched-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sched-modal">
        <button className="sched-modal-close" onClick={onClose} aria-label="Закрыть">✕</button>
        <div className="sched-modal-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 13L9 17L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="sched-modal-title">Подтвердите запись</p>
        <p className="sched-modal-note">
          <strong>Внимание!</strong><br/>
          Отменить занятие можно не позднее чем за&nbsp;24 часа до его начала.
        </p>
        <button className="sched-modal-btn" onClick={onConfirm} disabled={loading}>
          {loading ? "Запись..." : "Подтвердить"}
        </button>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const navigate  = useNavigate();
  const today     = new Date();
  today.setHours(0, 0, 0, 0);

  // 0 = текущая неделя, 1 = следующая неделя
  const [weekOffset,     setWeekOffset]     = useState(0);
  const [selectedDate,   setSelectedDate]   = useState(today);
  const [slots,          setSlots]          = useState([]);
  const [sloading,       setSloading]       = useState(false);
  const [selectedSlots,  setSelectedSlots]  = useState([]);
  const [weeklyBooked,   setWeeklyBooked]   = useState(0);
  const [weeklyLimit,    setWeeklyLimit]    = useState(null);
  const [showModal,      setShowModal]      = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [bookLoading,    setBookLoading]    = useState(false);
  const [bookError,      setBookError]      = useState(null);

  const currentWeekStart = getMonday(today);
  const nextWeekStart    = addDays(currentWeekStart, 7);
  const weekStart        = weekOffset === 0 ? currentWeekStart : nextWeekStart;
  const weekDays         = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthLabel = (() => {
    const months = [...new Set(weekDays.map(d => d.getMonth()))];
    return months.map(m => MONTH_NAMES[m]).join(" / ");
  })();

  const loadSlots = useCallback(async (date) => {
    setSloading(true);
    setSelectedSlots([]);
    setBookError(null);
    try {
      const data = await getSlots(toISO(date));
      setSlots(data.free_slots   ?? []);
      setWeeklyBooked(data.weekly_booked ?? 0);
      setWeeklyLimit(data.weekly_limit   ?? 3);
    } catch (err) {
      if (err.message === "session_expired") { navigate("/login"); return; }
      console.error(err);
      setSlots([]);
    } finally {
      setSloading(false);
    }
  }, [navigate]);

  useEffect(() => { loadSlots(selectedDate); }, [selectedDate, loadSlots]);

  useEffect(() => {
    if (weeklyLimit !== null && weeklyBooked >= weeklyLimit && weekOffset === 0) {
      setShowLimitModal(true);
    }
  }, [weeklyBooked, weeklyLimit, weekOffset]);

  const handlePrevWeek = () => {
    if (weekOffset === 0) return;
    setWeekOffset(0);
    setSelectedDate(today);
    setSelectedSlots([]);
  };

  const handleNextWeek = () => {
    if (weekOffset === 1) return;
    setWeekOffset(1);
    // Выбираем понедельник следующей недели
    setSelectedDate(nextWeekStart);
    setSelectedSlots([]);
  };

  const handleDayClick = (day) => {
    const isPast = weekOffset === 0 && day < today;
    if (isPast) return;
    setSelectedDate(day);
  };

  const handleSlotClick = (slot) => {
    if (weekOffset === 1) return; // следующая неделя — только просмотр
    setBookError(null);
    setSelectedSlots(prev => {
      const already = prev.find(s => s.id === slot.id);
      if (already) return prev.filter(s => s.id !== slot.id);
      if ((weeklyLimit ?? 3) - weeklyBooked - prev.length <= 0) return prev;
      return [...prev, slot];
    });
  };

  const canSelectMore = (weeklyLimit ?? 3) - weeklyBooked - selectedSlots.length > 0;

  const handleConfirmBook = async () => {
    if (selectedSlots.length === 0) return;
    setBookLoading(true);
    setBookError(null);
    try {
      for (const slot of selectedSlots) {
        await bookSlot(slot.id);
      }
      setSlots(prev => prev.filter(s => !selectedSlots.find(sel => sel.id === s.id)));
      setWeeklyBooked(prev => prev + selectedSlots.length);
      setShowModal(false);
      setSelectedSlots([]);
      navigate("/");
    } catch (err) {
      if (err.message === "session_expired") { navigate("/login"); return; }
      setBookError(err.message);
    } finally {
      setBookLoading(false);
    }
  };

  const isPastDay  = (day) => weekOffset === 0 && day < today;
  const hasSlots   = !sloading && slots.length > 0;
  const isEmpty    = !sloading && slots.length === 0;
  const isNextWeek = weekOffset === 1;

  return (
    <div className="schedule-screen">
      <div className="schedule-scroll">

        <div className="cal-card">
          <p className="cal-screen-title">Расписание</p>

          {/* Навигация по неделям */}
          <div className="cal-week-nav">
            <button
              className={`cal-nav-btn${weekOffset === 0 ? " cal-nav-btn--disabled" : ""}`}
              onClick={handlePrevWeek}
              disabled={weekOffset === 0}
              aria-label="Предыдущая неделя"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <span className="cal-month-title">{monthLabel}</span>

            <button
              className={`cal-nav-btn${weekOffset === 1 ? " cal-nav-btn--disabled" : ""}`}
              onClick={handleNextWeek}
              disabled={weekOffset === 1}
              aria-label="Следующая неделя"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="cal-divider-top" />

          <div className="cal-week">
            {weekDays.map((day, i) => {
              const isActive = isSameDay(day, selectedDate);
              const past     = isPastDay(day);
              return (
                <div
                  key={i}
                  className={["cal-day", isActive ? "cal-day--active" : "", past ? "cal-day--past" : ""].join(" ").trim()}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="cal-day-name">{DAY_NAMES[i]}</span>
                  <span className="cal-day-num">{day.getDate()}</span>
                </div>
              );
            })}
          </div>

          {weeklyLimit !== null && weekOffset === 0 && (
            <p className="cal-week-limit">
              {weeklyBooked >= weeklyLimit
                ? "Лимит записей на этой неделе исчерпан"
                : `Осталось записей на этой неделе: ${weeklyLimit - weeklyBooked}`}
            </p>
          )}
        </div>

        {/* Баннер "только просмотр" для следующей недели */}
       

        {isEmpty && (
          <div className="slots-empty">
            <span className="slots-empty-text">Нет доступных записей!</span>
          </div>
        )}

        {sloading && (
          <div className="slots-card">
            <div className="slots-loading-wrap"><span className="slots-loading">Загрузка...</span></div>
          </div>
        )}

        {hasSlots && (
          <div className="slots-card">
            <p className="slots-label">
              {isNextWeek ? "Запись откроется в понедельник" : "Доступное время"}
            </p>
            {slots.map((slot) => {
              const isChecked  = !!selectedSlots.find(s => s.id === slot.id);
              const isDisabled = isNextWeek || (!isChecked && !canSelectMore);
              const timeLabel  = `${fmt(slot.start_time)}-${fmt(slot.end_time)}`;
              return (
                <div
                  key={slot.id}
                  className={`slot-row${isDisabled ? " slot-row--disabled" : ""}${isNextWeek ? " slot-row--preview" : ""}`}
                  onClick={() => !isDisabled && handleSlotClick(slot)}
                >
                  {!isNextWeek && (
                    <div className={["slot-checkbox", isChecked ? "slot-checkbox--checked" : "", isDisabled ? "slot-checkbox--disabled" : ""].join(" ").trim()}>
                      {isChecked && (
                        <svg width="11" height="9" viewBox="0 0 13 10" fill="none">
                          <path d="M1.5 5L5 8.5L11.5 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  )}
                  {isNextWeek && (
                    <div className="slot-preview-dot" />
                  )}
                  <span className="slot-time">{timeLabel}</span>
                </div>
              );
            })}

            {bookError && (
              <p style={{ fontSize: 12, color: "#D93025", textAlign: "center", padding: "0 16px 8px", lineHeight: 1.4 }}>
                {bookError}
              </p>
            )}

            {!isNextWeek && (
              <div className="slots-book-wrap">
                <button className="book-btn" onClick={() => selectedSlots.length > 0 && setShowModal(true)} disabled={selectedSlots.length === 0}>
                  {selectedSlots.length > 1 ? `Записаться (${selectedSlots.length})` : "Записаться"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav active="schedule" />

      {showLimitModal && (
        <LimitModal onClose={() => setShowLimitModal(false)} />
      )}

      {showModal && (
        <ConfirmModal
          loading={bookLoading}
          onClose={() => { if (!bookLoading) setShowModal(false); }}
          onConfirm={handleConfirmBook}
        />
      )}
    </div>
  );
}
