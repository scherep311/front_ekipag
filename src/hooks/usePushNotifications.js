// src/hooks/usePushNotifications.js
import { useState, useCallback } from "react";
import { getVapidKey, savePushSubscription, deletePushSubscription } from "../api/student";

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  if (!("Notification" in window)) return;
  if (Notification.permission === "denied") return;

  const perm = await Notification.requestPermission();
  if (perm !== "granted") return;

  try {
    const { vapid_public_key } = await getVapidKey();
    if (!vapid_public_key) {
      console.error("subscribeToPush: VAPID_PUBLIC_KEY не задан на сервере");
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid_public_key),
      });
    }

    const json = sub.toJSON();
    await savePushSubscription({ endpoint: json.endpoint, keys: json.keys });
  } catch (err) {
    console.error("subscribeToPush error:", err);
  }
}

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [supported] = useState(
    "serviceWorker" in navigator && "PushManager" in window
  );

  const subscribe = useCallback(async () => {
    if (!supported) return { ok: false, reason: "not_supported" };
    try {
      await subscribeToPush();
      setPermission(Notification.permission);
      return { ok: Notification.permission === "granted" };
    } catch (err) {
      console.error("Push subscribe error:", err);
      return { ok: false, reason: "error", err };
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;

    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await deletePushSubscription({ endpoint });
    setPermission("default");
  }, [supported]);

  return { supported, permission, subscribe, unsubscribe, setPermission };
}
