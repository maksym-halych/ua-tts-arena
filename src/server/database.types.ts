
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "models": {
                  Row: {
                    "added_at": string,"item_ids": (string)[],"name": string,"paused_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "added_at"?: string,"item_ids": (string)[],"name": string,"paused_at"?: string | null
                  }
                  Update: {
                    "added_at"?: string,"item_ids"?: (string)[],"name"?: string,"paused_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"raters": {
                  Row: {
                    "created_at": string,"email": string,"excluded_at": string | null,"excluded_reason": string | null,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"excluded_at"?: string | null,"excluded_reason"?: string | null,"id": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"excluded_at"?: string | null,"excluded_reason"?: string | null,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"rounds": {
                  Row: {
                    "a_served_at": string | null,"b_served_at": string | null,"expires_at": string,"id": string,"item_id": string,"model_a": string,"model_b": string,"rater_id": string,"required_listen_ms": number
                  }
                  ComputedFields: never
                  Insert: {
                    "a_served_at"?: string | null,"b_served_at"?: string | null,"expires_at": string,"id"?: string,"item_id": string,"model_a": string,"model_b": string,"rater_id": string,"required_listen_ms": number
                  }
                  Update: {
                    "a_served_at"?: string | null,"b_served_at"?: string | null,"expires_at"?: string,"id"?: string,"item_id"?: string,"model_a"?: string,"model_b"?: string,"rater_id"?: string,"required_listen_ms"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "rounds_model_a_fkey"
      columns: ["model_a"]
isOneToOne: false
      referencedRelation: "models"
      referencedColumns: ["name"]
    },{
      foreignKeyName: "rounds_model_b_fkey"
      columns: ["model_b"]
isOneToOne: false
      referencedRelation: "models"
      referencedColumns: ["name"]
    },{
      foreignKeyName: "rounds_rater_id_fkey"
      columns: ["rater_id"]
isOneToOne: true
      referencedRelation: "raters"
      referencedColumns: ["id"]
    }
                  ]
                },"settings": {
                  Row: {
                    "id": boolean,"leaderboard_public": boolean,"show_models_after_vote": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: boolean,"leaderboard_public"?: boolean,"show_models_after_vote"?: boolean
                  }
                  Update: {
                    "id"?: boolean,"leaderboard_public"?: boolean,"show_models_after_vote"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"votes": {
                  Row: {
                    "chosen_side": string,"created_at": string,"decision_ms": number,"excluded_at": string | null,"excluded_reason": string | null,"id": number,"item_id": string,"loser": string,"models_shown": boolean,"rater_id": string,"winner": string
                  }
                  ComputedFields: never
                  Insert: {
                    "chosen_side": string,"created_at"?: string,"decision_ms": number,"excluded_at"?: string | null,"excluded_reason"?: string | null,"id"?: never,"item_id": string,"loser": string,"models_shown": boolean,"rater_id": string,"winner": string
                  }
                  Update: {
                    "chosen_side"?: string,"created_at"?: string,"decision_ms"?: number,"excluded_at"?: string | null,"excluded_reason"?: string | null,"id"?: never,"item_id"?: string,"loser"?: string,"models_shown"?: boolean,"rater_id"?: string,"winner"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "votes_loser_fkey"
      columns: ["loser"]
isOneToOne: false
      referencedRelation: "models"
      referencedColumns: ["name"]
    },{
      foreignKeyName: "votes_rater_id_fkey"
      columns: ["rater_id"]
isOneToOne: false
      referencedRelation: "raters"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "votes_winner_fkey"
      columns: ["winner"]
isOneToOne: false
      referencedRelation: "models"
      referencedColumns: ["name"]
    }
                  ]
                }
          }
          Views: {
            "counted_votes": {
                  Row: {
                    "chosen_side": string,"created_at": string,"decision_ms": number,"excluded_at": string | null,"excluded_reason": string | null,"id": number,"item_id": string,"loser": string,"models_shown": boolean,"rater_id": string,"winner": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "votes_loser_fkey"
      columns: ["loser"]
isOneToOne: false
      referencedRelation: "models"
      referencedColumns: ["name"]
    },{
      foreignKeyName: "votes_rater_id_fkey"
      columns: ["rater_id"]
isOneToOne: false
      referencedRelation: "raters"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "votes_winner_fkey"
      columns: ["winner"]
isOneToOne: false
      referencedRelation: "models"
      referencedColumns: ["name"]
    }
                  ]
                },"daily_tallies": {
                  Row: {
                    "day": string | null,"votes": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"item_tallies": {
                  Row: {
                    "item_id": string,"votes": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"pair_tallies": {
                  Row: {
                    "loser": string,"winner": string,"wins": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "votes_loser_fkey"
      columns: ["loser"]
isOneToOne: false
      referencedRelation: "models"
      referencedColumns: ["name"]
    },{
      foreignKeyName: "votes_winner_fkey"
      columns: ["winner"]
isOneToOne: false
      referencedRelation: "models"
      referencedColumns: ["name"]
    }
                  ]
                }
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            [_ in never]: never
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
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
