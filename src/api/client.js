// src/api/client.js
// Единственное место где живёт fetch-логика, авторефреш токена и сессия.
// ВСЕ компоненты импортируют apiFetch отсюда — не из App.jsx.

export function clearSession() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) throw new Error("no_refresh");

  const res = await fetch("/api/token/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) throw new Error("refresh_expired");

  const data = await res.json();
  localStorage.setItem("access", data.access);
  if (data.refresh) localStorage.setItem("refresh", data.refresh);
  return data.access;
}

/**
 * Универсальный fetch с Bearer-токеном и авторефрешем.
 * Бросает Error("session_expired") если сессия истекла.
 */
export async function apiFetch(url, options = {}) {
  const makeRequest = (token) =>
    fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

  let res = await makeRequest(localStorage.getItem("access") || "");

  if (res.status === 401) {
    try {
      const newAccess = await refreshAccessToken();
      res = await makeRequest(newAccess);
    } catch {
      clearSession();
      throw new Error("session_expired");
    }
  }

  return res;
}

/**
 * apiFetch без Content-Type — для FormData (загрузка фото).
 */
export async function apiFetchForm(url, options = {}) {
  const makeRequest = (token) =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

  let res = await makeRequest(localStorage.getItem("access") || "");

  if (res.status === 401) {
    try {
      const newAccess = await refreshAccessToken();
      res = await makeRequest(newAccess);
    } catch {
      clearSession();
      throw new Error("session_expired");
    }
  }

  return res;
}
