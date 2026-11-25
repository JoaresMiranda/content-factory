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
      platform_account_secrets: {
        Row: {
          access_token_ciphertext: string
          access_token_expires_at: string
          platform_account_id: string
          refresh_token_ciphertext: string | null
          refresh_token_expires_at: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          access_token_ciphertext: string
          access_token_expires_at: string
          platform_account_id: string
          refresh_token_ciphertext?: string | null
          refresh_token_expires_at?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          access_token_ciphertext?: string
          access_token_expires_at?: string
          platform_account_id?: string
          refresh_token_ciphertext?: string | null
          refresh_token_expires_at?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_account_secrets_platform_account_id_workspace_id_fkey"
            columns: ["platform_account_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "platform_accounts"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      platform_accounts: {
        Row: {
          channel_id: string
          connected_at: string
          connected_by: string | null
          connection_status: string
          display_name: string
          external_account_id: string
          id: string
          platform: Database["public"]["Enums"]["platform_name"]
          scopes: string[]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          channel_id: string
          connected_at?: string
          connected_by?: string | null
          connection_status?: string
          display_name: string
          external_account_id: string
          id?: string
          platform: Database["public"]["Enums"]["platform_name"]
          scopes?: string[]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          channel_id?: string
          connected_at?: string
          connected_by?: string | null
          connection_status?: string
          display_name?: string
          external_account_id?: string
          id?: string
          platform?: Database["public"]["Enums"]["platform_name"]
          scopes?: string[]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_accounts_channel_id_workspace_id_fkey"
            columns: ["channel_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "platform_accounts_connected_by_fkey"
            columns: ["connected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      production_jobs: {
        Row: {
          attempts: number
          channel_id: string
          completed_at: string | null
          created_at: string
          id: string
          last_error: string | null
          queue_message_id: number | null
          requested_by: string
          script_id: string
          script_version_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["production_job_status"]
          workspace_id: string
        }
        Insert: {
          attempts?: number
          channel_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          queue_message_id?: number | null
          requested_by: string
          script_id: string
          script_version_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["production_job_status"]
          workspace_id: string
        }
        Update: {
          attempts?: number
          channel_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          queue_message_id?: number | null
          requested_by?: string
          script_id?: string
          script_version_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["production_job_status"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_jobs_channel_id_workspace_id_fkey"
            columns: ["channel_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "production_jobs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_jobs_script_id_workspace_id_fkey"
            columns: ["script_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "production_jobs_script_version_id_script_id_workspace_id_fkey"
            columns: ["script_version_id", "script_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "script_versions"
            referencedColumns: ["id", "script_id", "workspace_id"]
          },
          {
            foreignKeyName: "production_jobs_workspace_id_fkey"
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
      publication_upload_sessions: {
        Row: {
          publication_id: string
          resumable_uri_ciphertext: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          publication_id: string
          resumable_uri_ciphertext: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          publication_id?: string
          resumable_uri_ciphertext?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publication_upload_sessions_publication_id_workspace_id_fkey"
            columns: ["publication_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id", "workspace_id"]
          },
        ]
      }
      publications: {
        Row: {
          attempts: number
          channel_id: string
          created_at: string
          description: string
          external_id: string | null
          external_url: string | null
          hashtags: string[]
          id: string
          last_error: string | null
          platform: Database["public"]["Enums"]["platform_name"]
          platform_account_id: string
          queue_message_id: number | null
          requested_by: string
          scheduled_at: string | null
          status: Database["public"]["Enums"]["publication_status"]
          title: string
          uploaded_at: string | null
          video_id: string
          visibility: string
          workspace_id: string
        }
        Insert: {
          attempts?: number
          channel_id: string
          created_at?: string
          description?: string
          external_id?: string | null
          external_url?: string | null
          hashtags?: string[]
          id?: string
          last_error?: string | null
          platform?: Database["public"]["Enums"]["platform_name"]
          platform_account_id: string
          queue_message_id?: number | null
          requested_by: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          title: string
          uploaded_at?: string | null
          video_id: string
          visibility: string
          workspace_id: string
        }
        Update: {
          attempts?: number
          channel_id?: string
          created_at?: string
          description?: string
          external_id?: string | null
          external_url?: string | null
          hashtags?: string[]
          id?: string
          last_error?: string | null
          platform?: Database["public"]["Enums"]["platform_name"]
          platform_account_id?: string
          queue_message_id?: number | null
          requested_by?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          title?: string
          uploaded_at?: string | null
          video_id?: string
          visibility?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publications_channel_id_workspace_id_fkey"
            columns: ["channel_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "publications_platform_account_id_workspace_id_channel_id_fkey"
            columns: ["platform_account_id", "workspace_id", "channel_id"]
            isOneToOne: false
            referencedRelation: "platform_accounts"
            referencedColumns: ["id", "workspace_id", "channel_id"]
          },
          {
            foreignKeyName: "publications_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publications_video_id_workspace_id_fkey"
            columns: ["video_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "publications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      videos: {
        Row: {
          channel_id: string
          codec: string
          created_at: string
          decision_at: string | null
          decision_by: string | null
          decision_reason: string | null
          duration_seconds: number
          file_size_bytes: number
          frame_rate: number
          id: string
          production_job_id: string
          resolution: string
          script_version_id: string
          status: Database["public"]["Enums"]["video_review_status"]
          thumbnail_storage_path: string
          video_storage_path: string
          workspace_id: string
        }
        Insert: {
          channel_id: string
          codec?: string
          created_at?: string
          decision_at?: string | null
          decision_by?: string | null
          decision_reason?: string | null
          duration_seconds: number
          file_size_bytes: number
          frame_rate?: number
          id?: string
          production_job_id: string
          resolution?: string
          script_version_id: string
          status?: Database["public"]["Enums"]["video_review_status"]
          thumbnail_storage_path: string
          video_storage_path: string
          workspace_id: string
        }
        Update: {
          channel_id?: string
          codec?: string
          created_at?: string
          decision_at?: string | null
          decision_by?: string | null
          decision_reason?: string | null
          duration_seconds?: number
          file_size_bytes?: number
          frame_rate?: number
          id?: string
          production_job_id?: string
          resolution?: string
          script_version_id?: string
          status?: Database["public"]["Enums"]["video_review_status"]
          thumbnail_storage_path?: string
          video_storage_path?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_channel_id_workspace_id_fkey"
            columns: ["channel_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "videos_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_production_job_id_workspace_id_fkey"
            columns: ["production_job_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "production_jobs"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "videos_script_version_id_workspace_id_fkey"
            columns: ["script_version_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "script_versions"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "videos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      video_metrics: {
        Row: {
          average_view_duration_seconds: number | null
          average_view_percentage: number | null
          captured_on: string
          channel_id: string
          comments: number | null
          created_at: string
          id: string
          likes: number | null
          platform: Database["public"]["Enums"]["platform_name"]
          publication_id: string
          shares: number | null
          subscribers_gained: number | null
          views: number | null
          watch_time_minutes: number | null
          workspace_id: string
        }
        Insert: {
          average_view_duration_seconds?: number | null
          average_view_percentage?: number | null
          captured_on?: string
          channel_id: string
          comments?: number | null
          created_at?: string
          id?: string
          likes?: number | null
          platform?: Database["public"]["Enums"]["platform_name"]
          publication_id: string
          shares?: number | null
          subscribers_gained?: number | null
          views?: number | null
          watch_time_minutes?: number | null
          workspace_id: string
        }
        Update: {
          average_view_duration_seconds?: number | null
          average_view_percentage?: number | null
          captured_on?: string
          channel_id?: string
          comments?: number | null
          created_at?: string
          id?: string
          likes?: number | null
          platform?: Database["public"]["Enums"]["platform_name"]
          publication_id?: string
          shares?: number | null
          subscribers_gained?: number | null
          views?: number | null
          watch_time_minutes?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_metrics_channel_id_workspace_id_fkey"
            columns: ["channel_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "video_metrics_publication_id_workspace_id_fkey"
            columns: ["publication_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id", "workspace_id"]
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
      claim_publication: {
        Args: { p_visibility_seconds?: number }
        Returns: Json
      }
      claim_render_job: {
        Args: { p_visibility_seconds?: number }
        Returns: Json
      }
      complete_publication: {
        Args: {
          p_external_id: string
          p_external_url: string
          p_message_id: number
          p_publication_id: string
          p_workspace_id: string
        }
        Returns: undefined
      }
      complete_render_job: {
        Args: {
          p_duration_seconds: number
          p_file_size_bytes: number
          p_job_id: string
          p_message_id: number
          p_thumbnail_path: string
          p_video_path: string
          p_workspace_id: string
        }
        Returns: string
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
      decide_video: {
        Args: { p_decision: string; p_reason?: string; p_video_id: string }
        Returns: undefined
      }
      disconnect_platform_account: {
        Args: { p_account_id: string }
        Returns: undefined
      }
      extend_publication_job: {
        Args: { p_message_id: number; p_visibility_seconds?: number }
        Returns: boolean
      }
      extend_render_job: {
        Args: { p_message_id: number; p_visibility_seconds?: number }
        Returns: boolean
      }
      fail_publication: {
        Args: {
          p_attempt: number
          p_error: string
          p_message_id: number
          p_publication_id: string
          p_workspace_id: string
        }
        Returns: boolean
      }
      fail_render_job: {
        Args: {
          p_attempt: number
          p_error: string
          p_job_id: string
          p_message_id: number
          p_workspace_id: string
        }
        Returns: boolean
      }
      finish_script_generation: {
        Args: { p_error_summary?: string; p_run_id: string }
        Returns: undefined
      }
      record_youtube_upload_result: {
        Args: {
          p_external_id: string
          p_external_url: string
          p_publication_id: string
          p_workspace_id: string
        }
        Returns: undefined
      }
      start_video_production: {
        Args: { p_script_version_id: string }
        Returns: string
      }
      start_youtube_publication: {
        Args: {
          p_description?: string
          p_hashtags?: string[]
          p_scheduled_at?: string
          p_title: string
          p_video_id: string
          p_visibility?: string
        }
        Returns: string
      }
    }
    Enums: {
      media_asset_kind: "image" | "video" | "audio"
      platform_name: "youtube" | "tiktok"
      production_job_status:
        | "queued"
        | "rendering"
        | "completed"
        | "failed"
        | "cancelled"
      publication_status:
        | "queued"
        | "uploading"
        | "uploaded_private"
        | "scheduled"
        | "published"
        | "failed"
        | "cancelled"
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
      video_review_status:
        | "pending_approval"
        | "approved"
        | "rejected"
        | "revision_requested"
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
      platform_name: ["youtube", "tiktok"],
      production_job_status: [
        "queued",
        "rendering",
        "completed",
        "failed",
        "cancelled",
      ],
      publication_status: [
        "queued",
        "uploading",
        "uploaded_private",
        "scheduled",
        "published",
        "failed",
        "cancelled",
      ],
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
      video_review_status: [
        "pending_approval",
        "approved",
        "rejected",
        "revision_requested",
      ],
      workspace_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const

