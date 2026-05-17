import { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./ReferralLanding.css";
import { phoneToServer, makePhoneHandler } from "../Auth/phoneUtils";

// ── Компонент ─────────────────────────────────────────────────────────────────

/**
 * ReferralLanding — публичная страница реферальной ссылки.
 *
 * Props:
 *   token      — реферальный токен из URL (/ref/:token)
 *   onNavigate — функция навигации (опционально, для встройки в App)
 *
 * Стейт-машина:
 *   "loading"  — проверяем токен
 *   "invalid"  — токен недействителен
 *   "form"     — форма ввода данных
 *   "submitting" — отправка
 *   "success"  — данные сохранены
 *   "already"  — телефон уже в системе
 */
export default function ReferralLanding() {
  const { token } = useParams();
  const [pageState,   setPageState]   = useState("loading");
  const [inviterName, setInviterName] = useState("");

  // Поля формы
  const [phone,     setPhone]     = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [agreed,    setAgreed]    = useState(false);

  // Ошибки полей
  const [errors,      setErrors]      = useState({});
  const [serverError, setServerError] = useState("");

  const phoneRef = useRef(null);
  const handlePhoneChange = useCallback(
    makePhoneHandler(setPhone, phoneRef, () =>
      setErrors(prev => ({ ...prev, phone: "" }))
    ),
    []
  );

  // ── Шаг 1: валидируем токен при монтировании ─────────────────────────────
  useEffect(() => {
    if (!token) {
      setPageState("invalid");
      return;
    }

    // Базовая проверка формата токена на фронте (не лезем на сервер с мусором)
    if (!/^[a-zA-Z0-9]{8,64}$/.test(token)) {
      setPageState("invalid");
      return;
    }

    const controller = new AbortController();

    fetch(`/api/public/referral/validate/${encodeURIComponent(token)}/`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("invalid");
        return res.json();
      })
      .then((data) => {
        setInviterName(data.inviter_name || "");
        setPageState("form");
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setPageState("invalid");
      });

    return () => controller.abort();
  }, [token]);

  // ── Валидация формы ───────────────────────────────────────────────────────
  function validate() {
    const e = {};
    const RU = /^[А-ЯЁа-яё\s\-]{2,}$/;

    const digits = phoneToServer(phone);
    if (!phone || digits.length < 11) {
      e.phone = "Введите полный номер телефона";
    }

    if (!firstName.trim() || firstName.trim().length < 2) {
      e.firstName = "Введите имя";
    } else if (!RU.test(firstName.trim())) {
      e.firstName = "Только русские буквы";
    }

    if (!lastName.trim() || lastName.trim().length < 2) {
      e.lastName = "Введите фамилию";
    } else if (!RU.test(lastName.trim())) {
      e.lastName = "Только русские буквы";
    }

    return e;
  }

  // ── Отправка формы ────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");

    if (!agreed) {
      setErrors((prev) => ({ ...prev, agreed: "Необходимо дать согласие" }));
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setPageState("submitting");

    try {
      const res = await fetch("/api/public/referral/lead/", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          phone_number: phoneToServer(phone),
          first_name:   firstName.trim(),
          last_name:    lastName.trim(),
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Телефон уже зарегистрирован
        setPageState("already");
        return;
      }

      if (res.status === 429) {
        setServerError("Слишком много попыток. Попробуйте через минуту.");
        setPageState("form");
        return;
      }

      if (!res.ok) {
        // Ошибки полей от сервера
        const newErrors = {};
        if (data.phone_number) newErrors.phone     = Array.isArray(data.phone_number) ? data.phone_number[0] : data.phone_number;
        if (data.first_name)   newErrors.firstName = Array.isArray(data.first_name)   ? data.first_name[0]   : data.first_name;
        if (data.last_name)    newErrors.lastName  = Array.isArray(data.last_name)    ? data.last_name[0]    : data.last_name;
        if (Object.keys(newErrors).length) {
          setErrors(newErrors);
        } else {
          setServerError(data.detail || "Ошибка. Попробуйте ещё раз.");
        }
        setPageState("form");
        return;
      }

      setPageState("success");

    } catch {
      setServerError("Нет соединения с сервером. Попробуйте ещё раз.");
      setPageState("form");
    }
  }

  // ── Рендер: загрузка ──────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="rl-page">
        <div className="rl-header">
          <div className="rl-logo-text">АВТОШКОЛА<br /><span>"Экипаж"</span></div>
        </div>
        <div className="rl-loading">
          <div className="rl-spinner" />
        </div>
      </div>
    );
  }

  // ── Рендер: невалидный токен ──────────────────────────────────────────────
  if (pageState === "invalid") {
    return (
      <div className="rl-page">
        <div className="rl-header">
          <div className="rl-logo-text">АВТОШКОЛА<br /><span>"Экипаж"</span></div>
        </div>
        <div className="rl-card rl-card--center">
          <div className="rl-icon-wrap rl-icon-wrap--warn">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="rl-card-title">Ссылка недействительна</h2>
          <p className="rl-card-text">
            Реферальная ссылка устарела или не существует.<br />
            Попросите друга отправить новую ссылку.
          </p>
        </div>
      </div>
    );
  }

  // ── Рендер: уже зарегистрирован ───────────────────────────────────────────
  if (pageState === "already") {
    return (
      <div className="rl-page">
        <div className="rl-header">
          <div className="rl-logo-text">АВТОШКОЛА<br /><span>"Экипаж"</span></div>
        </div>
        <div className="rl-card rl-card--center">
          <div className="rl-icon-wrap rl-icon-wrap--info">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="rl-card-title">Номер уже в системе</h2>
          <p className="rl-card-text">
            Этот номер телефона уже зарегистрирован в автошколе.<br />
            Скидка по реферальной программе действует только для новых учеников.
          </p>
          <button
            className="rl-btn"
            onClick={() => { setPageState("form"); setPhone(""); setErrors({}); setServerError(""); }}
          >
            Ввести другой номер
          </button>
        </div>
      </div>
    );
  }

  // ── Рендер: успех ─────────────────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <div className="rl-page">
        <div className="rl-header">
          <div className="rl-logo-text">АВТОШКОЛА<br /><span>"Экипаж"</span></div>
        </div>
        <div className="rl-card rl-card--center">
          <div className="rl-icon-wrap rl-icon-wrap--success">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="rl-card-title">Скидка закреплена!</h2>
          <p className="rl-card-text">
            Ваши данные сохранены. Скидка будет автоматически применена
            при регистрации в приложении по этому номеру телефона.
          </p>
          <div className="rl-success-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 13a19.79 19.79 0 01-3.07-8.67A2 2 0 012 2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>+7 351 278-28-28</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Рендер: форма (form | submitting) ─────────────────────────────────────
  const isSubmitting = pageState === "submitting";

  return (
    <div className="rl-page">
      {/* Шапка */}
      <div className="rl-header">
        <div className="rl-logo-text">АВТОШКОЛА<br /><span>"Экипаж"</span></div>
      </div>

      {/* Карточка */}
      <div className="rl-card-wrap">
        <img src="/icons/nav/referral.png" alt="Инструктор" className="rl-hero-img" />
        <div className="rl-card">
        <h1 className="rl-title">Вас пригласили<br />в автошколу!</h1>

        {inviterName && (
          <div className="rl-inviter">
            <span className="rl-inviter-icon">🎁</span>
            <span className="rl-inviter-label">
              Пригласил: <strong>{inviterName}</strong>
            </span>
          </div>
        )}
        <p className="rl-subtitle">Вам доступна скидка на оплату теоретических занятий!</p>
        <p className="rl-subtitle">Данные для получения скидки</p>

        <form className="rl-form" onSubmit={handleSubmit} noValidate>
          {/* Телефон */}
          <div className="rl-field">
            <input
              ref={phoneRef}
              className={`rl-input${errors.phone ? " rl-input--error" : ""}`}
              type="tel"
              placeholder="Номер телефона"
              value={phone}
              onChange={handlePhoneChange}
              disabled={isSubmitting}
              autoComplete="tel"
              inputMode="tel"
            />
            {errors.phone && <span className="rl-field-error">{errors.phone}</span>}
          </div>

          {/* Имя + Фамилия */}
          <div className="rl-row">
            <div className="rl-field">
              <input
                className={`rl-input${errors.firstName ? " rl-input--error" : ""}`}
                type="text"
                placeholder="Имя"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setErrors((prev) => { const n = { ...prev }; delete n.firstName; return n; });
                }}
                disabled={isSubmitting}
                autoComplete="given-name"
                autoCapitalize="words"
                spellCheck={false}
              />
              {errors.firstName && <span className="rl-field-error">{errors.firstName}</span>}
            </div>
            <div className="rl-field">
              <input
                className={`rl-input${errors.lastName ? " rl-input--error" : ""}`}
                type="text"
                placeholder="Фамилия"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setErrors((prev) => { const n = { ...prev }; delete n.lastName; return n; });
                }}
                disabled={isSubmitting}
                autoComplete="family-name"
                autoCapitalize="words"
                spellCheck={false}
              />
              {errors.lastName && <span className="rl-field-error">{errors.lastName}</span>}
            </div>
          </div>

          {/* Согласие */}
          <div className={`rl-checkbox-row${errors.agreed ? " rl-checkbox-row--error" : ""}`}>
            <input
              id="rl-agree"
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                setErrors((prev) => { const n = { ...prev }; delete n.agreed; return n; });
              }}
              disabled={isSubmitting}
            />
            <label htmlFor="rl-agree">
              Я даю согласие на{" "}
              <a
                href="/docs/personal-data-policy.pdf"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Обработку персональных данных
              </a>
              .
            </label>
          </div>
          {errors.agreed && <span className="rl-field-error">{errors.agreed}</span>}

          {/* Серверная ошибка */}
          {serverError && <p className="rl-server-error">{serverError}</p>}

          {/* Кнопка */}
          <button
            className="rl-btn"
            type="submit"
            disabled={isSubmitting || !agreed}
            style={{ opacity: isSubmitting || !agreed ? 0.6 : 1 }}
          >
            {isSubmitting ? (
              <span className="rl-btn-loading">
                <span className="rl-btn-spinner" />
                Сохранение...
              </span>
            ) : (
              "Закрепить скидку"
            )}
          </button>
        </form>

        <p className="rl-disclaimer">
          Скидка действует только для новых учеников и будет
          доступна после регистрации в приложении по этому телефону.
        </p>
      </div>
      </div>
    </div>
  );
}