import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Componente de login para administradores
 * 
 * Página responsável pela autenticação de usuários com acesso administrativo.
 * Verifica as credenciais de login e valida se o usuário possui permissões de admin
 * antes de permitir acesso ao painel administrativo.
 */
const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados do formulário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Manipula o envio do formulário de login
   * 
   * Realiza as seguintes etapas:
   * 1. Autentica o usuário com email e senha
   * 2. Recupera os dados do usuário autenticado
   * 3. Verifica se o usuário possui role de administrador
   * 4. Redireciona para o painel administrativo ou exibe erro
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Autentica o usuário com Supabase
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Recupera os dados do usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado");

      // Verifica a role do usuário na tabela user_roles
      const { data: roles } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user.id)
        .single();

      // Valida se o usuário possui permissão de admin
      if (!roles || (roles as any).role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Acesso não autorizado. Apenas administradores podem acessar.");
      }

      // Redireciona para o painel administrativo
      navigate("/admin");
    } catch (err: any) {
      // Exibe mensagem de erro
      toast({ title: "Erro no login", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="flex min-h-[70vh] items-center justify-center py-16">
        <div className="container">
          <div className="mx-auto max-w-sm">
            {/* Card principal do formulário de login */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Painel Administrativo</CardTitle>
                <CardDescription>Faça login para acessar o painel</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Campo de email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  
                  {/* Campo de senha */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  
                  {/* Botão de envio do formulário */}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</> : "Entrar"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AdminLogin;
