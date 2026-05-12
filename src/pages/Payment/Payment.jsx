// src/pages/Payment/Payment.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav/BottomNav";
import "./Payment.css";
import { getInvoices, confirmInvoice } from "../../api/student";

function formatAmount(amount) {
  if (amount == null) return "—";
  const num = parseFloat(amount);
  if (isNaN(num)) return "—";
  return num.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";
}

function formatDeadline(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  const months = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

function InvoiceCard({ invoice, isReferral, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState(invoice.status);

  const isPending = status === "pending";
  const isWaiting = status === "awaiting_confirmation";
  const isPaid    = status === "paid";

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await confirmInvoice(invoice.id);
      setStatus("awaiting_confirmation");
      onConfirm && onConfirm(invoice.id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`pi-card${isPaid ? " pi-card--paid" : ""}`}>
      <div className="pi-card-top">
        <div className="pi-service">
          <span className="pi-label">Услуга</span>
          <span className="pi-service-name">{invoice.service}</span>
        </div>
        <div className="pi-amount-block">
          <span className="pi-label pi-label--right">{isReferral ? "Сумма к оплате с учётом скидки" : "Сумма к оплате"}</span>
          <span className="pi-amount">{formatAmount(invoice.amount)}</span>
        </div>
      </div>

      <div className="pi-divider-wrap">
        <div className="pi-divider" />
      </div>

      <div className="pi-card-bottom">
        <span className="pi-deadline">Оплатить до: <strong>{formatDeadline(invoice.deadline)}</strong></span>

        <div className="pi-status-area">
          {isPending && (
            <button
              className="pi-check-btn"
              onClick={handleConfirm}
              disabled={loading}
              title="Я оплатил"
            >
              {loading ? (
                <div className="pi-check-spinner" />
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Я оплатил</span>
                </>
              )}
            </button>
          )}

          {isWaiting && (
            <span className="pi-badge pi-badge--waiting">
              <IconClock />
              Ожидает подтверждения
            </span>
          )}

          {isPaid && (
            <span className="pi-badge pi-badge--paid">Оплачен</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Payment() {
  const navigate = useNavigate();
  const [invoices,    setInvoices]    = useState([]);
  const [isReferral,  setIsReferral]  = useState(false);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getInvoices();
      setInvoices(data.invoices);
      setIsReferral(data.is_referral);
    } catch (e) {
      if (e.message === "session_expired") navigate("/login");
    } finally {
      setLoading(false);
    }
  }

  const handleConfirm = (id) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: "awaiting_confirmation" } : inv));
  };

  const ORDER = { pending: 0, awaiting_confirmation: 1, paid: 2 };
  const sorted = [...invoices].sort((a, b) => (ORDER[a.status] ?? 3) - (ORDER[b.status] ?? 3));

  if (loading) {
    return (
      <div className="payment-loading">
        <div className="payment-spinner" />
        <span>Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-header">
        <h1 className="payment-title">Оплата</h1>
      </div>

      <div className="payment-scroll">
        {sorted.length === 0 ? (
          <div className="payment-empty">
            <img src="/icons/no-payments.png" alt="Нет счетов" className="payment-empty-img" />
            <p className="payment-empty-text">У вас нет счетов на оплату!</p>
          </div>
        ) : (
          <div className="payment-list">
            {sorted.map(inv => (
              <InvoiceCard key={inv.id} invoice={inv} isReferral={isReferral} onConfirm={handleConfirm} />
            ))}
          </div>
        )}
      </div>

      <BottomNav active="payment" />
    </div>
  );
}