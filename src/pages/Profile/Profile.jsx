// src/pages/Profile/Profile.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav/BottomNav";
import "./Profile.css";
import { getProfile, uploadPhoto } from "../../api/student";
import { logout } from "../../api/auth";
import { clearSession } from "../../api/client";

export default function Profile() {
  const navigate = useNavigate();
  const [profile,          setProfile]          = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [uploading,        setUploading]        = useState(false);
  const [error,            setError]            = useState("");
  const [showLogoutModal,  setShowLogoutModal]  = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchProfile(); }, []);

  async function fetchProfile() {
    setLoading(true);
    setError("");
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (e) {
      if (e.message === "session_expired") { navigate("/login"); return; }
      setError("Не удалось загрузить профиль");
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!allowed.includes(file.type)) { setError("Допустимые форматы: JPG, PNG, WEBP"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Файл слишком большой (максимум 5 МБ)"); return; }
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const data = await uploadPhoto(formData);
      setProfile((prev) => ({ ...prev, photo_url: data.photo_url }));
    } catch (e) {
      if (e.message === "session_expired") { navigate("/login"); return; }
      setError(e.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleLogoutConfirm() {
    const refresh = localStorage.getItem("refresh");
    try { if (refresh) await logout({ refresh }); } catch (_) {}
    clearSession();
    navigate("/login");
  }

  function formatPhone(raw) {
    if (!raw) return "";
    const d = raw.replace(/\D/g, "");
    if (d.length === 11) return `+${d[0]} ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
    return raw;
  }

  function getInitials(p) {
    if (!p) return "?";
    return `${(p.first_name || "")[0] || ""}${(p.last_name || "")[0] || ""}`.toUpperCase();
  }

  function kppLabel(kpp) {
    if (!kpp) return "";
    if (kpp === "МКПП" || kpp === "MANUAL") return "МКПП";
    if (kpp === "AКПП" || kpp === "AUTOMATIC") return "АКПП";
    return kpp;
  }

  if (loading) {
    return <div className="profile-loading"><div className="profile-spinner" /><span>Загрузка профиля...</span></div>;
  }

  if (error && !profile) {
    return <div className="profile-error-state"><p>{error}</p><button onClick={fetchProfile} className="profile-retry-btn">Повторить</button></div>;
  }

  const instr = profile?.instructor;

  return (
    <div className="profile-page">
      <div className="profile-content">

        <div className="profile-student-card">
          <div className="profile-title-row">
            <h1 className="profile-title">Профиль</h1>
            <button className="profile-logout-inline" onClick={() => setShowLogoutModal(true)}>Выйти</button>
          </div>
          <div className="profile-student-row">
            <div className="profile-avatar-wrap">
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="Фото профиля" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">{getInitials(profile)}</div>
              )}
              <button
                className={`profile-avatar-edit-btn${uploading ? " uploading" : ""}`}
                onClick={() => !uploading && fileInputRef.current?.click()}
                disabled={uploading}
                title="Изменить фото"
              >
                {uploading ? (
                  <div className="avatar-spinner" />
                ) : (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M3 17v3h3l11-11-3-3L3 17zm19.7-11.3c.4-.4.4-1 0-1.4l-1.6-1.6a1 1 0 00-1.4 0l-1.3 1.3 3 3 1.3-1.3z" fill="#fff"/>
                  </svg>
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="profile-file-input" onChange={handlePhotoChange} />
            </div>

            <div className="profile-student-info">
              <div className="profile-student-name">{profile?.last_name} {profile?.first_name}</div>
              {profile?.tariff && (
                <div className="profile-student-meta">
                  Тариф: {profile.tariff?.name ?? profile.tariff}
                </div>
              )}
              {!profile?.tariff && profile?.type_kpp && (
                <div className="profile-student-meta">{kppLabel(profile.type_kpp)}</div>
              )}
              {profile?.group && (
                <div className="profile-group-block">
                  <span className="profile-group-label">Группа</span>
                  <span className="profile-group-number">{profile.group.name}</span>
                </div>
              )}
            </div>
          </div>

          {error && <p className="profile-photo-error">{error}</p>}
          <div className="profile-divider" />

          <button className="profile-referral-row" onClick={() => navigate("/referrals")}>
            <span className="profile-referral-label">
              Приглашенных друзей:&nbsp;<strong>{profile?.count_friend ?? 0}</strong>
            </span>
            <svg className="profile-chevron" width="7" height="12" viewBox="0 0 8 14" fill="none">
              <path d="M1 1l6 6-6 6" stroke="#9FA0A2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {instr && (
          <div className="profile-instructor-section">
            <div className="profile-section-title">Мой инструктор</div>
            <div className="profile-instructor-card">
              <div className="profile-instr-row">
                {instr.photo_url ? (
                  <img src={instr.photo_url} alt="Инструктор" className="profile-instr-avatar" />
                ) : (
                  <div className="profile-instr-avatar-placeholder">
                    {instr.full_name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                )}
                <div className="profile-instr-info">
                  <div className="profile-instr-name">{instr.full_name?.split(" ").slice(0, 2).join(" ")}</div>
                  {instr.phone_number && (
                    <a href={`tel:+${instr.phone_number}`} className="profile-instr-phone">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 13a19.79 19.79 0 01-3.07-8.67A2 2 0 012 2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#9FA0A2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {formatPhone(instr.phone_number)}
                    </a>
                  )}
                  {instr.birth_date && (
                    <div className="profile-instr-birth">
                      {instr.birth_date}
                    </div>
                  )}
                  {(instr.car_brand || instr.car_color || instr.car_plate) && (
                    <div className="profile-car-values">
                      {[instr.car_brand, instr.car_color, instr.car_plate].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="profile-bottom-block">
          <div className="profile-contact-card">
            <span className="profile-contact-label">Контактная информация</span>
            <div className="profile-contact-row">
              <div className="profile-contact-left">
                <div className="profile-contact-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 13a19.79 19.79 0 01-3.07-8.67A2 2 0 012 2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#223BAB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>+7 351 278-28-28</span>
                </div>
                <div className="profile-contact-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#223BAB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="10" r="3" stroke="#223BAB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>г. Челябинск,<br/>ул. Энтузиастов, 12 офис 302</span>
                </div>
              </div>
              <div className="profile-contact-right">
                <span>пн-пт: 10:00-17:00</span>
                <span>сб-вс: выходной</span>
              </div>
            </div>
          </div>
          <div className="profile-legal-card">
            <button className="profile-legal-row" onClick={() => navigate("/legal")}>
              <span className="profile-legal-label">Правовые документы</span>
              <svg className="profile-chevron" width="7" height="12" viewBox="0 0 8 14" fill="none">
                <path d="M1 1l6 6-6 6" stroke="#9FA0A2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <BottomNav active="profile" />

      {showLogoutModal && (
        <div className="logout-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-title">Выйти из профиля?</div>
            <div className="logout-modal-text">Вы будете перенаправлены на экран входа. Все данные профиля сохранятся.</div>
            <button className="logout-modal-btn-confirm" onClick={handleLogoutConfirm}>Выйти</button>
            <button className="logout-modal-btn-cancel" onClick={() => setShowLogoutModal(false)}>Отмена</button>
          </div>
        </div>
      )}
    </div>
  );
}