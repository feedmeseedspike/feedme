"use client";

import { Button } from "@components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdateCartMutation,
  ItemToUpdateMutation,
  cartQueryKey,
} from "src/queries/cart";
import { useToast } from "src/hooks/useToast";
import { Tables } from "@utils/database.types";
import { CartItem } from "src/lib/actions/cart.actions";

interface BundleAddToCartButtonProps {
  bundle: Tables<"bundles"> & {
    products?: Tables<"products">[];
  };
}

export default function BundleAddToCartButton({ bundle }: BundleAddToCartButtonProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const updateCartMutation = useUpdateCartMutation();

  const handleAddToCart = () => {
    if (!bundle) return;

    const currentCart = queryClient.getQueryData<CartItem[]>(cartQueryKey);
    let updatedCartItems: ItemToUpdateMutation[] = [];

    let bundleExistsInCart = false;

    if (currentCart) {
      updatedCartItems = currentCart
        .map((item) => {
          if (item.bundle_id === bundle.id) {
            bundleExistsInCart = true;
            return {
              bundle_id: item.bundle_id,
              quantity: item.quantity + 1,
              price: item.price || 0,
              product_id: null,
              offer_id: null,
            };
          } else if (item.product_id) {
            return {
              product_id: item.product_id,
              quantity: item.quantity,
              option:
                item.option === undefined ||
                item.option === null ||
                (typeof item.option === "object" &&
                  Object.keys(item.option).length === 0)
                  ? null
                  : item.option,
              price: item.price || 0,
              bundle_id: null,
              offer_id: null,
            };
          } else if (item.offer_id) {
            return {
              offer_id: item.offer_id,
              quantity: item.quantity,
              price: item.price || 0,
              product_id: null,
              bundle_id: null,
            };
          }
          return item;
        })
        .filter((item) => item !== undefined) as ItemToUpdateMutation[];
    }

    if (!bundleExistsInCart) {
      updatedCartItems.push({
        bundle_id: bundle.id,
        product_id: null,
        offer_id: null,
        quantity: 1,
        price: bundle.price || 0,
      });
    }

    updateCartMutation.mutate(updatedCartItems, {
      onSuccess: () => {
        showToast("Bundle added to cart!", "success");
      },
      onError: (err) => {
        console.error("Failed to add bundle to cart:", err);
        showToast("Failed to add bundle to cart.", "error");
      },
    });
  };

  return (
    <Button
      className="w-full bg-[#1B6013] hover:bg-[#1B6013]/90"
      onClick={handleAddToCart}
      disabled={updateCartMutation.isPending}
    >
      {updateCartMutation.isPending
        ? "Adding..."
        : "Add Bundle to Cart"}
    </Button>
  );
}