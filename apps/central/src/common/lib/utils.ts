import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina nomes de classes CSS utilizando clsx e tailwind-merge.
 * 
 * Esta função une múltiplas classes CSS, filtrando valores inválidos
 * e resolvendo conflitos de classes do Tailwind CSS.
 * 
 * - Uma ou mais classes CSS ou arrays de classes
 * String contendo as classes CSS combinadas
 */
export function cn(...inputs: ClassValue[]) {
  // Combina as classes com clsx e depois mescla as classes do Tailwind
  return twMerge(clsx(inputs));
}
