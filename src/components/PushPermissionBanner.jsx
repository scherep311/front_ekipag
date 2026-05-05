import { useState, useEffect } from "react";
import { usePushNotifications } from "../hooks/usePushNotifications";

const DISMISSED_KEY = "push_banner_dismissed";

export default function PushPermissionBanner() {
  const { supported, permission, subscribe } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Не показываем если:
    // — уже разрешено (permission === "granted")
    // — уже отклонено (permission === "denied")
    // — пользователь нажал "Не сейчас" ранее
    if (
      permission === "granted" ||
      permission === "denied" ||
      localStorage.getItem(DISMISSED_KEY)
    ) return;

    const t = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(t);
  }, [permission]);

  if (!visible) return null;

  const handleEnable = async () => {
    setLoading(true);
    await subscribe();
    setLoading(false);
    setVisible(false);
    // После нажатия больше не показываем — браузер сам запомнил решение
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.banner}>
        <div style={styles.icon}>🔔</div>
        <div style={styles.text}>
          <p style={styles.title}>Включить уведомления?</p>
          <p style={styles.subtitle}>
            Мы пришлём напоминание о занятии и сообщим об изменениях в расписании.
          </p>
        </div>
        <div style={styles.actions}>
          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={handleEnable}
            disabled={loading}
          >
            {loading ? "..." : "Включить"}
          </button>
          <button
            style={{ ...styles.btn, ...styles.btnSecondary }}
            onClick={handleDismiss}
          >
            Не сейчас
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    bottom: 80,
    left: 0,
    right: 0,
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    padding: "0 16px",
    pointerEvents: "none",
  },
  banner: {
    background: "#1C1C1E",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: "16px",
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    maxWidth: 420,
    width: "100%",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    pointerEvents: "all",
  },
  icon: { fontSize: 28, lineHeight: 1, flexShrink: 0 },
  text: { flex: 1, minWidth: 0 },
  title: { margin: 0, fontSize: 15, fontWeight: 600, color: "#FFFFFF", lineHeight: 1.3 },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 },
  actions: { display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 },
  btn: { border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  btnPrimary: { background: "var(--color-blue, #0A84FF)", color: "#fff" },
  btnSecondary: { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" },
};