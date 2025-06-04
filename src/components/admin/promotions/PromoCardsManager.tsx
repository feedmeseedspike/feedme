"use client";

import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useState } from "react";
import Image from "next/image";
import { Trash2, Plus, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";

// Import shadcn components for Calendar, Popover, and Tooltip
import { Calendar } from "@components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/ui/tooltip";
// Import date-fns format function
import { format } from "date-fns";
// Import toast hook
import { useToast } from "../../../hooks/useToast";
// Import debounce for search input
import debounce from "lodash/debounce";

// Import the necessary hooks and types
import {
  usePromotionsQuery,
  useCreatePromotionMutation,
  useDeletePromotionMutation,
  useUpdatePromotionMutation,
  useAddProductToPromotionMutation,
  useRemoveProductFromPromotionMutation,
  useLinkedProductsForPromotionQuery,
  useProductSearchQuery,
} from "../../../queries/promotions";
import { Database } from "src/utils/database.types";
import { z } from "zod";

// const initialPromos = [
//   {
//     id: 1,
//     title: "Riverbite Discount",
//     discount: "10% OFF",
//     oldPrice: 6425,
//     newPrice: 5850,
//     bgColor: "#1B6013",
//     imageUrl: "/images/riverbite.png",
//     tag: "todays-deal",
//   },
//   {
//     id: 2,
//     title: "FeedMe Black Friday",
//     discount: "BEST DEALS",
//     bgColor: "#000000",
//     imageUrl: "/images/fruits.png",
//     countdown: 3 * 24 * 60 * 60,
//     tag: "black-friday",
//   },
//   {
//     id: 3,
//     title: "100% Fresh Fruit",
//     discount: "SUMMER SALE",
//     extraDiscount: "64% OFF",
//     bgColor: "#F0800F",
//     imageUrl: "/images/lemon.png",
//     tag: "fresh-fruits",
//   },
// ];

type Promotion = Database["public"]["Tables"]["promotions"]["Row"];
type PromotionInsert = Database["public"]["Tables"]["promotions"]["Insert"];

// Define Zod schema for the promotion form data
const promotionFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  tag: z
    .string()
    .min(1, { message: "Tag is required." })
    .regex(/^[a-z0-9-]+$/, {
      message: "Tag must be lowercase, alphanumeric, and can include hyphens.",
    }), // Basic tag format validation
  discount_text: z.string().optional().nullable(), // Allow null or undefined from DB
  background_color: z.string().optional().nullable(), // Allow null or undefined from DB
  image_url: z.string().optional().nullable(), // Allow null or undefined from DB
  is_active: z.boolean().default(true).optional(),
  old_price: z
    .preprocess(
      (val) => (val === "" ? null : Number(val)),
      z.nullable(z.number().positive("Must be a positive number.").optional())
    )
    .optional()
    .nullable(), // Allow null or undefined
  new_price: z
    .preprocess(
      (val) => (val === "" ? null : Number(val)),
      z.nullable(z.number().positive("Must be a positive number.").optional())
    )
    .optional()
    .nullable(), // Allow null or undefined
  extra_discount_text: z.string().optional().nullable(), // Allow null or undefined
  countdown_end_time: z
    .preprocess(
      (val) =>
        val === "" || val === null || val === undefined
          ? undefined
          : val instanceof Date
          ? val
          : new Date(val as string),
      z.nullable(z.date().optional())
    )
    .optional()
    .nullable(), // Allow null or undefined
  is_featured_on_homepage: z.boolean().default(true).optional(),
});

type PromotionFormData = z.infer<typeof promotionFormSchema>;

