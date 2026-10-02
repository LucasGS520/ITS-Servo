/**
 * Arquivo principal de inicialização da aplicação React
 * Configura o DOM root e renderiza o componente App
 */

import { createRoot } from "react-dom/client";
import App from "@/App";
import "./index.css";

// Obtém o elemento DOM com id "root" e renderiza o componente App nele
createRoot(document.getElementById("root")!).render(<App />);
