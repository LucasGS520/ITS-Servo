/**
 * Tipo para representar valores JSON genéricos
 * Compatível com tipos primitivos e objetos/arrays aninhados
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Tipo principal de banco de dados Supabase
 * Define a estrutura completa das tabelas, views, funções e enums
 */
export type Database = {
  // Permite instanciar automaticamente createClient com as opções corretas
  // em vez de createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      /**
       * Tabela de inscrições
       * Armazena informações dos candidatos inscritos
       */
      inscricoes: {
        Row: {
          comprovante_url: string | null /** URL do comprovante de inscrição (opcional) */
          cpf: string /** CPF do candidato */
          created_at: string /** Data de criação do registro */
          data_nascimento: string /** Data de nascimento do candidato */
          email: string /** Email do candidato */
          escolaridade: string /** Grau de escolaridade */
          id: string /** Identificador único da inscrição */
          modalidade: string /** Modalidade de inscrição */
          nome_completo: string /** Nome completo do candidato */
          nucleo: string | null /** Núcleo de atendimento (opcional) */
          numero_inscricao: string /** Número único da inscrição */
          status: string /** Status da inscrição */
          telefone: string /** Telefone do candidato */
          updated_at: string /** Data da última atualização */
        }
        Insert: {
          comprovante_url?: string | null /** URL do comprovante de inscrição (opcional) */
          cpf: string /** CPF do candidato */
          created_at?: string /** Data de criação do registro (preenchido automaticamente) */
          data_nascimento: string /** Data de nascimento do candidato */
          email: string /** Email do candidato */
          escolaridade: string /** Grau de escolaridade */
          id?: string /** Identificador único da inscrição (preenchido automaticamente) */
          modalidade: string /** Modalidade de inscrição */
          nome_completo: string /** Nome completo do candidato */
          nucleo?: string | null /** Núcleo de atendimento (opcional) */
          numero_inscricao?: string /** Número único da inscrição (preenchido automaticamente) */
          status?: string /** Status da inscrição (preenchido automaticamente) */
          telefone: string /** Telefone do candidato */
          updated_at?: string /** Data da última atualização (preenchido automaticamente) */
        }
        Update: {
          comprovante_url?: string | null /** URL do comprovante de inscrição (opcional) */
          cpf?: string /** CPF do candidato */
          created_at?: string /** Data de criação do registro (não deve ser atualizado) */
          data_nascimento?: string /** Data de nascimento do candidato */
          email?: string /** Email do candidato */
          escolaridade?: string /** Grau de escolaridade */
          id?: string /** Identificador único da inscrição (não deve ser atualizado) */
          modalidade?: string /** Modalidade de inscrição */
          nome_completo?: string /** Nome completo do candidato */
          nucleo?: string | null /** Núcleo de atendimento (opcional) */
          numero_inscricao?: string /** Número único da inscrição (não deve ser atualizado) */
          status?: string /** Status da inscrição */
          telefone?: string /** Telefone do candidato */
          updated_at?: string /** Data da última atualização (preenchido automaticamente) */
        }
        Relationships: []
      }
      /**
       * Tabela de papéis de usuário
       * Define os papéis/permissões para cada usuário
       */
      user_roles: {
        Row: {
          created_at: string /** Data de criação do registro */
          id: string /** Identificador único do papel */
          role: Database["public"]["Enums"]["app_role"] /** Tipo de papel (admin ou user) */
          user_id: string /** ID do usuário */
        }
        Insert: {
          created_at?: string /** Data de criação do registro (preenchido automaticamente) */
          id?: string /** Identificador único do papel (preenchido automaticamente) */
          role: Database["public"]["Enums"]["app_role"] /** Tipo de papel (admin ou user) */
          user_id: string /** ID do usuário */
        }
        Update: {
          created_at?: string /** Data de criação do registro (não deve ser atualizado) */
          id?: string /** Identificador único do papel (não deve ser atualizado) */
          role?: Database["public"]["Enums"]["app_role"] /** Tipo de papel (admin ou user) */
          user_id?: string /** ID do usuário (não deve ser atualizado) */
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      /** Gera um novo número de inscrição único */
      generate_numero_inscricao: { Args: never; Returns: string }
      /**
       * Verifica se o usuário possui um papel específico
       * - O papel a verificar
       * - ID do usuário
       */
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      /** Verifica se o usuário logado é administrador */
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      /** Papéis disponíveis no sistema */
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

/** Tipo de banco de dados sem as configurações internas do Supabase */
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

/** Schema padrão para acesso às tabelas públicas */
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

/**
 * Tipo genérico para acessar linhas de uma tabela ou view
 * Permite tipagem automática dos dados retornados
 */
export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
