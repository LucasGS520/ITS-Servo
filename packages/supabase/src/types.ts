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
          comprovante_url: string | null /** Path do comprovante no bucket privado (linhas antigas: URL pública) */
          consulta_token_hash: string | null /** SHA-256 do token de autosserviço (nunca exposto ao client) */
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
          comprovante_url?: string | null /** Path do comprovante no bucket privado (opcional) */
          consulta_token_hash?: string | null /** SHA-256 do token de autosserviço */
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
          comprovante_url?: string | null /** Path do comprovante no bucket privado (opcional) */
          consulta_token_hash?: string | null /** SHA-256 do token de autosserviço */
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
      /**
       * Alunos do financeiro — vinculados a uma inscrição confirmada ou
       * cadastrados manualmente (legados da planilha)
       */
      alunos: {
        Row: {
          id: string /** Identificador único do aluno */
          nome: string /** Nome do aluno */
          unidade: string /** Slug do núcleo ou 'correspondencia' */
          inscricao_id: string | null /** Inscrição de origem (null p/ legados) */
          ativo: boolean /** Aluno ativo para lançamentos */
          observacoes: string | null /** Observações livres */
          created_at: string /** Data de criação do registro */
          updated_at: string /** Data da última atualização */
        }
        Insert: {
          id?: string
          nome: string
          unidade: string
          inscricao_id?: string | null
          ativo?: boolean
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          unidade?: string
          inscricao_id?: string | null
          ativo?: boolean
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alunos_inscricao_id_fkey"
            columns: ["inscricao_id"]
            isOneToOne: true
            referencedRelation: "inscricoes"
            referencedColumns: ["id"]
          },
        ]
      }
      /** Categorias de entrada/saída do financeiro (gerenciáveis no painel) */
      categorias_financeiras: {
        Row: {
          id: string /** Identificador único da categoria */
          nome: string /** Nome da categoria */
          tipo: string /** 'entrada' | 'saida' */
          ativo: boolean /** Categoria disponível para novos lançamentos */
          created_at: string /** Data de criação do registro */
          updated_at: string /** Data da última atualização */
        }
        Insert: {
          id?: string
          nome: string
          tipo: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          tipo?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      /**
       * Lançamentos financeiros (livro-caixa).
       * data = dia real; competencia = mês de referência (sempre dia 1);
       * unidade null = movimento geral/institucional
       */
      lancamentos_financeiros: {
        Row: {
          id: string /** Identificador único do lançamento */
          tipo: string /** 'entrada' | 'saida' */
          valor: number /** Valor sempre positivo; sentido vem de tipo */
          data: string /** Dia real do movimento (DATE) */
          competencia: string /** Mês de referência, dia 1 (DATE) */
          unidade: string | null /** Slug da unidade ou null (geral) */
          categoria_id: string /** Categoria do lançamento */
          aluno_id: string | null /** Aluno (mensalidade/matrícula) ou null */
          descricao: string | null /** Descrição livre */
          created_by: string | null /** Usuário que lançou */
          created_at: string /** Data de criação do registro */
          updated_at: string /** Data da última atualização */
        }
        Insert: {
          id?: string
          tipo: string
          valor: number
          data?: string
          competencia: string
          unidade?: string | null
          categoria_id: string
          aluno_id?: string | null
          descricao?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tipo?: string
          valor?: number
          data?: string
          competencia?: string
          unidade?: string | null
          categoria_id?: string
          aluno_id?: string | null
          descricao?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_financeiros_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_financeiras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
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
      /** Autosserviço: lê a própria inscrição mediante token de posse (SECURITY DEFINER) */
      buscar_inscricao: {
        Args: { p_numero: string; p_token: string }
        Returns: {
          numero_inscricao: string
          nome_completo: string
          email: string
          telefone: string
          cpf: string
          data_nascimento: string
          escolaridade: string
          modalidade: string
          nucleo: string | null
          status: string
          comprovante_url: string | null
          created_at: string
        }[]
      }
      /** Autosserviço: cancela a própria inscrição pendente mediante token (SECURITY DEFINER) */
      cancelar_inscricao: {
        Args: { p_numero: string; p_token: string }
        Returns: boolean
      }
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
