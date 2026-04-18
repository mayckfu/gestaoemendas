// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5'
  }
  public: {
    Tables: {
      acoes_emendas: {
        Row: {
          area: string
          complexidade: string | null
          created_at: string | null
          descricao_oficial: string | null
          emenda_id: string
          id: string
          nome_acao: string
          publico_alvo: string | null
          updated_at: string | null
        }
        Insert: {
          area: string
          complexidade?: string | null
          created_at?: string | null
          descricao_oficial?: string | null
          emenda_id: string
          id?: string
          nome_acao: string
          publico_alvo?: string | null
          updated_at?: string | null
        }
        Update: {
          area?: string
          complexidade?: string | null
          created_at?: string | null
          descricao_oficial?: string | null
          emenda_id?: string
          id?: string
          nome_acao?: string
          publico_alvo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'acoes_emendas_emenda_id_fkey'
            columns: ['emenda_id']
            isOneToOne: false
            referencedRelation: 'emendas'
            referencedColumns: ['id']
          },
        ]
      }
      anexos: {
        Row: {
          created_at: string | null
          data_documento: string | null
          emenda_id: string
          filename: string
          id: string
          metadata: Json | null
          size: number | null
          tipo: string
          uploader: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          data_documento?: string | null
          emenda_id: string
          filename: string
          id?: string
          metadata?: Json | null
          size?: number | null
          tipo: string
          uploader?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          data_documento?: string | null
          emenda_id?: string
          filename?: string
          id?: string
          metadata?: Json | null
          size?: number | null
          tipo?: string
          uploader?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'anexos_emenda_id_fkey'
            columns: ['emenda_id']
            isOneToOne: false
            referencedRelation: 'emendas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'anexos_uploader_fkey'
            columns: ['uploader']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_changed_by_fkey'
            columns: ['changed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      backup_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          initiated_by: string | null
          size: string | null
          status: string
          type: string
          url: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          initiated_by?: string | null
          size?: string | null
          status: string
          type: string
          url?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          initiated_by?: string | null
          size?: string | null
          status?: string
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'backup_logs_initiated_by_fkey'
            columns: ['initiated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      cargos: {
        Row: {
          active: boolean | null
          created_at: string | null
          default_role: Database['public']['Enums']['user_role'] | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          default_role?: Database['public']['Enums']['user_role'] | null
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          default_role?: Database['public']['Enums']['user_role'] | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      configuracoes_anos: {
        Row: {
          ano: number
          created_at: string | null
          liberado_geral: boolean
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          liberado_geral?: boolean
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          liberado_geral?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      despesas: {
        Row: {
          autorizada_por: string | null
          categoria: string | null
          created_at: string | null
          data: string
          demanda: string | null
          descricao: string
          destinacao_id: string | null
          emenda_id: string
          fornecedor_nome: string | null
          id: string
          nota_fiscal_url: string | null
          registrada_por: string | null
          responsavel_execucao: string | null
          status_execucao: string
          unidade_destino: string | null
          valor: number
        }
        Insert: {
          autorizada_por?: string | null
          categoria?: string | null
          created_at?: string | null
          data: string
          demanda?: string | null
          descricao: string
          destinacao_id?: string | null
          emenda_id: string
          fornecedor_nome?: string | null
          id?: string
          nota_fiscal_url?: string | null
          registrada_por?: string | null
          responsavel_execucao?: string | null
          status_execucao?: string
          unidade_destino?: string | null
          valor: number
        }
        Update: {
          autorizada_por?: string | null
          categoria?: string | null
          created_at?: string | null
          data?: string
          demanda?: string | null
          descricao?: string
          destinacao_id?: string | null
          emenda_id?: string
          fornecedor_nome?: string | null
          id?: string
          nota_fiscal_url?: string | null
          registrada_por?: string | null
          responsavel_execucao?: string | null
          status_execucao?: string
          unidade_destino?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: 'despesas_autorizada_por_fkey'
            columns: ['autorizada_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'despesas_destinacao_id_fkey'
            columns: ['destinacao_id']
            isOneToOne: false
            referencedRelation: 'destinacoes_recursos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'despesas_emenda_id_fkey'
            columns: ['emenda_id']
            isOneToOne: false
            referencedRelation: 'emendas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'despesas_registrada_por_fkey'
            columns: ['registrada_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'despesas_responsavel_execucao_fkey'
            columns: ['responsavel_execucao']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      destinacoes_recursos: {
        Row: {
          acao_id: string
          created_at: string | null
          grupo_despesa: string | null
          id: string
          observacao_tecnica: string | null
          portaria_vinculada: string | null
          subtipo: string | null
          tipo_destinacao: string
          updated_at: string | null
          valor_destinado: number
        }
        Insert: {
          acao_id: string
          created_at?: string | null
          grupo_despesa?: string | null
          id?: string
          observacao_tecnica?: string | null
          portaria_vinculada?: string | null
          subtipo?: string | null
          tipo_destinacao: string
          updated_at?: string | null
          valor_destinado?: number
        }
        Update: {
          acao_id?: string
          created_at?: string | null
          grupo_despesa?: string | null
          id?: string
          observacao_tecnica?: string | null
          portaria_vinculada?: string | null
          subtipo?: string | null
          tipo_destinacao?: string
          updated_at?: string | null
          valor_destinado?: number
        }
        Relationships: [
          {
            foreignKeyName: 'destinacoes_recursos_acao_id_fkey'
            columns: ['acao_id']
            isOneToOne: false
            referencedRelation: 'acoes_emendas'
            referencedColumns: ['id']
          },
        ]
      }
      emendas: {
        Row: {
          anexos_essenciais: boolean | null
          ano_exercicio: number
          autor: string
          created_at: string | null
          data_repasse: string | null
          deliberacao_cie: string | null
          descricao_completa: string | null
          destino_recurso: string | null
          id: string
          meta_operacional: string | null
          natureza: string | null
          numero_emenda: string
          numero_proposta: string | null
          objeto_emenda: string | null
          observacoes: string | null
          origem: string
          parlamentar: string
          portaria: string | null
          segundo_autor: string | null
          segundo_parlamentar: string | null
          situacao: Database['public']['Enums']['situacao_oficial']
          situacao_recurso: string | null
          status_interno: Database['public']['Enums']['status_interno']
          tipo: Database['public']['Enums']['tipo_emenda_enum']
          tipo_recurso: Database['public']['Enums']['tipo_recurso']
          updated_at: string | null
          valor_repasse: number | null
          valor_segundo_responsavel: number | null
          valor_total: number
        }
        Insert: {
          anexos_essenciais?: boolean | null
          ano_exercicio?: number
          autor: string
          created_at?: string | null
          data_repasse?: string | null
          deliberacao_cie?: string | null
          descricao_completa?: string | null
          destino_recurso?: string | null
          id?: string
          meta_operacional?: string | null
          natureza?: string | null
          numero_emenda: string
          numero_proposta?: string | null
          objeto_emenda?: string | null
          observacoes?: string | null
          origem?: string
          parlamentar: string
          portaria?: string | null
          segundo_autor?: string | null
          segundo_parlamentar?: string | null
          situacao?: Database['public']['Enums']['situacao_oficial']
          situacao_recurso?: string | null
          status_interno?: Database['public']['Enums']['status_interno']
          tipo: Database['public']['Enums']['tipo_emenda_enum']
          tipo_recurso: Database['public']['Enums']['tipo_recurso']
          updated_at?: string | null
          valor_repasse?: number | null
          valor_segundo_responsavel?: number | null
          valor_total?: number
        }
        Update: {
          anexos_essenciais?: boolean | null
          ano_exercicio?: number
          autor?: string
          created_at?: string | null
          data_repasse?: string | null
          deliberacao_cie?: string | null
          descricao_completa?: string | null
          destino_recurso?: string | null
          id?: string
          meta_operacional?: string | null
          natureza?: string | null
          numero_emenda?: string
          numero_proposta?: string | null
          objeto_emenda?: string | null
          observacoes?: string | null
          origem?: string
          parlamentar?: string
          portaria?: string | null
          segundo_autor?: string | null
          segundo_parlamentar?: string | null
          situacao?: Database['public']['Enums']['situacao_oficial']
          situacao_recurso?: string | null
          status_interno?: Database['public']['Enums']['status_interno']
          tipo?: Database['public']['Enums']['tipo_emenda_enum']
          tipo_recurso?: Database['public']['Enums']['tipo_recurso']
          updated_at?: string | null
          valor_repasse?: number | null
          valor_segundo_responsavel?: number | null
          valor_total?: number
        }
        Relationships: []
      }
      historico: {
        Row: {
          criado_em: string | null
          detalhe: string | null
          emenda_id: string
          evento: string
          feito_por: string | null
          id: string
        }
        Insert: {
          criado_em?: string | null
          detalhe?: string | null
          emenda_id: string
          evento: string
          feito_por?: string | null
          id?: string
        }
        Update: {
          criado_em?: string | null
          detalhe?: string | null
          emenda_id?: string
          evento?: string
          feito_por?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'historico_emenda_id_fkey'
            columns: ['emenda_id']
            isOneToOne: false
            referencedRelation: 'emendas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'historico_feito_por_fkey'
            columns: ['feito_por']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      limites_exercicio: {
        Row: {
          ano: number
          created_at: string | null
          limite_capital: number
          limite_mac: number
          limite_pap: number
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          limite_capital?: number
          limite_mac?: number
          limite_pap?: number
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          limite_capital?: number
          limite_mac?: number
          limite_pap?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          emenda_id: string
          id: string
          is_read: boolean
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emenda_id: string
          id?: string
          is_read?: boolean
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          emenda_id?: string
          id?: string
          is_read?: boolean
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_emenda_id_fkey'
            columns: ['emenda_id']
            isOneToOne: false
            referencedRelation: 'emendas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      pendencias: {
        Row: {
          created_at: string | null
          descricao: string
          dispensada: boolean | null
          emenda_id: string | null
          id: string
          justificativa: string | null
          resolvida: boolean | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          dispensada?: boolean | null
          emenda_id?: string | null
          id?: string
          justificativa?: string | null
          resolvida?: boolean | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          dispensada?: boolean | null
          emenda_id?: string | null
          id?: string
          justificativa?: string | null
          resolvida?: boolean | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'pendencias_emenda_id_fkey'
            columns: ['emenda_id']
            isOneToOne: false
            referencedRelation: 'emendas'
            referencedColumns: ['id']
          },
        ]
      }
      pre_lancamentos: {
        Row: {
          acao_orcamentaria: string | null
          ano: number | null
          beneficiario: string | null
          categoria_economica: string | null
          codigo_sequencial: number
          created_at: string | null
          created_by: string | null
          data_referencia: string | null
          funcao: string | null
          id: string
          identificador: string | null
          localidade: string | null
          modalidade_aplicacao: string | null
          numero_emenda: string | null
          numero_proposta: string | null
          objeto: string | null
          orgao: string | null
          parlamentar: string | null
          programa: string | null
          status_operacao: string | null
          sub_funcao: string | null
          tipo: string | null
          unidade_orcamentaria: string | null
          updated_at: string | null
          valor_previsto: number | null
        }
        Insert: {
          acao_orcamentaria?: string | null
          ano?: number | null
          beneficiario?: string | null
          categoria_economica?: string | null
          codigo_sequencial?: number
          created_at?: string | null
          created_by?: string | null
          data_referencia?: string | null
          funcao?: string | null
          id?: string
          identificador?: string | null
          localidade?: string | null
          modalidade_aplicacao?: string | null
          numero_emenda?: string | null
          numero_proposta?: string | null
          objeto?: string | null
          orgao?: string | null
          parlamentar?: string | null
          programa?: string | null
          status_operacao?: string | null
          sub_funcao?: string | null
          tipo?: string | null
          unidade_orcamentaria?: string | null
          updated_at?: string | null
          valor_previsto?: number | null
        }
        Update: {
          acao_orcamentaria?: string | null
          ano?: number | null
          beneficiario?: string | null
          categoria_economica?: string | null
          codigo_sequencial?: number
          created_at?: string | null
          created_by?: string | null
          data_referencia?: string | null
          funcao?: string | null
          id?: string
          identificador?: string | null
          localidade?: string | null
          modalidade_aplicacao?: string | null
          numero_emenda?: string | null
          numero_proposta?: string | null
          objeto?: string | null
          orgao?: string | null
          parlamentar?: string | null
          programa?: string | null
          status_operacao?: string | null
          sub_funcao?: string | null
          tipo?: string | null
          unidade_orcamentaria?: string | null
          updated_at?: string | null
          valor_previsto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'pre_lancamentos_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          cargo_id: string | null
          cpf: string | null
          created_at: string | null
          email: string
          id: string
          inactivity_timeout: number
          name: string
          role: Database['public']['Enums']['user_role']
          status: Database['public']['Enums']['user_status']
          unidade: string | null
          updated_at: string | null
        }
        Insert: {
          cargo_id?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          id: string
          inactivity_timeout?: number
          name: string
          role?: Database['public']['Enums']['user_role']
          status?: Database['public']['Enums']['user_status']
          unidade?: string | null
          updated_at?: string | null
        }
        Update: {
          cargo_id?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          id?: string
          inactivity_timeout?: number
          name?: string
          role?: Database['public']['Enums']['user_role']
          status?: Database['public']['Enums']['user_status']
          unidade?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_cargo_id_fkey'
            columns: ['cargo_id']
            isOneToOne: false
            referencedRelation: 'cargos'
            referencedColumns: ['id']
          },
        ]
      }
      repasses: {
        Row: {
          created_at: string | null
          data: string
          emenda_id: string
          fonte: string
          id: string
          observacoes: string | null
          ordem_bancaria: string | null
          status: string
          valor: number
        }
        Insert: {
          created_at?: string | null
          data: string
          emenda_id: string
          fonte: string
          id?: string
          observacoes?: string | null
          ordem_bancaria?: string | null
          status?: string
          valor: number
        }
        Update: {
          created_at?: string | null
          data?: string
          emenda_id?: string
          fonte?: string
          id?: string
          observacoes?: string | null
          ordem_bancaria?: string | null
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: 'repasses_emenda_id_fkey'
            columns: ['emenda_id']
            isOneToOne: false
            referencedRelation: 'emendas'
            referencedColumns: ['id']
          },
        ]
      }
      security_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          severity: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          severity?: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          severity?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'security_notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: never
        Returns: Database['public']['Enums']['user_role']
      }
      log_security_notification: {
        Args: {
          p_message: string
          p_severity: string
          p_type: string
          p_user_id?: string
        }
        Returns: undefined
      }
      search_emendas_global: {
        Args: { search_term: string }
        Returns: {
          anexos_essenciais: boolean | null
          ano_exercicio: number
          autor: string
          created_at: string | null
          data_repasse: string | null
          deliberacao_cie: string | null
          descricao_completa: string | null
          destino_recurso: string | null
          id: string
          meta_operacional: string | null
          natureza: string | null
          numero_emenda: string
          numero_proposta: string | null
          objeto_emenda: string | null
          observacoes: string | null
          origem: string
          parlamentar: string
          portaria: string | null
          segundo_autor: string | null
          segundo_parlamentar: string | null
          situacao: Database['public']['Enums']['situacao_oficial']
          situacao_recurso: string | null
          status_interno: Database['public']['Enums']['status_interno']
          tipo: Database['public']['Enums']['tipo_emenda_enum']
          tipo_recurso: Database['public']['Enums']['tipo_recurso']
          updated_at: string | null
          valor_repasse: number | null
          valor_segundo_responsavel: number | null
          valor_total: number
        }[]
        SetofOptions: {
          from: '*'
          to: 'emendas'
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      situacao_oficial:
        | 'PAGA'
        | 'EMPENHADA_AGUARDANDO_FORMALIZACAO'
        | 'FAVORAVEL'
        | 'EM_ANALISE'
        | 'LIBERADO_PAGAMENTO_FNS'
        | 'OUTRA'
      status_interno:
        | 'RASCUNHO'
        | 'EM_EXECUCAO'
        | 'PAGA_SEM_DOCUMENTOS'
        | 'PAGA_COM_PENDENCIAS'
        | 'CONCLUIDA'
        | 'PROPOSTA_PAGA'
        | 'EM_ANALISE_PAGAMENTO'
        | 'APROVADA_PAGAMENTO'
        | 'AUTORIZADA_AGUARDANDO_EMPENHO'
        | 'AGUARDANDO_AUTORIZACAO_FNS'
        | 'PORTARIA_PUBLICADA_AGUARDANDO_FNS'
        | 'ENVIADA_PUBLICACAO_PORTARIA'
        | 'PROPOSTA_APROVADA'
        | 'CLASSIFICADA_AGUARDANDO_SECRETARIA'
        | 'ANALISE_TECNICA_MERITO'
      tipo_emenda_enum: 'individual' | 'bancada' | 'comissao' | 'programa'
      tipo_recurso:
        | 'CUSTEIO_MAC'
        | 'CUSTEIO_PAP'
        | 'EQUIPAMENTO'
        | 'INCREMENTO_MAC'
        | 'INCREMENTO_PAP'
        | 'OUTRO'
      user_role: 'ADMIN' | 'GESTOR' | 'ANALISTA' | 'CONSULTA'
      user_status: 'ATIVO' | 'BLOQUEADO' | 'PENDENTE'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      situacao_oficial: [
        'PAGA',
        'EMPENHADA_AGUARDANDO_FORMALIZACAO',
        'FAVORAVEL',
        'EM_ANALISE',
        'LIBERADO_PAGAMENTO_FNS',
        'OUTRA',
      ],
      status_interno: [
        'RASCUNHO',
        'EM_EXECUCAO',
        'PAGA_SEM_DOCUMENTOS',
        'PAGA_COM_PENDENCIAS',
        'CONCLUIDA',
        'PROPOSTA_PAGA',
        'EM_ANALISE_PAGAMENTO',
        'APROVADA_PAGAMENTO',
        'AUTORIZADA_AGUARDANDO_EMPENHO',
        'AGUARDANDO_AUTORIZACAO_FNS',
        'PORTARIA_PUBLICADA_AGUARDANDO_FNS',
        'ENVIADA_PUBLICACAO_PORTARIA',
        'PROPOSTA_APROVADA',
        'CLASSIFICADA_AGUARDANDO_SECRETARIA',
        'ANALISE_TECNICA_MERITO',
      ],
      tipo_emenda_enum: ['individual', 'bancada', 'comissao', 'programa'],
      tipo_recurso: [
        'CUSTEIO_MAC',
        'CUSTEIO_PAP',
        'EQUIPAMENTO',
        'INCREMENTO_MAC',
        'INCREMENTO_PAP',
        'OUTRO',
      ],
      user_role: ['ADMIN', 'GESTOR', 'ANALISTA', 'CONSULTA'],
      user_status: ['ATIVO', 'BLOQUEADO', 'PENDENTE'],
    },
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: acoes_emendas
//   id: uuid (not null, default: gen_random_uuid())
//   emenda_id: uuid (not null)
//   nome_acao: text (not null)
//   area: text (not null)
//   complexidade: text (nullable)
//   publico_alvo: text (nullable)
//   descricao_oficial: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: anexos
//   id: uuid (not null, default: gen_random_uuid())
//   emenda_id: uuid (not null)
//   filename: text (not null)
//   url: text (not null)
//   tipo: text (not null)
//   uploader: uuid (nullable)
//   data_documento: date (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   size: numeric (nullable)
//   metadata: jsonb (nullable)
// Table: audit_logs
//   id: uuid (not null, default: gen_random_uuid())
//   table_name: text (not null)
//   record_id: uuid (nullable)
//   action: text (not null)
//   old_data: jsonb (nullable)
//   new_data: jsonb (nullable)
//   changed_by: uuid (nullable)
//   changed_at: timestamp with time zone (nullable, default: now())
// Table: backup_logs
//   id: uuid (not null, default: gen_random_uuid())
//   status: text (not null)
//   type: text (not null)
//   size: text (nullable)
//   url: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   completed_at: timestamp with time zone (nullable)
//   initiated_by: uuid (nullable)
// Table: cargos
//   id: uuid (not null, default: gen_random_uuid())
//   nome: text (not null)
//   descricao: text (nullable)
//   default_role: user_role (nullable)
//   active: boolean (nullable, default: true)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: configuracoes_anos
//   ano: integer (not null)
//   liberado_geral: boolean (not null, default: false)
//   created_at: timestamp with time zone (nullable, default: CURRENT_TIMESTAMP)
//   updated_at: timestamp with time zone (nullable, default: CURRENT_TIMESTAMP)
// Table: despesas
//   id: uuid (not null, default: gen_random_uuid())
//   emenda_id: uuid (not null)
//   data: date (not null)
//   valor: numeric (not null)
//   categoria: text (nullable)
//   descricao: text (not null)
//   fornecedor_nome: text (nullable)
//   nota_fiscal_url: text (nullable)
//   registrada_por: uuid (nullable)
//   autorizada_por: uuid (nullable)
//   responsavel_execucao: uuid (nullable)
//   unidade_destino: text (nullable)
//   status_execucao: text (not null, default: 'PLANEJADA'::text)
//   demanda: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   destinacao_id: uuid (nullable)
// Table: destinacoes_recursos
//   id: uuid (not null, default: gen_random_uuid())
//   acao_id: uuid (not null)
//   tipo_destinacao: text (not null)
//   subtipo: text (nullable)
//   valor_destinado: numeric (not null, default: 0)
//   portaria_vinculada: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   grupo_despesa: text (nullable)
//   observacao_tecnica: text (nullable)
// Table: emendas
//   id: uuid (not null, default: gen_random_uuid())
//   numero_emenda: text (not null)
//   numero_proposta: text (nullable)
//   autor: text (not null)
//   parlamentar: text (not null)
//   tipo: tipo_emenda_enum (not null)
//   tipo_recurso: tipo_recurso (not null)
//   valor_total: numeric (not null, default: 0)
//   situacao: situacao_oficial (not null, default: 'EM_ANALISE'::situacao_oficial)
//   status_interno: status_interno (not null, default: 'RASCUNHO'::status_interno)
//   portaria: text (nullable)
//   deliberacao_cie: text (nullable)
//   anexos_essenciais: boolean (nullable, default: false)
//   descricao_completa: text (nullable)
//   natureza: text (nullable)
//   objeto_emenda: text (nullable)
//   meta_operacional: text (nullable)
//   destino_recurso: text (nullable)
//   data_repasse: date (nullable)
//   valor_repasse: numeric (nullable)
//   situacao_recurso: text (nullable)
//   observacoes: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   segundo_autor: text (nullable)
//   segundo_parlamentar: text (nullable)
//   valor_segundo_responsavel: numeric (nullable, default: 0)
//   ano_exercicio: integer (not null, default: 2025)
//   origem: text (not null, default: 'FEDERAL'::text)
// Table: historico
//   id: uuid (not null, default: gen_random_uuid())
//   emenda_id: uuid (not null)
//   evento: text (not null)
//   detalhe: text (nullable)
//   feito_por: uuid (nullable)
//   criado_em: timestamp with time zone (nullable, default: now())
// Table: limites_exercicio
//   ano: integer (not null)
//   limite_mac: numeric (not null, default: 0)
//   limite_pap: numeric (not null, default: 0)
//   limite_capital: numeric (not null, default: 0)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: notifications
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   emenda_id: uuid (not null)
//   message: text (not null)
//   is_read: boolean (not null, default: false)
//   created_at: timestamp with time zone (not null, default: now())
// Table: pendencias
//   id: uuid (not null, default: gen_random_uuid())
//   emenda_id: uuid (nullable)
//   descricao: text (not null)
//   dispensada: boolean (nullable, default: false)
//   resolvida: boolean (nullable, default: false)
//   justificativa: text (nullable)
//   target_type: text (nullable)
//   target_id: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: pre_lancamentos
//   id: uuid (not null, default: gen_random_uuid())
//   codigo_sequencial: integer (not null, default: nextval('pre_lancamentos_codigo_sequencial_seq'::regclass))
//   identificador: text (nullable)
//   ano: integer (nullable, default: 2025)
//   data_referencia: date (nullable, default: CURRENT_DATE)
//   numero_emenda: text (nullable)
//   modalidade_aplicacao: text (nullable)
//   parlamentar: text (nullable)
//   beneficiario: text (nullable)
//   localidade: text (nullable)
//   valor_previsto: numeric (nullable, default: 0)
//   objeto: text (nullable)
//   funcao: text (nullable)
//   sub_funcao: text (nullable)
//   categoria_economica: text (nullable)
//   acao_orcamentaria: text (nullable)
//   orgao: text (nullable)
//   unidade_orcamentaria: text (nullable)
//   programa: text (nullable)
//   status_operacao: text (nullable, default: 'INCLUIR'::text)
//   created_by: uuid (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   tipo: text (nullable)
//   numero_proposta: text (nullable)
// Table: profiles
//   id: uuid (not null)
//   name: text (not null)
//   email: text (not null)
//   cpf: text (nullable)
//   cargo_id: uuid (nullable)
//   unidade: text (nullable)
//   role: user_role (not null, default: 'CONSULTA'::user_role)
//   status: user_status (not null, default: 'PENDENTE'::user_status)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   inactivity_timeout: integer (not null, default: 60)
// Table: repasses
//   id: uuid (not null, default: gen_random_uuid())
//   emenda_id: uuid (not null)
//   data: date (not null)
//   valor: numeric (not null)
//   fonte: text (not null)
//   status: text (not null, default: 'PENDENTE'::text)
//   observacoes: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   ordem_bancaria: text (nullable, default: ''::text)
// Table: security_notifications
//   id: uuid (not null, default: gen_random_uuid())
//   type: text (not null)
//   message: text (not null)
//   severity: text (not null, default: 'INFO'::text)
//   read: boolean (nullable, default: false)
//   created_at: timestamp with time zone (nullable, default: now())
//   user_id: uuid (nullable)

// --- CONSTRAINTS ---
// Table: acoes_emendas
//   FOREIGN KEY acoes_emendas_emenda_id_fkey: FOREIGN KEY (emenda_id) REFERENCES emendas(id) ON DELETE CASCADE
//   PRIMARY KEY acoes_emendas_pkey: PRIMARY KEY (id)
// Table: anexos
//   FOREIGN KEY anexos_emenda_id_fkey: FOREIGN KEY (emenda_id) REFERENCES emendas(id) ON DELETE CASCADE
//   PRIMARY KEY anexos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY anexos_uploader_fkey: FOREIGN KEY (uploader) REFERENCES profiles(id) ON DELETE SET NULL
// Table: audit_logs
//   FOREIGN KEY audit_logs_changed_by_fkey: FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE CASCADE
//   PRIMARY KEY audit_logs_pkey: PRIMARY KEY (id)
// Table: backup_logs
//   FOREIGN KEY backup_logs_initiated_by_fkey: FOREIGN KEY (initiated_by) REFERENCES profiles(id) ON DELETE SET NULL
//   PRIMARY KEY backup_logs_pkey: PRIMARY KEY (id)
// Table: cargos
//   PRIMARY KEY cargos_pkey: PRIMARY KEY (id)
// Table: configuracoes_anos
//   PRIMARY KEY configuracoes_anos_pkey: PRIMARY KEY (ano)
// Table: despesas
//   FOREIGN KEY despesas_autorizada_por_fkey: FOREIGN KEY (autorizada_por) REFERENCES profiles(id) ON DELETE SET NULL
//   FOREIGN KEY despesas_destinacao_id_fkey: FOREIGN KEY (destinacao_id) REFERENCES destinacoes_recursos(id) ON DELETE SET NULL
//   FOREIGN KEY despesas_emenda_id_fkey: FOREIGN KEY (emenda_id) REFERENCES emendas(id) ON DELETE CASCADE
//   PRIMARY KEY despesas_pkey: PRIMARY KEY (id)
//   FOREIGN KEY despesas_registrada_por_fkey: FOREIGN KEY (registrada_por) REFERENCES profiles(id) ON DELETE SET NULL
//   FOREIGN KEY despesas_responsavel_execucao_fkey: FOREIGN KEY (responsavel_execucao) REFERENCES profiles(id) ON DELETE SET NULL
// Table: destinacoes_recursos
//   FOREIGN KEY destinacoes_recursos_acao_id_fkey: FOREIGN KEY (acao_id) REFERENCES acoes_emendas(id) ON DELETE CASCADE
//   CHECK destinacoes_recursos_grupo_despesa_check: CHECK ((grupo_despesa = ANY (ARRAY['SERVIÇOS TERCEIROS (PJ)'::text, 'MATERIAL DE CONSUMO'::text, 'DISTRIBUIÇÃO GRATUITA'::text, 'EQUIPAMENTOS'::text, 'OUTROS'::text])))
//   PRIMARY KEY destinacoes_recursos_pkey: PRIMARY KEY (id)
// Table: emendas
//   CHECK emendas_origem_check: CHECK ((origem = ANY (ARRAY['FEDERAL'::text, 'ESTADUAL'::text])))
//   PRIMARY KEY emendas_pkey: PRIMARY KEY (id)
// Table: historico
//   FOREIGN KEY historico_emenda_id_fkey: FOREIGN KEY (emenda_id) REFERENCES emendas(id) ON DELETE CASCADE
//   FOREIGN KEY historico_feito_por_fkey: FOREIGN KEY (feito_por) REFERENCES profiles(id) ON DELETE CASCADE
//   PRIMARY KEY historico_pkey: PRIMARY KEY (id)
// Table: limites_exercicio
//   PRIMARY KEY limites_exercicio_pkey: PRIMARY KEY (ano)
// Table: notifications
//   FOREIGN KEY notifications_emenda_id_fkey: FOREIGN KEY (emenda_id) REFERENCES emendas(id) ON DELETE CASCADE
//   PRIMARY KEY notifications_pkey: PRIMARY KEY (id)
//   FOREIGN KEY notifications_user_id_fkey: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: pendencias
//   FOREIGN KEY pendencias_emenda_id_fkey: FOREIGN KEY (emenda_id) REFERENCES emendas(id) ON DELETE CASCADE
//   PRIMARY KEY pendencias_pkey: PRIMARY KEY (id)
// Table: pre_lancamentos
//   FOREIGN KEY pre_lancamentos_created_by_fkey: FOREIGN KEY (created_by) REFERENCES profiles(id)
//   CHECK pre_lancamentos_modalidade_aplicacao_check: CHECK ((modalidade_aplicacao = ANY (ARRAY['DIRETA'::text, 'INDIRETA'::text])))
//   UNIQUE pre_lancamentos_numero_proposta_key: UNIQUE (numero_proposta)
//   PRIMARY KEY pre_lancamentos_pkey: PRIMARY KEY (id)
// Table: profiles
//   FOREIGN KEY profiles_cargo_id_fkey: FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE SET NULL
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
// Table: repasses
//   FOREIGN KEY repasses_emenda_id_fkey: FOREIGN KEY (emenda_id) REFERENCES emendas(id) ON DELETE CASCADE
//   PRIMARY KEY repasses_pkey: PRIMARY KEY (id)
// Table: security_notifications
//   PRIMARY KEY security_notifications_pkey: PRIMARY KEY (id)
//   FOREIGN KEY security_notifications_user_id_fkey: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL

// --- ROW LEVEL SECURITY POLICIES ---
// Table: acoes_emendas
//   Policy "Acoes DELETE" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role]))
//   Policy "Acoes Delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Acoes INSERT" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Acoes Insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Acoes SELECT" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Acoes Select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Acoes UPDATE" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Acoes Update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
// Table: anexos
//   Policy "Anexos DELETE" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Anexos INSERT" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Anexos SELECT" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Anexos UPDATE" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
// Table: audit_logs
//   Policy "Admins can insert audit logs" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role() = 'ADMIN'::user_role)
//   Policy "Admins view audit" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = 'ADMIN'::user_role)
//   Policy "System insert audit" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
// Table: backup_logs
//   Policy "Admins can insert backup logs" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (get_user_role() = 'ADMIN'::user_role)
//   Policy "Admins can view backup logs" (SELECT, PERMISSIVE) roles={public}
//     USING: (get_user_role() = 'ADMIN'::user_role)
// Table: cargos
//   Policy "Read access for all authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Write access for ADMIN" (ALL, PERMISSIVE) roles={public}
//     USING: (get_user_role() = 'ADMIN'::user_role)
// Table: configuracoes_anos
//   Policy "Anos DELETE" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = 'ADMIN'::user_role)
//   Policy "Anos INSERT" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role() = 'ADMIN'::user_role)
//   Policy "Anos SELECT" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Anos UPDATE" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = 'ADMIN'::user_role)
// Table: despesas
//   Policy "Despesas DELETE" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Despesas INSERT" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Despesas SELECT" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Despesas UPDATE" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
// Table: destinacoes_recursos
//   Policy "Destinacoes DELETE" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role]))
//   Policy "Destinacoes Delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Destinacoes INSERT" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Destinacoes Insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Destinacoes SELECT" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Destinacoes Select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Destinacoes UPDATE" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Destinacoes Update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
// Table: emendas
//   Policy "Emendas DELETE" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role]))
//   Policy "Emendas INSERT" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Emendas SELECT" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Emendas UPDATE" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
// Table: historico
//   Policy "Historico INSERT" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Historico SELECT" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Read access for all authenticated users" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Write access for ADMIN, GESTOR, ANALISTA" (ALL, PERMISSIVE) roles={public}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
// Table: limites_exercicio
//   Policy "Limites insert policy" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role() = 'ADMIN'::user_role)
//   Policy "Limites select policy" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Limites update policy" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = 'ADMIN'::user_role)
// Table: notifications
//   Policy "Users can update their own notifications" (UPDATE, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
//   Policy "Users can view their own notifications" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
// Table: pendencias
//   Policy "Pendencias DELETE" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Pendencias INSERT" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Pendencias SELECT" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Pendencias UPDATE" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
//   Policy "Read access for all authenticated users" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Write access for ADMIN, GESTOR, ANALISTA" (ALL, PERMISSIVE) roles={public}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role]))
// Table: pre_lancamentos
//   Policy "pre_lancamentos_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role, 'CONSULTA'::user_role]))
//   Policy "pre_lancamentos_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role, 'CONSULTA'::user_role]))
//   Policy "pre_lancamentos_select_admin" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role, 'CONSULTA'::user_role]))
//   Policy "pre_lancamentos_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role, 'ANALISTA'::user_role, 'CONSULTA'::user_role]))
// Table: profiles
//   Policy "Admins can do everything on profiles" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = 'ADMIN'::user_role)
//     WITH CHECK: (get_user_role() = 'ADMIN'::user_role)
//   Policy "Admins can update any profile" (UPDATE, PERMISSIVE) roles={public}
//     USING: ((get_user_role())::text = 'ADMIN'::text)
//     WITH CHECK: ((get_user_role())::text = 'ADMIN'::text)
//   Policy "Authenticated users can view all profiles" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Profiles select policy" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Read access for all authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Users can update own profile" (UPDATE, PERMISSIVE) roles={public}
//     USING: (auth.uid() = id)
//     WITH CHECK: (auth.uid() = id)
// Table: repasses
//   Policy "Repasses DELETE" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role]))
//   Policy "Repasses INSERT" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role]))
//   Policy "Repasses SELECT" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Repasses UPDATE" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role() = ANY (ARRAY['ADMIN'::user_role, 'GESTOR'::user_role]))
// Table: security_notifications
//   Policy "Admins can update security notifications" (UPDATE, PERMISSIVE) roles={public}
//     USING: (get_user_role() = 'ADMIN'::user_role)
//   Policy "Admins can view all security notifications" (SELECT, PERMISSIVE) roles={public}
//     USING: (get_user_role() = 'ADMIN'::user_role)

// --- DATABASE FUNCTIONS ---
// FUNCTION audit_trigger_func()
//   CREATE OR REPLACE FUNCTION public.audit_trigger_func()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       user_id uuid := auth.uid();
//   BEGIN
//       IF (TG_OP = 'INSERT') THEN
//           INSERT INTO public.audit_logs (table_name, record_id, action, new_data, changed_by)
//           VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), user_id);
//           RETURN NEW;
//       ELSIF (TG_OP = 'UPDATE') THEN
//           INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
//           VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), user_id);
//           RETURN NEW;
//       ELSIF (TG_OP = 'DELETE') THEN
//           INSERT INTO public.audit_logs (table_name, record_id, action, old_data, changed_by)
//           VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), user_id);
//           RETURN OLD;
//       END IF;
//       RETURN NULL;
//   END;
//   $function$
//
// FUNCTION get_user_role()
//   CREATE OR REPLACE FUNCTION public.get_user_role()
//    RETURNS user_role
//    LANGUAGE sql
//    SECURITY DEFINER
//   AS $function$
//     SELECT role FROM public.profiles WHERE id = auth.uid();
//   $function$
//
// FUNCTION handle_expanded_notifications()
//   CREATE OR REPLACE FUNCTION public.handle_expanded_notifications()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     user_record RECORD;
//     notification_msg TEXT;
//     related_emenda_id UUID;
//     emenda_numero TEXT;
//   BEGIN
//     notification_msg := '';
//     related_emenda_id := NULL;
//
//     -- 1. Status Change in Emendas
//     IF TG_TABLE_NAME = 'emendas' AND TG_OP = 'UPDATE' THEN
//       IF OLD.status_interno IS DISTINCT FROM NEW.status_interno THEN
//         notification_msg := 'A emenda ' || NEW.numero_emenda || ' teve seu status alterado para ' || NEW.status_interno;
//         related_emenda_id := NEW.id;
//       END IF;
//     END IF;
//
//     -- 2. New Attachment in Anexos
//     IF TG_TABLE_NAME = 'anexos' AND TG_OP = 'INSERT' THEN
//       SELECT numero_emenda INTO emenda_numero FROM public.emendas WHERE id = NEW.emenda_id;
//       notification_msg := 'Novo anexo (' || NEW.filename || ') adicionado à emenda ' || emenda_numero;
//       related_emenda_id := NEW.emenda_id;
//     END IF;
//
//     -- 3. Pendency Resolved in Pendencias
//     IF TG_TABLE_NAME = 'pendencias' AND TG_OP = 'UPDATE' THEN
//       IF OLD.resolvida = FALSE AND NEW.resolvida = TRUE THEN
//          SELECT numero_emenda INTO emenda_numero FROM public.emendas WHERE id = NEW.emenda_id;
//          notification_msg := 'Pendência "' || NEW.descricao || '" resolvida na emenda ' || emenda_numero;
//          related_emenda_id := NEW.emenda_id;
//       END IF;
//     END IF;
//
//     -- Insert notifications for all active users if a message was generated
//     IF notification_msg != '' AND related_emenda_id IS NOT NULL THEN
//       FOR user_record IN SELECT id FROM public.profiles WHERE status = 'ATIVO' LOOP
//         INSERT INTO public.notifications (user_id, emenda_id, message, is_read, created_at)
//         VALUES (user_record.id, related_emenda_id, notification_msg, FALSE, NOW());
//       END LOOP;
//     END IF;
//
//     RETURN NULL;
//   END;
//   $function$
//
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     default_role public.user_role := 'CONSULTA';
//     default_status public.user_status := 'PENDENTE';
//     user_name text;
//   BEGIN
//     -- Try to get name from metadata, default to 'Novo Usuário' or email prefix
//     user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
//
//     INSERT INTO public.profiles (id, email, name, role, status)
//     VALUES (
//       NEW.id,
//       NEW.email,
//       user_name,
//       default_role,
//       default_status
//     )
//     ON CONFLICT (id) DO NOTHING;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION log_security_notification(text, text, text, uuid)
//   CREATE OR REPLACE FUNCTION public.log_security_notification(p_type text, p_message text, p_severity text, p_user_id uuid DEFAULT NULL::uuid)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       INSERT INTO public.security_notifications (type, message, severity, user_id)
//       VALUES (p_type, p_message, p_severity, p_user_id);
//   END;
//   $function$
//
// FUNCTION prevent_profile_sensitive_updates()
//   CREATE OR REPLACE FUNCTION public.prevent_profile_sensitive_updates()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     -- Allow Service Role (superuser) or Admin to bypass
//     -- Note: get_user_role() uses auth.uid(). If using service_role key, auth.uid() is usually null.
//     -- If auth.uid() is null, we assume it's a system process/edge function and allow it.
//     IF auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'ADMIN' THEN
//       -- Check if role or status is being changed
//       IF NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status THEN
//         RAISE EXCEPTION 'You are not authorized to update role or status.';
//       END IF;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION protect_profile_role_status()
//   CREATE OR REPLACE FUNCTION public.protect_profile_role_status()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     -- If the user is an admin, allow them to change anything
//     IF public.get_user_role()::text = 'ADMIN' THEN
//       RETURN NEW;
//     END IF;
//
//     -- Otherwise, enforce that role and status cannot be changed by the user
//     NEW.role = OLD.role;
//     NEW.status = OLD.status;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION search_emendas_global(text)
//   CREATE OR REPLACE FUNCTION public.search_emendas_global(search_term text)
//    RETURNS SETOF emendas
//    LANGUAGE sql
//    STABLE
//   AS $function$
//     SELECT *
//     FROM emendas
//     WHERE
//       parlamentar ILIKE '%' || search_term || '%' OR
//       autor ILIKE '%' || search_term || '%' OR
//       numero_emenda ILIKE '%' || search_term || '%' OR
//       numero_proposta ILIKE '%' || search_term || '%' OR
//       objeto_emenda ILIKE '%' || search_term || '%' OR
//       natureza ILIKE '%' || search_term || '%' OR
//       situacao::text ILIKE '%' || search_term || '%' OR
//       status_interno::text ILIKE '%' || search_term || '%' OR
//       -- Portaria search: ignore dots in both the column and the search term
//       REPLACE(COALESCE(portaria, ''), '.', '') ILIKE '%' || REPLACE(search_term, '.', '') || '%'
//     LIMIT 20;
//   $function$
//
// FUNCTION sync_emenda_pendencias()
//   CREATE OR REPLACE FUNCTION public.sync_emenda_pendencias()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   DECLARE
//       target_emenda_id uuid;
//       v_emenda record;
//       v_has_oficio boolean;
//       v_has_repasses boolean;
//       v_has_despesas boolean;
//   BEGIN
//       -- Determine Emenda ID based on the table triggering the function
//       IF TG_TABLE_NAME = 'emendas' THEN
//           target_emenda_id := COALESCE(NEW.id, OLD.id);
//       ELSIF TG_TABLE_NAME = 'anexos' THEN
//           target_emenda_id := COALESCE(NEW.emenda_id, OLD.emenda_id);
//       ELSIF TG_TABLE_NAME = 'repasses' THEN
//           target_emenda_id := COALESCE(NEW.emenda_id, OLD.emenda_id);
//       ELSIF TG_TABLE_NAME = 'despesas' THEN
//           target_emenda_id := COALESCE(NEW.emenda_id, OLD.emenda_id);
//       END IF;
//
//       IF target_emenda_id IS NULL THEN
//           RETURN NULL;
//       END IF;
//
//       -- Fetch Emenda Data
//       SELECT * INTO v_emenda FROM public.emendas WHERE id = target_emenda_id;
//
//       -- Check Repasses (Any record exists)
//       SELECT EXISTS(SELECT 1 FROM public.repasses WHERE emenda_id = target_emenda_id) INTO v_has_repasses;
//
//       -- Check Despesas (Any record exists)
//       SELECT EXISTS(SELECT 1 FROM public.despesas WHERE emenda_id = target_emenda_id) INTO v_has_despesas;
//
//       -- Check Anexos (Ofício de Envio) - Robust case-insensitive check
//       SELECT EXISTS(
//           SELECT 1 FROM public.anexos
//           WHERE emenda_id = target_emenda_id
//           AND (
//               tipo = 'OFICIO' OR
//               tipo ILIKE '%ofício de envio%' OR
//               tipo ILIKE '%oficio de envio%' OR
//               filename ILIKE '%ofício de envio%' OR
//               filename ILIKE '%oficio de envio%'
//           )
//       ) INTO v_has_oficio;
//
//       -- 1. Valor do Repasse (Checklist Item)
//       IF (v_emenda.valor_repasse IS NOT NULL AND v_emenda.valor_repasse > 0) OR v_has_repasses THEN
//           UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'valor_repasse';
//       ELSE
//           INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
//           VALUES (target_emenda_id, 'Definir Valor do Repasse', 'field', 'valor_repasse', false)
//           ON CONFLICT (emenda_id, target_id) DO UPDATE
//           SET resolvida = false
//           WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'valor_repasse' AND public.pendencias.dispensada = false;
//       END IF;
//
//       -- 2. Destino do Recurso (Checklist Item)
//       IF v_emenda.destino_recurso IS NOT NULL AND TRIM(v_emenda.destino_recurso) <> '' THEN
//           UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'destino_recurso';
//       ELSE
//           INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
//           VALUES (target_emenda_id, 'Informar Destino do Recurso', 'field', 'destino_recurso', false)
//           ON CONFLICT (emenda_id, target_id) DO UPDATE
//           SET resolvida = false
//           WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'destino_recurso' AND public.pendencias.dispensada = false;
//       END IF;
//
//       -- 3. Ofício de Envio (Checklist Item)
//       IF v_has_oficio THEN
//           UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'OFICIO';
//       ELSE
//           INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
//           VALUES (target_emenda_id, 'Anexar Ofício de Envio', 'anexo', 'OFICIO', false)
//           ON CONFLICT (emenda_id, target_id) DO UPDATE
//           SET resolvida = false
//           WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'OFICIO' AND public.pendencias.dispensada = false;
//       END IF;
//
//       -- 4. Objeto da Emenda (Checklist Item)
//       IF v_emenda.objeto_emenda IS NOT NULL AND TRIM(v_emenda.objeto_emenda) <> '' THEN
//           UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'objeto_emenda';
//       ELSE
//           INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
//           VALUES (target_emenda_id, 'Definir Objeto da Emenda', 'field', 'objeto_emenda', false)
//           ON CONFLICT (emenda_id, target_id) DO UPDATE
//           SET resolvida = false
//           WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'objeto_emenda' AND public.pendencias.dispensada = false;
//       END IF;
//
//       -- 5. Número da Proposta (Checklist Item)
//       IF v_emenda.numero_proposta IS NOT NULL AND TRIM(v_emenda.numero_proposta) <> '' THEN
//           UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'numero_proposta';
//       ELSE
//           INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
//           VALUES (target_emenda_id, 'Informar Número da Proposta', 'field', 'numero_proposta', false)
//           ON CONFLICT (emenda_id, target_id) DO UPDATE
//           SET resolvida = false
//           WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'numero_proposta' AND public.pendencias.dispensada = false;
//       END IF;
//
//       -- 6. Portaria (Checklist Item)
//       IF v_emenda.portaria IS NOT NULL AND TRIM(v_emenda.portaria) <> '' THEN
//           UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'portaria';
//       ELSE
//           INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
//           VALUES (target_emenda_id, 'Informar Portaria', 'field', 'portaria', false)
//           ON CONFLICT (emenda_id, target_id) DO UPDATE
//           SET resolvida = false
//           WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'portaria' AND public.pendencias.dispensada = false;
//       END IF;
//
//       -- 7. Despesas (Checklist Item)
//       IF v_has_despesas THEN
//           UPDATE public.pendencias SET resolvida = true WHERE emenda_id = target_emenda_id AND target_id = 'despesas';
//       ELSE
//           INSERT INTO public.pendencias (emenda_id, descricao, target_type, target_id, resolvida)
//           VALUES (target_emenda_id, 'Registrar Despesas', 'tab', 'despesas', false)
//           ON CONFLICT (emenda_id, target_id) DO UPDATE
//           SET resolvida = false
//           WHERE public.pendencias.emenda_id = target_emenda_id AND public.pendencias.target_id = 'despesas' AND public.pendencias.dispensada = false;
//       END IF;
//
//       RETURN NULL;
//   END;
//   $function$
//
// FUNCTION trigger_critical_security_alert()
//   CREATE OR REPLACE FUNCTION public.trigger_critical_security_alert()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       -- Alert on DELETE actions or UPDATEs on sensitive tables
//       IF NEW.action = 'DELETE' OR (NEW.table_name IN ('users', 'cargos', 'profiles') AND NEW.action = 'UPDATE') THEN
//           INSERT INTO public.security_notifications (type, message, severity, user_id)
//           VALUES (
//               'CRITICAL_CHANGE',
//               'Ação crítica detectada: ' || NEW.action || ' na tabela ' || NEW.table_name,
//               'WARNING',
//               NEW.changed_by
//           );
//       END IF;
//       RETURN NEW;
//   END;
//   $function$
//
// FUNCTION update_updated_at_column()
//   CREATE OR REPLACE FUNCTION public.update_updated_at_column()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//       NEW.updated_at = NOW();
//       RETURN NEW;
//   END;
//   $function$
//

// --- TRIGGERS ---
// Table: acoes_emendas
//   update_acoes_updated_at: CREATE TRIGGER update_acoes_updated_at BEFORE UPDATE ON public.acoes_emendas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
// Table: anexos
//   audit_anexos: CREATE TRIGGER audit_anexos AFTER INSERT OR DELETE OR UPDATE ON public.anexos FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()
//   sync_pendencias_on_anexos: CREATE TRIGGER sync_pendencias_on_anexos AFTER INSERT OR DELETE OR UPDATE ON public.anexos FOR EACH ROW EXECUTE FUNCTION sync_emenda_pendencias()
//   trg_notify_new_anexo: CREATE TRIGGER trg_notify_new_anexo AFTER INSERT ON public.anexos FOR EACH ROW EXECUTE FUNCTION handle_expanded_notifications()
// Table: audit_logs
//   on_critical_change: CREATE TRIGGER on_critical_change AFTER INSERT ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION trigger_critical_security_alert()
// Table: configuracoes_anos
//   update_configuracoes_anos_updated_at: CREATE TRIGGER update_configuracoes_anos_updated_at BEFORE UPDATE ON public.configuracoes_anos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
// Table: despesas
//   audit_despesas: CREATE TRIGGER audit_despesas AFTER INSERT OR DELETE OR UPDATE ON public.despesas FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()
//   sync_pendencias_on_despesas: CREATE TRIGGER sync_pendencias_on_despesas AFTER INSERT OR DELETE OR UPDATE ON public.despesas FOR EACH ROW EXECUTE FUNCTION sync_emenda_pendencias()
// Table: destinacoes_recursos
//   update_destinacoes_updated_at: CREATE TRIGGER update_destinacoes_updated_at BEFORE UPDATE ON public.destinacoes_recursos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
// Table: emendas
//   audit_emendas: CREATE TRIGGER audit_emendas AFTER INSERT OR DELETE OR UPDATE ON public.emendas FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()
//   sync_pendencias_on_emenda: CREATE TRIGGER sync_pendencias_on_emenda AFTER INSERT OR UPDATE ON public.emendas FOR EACH ROW EXECUTE FUNCTION sync_emenda_pendencias()
//   trg_notify_emenda_status: CREATE TRIGGER trg_notify_emenda_status AFTER UPDATE ON public.emendas FOR EACH ROW EXECUTE FUNCTION handle_expanded_notifications()
// Table: limites_exercicio
//   update_limites_exercicio_updated_at: CREATE TRIGGER update_limites_exercicio_updated_at BEFORE UPDATE ON public.limites_exercicio FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
// Table: pendencias
//   trg_notify_pendency_resolved: CREATE TRIGGER trg_notify_pendency_resolved AFTER UPDATE ON public.pendencias FOR EACH ROW EXECUTE FUNCTION handle_expanded_notifications()
// Table: pre_lancamentos
//   update_pre_lancamentos_updated_at: CREATE TRIGGER update_pre_lancamentos_updated_at BEFORE UPDATE ON public.pre_lancamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
// Table: profiles
//   audit_profiles: CREATE TRIGGER audit_profiles AFTER INSERT OR DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()
//   check_profile_updates: CREATE TRIGGER check_profile_updates BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION prevent_profile_sensitive_updates()
//   protect_profile_role_status: CREATE TRIGGER protect_profile_role_status BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION protect_profile_role_status()
// Table: repasses
//   audit_repasses: CREATE TRIGGER audit_repasses AFTER INSERT OR DELETE OR UPDATE ON public.repasses FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()
//   sync_pendencias_on_repasses: CREATE TRIGGER sync_pendencias_on_repasses AFTER INSERT OR DELETE OR UPDATE ON public.repasses FOR EACH ROW EXECUTE FUNCTION sync_emenda_pendencias()

// --- INDEXES ---
// Table: emendas
//   CREATE INDEX idx_emendas_ano_exercicio ON public.emendas USING btree (ano_exercicio)
//   CREATE INDEX idx_emendas_created_at ON public.emendas USING btree (created_at)
// Table: pendencias
//   CREATE UNIQUE INDEX idx_pendencias_emenda_target ON public.pendencias USING btree (emenda_id, target_id)
// Table: pre_lancamentos
//   CREATE UNIQUE INDEX pre_lancamentos_numero_proposta_key ON public.pre_lancamentos USING btree (numero_proposta)
