// src/pages/Legal/Legal.jsx
import { useNavigate } from "react-router-dom";
import "./Legal.css";

const ORG_ROWS = [
  { label: "Полное наименование", value: "Частное образовательное учреждение дополнительного профессионального образования Автошкола «Экипаж»" },
  { label: "Сокращённое", value: "ЧОУ ДПО Автошкола «Экипаж»" },
  { label: "Дата создания", value: "20 декабря 1999 года" },
  { label: "ОГРН", value: "1027402911470" },
  { label: "Учредители", value: "Соболев Ю.Н., Ударцев Г.В." },
  { label: "Юридический адрес", value: "454010, Челябинская обл., г. Челябинск, ул. Гагарина, д. 9а, каб. 402" },
  { label: "Учебный класс", value: "г. Челябинск, ул. Энтузиастов, 12, офис 302" },
  { label: "Автодром", value: "г. Челябинск, ул. Троицкая, 1Г" },
  { label: "Телефон", value: "8 (351) 278-28-28" },
  { label: "Эл. почта", value: "ekipage_74@mail.ru" },
  { label: "Сайт", value: "www.ekipage74.ru" },
  { label: "Режим работы", value: "Пн–Пт, 10:00–17:00; Сб–Вс — выходной" },
];

const DOCS = [
  {
    id: "personal-data-policy",
    title: "Политика обработки персональных данных",
    url: "/docs/personal-data-policy.pdf",
  },
  {
    id: "user-agreement",
    title: "Пользовательское соглашение",
    url: "/docs/user-agreement.pdf",
  },
];

export default function Legal() {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-header">
        <button className="legal-back" onClick={() => navigate(-1)}>
          <svg width="9" height="16" viewBox="0 0 9 16" fill="none">
            <path d="M8 1L1 8l7 7" stroke="#223BAB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="legal-title">Правовые документы</h1>
      </div>

      <div className="legal-content">
        <p className="legal-section-label">Основные сведения</p>

        <div className="legal-accordion-card">
          {ORG_ROWS.map((row, i) => (
            <div key={row.label} className={`legal-info-row${i < ORG_ROWS.length - 1 ? " legal-info-row--divider" : ""}`}>
              <span className="legal-info-label">{row.label}</span>
              <span className="legal-info-value">{row.value}</span>
            </div>
          ))}
        </div>

        <p className="legal-section-label">Документы</p>

        <div className="legal-list">
          {DOCS.map((doc) => (
            <a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="legal-item"
            >
              <div className="legal-item-icon">
                <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                  <path d="M12 1H3a2 2 0 00-2 2v18a2 2 0 002 2h14a2 2 0 002-2V8l-7-7z" stroke="#223BAB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 1v7h7" stroke="#223BAB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 13h8M6 17h5" stroke="#223BAB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="legal-item-title">{doc.title}</span>
              <svg className="legal-item-chevron" width="7" height="12" viewBox="0 0 8 14" fill="none">
                <path d="M1 1l6 6-6 6" stroke="#9FA0A2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}