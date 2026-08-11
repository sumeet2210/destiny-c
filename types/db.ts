// GENERATED from the linked destiny-dev project (rule 0.3):
//   npx supabase gen types typescript --linked > types/db.ts
// Regenerate after every migration. Do not hand-edit.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.15';
  };
  public: {
    Tables: {
      bookings: {
        Row: {
          booking_time: string;
          confirmed_at: string | null;
          created_at: string;
          headcount: number;
          id: string;
          owner_note: string | null;
          owner_note_at: string | null;
          reminder_sent_at: string | null;
          restaurant_id: string;
          special_request: string | null;
          status: Database['public']['Enums']['booking_status'];
          student_id: string;
        };
        Insert: {
          booking_time: string;
          confirmed_at?: string | null;
          created_at?: string;
          headcount: number;
          id?: string;
          owner_note?: string | null;
          owner_note_at?: string | null;
          reminder_sent_at?: string | null;
          restaurant_id: string;
          special_request?: string | null;
          status?: Database['public']['Enums']['booking_status'];
          student_id: string;
        };
        Update: {
          booking_time?: string;
          confirmed_at?: string | null;
          created_at?: string;
          headcount?: number;
          id?: string;
          owner_note?: string | null;
          owner_note_at?: string | null;
          reminder_sent_at?: string | null;
          restaurant_id?: string;
          special_request?: string | null;
          status?: Database['public']['Enums']['booking_status'];
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      event_rsvps: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          student_id: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          student_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_rsvps_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_rsvps_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
          cover_image_url: string | null;
          created_at: string;
          description: string | null;
          ends_at: string | null;
          event_type: Database['public']['Enums']['event_type'];
          id: string;
          is_cancelled: boolean;
          restaurant_id: string;
          starts_at: string;
          title: string;
        };
        Insert: {
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          event_type?: Database['public']['Enums']['event_type'];
          id?: string;
          is_cancelled?: boolean;
          restaurant_id: string;
          starts_at: string;
          title: string;
        };
        Update: {
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          ends_at?: string | null;
          event_type?: Database['public']['Enums']['event_type'];
          id?: string;
          is_cancelled?: boolean;
          restaurant_id?: string;
          starts_at?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'events_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      friendships: {
        Row: {
          addressee_id: string;
          created_at: string;
          id: string;
          requester_id: string;
          responded_at: string | null;
          status: Database['public']['Enums']['friendship_status'];
        };
        Insert: {
          addressee_id: string;
          created_at?: string;
          id?: string;
          requester_id: string;
          responded_at?: string | null;
          status?: Database['public']['Enums']['friendship_status'];
        };
        Update: {
          addressee_id?: string;
          created_at?: string;
          id?: string;
          requester_id?: string;
          responded_at?: string | null;
          status?: Database['public']['Enums']['friendship_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'friendships_addressee_id_fkey';
            columns: ['addressee_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      menu_items: {
        Row: {
          craving_tags: string[];
          created_at: string;
          id: string;
          is_available: boolean;
          is_veg: boolean;
          name: string;
          price: number;
          restaurant_id: string;
        };
        Insert: {
          craving_tags?: string[];
          created_at?: string;
          id?: string;
          is_available?: boolean;
          is_veg?: boolean;
          name: string;
          price: number;
          restaurant_id: string;
        };
        Update: {
          craving_tags?: string[];
          created_at?: string;
          id?: string;
          is_available?: boolean;
          is_veg?: boolean;
          name?: string;
          price?: number;
          restaurant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'menu_items_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      offers: {
        Row: {
          created_at: string;
          description: string | null;
          discount_text: string | null;
          expires_at: string;
          flagged_count: number;
          id: string;
          is_active: boolean;
          restaurant_id: string;
          starts_at: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          discount_text?: string | null;
          expires_at: string;
          flagged_count?: number;
          id?: string;
          is_active?: boolean;
          restaurant_id: string;
          starts_at?: string;
          title: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          discount_text?: string | null;
          expires_at?: string;
          flagged_count?: number;
          id?: string;
          is_active?: boolean;
          restaurant_id?: string;
          starts_at?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'offers_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      profile_views: {
        Row: {
          created_at: string;
          id: string;
          restaurant_id: string;
          source_filter: string;
          viewer_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          restaurant_id: string;
          source_filter?: string;
          viewer_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          restaurant_id?: string;
          source_filter?: string;
          viewer_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profile_views_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profile_views_viewer_id_fkey';
            columns: ['viewer_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      restaurant_photos: {
        Row: {
          created_at: string;
          id: string;
          kind: Database['public']['Enums']['photo_kind'];
          restaurant_id: string;
          sort_order: number;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind?: Database['public']['Enums']['photo_kind'];
          restaurant_id: string;
          sort_order?: number;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: Database['public']['Enums']['photo_kind'];
          restaurant_id?: string;
          sort_order?: number;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'restaurant_photos_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      restaurants: {
        Row: {
          address: string | null;
          area: string;
          cover_image_url: string | null;
          created_at: string;
          description: string | null;
          dine_in: boolean;
          has_ac: boolean;
          id: string;
          is_veg_only: boolean;
          lat: number | null;
          lng: number | null;
          name: string;
          opening_hours: Json | null;
          owner_id: string;
          phone: string | null;
          price_per_head: number | null;
          status: Database['public']['Enums']['restaurant_status'];
          student_discount: boolean;
          takeaway: boolean;
          vibe_tags: string[];
        };
        Insert: {
          address?: string | null;
          area: string;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          dine_in?: boolean;
          has_ac?: boolean;
          id?: string;
          is_veg_only?: boolean;
          lat?: number | null;
          lng?: number | null;
          name: string;
          opening_hours?: Json | null;
          owner_id: string;
          phone?: string | null;
          price_per_head?: number | null;
          status?: Database['public']['Enums']['restaurant_status'];
          student_discount?: boolean;
          takeaway?: boolean;
          vibe_tags?: string[];
        };
        Update: {
          address?: string | null;
          area?: string;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          dine_in?: boolean;
          has_ac?: boolean;
          id?: string;
          is_veg_only?: boolean;
          lat?: number | null;
          lng?: number | null;
          name?: string;
          opening_hours?: Json | null;
          owner_id?: string;
          phone?: string | null;
          price_per_head?: number | null;
          status?: Database['public']['Enums']['restaurant_status'];
          student_discount?: boolean;
          takeaway?: boolean;
          vibe_tags?: string[];
        };
        Relationships: [
          {
            foreignKeyName: 'restaurants_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: {
          booking_id: string;
          comment: string | null;
          created_at: string;
          id: string;
          rating: number;
          restaurant_id: string;
          student_id: string;
        };
        Insert: {
          booking_id: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating: number;
          restaurant_id: string;
          student_id: string;
        };
        Update: {
          booking_id?: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating?: number;
          restaurant_id?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: true;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_restaurants: {
        Row: {
          created_at: string;
          id: string;
          restaurant_id: string;
          student_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          restaurant_id: string;
          student_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          restaurant_id?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_restaurants_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saved_restaurants_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          hostel: string | null;
          id: string;
          nitw_verified: boolean;
          no_show_count: number;
          role: Database['public']['Enums']['user_role'];
          share_activity: boolean;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          hostel?: string | null;
          id: string;
          nitw_verified?: boolean;
          no_show_count?: number;
          role?: Database['public']['Enums']['user_role'];
          share_activity?: boolean;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          hostel?: string | null;
          id?: string;
          nitw_verified?: boolean;
          no_show_count?: number;
          role?: Database['public']['Enums']['user_role'];
          share_activity?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      friend_edges: {
        Row: {
          friend_id: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      restaurant_views_by_day: {
        Row: {
          day: string | null;
          restaurant_id: string | null;
          views: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profile_views_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      restaurant_views_by_source: {
        Row: {
          restaurant_id: string | null;
          source_filter: string | null;
          views: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profile_views_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      find_student_by_email: {
        Args: { lookup_email: string };
        Returns: {
          full_name: string;
          hostel: string;
          id: string;
        }[];
      };
      flag_offer: { Args: { offer_id: string }; Returns: undefined };
      is_accepted_friend: { Args: { a: string; b: string }; Returns: boolean };
      is_nitw_student_email: { Args: { email: string }; Returns: boolean };
      is_open_now: {
        Args: { at_time?: string; hours: Json };
        Returns: boolean;
      };
      owns_restaurant: { Args: { rid: string }; Returns: boolean };
      restaurant_is_active: { Args: { rid: string }; Returns: boolean };
      shares_activity: { Args: { u: string }; Returns: boolean };
      trending_restaurants: {
        Args: { since?: string };
        Returns: {
          restaurant_id: string;
          views: number;
        }[];
      };
    };
    Enums: {
      booking_status:
        'requested' | 'confirmed' | 'unconfirmed' | 'completed' | 'cancelled';
      event_type:
        | 'live_music'
        | 'open_mic'
        | 'quiz'
        | 'screening'
        | 'food_festival'
        | 'other';
      friendship_status: 'pending' | 'accepted' | 'blocked';
      photo_kind: 'gallery' | 'menu_photo';
      restaurant_status: 'pending_approval' | 'active' | 'suspended';
      user_role: 'student' | 'owner' | 'admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        'requested',
        'confirmed',
        'unconfirmed',
        'completed',
        'cancelled',
      ],
      event_type: [
        'live_music',
        'open_mic',
        'quiz',
        'screening',
        'food_festival',
        'other',
      ],
      friendship_status: ['pending', 'accepted', 'blocked'],
      photo_kind: ['gallery', 'menu_photo'],
      restaurant_status: ['pending_approval', 'active', 'suspended'],
      user_role: ['student', 'owner', 'admin'],
    },
  },
} as const;
