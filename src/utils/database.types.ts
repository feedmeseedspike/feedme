export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
            foreignKeyName: "browsing_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "bundle_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          created_at: string | null
          discount_percentage: number | null
          id: string
          name: string
          price: number | null
          published_status:
            | Database["public"]["Enums"]["bundle_published_status_enum"]
            | null
          stock_status:
            | Database["public"]["Enums"]["bundle_stock_status_enum"]
            | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          name: string
          price?: number | null
          published_status?:
            | Database["public"]["Enums"]["bundle_published_status_enum"]
            | null
          stock_status?:
            | Database["public"]["Enums"]["bundle_stock_status_enum"]
            | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          name?: string
          price?: number | null
          published_status?:
            | Database["public"]["Enums"]["bundle_published_status_enum"]
            | null
          stock_status?:
            | Database["public"]["Enums"]["bundle_stock_status_enum"]
            | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          bundle_id: string | null
          cart_id: string | null
          created_at: string | null
          id: string
          option: Json | null
          price: number | null
          product_id: string | null
          quantity: number
        }
        Insert: {
          bundle_id?: string | null
          cart_id?: string | null
          created_at?: string | null
          id?: string
          option?: Json | null
          price?: number | null
          product_id?: string | null
          quantity?: number
        }
        Update: {
          bundle_id?: string | null
          cart_id?: string | null
          created_at?: string | null
          id?: string
          option?: Json | null
          price?: number | null
          product_id?: string | null
          quantity?: number
        }
        Relationships: [
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
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          banner_url: string | null
          created_at: string | null
          description: string | null
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
          id?: string
          keynotes?: string[] | null
          tags?: string[] | null
          thumbnail?: Json | null
          title?: string
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
      order_items: {
        Row: {
          bundle_id: string | null
          id: string
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
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          favorite_fruit: string | null
          is_staff: boolean | null
          role: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_fruit?: string | null
          is_staff?: boolean | null
          role?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_fruit?: string | null
          is_staff?: boolean | null
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
            referencedRelation: "products"
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
          description: string | null
          discount_type: string | null
          discount_value: number | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          used_count: number | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_helpful_count: {
        Args: { review_id_param: string }
        Returns: undefined
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_helpful_count: {
        Args: { review_id_param: string }
        Returns: undefined
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      update_cart_items: {
        Args: { p_cart_id: string; p_new_items: Json }
        Returns: undefined
      }
    }
    Enums: {
      bundle_published_status_enum: "published" | "archived"
      bundle_stock_status_enum: "in_stock" | "out_of_stock"
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
