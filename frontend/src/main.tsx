import { Buffer } from "buffer";
if (typeof window !== "undefined") {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./theme/theme.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
