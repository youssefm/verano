// main.tsx - React application entry point

import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";

// Auto-update the service worker whenever a new version is available.
// On next launch (or page focus) the new SW activates immediately.
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
