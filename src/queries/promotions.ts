import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPromotions as getPromotionsAction, createPromotion as createPromotionAction, getProductsByTag as getProductsByTagAction, getPromotionByTag as getPromotionByTagAction, deletePromotion as deletePromotionAction, updatePromotion as updatePromotionAction, addProductToPromotion as addProductToPromotionAction, removeProductFromPromotion as removeProductFromPromotionAction, getLinkedProductsForPromotion as getLinkedProductsForPromotionAction, searchProducts as searchProductsAction } from "../lib/actions/promotion.actions";
import { Database } from "../utils/database.types";
import { useToast } from "../hooks/useToast";
import { createClient } from "@/utils/supabase/client";

// Define the query keys
export const promotionsQueryKey = ["promotions"];
export const productsByTagQueryKey = (tag: string, page: number = 1, sort?: string) => ["products", tag, page, sort];
export const promotionByTagQueryKey = (tag: string) => ["promotion", tag];

// This query hook will call the server action to fetch promotions
export function usePromotionsQuery(filterOptions?: { isFeatured?: boolean }) {
  const supabase = createClient();

  // Base query: select all columns from promotions that are active.
  let queryBuilder = supabase
    .from("promotions")
    .select("*")
    .eq("is_active", true);

  // Apply filter for is_featured_on_homepage if specified
  if (filterOptions?.isFeatured !== undefined) {
    queryBuilder = queryBuilder.eq("is_featured_on_homepage", filterOptions.isFeatured);
  }

  return useQuery({
    queryKey: ['promotions', filterOptions], // Include filterOptions in queryKey for caching
    queryFn: async () => {
      const { data, error } = await queryBuilder;
      if (error) {
        throw error;
      }
      return data;
    },
  });
}

// This mutation hook will call the server action to create a promotion
export function useCreatePromotionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promotionData: Database['public']['Tables']['promotions']['Insert']) => {
      const newPromotion = await createPromotionAction(promotionData);
      return newPromotion;
    },
    onSuccess: () => {
      // Invalidate the promotions query to refetch and show the new promotion
      queryClient.invalidateQueries({ queryKey: promotionsQueryKey });
      // Optionally, if adding a promotion might affect a product list, you could invalidate here too, but specific tags are better
    },
    onError: (error) => {
      // Optionally show a toast or other notification to the user
    },
  });
}

// This query hook will call the server action to fetch products by tag
export function useProductsByTagQuery(tag: string, page: number = 1, sort?: string) {
  return useQuery({
    queryKey: productsByTagQueryKey(tag, page, sort),
    queryFn: async () => {
      const result = await getProductsByTagAction({ tag, page, sort });
      // The server action now returns an object { products: Product[], totalCount: number }
      return result;
    },
    enabled: !!tag, // Only run the query if the tag is available
    // Add staleTime, gcTime based on how often product associations change
  });
}

// This query hook will call the server action to fetch a single promotion by tag
export function usePromotionByTagQuery(tag: string, p0: { enabled: boolean; }) {
  return useQuery({
    queryKey: promotionByTagQueryKey(tag),
    queryFn: async () => {
      const promotion = await getPromotionByTagAction(tag);
      return promotion;
    },
    enabled: !!tag, // Only run the query if the tag is available
    // Add staleTime, gcTime
  });
}

// Mutation hook for updating a promotion
export function useUpdatePromotionMutation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (promotionData: Database['public']['Tables']['promotions']['Update']) => {
      // Call the server action
      const updatedPromotion = await updatePromotionAction(promotionData);
      return updatedPromotion;
    },
    onSuccess: (data, variables) => {
      // Invalidate the promotions query to refetch the list after update
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      // Optionally, update the cache directly for a snappier UI (optimistic update)
      // queryClient.setQueryData(['promotions'], (oldData) => {
      //   if (!oldData) return [];
      //   return oldData.map(promo => promo.id === data.id ? data : promo);
      // });
      showToast('Promotion updated successfully!', 'success');
    },
    onError: (error) => {
      showToast(`Failed to update promotion: ${error.message}`, 'error');
    },
  });
}

// Mutation hook for deleting a promotion
export function useDeletePromotionMutation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Call the server action
      const result = await deletePromotionAction(id);
      if (result.success === false) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate the promotions query to refetch the list after deletion
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      showToast('Promotion deleted successfully!', 'success');
    },
    onError: (error) => {
      showToast(`Failed to delete promotion: ${error.message}`, 'error');
    },
  });
}

