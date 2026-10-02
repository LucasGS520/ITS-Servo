import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/common/ui/tooltip";
import { Toaster } from "@/common/ui/toaster";
import { Toaster as Sonner } from "@/common/ui/sonner";
import ErrorBoundary from "@/providers/ErrorBoundary";

const queryClient = new QueryClient();

const AppProviders = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>
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
