// Importa matchers customizados do testing-library para Jest
import "@testing-library/jest-dom";

/**
 * Configura a API matchMedia no objeto window
 * Esta é uma polyfill necessária para testes com Jest, pois a API
 * matchMedia não está disponível no ambiente Node.js
 */
Object.defineProperty(window, "matchMedia", {
  writable: true,
  // Função que retorna um objeto compatível com a API MediaQueryList
  value: (query: string) => ({
    // Indica se a media query corresponde ao estado atual
    matches: false,
    // A media query string fornecida
    media: query,
    // Callback disparado quando o estado da media query muda
    onchange: null,
    // Método legado para adicionar listeners
    addListener: () => {},
    // Método legado para remover listeners
    removeListener: () => {},
    // Adiciona um listener de evento
    addEventListener: () => {},
    // Remove um listener de evento
    removeEventListener: () => {},
    // Dispara um evento
    dispatchEvent: () => {},
  }),
});
