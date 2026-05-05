// src/App.jsx
// Теперь App — просто точка входа. Вся логика в router.jsx и api/

import { RouterProvider } from "react-router-dom";
import { router } from "./router";

export default function App() {
  return <RouterProvider router={router} />;
}
