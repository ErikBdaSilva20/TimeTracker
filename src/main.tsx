import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { isPreviewMode } from "./lib/preview";
import { installPreviewFetch } from "../preview-fixtures";
import "./styles.css";

// Instalado antes do render (não num useEffect): AuthProvider já dispara seu
// próprio auth.me() no mount, e efeitos de componentes filhos rodam antes do
// efeito de App — instalar o mock ali chegaria tarde pra essa primeira
// checagem de sessão.
if (isPreviewMode()) {
  installPreviewFetch();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
