/**
 * Cliente Supabase
 * Este arquivo é gerado automaticamente. Não o edite diretamente.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/** URL da instância Supabase */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/** Chave pública do Supabase para autenticação do lado do cliente */
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Instância do cliente Supabase
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Usa localStorage para persistência da sessão
    storage: localStorage,
    // Mantém a sessão entre recargas
    persistSession: true,
    // Atualiza o token automaticamente quando próximo do vencimento
    autoRefreshToken: true,
  }
});