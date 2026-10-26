export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {

  "public": {
          Tables: {
            "alunos": {
                  Row: {
                    "ativo": boolean,"created_at": string,"curso_id": string | null,"id": string,"inscricao_id": string | null,"nome": string,"nucleo_id": string | null,"observacoes": string | null,"origem_referencia": string | null,"pessoa_id": string | null,"primeira_competencia": string | null,"situacao": string,"unidade": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"created_at"?: string,"curso_id"?: string | null,"id"?: string,"inscricao_id"?: string | null,"nome": string,"nucleo_id"?: string | null,"observacoes"?: string | null,"origem_referencia"?: string | null,"pessoa_id"?: string | null,"primeira_competencia"?: string | null,"situacao"?: string,"unidade": string,"updated_at"?: string
                  }
                  Update: {
                    "ativo"?: boolean,"created_at"?: string,"curso_id"?: string | null,"id"?: string,"inscricao_id"?: string | null,"nome"?: string,"nucleo_id"?: string | null,"observacoes"?: string | null,"origem_referencia"?: string | null,"pessoa_id"?: string | null,"primeira_competencia"?: string | null,"situacao"?: string,"unidade"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "alunos_curso_id_fkey"
      columns: ["curso_id"]
isOneToOne: false
      referencedRelation: "cursos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "alunos_inscricao_id_fkey"
      columns: ["inscricao_id"]
isOneToOne: true
      referencedRelation: "inscricoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "alunos_nucleo_id_fkey"
      columns: ["nucleo_id"]
isOneToOne: false
      referencedRelation: "nucleos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "alunos_pessoa_id_fkey"
      columns: ["pessoa_id"]
isOneToOne: false
      referencedRelation: "pessoas"
      referencedColumns: ["id"]
    }
                  ]
                },"atribuicoes_mensalidade": {
                  Row: {
                    "aluno_id": string,"competencia": string,"created_at": string,"id": string,"recebimento_id": string,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "aluno_id": string,"competencia": string,"created_at"?: string,"id"?: string,"recebimento_id": string,"valor": number
                  }
                  Update: {
                    "aluno_id"?: string,"competencia"?: string,"created_at"?: string,"id"?: string,"recebimento_id"?: string,"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "atribuicoes_mensalidade_aluno_id_fkey"
      columns: ["aluno_id"]
isOneToOne: false
      referencedRelation: "alunos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "atribuicoes_mensalidade_recebimento_id_fkey"
      columns: ["recebimento_id"]
isOneToOne: false
      referencedRelation: "recebimentos_its"
      referencedColumns: ["id"]
    }
                  ]
                },"auditoria_operacional": {
                  Row: {
                    "acao": string,"created_at": string,"dados": NonNullable<Json>,"entidade": string,"entidade_id": string,"executado_por": string | null,"id": string,"motivo": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "acao": string,"created_at"?: string,"dados"?: NonNullable<Json>,"entidade": string,"entidade_id": string,"executado_por"?: string | null,"id"?: string,"motivo"?: string | null
                  }
                  Update: {
                    "acao"?: string,"created_at"?: string,"dados"?: NonNullable<Json>,"entidade"?: string,"entidade_id"?: string,"executado_por"?: string | null,"id"?: string,"motivo"?: string | null
                  }
                  Relationships: [

                  ]
                },"categorias_financeiras": {
                  Row: {
                    "ativo": boolean,"created_at": string,"id": string,"nome": string,"tipo": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"created_at"?: string,"id"?: string,"nome": string,"tipo": string,"updated_at"?: string
                  }
                  Update: {
                    "ativo"?: boolean,"created_at"?: string,"id"?: string,"nome"?: string,"tipo"?: string,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"cobrancas": {
                  Row: {
                    "categoria_id": string | null,"created_at": string,"created_by": string | null,"curso_id": string | null,"edicao_simposio_id": string | null,"id": string,"inscricao_id": string | null,"pessoa_id": string,"referente": string,"status": string,"updated_at": string,"valor_devido": number,"vencimento": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "categoria_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"curso_id"?: string | null,"edicao_simposio_id"?: string | null,"id"?: string,"inscricao_id"?: string | null,"pessoa_id": string,"referente": string,"status"?: string,"updated_at"?: string,"valor_devido": number,"vencimento"?: string | null
                  }
                  Update: {
                    "categoria_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"curso_id"?: string | null,"edicao_simposio_id"?: string | null,"id"?: string,"inscricao_id"?: string | null,"pessoa_id"?: string,"referente"?: string,"status"?: string,"updated_at"?: string,"valor_devido"?: number,"vencimento"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "cobrancas_categoria_id_fkey"
      columns: ["categoria_id"]
isOneToOne: false
      referencedRelation: "categorias_financeiras"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cobrancas_curso_id_fkey"
      columns: ["curso_id"]
isOneToOne: false
      referencedRelation: "cursos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cobrancas_edicao_simposio_id_fkey"
      columns: ["edicao_simposio_id"]
isOneToOne: false
      referencedRelation: "edicoes_simposio"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cobrancas_inscricao_id_fkey"
      columns: ["inscricao_id"]
isOneToOne: false
      referencedRelation: "inscricoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cobrancas_pessoa_id_fkey"
      columns: ["pessoa_id"]
isOneToOne: false
      referencedRelation: "pessoas"
      referencedColumns: ["id"]
    }
                  ]
                },"comprovantes_inscricao": {
                  Row: {
                    "caminho": string,"created_at": string,"id": string,"inscricao_id": string,"origem": string
                  }
                  ComputedFields: never
                  Insert: {
                    "caminho": string,"created_at"?: string,"id"?: string,"inscricao_id": string,"origem": string
                  }
                  Update: {
                    "caminho"?: string,"created_at"?: string,"id"?: string,"inscricao_id"?: string,"origem"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comprovantes_inscricao_inscricao_id_fkey"
      columns: ["inscricao_id"]
isOneToOne: false
      referencedRelation: "inscricoes"
      referencedColumns: ["id"]
    }
                  ]
                },"configuracao_relatorios": {
                  Row: {
                    "atualizado_em": string,"atualizado_por": string | null,"endereco": string,"id": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "atualizado_em"?: string,"atualizado_por"?: string | null,"endereco": string,"id"?: boolean
                  }
                  Update: {
                    "atualizado_em"?: string,"atualizado_por"?: string | null,"endereco"?: string,"id"?: boolean
                  }
                  Relationships: [

                  ]
                },"criar_inscricao_hits": {
                  Row: {
                    "created_at": string,"id": number,"ip": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: never,"ip": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"ip"?: string
                  }
                  Relationships: [

                  ]
                },"cursos": {
                  Row: {
                    "ativo": boolean,"codigo": string,"created_at": string,"id": string,"mensalidade_referencia": number | null,"nome": string,"publico": boolean,"taxa_matricula": number | null,"updated_at": string,"valor": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"codigo": string,"created_at"?: string,"id"?: string,"mensalidade_referencia"?: number | null,"nome": string,"publico"?: boolean,"taxa_matricula"?: number | null,"updated_at"?: string,"valor"?: number | null
                  }
                  Update: {
                    "ativo"?: boolean,"codigo"?: string,"created_at"?: string,"id"?: string,"mensalidade_referencia"?: number | null,"nome"?: string,"publico"?: boolean,"taxa_matricula"?: number | null,"updated_at"?: string,"valor"?: number | null
                  }
                  Relationships: [

                  ]
                },"edicoes_simposio": {
                  Row: {
                    "ativo": boolean,"created_at": string,"fim": string | null,"id": string,"inicio": string | null,"inscritos_historicos": number | null,"isentos_historicos": number | null,"nome": string,"origem_referencia": string | null,"pagantes_historicos": number | null,"publico": boolean,"updated_at": string,"valor": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"created_at"?: string,"fim"?: string | null,"id"?: string,"inicio"?: string | null,"inscritos_historicos"?: number | null,"isentos_historicos"?: number | null,"nome": string,"origem_referencia"?: string | null,"pagantes_historicos"?: number | null,"publico"?: boolean,"updated_at"?: string,"valor"?: number | null
                  }
                  Update: {
                    "ativo"?: boolean,"created_at"?: string,"fim"?: string | null,"id"?: string,"inicio"?: string | null,"inscritos_historicos"?: number | null,"isentos_historicos"?: number | null,"nome"?: string,"origem_referencia"?: string | null,"pagantes_historicos"?: number | null,"publico"?: boolean,"updated_at"?: string,"valor"?: number | null
                  }
                  Relationships: [

                  ]
                },"importacoes_its": {
                  Row: {
                    "carregada_em": string,"fonte": string,"sha256": string
                  }
                  ComputedFields: never
                  Insert: {
                    "carregada_em"?: string,"fonte": string,"sha256": string
                  }
                  Update: {
                    "carregada_em"?: string,"fonte"?: string,"sha256"?: string
                  }
                  Relationships: [

                  ]
                },"inscricoes": {
                  Row: {
                    "comprovante_url": string | null,"consulta_token_hash": string | null,"cpf": string,"created_at": string,"curso_id": string | null,"data_nascimento": string,"destino": string,"edicao_simposio_id": string | null,"email": string,"escolaridade": string,"id": string,"isento": boolean,"modalidade": string,"motivo_isencao": string | null,"nome_completo": string,"nucleo": string | null,"nucleo_id": string | null,"numero_inscricao": string,"origem_cadastro": string,"pessoa_id": string | null,"primeira_competencia": string | null,"status": string,"telefone": string,"updated_at": string,"valor_referencia": number | null,"valor_referencia_em": string | null,"valor_referencia_origem": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "comprovante_url"?: string | null,"consulta_token_hash"?: string | null,"cpf": string,"created_at"?: string,"curso_id"?: string | null,"data_nascimento": string,"destino"?: string,"edicao_simposio_id"?: string | null,"email": string,"escolaridade": string,"id"?: string,"isento"?: boolean,"modalidade": string,"motivo_isencao"?: string | null,"nome_completo": string,"nucleo"?: string | null,"nucleo_id"?: string | null,"numero_inscricao"?: string,"origem_cadastro"?: string,"pessoa_id"?: string | null,"primeira_competencia"?: string | null,"status"?: string,"telefone": string,"updated_at"?: string,"valor_referencia"?: number | null,"valor_referencia_em"?: string | null,"valor_referencia_origem"?: string | null
                  }
                  Update: {
                    "comprovante_url"?: string | null,"consulta_token_hash"?: string | null,"cpf"?: string,"created_at"?: string,"curso_id"?: string | null,"data_nascimento"?: string,"destino"?: string,"edicao_simposio_id"?: string | null,"email"?: string,"escolaridade"?: string,"id"?: string,"isento"?: boolean,"modalidade"?: string,"motivo_isencao"?: string | null,"nome_completo"?: string,"nucleo"?: string | null,"nucleo_id"?: string | null,"numero_inscricao"?: string,"origem_cadastro"?: string,"pessoa_id"?: string | null,"primeira_competencia"?: string | null,"status"?: string,"telefone"?: string,"updated_at"?: string,"valor_referencia"?: number | null,"valor_referencia_em"?: string | null,"valor_referencia_origem"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "inscricoes_curso_id_fkey"
      columns: ["curso_id"]
isOneToOne: false
      referencedRelation: "cursos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inscricoes_edicao_simposio_id_fkey"
      columns: ["edicao_simposio_id"]
isOneToOne: false
      referencedRelation: "edicoes_simposio"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inscricoes_nucleo_id_fkey"
      columns: ["nucleo_id"]
isOneToOne: false
      referencedRelation: "nucleos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inscricoes_pessoa_id_fkey"
      columns: ["pessoa_id"]
isOneToOne: false
      referencedRelation: "pessoas"
      referencedColumns: ["id"]
    }
                  ]
                },"interacoes_inscricao_hits": {
                  Row: {
                    "acao": string,"created_at": string,"id": number,"ip": string
                  }
                  ComputedFields: never
                  Insert: {
                    "acao": string,"created_at"?: string,"id"?: never,"ip": string
                  }
                  Update: {
                    "acao"?: string,"created_at"?: string,"id"?: never,"ip"?: string
                  }
                  Relationships: [

                  ]
                },"isencoes_inscricao": {
                  Row: {
                    "ativo": boolean,"created_at": string,"criado_por": string | null,"finalidade": string,"id": string,"inscricao_id": string,"mes_referencia": string | null,"motivo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"created_at"?: string,"criado_por"?: string | null,"finalidade": string,"id"?: string,"inscricao_id": string,"mes_referencia"?: string | null,"motivo": string
                  }
                  Update: {
                    "ativo"?: boolean,"created_at"?: string,"criado_por"?: string | null,"finalidade"?: string,"id"?: string,"inscricao_id"?: string,"mes_referencia"?: string | null,"motivo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "isencoes_inscricao_inscricao_id_fkey"
      columns: ["inscricao_id"]
isOneToOne: false
      referencedRelation: "inscricoes"
      referencedColumns: ["id"]
    }
                  ]
                },"itens_simposio": {
                  Row: {
                    "contabilizado": boolean,"created_at": string,"data_recebimento": string | null,"descricao": string,"doador": string | null,"edicao_id": string,"id": string,"origem_referencia": string | null,"quantidade": number | null,"situacao_doacao": string | null,"tipo": string,"unidade_medida": string | null,"valor": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "contabilizado"?: boolean,"created_at"?: string,"data_recebimento"?: string | null,"descricao": string,"doador"?: string | null,"edicao_id": string,"id"?: string,"origem_referencia"?: string | null,"quantidade"?: number | null,"situacao_doacao"?: string | null,"tipo": string,"unidade_medida"?: string | null,"valor"?: number | null
                  }
                  Update: {
                    "contabilizado"?: boolean,"created_at"?: string,"data_recebimento"?: string | null,"descricao"?: string,"doador"?: string | null,"edicao_id"?: string,"id"?: string,"origem_referencia"?: string | null,"quantidade"?: number | null,"situacao_doacao"?: string | null,"tipo"?: string,"unidade_medida"?: string | null,"valor"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "itens_simposio_edicao_id_fkey"
      columns: ["edicao_id"]
isOneToOne: false
      referencedRelation: "edicoes_simposio"
      referencedColumns: ["id"]
    }
                  ]
                },"lancamentos_financeiros": {
                  Row: {
                    "aluno_id": string | null,"categoria_id": string,"cobranca_id": string | null,"competencia": string,"comprovante_url": string | null,"conciliacao_status": string,"created_at": string,"created_by": string | null,"curso_id": string | null,"data": string | null,"descricao": string | null,"edicao_simposio_id": string | null,"estorno_de_id": string | null,"finalidade": string | null,"id": string,"inscricao_id": string | null,"mes_caixa": string,"mes_referencia": string | null,"motivo": string | null,"nucleo_id": string | null,"origem": string,"origem_referencia": string | null,"pagamento_id": string | null,"precisao_data": string,"tipo": string,"unidade": string | null,"updated_at": string,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "aluno_id"?: string | null,"categoria_id": string,"cobranca_id"?: string | null,"competencia": string,"comprovante_url"?: string | null,"conciliacao_status"?: string,"created_at"?: string,"created_by"?: string | null,"curso_id"?: string | null,"data"?: string | null,"descricao"?: string | null,"edicao_simposio_id"?: string | null,"estorno_de_id"?: string | null,"finalidade"?: string | null,"id"?: string,"inscricao_id"?: string | null,"mes_caixa": string,"mes_referencia"?: string | null,"motivo"?: string | null,"nucleo_id"?: string | null,"origem"?: string,"origem_referencia"?: string | null,"pagamento_id"?: string | null,"precisao_data"?: string,"tipo": string,"unidade"?: string | null,"updated_at"?: string,"valor": number
                  }
                  Update: {
                    "aluno_id"?: string | null,"categoria_id"?: string,"cobranca_id"?: string | null,"competencia"?: string,"comprovante_url"?: string | null,"conciliacao_status"?: string,"created_at"?: string,"created_by"?: string | null,"curso_id"?: string | null,"data"?: string | null,"descricao"?: string | null,"edicao_simposio_id"?: string | null,"estorno_de_id"?: string | null,"finalidade"?: string | null,"id"?: string,"inscricao_id"?: string | null,"mes_caixa"?: string,"mes_referencia"?: string | null,"motivo"?: string | null,"nucleo_id"?: string | null,"origem"?: string,"origem_referencia"?: string | null,"pagamento_id"?: string | null,"precisao_data"?: string,"tipo"?: string,"unidade"?: string | null,"updated_at"?: string,"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "lancamentos_financeiros_aluno_id_fkey"
      columns: ["aluno_id"]
isOneToOne: false
      referencedRelation: "alunos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lancamentos_financeiros_categoria_id_fkey"
      columns: ["categoria_id"]
isOneToOne: false
      referencedRelation: "categorias_financeiras"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lancamentos_financeiros_cobranca_id_fkey"
      columns: ["cobranca_id"]
isOneToOne: false
      referencedRelation: "cobrancas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lancamentos_financeiros_curso_id_fkey"
      columns: ["curso_id"]
isOneToOne: false
      referencedRelation: "cursos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lancamentos_financeiros_edicao_simposio_id_fkey"
      columns: ["edicao_simposio_id"]
isOneToOne: false
      referencedRelation: "edicoes_simposio"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lancamentos_financeiros_estorno_de_id_fkey"
      columns: ["estorno_de_id"]
isOneToOne: false
      referencedRelation: "lancamentos_financeiros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lancamentos_financeiros_inscricao_id_fkey"
      columns: ["inscricao_id"]
isOneToOne: false
      referencedRelation: "inscricoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lancamentos_financeiros_nucleo_id_fkey"
      columns: ["nucleo_id"]
isOneToOne: false
      referencedRelation: "nucleos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lancamentos_financeiros_pagamento_id_fkey"
      columns: ["pagamento_id"]
isOneToOne: true
      referencedRelation: "pagamentos"
      referencedColumns: ["id"]
    }
                  ]
                },"nucleos": {
                  Row: {
                    "ativo": boolean,"cidade": string,"created_at": string,"endereco": string | null,"id": string,"nome": string,"slug": string,"uf": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"cidade": string,"created_at"?: string,"endereco"?: string | null,"id"?: string,"nome": string,"slug": string,"uf": string,"updated_at"?: string
                  }
                  Update: {
                    "ativo"?: boolean,"cidade"?: string,"created_at"?: string,"endereco"?: string | null,"id"?: string,"nome"?: string,"slug"?: string,"uf"?: string,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"operacoes_financeiras_its": {
                  Row: {
                    "criada_em": string,"dados": NonNullable<Json>,"id": string,"movimento_id": string,"tipo": string,"usuario_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "criada_em"?: string,"dados": NonNullable<Json>,"id": string,"movimento_id": string,"tipo": string,"usuario_id": string
                  }
                  Update: {
                    "criada_em"?: string,"dados"?: NonNullable<Json>,"id"?: string,"movimento_id"?: string,"tipo"?: string,"usuario_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "operacoes_financeiras_its_movimento_id_fkey"
      columns: ["movimento_id"]
isOneToOne: false
      referencedRelation: "lancamentos_financeiros"
      referencedColumns: ["id"]
    }
                  ]
                },"pagamentos": {
                  Row: {
                    "cobranca_id": string | null,"comprovante_url": string | null,"conciliado_em": string | null,"conciliado_por": string | null,"created_at": string,"data_recebimento": string | null,"id": string,"inscricao_id": string | null,"status": string,"updated_at": string,"valor": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cobranca_id"?: string | null,"comprovante_url"?: string | null,"conciliado_em"?: string | null,"conciliado_por"?: string | null,"created_at"?: string,"data_recebimento"?: string | null,"id"?: string,"inscricao_id"?: string | null,"status"?: string,"updated_at"?: string,"valor"?: number | null
                  }
                  Update: {
                    "cobranca_id"?: string | null,"comprovante_url"?: string | null,"conciliado_em"?: string | null,"conciliado_por"?: string | null,"created_at"?: string,"data_recebimento"?: string | null,"id"?: string,"inscricao_id"?: string | null,"status"?: string,"updated_at"?: string,"valor"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "pagamentos_cobranca_id_fkey"
      columns: ["cobranca_id"]
isOneToOne: false
      referencedRelation: "cobrancas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pagamentos_inscricao_id_fkey"
      columns: ["inscricao_id"]
isOneToOne: false
      referencedRelation: "inscricoes"
      referencedColumns: ["id"]
    }
                  ]
                },"pendencias_conciliacao": {
                  Row: {
                    "chave": string,"created_at": string,"descricao": string,"id": string,"resolucao": string | null,"resolvida_em": string | null,"resolvida_por": string | null,"status": string,"valor_anual": number | null,"valor_detalhe": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "chave": string,"created_at"?: string,"descricao": string,"id"?: string,"resolucao"?: string | null,"resolvida_em"?: string | null,"resolvida_por"?: string | null,"status"?: string,"valor_anual"?: number | null,"valor_detalhe"?: number | null
                  }
                  Update: {
                    "chave"?: string,"created_at"?: string,"descricao"?: string,"id"?: string,"resolucao"?: string | null,"resolvida_em"?: string | null,"resolvida_por"?: string | null,"status"?: string,"valor_anual"?: number | null,"valor_detalhe"?: number | null
                  }
                  Relationships: [

                  ]
                },"pessoas": {
                  Row: {
                    "cpf": string | null,"created_at": string,"data_nascimento": string | null,"email": string | null,"escolaridade": string | null,"id": string,"identidade_pendente": boolean,"nome_completo": string,"origem_referencia": string | null,"telefone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cpf"?: string | null,"created_at"?: string,"data_nascimento"?: string | null,"email"?: string | null,"escolaridade"?: string | null,"id"?: string,"identidade_pendente"?: boolean,"nome_completo": string,"origem_referencia"?: string | null,"telefone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "cpf"?: string | null,"created_at"?: string,"data_nascimento"?: string | null,"email"?: string | null,"escolaridade"?: string | null,"id"?: string,"identidade_pendente"?: boolean,"nome_completo"?: string,"origem_referencia"?: string | null,"telefone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [

                  ]
                },"recebimentos_its": {
                  Row: {
                    "aluno_id": string | null,"comprovante_url": string | null,"created_at": string,"curso_id": string | null,"data_recebimento": string | null,"edicao_simposio_id": string | null,"id": string,"inscricao_id": string | null,"lancamento_id": string | null,"mes_caixa": string,"origem": string,"origem_referencia": string | null,"pessoa_id": string | null,"precisao_data": string,"registrado_por": string | null,"status": string,"tipo": string,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "aluno_id"?: string | null,"comprovante_url"?: string | null,"created_at"?: string,"curso_id"?: string | null,"data_recebimento"?: string | null,"edicao_simposio_id"?: string | null,"id"?: string,"inscricao_id"?: string | null,"lancamento_id"?: string | null,"mes_caixa": string,"origem"?: string,"origem_referencia"?: string | null,"pessoa_id"?: string | null,"precisao_data": string,"registrado_por"?: string | null,"status"?: string,"tipo"?: string,"valor": number
                  }
                  Update: {
                    "aluno_id"?: string | null,"comprovante_url"?: string | null,"created_at"?: string,"curso_id"?: string | null,"data_recebimento"?: string | null,"edicao_simposio_id"?: string | null,"id"?: string,"inscricao_id"?: string | null,"lancamento_id"?: string | null,"mes_caixa"?: string,"origem"?: string,"origem_referencia"?: string | null,"pessoa_id"?: string | null,"precisao_data"?: string,"registrado_por"?: string | null,"status"?: string,"tipo"?: string,"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "recebimentos_its_aluno_id_fkey"
      columns: ["aluno_id"]
isOneToOne: false
      referencedRelation: "alunos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recebimentos_its_curso_id_fkey"
      columns: ["curso_id"]
isOneToOne: false
      referencedRelation: "cursos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recebimentos_its_edicao_simposio_id_fkey"
      columns: ["edicao_simposio_id"]
isOneToOne: false
      referencedRelation: "edicoes_simposio"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recebimentos_its_inscricao_id_fkey"
      columns: ["inscricao_id"]
isOneToOne: false
      referencedRelation: "inscricoes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recebimentos_its_lancamento_id_fkey"
      columns: ["lancamento_id"]
isOneToOne: true
      referencedRelation: "lancamentos_financeiros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recebimentos_its_pessoa_id_fkey"
      columns: ["pessoa_id"]
isOneToOne: false
      referencedRelation: "pessoas"
      referencedColumns: ["id"]
    }
                  ]
                },"relatorios_mensais_versoes": {
                  Row: {
                    "created_at": string,"dados": NonNullable<Json>,"emitido_por": string | null,"id": string,"periodo": string,"status": string,"versao": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"dados"?: NonNullable<Json>,"emitido_por"?: string | null,"id"?: string,"periodo": string,"status"?: string,"versao": number
                  }
                  Update: {
                    "created_at"?: string,"dados"?: NonNullable<Json>,"emitido_por"?: string | null,"id"?: string,"periodo"?: string,"status"?: string,"versao"?: number
                  }
                  Relationships: [

                  ]
                },"saldos_iniciais_its": {
                  Row: {
                    "ano": number,"created_at": string,"fonte": string,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "ano": number,"created_at"?: string,"fonte": string,"valor": number
                  }
                  Update: {
                    "ano"?: number,"created_at"?: string,"fonte"?: string,"valor"?: number
                  }
                  Relationships: [

                  ]
                },"solicitacoes_cancelamento_inscricao": {
                  Row: {
                    "id": string,"inscricao_id": string,"motivo": string | null,"resolvida_em": string | null,"resolvida_por": string | null,"solicitada_em": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"inscricao_id": string,"motivo"?: string | null,"resolvida_em"?: string | null,"resolvida_por"?: string | null,"solicitada_em"?: string,"status"?: string
                  }
                  Update: {
                    "id"?: string,"inscricao_id"?: string,"motivo"?: string | null,"resolvida_em"?: string | null,"resolvida_por"?: string | null,"solicitada_em"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "solicitacoes_cancelamento_inscricao_inscricao_id_fkey"
      columns: ["inscricao_id"]
isOneToOne: false
      referencedRelation: "inscricoes"
      referencedColumns: ["id"]
    }
                  ]
                },"user_roles": {
                  Row: {
                    "created_at": string,"id": string,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"role"?: Database["public"]['Enums']["app_role"],"user_id"?: string
                  }
                  Relationships: [

                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "alterar_status_matricula":
{ Args: { "p_inscricao_id": string,"p_motivo"?: string,"p_status": string }; Returns: undefined
                           },
"atribuir_mensalidade_its":
{ Args: { "p_competencia": string,"p_recebimento_id": string,"p_valor": number }; Returns: string
                           },
"atualizar_aluno_its":
{ Args: { "p_aluno_id": string,"p_cpf": string,"p_email": string,"p_escolaridade": string,"p_nascimento": string,"p_nome": string,"p_observacoes": string,"p_situacao": string,"p_telefone": string,"p_unidade": string }; Returns: undefined
                           },
"atualizar_atendimento":
{ Args: { "p_data_nascimento": string,"p_email": string,"p_escolaridade": string,"p_inscricao_id": string,"p_motivo"?: string,"p_nome_completo": string,"p_telefone": string }; Returns: undefined
                           },
"atualizar_endereco_relatorios":
{ Args: { "p_endereco": string }; Returns: string
                           },
"buscar_inscricao":
{ Args: { "p_numero": string,"p_token": string }; Returns: {
              "comprovante_url": string,"cpf": string,"created_at": string,"data_nascimento": string,"destino": string,"destino_nome": string,"email": string,"escolaridade": string,"modalidade": string,"nome_completo": string,"nucleo": string,"numero_inscricao": string,"saldo_devedor": number,"status": string,"telefone": string,"valor_devido": number,"valor_pago": number
            }[]
                           },
"cancelar_inscricao":
{ Args: { "p_numero": string,"p_token": string }; Returns: boolean
                           },
"cancelar_inscricao_interna":
{ Args: { "p_inscricao_id": string,"p_motivo": string }; Returns: undefined
                           },
"conciliar_pagamento":
{ Args: { "p_data": string,"p_pagamento_id": string,"p_valor": number }; Returns: string
                           },
"confirmar_inscricao_its":
{ Args: { "p_inscricao_id": string,"p_isento"?: boolean,"p_motivo"?: string,"p_primeira_competencia"?: string }; Returns: undefined
                           },
"corrigir_preco_inscricao_its":
{ Args: { "p_id": string,"p_motivo": string,"p_valor": number }; Returns: undefined
                           },
"corrigir_registro_financeiro":
{ Args: { "p_motivo": string,"p_registro_id": string }; Returns: string
                           },
"criar_inscricao_interna":
{ Args: { "p_cpf": string,"p_curso_id": string,"p_edicao_id": string,"p_email": string,"p_escolaridade": string,"p_modalidade": string,"p_nascimento": string,"p_nome": string,"p_nucleo": string,"p_telefone": string }; Returns: string
                           },
"criar_matricula_operacional":
{ Args: { "p_consulta_token_hash": string,"p_cpf": string,"p_curso_codigo": string,"p_data_nascimento": string,"p_destino": string,"p_edicao_simposio_id": string,"p_email": string,"p_escolaridade": string,"p_modalidade": string,"p_nome_completo": string,"p_nucleo": string,"p_telefone": string }; Returns: {
              "inscricao_id": string,"numero_inscricao": string
            }[]
                           },
"criar_registro_financeiro":
{ Args: { "p_aluno_id"?: string,"p_categoria_id": string,"p_curso_id"?: string,"p_data": string,"p_descricao"?: string,"p_edicao_simposio_id"?: string,"p_motivo"?: string,"p_tipo": string,"p_unidade"?: string,"p_valor": number }; Returns: string
                           },
"devolver_movimentacao_its":
{ Args: { "p_categoria_id": string,"p_data": string,"p_descricao"?: string,"p_entrada_id": string,"p_valor": number }; Returns: string
                           },
"emitir_relatorio_mensal":
{ Args: { "p_dados"?: Json,"p_periodo": string }; Returns: string
                           },
"estornar_pagamento":
{ Args: { "p_motivo": string,"p_pagamento_id": string }; Returns: string
                           },
"estornar_recebimento_its":
{ Args: { "p_motivo": string,"p_recebimento_id": string }; Returns: undefined
                           },
"executar_movimento_its":
{ Args: { "p_dados": Json,"p_operacao_id": string,"p_tipo": string }; Returns: string
                           },
"generate_numero_inscricao":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"has_role":
{ Args: { "_role": Database["public"]['Enums']["app_role"],"_user_id": string }; Returns: boolean
                           },
"inscricao_token_valido":
{ Args: { "p_numero": string,"p_token": string }; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"marcar_pagamento_nao_identificado_its":
{ Args: { "p_inscricao_id": string,"p_motivo": string }; Returns: undefined
                           },
"marcar_relatorio_para_revisao":
{ Args: { "p_data": string }; Returns: undefined
                           },
"obter_endereco_relatorios":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"recusar_pagamento":
{ Args: { "p_motivo": string,"p_pagamento_id": string }; Returns: undefined
                           },
"registrar_auditoria":
{ Args: { "p_acao": string,"p_dados"?: Json,"p_entidade": string,"p_entidade_id": string,"p_motivo"?: string }; Returns: undefined
                           },
"registrar_comprovante_operacional":
{ Args: { "p_comprovante_path": string,"p_numero": string,"p_token_hash": string }; Returns: string
                           },
"registrar_comprovante_publico_its":
{ Args: { "p_comprovante_path": string,"p_numero": string }; Returns: string
                           },
"registrar_recebimento_its":
{ Args: { "p_atribuicoes"?: Json,"p_comprovante"?: string,"p_data": string,"p_inscricao_id": string,"p_tipo": string,"p_valor": number }; Returns: string
                           },
"resolver_cancelamento_inscricao":
{ Args: { "p_aprovar": boolean,"p_motivo": string,"p_solicitacao_id": string }; Returns: undefined
                           },
"retirar_atribuicao_its":
{ Args: { "p_atribuicao_id": string,"p_motivo": string }; Returns: undefined
                           },
"salvar_cobranca":
{ Args: { "p_categoria_id": string,"p_cobranca_id": string,"p_curso_id": string,"p_edicao_simposio_id": string,"p_inscricao_id": string,"p_pessoa_id": string,"p_referente": string,"p_status"?: string,"p_valor_devido": number,"p_vencimento": string }; Returns: string
                           },
"salvar_isencao_inscricao":
{ Args: { "p_ativo"?: boolean,"p_finalidade": string,"p_inscricao_id": string,"p_mes_referencia": string,"p_motivo": string }; Returns: undefined
                           },
"salvar_movimentacao_its":
{ Args: { "p_aluno_historico_id": string,"p_categoria_id": string,"p_comprovante_url": string,"p_curso_id": string,"p_data": string,"p_descricao": string,"p_edicao_simposio_id": string,"p_finalidade": string,"p_id": string,"p_inscricao_id": string,"p_mes_caixa": string,"p_mes_referencia": string,"p_tipo": string,"p_unidade": string,"p_valor": number }; Returns: string
                           },
"validar_aluno_historico":
{ Args: { "p_aluno_id": string,"p_cpf": string,"p_nome": string,"p_primeira_competencia"?: string,"p_situacao": string }; Returns: undefined
                           }
          }
          Enums: {
            "app_role": "admin"|"user"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "app_role": ["admin", "user"]
          }
        }
} as const
