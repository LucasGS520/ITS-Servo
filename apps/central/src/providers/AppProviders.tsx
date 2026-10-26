import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { observarSessao } from "@/modules/acesso/api/session";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/common/ui/tooltip";
import { Toaster } from "@/common/ui/toaster";
import { Toaster as Sonner } from "@/common/ui/sonner";
import ErrorBoundary from "@/providers/ErrorBoundary";

function SessionCache() {
  useEffect(() => {
    let usuario: string | null | undefined;
    const { data } = observarSessao((event, session) => {
      const atual = session?.user.id ?? null;
      if (event === "SIGNED_OUT" || (usuario !== undefined && usuario !== atual)) queryClient.clear();
      usuario = atual;
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return null;
}

const AppProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <SessionCache />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>{children}</ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default AppProviders;
