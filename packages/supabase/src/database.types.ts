// Generated types for the Supabase database schema
// This will be regenerated with `supabase gen types` once the project is provisioned
// For now, these types match the schema defined in the PRD

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: "user" | "admin";
          plan: "free" | "pro" | "agency";
          searches_used: number;
          searches_limit: number;
          stripe_customer_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: "user" | "admin";
          plan?: "free" | "pro" | "agency";
          searches_used?: number;
          searches_limit?: number;
          stripe_customer_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: "user" | "admin";
          plan?: "free" | "pro" | "agency";
          searches_used?: number;
          searches_limit?: number;
          stripe_customer_id?: string | null;
          created_at?: string;
        };
      };
      scrape_jobs: {
        Row: {
          id: string;
          user_id: string;
          query: string;
          location: string;
          options: {
            strict: boolean;
            maxResults: number;
            enrich: boolean;
          };
          status: "pending" | "running" | "completed" | "failed";
          phase: "collecting" | "extracting" | "enriching" | "scoring" | "done" | null;
          progress_current: number;
          progress_total: number;
          error: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          query: string;
          location: string;
          options: {
            strict: boolean;
            maxResults: number;
            enrich: boolean;
          };
          status?: "pending" | "running" | "completed" | "failed";
          phase?: "collecting" | "extracting" | "enriching" | "scoring" | "done" | null;
          progress_current?: number;
          progress_total?: number;
          error?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          query?: string;
          location?: string;
          options?: {
            strict: boolean;
            maxResults: number;
            enrich: boolean;
          };
          status?: "pending" | "running" | "completed" | "failed";
          phase?: "collecting" | "extracting" | "enriching" | "scoring" | "done" | null;
          progress_current?: number;
          progress_total?: number;
          error?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      businesses: {
        Row: {
          id: string;
          job_id: string;
          name: string;
          website: string | null;
          phone: string | null;
          address: string | null;
          rating: number | null;
          reviews: number | null;
          category: string | null;
          unclaimed: boolean;
          enrichment: Record<string, unknown> | null;
          lead_score: number;
          lead_reasons: Record<string, unknown>[];
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          name: string;
          website?: string | null;
          phone?: string | null;
          address?: string | null;
          rating?: number | null;
          reviews?: number | null;
          category?: string | null;
          unclaimed?: boolean;
          enrichment?: Record<string, unknown> | null;
          lead_score?: number;
          lead_reasons?: Record<string, unknown>[];
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          name?: string;
          website?: string | null;
          phone?: string | null;
          address?: string | null;
          rating?: number | null;
          reviews?: number | null;
          category?: string | null;
          unclaimed?: boolean;
          enrichment?: Record<string, unknown> | null;
          lead_score?: number;
          lead_reasons?: Record<string, unknown>[];
          created_at?: string;
        };
      };
      saved_lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      saved_list_items: {
        Row: {
          list_id: string;
          business_id: string;
          status: "saved" | "contacted" | "responded" | "closed";
          notes: string | null;
          contacted_at: string | null;
          created_at: string;
        };
        Insert: {
          list_id: string;
          business_id: string;
          status?: "saved" | "contacted" | "responded" | "closed";
          notes?: string | null;
          contacted_at?: string | null;
          created_at?: string;
        };
        Update: {
          list_id?: string;
          business_id?: string;
          status?: "saved" | "contacted" | "responded" | "closed";
          notes?: string | null;
          contacted_at?: string | null;
          created_at?: string;
        };
      };
      lead_pitches: {
        Row: {
          business_id: string;
          pitch_angle: string;
          improvement_suggestions: string[];
          draft_email: string;
          generated_at: string;
        };
        Insert: {
          business_id: string;
          pitch_angle: string;
          improvement_suggestions: string[];
          draft_email: string;
          generated_at?: string;
        };
        Update: {
          business_id?: string;
          pitch_angle?: string;
          improvement_suggestions?: string[];
          draft_email?: string;
          generated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
