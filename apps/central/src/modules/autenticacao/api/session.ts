import { supabase } from "@/services/supabase/client";

const usuarioAtual = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
};

const usuarioEhAdmin = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw error;
  return data?.role === "admin";
};

export const entrarNaGestao = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const user = await usuarioAtual();
  if (!user || !(await usuarioEhAdmin(user.id))) {
    await supabase.auth.signOut();
    throw new Error("Acesso não autorizado. Apenas administradores podem acessar.");
  }
};

export const verificarAcessoGestao = async () => {
  const user = await usuarioAtual();
  if (!user) return false;

  const autorizado = await usuarioEhAdmin(user.id);
  if (!autorizado) await supabase.auth.signOut();
  return autorizado;
};

export const sairDaGestao = async () => {
  await supabase.auth.signOut();
};
