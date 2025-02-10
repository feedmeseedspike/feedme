import { z } from "zod";

const MongoId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid MongoDB ID" });

const Price = (field: string) =>
  z.coerce
    .number()
    .int()
    .refine(
      (value) => value > 0,
      `${field} must be a whole number greater than zero`
    );

const OptionSchema = z.object({
  name: z.string().min(1, "Option name is required"), // Example: "1kg", "500g"
  price: Price("Option price"),
  image: z.string().url("Invalid image URL"),
  countInStock: z.coerce
    .number()
    .int()
    .nonnegative("Stock must be a non-negative number"),
});


// Order Item
export const OrderItemSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  product: MongoId,
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  category: MongoId, 
  quantity: z.coerce
  .number()
  .int()
  .nonnegative("Quantity must be a non-negative number"),
  countInStock: z.coerce
  .number()
  .int()
  .nonnegative("Count in stock must be a non-negative number"),
  image: z.string().url("Invalid image URL"), 
  price: Price("Price"),
  color: z.string().optional(),
  options: z.array(OptionSchema).default([]),
});

export const ShippingAddressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  street: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  province: z.string().min(1, 'Province is required'),
  phone: z.string().min(1, 'Phone number is required'),
  country: z.string().min(1, 'Country is required'),
})
// Cart

export const CartSchema = z.object({
  items: z
    .array(OrderItemSchema)
    .min(1, 'Order must contain at least one item'),
  itemsPrice: z.number(),
  taxPrice: z.optional(z.number()),
  shippingPrice: z.optional(z.number()),
  totalPrice: z.number(),
  paymentMethod: z.optional(z.string()),
  shippingAddress: z.optional(ShippingAddressSchema),
  deliveryDateIndex: z.optional(z.number()),
  expectedDeliveryDate: z.optional(z.date()),
})
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const ReviewInputSchema = z.object({
  product: MongoId,
  user: MongoId,
  isVerifiedPurchase: z.boolean(),
  title: z.string().min(1, "Title is required"),
  comment: z.string().min(1, "Comment is required"),
  rating: z.coerce
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
});


export const ProductInputSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  category: MongoId,
  images: z
    .array(z.string().url("Invalid image URL"))
    .min(1, "At least one image is required"),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean(),
  price: Price("Price"),
  listPrice: Price("List price"),
  brand: z.string().min(1, "Brand is required"),
  avgRating: z.coerce.number().min(0).max(5, "Rating must be between 0 and 5"),
  numReviews: z.coerce
    .number()
    .int()
    .nonnegative("Number of reviews must be non-negative"),
  ratingDistribution: z
    .array(z.object({ rating: z.number(), count: z.number() }))
    .max(5),
  numSales: z.coerce
    .number()
    .int()
    .nonnegative("Number of sales must be non-negative"),
  countInStock: z.coerce
    .number()
    .int()
    .nonnegative("Count in stock must be non-negative"),
  description: z.string().min(1, "Description is required"),
  colors: z.array(z.string()).default([]),
  options: z.array(OptionSchema).default([]), // Supports multiple product variants
  reviews: z.array(ReviewInputSchema).default([]),
});

export const ProductUpdateSchema = ProductInputSchema.extend({
  _id: z.string(),
});

export type Product = z.infer<typeof ProductInputSchema>;
export type ProductOption = z.infer<typeof OptionSchema>;
