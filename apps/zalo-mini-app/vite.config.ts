import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import zmpVitePlugin from "zmp-vite-plugin";
import path from "node:path";

export default defineConfig({
  base: "./",
  plugins: [zmpVitePlugin(), react()],
  server: {
    port: 3500,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:4400",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "www",
  },
});
