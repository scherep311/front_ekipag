// src/api/auth.js
// Все запросы авторизации — без токена, открытые эндпоинты.

export async function login({ phone_number, password }) {
  const res = await fetch("/api/student/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Неверный номер или пароль");
  return data; // { access, refresh }
}

export async function register(payload) {
  const res = await fetch("/api/student/auth/register/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export async function sendOtp({ phone_number }) {
  const res = await fetch("/api/student/auth/send-otp/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number }),
  });
  const data = await res.json();
  if (res.status === 429) throw { status: 429, data };
  if (!res.ok) throw new Error(data.detail || "Не удалось отправить SMS");
  return data;
}

export async function verifyOtp({ phone_number, code }) {
  const res = await fetch("/api/student/auth/verify/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number, code }),
  });
  const data = await res.json();
  if (res.status === 429) throw { status: 429, data };
  if (!res.ok) throw new Error(data.detail || "Неверный код");
  return data; // { access, refresh }
}

export async function forgotPassword({ phone_number }) {
  const res = await fetch("/api/student/auth/forgot-password/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number }),
  });
  const data = await res.json();
  if (res.status === 429) throw { status: 429, data };
  if (!res.ok) throw new Error(data.detail || "Ошибка");
  return data;
}

export async function resetPassword({ phone_number, code, new_password }) {
  const res = await fetch("/api/student/auth/reset-password/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number, code, new_password }),
  });
  const data = await res.json();
  if (res.status === 429) throw { status: 429, data };
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export async function logout({ refresh }) {
  return fetch("/api/student/auth/logout/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
}
