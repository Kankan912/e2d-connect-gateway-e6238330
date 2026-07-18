import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initSentry } from "./lib/sentry";

// Sentry no-op si VITE_SENTRY_DSN n'est pas défini (Lot 4).
void initSentry();

createRoot(document.getElementById("root")!).render(<App />);
