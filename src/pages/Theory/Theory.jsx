// src/pages/Theory/Theory.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Theory.css";
import BottomNav from "../../components/BottomNav/BottomNav";
import {
  getTickets,
  getTopics,
  startSession,
  submitAnswer,
  finishSession,
  getHistory,
} from "../../api/student";

const MEDIA_BASE = "/media";

// ── Иконки ────────────────────────────────────────────────────────────────────
const IconTicket = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M2 10h20M7 10v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="5" cy="7.5" r="1" fill="currentColor"/>
  </svg>
);
const IconTopic = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M4 6h16M4 10h10M4 14h12M4 18h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IconHistory = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IconExam = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);
const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function QuestionImage({ imagePath, className }) {
  const [src, setSrc]       = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!imagePath || !imagePath.trim()) { setFailed(true); return; }
    let clean = imagePath.trim();
    if (clean.startsWith("/media/")) clean = clean.slice(7);
    setSrc(`${MEDIA_BASE}/${clean}`);
    setFailed(false);
  }, [imagePath]);

  if (failed || !src) return null;
  return <img src={src} alt="" className={className} onError={() => setFailed(true)} />;
}

function MistakeDots({ mistakes, max }) {
  return (
    <div className="exam-mistake-dots">
      {Array.from({ length: max + 1 }).map((_, i) => (
        <span key={i} className={`exam-mistake-dot${i < mistakes ? " exam-mistake-dot--used" : ""}`} />
      ))}
    </div>
  );
}

function ModeSelect({ onSelect }) {
  return (
    <div className="theory-mode-screen">
      <h1 className="theory-main-title">Теория</h1>
      <div className="theory-mode-cards">
        <button className="theory-mode-card" onClick={() => onSelect("exam")}>
          <div className="theory-mode-icon theory-mode-icon--red"><IconExam /></div>
          <div className="theory-mode-info">
            <span className="theory-mode-label">Экзамен</span>
            <span className="theory-mode-desc">20 вопросов · до 2 ошибок в разных блоках</span>
          </div>
          <IconArrow />
        </button>
        <button className="theory-mode-card" onClick={() => onSelect("ticket")}>
          <div className="theory-mode-icon theory-mode-icon--blue"><IconTicket /></div>
          <div className="theory-mode-info">
            <span className="theory-mode-label">По билетам</span>
            <span className="theory-mode-desc">40 билетов, 20 вопросов каждый</span>
          </div>
          <IconArrow />
        </button>
        <button className="theory-mode-card" onClick={() => onSelect("topic")}>
          <div className="theory-mode-icon theory-mode-icon--green"><IconTopic /></div>
          <div className="theory-mode-info">
            <span className="theory-mode-label">По темам</span>
            <span className="theory-mode-desc">Вопросы по разделам ПДД</span>
          </div>
          <IconArrow />
        </button>
        <button className="theory-mode-card" onClick={() => onSelect("history")}>
          <div className="theory-mode-icon theory-mode-icon--gray"><IconHistory /></div>
          <div className="theory-mode-info">
            <span className="theory-mode-label">История экзаменов</span>
            <span className="theory-mode-desc">Мои прошлые результаты</span>
          </div>
          <IconArrow />
        </button>
      </div>
    </div>
  );
}

