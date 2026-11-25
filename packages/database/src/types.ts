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
          context: string | null
          created_at: string
          created_by: string | null
          decision_at: string | null
          decision_by: string | null
          id: string
          internal_notes: string | null
          original_published_at: string | null
          reference_url: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["topic_status"]
          summary: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category_id?: string | null
          channel_id: string
          context?: string | null
          created_at?: string
          created_by?: string | null
          decision_at?: string | null
          decision_by?: string | null
          id?: string
          internal_notes?: string | null
          original_published_at?: string | null
          reference_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["topic_status"]
          summary?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category_id?: string | null
          channel_id?: string
          context?: string | null
          created_at?: string
          created_by?: string | null
          decision_at?: string | null
          decision_by?: string | null
          id?: string
          internal_notes?: string | null
          original_published_at?: string | null
          reference_url?: string | null
          rejection_reason?: string | null
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
      [_ in never]: never
    }
    Enums: {
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

