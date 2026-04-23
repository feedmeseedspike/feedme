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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          label: string | null
          phone: string | null
          state: string | null
          street: string | null
          user_id: string | null
          zip: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          label?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          label?: string | null
          phone?: string | null
          state?: string | null
          street?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          image_url: string | null
          location: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          completion_tokens: number
          created_at: string
          error_message: string | null
          estimated_cost: number
          feature_type: string
          has_image: boolean
          id: string
          model_used: string
          prompt_tokens: number
          request_duration_ms: number
          response_length: number
          session_id: string
          success: boolean
          total_tokens: number
          user_id: string | null
          user_message_length: number
        }
        Insert: {
          completion_tokens?: number
          created_at?: string
          error_message?: string | null
          estimated_cost?: number
          feature_type: string
          has_image?: boolean
          id?: string
          model_used: string
          prompt_tokens?: number
          request_duration_ms?: number
          response_length?: number
          session_id: string
          success?: boolean
          total_tokens?: number
          user_id?: string | null
          user_message_length?: number
        }
        Update: {
          completion_tokens?: number
          created_at?: string
          error_message?: string | null
          estimated_cost?: number
          feature_type?: string
          has_image?: boolean
          id?: string
          model_used?: string
          prompt_tokens?: number
          request_duration_ms?: number
          response_length?: number
          session_id?: string
          success?: boolean
          total_tokens?: number
          user_id?: string | null
          user_message_length?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      banners: {
        Row: {
          active: boolean
          bundle_id: string | null
          created_at: string
          id: string
          image_url: string
          order: number | null
          tag: string | null
          type: string
        }
        Insert: {
          active?: boolean
          bundle_id?: string | null
          created_at?: string
          id?: string
          image_url: string
          order?: number | null
          tag?: string | null
          type: string
        }
        Update: {
          active?: boolean
          bundle_id?: string | null
          created_at?: string
          id?: string
          image_url?: string
          order?: number | null
          tag?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      black_friday_items: {
        Row: {
          available_slots: number | null
          badge_text: string | null
          created_at: string
          description: string | null
          end_at: string | null
          id: string
          image_url: string | null
          max_quantity_per_user: number | null
          new_price: number
          old_price: number | null
          product_id: string
          quantity_limit: number | null
          start_at: string | null
          status: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          available_slots?: number | null
          badge_text?: string | null
          created_at?: string
          description?: string | null
          end_at?: string | null
          id?: string
          image_url?: string | null
          max_quantity_per_user?: number | null
          new_price: number
          old_price?: number | null
          product_id: string
          quantity_limit?: number | null
          start_at?: string | null
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          available_slots?: number | null
          badge_text?: string | null
          created_at?: string
          description?: string | null
          end_at?: string | null
          id?: string
          image_url?: string | null
          max_quantity_per_user?: number | null
          new_price?: number
          old_price?: number | null
          product_id?: string
          quantity_limit?: number | null
          start_at?: string | null
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_likes: {
        Row: {
          created_at: string | null
          guest_id: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          guest_id?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          guest_id?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          tag_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          tag_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          cook_time: number | null
          created_at: string | null
          difficulty: string | null
          excerpt: string | null
          featured: boolean | null
          featured_image: string | null
          featured_image_alt: string | null
          id: string
          ingredients: Json | null
          instructions: Json | null
          likes_count: number | null
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          nutritional_info: Json | null
          prep_time: number | null
          published_at: string | null
          reading_time: number | null
          servings: number | null
          slug: string
          status: string | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content: string
          cook_time?: number | null
          created_at?: string | null
          difficulty?: string | null
          excerpt?: string | null
          featured?: boolean | null
          featured_image?: string | null
          featured_image_alt?: string | null
          id?: string
          ingredients?: Json | null
          instructions?: Json | null
          likes_count?: number | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          nutritional_info?: Json | null
          prep_time?: number | null
          published_at?: string | null
          reading_time?: number | null
          servings?: number | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          cook_time?: number | null
          created_at?: string | null
          difficulty?: string | null
          excerpt?: string | null
          featured?: boolean | null
          featured_image?: string | null
          featured_image_alt?: string | null
          id?: string
          ingredients?: Json | null
          instructions?: Json | null
          likes_count?: number | null
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          nutritional_info?: Json | null
          prep_time?: number | null
          published_at?: string | null
          reading_time?: number | null
          servings?: number | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_recipe_products: {
        Row: {
          created_at: string | null
          id: string
          ingredient_name: string
          optional: boolean | null
          post_id: string | null
          product_id: string | null
          quantity: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingredient_name: string
          optional?: boolean | null
          post_id?: string | null
          product_id?: string | null
          quantity?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ingredient_name?: string
          optional?: boolean | null
          post_id?: string | null
          product_id?: string | null
          quantity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_recipe_products_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      browsing_history: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "browsing_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_products: {
        Row: {
          bundle_id: string
          product_id: string
        }
        Insert: {
          bundle_id: string
          product_id: string
        }
        Update: {
          bundle_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_products_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by_admin_id: string | null
          avg_rating: number | null
          chef_name: string | null
          cook_time: number | null
          created_at: string | null
          description: string | null
          dietary_tags: string[] | null
          difficulty: string | null
          id: string
          name: string
          prep_time: number | null
          price: number | null
          published_status:
            | Database["public"]["Enums"]["bundle_published_status_enum"]
            | null
          rating_count: number | null
          servings: number | null
          social_image_url: string | null
          stock_status:
            | Database["public"]["Enums"]["bundle_stock_status_enum"]
            | null
          submitted_by_user_id: string | null
          thumbnail_url: string | null
          type: string | null
          updated_at: string | null
          video_id: string | null
          video_platform: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by_admin_id?: string | null
          avg_rating?: number | null
          chef_name?: string | null
          cook_time?: number | null
          created_at?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          difficulty?: string | null
          id?: string
          name: string
          prep_time?: number | null
          price?: number | null
          published_status?:
            | Database["public"]["Enums"]["bundle_published_status_enum"]
            | null
          rating_count?: number | null
          servings?: number | null
          social_image_url?: string | null
          stock_status?:
            | Database["public"]["Enums"]["bundle_stock_status_enum"]
            | null
          submitted_by_user_id?: string | null
          thumbnail_url?: string | null
          type?: string | null
          updated_at?: string | null
          video_id?: string | null
          video_platform?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by_admin_id?: string | null
          avg_rating?: number | null
          chef_name?: string | null
          cook_time?: number | null
          created_at?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          difficulty?: string | null
          id?: string
          name?: string
          prep_time?: number | null
          price?: number | null
          published_status?:
            | Database["public"]["Enums"]["bundle_published_status_enum"]
            | null
          rating_count?: number | null
          servings?: number | null
          social_image_url?: string | null
          stock_status?:
            | Database["public"]["Enums"]["bundle_stock_status_enum"]
            | null
          submitted_by_user_id?: string | null
          thumbnail_url?: string | null
          type?: string | null
          updated_at?: string | null
          video_id?: string | null
          video_platform?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bundles_approved_by_admin_id_fkey"
            columns: ["approved_by_admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundles_submitted_by_user_id_fkey"
            columns: ["submitted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cart: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          black_friday_item_id: string | null
          bundle_id: string | null
          cart_id: string | null
          created_at: string | null
          id: string
          offer_id: string | null
          option: Json | null
          price: number | null
          product_id: string | null
          quantity: number
        }
        Insert: {
          black_friday_item_id?: string | null
          bundle_id?: string | null
          cart_id?: string | null
          created_at?: string | null
          id?: string
          offer_id?: string | null
          option?: Json | null
          price?: number | null
          product_id?: string | null
          quantity?: number
        }
        Update: {
          black_friday_item_id?: string | null
          bundle_id?: string | null
          cart_id?: string | null
          created_at?: string | null
          id?: string
          offer_id?: string | null
          option?: Json | null
          price?: number | null
          product_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_black_friday_item_id_fkey"
            columns: ["black_friday_item_id"]
            isOneToOne: false
            referencedRelation: "black_friday_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "cart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_reminder_history: {
        Row: {
          cart_id: string
          created_at: string | null
          id: string
          reminder_number: number
          sent_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string | null
          id?: string
          reminder_number: number
          sent_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string | null
          id?: string
          reminder_number?: number
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_reminder_history_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "cart"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          banner_url: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          keynotes: string[] | null
          tags: string[] | null
          thumbnail: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          keynotes?: string[] | null
          tags?: string[] | null
          thumbnail?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          keynotes?: string[] | null
          tags?: string[] | null
          thumbnail?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cron_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          sent_count: number | null
          started_at: string
          status: string
          total_candidates: number | null
          trigger: string | null
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          sent_count?: number | null
          started_at?: string
          status: string
          total_candidates?: number | null
          trigger?: string | null
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          sent_count?: number | null
          started_at?: string
          status?: string
          total_candidates?: number | null
          trigger?: string | null
        }
        Relationships: []
      }
      customer_segments: {
        Row: {
          conditions: Json
          created_at: string | null
          description: string | null
          estimated_count: number | null
          id: number
          is_dynamic: boolean | null
          last_calculated: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          conditions: Json
          created_at?: string | null
          description?: string | null
          estimated_count?: number | null
          id?: number
          is_dynamic?: boolean | null
          last_calculated?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          conditions?: Json
          created_at?: string | null
          description?: string | null
          estimated_count?: number | null
          id?: number
          is_dynamic?: boolean | null
          last_calculated?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      delivery_locations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          created_at: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      email_tracking_events: {
        Row: {
          captured_at: string
          created_at: string
          email: string
          event_type: string
          id: string
          metadata: Json | null
          tracking_id: string
        }
        Insert: {
          captured_at?: string
          created_at?: string
          email: string
          event_type: string
          id?: string
          metadata?: Json | null
          tracking_id: string
        }
        Update: {
          captured_at?: string
          created_at?: string
          email?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          tracking_id?: string
        }
        Relationships: []
      }
      excel_price_snapshots: {
        Row: {
          captured_at: string
          category: string | null
          created_at: string
          id: string
          list_price: number
          product_name: string
          source_file: string | null
          unit: string | null
        }
        Insert: {
          captured_at: string
          category?: string | null
          created_at?: string
          id?: string
          list_price: number
          product_name: string
          source_file?: string | null
          unit?: string | null
        }
        Update: {
          captured_at?: string
          category?: string | null
          created_at?: string
          id?: string
          list_price?: number
          product_name?: string
          source_file?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      excel_product_names: {
        Row: {
          product_name: string
        }
        Insert: {
          product_name: string
        }
        Update: {
          product_name?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      fcm_tokens: {
        Row: {
          created_at: string | null
          device_type: string
          fcm_token: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_type: string
          fcm_token: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: string
          fcm_token?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      form: {
        Row: {
          created_at: string
          email: string | null
          id: number
          name: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          name?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applied_at: string
          cover_letter: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          job_id: string
          last_name: string
          phone: string | null
          resume_url: string
          status: string
          updated_at: string | null
        }
        Insert: {
          applied_at?: string
          cover_letter?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          job_id: string
          last_name: string
          phone?: string | null
          resume_url: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          applied_at?: string
          cover_letter?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          job_id?: string
          last_name?: string
          phone?: string | null
          resume_url?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          benefits: string[] | null
          closing_date: string | null
          created_at: string | null
          department: string
          department_id: string | null
          description: string
          experience_level: string
          id: string
          location: string
          posted_date: string
          requirements: string[] | null
          responsibilities: string[] | null
          salary_range: string | null
          status: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          benefits?: string[] | null
          closing_date?: string | null
          created_at?: string | null
          department: string
          department_id?: string | null
          description: string
          experience_level: string
          id?: string
          location: string
          posted_date?: string
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_range?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          benefits?: string[] | null
          closing_date?: string | null
          created_at?: string | null
          department?: string
          department_id?: string | null
          description?: string
          experience_level?: string
          id?: string
          location?: string
          posted_date?: string
          requirements?: string[] | null
          responsibilities?: string[] | null
          salary_range?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_jobs_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          dismissed: boolean
          expires_at: string | null
          id: number
          link: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          dismissed?: boolean
          expires_at?: string | null
          id?: never
          link?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dismissed?: boolean
          expires_at?: string | null
          id?: never
          link?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      offer_purchases: {
        Row: {
          created_at: string | null
          delivery_address: string | null
          email: string | null
          id: string
          offer_id: string | null
          payment_method: string | null
          phone: string | null
          purchase_date: string | null
          slots_purchased: number
          status: string | null
          total_amount: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_address?: string | null
          email?: string | null
          id?: string
          offer_id?: string | null
          payment_method?: string | null
          phone?: string | null
          purchase_date?: string | null
          slots_purchased: number
          status?: string | null
          total_amount: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_address?: string | null
          email?: string | null
          id?: string
          offer_id?: string | null
          payment_method?: string | null
          phone?: string | null
          purchase_date?: string | null
          slots_purchased?: number
          status?: string | null
          total_amount?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_purchases_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          available_slots: number
          category_id: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          price_per_slot: number
          start_date: string | null
          status: string | null
          title: string
          total_slots: number
          updated_at: string | null
          weight_per_slot: string | null
        }
        Insert: {
          available_slots: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          price_per_slot: number
          start_date?: string | null
          status?: string | null
          title: string
          total_slots: number
          updated_at?: string | null
          weight_per_slot?: string | null
        }
        Update: {
          available_slots?: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          price_per_slot?: number
          start_date?: string | null
          status?: string | null
          title?: string
          total_slots?: number
          updated_at?: string | null
          weight_per_slot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          bundle_id: string | null
          id: string
          offer_id: string | null
          option: Json | null
          order_id: string | null
          price: number | null
          product_id: string | null
          quantity: number
          vendor_id: string | null
        }
        Insert: {
          bundle_id?: string | null
          id?: string
          offer_id?: string | null
          option?: Json | null
          order_id?: string | null
          price?: number | null
          product_id?: string | null
          quantity?: number
          vendor_id?: string | null
        }
        Update: {
          bundle_id?: string | null
          id?: string
          offer_id?: string | null
          option?: Json | null
          order_id?: string | null
          price?: number | null
          product_id?: string | null
          quantity?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_bundle_id"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_viewed: boolean | null
          created_at: string | null
          delivery_fee: number | null
          id: string
          local_government: string | null
          note: string | null
          order_id: string | null
          payment_method: string | null
          payment_status:
            | Database["public"]["Enums"]["payment_status_enum"]
            | null
          reference: string | null
          shipping_address: Json | null
          status: Database["public"]["Enums"]["order_status_enum"] | null
          total_amount: number | null
          total_amount_paid: number | null
          updated_at: string | null
          user_id: string | null
          voucher_id: string | null
        }
        Insert: {
          admin_viewed?: boolean | null
          created_at?: string | null
          delivery_fee?: number | null
          id?: string
          local_government?: string | null
          note?: string | null
          order_id?: string | null
          payment_method?: string | null
          payment_status?:
            | Database["public"]["Enums"]["payment_status_enum"]
            | null
          reference?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status_enum"] | null
          total_amount?: number | null
          total_amount_paid?: number | null
          updated_at?: string | null
          user_id?: string | null
          voucher_id?: string | null
        }
        Update: {
          admin_viewed?: boolean | null
          created_at?: string | null
          delivery_fee?: number | null
          id?: string
          local_government?: string | null
          note?: string | null
          order_id?: string | null
          payment_method?: string | null
          payment_status?:
            | Database["public"]["Enums"]["payment_status_enum"]
            | null
          reference?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status_enum"] | null
          total_amount?: number | null
          total_amount_paid?: number | null
          updated_at?: string | null
          user_id?: string | null
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      price_change_events: {
        Row: {
          captured_at: string
          category: string | null
          change_amount: number | null
          change_ratio: number | null
          created_at: string
          id: string
          metadata: Json | null
          new_price: number
          old_price: number | null
          previous_snapshot_id: string | null
          product_name: string
          snapshot_id: string | null
          unit: string | null
        }
        Insert: {
          captured_at: string
          category?: string | null
          change_amount?: number | null
          change_ratio?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_price: number
          old_price?: number | null
          previous_snapshot_id?: string | null
          product_name: string
          snapshot_id?: string | null
          unit?: string | null
        }
        Update: {
          captured_at?: string
          category?: string | null
          change_amount?: number | null
          change_ratio?: number | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_price?: number
          old_price?: number | null
          previous_snapshot_id?: string | null
          product_name?: string
          snapshot_id?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_change_events_previous_snapshot_id_fkey"
            columns: ["previous_snapshot_id"]
            isOneToOne: false
            referencedRelation: "excel_price_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_change_events_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "excel_price_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      price_update_subscriptions: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          segments: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          segments?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          segments?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      product_relations: {
        Row: {
          created_at: string
          id: string
          relation_type: string | null
          source_product_id: string | null
          target_product_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          relation_type?: string | null
          source_product_id?: string | null
          target_product_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          relation_type?: string | null
          source_product_id?: string | null
          target_product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_relations_target_product_id_fkey"
            columns: ["target_product_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          image_urls: string[] | null
          is_verified_purchase: boolean | null
          product_id: string | null
          rating: number | null
          reports: Json | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          image_urls?: string[] | null
          is_verified_purchase?: boolean | null
          product_id?: string | null
          rating?: number | null
          reports?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          image_urls?: string[] | null
          is_verified_purchase?: boolean | null
          product_id?: string | null
          rating?: number | null
          reports?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      products: {
        Row: {
          avg_rating: number
          brand: string | null
          category_ids: string[] | null
          count_in_stock: number | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          in_season: boolean | null
          is_published: boolean | null
          list_price: number | null
          meta_description: string | null
          name: string
          num_reviews: number | null
          num_sales: number | null
          options: Json | null
          price: number | null
          rating_distribution: Json
          slug: string
          stock_status: string | null
          tags: string[] | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          avg_rating?: number
          brand?: string | null
          category_ids?: string[] | null
          count_in_stock?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          in_season?: boolean | null
          is_published?: boolean | null
          list_price?: number | null
          meta_description?: string | null
          name: string
          num_reviews?: number | null
          num_sales?: number | null
          options?: Json | null
          price?: number | null
          rating_distribution?: Json
          slug: string
          stock_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          avg_rating?: number
          brand?: string | null
          category_ids?: string[] | null
          count_in_stock?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          in_season?: boolean | null
          is_published?: boolean | null
          list_price?: number | null
          meta_description?: string | null
          name?: string
          num_reviews?: number | null
          num_sales?: number | null
          options?: Json | null
          price?: number | null
          rating_distribution?: Json
          slug?: string
          stock_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_duplicate_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_duplicate_vendor_id_fkey1"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      products_backup: {
        Row: {
          avg_rating: number
          brand: string | null
          category_ids: string[] | null
          count_in_stock: number | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          in_season: boolean | null
          is_published: boolean | null
          list_price: number | null
          name: string
          num_reviews: number | null
          num_sales: number | null
          options: Json | null
          price: number | null
          rating_distribution: Json
          slug: string
          stock_status: string | null
          tags: string[] | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          avg_rating?: number
          brand?: string | null
          category_ids?: string[] | null
          count_in_stock?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          in_season?: boolean | null
          is_published?: boolean | null
          list_price?: number | null
          name: string
          num_reviews?: number | null
          num_sales?: number | null
          options?: Json | null
          price?: number | null
          rating_distribution?: Json
          slug: string
          stock_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          avg_rating?: number
          brand?: string | null
          category_ids?: string[] | null
          count_in_stock?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          in_season?: boolean | null
          is_published?: boolean | null
          list_price?: number | null
          name?: string
          num_reviews?: number | null
          num_sales?: number | null
          options?: Json | null
          price?: number | null
          rating_distribution?: Json
          slug?: string
          stock_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_backup_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_backup_vendor_id_fkey1"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      products_duplicate_backup: {
        Row: {
          avg_rating: number
          brand: string | null
          category_ids: string[] | null
          count_in_stock: number | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          in_season: boolean | null
          is_published: boolean | null
          list_price: number | null
          name: string
          num_reviews: number | null
          num_sales: number | null
          options: Json | null
          price: number | null
          rating_distribution: Json
          slug: string
          stock_status: string | null
          tags: string[] | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          avg_rating?: number
          brand?: string | null
          category_ids?: string[] | null
          count_in_stock?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          in_season?: boolean | null
          is_published?: boolean | null
          list_price?: number | null
          name: string
          num_reviews?: number | null
          num_sales?: number | null
          options?: Json | null
          price?: number | null
          rating_distribution?: Json
          slug: string
          stock_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          avg_rating?: number
          brand?: string | null
          category_ids?: string[] | null
          count_in_stock?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          in_season?: boolean | null
          is_published?: boolean | null
          list_price?: number | null
          name?: string
          num_reviews?: number | null
          num_sales?: number | null
          options?: Json | null
          price?: number | null
          rating_distribution?: Json
          slug?: string
          stock_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_duplicate_backup_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_duplicate_backup_vendor_id_fkey1"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      producttest: {
        Row: {
          avg_rating: number
          brand: string | null
          category_ids: string[] | null
          count_in_stock: number | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          in_season: boolean | null
          is_published: boolean | null
          list_price: number | null
          name: string
          num_reviews: number | null
          num_sales: number | null
          options: Json | null
          price: number | null
          rating_distribution: Json
          slug: string
          stock_status: string | null
          tags: string[] | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          avg_rating?: number
          brand?: string | null
          category_ids?: string[] | null
          count_in_stock?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          in_season?: boolean | null
          is_published?: boolean | null
          list_price?: number | null
          name: string
          num_reviews?: number | null
          num_sales?: number | null
          options?: Json | null
          price?: number | null
          rating_distribution?: Json
          slug: string
          stock_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          avg_rating?: number
          brand?: string | null
          category_ids?: string[] | null
          count_in_stock?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          in_season?: boolean | null
          is_published?: boolean | null
          list_price?: number | null
          name?: string
          num_reviews?: number | null
          num_sales?: number | null
          options?: Json | null
          price?: number | null
          rating_distribution?: Json
          slug?: string
          stock_status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          favorite_fruit: string | null
          has_used_new_user_spin: boolean | null
          is_staff: boolean | null
          last_spin_at: string | null
          loyalty_points: number | null
          role: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          favorite_fruit?: string | null
          has_used_new_user_spin?: boolean | null
          is_staff?: boolean | null
          last_spin_at?: string | null
          loyalty_points?: number | null
          role?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          favorite_fruit?: string | null
          has_used_new_user_spin?: boolean | null
          is_staff?: boolean | null
          last_spin_at?: string | null
          loyalty_points?: number | null
          role?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      promotion_products: {
        Row: {
          product_id: string
          promotion_id: string
        }
        Insert: {
          product_id: string
          promotion_id: string
        }
        Update: {
          product_id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "producttest"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_products_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          background_color: string | null
          countdown_end_time: string | null
          created_at: string | null
          discount_text: string | null
          extra_discount_text: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured_on_homepage: boolean | null
          new_price: number | null
          old_price: number | null
          tag: string
          title: string
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          countdown_end_time?: string | null
          created_at?: string | null
          discount_text?: string | null
          extra_discount_text?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured_on_homepage?: boolean | null
          new_price?: number | null
          old_price?: number | null
          tag: string
          title: string
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          countdown_end_time?: string | null
          created_at?: string | null
          discount_text?: string | null
          extra_discount_text?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured_on_homepage?: boolean | null
          new_price?: number | null
          old_price?: number | null
          tag?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recipe_bookmarks: {
        Row: {
          bundle_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          bundle_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          bundle_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_bookmarks_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          guest_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          guest_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          guest_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "recipe_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_comments: {
        Row: {
          bundle_id: string
          comment_text: string
          created_at: string | null
          guest_name: string | null
          id: string
          is_approved: boolean | null
          likes_count: number | null
          parent_comment_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bundle_id: string
          comment_text: string
          created_at?: string | null
          guest_name?: string | null
          id?: string
          is_approved?: boolean | null
          likes_count?: number | null
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bundle_id?: string
          comment_text?: string
          created_at?: string | null
          guest_name?: string | null
          id?: string
          is_approved?: boolean | null
          likes_count?: number | null
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_comments_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "recipe_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ratings: {
        Row: {
          bundle_id: string
          created_at: string | null
          guest_id: string | null
          id: string
          rating: number
          review_text: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bundle_id: string
          created_at?: string | null
          guest_id?: string | null
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bundle_id?: string
          created_at?: string | null
          guest_id?: string | null
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ratings_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_user_photo_likes: {
        Row: {
          created_at: string | null
          guest_id: string | null
          id: string
          photo_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          guest_id?: string | null
          id?: string
          photo_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          guest_id?: string | null
          id?: string
          photo_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_user_photo_likes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "recipe_user_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_user_photo_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_user_photos: {
        Row: {
          bundle_id: string
          caption: string | null
          created_at: string | null
          guest_name: string | null
          id: string
          is_approved: boolean | null
          likes_count: number | null
          photo_url: string
          user_id: string | null
        }
        Insert: {
          bundle_id: string
          caption?: string | null
          created_at?: string | null
          guest_name?: string | null
          id?: string
          is_approved?: boolean | null
          likes_count?: number | null
          photo_url: string
          user_id?: string | null
        }
        Update: {
          bundle_id?: string
          caption?: string | null
          created_at?: string | null
          guest_name?: string | null
          id?: string
          is_approved?: boolean | null
          likes_count?: number | null
          photo_url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_user_photos_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_user_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recipients: {
        Row: {
          account_number: string
          bank_code: string
          created_at: string | null
          id: string
          recipient_code: string
          recipient_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number: string
          bank_code: string
          created_at?: string | null
          id?: string
          recipient_code: string
          recipient_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string
          bank_code?: string
          created_at?: string | null
          id?: string
          recipient_code?: string
          recipient_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reference: {
        Row: {
          id: string
          order_id: string | null
          reference: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          order_id?: string | null
          reference?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          order_id?: string | null
          reference?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_discount_given: boolean
          referred_purchase_amount: number
          referred_user_email: string | null
          referred_user_id: string | null
          referrer_discount_amount: number
          referrer_email: string
          referrer_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_discount_given?: boolean
          referred_purchase_amount?: number
          referred_user_email?: string | null
          referred_user_id?: string | null
          referrer_discount_amount?: number
          referrer_email: string
          referrer_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_discount_given?: boolean
          referred_purchase_amount?: number
          referred_user_email?: string | null
          referred_user_id?: string | null
          referrer_discount_amount?: number
          referrer_email?: string
          referrer_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_helpful_votes: {
        Row: {
          created_at: string | null
          id: string
          review_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          review_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          review_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "product_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpful_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      shared_carts: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          items: Json
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          items: Json
          token?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          items?: Json
          token?: string
          user_id?: string | null
        }
        Relationships: []
      }
      spin_prizes: {
        Row: {
          code: string | null
          color_bg: string | null
          color_text: string | null
          created_at: string | null
          for_new_users_only: boolean | null
          id: string
          image_url: string | null
          is_active: boolean | null
          label: string
          min_orders_required: number | null
          probability: number | null
          product_id: string | null
          product_option: Json | null
          slug: string
          sort_order: number | null
          sub_label: string | null
          type: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          code?: string | null
          color_bg?: string | null
          color_text?: string | null
          created_at?: string | null
          for_new_users_only?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          label: string
          min_orders_required?: number | null
          probability?: number | null
          product_id?: string | null
          product_option?: Json | null
          slug: string
          sort_order?: number | null
          sub_label?: string | null
          type: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          code?: string | null
          color_bg?: string | null
          color_text?: string | null
          created_at?: string | null
          for_new_users_only?: boolean | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          label?: string
          min_orders_required?: number | null
          probability?: number | null
          product_id?: string | null
          product_option?: Json | null
          slug?: string
          sort_order?: number | null
          sub_label?: string | null
          type?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "spin_prizes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          accept_orders_when_closed: boolean | null
          announcement_end_at: string | null
          announcement_message: string | null
          announcement_start_at: string | null
          close_time: string
          closed_days: number[] | null
          created_at: string
          id: number
          is_announcement_enabled: boolean | null
          is_store_enabled: boolean | null
          open_time: string
          updated_at: string
        }
        Insert: {
          accept_orders_when_closed?: boolean | null
          announcement_end_at?: string | null
          announcement_message?: string | null
          announcement_start_at?: string | null
          close_time?: string
          closed_days?: number[] | null
          created_at?: string
          id?: never
          is_announcement_enabled?: boolean | null
          is_store_enabled?: boolean | null
          open_time?: string
          updated_at?: string
        }
        Update: {
          accept_orders_when_closed?: boolean | null
          announcement_end_at?: string | null
          announcement_message?: string | null
          announcement_start_at?: string | null
          close_time?: string
          closed_days?: number[] | null
          created_at?: string
          id?: never
          is_announcement_enabled?: boolean | null
          is_store_enabled?: boolean | null
          open_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          order_id: string | null
          payment_gateway: string | null
          payment_status: string | null
          reference: string
          transaction_id: string
          updated_at: string | null
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          payment_gateway?: string | null
          payment_status?: string | null
          reference: string
          transaction_id: string
          updated_at?: string | null
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          payment_gateway?: string | null
          payment_status?: string | null
          reference?: string
          transaction_id?: string
          updated_at?: string | null
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          favorite_fruit: string | null
          id: string
          role: string | null
          status: string | null
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          favorite_fruit?: string | null
          id: string
          role?: string | null
          status?: string | null
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          favorite_fruit?: string | null
          id?: string
          role?: string | null
          status?: string | null
        }
        Relationships: []
      }
      users_backup: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          birthday: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          favorite_fruit: string | null
          id: string | null
          role: string | null
          status: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          favorite_fruit?: string | null
          id?: string | null
          role?: string | null
          status?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          favorite_fruit?: string | null
          id?: string | null
          role?: string | null
          status?: string | null
        }
        Relationships: []
      }
      vendors: {
        Row: {
          business_type: string | null
          categories: string[] | null
          contact: Json | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          display_name: string
          fulfillment_rate: number | null
          id: string
          is_verified: boolean | null
          join_date: string | null
          location: Json | null
          logo: string | null
          num_followers: number | null
          num_products: number | null
          num_reviews: number | null
          num_sales: number | null
          positive_reviews: number | null
          rating: number | null
          response_rate: number | null
          response_time: number | null
          return_policy: string | null
          shipping_policy: string | null
          shop_id: string
          social_media: Json | null
          team_size: string | null
          updated_at: string | null
        }
        Insert: {
          business_type?: string | null
          categories?: string[] | null
          contact?: Json | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          fulfillment_rate?: number | null
          id?: string
          is_verified?: boolean | null
          join_date?: string | null
          location?: Json | null
          logo?: string | null
          num_followers?: number | null
          num_products?: number | null
          num_reviews?: number | null
          num_sales?: number | null
          positive_reviews?: number | null
          rating?: number | null
          response_rate?: number | null
          response_time?: number | null
          return_policy?: string | null
          shipping_policy?: string | null
          shop_id: string
          social_media?: Json | null
          team_size?: string | null
          updated_at?: string | null
        }
        Update: {
          business_type?: string | null
          categories?: string[] | null
          contact?: Json | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          fulfillment_rate?: number | null
          id?: string
          is_verified?: boolean | null
          join_date?: string | null
          location?: Json | null
          logo?: string | null
          num_followers?: number | null
          num_products?: number | null
          num_reviews?: number | null
          num_sales?: number | null
          positive_reviews?: number | null
          rating?: number | null
          response_rate?: number | null
          response_time?: number | null
          return_policy?: string | null
          shipping_policy?: string | null
          shop_id?: string
          social_media?: Json | null
          team_size?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      voucher_usages: {
        Row: {
          id: string
          used_at: string
          user_id: string
          voucher_id: string
        }
        Insert: {
          id?: string
          used_at?: string
          user_id: string
          voucher_id: string
        }
        Update: {
          id?: string
          used_at?: string
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_voucher"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          code: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          discount_type: string | null
          discount_value: number | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          used_count: number | null
          user_id: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number | null
          user_id?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number | null
          user_id?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_sessions: {
        Row: {
          address: string | null
          cart_items: Json | null
          created_at: string | null
          id: string
          last_interaction: string | null
          name: string | null
          phone_number: string
          stage: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cart_items?: Json | null
          created_at?: string | null
          id?: string
          last_interaction?: string | null
          name?: string | null
          phone_number: string
          stage?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cart_items?: Json | null
          created_at?: string | null
          id?: string
          last_interaction?: string | null
          name?: string | null
          phone_number?: string
          stage?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_ep_norm: {
        Row: {
          nname: string | null
          product_name: string | null
        }
        Insert: {
          nname?: never
          product_name?: string | null
        }
        Update: {
          nname?: never
          product_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      decrement_blog_post_likes: {
        Args: { post_id: string }
        Returns: undefined
      }
      decrement_helpful_count: {
        Args: { review_id_param: string }
        Returns: undefined
      }
      increment_blog_post_likes: {
        Args: { post_id: string }
        Returns: undefined
      }
      increment_blog_post_views: {
        Args: { post_id: string }
        Returns: undefined
      }
      increment_helpful_count: {
        Args: { review_id_param: string }
        Returns: undefined
      }
      match_documents: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      normalize_name: { Args: { s: string }; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_cart_items: {
        Args: { p_cart_id: string; p_new_items: Json }
        Returns: undefined
      }
    }
    Enums: {
      bundle_published_status_enum: "published" | "archived"
      bundle_stock_status_enum: "in_stock" | "out_of_stock"
      notification_type: "info" | "warning" | "error"
      order_status_enum:
        | "In transit"
        | "order delivered"
        | "order confirmed"
        | "Cancelled"
      payment_status_enum: "Pending" | "Paid" | "Cancelled"
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
      bundle_published_status_enum: ["published", "archived"],
      bundle_stock_status_enum: ["in_stock", "out_of_stock"],
      notification_type: ["info", "warning", "error"],
      order_status_enum: [
        "In transit",
        "order delivered",
        "order confirmed",
        "Cancelled",
      ],
      payment_status_enum: ["Pending", "Paid", "Cancelled"],
    },
  },
} as const
