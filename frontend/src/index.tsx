import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { LoginGate } from "./components/LoginGate";

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <LoginGate>
      <App />
    </LoginGate>
  );
}