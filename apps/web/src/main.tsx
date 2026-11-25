import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "./estilos.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { ProveedorSesion } from "./lib/sesion";

try {
  if (localStorage.getItem("hilo_texto_grande") === "1") {
    document.documentElement.style.fontSize = "125%";
  }
} catch {
  // Sin almacenamiento disponible.
}

const raiz = document.getElementById("raiz");
if (!raiz) throw new Error("No se encontró el elemento #raiz");

createRoot(raiz).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorSesion>
        <App />
      </ProveedorSesion>
    </BrowserRouter>
  </StrictMode>,
);
