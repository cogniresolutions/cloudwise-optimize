export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          ip_whitelist: string[] | null
          is_active: boolean | null
          key_hash: string
          last_used_at: string | null
          name: string | null
          persona_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_whitelist?: string[] | null
          is_active?: boolean | null
          key_hash: string
          last_used_at?: string | null
          name?: string | null
          persona_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_whitelist?: string[] | null
          is_active?: boolean | null
          key_hash?: string
          last_used_at?: string | null
          name?: string | null
          persona_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_monitoring: {
        Row: {
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          response_time: number | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          response_time?: number | null
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          response_time?: number | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_monitoring_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automated_actions: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          last_run_at: string | null
          next_run_at: string | null
          resource_id: string | null
          schedule: Json | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          resource_id?: string | null
          schedule?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          resource_id?: string | null
          schedule?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automated_actions_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "cloud_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automated_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      azure_resource_counts: {
        Row: {
          cost: number | null
          count: number
          id: string
          last_updated_at: string | null
          resource_type: string
          usage_percentage: number | null
          user_id: string | null
        }
        Insert: {
          cost?: number | null
          count: number
          id?: string
          last_updated_at?: string | null
          resource_type: string
          usage_percentage?: number | null
          user_id?: string | null
        }
        Update: {
          cost?: number | null
          count?: number
          id?: string
          last_updated_at?: string | null
          resource_type?: string
          usage_percentage?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "azure_resource_counts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cached_music_recommendations: {
        Row: {
          created_at: string
          id: string
          is_stale: boolean
          location_name: string | null
          mood: string
          recommendations: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_stale?: boolean
          location_name?: string | null
          mood: string
          recommendations?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_stale?: boolean
          location_name?: string | null
          mood?: string
          recommendations?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calming_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          difficulty_level: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          title: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title?: string
        }
        Relationships: []
      }
      calming_sessions: {
        Row: {
          activity_id: string | null
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          effectiveness_rating: number | null
          final_mood: string | null
          id: string
          initial_mood: string | null
          notes: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          effectiveness_rating?: number | null
          final_mood?: string | null
          id?: string
          initial_mood?: string | null
          notes?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string | null
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          effectiveness_rating?: number | null
          final_mood?: string | null
          id?: string
          initial_mood?: string | null
          notes?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calming_sessions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "calming_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_cost_overview: {
        Row: {
          aws_cost: number | null
          azure_cost: number | null
          created_at: string
          date: string
          gcp_cost: number | null
          id: string
          user_id: string | null
        }
        Insert: {
          aws_cost?: number | null
          azure_cost?: number | null
          created_at?: string
          date: string
          gcp_cost?: number | null
          id?: string
          user_id?: string | null
        }
        Update: {
          aws_cost?: number | null
          azure_cost?: number | null
          created_at?: string
          date?: string
          gcp_cost?: number | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cloud_cost_overview_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_provider_connections: {
        Row: {
          created_at: string
          credentials: Json
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credentials: Json
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credentials?: Json
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_provider_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_resources: {
        Row: {
          cost_data: Json | null
          id: string
          last_updated_at: string
          name: string
          provider: string
          region: string | null
          resource_id: string
          resource_type: string
          tags: Json | null
          usage_data: Json | null
          user_id: string
        }
        Insert: {
          cost_data?: Json | null
          id?: string
          last_updated_at?: string
          name: string
          provider: string
          region?: string | null
          resource_id: string
          resource_type: string
          tags?: Json | null
          usage_data?: Json | null
          user_id: string
        }
        Update: {
          cost_data?: Json | null
          id?: string
          last_updated_at?: string
          name?: string
          provider?: string
          region?: string | null
          resource_id?: string
          resource_type?: string
          tags?: Json | null
          usage_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cloud_resources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          session_type: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          session_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          session_type?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          context: string | null
          created_at: string
          id: string
          persona_id: string | null
          status: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          persona_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          persona_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_recommendations: {
        Row: {
          ai_analysis: Json | null
          created_at: string
          description: string
          id: string
          potential_savings: number | null
          priority: string | null
          provider: string
          resource_ids: Json | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string
          description: string
          id?: string
          potential_savings?: number | null
          priority?: string | null
          provider: string
          resource_ids?: Json | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string
          description?: string
          id?: string
          potential_savings?: number | null
          priority?: string | null
          provider?: string
          resource_ids?: Json | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      docs_content: {
        Row: {
          content: string
          doc_type: string
          file_path: string
          id: string
          last_modified: string | null
          title: string
          version_id: string | null
        }
        Insert: {
          content: string
          doc_type: string
          file_path: string
          id?: string
          last_modified?: string | null
          title: string
          version_id?: string | null
        }
        Update: {
          content?: string
          doc_type?: string
          file_path?: string
          id?: string
          last_modified?: string | null
          title?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "docs_content_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "docs_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      docs_versions: {
        Row: {
          author: string
          branch_name: string
          commit_hash: string
          id: string
          version_date: string | null
        }
        Insert: {
          author: string
          branch_name: string
          commit_hash: string
          id?: string
          version_date?: string | null
        }
        Update: {
          author?: string
          branch_name?: string
          commit_hash?: string
          id?: string
          version_date?: string | null
        }
        Relationships: []
      }
      emotion_analysis: {
        Row: {
          analysis_timestamp: string | null
          background_objects: Json | null
          created_at: string
          emotion_data: Json | null
          environment_context: Json | null
          environment_data: Json | null
          id: string
          persona_id: string | null
          scene_description: string | null
          user_id: string | null
        }
        Insert: {
          analysis_timestamp?: string | null
          background_objects?: Json | null
          created_at?: string
          emotion_data?: Json | null
          environment_context?: Json | null
          environment_data?: Json | null
          id?: string
          persona_id?: string | null
          scene_description?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_timestamp?: string | null
          background_objects?: Json | null
          created_at?: string
          emotion_data?: Json | null
          environment_context?: Json | null
          environment_data?: Json | null
          id?: string
          persona_id?: string | null
          scene_description?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emotion_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_activities: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          duration_seconds: number
          id: string
          intensity_level: Database["public"]["Enums"]["intensity_level"]
          metadata: Json | null
          title: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_seconds: number
          id: string
          intensity_level: Database["public"]["Enums"]["intensity_level"]
          metadata?: Json | null
          title: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          intensity_level?: Database["public"]["Enums"]["intensity_level"]
          metadata?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "energy_activities_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "energy_activity_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_activity_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      energy_activity_feedback: {
        Row: {
          activity_id: string | null
          created_at: string
          effectiveness_rating: number | null
          id: string
          mood_after: string | null
          mood_before: string | null
          user_id: string | null
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          effectiveness_rating?: number | null
          id?: string
          mood_after?: string | null
          mood_before?: string | null
          user_id?: string | null
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          effectiveness_rating?: number | null
          id?: string
          mood_after?: string | null
          mood_before?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "energy_activity_feedback_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "energy_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      energy_quotes: {
        Row: {
          category_id: string | null
          created_at: string | null
          effectiveness_rating: number | null
          id: string
          mood_after: string | null
          mood_before: string | null
          quote: string
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          effectiveness_rating?: number | null
          id?: string
          mood_after?: string | null
          mood_before?: string | null
          quote: string
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          effectiveness_rating?: number | null
          id?: string
          mood_after?: string | null
          mood_before?: string | null
          quote?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "energy_quotes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "energy_activity_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      facial_expressions: {
        Row: {
          animation_data: Json | null
          created_at: string
          emotion: string
          id: string
          intensity: number | null
          persona_id: string | null
        }
        Insert: {
          animation_data?: Json | null
          created_at?: string
          emotion: string
          id?: string
          intensity?: number | null
          persona_id?: string | null
        }
        Update: {
          animation_data?: Json | null
          created_at?: string
          emotion?: string
          id?: string
          intensity?: number | null
          persona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facial_expressions_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      historical_cost_data: {
        Row: {
          cost_date: string
          created_at: string
          id: string
          potential_savings: number
          provider: string
          resource_breakdown: Json | null
          total_cost: number
          user_id: string | null
        }
        Insert: {
          cost_date: string
          created_at?: string
          id?: string
          potential_savings?: number
          provider: string
          resource_breakdown?: Json | null
          total_cost?: number
          user_id?: string | null
        }
        Update: {
          cost_date?: string
          created_at?: string
          id?: string
          potential_savings?: number
          provider?: string
          resource_breakdown?: Json | null
          total_cost?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historical_cost_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_challenge_activities: {
        Row: {
          ai_recommendations: Json | null
          category: string
          created_at: string | null
          description: string | null
          difficulty_level: string
          game_data: Json | null
          game_type: string
          id: string
          image_url: string | null
          is_active: boolean | null
          metadata: Json | null
          title: string
          video_url: string
        }
        Insert: {
          ai_recommendations?: Json | null
          category: string
          created_at?: string | null
          description?: string | null
          difficulty_level: string
          game_data?: Json | null
          game_type?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          title: string
          video_url: string
        }
        Update: {
          ai_recommendations?: Json | null
          category?: string
          created_at?: string | null
          description?: string | null
          difficulty_level?: string
          game_data?: Json | null
          game_type?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          title?: string
          video_url?: string
        }
        Relationships: []
      }
      message_history: {
        Row: {
          content: string
          created_at: string
          id: string
          persona_id: string | null
          role: string
          sentiment: Json | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          persona_id?: string | null
          role: string
          sentiment?: Json | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          persona_id?: string | null
          role?: string
          sentiment?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_history_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_aggregations: {
        Row: {
          average_mood: number | null
          created_at: string
          dominant_mood: string | null
          id: string
          location_name: string
          location_type: string
          total_entries: number | null
          updated_at: string
        }
        Insert: {
          average_mood?: number | null
          created_at?: string
          dominant_mood?: string | null
          id?: string
          location_name: string
          location_type: string
          total_entries?: number | null
          updated_at?: string
        }
        Update: {
          average_mood?: number | null
          created_at?: string
          dominant_mood?: string | null
          id?: string
          location_name?: string
          location_type?: string
          total_entries?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      mood_challenges: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          location_name: string | null
          location_type: string | null
          participants_count: number | null
          start_date: string
          target_mood: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          location_name?: string | null
          location_type?: string | null
          participants_count?: number | null
          start_date: string
          target_mood: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          location_name?: string | null
          location_type?: string | null
          participants_count?: number | null
          start_date?: string
          target_mood?: string
          title?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          confidence: number
          created_at: string
          deleted_at: string | null
          id: string
          mood: string
          notes: string | null
          source: string
          user_id: string
        }
        Insert: {
          confidence: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          mood: string
          notes?: string | null
          source: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          mood?: string
          notes?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_locations: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          location_grid_id: string | null
          longitude: number | null
          mood_entry_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          location_grid_id?: string | null
          longitude?: number | null
          mood_entry_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          location_grid_id?: string | null
          longitude?: number | null
          mood_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_locations_mood_entry_id_fkey"
            columns: ["mood_entry_id"]
            isOneToOne: false
            referencedRelation: "mood_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_recommendations: {
        Row: {
          created_at: string
          id: string
          mood_pattern: string
          recommendation: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood_pattern: string
          recommendation: string
        }
        Update: {
          created_at?: string
          id?: string
          mood_pattern?: string
          recommendation?: string
        }
        Relationships: []
      }
      music_preferences: {
        Row: {
          created_at: string
          favorite_genres: string[]
          id: string
          language_preference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite_genres?: string[]
          id?: string
          language_preference?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorite_genres?: string[]
          id?: string
          language_preference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      music_recommendations: {
        Row: {
          artist: string | null
          confidence: number | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          mood: string
          platform: Database["public"]["Enums"]["music_platform"]
          title: string
          url: string
          user_id: string
        }
        Insert: {
          artist?: string | null
          confidence?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          mood?: string
          platform: Database["public"]["Enums"]["music_platform"]
          title: string
          url: string
          user_id: string
        }
        Update: {
          artist?: string | null
          confidence?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          mood?: string
          platform?: Database["public"]["Enums"]["music_platform"]
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      music_sources: {
        Row: {
          age_range: unknown | null
          artist: string | null
          created_at: string
          description: string | null
          id: string
          language: string
          mood_tags: string[]
          platform: string
          title: string
          url: string
        }
        Insert: {
          age_range?: unknown | null
          artist?: string | null
          created_at?: string
          description?: string | null
          id?: string
          language: string
          mood_tags: string[]
          platform: string
          title: string
          url: string
        }
        Update: {
          age_range?: unknown | null
          artist?: string | null
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          mood_tags?: string[]
          platform?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      persona_training_materials: {
        Row: {
          analysis_results: Json | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          replica_id: string | null
          status: string | null
          uploaded_at: string
          user_id: string | null
        }
        Insert: {
          analysis_results?: Json | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          replica_id?: string | null
          status?: string | null
          uploaded_at?: string
          user_id?: string | null
        }
        Update: {
          analysis_results?: Json | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          replica_id?: string | null
          status?: string | null
          uploaded_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "persona_training_materials_replica_id_fkey"
            columns: ["replica_id"]
            isOneToOne: false
            referencedRelation: "replicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persona_training_materials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          model_config: Json | null
          name: string
          personality: string | null
          processing_status: string | null
          skills: string[] | null
          status: string | null
          topics: string[] | null
          updated_at: string
          user_id: string | null
          voice_config: Json | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          model_config?: Json | null
          name: string
          personality?: string | null
          processing_status?: string | null
          skills?: string[] | null
          status?: string | null
          topics?: string[] | null
          updated_at?: string
          user_id?: string | null
          voice_config?: Json | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          model_config?: Json | null
          name?: string
          personality?: string | null
          processing_status?: string | null
          skills?: string[] | null
          status?: string | null
          topics?: string[] | null
          updated_at?: string
          user_id?: string | null
          voice_config?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string | null
          age: number | null
          avatar_url: string | null
          birth_date: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          device_language: string | null
          email: string | null
          email_confirmed: boolean | null
          email_verified: boolean | null
          favorite_genres: string[] | null
          full_name: string | null
          id: string
          last_login: string | null
          music_language_preference: string | null
          preferred_language: string | null
          preferred_languages: string[] | null
          profile_completed: boolean | null
          updated_at: string
          username: string | null
        }
        Insert: {
          account_status?: string | null
          age?: number | null
          avatar_url?: string | null
          birth_date?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          device_language?: string | null
          email?: string | null
          email_confirmed?: boolean | null
          email_verified?: boolean | null
          favorite_genres?: string[] | null
          full_name?: string | null
          id: string
          last_login?: string | null
          music_language_preference?: string | null
          preferred_language?: string | null
          preferred_languages?: string[] | null
          profile_completed?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          account_status?: string | null
          age?: number | null
          avatar_url?: string | null
          birth_date?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          device_language?: string | null
          email?: string | null
          email_confirmed?: boolean | null
          email_verified?: boolean | null
          favorite_genres?: string[] | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          music_language_preference?: string | null
          preferred_language?: string | null
          preferred_languages?: string[] | null
          profile_completed?: boolean | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          age_range: unknown | null
          created_at: string
          description: string | null
          id: string
          language: string
          mood_tags: string[] | null
          title: string
          type: string
        }
        Insert: {
          age_range?: unknown | null
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          mood_tags?: string[] | null
          title: string
          type: string
        }
        Update: {
          age_range?: unknown | null
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          mood_tags?: string[] | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      replicas: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_schedules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          resource_id: string | null
          schedule_config: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          resource_id?: string | null
          schedule_config: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          resource_id?: string | null
          schedule_config?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_schedules_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "cloud_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          plan_type: string
          start_date: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          plan_type: string
          start_date: string
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          plan_type?: string
          start_date?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tavus_sessions: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_active: boolean | null
          last_checked_at: string
          participants: Json | null
          session_type: string | null
          status: string
          updated_at: string
          user_id: string | null
          video_call_id: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_checked_at?: string
          participants?: Json | null
          session_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          video_call_id?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_checked_at?: string
          participants?: Json | null
          session_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          video_call_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tavus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          transcript: string | null
          updated_at: string
          user_id: string | null
          video_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          transcript?: string | null
          updated_at?: string
          user_id?: string | null
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          transcript?: string | null
          updated_at?: string
          user_id?: string | null
          video_url?: string
        }
        Relationships: []
      }
      training_videos: {
        Row: {
          analysis_feedback: Json | null
          analysis_status: string | null
          consent_url: string | null
          consent_verified: boolean | null
          created_at: string
          duration: number | null
          id: string
          processing_status: string | null
          replica_id: string | null
          status: string | null
          transcription_text: string | null
          user_id: string | null
          video_analysis_results: Json | null
          video_indexer_id: string | null
          video_url: string
        }
        Insert: {
          analysis_feedback?: Json | null
          analysis_status?: string | null
          consent_url?: string | null
          consent_verified?: boolean | null
          created_at?: string
          duration?: number | null
          id?: string
          processing_status?: string | null
          replica_id?: string | null
          status?: string | null
          transcription_text?: string | null
          user_id?: string | null
          video_analysis_results?: Json | null
          video_indexer_id?: string | null
          video_url: string
        }
        Update: {
          analysis_feedback?: Json | null
          analysis_status?: string | null
          consent_url?: string | null
          consent_verified?: boolean | null
          created_at?: string
          duration?: number | null
          id?: string
          processing_status?: string | null
          replica_id?: string | null
          status?: string | null
          transcription_text?: string | null
          user_id?: string | null
          video_analysis_results?: Json | null
          video_indexer_id?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_videos_replica_id_fkey"
            columns: ["replica_id"]
            isOneToOne: false
            referencedRelation: "replicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achieved_at: string
          achievement_name: string
          achievement_type: string
          id: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          achievement_name: string
          achievement_type: string
          id?: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          achievement_name?: string
          achievement_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_music_preferences: {
        Row: {
          created_at: string
          genres: string[]
          id: string
          mood: string
          preferred_platforms: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          genres?: string[]
          id?: string
          mood: string
          preferred_platforms?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          genres?: string[]
          id?: string
          mood?: string
          preferred_platforms?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_screenshots: {
        Row: {
          analysis_data: Json | null
          created_at: string
          file_path: string
          id: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string
          file_path: string
          id?: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string
          file_path?: string
          id?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_screenshots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tavus_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      validated_music_recommendations: {
        Row: {
          artist: string | null
          created_at: string | null
          id: string
          is_validated: boolean | null
          language: string | null
          last_validated_at: string | null
          mood: string
          platform: Database["public"]["Enums"]["music_platform"]
          region_code: string
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          artist?: string | null
          created_at?: string | null
          id?: string
          is_validated?: boolean | null
          language?: string | null
          last_validated_at?: string | null
          mood: string
          platform: Database["public"]["Enums"]["music_platform"]
          region_code: string
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          artist?: string | null
          created_at?: string | null
          id?: string
          is_validated?: boolean | null
          language?: string | null
          last_validated_at?: string | null
          mood?: string
          platform?: Database["public"]["Enums"]["music_platform"]
          region_code?: string
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      video_indexer_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          operation: string | null
          request_details: Json | null
          response_details: Json | null
          status: string | null
          video_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation?: string | null
          request_details?: Json | null
          response_details?: Json | null
          status?: string | null
          video_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation?: string | null
          request_details?: Json | null
          response_details?: Json | null
          status?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_indexer_logs_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "training_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_processing_segments: {
        Row: {
          created_at: string
          expression_data: Json | null
          id: string
          processing_error: string | null
          processing_logs: Json | null
          processing_progress: number | null
          segment_end: number
          segment_start: number
          status: string | null
          training_video_id: string
          updated_at: string
          voice_data: Json | null
        }
        Insert: {
          created_at?: string
          expression_data?: Json | null
          id?: string
          processing_error?: string | null
          processing_logs?: Json | null
          processing_progress?: number | null
          segment_end: number
          segment_start: number
          status?: string | null
          training_video_id: string
          updated_at?: string
          voice_data?: Json | null
        }
        Update: {
          created_at?: string
          expression_data?: Json | null
          id?: string
          processing_error?: string | null
          processing_logs?: Json | null
          processing_progress?: number | null
          segment_end?: number
          segment_start?: number
          status?: string | null
          training_video_id?: string
          updated_at?: string
          voice_data?: Json | null
        }
        Relationships: []
      }
      video_templates: {
        Row: {
          background_url: string | null
          created_at: string
          description: string | null
          effects_config: Json | null
          id: string
          is_public: boolean | null
          name: string
          preview_url: string | null
          processing_settings: Json | null
          template_type: string | null
          updated_at: string
          usage_count: number | null
          user_id: string | null
          variables: Json | null
        }
        Insert: {
          background_url?: string | null
          created_at?: string
          description?: string | null
          effects_config?: Json | null
          id?: string
          is_public?: boolean | null
          name: string
          preview_url?: string | null
          processing_settings?: Json | null
          template_type?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string | null
          variables?: Json | null
        }
        Update: {
          background_url?: string | null
          created_at?: string
          description?: string | null
          effects_config?: Json | null
          id?: string
          is_public?: boolean | null
          name?: string
          preview_url?: string | null
          processing_settings?: Json | null
          template_type?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "video_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_cloning_configs: {
        Row: {
          created_at: string
          id: string
          model_settings: Json | null
          model_type: string
          persona_id: string | null
          training_progress: number | null
          training_status: string | null
          updated_at: string
          user_id: string | null
          voice_samples: Json | null
          voice_settings: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          model_settings?: Json | null
          model_type: string
          persona_id?: string | null
          training_progress?: number | null
          training_status?: string | null
          updated_at?: string
          user_id?: string | null
          voice_samples?: Json | null
          voice_settings?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          model_settings?: Json | null
          model_type?: string
          persona_id?: string | null
          training_progress?: number | null
          training_status?: string | null
          updated_at?: string
          user_id?: string | null
          voice_samples?: Json | null
          voice_settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_cloning_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_mappings: {
        Row: {
          azure_voice_name: string
          created_at: string
          display_name: string
          gender: string
          id: string
          language_code: string
          voice_style: string
        }
        Insert: {
          azure_voice_name: string
          created_at?: string
          display_name: string
          gender: string
          id?: string
          language_code: string
          voice_style: string
        }
        Update: {
          azure_voice_name?: string
          created_at?: string
          display_name?: string
          gender?: string
          id?: string
          language_code?: string
          voice_style?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_music_validations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_screenshots: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_location_grid_id: {
        Args: {
          lat: number
          lon: number
        }
        Returns: string
      }
      mark_stale_recommendations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      cloud_provider: "aws" | "gcp" | "azure"
      intensity_level: "low" | "medium" | "high"
      music_platform: "Spotify" | "YouTube Music"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
