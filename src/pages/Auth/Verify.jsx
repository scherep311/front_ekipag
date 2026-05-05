// src/pages/Auth/Verify.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { subscribeToPush } from "../../hooks/usePushNotifications";
import "./auth.css";
import { verifyOtp, sendOtp } from "../../api/auth";

const CODE_LENGTH    = 6;
const RESEND_SECONDS = 60;

export default function Verify() {
  const navigate  = useNavigate();
  const location  = useLocation();
  // Телефон передаётся через router state (navigate("/verify", { state: { phone } }))
  const phone = location.state?.phone ?? "";

  const [digits,  setDigits]  = useState(Array(CODE_LENGTH).fill(""));
  const [timer,   setTimer]   = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
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
    if (fullCode.length === CODE_LENGTH && !newDigits.includes("")) submitCode(fullCode);
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
  };

  const submitCode = async (code) => {
    setLoading(true);
    setError("");
    try {
      const data = await verifyOtp({ phone_number: phone, code });
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      subscribeToPush();
      navigate("/");
    } catch (err) {
      if (err.status === 429) {
        setError(err.data?.detail || "Слишком много попыток. Запросите новый код.");
      } else {
        setError(err.message || "Неверный код. Попробуйте ещё раз.");
      }
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setError("");
    try {
      const data = await sendOtp({ phone_number: phone });
      setTimer(data.cooldown_seconds ?? RESEND_SECONDS);
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      if (err.status === 429) {
        const remaining = err.data?.cooldown_seconds ?? RESEND_SECONDS;
        setTimer(remaining);
        setError(`Подождите ${remaining} сек. перед повторной отправкой.`);
      } else {
        setError(err.message || "Не удалось отправить код.");
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <button className="auth-back" onClick={() => navigate("/register")}>‹</button>
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
            {timer > 0
              ? `Получить код повторно через ${formatTimer(timer)}`
              : "Код можно запросить повторно"}
          </span>
          <span
            className="otp-resend-icon"
            onClick={handleResend}
            style={{ opacity: timer > 0 ? 0.4 : 1, cursor: timer > 0 ? "default" : "pointer" }}
          >
            ↺
          </span>
        </div>
      </div>
    </div>
  );
}
