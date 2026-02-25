import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  root: ".",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false, // use the existing public/manifest.json
      workbox: {
        // Cache app shell and assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Skip waiting and claim clients immediately on update
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  build: {
    outDir: "dist",
  },
  server: {
    open: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js"],
  },
});
