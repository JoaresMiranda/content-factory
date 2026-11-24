export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      workspaces: { Row: { id: string; name: string; created_at: string }; Insert: { id?: string; name: string }; Update: { name?: string } };
      profiles: { Row: { id: string; display_name: string | null; created_at: string }; Insert: { id: string; display_name?: string | null }; Update: { display_name?: string | null } };
      workspace_members: { Row: { workspace_id: string; user_id: string; role: 'owner' | 'admin' | 'editor' | 'viewer'; created_at: string }; Insert: { workspace_id: string; user_id: string; role?: 'owner' | 'admin' | 'editor' | 'viewer' }; Update: { role?: 'owner' | 'admin' | 'editor' | 'viewer' } };
      channels: { Row: { id: string; workspace_id: string; name: string; niche: string | null; language: string; created_at: string }; Insert: { id?: string; workspace_id: string; name: string; niche?: string | null; language?: string }; Update: { name?: string; niche?: string | null; language?: string } };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
