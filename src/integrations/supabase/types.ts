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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_messages: {
        Row: {
          admin_user_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          message_type: string | null
          professional_id: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          message_type?: string | null
          professional_id: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          message_type?: string | null
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_messages_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      app_content: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          type: string
          updated_at: string
          value: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          type?: string
          updated_at?: string
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          type?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      app_menus: {
        Row: {
          created_at: string
          id: string
          items: Json
          menu_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          menu_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          menu_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_modules: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_visible: boolean
          module_id: string
          module_type: string
          name: string
          order_index: number
          page: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_visible?: boolean
          module_id: string
          module_type?: string
          name: string
          order_index?: number
          page?: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_visible?: boolean
          module_id?: string
          module_type?: string
          name?: string
          order_index?: number
          page?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_pages: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_public: boolean | null
          is_visible: boolean | null
          name: string
          order_index: number | null
          page_id: string
          path: string
          platform: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          is_visible?: boolean | null
          name: string
          order_index?: number | null
          page_id: string
          path: string
          platform?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          is_visible?: boolean | null
          name?: string
          order_index?: number | null
          page_id?: string
          path?: string
          platform?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      appointment_disputes: {
        Row: {
          admin_notes: string | null
          appointment_id: string
          created_at: string
          id: string
          professional_id: string
          reason: string
          resolved_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          appointment_id: string
          created_at?: string
          id?: string
          professional_id: string
          reason: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          appointment_id?: string
          created_at?: string
          id?: string
          professional_id?: string
          reason?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_disputes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          consultation_link: string | null
          created_at: string
          dispute_created_at: string | null
          dispute_reason: string | null
          google_event_id: string | null
          id: string
          notes: string | null
          professional_id: string
          rating: number | null
          receipt_url: string | null
          refund_deadline: string | null
          refund_receipt_url: string | null
          refund_sent_at: string | null
          rejection_reason: string | null
          scheduled_date: string
          scheduled_time: string
          status: string | null
          updated_at: string
          user_id: string
          user_pix_key: string | null
          user_pix_key_type: string | null
        }
        Insert: {
          consultation_link?: string | null
          created_at?: string
          dispute_created_at?: string | null
          dispute_reason?: string | null
          google_event_id?: string | null
          id?: string
          notes?: string | null
          professional_id: string
          rating?: number | null
          receipt_url?: string | null
          refund_deadline?: string | null
          refund_receipt_url?: string | null
          refund_sent_at?: string | null
          rejection_reason?: string | null
          scheduled_date: string
          scheduled_time: string
          status?: string | null
          updated_at?: string
          user_id: string
          user_pix_key?: string | null
          user_pix_key_type?: string | null
        }
        Update: {
          consultation_link?: string | null
          created_at?: string
          dispute_created_at?: string | null
          dispute_reason?: string | null
          google_event_id?: string | null
          id?: string
          notes?: string | null
          professional_id?: string
          rating?: number | null
          receipt_url?: string | null
          refund_deadline?: string | null
          refund_receipt_url?: string | null
          refund_sent_at?: string | null
          rejection_reason?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: string | null
          updated_at?: string
          user_id?: string
          user_pix_key?: string | null
          user_pix_key_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      case_reviews: {
        Row: {
          created_at: string
          difficulties: string | null
          feelings: string | null
          id: string
          needs_supervision: boolean | null
          patient_code: string
          professional_id: string
          supervision_notes: string | null
          updated_at: string
          whats_working: string | null
        }
        Insert: {
          created_at?: string
          difficulties?: string | null
          feelings?: string | null
          id?: string
          needs_supervision?: boolean | null
          patient_code: string
          professional_id: string
          supervision_notes?: string | null
          updated_at?: string
          whats_working?: string | null
        }
        Update: {
          created_at?: string
          difficulties?: string | null
          feelings?: string | null
          id?: string
          needs_supervision?: boolean | null
          patient_code?: string
          professional_id?: string
          supervision_notes?: string | null
          updated_at?: string
          whats_working?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          patient_code: string
          professional_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          patient_code: string
          professional_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          patient_code?: string
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_observations: {
        Row: {
          attention_points: string | null
          created_at: string
          id: string
          observed_emotions: string | null
          patient_code: string
          patient_resources: string | null
          professional_id: string
          recurring_themes: string | null
          trigger_situations: string | null
          updated_at: string
        }
        Insert: {
          attention_points?: string | null
          created_at?: string
          id?: string
          observed_emotions?: string | null
          patient_code: string
          patient_resources?: string | null
          professional_id: string
          recurring_themes?: string | null
          trigger_situations?: string | null
          updated_at?: string
        }
        Update: {
          attention_points?: string | null
          created_at?: string
          id?: string
          observed_emotions?: string | null
          patient_code?: string
          patient_resources?: string | null
          professional_id?: string
          recurring_themes?: string | null
          trigger_situations?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_observations_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          badge_url: string | null
          created_at: string
          id: string
          league: string | null
          name: string
          primary_color: string
          secondary_color: string | null
          short_name: string | null
        }
        Insert: {
          badge_url?: string | null
          created_at?: string
          id: string
          league?: string | null
          name: string
          primary_color: string
          secondary_color?: string | null
          short_name?: string | null
        }
        Update: {
          badge_url?: string | null
          created_at?: string
          id?: string
          league?: string | null
          name?: string
          primary_color?: string
          secondary_color?: string | null
          short_name?: string | null
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          discount_amount: number
          final_amount: number
          id: string
          original_amount: number
          used_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          discount_amount: number
          final_amount: number
          id?: string
          original_amount: number
          used_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          discount_amount?: number
          final_amount?: number
          id?: string
          original_amount?: number
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_to: string
          code: string
          created_at: string
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_amount: number | null
          updated_at: string
        }
        Insert: {
          applicable_to?: string
          code: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_amount?: number | null
          updated_at?: string
        }
        Update: {
          applicable_to?: string
          code?: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      course_lessons: {
        Row: {
          created_at: string
          description: string | null
          duration: string | null
          id: string
          is_free: boolean
          module_id: string
          order_index: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          is_free?: boolean
          module_id: string
          order_index?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          is_free?: boolean
          module_id?: string
          order_index?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string
          coming_soon: boolean
          created_at: string
          description: string | null
          grid_image_url: string | null
          hero_image_url: string | null
          id: string
          instructor: string | null
          is_featured: boolean
          is_premium: boolean
          is_published: boolean
          order_index: number
          price: number | null
          thumbnail_url: string | null
          title: string
          total_duration: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          coming_soon?: boolean
          created_at?: string
          description?: string | null
          grid_image_url?: string | null
          hero_image_url?: string | null
          id?: string
          instructor?: string | null
          is_featured?: boolean
          is_premium?: boolean
          is_published?: boolean
          order_index?: number
          price?: number | null
          thumbnail_url?: string | null
          title: string
          total_duration?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          coming_soon?: boolean
          created_at?: string
          description?: string | null
          grid_image_url?: string | null
          hero_image_url?: string | null
          id?: string
          instructor?: string | null
          is_featured?: boolean
          is_premium?: boolean
          is_published?: boolean
          order_index?: number
          price?: number | null
          thumbnail_url?: string | null
          title?: string
          total_duration?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      emotion_entries: {
        Row: {
          created_at: string
          emotion: string
          entry_date: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          emotion: string
          entry_date?: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          emotion?: string
          entry_date?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emotional_lineups: {
        Row: {
          ai_analysis: string | null
          created_at: string
          entry_date: string
          formation: string
          id: string
          lineup: Json
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          created_at?: string
          entry_date?: string
          formation: string
          id?: string
          lineup?: Json
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          created_at?: string
          entry_date?: string
          formation?: string
          id?: string
          lineup?: Json
          user_id?: string
        }
        Relationships: []
      }
      football_news: {
        Row: {
          category: string | null
          club_id: string | null
          created_at: string
          id: string
          image_caption: string | null
          image_credits: string | null
          image_url: string | null
          is_original: boolean | null
          original_content: string | null
          original_title: string
          original_url: string
          published_at: string
          rewritten_content: string
          rewritten_title: string
          source_site: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          club_id?: string | null
          created_at?: string
          id?: string
          image_caption?: string | null
          image_credits?: string | null
          image_url?: string | null
          is_original?: boolean | null
          original_content?: string | null
          original_title: string
          original_url: string
          published_at?: string
          rewritten_content: string
          rewritten_title: string
          source_site: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          club_id?: string | null
          created_at?: string
          id?: string
          image_caption?: string | null
          image_credits?: string | null
          image_url?: string | null
          is_original?: boolean | null
          original_content?: string | null
          original_title?: string
          original_url?: string
          published_at?: string
          rewritten_content?: string
          rewritten_title?: string
          source_site?: string
          updated_at?: string
        }
        Relationships: []
      }
      google_calendar_blocks: {
        Row: {
          created_at: string
          end_time: string
          google_event_id: string
          id: string
          is_all_day: boolean
          professional_id: string
          start_time: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          google_event_id: string
          id?: string
          is_all_day?: boolean
          professional_id: string
          start_time: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          google_event_id?: string
          id?: string
          is_all_day?: boolean
          professional_id?: string
          start_time?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      health_news: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_caption: string | null
          image_credits: string | null
          is_featured_home: boolean
          is_published: boolean
          published_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category?: string
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_caption?: string | null
          image_credits?: string | null
          is_featured_home?: boolean
          is_published?: boolean
          published_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_caption?: string | null
          image_credits?: string | null
          is_featured_home?: boolean
          is_published?: boolean
          published_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_activities: {
        Row: {
          activity_type: string
          content: Json | null
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          lesson_id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          activity_type?: string
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          lesson_id: string
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          lesson_id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_activities_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      match_expectations: {
        Row: {
          confidence_level: string
          created_at: string
          id: string
          loss_impact: string | null
          match_id: string
          pre_match_feeling: string | null
          user_id: string
          win_impact: string | null
        }
        Insert: {
          confidence_level: string
          created_at?: string
          id?: string
          loss_impact?: string | null
          match_id: string
          pre_match_feeling?: string | null
          user_id: string
          win_impact?: string | null
        }
        Update: {
          confidence_level?: string
          created_at?: string
          id?: string
          loss_impact?: string | null
          match_id?: string
          pre_match_feeling?: string | null
          user_id?: string
          win_impact?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_expectations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "upcoming_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_automations: {
        Row: {
          created_at: string
          created_by: string | null
          delay_minutes: number
          id: string
          is_active: boolean
          link: string | null
          message: string
          name: string
          target_role: string
          title: string
          trigger_event: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delay_minutes?: number
          id?: string
          is_active?: boolean
          link?: string | null
          message: string
          name: string
          target_role?: string
          title: string
          trigger_event: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delay_minutes?: number
          id?: string
          is_active?: boolean
          link?: string | null
          message?: string
          name?: string
          target_role?: string
          title?: string
          trigger_event?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          scheduled_for: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          scheduled_for?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          scheduled_for?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          automation_id: string | null
          id: string
          in_app_sent: number
          link: string | null
          message: string
          push_failed: number
          push_sent: number
          sent_at: string
          sent_by: string | null
          target: string
          target_user_id: string | null
          title: string
          type: string
        }
        Insert: {
          automation_id?: string | null
          id?: string
          in_app_sent?: number
          link?: string | null
          message: string
          push_failed?: number
          push_sent?: number
          sent_at?: string
          sent_by?: string | null
          target?: string
          target_user_id?: string | null
          title: string
          type?: string
        }
        Update: {
          automation_id?: string | null
          id?: string
          in_app_sent?: number
          link?: string | null
          message?: string
          push_failed?: number
          push_sent?: number
          sent_at?: string
          sent_by?: string | null
          target?: string
          target_user_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "notification_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_rule_runs: {
        Row: {
          event_id: string | null
          fired_at: string
          id: string
          rule_id: string
          user_id: string
        }
        Insert: {
          event_id?: string | null
          fired_at?: string
          id?: string
          rule_id: string
          user_id: string
        }
        Update: {
          event_id?: string | null
          fired_at?: string
          id?: string
          rule_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_rules: {
        Row: {
          audience: string
          body_template: string
          cooldown_hours: number
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          is_active: boolean
          link_template: string | null
          name: string
          quiet_hours_end: number | null
          quiet_hours_start: number | null
          title_template: string
          type: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body_template: string
          cooldown_hours?: number
          created_at?: string
          created_by?: string | null
          event_type: string
          id?: string
          is_active?: boolean
          link_template?: string | null
          name: string
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          title_template: string
          type?: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body_template?: string
          cooldown_hours?: number
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          is_active?: boolean
          link_template?: string | null
          name?: string
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          title_template?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          created_at: string
          created_by: string | null
          icon: string | null
          id: string
          link: string | null
          message: string
          name: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          link?: string | null
          message: string
          name: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          link?: string | null
          message?: string
          name?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      osmf_reports: {
        Row: {
          attachment_paths: string[]
          club_id: string | null
          contact_email: string | null
          contact_name: string | null
          content: string
          created_at: string
          emotions: string[]
          id: string
          is_anonymous: boolean
          location_text: string | null
          status: string
          submit_type: string
          updated_at: string
        }
        Insert: {
          attachment_paths?: string[]
          club_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          content: string
          created_at?: string
          emotions?: string[]
          id?: string
          is_anonymous?: boolean
          location_text?: string | null
          status?: string
          submit_type: string
          updated_at?: string
        }
        Update: {
          attachment_paths?: string[]
          club_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          content?: string
          created_at?: string
          emotions?: string[]
          id?: string
          is_anonymous?: boolean
          location_text?: string | null
          status?: string
          submit_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      professional_availability: {
        Row: {
          created_at: string
          date: string
          id: string
          professional_id: string
          time_slots: string[]
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          professional_id: string
          time_slots?: string[]
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          professional_id?: string
          time_slots?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_google_calendar: {
        Row: {
          access_token: string
          calendar_id: string
          created_at: string
          google_email: string
          id: string
          is_active: boolean
          last_synced_at: string | null
          professional_id: string
          refresh_token: string
          sync_token: string | null
          token_expires_at: string
          updated_at: string
          webhook_channel_id: string | null
          webhook_expires_at: string | null
          webhook_resource_id: string | null
          webhook_token: string | null
        }
        Insert: {
          access_token: string
          calendar_id?: string
          created_at?: string
          google_email: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          professional_id: string
          refresh_token: string
          sync_token?: string | null
          token_expires_at: string
          updated_at?: string
          webhook_channel_id?: string | null
          webhook_expires_at?: string | null
          webhook_resource_id?: string | null
          webhook_token?: string | null
        }
        Update: {
          access_token?: string
          calendar_id?: string
          created_at?: string
          google_email?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          professional_id?: string
          refresh_token?: string
          sync_token?: string | null
          token_expires_at?: string
          updated_at?: string
          webhook_channel_id?: string | null
          webhook_expires_at?: string | null
          webhook_resource_id?: string | null
          webhook_token?: string | null
        }
        Relationships: []
      }
      professional_weekly_availability: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          professional_id: string
          time_slots: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          professional_id: string
          time_slots?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          professional_id?: string
          time_slots?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_weekly_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          approval_status: string | null
          bio: string | null
          created_at: string
          crp: string | null
          crp_document_back_url: string | null
          crp_document_front_url: string | null
          degree: string | null
          degree_document_back_url: string | null
          degree_document_front_url: string | null
          document_number: string | null
          document_type: string | null
          experience_years: number | null
          google_calendar_url: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          location: string | null
          pix_key: string | null
          pix_key_type: string | null
          rejection_reason: string | null
          socio_consciente: boolean
          specialties: string[] | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          subscription_expires_at: string | null
          subscription_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string | null
          bio?: string | null
          created_at?: string
          crp?: string | null
          crp_document_back_url?: string | null
          crp_document_front_url?: string | null
          degree?: string | null
          degree_document_back_url?: string | null
          degree_document_front_url?: string | null
          document_number?: string | null
          document_type?: string | null
          experience_years?: number | null
          google_calendar_url?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          rejection_reason?: string | null
          socio_consciente?: boolean
          specialties?: string[] | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          subscription_expires_at?: string | null
          subscription_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string | null
          bio?: string | null
          created_at?: string
          crp?: string | null
          crp_document_back_url?: string | null
          crp_document_front_url?: string | null
          degree?: string | null
          degree_document_back_url?: string | null
          degree_document_front_url?: string | null
          document_number?: string | null
          document_type?: string | null
          experience_years?: number | null
          google_calendar_url?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          rejection_reason?: string | null
          socio_consciente?: boolean
          specialties?: string[] | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          subscription_expires_at?: string | null
          subscription_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string
          favorite_club_id: string | null
          full_name: string | null
          gender: string | null
          id: string
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          favorite_club_id?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          favorite_club_id?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          onesignal_player_id: string | null
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          onesignal_player_id?: string | null
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          onesignal_player_id?: string | null
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      receipt_templates: {
        Row: {
          created_at: string
          crp: string
          document_number: string
          document_type: string
          full_name: string
          id: string
          professional_id: string
          service_description: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          crp: string
          document_number: string
          document_type?: string
          full_name: string
          id?: string
          professional_id: string
          service_description?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          crp?: string
          document_number?: string
          document_type?: string
          full_name?: string
          id?: string
          professional_id?: string
          service_description?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_templates_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_library: {
        Row: {
          category: string | null
          created_at: string
          id: string
          link: string | null
          notes: string | null
          professional_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          link?: string | null
          notes?: string | null
          professional_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          link?: string | null
          notes?: string | null
          professional_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_library_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      session_receipts: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          professional_id: string
          receipt_data: Json
          receipt_html: string
          receipt_number: number
          user_id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          professional_id: string
          receipt_data?: Json
          receipt_html: string
          receipt_number?: number
          user_id: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          professional_id?: string
          receipt_data?: Json
          receipt_html?: string
          receipt_number?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_receipts_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_receipts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          discount: number | null
          features: Json
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          order_index: number
          original_price: number | null
          period: string
          plan_id: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount?: number | null
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          order_index?: number
          original_price?: number | null
          period: string
          plan_id: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount?: number | null
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          order_index?: number
          original_price?: number | null
          period?: string
          plan_id?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscription_settings: {
        Row: {
          created_at: string
          free_period_banner_enabled: boolean
          free_period_banner_text: string
          id: string
          onboarding_subscription_subtitle: string
          onboarding_subscription_text: string
          reactivation_warning_enabled: boolean
          reactivation_warning_text: string
          subscriptions_enabled: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          free_period_banner_enabled?: boolean
          free_period_banner_text?: string
          id?: string
          onboarding_subscription_subtitle?: string
          onboarding_subscription_text?: string
          reactivation_warning_enabled?: boolean
          reactivation_warning_text?: string
          subscriptions_enabled?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          free_period_banner_enabled?: boolean
          free_period_banner_text?: string
          id?: string
          onboarding_subscription_subtitle?: string
          onboarding_subscription_text?: string
          reactivation_warning_enabled?: boolean
          reactivation_warning_text?: string
          subscriptions_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      therapeutic_plans: {
        Row: {
          created_at: string
          general_objectives: string | null
          id: string
          patient_code: string
          professional_id: string
          strategies: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          general_objectives?: string | null
          id?: string
          patient_code: string
          professional_id: string
          strategies?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          general_objectives?: string | null
          id?: string
          patient_code?: string
          professional_id?: string
          strategies?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapeutic_plans_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      upcoming_matches: {
        Row: {
          club_id: string
          competition: string | null
          created_at: string
          id: string
          is_home: boolean | null
          match_date: string
          match_time: string | null
          opponent: string
        }
        Insert: {
          club_id: string
          competition?: string | null
          created_at?: string
          id?: string
          is_home?: boolean | null
          match_date: string
          match_time?: string | null
          opponent: string
        }
        Update: {
          club_id?: string
          competition?: string | null
          created_at?: string
          id?: string
          is_home?: boolean | null
          match_date?: string
          match_time?: string | null
          opponent?: string
        }
        Relationships: []
      }
      user_activity_completion: {
        Row: {
          activity_id: string
          completed_at: string
          id: string
          response: Json | null
          user_id: string
        }
        Insert: {
          activity_id: string
          completed_at?: string
          id?: string
          response?: Json | null
          user_id: string
        }
        Update: {
          activity_id?: string
          completed_at?: string
          id?: string
          response?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_completion_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "lesson_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_access: {
        Row: {
          access_type: string
          course_id: string
          created_at: string
          expires_at: string | null
          id: string
          mercadopago_payment_id: string | null
          payment_method: string | null
          user_id: string
        }
        Insert: {
          access_type?: string
          course_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          payment_method?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          course_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          payment_method?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_access_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          last_position: number | null
          lesson_id: string
          progress_percent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          last_position?: number | null
          lesson_id: string
          progress_percent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          last_position?: number | null
          lesson_id?: string
          progress_percent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memberships: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          mercadopago_payment_id: string | null
          payment_method: string | null
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          mercadopago_payment_id?: string | null
          payment_method?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          mercadopago_payment_id?: string | null
          payment_method?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      professionals_public: {
        Row: {
          approval_status: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          crp: string | null
          degree: string | null
          experience_years: number | null
          favorite_club_id: string | null
          full_name: string | null
          google_calendar_url: string | null
          hourly_rate: number | null
          id: string | null
          is_active: boolean | null
          is_verified: boolean | null
          location: string | null
          socio_consciente: boolean | null
          specialties: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_public_professionals: {
        Args: never
        Returns: {
          approval_status: string
          avatar_url: string
          bio: string
          created_at: string
          crp: string
          degree: string
          experience_years: number
          favorite_club_id: string
          full_name: string
          google_calendar_url: string
          hourly_rate: number
          id: string
          is_active: boolean
          is_verified: boolean
          location: string
          socio_consciente: boolean
          specialties: string[]
          updated_at: string
          user_id: string
        }[]
      }
      get_ranking_counts: {
        Args: never
        Returns: {
          club_id: string
          session_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      verify_receipt_by_number: {
        Args: { p_receipt_number: number }
        Returns: {
          created_at: string
          professional_crp: string
          professional_name: string
          receipt_number: number
          service_description: string
        }[]
      }
    }
    Enums: {
      app_role: "user" | "professional" | "developer" | "admin" | "marketing"
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
      app_role: ["user", "professional", "developer", "admin", "marketing"],
    },
  },
} as const
