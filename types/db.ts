// Rule 0.3 says this file is generated. No Supabase project is linked in this
// environment yet, so it is hand-written to exactly match supabase/migrations/.
// After linking: `npx supabase gen types typescript --linked > types/db.ts`
// and diff against this. See docs/decisions.md (2026-08-07).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          role: Database['public']['Enums']['user_role'];
          full_name: string | null;
          email: string;
          hostel: string | null;
          nitw_verified: boolean;
          no_show_count: number;
          share_activity: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: Database['public']['Enums']['user_role'];
          full_name?: string | null;
          email: string;
          hostel?: string | null;
          nitw_verified?: boolean;
          no_show_count?: number;
          share_activity?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: Database['public']['Enums']['user_role'];
          full_name?: string | null;
          email?: string;
          hostel?: string | null;
          nitw_verified?: boolean;
          no_show_count?: number;
          share_activity?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      restaurants: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          area: string;
          address: string | null;
          lat: number | null;
          lng: number | null;
          phone: string | null;
          is_veg_only: boolean;
          has_ac: boolean;
          dine_in: boolean;
          takeaway: boolean;
          student_discount: boolean;
          price_per_head: number | null;
          vibe_tags: string[];
          opening_hours: Json | null;
          cover_image_url: string | null;
          status: Database['public']['Enums']['restaurant_status'];
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          area: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          phone?: string | null;
          is_veg_only?: boolean;
          has_ac?: boolean;
          dine_in?: boolean;
          takeaway?: boolean;
          student_discount?: boolean;
          price_per_head?: number | null;
          vibe_tags?: string[];
          opening_hours?: Json | null;
          cover_image_url?: string | null;
          status?: Database['public']['Enums']['restaurant_status'];
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          area?: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          phone?: string | null;
          is_veg_only?: boolean;
          has_ac?: boolean;
          dine_in?: boolean;
          takeaway?: boolean;
          student_discount?: boolean;
          price_per_head?: number | null;
          vibe_tags?: string[];
          opening_hours?: Json | null;
          cover_image_url?: string | null;
          status?: Database['public']['Enums']['restaurant_status'];
          created_at?: string;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          price: number;
          is_veg: boolean;
          craving_tags: string[];
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          price: number;
          is_veg?: boolean;
          craving_tags?: string[];
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          price?: number;
          is_veg?: boolean;
          craving_tags?: string[];
          is_available?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      offers: {
        Row: {
          id: string;
          restaurant_id: string;
          title: string;
          description: string | null;
          discount_text: string | null;
          starts_at: string;
          expires_at: string;
          is_active: boolean;
          flagged_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          title: string;
          description?: string | null;
          discount_text?: string | null;
          starts_at?: string;
          expires_at: string;
          is_active?: boolean;
          flagged_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          title?: string;
          description?: string | null;
          discount_text?: string | null;
          starts_at?: string;
          expires_at?: string;
          is_active?: boolean;
          flagged_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      restaurant_photos: {
        Row: {
          id: string;
          restaurant_id: string;
          url: string;
          kind: Database['public']['Enums']['photo_kind'];
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          url: string;
          kind?: Database['public']['Enums']['photo_kind'];
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          url?: string;
          kind?: Database['public']['Enums']['photo_kind'];
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          restaurant_id: string;
          title: string;
          description: string | null;
          event_type: Database['public']['Enums']['event_type'];
          starts_at: string;
          ends_at: string | null;
          cover_image_url: string | null;
          is_cancelled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          title: string;
          description?: string | null;
          event_type?: Database['public']['Enums']['event_type'];
          starts_at: string;
          ends_at?: string | null;
          cover_image_url?: string | null;
          is_cancelled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          title?: string;
          description?: string | null;
          event_type?: Database['public']['Enums']['event_type'];
          starts_at?: string;
          ends_at?: string | null;
          cover_image_url?: string | null;
          is_cancelled?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          student_id: string;
          restaurant_id: string;
          headcount: number;
          special_request: string | null;
          booking_time: string;
          status: Database['public']['Enums']['booking_status'];
          reminder_sent_at: string | null;
          confirmed_at: string | null;
          owner_note: string | null;
          owner_note_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          restaurant_id: string;
          headcount: number;
          special_request?: string | null;
          booking_time: string;
          status?: Database['public']['Enums']['booking_status'];
          reminder_sent_at?: string | null;
          confirmed_at?: string | null;
          owner_note?: string | null;
          owner_note_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          restaurant_id?: string;
          headcount?: number;
          special_request?: string | null;
          booking_time?: string;
          status?: Database['public']['Enums']['booking_status'];
          reminder_sent_at?: string | null;
          confirmed_at?: string | null;
          owner_note?: string | null;
          owner_note_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          student_id: string;
          restaurant_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          student_id: string;
          restaurant_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          student_id?: string;
          restaurant_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profile_views: {
        Row: {
          id: string;
          restaurant_id: string;
          viewer_id: string | null;
          source_filter: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          viewer_id?: string | null;
          source_filter?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          viewer_id?: string | null;
          source_filter?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      saved_restaurants: {
        Row: {
          id: string;
          student_id: string;
          restaurant_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          restaurant_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          restaurant_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: Database['public']['Enums']['friendship_status'];
          responded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: Database['public']['Enums']['friendship_status'];
          responded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: Database['public']['Enums']['friendship_status'];
          responded_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      event_rsvps: {
        Row: {
          id: string;
          event_id: string;
          student_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          student_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          student_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      friend_edges: {
        Row: {
          user_id: string;
          friend_id: string;
        };
        Relationships: [];
      };
      restaurant_views_by_day: {
        Row: {
          restaurant_id: string;
          day: string;
          views: number;
        };
        Relationships: [];
      };
      restaurant_views_by_source: {
        Row: {
          restaurant_id: string;
          source_filter: string;
          views: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_open_now: {
        Args: { hours: Json; at_time?: string };
        Returns: boolean;
      };
      flag_offer: {
        Args: { offer_id: string };
        Returns: undefined;
      };
      trending_restaurants: {
        Args: { since?: string };
        Returns: { restaurant_id: string; views: number }[];
      };
      find_student_by_email: {
        Args: { lookup_email: string };
        Returns: {
          id: string;
          full_name: string | null;
          hostel: string | null;
        }[];
      };
      is_accepted_friend: {
        Args: { a: string; b: string };
        Returns: boolean;
      };
      shares_activity: {
        Args: { u: string };
        Returns: boolean;
      };
      is_nitw_student_email: {
        Args: { email: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: 'student' | 'owner' | 'admin';
      restaurant_status: 'pending_approval' | 'active' | 'suspended';
      booking_status:
        'requested' | 'confirmed' | 'unconfirmed' | 'completed' | 'cancelled';
      photo_kind: 'gallery' | 'menu_photo';
      event_type:
        | 'live_music'
        | 'open_mic'
        | 'quiz'
        | 'screening'
        | 'food_festival'
        | 'other';
      friendship_status: 'pending' | 'accepted' | 'blocked';
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
