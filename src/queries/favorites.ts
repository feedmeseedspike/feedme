import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addToFavorite, removeFromFavorite, isProductFavorited, getFavourites, FavoritesSuccess, FavoritesFailure } from "src/lib/actions/favourite.actions";
import { createClient as createBrowserClient } from "src/utils/supabase/client";
import { createClient as createServerClient } from "src/utils/supabase/server";
import { Tables } from "src/utils/database.types";

type Favorite = Tables<'favorites'>; // Define type for favorites table
type Product = Tables<'products'>; // Define type for products table

export const getFavoritesQuery = () => ({
  queryKey: ['favorites'],
  queryFn: async () => {
    const result: FavoritesSuccess | FavoritesFailure = await getFavourites(); // Use union type
    if (!result.success) {
      // Handle error or return an empty array if not logged in/error
      return [];
    }
    // Access data now that we know it exists
    // Assuming result.data is an array of favorite objects with product_id
    return result.data.map(fav => fav.product_id) || []; // Removed unnecessary optional chaining and default empty array as we return [] on error
  },
  // Options can be added here, e.g., staleTime, refetchOnWindowFocus
});

// Query to check if a specific product is favorited by the logged-in user
export const isProductFavoritedQuery = (productId: string) => ({
    queryKey: ['favorites', productId],
    queryFn: () => isProductFavorited(productId), // Use the re-imported function
    // This query depends on the overall favorites list, so it will update
    // when the 'favorites' query is invalidated.
    // We might not need this separate query if we always fetch the full list
    // and check locally. Let's prioritize the main list first.
    enabled: !!productId, // Only run if productId is provided
});

// Mutation to add a product to favorites
export const useAddFavoriteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const result = await addToFavorite(productId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onMutate: async (productId: string) => {
      // Cancel any outgoing refetches for both queries
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      await queryClient.cancelQueries({ queryKey: ['favoriteProducts'] });

      // Snapshot the previous values
      const previousFavorites = queryClient.getQueryData<string[] | null>(['favorites']);
      const previousFavoriteProducts = queryClient.getQueryData<any[] | null>(['favoriteProducts']);

      // Optimistically update the favorite IDs list (string[])
      queryClient.setQueryData<string[]>(['favorites'], (old) => {
        const oldArray = Array.isArray(old) ? old : [];
        if (!oldArray.includes(productId)) {
           return [...oldArray, productId];
        }
        return oldArray;
      });

      return { previousFavorites, previousFavoriteProducts };
    },
    onSuccess: () => {
      // Invalidate both queries to refetch
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favoriteProducts'] });
    },
    onError: (error, productId, context) => {
      // Rollback favorite IDs list on error
      if (context?.previousFavorites) {
        queryClient.setQueryData<string[]>(['favorites'], context.previousFavorites);
      }
       // Rollback favorite products list
      if (context?.previousFavoriteProducts) {
         queryClient.setQueryData<any[]>(['favoriteProducts'], context.previousFavoriteProducts);
      }
    },
  });
};

// Mutation to remove a product from favorites
export const useRemoveFavoriteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const result = await removeFromFavorite(productId);
      if (!result.success) {
         throw new Error(result.error);
      }
      return result;
    },
     onMutate: async (productId: string) => {
      // Cancel any outgoing refetches for both queries
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      await queryClient.cancelQueries({ queryKey: ['favoriteProducts'] });

      // Snapshot the previous values
      const previousFavorites = queryClient.getQueryData<string[] | null>(['favorites']);
      const previousFavoriteProducts = queryClient.getQueryData<any[] | null>(['favoriteProducts']);

      // Optimistically update the favorite IDs list (string[])
      queryClient.setQueryData<string[]>(['favorites'], (old) => {
         const oldArray = Array.isArray(old) ? old : [];
        return oldArray.filter(id => id !== productId);
      });

      // Optimistically update the favorite products list (objects)
       queryClient.setQueryData<any[]>(['favoriteProducts'], (old) => {
         const oldArray = Array.isArray(old) ? old : [];
         // Filter by checking if the nested product id matches
         return oldArray.filter(fav => fav.product_id !== productId && fav.products?.id !== productId);
       });

      return { previousFavorites, previousFavoriteProducts };
    },
    onSuccess: () => {
      // Invalidate both queries to refetch
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favoriteProducts'] });
    },
     onError: (error, productId, context) => {
      // Rollback favorite IDs list on error
      if (context?.previousFavorites) {
        queryClient.setQueryData<string[]>(['favorites'], context.previousFavorites);
      }
      // Rollback favorite products list on error
      if (context?.previousFavoriteProducts) {
         queryClient.setQueryData<any[]>(['favoriteProducts'], context.previousFavoriteProducts);
      }
    },
  });
};

// Combined mutation for toggling favorite status (optional, can use add/remove directly)
// export const useToggleFavoriteMutation = () => {
//   const queryClient = useQueryClient();
//   const addMutation = useAddFavoriteMutation();
//   const removeMutation = useRemoveFavoriteMutation();

//   return useMutation({
//     mutationFn: async ({ productId, isFavorited }: { productId: string; isFavorited: boolean }) => {
//       if (isFavorited) {
//         return removeMutation.mutateAsync(productId);
//       } else {
//         return addMutation.mutateAsync(productId);
//       }
//     },
//     onSuccess: () => {
//        queryClient.invalidateQueries({ queryKey: ['favorites'] });
//     },
//      onError: (error) => {
//       console.error("Failed to toggle favorites:", error);
//     },
//   });
// }; 