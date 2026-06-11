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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      course_sections: {
        Row: {
          content: Json
          content_type: string
          course_id: string
          created_at: string
          id: string
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          content_type: string
          course_id: string
          created_at?: string
          id?: string
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          content_type?: string
          course_id?: string
          created_at?: string
          id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          is_free: boolean | null
          is_published: boolean | null
          level: string
          sort_order: number | null
          theme: string
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_free?: boolean | null
          is_published?: boolean | null
          level: string
          sort_order?: number | null
          theme: string
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_free?: boolean | null
          is_published?: boolean | null
          level?: string
          sort_order?: number | null
          theme?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      glossary_terms: {
        Row: {
          created_at: string
          definition: string
          id: string
          level: string
          related_course_ids: string[] | null
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          definition: string
          id?: string
          level: string
          related_course_ids?: string[] | null
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          definition?: string
          id?: string
          level?: string
          related_course_ids?: string[] | null
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      league_history: {
        Row: {
          created_at: string
          final_rank: number
          id: string
          league_after: string
          league_before: string
          outcome: string
          user_id: string
          week_start: string
          weekly_xp_total: number
        }
        Insert: {
          created_at?: string
          final_rank: number
          id?: string
          league_after: string
          league_before: string
          outcome: string
          user_id: string
          week_start: string
          weekly_xp_total?: number
        }
        Update: {
          created_at?: string
          final_rank?: number
          id?: string
          league_after?: string
          league_before?: string
          outcome?: string
          user_id?: string
          week_start?: string
          weekly_xp_total?: number
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          best_score: number
          completed: boolean
          completed_at: string | null
          course_id: string | null
          created_at: string
          last_played_at: string
          lesson_id: string
          level: string | null
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_score?: number
          completed?: boolean
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          last_played_at?: string
          lesson_id: string
          level?: string | null
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_score?: number
          completed?: boolean
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          last_played_at?: string
          lesson_id?: string
          level?: string | null
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cecr_level: string | null
          created_at: string
          daily_streak: number
          email: string | null
          first_name: string | null
          id: string
          interface_language: string | null
          is_active: boolean | null
          is_cia_student: boolean | null
          last_daily_completed_at: string | null
          last_name: string | null
          league: string
          nationality: string | null
          onboarding_completed_at: string | null
          phone: string | null
          placement_test_taken_at: string | null
          total_xp: number
          updated_at: string
          user_id: string
          weekly_period_start: string | null
          weekly_xp: number
        }
        Insert: {
          avatar_url?: string | null
          cecr_level?: string | null
          created_at?: string
          daily_streak?: number
          email?: string | null
          first_name?: string | null
          id?: string
          interface_language?: string | null
          is_active?: boolean | null
          is_cia_student?: boolean | null
          last_daily_completed_at?: string | null
          last_name?: string | null
          league?: string
          nationality?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          placement_test_taken_at?: string | null
          total_xp?: number
          updated_at?: string
          user_id: string
          weekly_period_start?: string | null
          weekly_xp?: number
        }
        Update: {
          avatar_url?: string | null
          cecr_level?: string | null
          created_at?: string
          daily_streak?: number
          email?: string | null
          first_name?: string | null
          id?: string
          interface_language?: string | null
          is_active?: boolean | null
          is_cia_student?: boolean | null
          last_daily_completed_at?: string | null
          last_name?: string | null
          league?: string
          nationality?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          placement_test_taken_at?: string | null
          total_xp?: number
          updated_at?: string
          user_id?: string
          weekly_period_start?: string | null
          weekly_xp?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          expires_at: string | null
          id: string
          plan: string
          price_id: string | null
          product_id: string | null
          promo_code: string | null
          starts_at: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          expires_at?: string | null
          id?: string
          plan: string
          price_id?: string | null
          product_id?: string | null
          promo_code?: string | null
          starts_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          expires_at?: string | null
          id?: string
          plan?: string
          price_id?: string | null
          product_id?: string | null
          promo_code?: string | null
          starts_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tts_usage_log: {
        Row: {
          created_at: string
          error_msg: string | null
          id: string
          status: string
          text_length: number
          user_id: string | null
          voice_id: string | null
        }
        Insert: {
          created_at?: string
          error_msg?: string | null
          id?: string
          status: string
          text_length: number
          user_id?: string | null
          voice_id?: string | null
        }
        Update: {
          created_at?: string
          error_msg?: string | null
          id?: string
          status?: string
          text_length?: number
          user_id?: string | null
          voice_id?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          course_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          last_accessed_at: string | null
          progress_pct: number | null
          score: number | null
          section_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_pct?: number | null
          score?: number | null
          section_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          progress_pct?: number | null
          score?: number | null
          section_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      xp_audit_log: {
        Row: {
          amount: number
          created_at: string
          id: string
          source: string
          source_ref: string | null
          user_id: string
          xp_after: number
          xp_before: number
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          source: string
          source_ref?: string | null
          user_id: string
          xp_after: number
          xp_before: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          source?: string
          source_ref?: string | null
          user_id?: string
          xp_after?: number
          xp_before?: number
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avatar_url: string | null
          cecr_level: string | null
          daily_streak: number | null
          first_name: string | null
          last_name: string | null
          league: string | null
          total_xp: number | null
          user_id: string | null
          weekly_xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          cecr_level?: string | null
          daily_streak?: number | null
          first_name?: string | null
          last_name?: string | null
          league?: string | null
          total_xp?: number | null
          user_id?: string | null
          weekly_xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          cecr_level?: string | null
          daily_streak?: number | null
          first_name?: string | null
          last_name?: string | null
          league?: string | null
          total_xp?: number | null
          user_id?: string | null
          weekly_xp?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_weekly_xp: {
        Args: { _amount: number; _user_id: string }
        Returns: undefined
      }
      admin_list_profiles: {
        Args: { _level?: string }
        Returns: {
          avatar_url: string | null
          cecr_level: string | null
          created_at: string
          daily_streak: number
          email: string | null
          first_name: string | null
          id: string
          interface_language: string | null
          is_active: boolean | null
          is_cia_student: boolean | null
          last_daily_completed_at: string | null
          last_name: string | null
          league: string
          nationality: string | null
          onboarding_completed_at: string | null
          phone: string | null
          placement_test_taken_at: string | null
          total_xp: number
          updated_at: string
          user_id: string
          weekly_period_start: string | null
          weekly_xp: number
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      award_xp: {
        Args: { _amount: number; _source: string; _source_ref?: string }
        Returns: Json
      }
      current_week_monday: { Args: never; Returns: string }
      get_my_profile: {
        Args: never
        Returns: {
          avatar_url: string | null
          cecr_level: string | null
          created_at: string
          daily_streak: number
          email: string | null
          first_name: string | null
          id: string
          interface_language: string | null
          is_active: boolean | null
          is_cia_student: boolean | null
          last_daily_completed_at: string | null
          last_name: string | null
          league: string
          nationality: string | null
          onboarding_completed_at: string | null
          phone: string | null
          placement_test_taken_at: string | null
          total_xp: number
          updated_at: string
          user_id: string
          weekly_period_start: string | null
          weekly_xp: number
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_daily_done: { Args: never; Returns: Json }
      mark_onboarding_done: { Args: never; Returns: Json }
      rotate_weekly_leagues: { Args: never; Returns: Json }
      set_cecr_level: { Args: { _level: string }; Returns: Json }
      set_placement_level: { Args: { _level: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "manager" | "learner"
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
      app_role: ["admin", "manager", "learner"],
    },
  },
} as const
