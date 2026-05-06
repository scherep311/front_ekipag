// src/pages/Auth/Login.jsx
import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import { login } from "../../api/auth";
import { subscribeToPush } from "../../hooks/usePushNotifications";
import { phoneToServer, makePhoneHandler } from "./phoneUtils";

export default function Login() {
  useEffect(() => {
    document.body.classList.add('auth-mode');
    return () => document.body.classList.remove('auth-mode');
  }, []);

  const navigate = useNavigate();
  const phoneRef = useRef(null);

  const [phone,       setPhone]       = useState("");
  const [password,    setPassword]    = useState("");
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [serverError, setServerError] = useState("");
  const [suspended,   setSuspended]   = useState(false);

  const handlePhoneChange = useCallback(
    makePhoneHandler(setPhone, phoneRef, () =>
      setErrors(prev => ({ ...prev, phone: "" }))
    ),
    []
  );

  const validate = () => {
    const e = {};
    const digits = phone.replace(/\D/g, "");
    if (!phone) e.phone = "Введите номер телефона";
    else if (digits.length < 11) e.phone = "Введите полный номер телефона";
    if (!password) e.password = "Введите пароль";
    return e;
  };

  const handleSubmit = async () => {
    setServerError("");
    setSuspended(false);
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setLoading(true);
    try {
      const data = await login({ phone_number: phoneToServer(phone), password });
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      subscribeToPush();
      navigate("/");
    } catch (err) {
      if (err.status === 403) {
        setSuspended(true);
      } else {
        setServerError(err.message || "Неверный номер или пароль");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo-wrap">
          <img src="/icons/logo.svg" alt="Логотип" className="auth-logo" />
        </div>
        <h1 className="auth-title">Вход</h1>

        <div className="auth-field">
          <input
            ref={phoneRef}
            className={`auth-input${errors.phone ? " auth-input--error" : ""}`}
            type="tel"
            placeholder="+7 (9__) ___-__-__"
            value={phone}
            onChange={handlePhoneChange}
            autoComplete="tel"
          />
          {errors.phone && <span className="auth-field-error">{errors.phone}</span>}
        </div>

        <div className="auth-field">
          <input
            className={`auth-input${errors.password ? " auth-input--error" : ""}`}
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value.slice(0, 64));
              if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
            }}
            autoComplete="current-password"
            maxLength={64}
          />
          {errors.password && <span className="auth-field-error">{errors.password}</span>}
        </div>

        <p
          style={{ textAlign: "right", fontSize: 13, fontWeight: 400, color: "var(--color-blue)", cursor: "pointer", margin: "-4px 0 0" }}
          onClick={() => navigate("/forgot-password")}
        >
          Забыли пароль?
        </p>

        {suspended && (
          <div className="auth-suspended-block">
            <p className="auth-suspended-title">Вход в аккаунт недоступен</p>
            <p className="auth-suspended-text">Ваш аккаунт временно приостановлен. Обратитесь к администратору.</p>
          </div>
        )}
        {serverError && <p className="auth-server-error">{serverError}</p>}

        <button className="auth-btn" onClick={handleSubmit} disabled={loading} style={{ opacity: loading ? 0.5 : 1 }}>
          {loading ? "Входим..." : "Войти"}
        </button>

        <p className="auth-footer">
          Нет аккаунта?{" "}
          <span onClick={() => navigate("/register")}>Зарегистрироваться</span>
        </p>
      </div>
    </div>
  );
}
