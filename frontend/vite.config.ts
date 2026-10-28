import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/.well-known": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/authorize": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/token": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/userinfo": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/jwks": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
