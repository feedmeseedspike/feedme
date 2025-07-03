"use client";

import { Separator } from "@components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { fetchOrderById } from "src/queries/orders";
import { formatNaira } from "src/lib/utils";
import { Badge } from "@components/ui/badge";
import { useUser } from "src/hooks/useUser";
import { useCreateUpdateReviewMutation } from "src/queries/reviews";
import { z } from "zod";
import { ReviewInputSchema } from "src/lib/validator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Button } from "@components/ui/button";
import { useToast } from "src/hooks/useToast";
import { Star, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@utils/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Label } from "@components/ui/label";
import { Tables, Json } from "src/utils/database.types"; // Added import for Tables and Json

type FetchedOrderDetails = Tables<"orders"> & {
  order_items: (Tables<"order_items"> & {
    products: Tables<"products"> | null;
    bundles: Tables<"bundles"> | null;
  })[];
};

const OrderConfirmation = () => {
  const userObj = useUser();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [orderDetails, setOrderDetails] = useState<FetchedOrderDetails | null>(
    null
  );
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  let normalizedUser = userObj.user as { id?: string; user_id?: string } | null;
  if (normalizedUser && !normalizedUser.id && normalizedUser.user_id) {
    normalizedUser = { ...normalizedUser, id: normalizedUser.user_id };
  }
  const normalizedUserId = normalizedUser?.id ?? "";

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError("Order ID not found in URL.");
        setLoading(false);
        return;
      }
      try {
        const result = await fetchOrderById(orderId);
        setOrderDetails(result);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!orderDetails?.id) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("order_id", orderDetails.id)
        .single();
      if (!error) setTransaction(data);
    };
    fetchTransaction();
  }, [orderDetails?.id]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto text-center">
        Loading order details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto text-center">
        No order details found.
      </div>
    );
  }

  const items: any[] = orderDetails.order_items || [];
  const subtotal = items.reduce((acc: number, item: any) => {
    const itemPrice =
      (item.option?.price !== undefined && item.option?.price !== null
        ? item.option.price
        : item.price) || 0;
    return acc + itemPrice * item.quantity;
  }, 0);

  const deliveryFee =
    orderDetails.delivery_fee !== undefined &&
    orderDetails.delivery_fee !== null
      ? orderDetails.delivery_fee
      : 0;
  const voucherDiscount = 0;
  const totalAmountPaid =
    orderDetails.total_amount_paid || subtotal + deliveryFee - voucherDiscount;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="grid justify-center items-center">
        <Image
          src="/order-confirmation.gif"
          width={150}
          height={150}
          alt="Order Confirmation"
          className="mx-auto mb-4 rounded-full border-4 border-green-200 shadow-lg"
          priority
        />
        <h1 className="text-2xl md:text-3xl font-bold md:mb-2 text-center text-green-900">
          Your order is completed!
        </h1>
        <p className="mb-8 text-sm text-gray-500 text-center">
          Thank you. Your Order has been received.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 bg-[#1B6013] w-full rounded-md px-6 py-4 text-white mb-6 gap-4">
        <div className="grid gap-2 text-center md:text-left">
          <p className="font-semibold text-xs md:text-sm text-gray-300">
            Order ID
          </p>
          <p className="text-sm md:text-base font-mono tracking-wider">
            {orderDetails.id?.slice(-8)}
          </p>
        </div>
        <div className="grid gap-2 text-center md:text-left">
          <p className="font-semibold text-xs md:text-sm text-gray-300">
            Payment Method
          </p>
          <p className="text-sm md:text-base capitalize">
            {orderDetails.payment_method}
          </p>
        </div>
        <div className="grid gap-2 text-center md:text-left">
          <p className="font-semibold text-xs md:text-sm text-gray-300">
            Transaction ID
          </p>
          <p className="text-sm md:text-base font-mono tracking-wider">
            {transaction?.transaction_id || transaction?.reference || "N/A"}
          </p>
        </div>
        <div className="grid gap-2 text-center md:text-left">
          <p className="font-semibold text-xs md:text-sm text-gray-300">
            Total Amount
          </p>
          <p className="text-sm md:text-base font-bold">
            {formatNaira(totalAmountPaid)}
          </p>
        </div>
      </div>

      <div className="grid gap-2 px-4 pb-4 border shadow-sm mt-6 rounded-md">
        <div>
          <h2 className="text-md font-semibold py-4">Order Details</h2>
          <Separator />
          <Table className="border-none">
            <TableHeader>
              <TableRow className="text-base border-b-0">
                <TableHead className="font-semibold">Products</TableHead>
                <TableHead className="font-semibold">Quantity</TableHead>
                <TableHead className="flex justify-end items-center font-bold">
                  Price
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: any) => {
                console.log("Order Confirmation Item:", item);
                return (
                  <TableRow key={item.id} className="border-b-0">
                    <TableCell className="border-b-0 flex items-center gap-2">
                      <Image
                        src={
                          Array.isArray(item.products?.images) &&
                          item.products?.images?.[0]
                            ? item.products.images[0]
                            : item.bundles?.thumbnail_url || "/placeholder.png"
                        }
                        alt={item.products?.name || item.bundles?.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                      <span>{item.products?.name || item.bundles?.name}</span>
                    </TableCell>
                    <TableCell className="border-b-0 text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="border-b-0 text-right">
                      {formatNaira(
                        (item.option?.price !== undefined &&
                        item.option?.price !== null
                          ? item.option.price
                          : item.price) || 0
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div>
          <Separator className="my-4" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatNaira(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>{formatNaira(deliveryFee)}</span>
            </div>
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Voucher Discount</span>
                <span>-{formatNaira(voucherDiscount)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatNaira(totalAmountPaid)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {orderDetails.status === "order delivered" ? (
          <>
            <h2 className="text-xl md:text-2xl font-bold mb-4">
              Rate Your Products
            </h2>
            {items.length === 0 ? (
              <p className="text-gray-500">No products to review.</p>
            ) : (
              items.map((item: any) => (
                <ProductReviewForm
                  key={item.id}
                  product={item.products || item.bundles}
                  userId={normalizedUserId}
                />
              ))
            )}
          </>
        ) : (
          <div className="text-center text-gray-500">
            You can rate your products after your order is delivered.
          </div>
        )}
      </div>
    </div>
  );
};

interface ProductReviewFormProps {
  product: any;
  userId: string | undefined;
  initialReview?: any;
}

const ProductReviewForm: React.FC<ProductReviewFormProps> = ({
  product,
  userId,
  initialReview,
}) => {
  const { showToast } = useToast();
  const router = useRouter();
  const createUpdateReviewMutation = useCreateUpdateReviewMutation();
  const [rating, setRating] = useState(initialReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);

  const supabase = createClient();

  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(
    initialReview?.image_urls || []
  );
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>(
    initialReview?.image_urls || []
  );

  const form = useForm<z.infer<typeof ReviewInputSchema>>({
    resolver: zodResolver(ReviewInputSchema),
    defaultValues: {
      product: product?.id || "",
      title: initialReview?.title || "",
      comment: initialReview?.comment || "",
      rating: initialReview?.rating || 0,
      isVerifiedPurchase: true,
      image_urls: [],
    },
  });

  useEffect(() => {
    if (product?.id) {
      form.setValue("product", product.id);
    }
    if (initialReview) {
      form.setValue("title", initialReview.title || "");
      form.setValue("comment", initialReview.comment || "");
      setRating(initialReview.rating || 0);
      setExistingImageUrls(initialReview.image_urls || []);
      setOriginalImageUrls(initialReview.image_urls || []);
    }
  }, [product?.id, initialReview, form]);

  const handleDeleteExistingImage = (imageUrlToDelete: string) => {
    setExistingImageUrls((prev) =>
      prev.filter((url) => url !== imageUrlToDelete)
    );
  };

  const onSubmit = async (values: z.infer<typeof ReviewInputSchema>) => {
    if (!userId) {
      showToast("You must be logged in to leave a review.", "error");
      return;
    }
    if (rating === 0) {
      showToast("Please select a star rating.", "error");
      return;
    }

    try {
      let imageUrls: string[] = [];
      if (selectedImageFiles.length > 0) {
        setUploadingImage(true);
        try {
          const uploadPromises = selectedImageFiles.map(async (file) => {
            const fileExt = file.name.split(".").pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `review_images/${fileName}`;

            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("review-images")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const {
              data: { publicUrl },
            } = supabase.storage.from("review-images").getPublicUrl(filePath);

            return publicUrl;
          });

          imageUrls = await Promise.all(uploadPromises);
        } catch (uploadError: any) {
          showToast(`Image upload failed: ${uploadError.message}`, "error");
          console.error("Upload error:", uploadError);
          setUploadingImage(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      const combinedImageUrls = [...existingImageUrls, ...imageUrls];

      const result = await createUpdateReviewMutation.mutateAsync({
        data: {
          ...values,
          rating,
          slug: product.slug,
          image_urls: combinedImageUrls,
        },
        userId,
      });

      if (result.success) {
        const imagesToDelete = originalImageUrls.filter(
          (url) => !existingImageUrls.includes(url)
        );

        if (imagesToDelete.length > 0) {
          try {
            const filePathsToDelete = imagesToDelete.map((url) => {
              const urlParts = url.split("/");
              const fileName = urlParts.pop();
              const folderName = urlParts.pop();
              return `${folderName}/${fileName}`;
            });

            const { error: deleteError } = await supabase.storage
              .from("review-images")
              .remove(filePathsToDelete);

            if (deleteError) throw deleteError;
          } catch (deleteError: any) {
            console.error("Error deleting images:", deleteError);
          }
        }

        showToast(result.message, "success");
        form.reset();
        setRating(0);
        setSelectedImageFiles([]);
        setExistingImageUrls([]);
        setOriginalImageUrls([]);
      } else {
        showToast(result.message || "Failed to submit review.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "An unexpected error occurred.", "error");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-3">Review {product?.name}</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <FormLabel className="text-gray-700">Rating</FormLabel>
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                  <Star
                    key={starValue}
                    className={`cursor-pointer ${
                      starValue <= (hoverRating || rating)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                    }`}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    size={24}
                  />
                );
              })}
            </div>
            {form.formState.errors.rating && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.rating.message}
              </p>
            )}
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">
                  Review Title (Optional)
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Great product!" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">Your Review</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write your review here..."
                    {...field}
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label htmlFor="image">Upload Image(s) (Optional - Max 3)</Label>
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  const filesArray = Array.from(e.target.files).slice(
                    0,
                    3 - existingImageUrls.length
                  );
                  setSelectedImageFiles(filesArray);
                } else {
                  setSelectedImageFiles([]);
                }
              }}
              disabled={
                uploadingImage ||
                createUpdateReviewMutation.isPending ||
                existingImageUrls.length + selectedImageFiles.length >= 3
              }
            />
            {existingImageUrls.length > 0 && (
              <div className="mt-2 flex gap-2">
                {existingImageUrls.map(
                  (imageUrl, index) =>
                    imageUrl && (
                      <div
                        key={`existing-${index}`}
                        className="relative h-24 w-24 overflow-hidden rounded-md border bg-gray-100 flex items-center justify-center group"
                      >
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={`Existing review image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        ) : null}
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteExistingImage(imageUrl)}
                          disabled={createUpdateReviewMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )
                )}
              </div>
            )}
            {selectedImageFiles.length > 0 && (
              <div className="mt-2 flex gap-2">
                {selectedImageFiles.map((file, index) => (
                  <div
                    key={`selected-${index}`}
                    className="relative h-24 w-24 overflow-hidden rounded-md border bg-gray-100 flex items-center justify-center"
                  >
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Selected review image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={createUpdateReviewMutation.isPending || uploadingImage}
          >
            {createUpdateReviewMutation.isPending || uploadingImage
              ? "Submitting..."
              : "Submit Review"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default OrderConfirmation;
