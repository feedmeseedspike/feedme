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
  // The 'phone' is now fetched from the related addresses table
  // phone: string | null; // Removed direct phone field
  created_at: string | null; // Used for join date
  avatar_url: string | null; // Added based on Tables<'users'>
  role: string | null; // Added based on Tables<'users'>
  status: string | null; // Added based on Tables<'users'>
  loyalty_points: number | null;
  has_used_new_user_spin: boolean | null;

  // Include the related addresses, which should be an array
  addresses: Array<{ phone: string | null; city: string | null }> | null; // Define structure of related addresses

  // Additional fields that might be needed in the UI (optional or require separate fetching/calculation)
  name?: string; // Can use display_name
  phoneNumber?: string; // Can be derived from addresses
  totalAmountSpent?: number; // Requires aggregation query
  totalOrders?: number; // Requires counting orders
  location?: string; // Can be derived from addresses
  image?: string; // Can use avatar_url

  // Assuming the user data structure from Supabase will include an orders array or can be joined/fetched separately
  // If orders are not directly on the user object, you'll need to adjust this interface and fetching logic.
  orders?: Order[]; // Made orders optional as it might not be directly on the user object
} 