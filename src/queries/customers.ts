import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { getCustomerByIdAction, getCustomerOrdersAction } from '../lib/actions/user.action';
import { Customer, Order } from '../types/customer';
import { createClient } from '@utils/supabase/client';
import { Tables } from '../utils/database.types';

type Address = Tables<'addresses'>;

// Query key factory
export const customerKeys = {
  all: ['customers'] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  orders: (customerId: string) => [...customerKeys.detail(customerId), 'orders'] as const,
};

// Query function for fetching a single customer by ID
export function getCustomerQuery(customerId: string): UseQueryOptions<Customer | undefined, Error> {
  return {
    queryKey: customerKeys.detail(customerId),
    queryFn: () => getCustomerByIdAction(customerId) as unknown as Promise<Customer | undefined>,
    // Add staleTime, cacheTime, etc. as per your application's caching strategy
  };
}

// Query function for fetching customer orders by customer ID
export function getCustomerOrdersQuery(customerId: string): UseQueryOptions<Order[] | undefined, Error> {
  return {
    queryKey: customerKeys.orders(customerId),
    queryFn: () => getCustomerOrdersAction(customerId) as Promise<Order[] | undefined>,
    enabled: !!customerId, // Enable this query only when customerId is available
    // You might want a shorter staleTime/cacheTime for orders if they update frequently
  };
}

// Query function for fetching multiple customers
interface FetchCustomersParams {
  page?: number;
  itemsPerPage?: number;
  search?: string;
  role?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface FetchedCustomerData extends Tables<'profiles'> {
    id: string;
    email?: string | null;
    addresses: Array<{ phone: string | null; city: string | null }> | null; 
    totalOrders: number;
    totalAmountSpent: number;
}

export async function fetchCustomers({
  page = 1,
  itemsPerPage = 10,
  search = '',
  role = '',
  status = '',
  startDate,
  endDate,
}: FetchCustomersParams): Promise<{ data: FetchedCustomerData[] | null; count: number | null }> {
  const supabase = createClient();

  // 1. Fetch profiles (with count)
  let profilesQuery = supabase.from('profiles').select('*', { count: 'exact' });
  
  if (search) {
    // Search in display_name
    profilesQuery = profilesQuery.ilike('display_name', `%${search}%`);
  }
  
  if (role) {
    if (role === 'staff') {
      profilesQuery = profilesQuery.eq('is_staff', true);
    } else if (role === 'buyer') {
      profilesQuery = profilesQuery.eq('is_staff', false).neq('role', 'admin');
    } else if (role === 'admin') {
      profilesQuery = profilesQuery.eq('role', 'admin');
    }
  }

  if (status) {
    profilesQuery = profilesQuery.eq('status', status);
  }

  // Date Filtering
  if (startDate) {
     profilesQuery = profilesQuery.gte('created_at', startDate);
  }
  if (endDate) {
     // Append time to end date to include the whole day
     profilesQuery = profilesQuery.lte('created_at', endDate.includes('T') ? endDate : `${endDate}T23:59:59`);
  }

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;
  profilesQuery = profilesQuery.range(start, end).order('created_at', { ascending: false });
  const { data: profiles, error: profilesError, count } = await profilesQuery;
  if (profilesError) {
    throw profilesError;
  }
  if (!profiles || profiles.length === 0) {
    return { data: [], count };
  }

  // 2. Fetch emails from profiles (now that email column exists)
  // 2. Fetch emails from profiles (now that email column exists)
  // No need to join with users, just use profile.email
  // check both user_id and id to be safe
  const userIds = profiles.map((p: any) => p.user_id || p.id).filter((id: string | null | undefined) => !!id);

  // 3. Fetch addresses for relevant user_ids
  let addressesByUserId: Record<string, Array<{ phone: string | null; city: string | null }>> = {};
  if (userIds.length > 0) {
    const { data: addresses, error: addressesError } = await supabase
      .from('addresses')
      .select('user_id, phone, city')
      .in('user_id', userIds);
      
    if (addressesError) {
      console.error("Error fetching addresses:", addressesError);
      // Don't throw, just continue without addresses
    } else {
      (addresses || []).forEach((addr: any) => {
        if (addr.user_id) {
          if (!addressesByUserId[addr.user_id]) addressesByUserId[addr.user_id] = [];
          addressesByUserId[addr.user_id].push({ phone: addr.phone, city: addr.city });
        }
      });
    }
  }

  // 4. Fetch orders for relevant user_ids (for total orders and total amount spent)
  let ordersByUserId: Record<string, { totalOrders: number; totalAmountSpent: number }> = {};
  if (userIds.length > 0) {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, total_amount')
      .in('user_id', userIds);
      
    if (!ordersError && orders) {
      userIds.forEach((userId: string) => {
        const userOrders = orders.filter((o: any) => o.user_id === userId);
        ordersByUserId[userId] = {
          totalOrders: userOrders.length,
          totalAmountSpent: userOrders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0),
        };
      });
    }
  }

  // 5. Merge all data
  const merged: FetchedCustomerData[] = (profiles as any[]).map(profile => {
    const userId = profile.user_id || profile.id;
    return {
      ...profile,
      // email is now directly on profile
      addresses: userId ? (addressesByUserId[userId] || []) : [],
      totalOrders: ordersByUserId[userId]?.totalOrders || 0,
      totalAmountSpent: ordersByUserId[userId]?.totalAmountSpent || 0,
    };
  });

  return { data: merged, count };
}

// Hook to use the customer query
export function useCustomer(customerId: string) {
  return useQuery(getCustomerQuery(customerId));
}

// Hook to use the customer orders query
export function useCustomerOrders(customerId: string) {
  // The enabled option is now handled within getCustomerOrdersQuery
  return useQuery(getCustomerOrdersQuery(customerId));
} 