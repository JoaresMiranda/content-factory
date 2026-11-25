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
      categories: {
        Row: {
          channel_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_channel_id_workspace_id_fkey"
            columns: ["channel_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          country_code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          language: string
          name: string
          niche: string | null
          slug: string
          timezone: string
          updated_at: string
          visual_identity: Json
          workspace_id: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          language?: string
          name: string
          niche?: string | null
          slug: string
          timezone?: string
          updated_at?: string
          visual_identity?: Json
          workspace_id: string
        }
        Update: {
          country_code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          language?: string
          name?: string
          niche?: string | null
          slug?: string
          timezone?: string
          updated_at?: string
          visual_identity?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          attribution: string
          author: string
          channel_id: string
          created_at: string
          created_by: string
          file_name: string
          file_size_bytes: number
          id: string
          kind: Database["public"]["Enums"]["media_asset_kind"]
          license_name: string
          mime_type: string
          notes: string
          origin: string
          source_url: string | null
          storage_path: string
          workspace_id: string
        }
        Insert: {
          attribution?: string
          author: string
          channel_id: string
          created_at?: string
          created_by: string
          file_name: string
          file_size_bytes: number
          id?: string
          kind: Database["public"]["Enums"]["media_asset_kind"]
          license_name: string
          mime_type: string
          notes?: string
          origin: string
          source_url?: string | null
          storage_path: string
          workspace_id: string
        }
        Update: {
          attribution?: string
          author?: string
          channel_id?: string
          created_at?: string
          created_by?: string
          file_name?: string
          file_size_bytes?: number
          id?: string
          kind?: Database["public"]["Enums"]["media_asset_kind"]
          license_name?: string
          mime_type?: string
          notes?: string
          origin?: string
          source_url?: string | null
          storage_path?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_channel_id_workspace_id_fkey"
            columns: ["channel_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "media_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      research_runs: {
        Row: {
          channel_id: string
          completed_at: string | null
          duplicates_skipped: number
          error_summary: string | null
          findings_created: number
          id: string
          query: string
          sources_consulted: Json
          started_at: string
          started_by: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          channel_id: string
          completed_at?: string | null
          duplicates_skipped?: number
          error_summary?: string | null
          findings_created?: number
          id?: string
          query: string
          sources_consulted?: Json
          started_at?: string
          started_by?: string | null
          status: string
          workspace_id: string
        }
        Update: {
          channel_id?: string
          completed_at?: string | null
          duplicates_skipped?: number
          error_summary?: string | null
          findings_created?: number
          id?: string
          query?: string
          sources_consulted?: Json
          started_at?: string
          started_by?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_runs_channel_id_workspace_id_fkey"
            columns: ["channel_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "research_runs_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_media_assets: {
        Row: {
          created_at: string
          id: string
          linked_by: string
          media_asset_id: string
          script_scene_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          linked_by: string
          media_asset_id: string
          script_scene_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          linked_by?: string
          media_asset_id?: string
          script_scene_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scene_media_assets_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scene_media_assets_media_asset_id_workspace_id_fkey"
            columns: ["media_asset_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "scene_media_assets_script_scene_id_workspace_id_fkey"
            columns: ["script_scene_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "script_scenes"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      script_generation_runs: {
        Row: {
          completed_at: string | null
          error_summary: string | null
          id: string
          started_at: string
          started_by: string
          status: string
          topic_id: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          error_summary?: string | null
          id?: string
          started_at?: string
          started_by: string
          status: string
          topic_id: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          error_summary?: string | null
          id?: string
          started_at?: string
          started_by?: string
          status?: string
          topic_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_generation_runs_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_generation_runs_topic_id_workspace_id_fkey"
            columns: ["topic_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      script_scenes: {
        Row: {
          duration_seconds: number
          id: string
          image_search_terms: string[]
          narration: string
          narration_audio_asset_id: string | null
          narration_audio_generated_at: string | null
          position: number
          script_id: string
          script_version_id: string
          visual_description: string
          voice_generation_started_at: string | null
          voice_generation_started_by: string | null
          voice_id: string | null
          voice_speed: number
          workspace_id: string
        }
        Insert: {
          duration_seconds: number
          id?: string
          image_search_terms?: string[]
          narration: string
          narration_audio_asset_id?: string | null
          narration_audio_generated_at?: string | null
          position: number
          script_id: string
          script_version_id: string
          visual_description: string
          voice_generation_started_at?: string | null
          voice_generation_started_by?: string | null
          voice_id?: string | null
          voice_speed?: number
          workspace_id: string
        }
        Update: {
          duration_seconds?: number
          id?: string
          image_search_terms?: string[]
          narration?: string
          narration_audio_asset_id?: string | null
          narration_audio_generated_at?: string | null
          position?: number
          script_id?: string
          script_version_id?: string
          visual_description?: string
          voice_generation_started_at?: string | null
          voice_generation_started_by?: string | null
          voice_id?: string | null
          voice_speed?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_scenes_narration_audio_workspace_fkey"
            columns: ["narration_audio_asset_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "script_scenes_script_id_workspace_id_fkey"
            columns: ["script_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "script_scenes_script_version_id_script_id_workspace_id_fkey"
            columns: ["script_version_id", "script_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "script_versions"
            referencedColumns: ["id", "script_id", "workspace_id"]
          },
          {
            foreignKeyName: "script_scenes_voice_generation_started_by_fkey"
            columns: ["voice_generation_started_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      script_versions: {
        Row: {
          conclusion: string
          created_at: string
          created_by: string
          cta: string
          decision_at: string | null
          decision_by: string | null
          development: string
          estimated_duration_seconds: number
          factual_references: Json
          hook: string
          id: string
          rejection_reason: string | null
          script_id: string
          status: Database["public"]["Enums"]["script_version_status"]
          title: string
          version_number: number
          workspace_id: string
        }
        Insert: {
          conclusion: string
          created_at?: string
          created_by: string
          cta: string
          decision_at?: string | null
          decision_by?: string | null
          development: string
          estimated_duration_seconds: number
          factual_references?: Json
          hook: string
          id?: string
          rejection_reason?: string | null
          script_id: string
          status?: Database["public"]["Enums"]["script_version_status"]
          title: string
          version_number: number
          workspace_id: string
        }
        Update: {
          conclusion?: string
          created_at?: string
          created_by?: string
          cta?: string
          decision_at?: string | null
          decision_by?: string | null
          development?: string
          estimated_duration_seconds?: number
          factual_references?: Json
          hook?: string
          id?: string
          rejection_reason?: string | null
          script_id?: string
          status?: Database["public"]["Enums"]["script_version_status"]
          title?: string
          version_number?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_versions_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "script_versions_script_id_workspace_id_fkey"
            columns: ["script_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      scripts: {
        Row: {
          channel_id: string
          created_at: string
          created_by: string
          id: string
          topic_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          created_by: string
          id?: string
          topic_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          created_by?: string
          id?: string
          topic_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scripts_channel_id_workspace_id_fkey"
            columns: ["channel_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "scripts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scripts_topic_id_workspace_id_fkey"
            columns: ["topic_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "scripts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      source_categories: {
        Row: {
          category_id: string
          created_at: string
          source_id: string
          workspace_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          source_id: string
          workspace_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          source_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_categories_category_id_workspace_id_fkey"
            columns: ["category_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "source_categories_source_id_workspace_id_fkey"
            columns: ["source_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      sources: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_accessed_at: string | null
          name: string
          type: Database["public"]["Enums"]["source_type"]
          updated_at: string
          url: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          name: string
          type: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          url: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          name?: string
          type?: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_sources: {
        Row: {
          created_at: string
          source_id: string
          topic_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          source_id: string
          topic_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          source_id?: string
          topic_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_sources_source_id_workspace_id_fkey"
            columns: ["source_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "topic_sources_topic_id_workspace_id_fkey"
            columns: ["topic_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      topics: {
        Row: {
          category_id: string | null
          channel_id: string
          classification_rationale: string | null
          classification_score: number | null
          context: string | null
          created_at: string
          created_by: string | null
          decision_at: string | null
          decision_by: string | null
          evidence: Json
          id: string
          internal_notes: string | null
          original_published_at: string | null
          reference_url: string | null
          rejection_reason: string | null
          research_run_id: string | null
          status: Database["public"]["Enums"]["topic_status"]
          summary: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          channel_id: string
          classification_rationale?: string | null
          classification_score?: number | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          decision_at?: string | null
          decision_by?: string | null
          evidence?: Json
          id?: string
          internal_notes?: string | null
          original_published_at?: string | null
          reference_url?: string | null
          rejection_reason?: string | null
          research_run_id?: string | null
          status?: Database["public"]["Enums"]["topic_status"]
          summary?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          channel_id?: string
          classification_rationale?: string | null
          classification_score?: number | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          decision_at?: string | null
          decision_by?: string | null
          evidence?: Json
          id?: string
          internal_notes?: string | null
          original_published_at?: string | null
          reference_url?: string | null
          rejection_reason?: string | null
          research_run_id?: string | null
          status?: Database["public"]["Enums"]["topic_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_category_id_channel_id_workspace_id_fkey"
            columns: ["category_id", "channel_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id", "channel_id", "workspace_id"]
          },
          {
            foreignKeyName: "topics_channel_id_workspace_id_fkey"
            columns: ["channel_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "topics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_research_run_workspace_fkey"
            columns: ["research_run_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "research_runs"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "topics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      begin_scene_voice_generation: {
        Args: { p_scene_id: string; p_speed: number; p_voice_id: string }
        Returns: boolean
      }
      begin_script_generation: { Args: { p_topic_id: string }; Returns: string }
      cancel_scene_voice_generation: {
        Args: { p_scene_id: string }
        Returns: undefined
      }
      complete_scene_voice_generation: {
        Args: { p_audio_asset_id: string; p_scene_id: string }
        Returns: undefined
      }
      create_script_version: {
        Args: {
          p_content: Json
          p_generation_run_id: string
          p_script_id: string
          p_topic_id: string
        }
        Returns: Json
      }
      decide_script_version: {
        Args: { p_decision: string; p_reason?: string; p_version_id: string }
        Returns: undefined
      }
      finish_script_generation: {
        Args: { p_error_summary?: string; p_run_id: string }
        Returns: undefined
      }
    }
    Enums: {
      media_asset_kind: "image" | "video" | "audio"
      script_version_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
      source_type:
        | "institutional_site"
        | "scientific_journal"
        | "university"
        | "news_portal"
        | "environmental_organization"
        | "rss_feed"
        | "api"
      topic_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "archived"
      workspace_role: "owner" | "admin" | "editor" | "viewer"
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
    Enums: {
      media_asset_kind: ["image", "video", "audio"],
      script_version_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
      ],
      source_type: [
        "institutional_site",
        "scientific_journal",
        "university",
        "news_portal",
        "environmental_organization",
        "rss_feed",
        "api",
      ],
      topic_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "archived",
      ],
      workspace_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const

