export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          location: string | null;
          bio: string | null;
          avatar_url: string | null;
          role: "buyer" | "seller" | "both";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          location?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          role?: "buyer" | "seller" | "both";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          location?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          role?: "buyer" | "seller" | "both";
          updated_at?: string;
        };
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          description: string | null;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state: string;
          zip_code: string;
          latitude: number | null;
          longitude: number | null;
          price: number;
          bedrooms: number | null;
          bathrooms: number | null;
          sqft: number | null;
          lot_sqft: number | null;
          year_built: number | null;
          property_type: "house" | "condo" | "townhouse" | "land" | "multi_family" | "other";
          status: "active" | "pending" | "sold" | "withdrawn";
          photos: string[];
          cover_photo_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          title: string;
          description?: string | null;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          state: string;
          zip_code: string;
          latitude?: number | null;
          longitude?: number | null;
          price: number;
          bedrooms?: number | null;
          bathrooms?: number | null;
          sqft?: number | null;
          lot_sqft?: number | null;
          year_built?: number | null;
          property_type?: "house" | "condo" | "townhouse" | "land" | "multi_family" | "other";
          status?: "active" | "pending" | "sold" | "withdrawn";
          photos?: string[];
          cover_photo_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          seller_id?: string;
          title?: string;
          description?: string | null;
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          state?: string;
          zip_code?: string;
          latitude?: number | null;
          longitude?: number | null;
          price?: number;
          bedrooms?: number | null;
          bathrooms?: number | null;
          sqft?: number | null;
          lot_sqft?: number | null;
          year_built?: number | null;
          property_type?: "house" | "condo" | "townhouse" | "land" | "multi_family" | "other";
          status?: "active" | "pending" | "sold" | "withdrawn";
          photos?: string[];
          cover_photo_index?: number;
          updated_at?: string;
        };
      };
      offers: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          offer_price: number;
          earnest_money: number;
          closing_date: string;
          inspection_contingency: boolean;
          financing_contingency: boolean;
          appraisal_contingency: boolean;
          notes: string | null;
          status: "pending" | "accepted" | "rejected" | "countered" | "withdrawn";
          counter_price: number | null;
          counter_notes: string | null;
          seller_response_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_id: string;
          offer_price: number;
          earnest_money?: number;
          closing_date: string;
          inspection_contingency?: boolean;
          financing_contingency?: boolean;
          appraisal_contingency?: boolean;
          notes?: string | null;
          status?: "pending" | "accepted" | "rejected" | "countered" | "withdrawn";
          counter_price?: number | null;
          counter_notes?: string | null;
          seller_response_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          listing_id?: string;
          buyer_id?: string;
          offer_price?: number;
          earnest_money?: number;
          closing_date?: string;
          inspection_contingency?: boolean;
          financing_contingency?: boolean;
          appraisal_contingency?: boolean;
          notes?: string | null;
          status?: "pending" | "accepted" | "rejected" | "countered" | "withdrawn";
          counter_price?: number | null;
          counter_notes?: string | null;
          seller_response_at?: string | null;
          updated_at?: string;
        };
      };
      saved_listings: {
        Row: {
          id: string;
          user_id: string;
          listing_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          listing_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          listing_id?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          data: Json;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          data?: Json;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          type?: string;
          title?: string;
          body?: string | null;
          data?: Json;
          read?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type Offer = Database["public"]["Tables"]["offers"]["Row"];
export type SavedListing = Database["public"]["Tables"]["saved_listings"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
