import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addToFavorite, removeFromFavorite, isProductFavorited, getFavourites, FavoritesSuccess, FavoritesFailure } from "src/lib/actions/favourite.actions";
import { createClient as createBrowserClient } from "src/utils/supabase/client";
import { createClient as createServerClient } from "src/utils/supabase/server";
import { Tables } from "src/utils/database.types";

type Favorite = Tables<'favorites'>;
type Product = Tables<'products'>; 

export const getFavoritesQuery = () => ({
  queryKey: ['favorites'],
  queryFn: async () => {
    const result: FavoritesSuccess | FavoritesFailure = await getFavourites(); 
    if (!result.success) {
      // Handle error or return an empty array if not logged in/error
      console.error("Failed to fetch favorites:", result.error);
      return [];
    }
    return result.data.map(fav => fav.product_id) || []; 
  },
});

// Query to check if a specific product is favorited by the logged-in user
export const isProductFavoritedQuery = (productId: string) => ({
    queryKey: ['favorites', productId],
    queryFn: () => isProductFavorited(productId), 
    enabled: !!productId, 
});

// Mutation to add a product to favorites
export const useAddFavoriteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => addToFavorite(productId),
    onMutate: async (productId: string) => {
      console.log('Optimistically adding product:', productId);
      // Cancel any outgoing refetches for both queries
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      await queryClient.cancelQueries({ queryKey: ['favoriteProducts'] });

      // Snapshot the previous values
      const previousFavorites = queryClient.getQueryData<Favorite[] | null>(['favorites']);
      const previousFavoriteProducts = queryClient.getQueryData<(Favorite & { products: Product | null })[] | null>(['favoriteProducts']);

      // Optimistically update the favorite IDs list
      queryClient.setQueryData<Favorite[] | null>(['favorites'], (old) => {
        const oldArray = Array.isArray(old) ? old : [];
        if (!oldArray.some(fav => fav.product_id === productId)) {
           return [...oldArray, { product_id: productId } as Favorite]; 
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
      console.error("Failed to add to favorites, rolling back:", error);
      // Rollback favorite IDs list on error
      if (context?.previousFavorites) {
        queryClient.setQueryData<Favorite[] | null>(['favorites'], context.previousFavorites);
      }
       // Rollback favorite products list (if needed, though less critical without optimistic update)
      if (context?.previousFavoriteProducts) {
         queryClient.setQueryData<(Favorite & { products: Product | null })[] | null>(['favoriteProducts'], context.previousFavoriteProducts);
      }
    },
  });
};

// Mutation to remove a product from favorites
export const useRemoveFavoriteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => removeFromFavorite(productId),
     onMutate: async (productId: string) => {
       console.log('Optimistically removing product:', productId);
      // Cancel any outgoing refetches for both queries
      await queryClient.cancelQueries({ queryKey: ['favorites'] }); 
      await queryClient.cancelQueries({ queryKey: ['favoriteProducts'] }); 

      // Snapshot the previous values
      const previousFavorites = queryClient.getQueryData<Favorite[] | null>(['favorites']);
      const previousFavoriteProducts = queryClient.getQueryData<(Favorite & { products: Product | null })[] | null>(['favoriteProducts']);

      // Optimistically update the favorite IDs list
      queryClient.setQueryData<Favorite[] | null>(['favorites'], (old) => {
         const oldArray = Array.isArray(old) ? old : [];
        return oldArray.filter(fav => fav.product_id !== productId);
      });

      // Optimistically update the favorite products list
       queryClient.setQueryData<(Favorite & { products: Product | null })[] | null>(['favoriteProducts'], (old) => {
         const oldArray = Array.isArray(old) ? old : [];
         return oldArray.filter(fav => fav.products?.id !== productId); 
       });

      return { previousFavorites, previousFavoriteProducts };
    },
    onSuccess: () => {
      // Invalidate both queries to refetch
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favoriteProducts'] }); 
    },
     onError: (error, productId, context) => {
      console.error("Failed to remove from favorites, rolling back:", error);
      // Rollback favorite IDs list on error
      if (context?.previousFavorites) {
        queryClient.setQueryData<Favorite[] | null>(['favorites'], context.previousFavorites);
      }
      // Rollback favorite products list on error
      if (context?.previousFavoriteProducts) {
         queryClient.setQueryData<(Favorite & { products: Product | null })[] | null>(['favoriteProducts'], context.previousFavoriteProducts);
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