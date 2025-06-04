// src/types/customer.ts

// Define interface for Order
export interface Order {
  // Fields fetched from the database
  id: string;
  user_id: string | null;
  status: string | null; // Maps to progress
  total_amount: number | null; // Maps to amount
  shipping_address: { city?: string; [key: string]: any } | null; // Maps to address
  payment_method: string | null;
  created_at: string; // Maps to date
  updated_at: string | null;
  voucher_id: string | null;

  // Fields used in the UI (will need mapping from fetched data)
  orderNo?: string; // Example: substring of id
  date?: string; // Example: formatted created_at
  amount?: number; // Example: total_amount
  platform?: string; // Not directly available, might need to be inferred or added
  address?: string; // Example: city from shipping_address
  progress?: string; // Example: status
}

// Define interface for Customer
export interface Customer {
  // Fields fetched from the database (public.users table)
  id: string;
  display_name: string | null; // Used for name
  email: string | null;
  phone: string | null; // Used for phoneNumber
  created_at: string | null; // Used for join date

  // Additional fields that might be needed in the UI (optional or require separate fetching/calculation)
  name?: string; // Can use display_name
  phoneNumber?: string; // Can use phone
  totalAmountSpent?: number; // Requires aggregation query
  totalOrders?: number; // Requires counting orders
  location?: string; // Requires address data, potentially from another table or joined
  image?: string; // Requires avatar_url if available in users table

  // Assuming the user data structure from Supabase will include an orders array or can be joined/fetched separately
  // If orders are not directly on the user object, you'll need to adjust this interface and fetching logic.
  orders?: Order[]; // Made orders optional as it might not be directly on the user object
} 