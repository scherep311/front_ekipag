import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const DJANGO_URL = env.VITE_API_URL || "http://127.0.0.1:8000";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": { target: DJANGO_URL, changeOrigin: true },
        "/media": { target: DJANGO_URL, changeOrigin: true },
      },
    },
  };
});
