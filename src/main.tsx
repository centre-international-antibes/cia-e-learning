import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./i18n";
import { initRedesign } from "./lib/redesign";
import "./index.css";

const PREVIEW_RECOVERY_KEY = "__cia_preview_recovery__";
const PREVIEW_RECOVERY_WINDOW_MS = 10_000;
const PREVIEW_RECOVERY_MAX = 3;
const chunkLoadErrorPatterns = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
  /Loading chunk [\w-]+ failed/i,
  /Unable to preload CSS/i,
];

const getErrorMessage = (value: unknown) => {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  if (value && typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }
  return "";
};

const isRecoverablePreviewError = (value: unknown) =>
  chunkLoadErrorPatterns.some((pattern) => pattern.test(getErrorMessage(value)));

const recoverPreview = (reason: string) => {
  const now = Date.now();
  try {
    const raw = window.sessionStorage.getItem(PREVIEW_RECOVERY_KEY);
    let count = 0;
    let firstAt = now;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { count?: number; firstAt?: number };
        if (parsed && typeof parsed.firstAt === "number" && now - parsed.firstAt < PREVIEW_RECOVERY_WINDOW_MS) {
          count = typeof parsed.count === "number" ? parsed.count : 0;
          firstAt = parsed.firstAt;
        }
      } catch {
        // Treat malformed entries as a fresh window.
      }
    }

    if (count >= PREVIEW_RECOVERY_MAX) {
      console.warn(
        `[preview-recovery] Suppressing reload (reason=${reason}); ${count} recovery already within ${PREVIEW_RECOVERY_WINDOW_MS}ms.`,
      );
      return;
    }

    window.sessionStorage.setItem(
      PREVIEW_RECOVERY_KEY,
      JSON.stringify({ count: count + 1, firstAt, reason }),
    );
  } catch {
    // sessionStorage may be unavailable; fall through to a single reload attempt.
  }

  window.location.reload();
};

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  recoverPreview("vite:preloadError");
});

window.addEventListener(
  "error",
  (event) => {
    if (!isRecoverablePreviewError(event.error ?? event.message)) return;
    event.preventDefault();
    recoverPreview("window:error");
  },
  true,
);

window.addEventListener("unhandledrejection", (event) => {
  if (!isRecoverablePreviewError(event.reason)) return;
  event.preventDefault();
  recoverPreview("unhandledrejection");
});

// Le drapeau se pose avant le premier rendu : pas de bascule de police visible.
initRedesign();

createRoot(document.getElementById("root")!).render(<App />);
