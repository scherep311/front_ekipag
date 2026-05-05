// sw.js — Service Worker для Web Push уведомлений
// Поддержка: Android Chrome, iOS Safari 16.4+ (Add to Home Screen)

const CACHE_NAME = "autoschool-v1";

// ── Push handler ──────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Автошкола", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Автошкола";
  const url   = data.url   || "/";

  const options = {
    body:    data.body || "",
    icon:    "/logo.png",
    badge:   "/logo.png",
    tag:     data.notification_id ? String(data.notification_id) : "default",
    // renotify: false — не трясти если тот же tag
    renotify: false,
    // requireInteraction: true — уведомление не исчезнет само (важно для iOS)
    requireInteraction: false,
    data: { url },
    // vibrate работает на Android, игнорируется на iOS
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Notification click ────────────────────────────────────────────────────────

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.focus();
          client.postMessage({ type: "NAVIGATE", url: targetUrl });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Install / Activate ────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  // Активируем сразу, не ждём закрытия старых вкладок
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Чистим старые кэши при обновлении SW
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      ),
    ])
  );
});

// ── Fetch — network first, без агрессивного кэширования ──────────────────────
// Для push-уведомлений кэш не нужен. Но SW должен перехватывать fetch
// чтобы iOS считал его "полноценным" (иначе push может не работать).

self.addEventListener("fetch", (event) => {
  // Пропускаем API запросы и chrome-extension
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith("/api/") ||
    url.protocol === "chrome-extension:"
  ) {
    return;
  }
  // Всё остальное — network first
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});