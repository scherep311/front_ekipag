import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav/BottomNav";
import { apiFetch } from "../../api/client";
import "./Referrals.css";

function StatusBadge({ status }) {
  const MAP = {
    contacted:  { label: "Связались",       cls: "status--contacted"  },
    registered: { label: "Зарегистрирован", cls: "status--registered" },
    rejected:   { label: "Не пришел",       cls: "status--rejected"   },
  };
  const entry = MAP[status];
  if (!entry) return null;
  return <span className={`ref-status-badge ${entry.cls}`}>{entry.label}</span>;
}

export default function Referrals() {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/student/referral/info/");
      if (!res.ok) throw new Error("load_error");
      setData(await res.json());
    } catch (e) {
      if (e.message === "session_expired") navigate("/login");
      else setError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="ref-page">
        <div className="ref-loading">
          <div className="ref-spinner" /><span>Загрузка...</span>
        </div>
        <BottomNav active="profile" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="ref-page">
        <div className="ref-error-state">
          <p>{error}</p>
          <button onClick={fetchData} className="ref-retry-btn">Повторить</button>
        </div>
        <BottomNav active="profile" />
      </div>
    );
  }

  const leads = data?.leads || [];

  return (
    <div className="ref-page">
      <div className="ref-content">

        <div className="ref-header">
          <button className="ref-back-btn" onClick={() => navigate(-1)}>
            <svg width="9" height="16" viewBox="0 0 9 16" fill="none">
              <path d="M8 1L1 8l7 7" stroke="#223BAB" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="ref-title">Приглашенные друзья</h1>
        </div>

        {leads.length === 0 ? (
          <div className="ref-empty">
            <div className="ref-empty-icon">👥</div>
            <p className="ref-empty-text">
              Здесь появятся ваши приглашенные.<br />
              Поделитесь ссылкой с главной страницы!
            </p>
          </div>
        ) : (
          <div className="ref-leads-list">
            {leads.map((lead, i) => (
              <div key={i} className="ref-lead-item">
                <div className="ref-lead-avatar">
                  {(lead.first_name?.[0] || "?").toUpperCase()}
                </div>
                <div className="ref-lead-info">
                  <div className="ref-lead-name">{lead.first_name} {lead.last_name}</div>
                  <div className="ref-lead-phone">{lead.phone_number}</div>
                </div>
                <StatusBadge status={lead.status} />
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
