// src/pages/Legal/Legal.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Legal.css";

const ORG_SECTIONS = [
  {
    title: "Основные сведения",
    rows: [
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
    ],
  },
  {
    title: "Структура и органы управления",
    rows: [
      { label: "Структурные подразделения", value: "Отсутствуют" },
      { label: "Филиалы", value: "Отсутствуют" },
      { label: "Правовая основа", value: "Конституция РФ, ГК РФ, ФЗ «О некоммерческих организациях», ФЗ «Об образовании в РФ», Устав организации" },
    ],
  },
  {
    title: "Документы организации",
    rows: [
      { label: "Лицензия", value: "Лицензия на осуществление образовательной деятельности" },
      { label: "Свидетельство", value: "Свидетельство о регистрации (ИНН)" },
      { label: "Устав", value: "Размещён на официальном сайте" },
      { label: "Акты проверок", value: "Размещены на официальном сайте" },
      { label: "Локальные акты", value: "Размещены на официальном сайте" },
    ],
  },
  {
    title: "Образование",
    rows: [
      { label: "Категория А", value: "130 ч. · очная / дистанционная" },
      { label: "Категория В (МКПП)", value: "190 ч. · очная / дистанционная" },
      { label: "Категория В (АКПП)", value: "188 ч. · очная / дистанционная" },
      { label: "Язык обучения", value: "Русский" },
      { label: "Численность (кат. В, МКПП)", value: "2 646 чел." },
      { label: "Численность (кат. В, АКПП)", value: "40 чел." },
    ],
  },
  {
    title: "Образовательные стандарты",
    rows: [
      { label: "Стандарты", value: "Не установлены для программ проф. подготовки водителей" },
      { label: "Основание (кат. А)", value: "ОСТ 9 ПО 04.02.01-96" },
      { label: "Основание (кат. В)", value: "ОСТ 9 ПО 04.02.02-96" },
      { label: "Федеральные законы", value: "№196-ФЗ от 10.12.1995, №273-ФЗ от 29.12.2012" },
      { label: "Приказ Минобрнауки", value: "№1408 от 26.12.2013" },
    ],
  },
  {
    title: "Руководство. Педагогический состав",
    rows: [
      { label: "Руководство", value: "Директор ЧОУ ДПО Автошкола «Экипаж»" },
      { label: "Педагогические работники", value: "Сведения размещены на официальном сайте" },
      { label: "Мастера производственного обучения", value: "Сведения размещены на официальном сайте" },
    ],
  },
  {
    title: "Материально-техническое обеспечение",
    rows: [
      { label: "Оснащение учебных помещений", value: "Не указано" },
      { label: "Объекты спорта", value: "Отсутствуют" },
      { label: "Средства обучения для инвалидов", value: "Отсутствуют" },
      { label: "Доступ инвалидов", value: "Не обеспечен" },
    ],
  },
  {
    title: "Стипендии и меры поддержки",
    rows: [
      { label: "Стипендии", value: "Не выплачиваются" },
      { label: "Меры социальной поддержки", value: "Не предоставляются" },
      { label: "Общежитие / интернат", value: "Не предоставляется" },
      { label: "Трудоустройство выпускников", value: "Не осуществляется" },
    ],
  },
  {
    title: "Платные образовательные услуги",
    rows: [
      { label: "Объём приёма — кат. А (МКПП)", value: "50 мест" },
      { label: "Объём приёма — подкат. А1 (МКПП)", value: "20 мест" },
      { label: "Объём приёма — кат. В (МКПП)", value: "233 места" },
      { label: "Договор (кат. А)", value: "Образец на официальном сайте" },
      { label: "Договор (кат. В)", value: "Образец на официальном сайте" },
    ],
  },
  {
    title: "Финансово-хозяйственная деятельность",
    rows: [
      { label: "План ФХД", value: "Не предусмотрен" },
      { label: "Отчёт о поступлении средств", value: "Не предоставляется" },
    ],
  },
  {
    title: "Вакантные места для приёма",
    rows: [
      { label: "Категория А (МКПП)", value: "20 мест" },
      { label: "Подкатегория А1 (МКПП)", value: "10 мест" },
      { label: "Категория В (МКПП)", value: "114 мест" },
    ],
  },
  {
    title: "Доступная среда",
    rows: [
      { label: "Доступ инвалидов в здания", value: "Не обеспечен" },
      { label: "Оборудованные кабинеты для ОВЗ", value: "Отсутствуют" },
      { label: "Спец. технические средства обучения", value: "Отсутствуют" },
      { label: "Условия питания", value: "Отсутствуют" },
      { label: "Охрана здоровья обучающихся", value: "Отсутствует" },
      { label: "Электронные образовательные ресурсы", value: "Отсутствуют" },
      { label: "Учёт обучающихся с ОВЗ", value: "Ведётся" },
      { label: "Ответственные лица", value: "Директор ЧОУ ДПО Автошкола «Экипаж»" },
    ],
  },
  {
    title: "Международное сотрудничество",
    rows: [
      { label: "Договоры с иностранными орг.", value: "Отсутствуют" },
      { label: "Международная аккредитация программ", value: "Отсутствует" },
    ],
  },
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

function ChevronIcon({ open }) {
  return (
    <svg
      className={`legal-accordion-chevron${open ? " legal-accordion-chevron--open" : ""}`}
      width="12" height="12" viewBox="0 0 12 12" fill="none"
    >
      <path d="M2 4l4 4 4-4" stroke="#9FA0A2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Legal() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  function toggle(i) {
    setOpenIndex(prev => (prev === i ? null : i));
  }

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
        <p className="legal-section-label">Сведения об образовательной организации</p>

        <div className="legal-accordion-card">
          {ORG_SECTIONS.map((section, i) => (
            <div key={section.title} className={`legal-accordion-item${i < ORG_SECTIONS.length - 1 ? " legal-accordion-item--divider" : ""}`}>
              <button className="legal-accordion-header" onClick={() => toggle(i)}>
                <span className="legal-accordion-title">{section.title}</span>
                <ChevronIcon open={openIndex === i} />
              </button>

              {openIndex === i && (
                <div className="legal-accordion-body">
                  {section.rows.map((row, j) => (
                    <div key={row.label} className={`legal-info-row${j < section.rows.length - 1 ? " legal-info-row--divider" : ""}`}>
                      <span className="legal-info-label">{row.label}</span>
                      <span className="legal-info-value">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
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
