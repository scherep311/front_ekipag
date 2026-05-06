// src/pages/Auth/Register.jsx
import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import { register, sendOtp } from "../../api/auth";
import { phoneToServer, makePhoneHandler } from "./phoneUtils";

const RU_NAME_RE  = /^[А-ЯЁа-яё\s\-]+$/;
const PASSWORD_RE = /^[A-Za-z0-9!@#$%^&*()\-_+=\[\]{};:,.<>?]+$/;

function validateName(value, label) {
  const trimmed = value.trim();
  if (!trimmed) return `${label} обязательно`;
  if (trimmed.length < 2) return `${label} - минимум 2 символа`;
  if (trimmed.length > 50) return `${label} - не более 50 символов`;
  if (!RU_NAME_RE.test(trimmed)) return `${label} — только русские буквы`;
  const tokens = trimmed.split(/[\s\-]+/);
  for (const token of tokens) {
    if (token && token.length < 2) return `${label} - каждая часть должна содержать минимум 2 буквы`;
  }
  return "";
}

function validatePhone(raw) {
  const digits = raw.replace(/\D/g, "");
  if (!digits || digits.length < 2) return "Введите номер телефона";
  if (digits.length < 11) return "Введите полный номер телефона";
  if (!/^7\d{10}$/.test(digits)) return "Номер должен начинаться с +7 или 8";
  return "";
}

function validatePassword(value) {
  if (!value) return "Пароль обязателен";
  if (value.length < 6) return "Пароль - минимум 6 символов";
  if (value.length > 64) return "Пароль - не более 64 символов";
  if (!PASSWORD_RE.test(value)) return "Только латинские буквы, цифры и спецсимволы";
  if (!/[A-Za-z]/.test(value)) return "Пароль должен содержать хотя бы одну букву";
  return "";
}

export default function Register() {
  useEffect(() => {
    document.body.classList.add('auth-mode');
    return () => document.body.classList.remove('auth-mode');
  }, []);

  const navigate = useNavigate();
  const phoneRef = useRef(null);

  const [lastName,          setLastName]          = useState("");
  const [firstName,         setFirstName]         = useState("");
  const [middleName,        setMiddleName]         = useState("");
  const [dateBirth,         setDateBirth]         = useState("");
  const [dateBirthFocused,  setDateBirthFocused]  = useState(false);
  const [phone,             setPhone]             = useState("");
  const [password,        setPassword]        = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors,          setErrors]          = useState({});
  const [agreePersonal,   setAgreePersonal]   = useState(false);
  const [agreeTerms,      setAgreeTerms]      = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [serverError,     setServerError]     = useState("");

  const clearError = useCallback((field) => {
    setErrors(prev => { if (!prev[field]) return prev; const next = { ...prev }; delete next[field]; return next; });
  }, []);

  const handlePhoneChange = useCallback(
    makePhoneHandler(setPhone, phoneRef, () => clearError("phone")),
    [clearError]
  );

  const handleDateBirthChange = useCallback((e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) formatted = digits.slice(0, 2) + "." + digits.slice(2, 4) + "." + digits.slice(4);
    else if (digits.length > 2) formatted = digits.slice(0, 2) + "." + digits.slice(2);
    setDateBirth(formatted);
    clearError("dateBirth");
  }, [clearError]);

  const validate = () => {
    const e = {};
    const ln = validateName(lastName,   "Фамилия");
    const fn = validateName(firstName,  "Имя");
    if (ln) e.lastName  = ln;
    if (fn) e.firstName = fn;
    if (middleName.trim()) { const mn = validateName(middleName, "Отчество"); if (mn) e.middleName = mn; }
    if (!dateBirth || dateBirth.length < 10) {
      e.dateBirth = "Введите дату рождения";
    } else {
      const [dd, mm, yyyy] = dateBirth.split(".").map(Number);
      const bd = new Date(yyyy, mm - 1, dd);
      const isValidDate = bd.getFullYear() === yyyy && bd.getMonth() === mm - 1 && bd.getDate() === dd;
      if (!isValidDate) {
        e.dateBirth = "Введите корректную дату";
      } else {
        const today = new Date();
        let age = today.getFullYear() - bd.getFullYear();
        if (today.getMonth() < bd.getMonth() || (today.getMonth() === bd.getMonth() && today.getDate() < bd.getDate())) age--;
        if (bd > today) e.dateBirth = "Дата рождения не может быть в будущем";
        else if (age < 14) e.dateBirth = "Возраст должен быть не менее 14 лет";
        else if (age > 100) e.dateBirth = "Введите корректную дату рождения";
      }
    }
    const ph = validatePhone(phone);
    if (ph) e.phone = ph;
    const pw = validatePassword(password);
    if (pw) e.password = pw;
    if (!passwordConfirm) e.passwordConfirm = "Подтвердите пароль";
    else if (password !== passwordConfirm) e.passwordConfirm = "Пароли не совпадают";
    return e;
  };

  const canSubmit = agreePersonal && agreeTerms && !loading;

  const handleSubmit = async () => {
    setServerError("");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    if (!agreePersonal || !agreeTerms) return;
    setLoading(true);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    try {
      const [dd, mm, yyyy] = dateBirth.split(".");
      await register({
        first_name:   firstName.trim(),
        last_name:    lastName.trim(),
        patronymic:   middleName.trim(),
        birth_date:   `${yyyy}-${mm}-${dd}`,
        phone_number: phoneToServer(phone),
        password,
        consent:      true,
      });
    } catch (err) {
      const { data } = err;
      const fieldMap = { first_name: "firstName", last_name: "lastName", patronymic: "middleName", birth_date: "dateBirth", phone_number: "phone", password: "password" };
      const backendErrors = {};
      let hasFieldError = false;
      Object.entries(data || {}).forEach(([key, msgs]) => {
        const frontKey = fieldMap[key];
        if (frontKey) { backendErrors[frontKey] = Array.isArray(msgs) ? msgs[0] : msgs; hasFieldError = true; }
      });
      if (hasFieldError) setErrors(backendErrors);
      else setServerError(data?.detail || "Ошибка регистрации. Попробуйте ещё раз.");
      setLoading(false);
      return;
    }

    try {
      await sendOtp({ phone_number: phoneToServer(phone) });
      navigate("/verify", { state: { phone: phoneToServer(phone) } });
    } catch (err) {
      setServerError(err.message || "Не удалось отправить SMS. Попробуйте позже.");
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
        <h1 className="auth-title">Регистрация</h1>

        <div className="auth-field">
          <input className={`auth-input${errors.lastName ? " auth-input--error" : ""}`} type="text" placeholder="Фамилия" value={lastName}
            onChange={(e) => { setLastName(e.target.value.slice(0, 50)); clearError("lastName"); }}
            autoComplete="family-name" autoCorrect="off" autoCapitalize="words" spellCheck={false} maxLength={50} />
          {errors.lastName && <span className="auth-field-error">{errors.lastName}</span>}
        </div>

        <div className="auth-field">
          <input className={`auth-input${errors.firstName ? " auth-input--error" : ""}`} type="text" placeholder="Имя" value={firstName}
            onChange={(e) => { setFirstName(e.target.value.slice(0, 50)); clearError("firstName"); }}
            autoComplete="given-name" autoCorrect="off" autoCapitalize="words" spellCheck={false} maxLength={50} />
          {errors.firstName && <span className="auth-field-error">{errors.firstName}</span>}
        </div>

        <div className="auth-field">
          <input className={`auth-input${errors.middleName ? " auth-input--error" : ""}`} type="text" placeholder="Отчество (необязательно)" value={middleName}
            onChange={(e) => { setMiddleName(e.target.value.slice(0, 50)); clearError("middleName"); }}
            autoComplete="additional-name" autoCorrect="off" autoCapitalize="words" spellCheck={false} maxLength={50} />
          {errors.middleName && <span className="auth-field-error">{errors.middleName}</span>}
        </div>

        <div className="auth-field">
          <input className={`auth-input${errors.dateBirth ? " auth-input--error" : ""}`} type="text"
            inputMode="numeric" placeholder={dateBirthFocused ? "дд.мм.гггг" : "Дата рождения"}
            value={dateBirth} onChange={handleDateBirthChange}
            onFocus={() => setDateBirthFocused(true)} onBlur={() => setDateBirthFocused(false)}
            autoComplete="bday" maxLength={10} />
          {errors.dateBirth && <span className="auth-field-error">{errors.dateBirth}</span>}
        </div>

        <div className="auth-field">
          <input ref={phoneRef} className={`auth-input${errors.phone ? " auth-input--error" : ""}`} type="tel"
            placeholder="+7 (9__) ___-__-__" value={phone} onChange={handlePhoneChange} autoComplete="tel" />
          {errors.phone && <span className="auth-field-error">{errors.phone}</span>}
        </div>

        <div className="auth-field">
          <input className={`auth-input${errors.password ? " auth-input--error" : ""}`} type="password"
            placeholder="Введите пароль" value={password}
            onChange={(e) => { setPassword(e.target.value.slice(0, 64)); clearError("password"); }}
            autoComplete="new-password" maxLength={64} />
          {errors.password && <span className="auth-field-error">{errors.password}</span>}
        </div>

        <div className="auth-field">
          <input className={`auth-input${errors.passwordConfirm ? " auth-input--error" : ""}`} type="password"
            placeholder="Подтверждение пароля" value={passwordConfirm}
            onChange={(e) => { setPasswordConfirm(e.target.value.slice(0, 64)); clearError("passwordConfirm"); }}
            autoComplete="new-password" maxLength={64} />
          {errors.passwordConfirm && <span className="auth-field-error">{errors.passwordConfirm}</span>}
        </div>

        <div className="auth-checkbox-row">
          <input id="agree-personal" type="checkbox" checked={agreePersonal} onChange={(e) => setAgreePersonal(e.target.checked)} />
          <label htmlFor="agree-personal">
            Я даю согласие на{" "}
            <a href="/docs/personal-data-policy.pdf" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              Обработку персональных данных
            </a>.
          </label>
        </div>

        <div className="auth-checkbox-row">
          <input id="agree-terms" type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
          <label htmlFor="agree-terms">
            Я принимаю условия{" "}
            <a href="/docs/user-agreement.pdf" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              Пользовательского соглашения
            </a>.
          </label>
        </div>

        {serverError && <p className="auth-server-error">{serverError}</p>}

        <button className="auth-btn" onClick={handleSubmit} disabled={!canSubmit} style={{ opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? "pointer" : "not-allowed" }}>
          {loading ? "Отправка..." : "Зарегистрироваться"}
        </button>

        <p className="auth-footer">
          Есть аккаунт? <span onClick={() => navigate("/login")}>Войти</span>
        </p>
      </div>
    </div>
  );
}
