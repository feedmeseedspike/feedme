import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { getCustomerByIdAction, getCustomerOrdersAction } from '../lib/actions/user.action';
import { Customer, Order } from '../types/customer';
import { createClient } from '@utils/supabase/client';
import { Tables } from '../utils/database.types';

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
    queryFn: () => getCustomerByIdAction(customerId) as Promise<Customer | undefined>,
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
}

export async function fetchCustomers({
  page = 1,
  itemsPerPage = 10,
  search = '',
}: FetchCustomersParams): Promise<{ data: Tables<'users'>[] | null; count: number | null }> {
  const supabase = createClient();

  let query = supabase.from('users').select('id, display_name, email, phone, created_at', { count: 'exact' });

  if (search) {
    query = query.or(
      `display_name.ilike.%${search}%, email.ilike.%${search}%, phone.ilike.%${search}%`
    );
  }

  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage - 1;
  query = query.range(start, end);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }

  return { data, count };
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