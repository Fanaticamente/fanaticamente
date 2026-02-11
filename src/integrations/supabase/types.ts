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
          crp: string
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
          crp: string
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
          crp?: string
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
          created_at: string
          favorite_club_id: string | null
          full_name: string | null
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
          created_at?: string
          favorite_club_id?: string | null
          full_name?: string | null
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
          created_at?: string
          favorite_club_id?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          user_id: string
        }
        Insert: {
          access_type?: string
          course_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          access_type?: string
          course_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
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
          bio: string | null
          created_at: string | null
          crp: string | null
          degree: string | null
          experience_years: number | null
          google_calendar_url: string | null
          hourly_rate: number | null
          id: string | null
          is_active: boolean | null
          is_verified: boolean | null
          location: string | null
          specialties: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_public_professionals: {
        Args: never
        Returns: {
          approval_status: string
          bio: string
          created_at: string
          crp: string
          degree: string
          experience_years: number
          google_calendar_url: string
          hourly_rate: number
          id: string
          is_active: boolean
          is_verified: boolean
          location: string
          specialties: string[]
          updated_at: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "professional" | "developer" | "admin"
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
      app_role: ["user", "professional", "developer", "admin"],
    },
  },
} as const