// Query hook for searching products
export function useProductSearchQuery(searchTerm: string) {
  return useQuery({
    queryKey: ['products', 'search', searchTerm], // Unique key for product search
    queryFn: async () => {
      if (!searchTerm) return []; // Don't search if the term is empty
      const products = await searchProductsAction(searchTerm);
      return products;
    },
    enabled: !!searchTerm, // Only run the query if searchTerm is not empty
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new results
    staleTime: 5 * 60 * 1000, // Cache search results for 5 minutes
  });
}

// Query hook for fetching products linked to a promotion by promotion ID
export function useLinkedProductsForPromotionQuery(promotionId: string | null | undefined) {
  return useQuery({
    queryKey: ['promotions', promotionId, 'linked-products'], // Unique key for linked products
    queryFn: async () => {
      if (!promotionId) return []; // Return empty array if no promotionId
      const products = await getLinkedProductsForPromotionAction(promotionId);
      return products;
    },
    enabled: !!promotionId, // Only run the query if promotionId is available
  });
}

// Mutation hook for adding a product to a promotion
export function useAddProductToPromotionMutation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ promotionId, productId }: { promotionId: string; productId: string }) => {
      const result = await addProductToPromotionAction(promotionId, productId);
      // The server action returns { success: boolean, error?: string, data?: PromotionProductLink }.
      // If success is false, it means a known error like duplicate key occurred and was handled.
      if (!result.success) {
         // We don't throw here, the server action returned the error gracefully
         return result; // Return the result object including the error
      }
      return result; // Return the success result including data
    },
    onSuccess: (result, variables) => {
      // Invalidate the specific products by tag query for this promotion
      // Note: This requires knowing the tag associated with the promotionId. A more robust solution might involve returning the tag from the server action or having access to it here.
      // For now, we'll invalidate all products by tag queries as a fallback.
      queryClient.invalidateQueries({ queryKey: ['products', variables.promotionId] }); // Try to invalidate by promotion ID (might need a different query structure)
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Fallback to invalidate all product queries

      // Check if the operation was successful based on the result object
      if (result.success) {
         showToast('Product added to promotion!', 'success');
      } else {
         // Handle the case where the server action returned a graceful error (e.g., duplicate)
         console.warn('Add product failed gracefully:', result.error);
         showToast(`Failed to add product: ${result.error}`, 'warning');
      }
    },
    onError: (error: Error) => { // Explicitly type error as Error
      showToast(`Failed to add product: ${error.message}`, 'error'); // error.message is safe here
    },
  });
}

// Mutation hook for removing a product from a promotion
export function useRemoveProductFromPromotionMutation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async ({ promotionId, productId }: { promotionId: string; productId: string }) => {
      const result = await removeProductFromPromotionAction(promotionId, productId);
      // The server action returns { success: boolean } or throws an error.
      if (result.success === false) { // This case should not be reached if server action throws on failure
        // This branch is likely unnecessary based on server action implementation, but keeping for safety
         throw new Error("Failed to remove product."); // Throw to be caught by onError
      }
      return result; // Return success indicator
    },
    onSuccess: (data, variables) => {
       // Invalidate the specific products by tag query for this promotion
      // Note: Same as above, ideally invalidate by promotionId or tag
      queryClient.invalidateQueries({ queryKey: ['products', variables.promotionId] }); // Try to invalidate by promotion ID (might need a different query structure)
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Fallback to invalidate all product queries
      showToast('Product removed from promotion!', 'success');
    },
    onError: (error: Error) => { // Explicitly type error as Error
      showToast(`Failed to remove product: ${error.message}`, 'error'); // error.message is safe here
    },
  });
}

// If you prefer to use supabase-cache-helpers for client-side fetching,
// you would define a query builder like this:
/*
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "src/utils/database.types";
import { createSelectInfiniteQuery, createSelectQuery } from "supabase-cache-helpers/postgrest-react-query";

const browserClient = createClientComponentClient<Database>();

export const getPromotionsQueryBuilder = () =>
  browserClient.from('promotions').select('*').eq('is_active', true);

export const usePromotionsQueryHelper = createSelectQuery(getPromotionsQueryBuilder);

// Use usePromotionsQueryHelper() in your components
*/ 