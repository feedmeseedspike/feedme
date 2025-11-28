import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBlackFridayItem,
  deleteBlackFridayItem,
  getBlackFridayItems,
  updateBlackFridayItem,
} from "src/lib/actions/black-friday.actions";
import { Database } from "src/utils/database.types";

export const blackFridayItemsQueryKey = ["black-friday-items"];

export function useBlackFridayItemsQuery(options?: {
  includeInactive?: boolean;
}) {
  return useQuery({
    queryKey: [blackFridayItemsQueryKey, options?.includeInactive],
    queryFn: () => getBlackFridayItems(options),
  });
}

export function useCreateBlackFridayItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Database["public"]["Tables"]["black_friday_items"]["Insert"]) =>
      createBlackFridayItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blackFridayItemsQueryKey });
    },
  });
}

export function useUpdateBlackFridayItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Database["public"]["Tables"]["black_friday_items"]["Update"]) =>
      updateBlackFridayItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blackFridayItemsQueryKey });
    },
  });
}

export function useDeleteBlackFridayItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBlackFridayItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blackFridayItemsQueryKey });
    },
  });
}



