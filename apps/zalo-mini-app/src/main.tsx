import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.js";
import "./global.css";

function getOrCreateRoot() {
  const existingRoot = document.getElementById("root") || document.getElementById("bats-zalo-root");
  if (existingRoot) return existingRoot;

  const root = document.createElement("div");
  root.id = "bats-zalo-root";
  document.body.appendChild(root);
  return root;
}

function mountApp() {
  const root = getOrCreateRoot();
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

if (document.body) {
  mountApp();
} else {
  document.addEventListener("DOMContentLoaded", mountApp, { once: true });
}