function FilterSelect({ mode, onSelect, onBack }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = mode === "ticket" ? getTickets : getTopics;
    fetch()
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [mode]);

  return (
    <div className="theory-list-screen">
      <div className="theory-topbar">
        <button className="theory-back" onClick={onBack}>‹</button>
        <h2 className="theory-topbar-title">{mode === "ticket" ? "Выберите билет" : "Выберите тему"}</h2>
      </div>
      {loading ? (
        <div className="theory-loading">Загрузка...</div>
      ) : (
        <div className="theory-list">
          {items.map((item, idx) => {
            const label = mode === "ticket" ? item.ticket_number : item;
            const count = mode === "ticket" ? item.count : null;
            return (
              <button key={idx} className="theory-list-item" onClick={() => onSelect(label)}>
                <div className="theory-list-item-info">
                  <span className="theory-list-item-label">{label}</span>
                  {count && <span className="theory-list-item-count">{count} вопросов</span>}
                </div>
                <IconArrow />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExamScreen({ mode, filterValue, onBack, onFinish }) {
  const navigate = useNavigate();
  const [sessionId,   setSessionId]   = useState(null);
  const [questions,   setQuestions]   = useState([]);
  const [current,     setCurrent]     = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [mistakes,    setMistakes]    = useState(0);
  const [maxMistakes, setMaxMistakes] = useState(2);
  const [extraIds,    setExtraIds]    = useState(new Set());
  const [examEnded,   setExamEnded]   = useState(false);

  useEffect(() => {
    const body = mode === "exam" ? { mode: "exam" } : { mode, filter_value: filterValue };
    startSession(body)
      .then(data => {
        setSessionId(data.session_id);
        setQuestions(data.questions ?? []);
        setMaxMistakes(data.max_mistakes ?? 2);
        setLoading(false);
      })
      .catch(err => {
        if (err.message === "session_expired") { navigate("/login"); return; }
        setError("Не удалось загрузить вопросы");
        setLoading(false);
      });
  }, [mode, filterValue, navigate]);

  const currentQ  = questions[current];
  const answered  = currentQ ? answers[currentQ.id] : undefined;
  const answeredCount = Object.keys(answers).length;
  const allAnswered   = questions.length > 0 && answeredCount >= questions.length;
  const progress      = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const handleAnswer = async (answerIndex) => {
    if (!currentQ || answered !== undefined || submitting || examEnded) return;
    setSubmitting(true);
    try {
      const result = await submitAnswer({
        session_id:   sessionId,
        question_id:  currentQ.id,
        answer_index: answerIndex,
      });
      const isCorrect = result.is_correct;
      setAnswers(prev => ({ ...prev, [currentQ.id]: { chosen: answerIndex, correct: result.correct_index, isCorrect, tip: result.answer_tip } }));

      if (mode === "exam" && result.exam_event) {
        if (result.failed) {
          setExamEnded(true);
          setTimeout(() => onFinish(result.result, filterValue ?? "Экзамен", true), 1500);
          return;
        }
        if (result.exam_event === "mistake" && result.extra_questions?.length) {
          setMistakes(result.mistakes ?? mistakes + 1);
          setExtraIds(prev => { const s = new Set(prev); result.extra_questions.forEach(q => s.add(q.id)); return s; });
          setQuestions(prev => [...prev, ...result.extra_questions]);
        } else if (result.mistakes !== undefined) {
          setMistakes(result.mistakes);
        }
      } else if (!isCorrect && mode !== "exam") {
        setMistakes(m => m + 1);
      }
    } catch (err) {
      if (err.message === "session_expired") { navigate("/login"); return; }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (examEnded) return;
    if (current < questions.length - 1) setCurrent(c => c + 1);
  };

  const handleFinish = async () => {
    if (!sessionId || submitting) return;
    setSubmitting(true);
    try {
      const result = await finishSession(sessionId);
      onFinish(result, filterValue ?? "Экзамен", mode === "exam");
    } catch (err) {
      if (err.message === "session_expired") { navigate("/login"); return; }
      setError("Не удалось завершить сессию");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="theory-loading">Загрузка вопросов...</div>;
  if (error)   return <div className="theory-error-screen"><span>{error}</span><button className="theory-btn-outline" onClick={onBack}>Назад</button></div>;

  const isExtraQuestion = mode === "exam" && currentQ && extraIds.has(currentQ.id);

  return (
    <div className="exam-screen">
      <div className="exam-header">
        <button className="theory-back" onClick={onBack}>‹</button>
        <div className="exam-header-center">
          <span className="exam-filter-label">{filterValue ?? "Экзамен"}</span>
          <span className="exam-counter">{current + 1} / {questions.length}</span>
        </div>
        {mode === "exam" ? (
          <MistakeDots mistakes={mistakes} max={maxMistakes} />
        ) : (
          <span className="exam-progress-pct">{progress}%</span>
        )}
      </div>
      <div className="exam-progress-track">
        <div className="exam-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {currentQ && (
        <div className="exam-body">
          <p className="exam-question-num">Вопрос {current + 1}{isExtraQuestion ? " (доп.)" : ""}</p>
          <p className="exam-question-text">{currentQ.question_text}</p>
          {currentQ.image_path?.trim() && (
            <div className="exam-image-wrap">
              <QuestionImage imagePath={currentQ.image_path} className="exam-image" />
            </div>
          )}

          <div className="exam-answers">
            {currentQ.answers.map((ans) => {
              let cls = "exam-answer";
              let icon = null;
              if (answered !== undefined) {
                if (ans.index === answered.correct)  { cls += " exam-answer--correct"; icon = <span className="exam-answer-icon exam-answer-icon--ok">✓</span>; }
                else if (ans.index === answered.chosen && !answered.isCorrect) { cls += " exam-answer--wrong"; icon = <span className="exam-answer-icon exam-answer-icon--no">✗</span>; }
                else cls += " exam-answer--muted";
              }
              return (
                <button key={ans.index} className={cls} onClick={() => handleAnswer(ans.index)} disabled={answered !== undefined || submitting}>
                  <span className="exam-answer-index">{ans.index + 1}</span>
                  <span className="exam-answer-text">{ans.text}</span>
                  {icon}
                </button>
              );
            })}
          </div>

          {answered && answered.tip && (
            <div className="exam-tip"><p>{answered.tip}</p></div>
          )}

          <div className="exam-nav">
            {answered !== undefined && !allAnswered && (
              <button className="exam-btn-next" onClick={handleNext}>
                {current < questions.length - 1 ? "Следующий вопрос" : "Завершить"}
              </button>
            )}
            {allAnswered && (
              <button className="exam-btn-finish" onClick={handleFinish} disabled={submitting}>
                {submitting ? "Отправка..." : "Завершить тест"}
              </button>
            )}
          </div>

          {mode !== "exam" && answeredCount > 0 && !allAnswered && (
            <button className="exam-btn-early-finish" onClick={handleFinish} disabled={submitting}>
              Завершить досрочно
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ResultScreen({ result, filterValue, isExam, onRestart, onBack }) {
  const [showDetails, setShowDetails] = useState(false);
  const passed  = result.passed;
  const details = result.details || [];
  const wrong   = details.filter(d => d.chosen_index !== null && d.chosen_index !== undefined && !d.is_correct);
  const anyAnswered = details.some(d => d.chosen_index !== null && d.chosen_index !== undefined);

  return (
    <div className="result-screen">
      <div className="result-hero">
        <div className={`result-status-bar ${passed ? "result-status-bar--pass" : "result-status-bar--fail"}`} />
        <h2 className="result-title">{passed ? "Зачёт!" : "Не зачёт"}</h2>
        <p className="result-sub">{isExam ? `Экзамен · ${filterValue}` : filterValue}</p>
        <div className="result-score-row">
          <span className="result-score-num">{result.score}</span>
          <span className="result-score-sep">/ {result.total}</span>
        </div>
      </div>
      <div className="result-actions">
        <button className="exam-btn-finish" onClick={onRestart}>{isExam ? "Пройти экзамен ещё раз" : "Пройти ещё раз"}</button>
        <button className="theory-btn-outline" onClick={onBack}>{isExam ? "На главную" : "К списку"}</button>
      </div>
      {anyAnswered && wrong.length > 0 && (
        <div className="result-details-section">
          <button className="result-details-toggle" onClick={() => setShowDetails(v => !v)}>
            {showDetails ? "Скрыть разбор" : `Разбор ошибок (${wrong.length})`}
          </button>
          {showDetails && (
            <div className="result-details-list">
              {wrong.map((d, i) => (
                <div key={i} className="result-detail-item">
                  <p className="result-detail-q">{d.question_text}</p>
                  {d.image_path?.trim() && <QuestionImage imagePath={d.image_path} className="result-detail-img" />}
                  <div className="result-detail-answers">
                    {d.answers.map((a) => {
                      let cls = "result-detail-ans";
                      if (a.index === d.correct_index)     cls += " result-detail-ans--correct";
                      else if (a.index === d.chosen_index) cls += " result-detail-ans--wrong";
                      return <div key={a.index} className={cls}><span>{a.text}</span></div>;
                    })}
                  </div>
                  {d.answer_tip && <p className="result-detail-tip">{d.answer_tip}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HistoryScreen({ onBack }) {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getHistory()
      .then(data => { setSessions(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmt = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2,"0")}.${(d.getMonth()+1).toString().padStart(2,"0")}.${d.getFullYear()}`;
  };

  return (
    <div className="theory-list-screen">
      <div className="theory-topbar">
        <button className="theory-back" onClick={onBack}>‹</button>
        <h2 className="theory-topbar-title">История экзаменов</h2>
      </div>
      {loading ? (
        <div className="theory-loading">Загрузка...</div>
      ) : sessions.length === 0 ? (
        <p className="theory-empty">Вы ещё не сдавали экзамены</p>
      ) : (
        <div className="theory-list">
          {sessions.map(s => (
            <div key={s.session_id} className="history-item">
              <div className="history-item-info">
                <span className="history-item-label">Экзамен · {s.filter_value}</span>
                <span className="history-item-date">{fmt(s.finished_at)}</span>
              </div>
              <div className="history-item-result">
                <span className="history-item-score">{s.score}/{s.total}</span>
                <span className={`history-badge ${s.passed ? "history-badge--pass" : "history-badge--fail"}`}>
                  {s.passed ? "Сдан" : "Не сдан"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TheoryPage() {
  const navigate = useNavigate();
  const [screen,      setScreen]      = useState("mode");
  const [mode,        setMode]        = useState(null);
  const [filterValue, setFilterValue] = useState(null);
  const [result,      setResult]      = useState(null);
  const [isExam,      setIsExam]      = useState(false);

  const handleModeSelect = (m) => {
    if (m === "history") { setScreen("history"); return; }
    if (m === "exam")    { setMode("exam"); setScreen("exam"); return; }
    setMode(m);
    setScreen("select");
  };

  const handleFilterSelect = (val) => { setFilterValue(val); setScreen("exam"); };

  const handleFinish = (res, fv, exam = false) => {
    setResult(res);
    setFilterValue(fv);
    setIsExam(exam);
    setScreen("result");
  };

  const handleRestart = () => { setResult(null); setScreen("exam"); };

  return (
    <div className="theory-screen">
      <div className="theory-scroll">
        {screen === "mode" && <ModeSelect onSelect={handleModeSelect} />}
        {screen === "select" && (
          <FilterSelect mode={mode} onSelect={handleFilterSelect} onBack={() => setScreen("mode")} />
        )}
        {screen === "exam" && (
          <ExamScreen
            mode={mode}
            filterValue={filterValue}
            onBack={() => mode === "exam" ? setScreen("mode") : setScreen("select")}
            onFinish={handleFinish}
          />
        )}
        {screen === "result" && (
          <ResultScreen
            result={result}
            filterValue={filterValue}
            isExam={isExam}
            onRestart={handleRestart}
            onBack={() => isExam ? setScreen("mode") : setScreen("select")}
          />
        )}
        {screen === "history" && <HistoryScreen onBack={() => setScreen("mode")} />}
      </div>
      {screen === "mode" && <BottomNav active="theory" />}
    </div>
  );
}
