import { Outlet } from "react-router-dom";
import logoIts from "@/common/assets/logo-its.jpeg";

const AutosservicoLayout = () => <div className="flex min-h-screen flex-col">
  <header className="border-b bg-card"><div className="container flex h-16 items-center"><div className="flex items-center gap-2"><img src={logoIts} alt="Logo ITS" className="h-10 w-10 rounded-lg object-contain" /><div className="flex flex-col"><span className="font-serif text-lg font-bold leading-tight text-primary">ITS</span><span className="text-[10px] leading-tight text-muted-foreground">Área de autosserviço</span></div></div></div></header>
  <main className="flex-1"><Outlet /></main>
  <footer className="border-t bg-card"><div className="container py-6 text-center text-xs text-muted-foreground">Dúvidas: (11) 97229-4009 · institutoteologicoits@gmail.com</div></footer>
</div>;

export default AutosservicoLayout;
