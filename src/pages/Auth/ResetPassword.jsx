// src/pages/Auth/ResetPassword.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./auth.css";
import { forgotPassword, resetPassword } from "../../api/auth";

const CODE_LENGTH    = 6;
const RESEND_SECONDS = 60;

export default function ResetPassword() {
  useEffect(() => {
    document.body.classList.add('auth-mode');
    return () => document.body.classList.remove('auth-mode');
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone ?? "";

  const [step,         setStep]         = useState("code");
  const [digits,       setDigits]       = useState(Array(CODE_LENGTH).fill(""));
  const [verifiedCode, setVerifiedCode] = useState("");
  const [newPassword,  setNewPassword]  = useState("");
  const [confirmPass,  setConfirmPass]  = useState("");
  const [timer,        setTimer]        = useState(RESEND_SECONDS);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const formatTimer = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    if (value && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    const fullCode = newDigits.join("");
    if (fullCode.length === CODE_LENGTH && !newDigits.includes("")) {
      setVerifiedCode(fullCode);
      setStep("password");
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    const newDigits = [...digits];
    pasted.split("").forEach((char, i) => { newDigits[i] = char; });
    setDigits(newDigits);
    const nextEmpty = newDigits.findIndex((d) => d === "");
    const focusIndex = nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();
    if (!newDigits.includes("") && newDigits.join("").length === CODE_LENGTH) {
      setVerifiedCode(newDigits.join(""));
      setStep("password");
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setError("");
    try {
      const data = await forgotPassword({ phone_number: phone });
      setTimer(data.cooldown_seconds ?? RESEND_SECONDS);
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      if (err.status === 429) {
        setTimer(err.data?.cooldown_seconds ?? RESEND_SECONDS);
        setError(`Подождите ${err.data?.cooldown_seconds ?? RESEND_SECONDS} сек.`);
      } else {
        setError(err.message || "Не удалось отправить код.");
      }
    }
  };

  const PASSWORD_RE = /^[A-Za-z0-9!@#$%^&*()\-_+=\[\]{};:,.<>?]+$/;

  const validatePassword = (v) => {
    if (!v) return "Пароль обязателен";
    if (v.length < 6) return "Пароль - минимум 6 символов";
    if (v.length > 64) return "Пароль - не более 64 символов";
    if (!PASSWORD_RE.test(v)) return "Только латинские буквы, цифры и спецсимволы";
    if (!/[A-Za-z]/.test(v)) return "Пароль должен содержать хотя бы одну букву";
    return "";
  };

  const handleReset = async () => {
    setError("");
    if (!newPassword || !confirmPass) { setError("Заполните оба поля"); return; }
    const pwErr = validatePassword(newPassword);
    if (pwErr) { setError(pwErr); return; }
    if (newPassword !== confirmPass) { setError("Пароли не совпадают"); return; }
    setLoading(true);
    try {
      await resetPassword({ phone_number: phone, code: verifiedCode, new_password: newPassword });
      navigate("/login");
    } catch (err) {
      if (err.status === 429) {
        setError("Слишком много попыток. Запросите новый код.");
        setStep("code");
        setDigits(Array(CODE_LENGTH).fill(""));
        setVerifiedCode("");
      } else {
        setError(err.data?.detail || "Ошибка. Попробуйте ещё раз.");
        if (err.status === 400) {
          setStep("code");
          setDigits(Array(CODE_LENGTH).fill(""));
          setVerifiedCode("");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === "password") {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <button className="auth-back" onClick={() => { setStep("code"); setDigits(Array(CODE_LENGTH).fill("")); setVerifiedCode(""); setError(""); }}>‹</button>
          <h1 className="auth-title" style={{ textAlign: "left" }}>Новый пароль</h1>
          <p style={{ color: "var(--color-text-secondary, #9FA0A2)", fontSize: 14, margin: "0 0 16px" }}>
            Придумайте новый пароль для вашего аккаунта.
          </p>
          <input className="auth-input" type="password" placeholder="Новый пароль" value={newPassword} onChange={(e) => setNewPassword(e.target.value.slice(0, 64))} maxLength={64} />
          <input className="auth-input" type="password" placeholder="Подтверждение пароля" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value.slice(0, 64))} maxLength={64} />
          {error && <p style={{ color: "var(--color-error, #e53935)", fontSize: 13, margin: 0 }}>{error}</p>}
          <button className="auth-btn" onClick={handleReset} disabled={loading} style={{ opacity: loading ? 0.5 : 1 }}>
            {loading ? "Сохранение..." : "Сохранить пароль"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <button className="auth-back" onClick={() => navigate("/forgot-password")}>‹</button>
        <h1 className="auth-title" style={{ textAlign: "left" }}>Введите код</h1>
        <p className="otp-subtitle">Мы отправили SMS-код на номер {phone}</p>

        <div className="otp-grid" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              className="otp-cell"
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={loading}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
            />
          ))}
        </div>

        {error && <p style={{ color: "var(--color-error, #e53935)", fontSize: 13, margin: 0 }}>{error}</p>}

        <div className="otp-resend">
          <span>
            {timer > 0 ? `Получить код повторно через ${formatTimer(timer)}` : "Код можно запросить повторно"}
          </span>
          <span className="otp-resend-icon" onClick={handleResend} style={{ opacity: timer > 0 ? 0.4 : 1, cursor: timer > 0 ? "default" : "pointer" }}>↺</span>
        </div>
      </div>
    </div>
  );
}
