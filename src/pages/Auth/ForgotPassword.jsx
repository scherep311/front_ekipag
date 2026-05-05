// src/pages/Auth/ForgotPassword.jsx
import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import { forgotPassword } from "../../api/auth";
import { phoneToServer, makePhoneHandler } from "./phoneUtils";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const phoneRef = useRef(null);

  const [phone,       setPhone]       = useState("");
  const [phoneError,  setPhoneError]  = useState("");
  const [loading,     setLoading]     = useState(false);
  const [serverError, setServerError] = useState("");

  const handlePhoneChange = useCallback(
    makePhoneHandler(setPhone, phoneRef, () => setPhoneError("")),
    []
  );

  const handleSubmit = async () => {
    setServerError("");
    const digits = phone.replace(/\D/g, "");
    if (!phone || digits.length < 11) { setPhoneError("Введите полный номер телефона"); return; }
    setLoading(true);
    try {
      await forgotPassword({ phone_number: phoneToServer(phone) });
      navigate("/reset-password", { state: { phone: phoneToServer(phone) } });
    } catch (err) {
      if (err.status === 429) {
        const sec = err.data?.cooldown_seconds ?? 60;
        setServerError(`Подождите ${sec} сек. перед повторной отправкой.`);
      } else {
        setServerError(err.message || "Ошибка. Попробуйте ещё раз.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <button className="auth-back" onClick={() => navigate("/login")}>‹</button>
        <h1 className="auth-title">Восстановление пароля</h1>
        <p style={{ color: "var(--color-text-secondary, #9FA0A2)", fontSize: 14, margin: "0 0 4px" }}>
          Введите номер телефона — пришлём SMS с кодом подтверждения.
        </p>

        <div className="auth-field">
          <input
            ref={phoneRef}
            className={`auth-input${phoneError ? " auth-input--error" : ""}`}
            type="tel"
            placeholder="+7 (9__) ___-__-__"
            value={phone}
            onChange={handlePhoneChange}
            autoComplete="tel"
          />
          {phoneError && <span className="auth-field-error">{phoneError}</span>}
        </div>

        {serverError && <p className="auth-server-error">{serverError}</p>}

        <button className="auth-btn" onClick={handleSubmit} disabled={loading} style={{ opacity: loading ? 0.5 : 1 }}>
          {loading ? "Отправка..." : "Получить код"}
        </button>

        <p className="auth-footer">
          Вспомнили пароль? <span onClick={() => navigate("/login")}>Войти</span>
        </p>
      </div>
    </div>
  );
}
