// src/api/student.js
// Все защищённые запросы студента — через apiFetch с авторефрешем.

import { apiFetch, apiFetchForm } from "./client";

// ── Профиль ──────────────────────────────────────────────────────────────────
export async function getProfile() {
  const res = await apiFetch("/api/student/profile/");
  if (!res.ok) throw new Error("Ошибка загрузки профиля");
  return res.json();
}

export async function uploadPhoto(formData) {
  const res = await apiFetchForm("/api/student/profile/photo/", {
    method: "PATCH",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Ошибка загрузки фото");
  return data; // { photo_url }
}

// ── Расписание ───────────────────────────────────────────────────────────────
export async function getUpcoming() {
  const res = await apiFetch("/api/student/schedule/upcoming/");
  if (!res.ok) throw new Error("Ошибка загрузки расписания");
  return res.json();
}

export async function getSlots(date) {
  const res = await apiFetch(`/api/student/schedule/slots/?date=${date}`);
  if (!res.ok) throw new Error("Ошибка загрузки слотов");
  return res.json();
}

export async function bookSlot(slot_id) {
  const res = await apiFetch("/api/student/schedule/book/", {
    method: "POST",
    body: JSON.stringify({ slot_id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.slot_id?.[0] || err?.detail || "Не удалось записаться");
  }
  return res.json();
}

export async function cancelBooking(id) {
  const res = await apiFetch(`/api/student/schedule/book/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Ошибка отмены слота ${id}`);
}

// ── Оплата ───────────────────────────────────────────────────────────────────
export async function getInvoices() {
  const res = await apiFetch("/api/student/invoices/");
  if (!res.ok) throw new Error("Ошибка загрузки счетов");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.invoices ?? []);
}

export async function confirmInvoice(id) {
  const res = await apiFetch(`/api/student/invoices/${id}/confirm/`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Ошибка подтверждения");
  return res.json();
}

// ── Теория ───────────────────────────────────────────────────────────────────
export async function getTickets() {
  const res = await apiFetch("/api/student/theory/tickets/");
  if (!res.ok) throw new Error("Ошибка загрузки билетов");
  return res.json();
}

export async function getTopics() {
  const res = await apiFetch("/api/student/theory/topics/");
  if (!res.ok) throw new Error("Ошибка загрузки тем");
  return res.json();
}

export async function startSession(body) {
  const res = await apiFetch("/api/student/theory/sessions/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Ошибка запуска сессии");
  return res.json();
}

export async function submitAnswer({ session_id, question_id, answer_index }) {
  const res = await apiFetch(`/api/student/theory/sessions/${session_id}/answer/`, {
    method: "POST",
    body: JSON.stringify({ question_id, answer_index }),
  });
  if (!res.ok) throw new Error("Ошибка отправки ответа");
  return res.json();
}

export async function finishSession(session_id) {
  const res = await apiFetch(`/api/student/theory/sessions/${session_id}/finish/`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Ошибка завершения сессии");
  return res.json();
}

export async function getHistory() {
  const res = await apiFetch("/api/student/theory/history/");
  if (!res.ok) throw new Error("Ошибка загрузки истории");
  return res.json();
}

// ── Уведомления ──────────────────────────────────────────────────────────────
export async function getNotificationsCount() {
  const res = await apiFetch("/api/student/notifications/count/");
  if (!res.ok) return { unread_count: 0 };
  return res.json();
}

export async function getNotifications() {
  const res = await apiFetch("/api/student/notifications/");
  if (!res.ok) throw new Error("Ошибка загрузки уведомлений");
  return res.json();
}

export async function markNotificationRead(id) {
  const res = await apiFetch(`/api/student/notifications/${id}/`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Ошибка");
  return res.json();
}

export async function markAllNotificationsRead() {
  const res = await apiFetch("/api/student/notifications/read-all/", {
    method: "POST",
  });
  if (!res.ok) throw new Error("Ошибка");
}

// ── Push-уведомления ─────────────────────────────────────────────────────────
export async function savePushSubscription({ endpoint, keys }) {
  const res = await apiFetch("/api/student/push/subscribe/", {
    method: "POST",
    body: JSON.stringify({ endpoint, keys }),
  });
  if (!res.ok) throw new Error("Ошибка сохранения подписки");
}

export async function deletePushSubscription({ endpoint }) {
  const res = await apiFetch("/api/student/push/subscribe/", {
    method: "DELETE",
    body: JSON.stringify({ endpoint }),
  });
  if (!res.ok) throw new Error("Ошибка удаления подписки");
}

export async function getVapidKey() {
  const res = await fetch("/api/student/push/vapid-public-key/");
  if (!res.ok) throw new Error("Ошибка получения VAPID key");
  return res.json(); // { vapid_public_key }
}
