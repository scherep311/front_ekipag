// src/components/BottomNav/BottomNav.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./BottomNav.css";

const NAV_ITEMS = [
  { key: "theory",    icon: "/icons/nav/theory.svg",    path: "/theory" },
  { key: "schedule",  icon: "/icons/nav/schedule.svg",  path: "/schedule" },
  { key: "home",      icon: "/icons/nav/home.svg",      path: "/" },
  { key: "payment",   icon: "/icons/nav/payment.svg",   path: "/payment" },
  { key: "profile",   icon: "/icons/nav/profile.svg",   path: "/profile" },
];

export default function BottomNav({ active }) {
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ key, label, icon, path }) => {
        const isActive = key === active;
        return (
          <button
            key={key}
            className={`bnav-item${isActive ? " bnav-item--active" : ""}`}
            onClick={() => navigate(path)}
            aria-label={label}
          >
            <img
              src={icon}
              alt={label}
              className={`bnav-icon${isActive ? " bnav-icon--active" : ""}`}
            />
            <span className="bnav-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
