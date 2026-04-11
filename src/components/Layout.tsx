import Header from "./Header";
import Footer from "./Footer";

/**
 * Layout principal da aplicação.
 * 
 * Este componente envolve as páginas com um `Header` no topo e um `Footer` na base,
 * fornecendo uma estrutura visual consistente em toda a aplicação.
 * 
 * - Props do componente
 * - Conteúdo da rota/página que será renderizado na seção principal
 * Estrutura completa do layout com header, conteúdo principal e footer
 */
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    // Contêiner principal que ocupa a altura mínima da tela e organiza os elementos em coluna
    <div className="flex min-h-screen flex-col">
      {/* Cabeçalho da aplicação */}
      <Header />
      {/* Seção principal que expande para preencher o espaço disponível */}
      <main className="flex-1">{children}</main>
      {/* Rodapé da aplicação */}
      <Footer />
    </div>
  );
};

export default Layout;
