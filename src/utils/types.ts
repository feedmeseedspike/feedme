import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export type TypedSupabaseClient = SupabaseClient<Database>

export interface OrderData {
  userId: string;
  cartItems: Array<{ productId: string; quantity: number; price?: number | null; option?: any; bundleId?: string; offerId?: string }>;
  shippingAddress: {
    fullName: string;
    street: string;
    location: string;
    phone: string;
    // Add other relevant shipping address fields if necessary
  };
  totalAmount: number;
  totalAmountPaid: number;
  deliveryFee: number;
  local_government: string;
  voucherId: string | null;
  paymentMethod: string;
}