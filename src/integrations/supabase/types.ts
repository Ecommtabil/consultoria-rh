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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      cargos: {
        Row: {
          cargo: string | null
          cliente_id: string
          familia: string | null
          id: string
          nivel: number | null
          requisitos: string | null
          salario_base: number | null
          tempo_minimo_meses: number | null
          trilha: string | null
        }
        Insert: {
          cargo?: string | null
          cliente_id: string
          familia?: string | null
          id?: string
          nivel?: number | null
          requisitos?: string | null
          salario_base?: number | null
          tempo_minimo_meses?: number | null
          trilha?: string | null
        }
        Update: {
          cargo?: string | null
          cliente_id?: string
          familia?: string | null
          id?: string
          nivel?: number | null
          requisitos?: string | null
          salario_base?: number | null
          tempo_minimo_meses?: number | null
          trilha?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cargos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          aprovado_por: string | null
          canal_denuncias: string | null
          cidade_uf: string | null
          cnpj: string | null
          criado_em: string | null
          dia_fim: string | null
          dia_inicio: string | null
          escala_config: Json
          hora_entrada: string | null
          hora_saida: string | null
          id: string
          incluir_notas_consultor: boolean
          intervalo: string | null
          jornada_semanal: number | null
          mensagem_lideranca: string | null
          nome: string
          prazo_apuracao_dias: number | null
          responsavel_apuracao: string | null
          sistema_ponto: string | null
          user_id: string
          valor_max_brindes: number | null
          vigencia: string | null
        }
        Insert: {
          aprovado_por?: string | null
          canal_denuncias?: string | null
          cidade_uf?: string | null
          cnpj?: string | null
          criado_em?: string | null
          dia_fim?: string | null
          dia_inicio?: string | null
          escala_config?: Json
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          incluir_notas_consultor?: boolean
          intervalo?: string | null
          jornada_semanal?: number | null
          mensagem_lideranca?: string | null
          nome: string
          prazo_apuracao_dias?: number | null
          responsavel_apuracao?: string | null
          sistema_ponto?: string | null
          user_id?: string
          valor_max_brindes?: number | null
          vigencia?: string | null
        }
        Update: {
          aprovado_por?: string | null
          canal_denuncias?: string | null
          cidade_uf?: string | null
          cnpj?: string | null
          criado_em?: string | null
          dia_fim?: string | null
          dia_inicio?: string | null
          escala_config?: Json
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          incluir_notas_consultor?: boolean
          intervalo?: string | null
          jornada_semanal?: number | null
          mensagem_lideranca?: string | null
          nome?: string
          prazo_apuracao_dias?: number | null
          responsavel_apuracao?: string | null
          sistema_ponto?: string | null
          user_id?: string
          valor_max_brindes?: number | null
          vigencia?: string | null
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          admissao: string | null
          cargo: string | null
          cliente_id: string
          departamento: string | null
          dom_entrada: string | null
          dom_modo: string
          dom_saida: string | null
          entrada: string | null
          horas_semanais: number | null
          id: string
          jornada_atual: string | null
          matricula: string | null
          nome: string | null
          nova_jornada: string
          posto: string | null
          sab_entrada: string | null
          sab_modo: string
          sab_saida: string | null
          saida: string | null
          salario: number | null
          setor: string | null
          sexo: string | null
        }
        Insert: {
          admissao?: string | null
          cargo?: string | null
          cliente_id: string
          departamento?: string | null
          dom_entrada?: string | null
          dom_modo?: string
          dom_saida?: string | null
          entrada?: string | null
          horas_semanais?: number | null
          id?: string
          jornada_atual?: string | null
          matricula?: string | null
          nome?: string | null
          nova_jornada?: string
          posto?: string | null
          sab_entrada?: string | null
          sab_modo?: string
          sab_saida?: string | null
          saida?: string | null
          salario?: number | null
          setor?: string | null
          sexo?: string | null
        }
        Update: {
          admissao?: string | null
          cargo?: string | null
          cliente_id?: string
          departamento?: string | null
          dom_entrada?: string | null
          dom_modo?: string
          dom_saida?: string | null
          entrada?: string | null
          horas_semanais?: number | null
          id?: string
          jornada_atual?: string | null
          matricula?: string | null
          nome?: string | null
          nova_jornada?: string
          posto?: string | null
          sab_entrada?: string | null
          sab_modo?: string
          sab_saida?: string | null
          saida?: string | null
          salario?: number | null
          setor?: string | null
          sexo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      config_cargos: {
        Row: {
          cliente_id: string
          pct_entre_steps: number | null
          steps: number | null
        }
        Insert: {
          cliente_id: string
          pct_entre_steps?: number | null
          steps?: number | null
        }
        Update: {
          cliente_id?: string
          pct_entre_steps?: number | null
          steps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "config_cargos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: true
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      escalas: {
        Row: {
          atualizado_em: string
          cliente_id: string
          criado_em: string
          dados: Json
          id: string
        }
        Insert: {
          atualizado_em?: string
          cliente_id: string
          criado_em?: string
          dados?: Json
          id: string
        }
        Update: {
          atualizado_em?: string
          cliente_id?: string
          criado_em?: string
          dados?: Json
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ferias: {
        Row: {
          cliente_id: string
          colaborador_id: string
          fim: string
          id: string
          inicio: string
        }
        Insert: {
          cliente_id: string
          colaborador_id: string
          fim: string
          id?: string
          inicio: string
        }
        Update: {
          cliente_id?: string
          colaborador_id?: string
          fim?: string
          id?: string
          inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "ferias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ferias_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      postos: {
        Row: {
          cliente_id: string
          escala: string | null
          id: string
          operacao: string | null
          pessoas_por_dia: number | null
          posto: string | null
          turno_id: string | null
        }
        Insert: {
          cliente_id: string
          escala?: string | null
          id?: string
          operacao?: string | null
          pessoas_por_dia?: number | null
          posto?: string | null
          turno_id?: string | null
        }
        Update: {
          cliente_id?: string
          escala?: string | null
          id?: string
          operacao?: string | null
          pessoas_por_dia?: number | null
          posto?: string | null
          turno_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "postos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postos_turno_id_cliente_id_fkey"
            columns: ["turno_id", "cliente_id"]
            isOneToOne: false
            referencedRelation: "turnos"
            referencedColumns: ["id", "cliente_id"]
          },
        ]
      }
      sancoes: {
        Row: {
          cliente_id: string
          id: string
          medida: string | null
          ordem: number | null
          recorrencia: string | null
          situacao: string | null
        }
        Insert: {
          cliente_id: string
          id?: string
          medida?: string | null
          ordem?: number | null
          recorrencia?: string | null
          situacao?: string | null
        }
        Update: {
          cliente_id?: string
          id?: string
          medida?: string | null
          ordem?: number | null
          recorrencia?: string | null
          situacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sancoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos: {
        Row: {
          cliente_id: string
          fim: string | null
          id: string
          inicio: string | null
          intervalo_min: number | null
          nome: string | null
          sigla: string | null
        }
        Insert: {
          cliente_id: string
          fim?: string | null
          id?: string
          inicio?: string | null
          intervalo_min?: number | null
          nome?: string | null
          sigla?: string | null
        }
        Update: {
          cliente_id?: string
          fim?: string | null
          id?: string
          inicio?: string | null
          intervalo_min?: number | null
          nome?: string | null
          sigla?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turnos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      duplicate_cliente: { Args: { p_cliente: string }; Returns: string }
      import_cliente: {
        Args: { p_bundle: Json; p_cliente: string; p_modo?: string }
        Returns: undefined
      }
      unaccent_name: { Args: { v: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
