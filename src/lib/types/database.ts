export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BookingStatus = "PENDING" | "ACCEPTED" | "CANCELLED" | "REJECTED";

export type LocationType = "google_meet" | "in_person" | "phone" | "link";

export type PaymentStatus = "pending" | "completed" | "refunded" | "failed";

export type TimeFormat = "12h" | "24h";

// Link-in-bio types
export type PageTheme = "minimal" | "bold" | "gradient" | "glassmorphism" | "brutalist" | "neon" | "soft" | "dark";

export type BackgroundType = "solid" | "gradient" | "image" | "animated";

export type ButtonStyle = "rounded" | "pill" | "square" | "outline" | "shadow" | "3d";

export type LinkType = "event" | "url" | "social" | "heading" | "divider" | "embed" | "email" | "phone" | "music" | "video";

export type LinkDisplayStyle = "standard" | "featured" | "compact" | "icon_only";

export type IconType = "lucide" | "emoji" | "custom" | "none";

export type SocialPlatform =
  | "instagram" | "twitter" | "tiktok" | "youtube" | "linkedin"
  | "github" | "facebook" | "twitch" | "discord" | "spotify"
  | "snapchat" | "pinterest" | "threads" | "mastodon" | "bluesky" | "other";

export type SocialIconStyle = "filled" | "outline" | "minimal" | "rounded" | "square";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          username: string | null;
          avatar_url: string | null;
          timezone: string;
          time_format: TimeFormat;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          time_format?: TimeFormat;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          time_format?: TimeFormat;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_types: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          slug: string;
          description: string | null;
          length: number;
          location_type: LocationType;
          location_value: string | null;
          hidden: boolean;
          buffer_time_before: number;
          buffer_time_after: number;
          minimum_notice: number;
          booking_limits_per_day: number | null;
          booking_limits_per_week: number | null;
          booking_window_days: number | null;
          position: number;
          schedule_id: string | null;
          is_paid: boolean;
          price_cents: number | null;
          refund_window_hours: number;
          promo_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          slug: string;
          description?: string | null;
          length: number;
          location_type?: LocationType;
          location_value?: string | null;
          hidden?: boolean;
          buffer_time_before?: number;
          buffer_time_after?: number;
          minimum_notice?: number;
          booking_limits_per_day?: number | null;
          booking_limits_per_week?: number | null;
          booking_window_days?: number | null;
          position?: number;
          schedule_id?: string | null;
          is_paid?: boolean;
          price_cents?: number | null;
          refund_window_hours?: number;
          promo_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          length?: number;
          location_type?: LocationType;
          location_value?: string | null;
          hidden?: boolean;
          buffer_time_before?: number;
          buffer_time_after?: number;
          minimum_notice?: number;
          booking_limits_per_day?: number | null;
          booking_limits_per_week?: number | null;
          booking_window_days?: number | null;
          position?: number;
          schedule_id?: string | null;
          is_paid?: boolean;
          price_cents?: number | null;
          refund_window_hours?: number;
          promo_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      schedules: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          timezone: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          timezone?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          timezone?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      availability: {
        Row: {
          id: string;
          schedule_id: string;
          day_of_week: number | null;
          specific_date: string | null;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          day_of_week?: number | null;
          specific_date?: string | null;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          schedule_id?: string;
          day_of_week?: number | null;
          specific_date?: string | null;
          start_time?: string;
          end_time?: string;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          uid: string;
          user_id: string;
          event_type_id: string;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          status: BookingStatus;
          location_type: LocationType;
          location_value: string | null;
          cancellation_reason: string | null;
          rescheduled_from_uid: string | null;
          payment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          uid?: string;
          user_id: string;
          event_type_id: string;
          title: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          status?: BookingStatus;
          location_type: LocationType;
          location_value?: string | null;
          cancellation_reason?: string | null;
          rescheduled_from_uid?: string | null;
          payment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          uid?: string;
          user_id?: string;
          event_type_id?: string;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string;
          status?: BookingStatus;
          location_type?: LocationType;
          location_value?: string | null;
          cancellation_reason?: string | null;
          rescheduled_from_uid?: string | null;
          payment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendees: {
        Row: {
          id: string;
          booking_id: string;
          email: string;
          name: string;
          timezone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          email: string;
          name: string;
          timezone: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          email?: string;
          name?: string;
          timezone?: string;
          created_at?: string;
        };
      };
      credentials: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          key: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          key: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          key?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      selected_calendars: {
        Row: {
          id: string;
          user_id: string;
          credential_id: string;
          external_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          credential_id: string;
          external_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          credential_id?: string;
          external_id?: string;
          created_at?: string;
        };
      };
      destination_calendars: {
        Row: {
          id: string;
          user_id: string;
          credential_id: string;
          external_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          credential_id: string;
          external_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          credential_id?: string;
          external_id?: string;
          created_at?: string;
        };
      };
      booking_references: {
        Row: {
          id: string;
          booking_id: string;
          credential_id: string;
          type: string;
          external_id: string;
          meeting_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          credential_id: string;
          type: string;
          external_id: string;
          meeting_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          credential_id?: string;
          type?: string;
          external_id?: string;
          meeting_url?: string | null;
          created_at?: string;
        };
      };
      // ========== PAYMENTS TABLE ==========
      payments: {
        Row: {
          id: string;
          booking_id: string | null;
          stripe_payment_intent_id: string | null;
          stripe_checkout_session_id: string;
          amount_cents: number;
          status: PaymentStatus;
          refund_id: string | null;
          refund_amount_cents: number | null;
          event_type_id: string;
          guest_email: string;
          guest_name: string;
          guest_timezone: string;
          booking_start_time: string;
          booking_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id: string;
          amount_cents: number;
          status?: PaymentStatus;
          refund_id?: string | null;
          refund_amount_cents?: number | null;
          event_type_id: string;
          guest_email: string;
          guest_name: string;
          guest_timezone: string;
          booking_start_time: string;
          booking_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string;
          amount_cents?: number;
          status?: PaymentStatus;
          refund_id?: string | null;
          refund_amount_cents?: number | null;
          event_type_id?: string;
          guest_email?: string;
          guest_name?: string;
          guest_timezone?: string;
          booking_start_time?: string;
          booking_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // ========== LINK-IN-BIO TABLES ==========
      page_settings: {
        Row: {
          user_id: string;
          page_title: string | null;
          bio: string | null;
          theme: PageTheme;
          primary_color: string;
          secondary_color: string;
          background_color: string;
          text_color: string;
          background_type: BackgroundType;
          background_image_url: string | null;
          gradient_start: string | null;
          gradient_end: string | null;
          gradient_direction: number | null;
          button_style: ButtonStyle;
          button_color: string | null;
          button_text_color: string | null;
          font_family: string;
          layout: "list" | "grid" | "masonry";
          show_avatar: boolean;
          show_bio: boolean;
          show_social_icons: boolean;
          social_icon_style: SocialIconStyle;
          hide_branding: boolean;
          custom_css: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          page_title?: string | null;
          bio?: string | null;
          theme?: PageTheme;
          primary_color?: string;
          secondary_color?: string;
          background_color?: string;
          text_color?: string;
          background_type?: BackgroundType;
          background_image_url?: string | null;
          gradient_start?: string | null;
          gradient_end?: string | null;
          gradient_direction?: number | null;
          button_style?: ButtonStyle;
          button_color?: string | null;
          button_text_color?: string | null;
          font_family?: string;
          layout?: "list" | "grid" | "masonry";
          show_avatar?: boolean;
          show_bio?: boolean;
          show_social_icons?: boolean;
          social_icon_style?: SocialIconStyle;
          hide_branding?: boolean;
          custom_css?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          page_title?: string | null;
          bio?: string | null;
          theme?: PageTheme;
          primary_color?: string;
          secondary_color?: string;
          background_color?: string;
          text_color?: string;
          background_type?: BackgroundType;
          background_image_url?: string | null;
          gradient_start?: string | null;
          gradient_end?: string | null;
          gradient_direction?: number | null;
          button_style?: ButtonStyle;
          button_color?: string | null;
          button_text_color?: string | null;
          font_family?: string;
          layout?: "list" | "grid" | "masonry";
          show_avatar?: boolean;
          show_bio?: boolean;
          show_social_icons?: boolean;
          social_icon_style?: SocialIconStyle;
          hide_branding?: boolean;
          custom_css?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      links: {
        Row: {
          id: string;
          user_id: string;
          position: number;
          link_type: LinkType;
          title: string;
          description: string | null;
          url: string | null;
          event_type_id: string | null;
          display_style: LinkDisplayStyle;
          icon_type: IconType;
          icon_value: string | null;
          thumbnail_url: string | null;
          background_color: string | null;
          text_color: string | null;
          is_visible: boolean;
          is_featured: boolean;
          visible_from: string | null;
          visible_until: string | null;
          click_count: number;
          embed_html: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          position?: number;
          link_type?: LinkType;
          title: string;
          description?: string | null;
          url?: string | null;
          event_type_id?: string | null;
          display_style?: LinkDisplayStyle;
          icon_type?: IconType;
          icon_value?: string | null;
          thumbnail_url?: string | null;
          background_color?: string | null;
          text_color?: string | null;
          is_visible?: boolean;
          is_featured?: boolean;
          visible_from?: string | null;
          visible_until?: string | null;
          click_count?: number;
          embed_html?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          position?: number;
          link_type?: LinkType;
          title?: string;
          description?: string | null;
          url?: string | null;
          event_type_id?: string | null;
          display_style?: LinkDisplayStyle;
          icon_type?: IconType;
          icon_value?: string | null;
          thumbnail_url?: string | null;
          background_color?: string | null;
          text_color?: string | null;
          is_visible?: boolean;
          is_featured?: boolean;
          visible_from?: string | null;
          visible_until?: string | null;
          click_count?: number;
          embed_html?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      social_profiles: {
        Row: {
          id: string;
          user_id: string;
          platform: SocialPlatform;
          url: string;
          username: string | null;
          position: number;
          is_visible: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: SocialPlatform;
          url: string;
          username?: string | null;
          position?: number;
          is_visible?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: SocialPlatform;
          url?: string;
          username?: string | null;
          position?: number;
          is_visible?: boolean;
          created_at?: string;
        };
      };
      link_clicks: {
        Row: {
          id: string;
          link_id: string;
          clicked_at: string;
          referrer: string | null;
          user_agent: string | null;
          country: string | null;
          created_date: string;
        };
        Insert: {
          id?: string;
          link_id: string;
          clicked_at?: string;
          referrer?: string | null;
          user_agent?: string | null;
          country?: string | null;
          created_date?: string;
        };
        Update: {
          id?: string;
          link_id?: string;
          clicked_at?: string;
          referrer?: string | null;
          user_agent?: string | null;
          country?: string | null;
          created_date?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      booking_status: BookingStatus;
      location_type: LocationType;
      page_theme: PageTheme;
      background_type: BackgroundType;
      button_style: ButtonStyle;
      link_type: LinkType;
      link_display_style: LinkDisplayStyle;
      icon_type: IconType;
      social_platform: SocialPlatform;
    };
  };
}

// Helper types for easier usage
export type User = Database["public"]["Tables"]["users"]["Row"];
export type EventType = Database["public"]["Tables"]["event_types"]["Row"];
export type Schedule = Database["public"]["Tables"]["schedules"]["Row"];
export type Availability = Database["public"]["Tables"]["availability"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Attendee = Database["public"]["Tables"]["attendees"]["Row"];
export type Credential = Database["public"]["Tables"]["credentials"]["Row"];
export type SelectedCalendar = Database["public"]["Tables"]["selected_calendars"]["Row"];
export type DestinationCalendar = Database["public"]["Tables"]["destination_calendars"]["Row"];
export type BookingReference = Database["public"]["Tables"]["booking_references"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];

// Link-in-bio types
export type PageSettings = Database["public"]["Tables"]["page_settings"]["Row"];
export type Link = Database["public"]["Tables"]["links"]["Row"];
export type SocialProfile = Database["public"]["Tables"]["social_profiles"]["Row"];
export type LinkClick = Database["public"]["Tables"]["link_clicks"]["Row"];

// Insert types
export type InsertEventType = Database["public"]["Tables"]["event_types"]["Insert"];
export type InsertSchedule = Database["public"]["Tables"]["schedules"]["Insert"];
export type InsertAvailability = Database["public"]["Tables"]["availability"]["Insert"];
export type InsertBooking = Database["public"]["Tables"]["bookings"]["Insert"];
export type InsertAttendee = Database["public"]["Tables"]["attendees"]["Insert"];
export type InsertLink = Database["public"]["Tables"]["links"]["Insert"];
export type InsertSocialProfile = Database["public"]["Tables"]["social_profiles"]["Insert"];
export type InsertPageSettings = Database["public"]["Tables"]["page_settings"]["Insert"];

// Update types
export type UpdateEventType = Database["public"]["Tables"]["event_types"]["Update"];
export type UpdateSchedule = Database["public"]["Tables"]["schedules"]["Update"];
export type UpdateBooking = Database["public"]["Tables"]["bookings"]["Update"];
export type UpdateLink = Database["public"]["Tables"]["links"]["Update"];
export type UpdatePageSettings = Database["public"]["Tables"]["page_settings"]["Update"];

// Link with event type (for display)
export type LinkWithEventType = Link & {
  event_type?: EventType | null;
};