export default function PromoCardsManager() {
  // Use the query hook to fetch promotions, filtered for featured ones
  const {
    data: promotions,
    isLoading,
    error,
  } = usePromotionsQuery({ isFeatured: true });
  // Use the mutation hook for creating promotions
  const {
    mutate: createPromotion,
    isPending: isCreating,
    error: createError,
  } = useCreatePromotionMutation();

  // Use the mutation hook for deleting promotions
  const {
    mutate: deletePromotion,
    isPending: isDeleting,
    error: deleteError,
  } = useDeletePromotionMutation();

  // Use the mutation hook for updating promotions
  const {
    mutate: updatePromotion,
    isPending: isUpdating,
    error: updateError,
  } = useUpdatePromotionMutation();

  // Use the mutation hook for adding a product to a promotion
  const {
    mutate: addProductToPromotion,
    isPending: isAddingProduct,
    error: addProductError,
  } = useAddProductToPromotionMutation();

  // Use the mutation hook for removing a product from a promotion
  const {
    mutate: removeProductFromPromotion,
    isPending: isRemovingProduct,
    error: removeProductError,
  } = useRemoveProductFromPromotionMutation();

  // Use the toast hook
  const { showToast } = useToast();

  // const [promos, setPromos] = useState(initialPromos); // Remove local state for promos
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(
    null
  ); // Use Partial<Promotion>
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // State for delete confirmation modal
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<Promotion | null>(null);

  // State for form data and validation errors
  // Initialize optional fields with undefined to better match form input expectations
  const [newPromoFormData, setNewPromoFormData] = useState<
    Partial<PromotionFormData>
  >({
    title: "",
    tag: "",
    discount_text: undefined,
    background_color: undefined,
    image_url: undefined,
    is_active: true,
    old_price: undefined,
    new_price: undefined,
    extra_discount_text: undefined,
    countdown_end_time: undefined,
    is_featured_on_homepage: true, // Default to true for this manager
  });

  const [formErrors, setFormErrors] = useState<z.ZodIssue[]>([]);
  // State for product search query
  const [productSearchQuery, setProductSearchQuery] = useState("");

  // Debounce the product search query
  const debouncedProductSearch = debounce(setProductSearchQuery, 500);

  // Use the product search query hook
  const {
    data: searchResults,
    isLoading: isSearchingProducts,
    error: productSearchError,
  } = useProductSearchQuery(productSearchQuery);

  // Use the linked products query hook (only run when editing a promo)
  const {
    data: linkedProducts,
    isLoading: isLoadingLinkedProducts,
    error: linkedProductsError,
    refetch: refetchLinkedProducts,
  } = useLinkedProductsForPromotionQuery(editingPromo?.id);

  // Handle adding a product to a promotion
  const handleAddProduct = (productId: string) => {
    if (!editingPromo?.id) return; // Ensure we are editing a promo
    addProductToPromotion(
      {
        promotionId: editingPromo.id.toString(),
        productId: productId,
      },
      {
        onSuccess: () => {
          showToast("Product linked successfully!", "success");
          refetchLinkedProducts(); // Refresh the list of linked products
          setProductSearchQuery(""); // Clear search input after adding
        },
        onError: (err) => {
          console.error("Error linking product:", err);
          showToast(`Failed to link product: ${err.message}`, "error");
        },
      }
    );
  };

  // Handle removing a product from a promotion
  const handleRemoveProduct = (productId: string) => {
    if (!editingPromo?.id) return; // Ensure we are editing a promo
    removeProductFromPromotion(
      {
        promotionId: editingPromo.id.toString(),
        productId: productId,
      },
      {
        onSuccess: () => {
          showToast("Product unlinked successfully!", "success");
          refetchLinkedProducts(); // Refresh the list of linked products
        },
        onError: (err) => {
          console.error("Error unlinking product:", err);
          showToast(`Failed to unlink product: ${err.message}`, "error");
        },
      }
    );
  };

  // Function to handle input changes in the dialog form
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement; // Cast to HTMLInputElement to access checked
    setNewPromoFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Modified handleSave to use Zod validation and the mutation hook
  const handleSave = async () => {
    setFormErrors([]); // Clear previous errors

    // Zod validation will preprocess the date string from the input into a Date object or null/undefined
    const validationResult = promotionFormSchema.safeParse(newPromoFormData);

    if (!validationResult.success) {
      // Validation failed, set errors
      setFormErrors(validationResult.error.issues);
      console.error("Form validation errors:", validationResult.error.issues);
      return; // Stop the submission
    }

    // Validation successful, get the validated data
    const validatedData = validationResult.data;

    // Determine if we are adding or editing
    if (editingPromo?.id) {
      // Prepare data for update, converting Date to ISO string if necessary
      const dataToUpdate = {
        ...validatedData,
        // Convert Date object to ISO string for Supabase timestampz
        countdown_end_time:
          validatedData.countdown_end_time instanceof Date
            ? validatedData.countdown_end_time.toISOString() // Convert Date to ISO string
            : validatedData.countdown_end_time, // Keep null or undefined as is
      };

      // Handle edit logic here using the update mutation
      updatePromotion(
        {
          id: editingPromo.id, // Include the ID for update
          ...dataToUpdate, // Use the prepared data with ISO string date
        },
        {
          onSuccess: () => {
            showToast("Promo updated successfully!", "success");
            closeDialog();
          },
          onError: (err) => {
            console.error("Error updating promo:", err);
            showToast(`Failed to update promo: ${err.message}`, "error");
          },
        }
      );
    } else {
      // Handle add logic using the mutation
      createPromotion(validatedData as PromotionInsert, {
        onSuccess: () => {
          showToast("Promo added successfully!", "success"); // Use toast
          closeDialog();
        },
        onError: (err) => {
          console.error("Error adding promo:", err);
          showToast("Failed to add promo: " + err.message, "error"); // Use toast
        },
      });
    }
  };

  const openDialog = (promo: Partial<Promotion> | null = null) => {
    setFormErrors([]); // Clear errors when opening dialog

    // When opening dialog for adding, clear the form data
    if (!promo) {
      setNewPromoFormData({
        title: "",
        tag: "",
        discount_text: undefined,
        background_color: undefined,
        image_url: undefined,
        is_active: true,
        old_price: undefined,
        new_price: undefined,
        extra_discount_text: undefined,
        countdown_end_time: undefined,
        is_featured_on_homepage: true, // Ensure default is true when adding
      });
    } else {
      // When opening for editing, populate form data
      setNewPromoFormData({
        title: promo.title || "",
        tag: promo.tag || "",
        discount_text: promo.discount_text ?? undefined,
        background_color: promo.background_color ?? undefined,
        image_url: promo.image_url ?? undefined,
        is_active: promo.is_active ?? true,
        old_price: promo.old_price ?? undefined,
        new_price: promo.new_price ?? undefined,
        extra_discount_text: promo.extra_discount_text ?? undefined,
        // Set the state directly to a Date object if promo data exists and has a countdown_end_time
        countdown_end_time: promo.countdown_end_time
          ? new Date(promo.countdown_end_time)
          : undefined,
        is_featured_on_homepage: promo.is_featured_on_homepage ?? true, // Populate from existing or default
      });
    }
    setEditingPromo(promo); // Keep track if we are editing or adding
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPromo(null);
    setFormErrors([]); // Clear errors on close
    // Clear form data on close as well
    setNewPromoFormData({
      title: "",
      tag: "",
      discount_text: undefined,
      background_color: undefined,
      image_url: undefined,
      is_active: true,
      old_price: undefined,
      new_price: undefined,
      extra_discount_text: undefined,
      countdown_end_time: undefined,
      is_featured_on_homepage: true, // Ensure default is true when adding
    });
  };

  // Function to open the delete confirmation modal
  const openDeleteDialog = (promo: Promotion) => {
    setPromoToDelete(promo);
    setIsDeleteDialogOpen(true);
  };

  // Function to close the delete confirmation modal
  const closeDeleteDialog = () => {
    setPromoToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  // Function to handle the actual deletion
  const handleDelete = () => {
    if (promoToDelete) {
      deletePromotion(promoToDelete.id.toString(), {
        // Use the delete mutation
        onSuccess: () => {
          showToast(
            `Promo &quot;${promoToDelete.title}&quot; deleted successfully!`,
            "success"
          );
          closeDeleteDialog();
        },
        onError: (err) => {
          console.error("Error deleting promo:", err);
          showToast(`Failed to delete promo: ${err.message}`, "error");
          closeDeleteDialog(); // Close dialog even on error
        },
      });
    }
  };

  // Helper to find validation error for a specific field
  const findFormError = (fieldName: keyof PromotionFormData) => {
    return formErrors.find((err) => err.path.join(".") === fieldName);
  };

  // Handle loading and error states from the query
  if (isLoading) {
    return <div>Loading promo cards...</div>; // Or a skeleton
  }

  if (error) {
    console.error("Error fetching promo cards:", error);
    return <div>Error loading promo cards.</div>;
  }

  // Ensure promotions data is an array
  const promotionList = promotions || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Promotional Cards</h2>
        {/* Modified to pass null to openDialog for adding new */}
        <Button onClick={() => openDialog(null)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Promo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Map over the data from the query */}
        {promotionList.map((promo) => (
          <Card key={promo.id} className="overflow-hidden">
            <div 
              className="h-40 relative" 
              style={{ backgroundColor: promo.background_color || "#ffffff" }} // Use background_color from DB
            >
              <Image
                src={promo.image_url || "/images/placeholder.png"} // Use image_url from DB or placeholder
                alt={promo.title || "Promo image"}
                fill
                className="object-contain"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg">{promo.title}</h3>
              {/* Display data from the database */}
              {promo.discount_text && (
                <p className="text-sm text-gray-500">{promo.discount_text}</p>
              )}
              {promo.old_price !== null && promo.new_price !== null && (
                <p className="text-sm">
                  Price:{" "}
                  <span className="line-through">${promo.old_price}</span> $
                  {promo.new_price}
                </p>
              )}
              {promo.extra_discount_text && (
                <p className="text-sm">
                  Extra discount: {promo.extra_discount_text}
                </p>
              )}
              {promo.countdown_end_time !== null && (
                <p className="text-sm">Has countdown timer</p>
              )}
              <p className="text-sm">Tag: {promo.tag}</p>
              
              <div className="flex justify-end gap-2 mt-4">
                {/* Keep Edit/Delete placeholders for now */}
                <Button variant="outline" onClick={() => openDialog(promo)}>
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    // Open the delete confirmation modal
                    openDeleteDialog(promo);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog for Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md lg:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingPromo?.id ? "Edit Promo" : "Add New Promo"}
            </DialogTitle>
            <DialogDescription>
              {editingPromo?.id
                ? "Edit the promotional card."
                : "Fill in the details for the new promotional card."}
            </DialogDescription>
          </DialogHeader>
          {/* Added scrolling and max height to the form container */}
          <div className="space-y-4 py-4 overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* Wrap form fields with TooltipProvider */}
            <TooltipProvider>
              <div className="space-y-2">
                {/* Wrap label and input with TooltipTrigger and TooltipContent */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="title">Title</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The main title of the promotional card.</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="title"
                  name="title" // Add name attribute
                  value={newPromoFormData.title}
                  onChange={handleInputChange}
                  required
                />
                {/* Display validation error */}
                {findFormError("title") && (
                  <p className="text-red-500 text-sm">
                    {findFormError("title")?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="tag">Tag (URL path)</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      A unique identifier for the promotion, used in URLs
                      (lowercase, alphanumeric, hyphens only).
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="tag"
                  name="tag" // Add name attribute
                  value={newPromoFormData.tag}
                  onChange={handleInputChange}
                  required
                />
                {/* Display validation error */}
                {findFormError("tag") && (
                  <p className="text-red-500 text-sm">
                    {findFormError("tag")?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="discount_text">Discount Text</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Text displaying the discount (e.g., &quot;10% OFF&quot;,
                      &quot;BEST DEALS&quot;).
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="discount_text"
                  name="discount_text" // Add name attribute
                  value={newPromoFormData.discount_text ?? ""} // Use nullish coalescing to handle null/undefined
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="background_color">Background Color</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      The background color for the promotional card (e.g., hex
                      code or color name).
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="background_color"
                  name="background_color" // Add name attribute
                  type="text" // Keep as text input for hex code or name
                  value={newPromoFormData.background_color ?? ""} // Use nullish coalescing
                  onChange={handleInputChange}
                  // Consider adding a color picker UI component here
                />
              </div>

            <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="image_url">Image URL</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The URL of the image for the promotional card.</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="image_url"
                  name="image_url" // Add name attribute
                  value={newPromoFormData.image_url ?? ""} // Use nullish coalescing
                  onChange={handleInputChange}
                />
                {/* You might want a more robust image upload solution here */}
            </div>
            
            <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="old_price">Old Price</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The original price of the product (optional).</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="old_price"
                  name="old_price"
                  type="number" // Use number type for price
                  step="0.01"
                  value={newPromoFormData.old_price ?? ""} // Use empty string for undefined/null in input
                  onChange={handleInputChange}
                />
                {findFormError("old_price") && (
                  <p className="text-red-500 text-sm">
                    {findFormError("old_price")?.message}
                  </p>
                )}
            </div>
            
            <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="new_price">New Price</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The discounted price of the product (optional).</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="new_price"
                  name="new_price"
                  type="number"
                  step="0.01"
                  value={newPromoFormData.new_price ?? ""}
                  onChange={handleInputChange}
                />
                {findFormError("new_price") && (
                  <p className="text-red-500 text-sm">
                    {findFormError("new_price")?.message}
                  </p>
                )}
            </div>
            
            <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="extra_discount_text">
                      Extra Discount Text
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Additional text for extra discounts (e.g., &quot;64%
                      OFF&quot;) (optional).
                    </p>
                  </TooltipContent>
                </Tooltip>
              <Input 
                  id="extra_discount_text"
                  name="extra_discount_text"
                  value={newPromoFormData.extra_discount_text ?? ""} // Use nullish coalescing
                  onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="countdown_end_time">
                      Countdown End Time
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      The date and time when the promotion countdown ends
                      (optional).
                    </p>
                  </TooltipContent>
                </Tooltip>
                {/* Replace datetime-local input with Calendar in Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={
                        "w-full justify-start text-left font-normal " +
                        (!newPromoFormData.countdown_end_time &&
                          "text-muted-foreground")
                      }
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {newPromoFormData.countdown_end_time instanceof Date
                        ? format(newPromoFormData.countdown_end_time, "PPP")
                        : newPromoFormData.countdown_end_time // Display string value if it's not a Date
                        ? String(newPromoFormData.countdown_end_time) // Ensure it's treated as string if not Date/null/undefined
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        newPromoFormData.countdown_end_time instanceof Date
                          ? newPromoFormData.countdown_end_time
                          : undefined
                      }
                      onSelect={(date) => {
                        // Update state with the selected date (or undefined if nullified)
                        setNewPromoFormData((prevState) => ({
                          ...prevState,
                          countdown_end_time:
                            date === undefined ? undefined : date, // Store as Date or undefined
                        }));
                      }}
                      initialFocus
                    />
                    {/* Optional: Add a time picker input here if needed */}
                    {/* For example: */}
                    {/* <Input type="time" value={...} onChange={...} /> */}
                  </PopoverContent>
                </Popover>
                {findFormError("countdown_end_time") && (
                  <p className="text-red-500 text-sm">
                    {findFormError("countdown_end_time")?.message}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* Wrapping input in label for accessibility, tooltip on label */}
                    <Label htmlFor="is_active">Is Active</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle if the promotion is currently active.</p>
                  </TooltipContent>
                </Tooltip>
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active" // Add name attribute
                  checked={newPromoFormData.is_active ?? true} // Default to true
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
              </div>
            </TooltipProvider>

            {/* New section for Product Linking */}
            {editingPromo?.id && ( // Only show this section when editing a promo
              <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold">Linked Products</h3>

                {/* Product Search Input */}
                <div className="space-y-2">
                  <Label htmlFor="product-search">
                    Search Products to Link
                  </Label>
                  <Input
                    id="product-search"
                    placeholder="Search by product name..."
                    value={productSearchQuery}
                    onChange={(e) => debouncedProductSearch(e.target.value)}
                  />
                </div>

                {/* Display Search Results */}
                <div>
                  {isSearchingProducts && <p>Searching...</p>}
                  {productSearchError && (
                    <p className="text-red-500">Error searching products.</p>
                  )}
                  {searchResults && searchResults.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      <h4 className="font-medium">Search Results</h4>
                      {searchResults.map(
                        (
                          product: any // TODO: Add proper product type
                        ) => (
                          <div
                            key={product.id}
                            className="flex justify-between items-center border-b pb-2"
                          >
                            <span>{product.name}</span>
                            {/* Add 'Add' button here in the next step */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddProduct(product.id)}
                            >
                              Add
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                  {searchResults &&
                    searchResults.length === 0 &&
                    productSearchQuery && (
                      <p className="text-gray-500 text-sm">
                        No products found for &quot;{productSearchQuery}&quot;.
                      </p>
                    )}
                  {!productSearchQuery && (
                    <p className="text-gray-500 text-sm">
                      Start typing to search for products.
                    </p>
                  )}
                </div>

                {/* Display Linked Products */}
                <div className="space-y-2 mt-4">
                  <h4 className="font-medium">Currently Linked Products</h4>
                  {isLoadingLinkedProducts && <p>Loading linked products...</p>}
                  {linkedProductsError && (
                    <p className="text-red-500">
                      Error loading linked products.
                    </p>
                  )}
                  <div>
                    {linkedProducts && linkedProducts.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {linkedProducts.map(
                          (
                            product: any // TODO: Add proper product type
                          ) => (
                            <div
                              key={product.id}
                              className="flex justify-between items-center border-b pb-2"
                            >
                              <span>{product.name}</span>
                              {/* Add 'Remove' button here in the next step */}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveProduct(product.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          )
                        )}
                  </div>
                ) : (
                      <p className="text-gray-500 text-sm">
                        No products linked to this promotion yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            {/* Use isCreating to disable the button during submission */}
            <Button onClick={handleSave} disabled={isCreating}>
              {isCreating
                ? "Saving..."
                : editingPromo?.id
                ? "Save Changes"
                : "Add Promo"}
            </Button>
          </DialogFooter>
          {createError && (
            <div className="text-red-600 mt-2">
              Error: {createError.message}
            </div>
          )}
          {/* Display delete error if any */}
          {deleteError && (
            <div className="text-red-600 mt-2">
              Error: {deleteError.message}
            </div>
          )}
          {/* Display update error if any */}
          {updateError && (
            <div className="text-red-600 mt-2">
              Error: {updateError.message}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the promotional card &quot;
              {promoToDelete?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Removed the second "Save All Changes" button as changes are saved per promo add/edit */}
      {/* <div className={&quot;flex justify-end&quot;}> */}
      {/*   <Button onClick={handleSave}>Save All Changes</Button> */}
      {/* </div> */}
    </div>
  );
}
