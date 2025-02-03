import { z } from "zod";

const MongoId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: "Invalid MongoDB ID" });

const Price = (field: string) =>
  z.coerce
    .number()
    .int()
    .refine((value) => value > 0, `${field} must be a whole number greater than zero`);

  export const ReviewInputSchema = z.object({
    product: MongoId,
    user: MongoId,
    isVerifiedPurchase: z.boolean(),
    title: z.string().min(1, 'Title is required'),
    comment: z.string().min(1, 'Comment is required'),
    rating: z.coerce
      .number()
      .int()
      .min(1, 'Rating must be at least 1')
      .max(5, 'Rating must be at most 5'),
  })

const OptionSchema = z.object({
  name: z.string().min(1, "Option name is required"), // Example: "1kg", "500g"
  price: Price("Option price"),
  image: z.string().url("Invalid image URL"),
  countInStock: z
    .coerce
    .number()
    .int()
    .nonnegative("Stock must be a non-negative number"),
});

export const ProductInputSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  category: MongoId,
  images: z.array(z.string().url("Invalid image URL")).min(1, "At least one image is required"),
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean(),
  price: Price("Price"),
  listPrice: Price("List price"),
  brand: z.string().min(1, "Brand is required"),
  avgRating: z.coerce.number().min(0).max(5, "Rating must be between 0 and 5"),
  numReviews: z.coerce.number().int().nonnegative("Number of reviews must be non-negative"),
  ratingDistribution: z
    .array(z.object({ rating: z.number(), count: z.number() }))
    .max(5),
  numSales: z.coerce.number().int().nonnegative("Number of sales must be non-negative"),
  countInStock: z.coerce.number().int().nonnegative("Count in stock must be non-negative"),
  description: z.string().min(1, "Description is required"),
  colors: z.array(z.string()).default([]),
  options: z.array(OptionSchema).default([]), // Supports multiple product variants
  reviews: z.array(ReviewInputSchema).default([]),
});

export const ProductUpdateSchema = ProductInputSchema.extend({
  _id: z.string(),
})

export type Product = z.infer<typeof ProductInputSchema>;
export type ProductOption = z.infer<typeof OptionSchema>;
