import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Check if root element exists
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Make sure there is a <div id='root'></div> in index.html");
}

// Check environment variables
const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  console.warn("VITE_API_URL not set — defaulting to http://localhost:8000");
}

try {
  const root = createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} catch (error) {
  console.error("Failed to render app:", error);
  rootElement.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; background: #000; color: #fff; font-family: system-ui;">
      <h1>Ошибка загрузки приложения</h1>
      <p style="margin-top: 1rem; opacity: 0.8;">${error instanceof Error ? error.message : 'Unknown error'}</p>
      <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #3b82f6; color: #fff; border: none; border-radius: 0.5rem; cursor: pointer;">
        Перезагрузить
      </button>
    </div>
  `;
}
