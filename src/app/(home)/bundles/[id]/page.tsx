"use client";

import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBundleByIdWithProducts } from "src/queries/bundles";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { formatNaira } from "src/lib/utils";
import { Button } from "@components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import {
  useUpdateCartMutation,
  ItemToUpdateMutation,
  cartQueryKey,
} from "src/queries/cart";
import { useToast } from "src/hooks/useToast";
import { Tables } from "@utils/database.types";

export default function BundleDetailPage() {
  // All hooks must be called unconditionally at the top level
  const params = useParams();
  const bundleId = params.id as string;
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const updateCartMutation = useUpdateCartMutation();

  const {
    data: bundle,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bundle", bundleId],
    queryFn: () => fetchBundleByIdWithProducts(bundleId),
    enabled: !!bundleId,
  });

  const handleAddToCart = () => {
    if (!bundle || !bundle.products) return;

    const itemsToAdd: ItemToUpdateMutation[] = bundle.products.map(
      (product: Tables<"products">) => ({
        product_id: product.id,
        quantity: 1,
        option: null,
        price: product.price || 0,
      })
    );

    updateCartMutation.mutate(itemsToAdd);
  };

  // Conditional returns must come after all hooks
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">Loading bundle details...</div>
    );
  }

  if (error) {
    console.error("Error fetching bundle details:", error);
    return (
      <div className="container mx-auto p-4 text-red-500">
        Error loading bundle details.
      </div>
    );
  }

  if (!bundle) {
    return <div className="container mx-auto p-4">Bundle not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{bundle.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bundle Image and Summary */}
        <div>
          <Card>
            <CardHeader>
              {bundle.thumbnail_url && (
                <div className="relative w-full h-64">
                  <Image
                    src={bundle.thumbnail_url}
                    alt={bundle.name || "Bundle image"}
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded-t-md"
                  />
                </div>
              )}
              {!bundle.thumbnail_url && (
                <div className="w-full h-64 bg-gray-200 rounded-t-md flex items-center justify-center text-gray-500">
                  No Image Available
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">
                  Price: {formatNaira(bundle.price || 0)}
                </h2>
                {bundle.discount_percentage !== null &&
                  bundle.discount_percentage !== undefined && (
                    <p className="text-lg text-green-600">
                      Save {bundle.discount_percentage}%
                    </p>
                  )}
              </div>
              <Button
                className="w-full bg-[#1B6013] hover:bg-[#1B6013]/90"
                onClick={handleAddToCart}
                disabled={updateCartMutation.isPending}
              >
                {updateCartMutation.isPending
                  ? "Adding..."
                  : "Add Bundle to Cart"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Products in Bundle List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Products Included</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundle.products && bundle.products.length > 0 ? (
                    bundle.products.map((product: Tables<"products">) => (
                      <TableRow key={product.id}>
                        <TableCell className="flex items-center gap-3">
                          {product.images?.[0] && (
                            <Image
                              src={product.images[0]}
                              alt={product.name || "Product image"}
                              width={40}
                              height={40}
                              className="rounded"
                            />
                          )}
                          {product.name || "Unknown Product"}
                        </TableCell>
                        <TableCell>{formatNaira(product.price || 0)}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.stock_status === "in_stock"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {product.stock_status?.replace(/_/g, " ") ||
                              "Unknown"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        No products found for this bundle.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
