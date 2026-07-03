import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Propriedades estendidas do componente NavLink
 * Estende as propriedades do NavLink do React Router, permitindo
 * uso de className com suporte a classes ativas e pendentes.
 */
interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  /** Classe CSS aplicada ao link em qualquer estado */
  className?: string;
  /** Classe CSS aplicada quando o link está ativo */
  activeClassName?: string;
  /** Classe CSS aplicada quando o link está pendente */
  pendingClassName?: string;
}

/**
 * Componente NavLink com suporte a classes condicionais
 * 
 * Encapsula o NavLink do React Router fornecendo uma API simplificada
 * para aplicar classes CSS diferentes com base no estado do link (ativo/pendente).
 * 
 * - Propriedades do componente
 * - Classe CSS base
 * - Classe CSS quando ativo
 * - Classe CSS quando pendente
 * - Referência para o elemento âncora
 * 
 * Elemento NavLink com suporte a classes condicionais
 */
const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        // Combina classes: base + ativa (se isActive) + pendente (se isPending)
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

// Define o nome do componente para melhor identificação em ferramentas de desenvolvimento
NavLink.displayName = "NavLink";

export { NavLink };
