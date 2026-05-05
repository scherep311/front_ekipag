// src/router.jsx
// Вся маршрутизация в одном месте.
// authLoader — защита приватных маршрутов: проверяет/обновляет токен.

import { createBrowserRouter, redirect, Outlet } from "react-router-dom";
import { refreshAccessToken, clearSession } from "./api/client";
import PushPermissionBanner from "./components/PushPermissionBanner";

// Страницы
import Login          from "./pages/Auth/Login";
import Register       from "./pages/Auth/Register";
import Verify         from "./pages/Auth/Verify";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword  from "./pages/Auth/ResetPassword";
import Home           from "./pages/Home/Home";
import Schedule       from "./pages/Schedule/Schedule";
import Theory         from "./pages/Theory/Theory";
import Profile        from "./pages/Profile/Profile";
import Payment        from "./pages/Payment/Payment";
import ReferralLanding from "./pages/Referrals/ReferralLanding";
import Referrals      from "./pages/Referrals/Referrals";
import Notifications  from "./pages/Notifications/Notifications";
import Legal          from "./pages/Legal/Legal";

// ── Auth guard ────────────────────────────────────────────────────────────────
async function authLoader() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return redirect("/login");
  try {
    await refreshAccessToken();
    return null;
  } catch {
    clearSession();
    return redirect("/login");
  }
}

// ── Guest guard — не пускать залогиненных на /login, /register ───────────────
async function guestLoader() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return null;
  try {
    await refreshAccessToken();
    return redirect("/");
  } catch {
    clearSession();
    return null;
  }
}

// ── Layout для приватной зоны — рендерит PushPermissionBanner глобально ──────
function AuthLayout() {
  return (
    <>
      <Outlet />
      <PushPermissionBanner />
    </>
  );
}

// ── Роутер ────────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // ── Публичные маршруты ───────────────────────────────────────────────────
  {
    path: "/login",
    loader: guestLoader,
    element: <Login />,
  },
  {
    path: "/register",
    loader: guestLoader,
    element: <Register />,
  },
  {
    path: "/verify",
    element: <Verify />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    // Реферальная ссылка — доступна всем
    path: "/ref/:token",
    element: <ReferralLanding />,
  },

  // ── Приватные маршруты (требуют авторизации) ─────────────────────────────
  {
    loader: authLoader,
    element: <AuthLayout />,
    children: [
      { path: "/",             element: <Home /> },
      { path: "/schedule",     element: <Schedule /> },
      { path: "/theory",       element: <Theory /> },
      { path: "/profile",      element: <Profile /> },
      { path: "/payment",      element: <Payment /> },
      { path: "/referrals",    element: <Referrals /> },
      { path: "/notifications", element: <Notifications /> },
      { path: "/legal",         element: <Legal /> },
    ],
  },
]);
