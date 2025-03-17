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

// export const OptionSchema = z.object({
//   name: z.string().min(1, "Option name is required"), // Example: "1kg", "500g"
//   price: Price("Option price"),
//   image: z.string().url("Invalid image URL"),
// });

export const OptionSchema = z.object({
  name: z.string().min(1, "Option name is required"),
  price: z
  .number({
    invalid_type_error: "Price must be a number",
    required_error: "Price is required",
  })
  .min(50, "Price must be at least ₦50"),
  stockStatus: z.enum(["In Stock", "Out of Stock"], {
    required_error: "Stock status is required",
  }),
  image: z
    .instanceof(File, { message: "Image is required" })
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "Image must be less than 5MB",
    })
    .refine((file) => file.type.startsWith("image/"), {
      message: "Only image files are allowed",
    }),
});

export type OptionType = z.infer<typeof OptionSchema>;


// Order Item
export const OrderItemSchema = z.object({
  _id: z.string().optional(),
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
  .optional(),
  // .nonnegative("Count in stock must be a non-negative number"),
  image: z.string().url("Invalid image URL"), 
  price: Price("Price"),
  color: z.string().optional(),
  options: z.array(OptionSchema).optional().default([]),
});

export const ShippingAddressSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  street: z.string().min(1, "Address is required"),
  // city: z.string().min(1, "City is required"),
  phone: z.string().min(1, "Phone number is required"),
  location: z.string().min(1, "Please select a location"),
});
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
  helpfulCount: z.number().default(0), // Track how many users found the review helpful
  reports: z.array(z.string()).default([]), // Store reasons for reports
});



export const ProductInputSchema = z.object({
  _id: z.string().optional(), 
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
  stockStatus: z.enum(["In Stock", "Out of Stock"], {
    required_error: "Stock status is required",
  }),
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
    countInStock: z.coerce.number().int().optional(),
  description: z.string().min(1, "Description is required"),
  colors: z.array(z.string()).default([]),
  options: z.array(OptionSchema).default([]), // Supports multiple product variants
  reviews: z.array(ReviewInputSchema).default([]),
});

// USER
const UserName = z
  .string()
  .min(2, { message: 'Username must be at least 2 characters' })
  .max(50, { message: 'Username must be at most 30 characters' })
const Email = z.string().min(1, 'Email is required').email('Email is invalid')
const Password = z.string().min(3, 'Password must be at least 3 characters')
const UserRole = z.string().min(1, 'role is required')

export const UserUpdateSchema = z.object({
  _id: MongoId,
  name: UserName,
  email: Email,
  role: UserRole,
})

export const UserInputSchema = z.object({
  name: UserName,
  email: Email,
  image: z.string().optional(),
  emailVerified: z.boolean(),
  role: UserRole,
  password: Password,
  paymentMethod: z.string().min(1, 'Payment method is required'),
  address: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    province: z.string().min(1, 'Province is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
    phone: z.string().min(1, 'Phone number is required'),
  }),
})

export const UserSignInSchema = z.object({
  email: Email,
  password: Password,
})
export const UserSignUpSchema = UserSignInSchema.extend({
  name: UserName,
  confirmPassword: Password,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
export const UserNameSchema = z.object({
  name: UserName,
})

export const ProductUpdateSchema = ProductInputSchema.extend({
  _id: z.string().optional(),
});


export type Product = z.infer<typeof ProductInputSchema>;
export type option = z.infer<typeof OptionSchema>;
export type ProductOption = z.infer<typeof OptionSchema>;
