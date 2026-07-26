import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeProvider";
import { ToastViewport } from "./components/Toast";
import { App } from "./App";
import "./theme/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <App />
        <ToastViewport />
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
);
