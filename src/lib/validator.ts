import { array, z } from "zod";

// ======================
// Base Schemas
// ======================
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

// ======================
// Vendor Schemas 
// ======================
const VendorContactSchema = z.object({
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
});

const VendorBaseSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  shopId: z.string().min(1, "Shop ID is required")
    .regex(/^Shop\d+$/, "Shop ID must start with 'Shop' followed by numbers"),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().min(1, "Description is required").max(500),
  logo: z.string().url("Invalid logo URL"),
  contact: VendorContactSchema,
});

export const VendorSchema = VendorBaseSchema.extend({
  _id: MongoId,
  userId: MongoId,
  rating: z.coerce.number().min(0).max(5).default(0),
  numReviews: z.coerce.number().int().nonnegative().default(0),
  ratingDistribution: z
    .array(
      z.object({
        rating: z.number().min(1).max(5),
        count: z.number().nonnegative(),
      })
    )
    .length(5)
    .optional(),
  isVerified: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  products: z.array(MongoId).default([]),
}).optional();

export const VendorReferenceSchema = z.object({
  id: MongoId,
  shopId: z.string().min(1),
  displayName: z.string().min(1),
  logo: z.string().url().optional(),
});

export type VendorType = z.infer<typeof VendorSchema>;
export type VendorReference = z.infer<typeof VendorReferenceSchema>;

// ======================
// Option Schema
// ======================
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
  }).optional(),
  image: z.union([
    z.instanceof(File, { message: "Image is required" })
      .refine((file) => file.size <= 5 * 1024 * 1024, {
        message: "Image must be less than 5MB",
      })
      .refine((file) => file.type.startsWith("image/"), {
        message: "Only image files are allowed",
      }),
    z.string().url("Invalid image URL")
  ]),
});

export type OptionType = z.infer<typeof OptionSchema>;

// ======================
// Order Schemas
// ======================
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
  image: z.string().url("Invalid image URL"),
  price: Price("Price"),
  color: z.string().optional(),
  options: z.array(OptionSchema).optional().default([]),
  selectedOption: z.string().optional(),
  vendor: VendorReferenceSchema, // Standardized vendor reference
});

export const ShippingAddressSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  street: z.string().min(5, "Street address must be at least 5 characters"),
  location: z.string().min(1, "Please select a location"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
});

// ======================
// Cart Schemas
// ======================
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
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

// ======================
// Product Schemas
// ======================
export const ProductInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  category: array(z.string()),
  images: z
    .array(z.string().url("Invalid image URL"))
    .min(1, "At least one image is required"),
  tags: z.array(z.string()).default([]),
  is_published: z.boolean(),
  price: Price("Price"),
  list_price: Price("List price"),
  stockStatus: z.any().optional(),
  brand: z.string().min(1, "Brand is required"),
  vendor: VendorReferenceSchema, // Standardized vendor reference
  avg_rating: z.coerce.number().min(0).max(5, "Rating must be between 0 and 5"),
  num_reviews: z.coerce
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
  options: z.array(OptionSchema).default([]),
  reviews: z.array(z.any()).default([]),
});

export const ProductUpdateSchema = ProductInputSchema.extend({
  _id: z.string().optional(),
});

// ======================
// User Schemas
// ======================
const UserName = z
  .string()
  .min(2, { message: 'Username must be at least 2 characters' })
  .max(50, { message: 'Username must be at most 50 characters' });

const Email = z.string().min(1, 'Email is required').email('Email is invalid');
const Password = z.string().min(3, 'Password must be at least 3 characters');

const UserRole = z.enum(['customer', 'vendor', 'admin'], {
  required_error: 'Role is required',
  invalid_type_error: 'Role must be either customer, vendor, or admin',
});

const AddressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  province: z.string().min(1, 'Province is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().min(1, 'Phone number is required'),
});

export const UserUpdateSchema = z.object({
  _id: MongoId,
  name: UserName,
  email: Email,
  role: UserRole,
});

export const UserInputSchema = z.object({
  name: UserName,
  email: Email,
  image: z.string().optional(),
  emailVerified: z.boolean().optional().default(false),
  role: UserRole,
  password: Password,
  vendorInfo: VendorBaseSchema.optional(),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  address: AddressSchema,
}).refine(
  (data) => data.role !== 'vendor' || data.vendorInfo,
  {
    message: 'Vendor info is required for vendor role',
    path: ['vendorInfo'],
  }
);

export const UserSignInSchema = z.object({
  email: Email,
  password: Password,
});

export const UserSignUpSchema = UserSignInSchema.extend({
  name: UserName,
  confirmPassword: Password,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const UserNameSchema = z.object({
  name: UserName,
});

// ======================
// Review Schema
// ======================
export const ReviewInputSchema = z.object({
  product: z.string().min(1, "Product ID is required"),
  user: z.string().min(1, "User ID is required"),
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters"),
  comment: z.string()
    .min(10, "Comment must be at least 10 characters")
    .max(1000, "Comment cannot exceed 1000 characters"),
  rating: z.number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  isVerifiedPurchase: z.boolean().default(true),
  helpfulCount: z.number().default(0).optional(),
  reports: z.array(z.string()).default([]).optional()
});
// ======================
// User 
// ======================
export const UserProfileSchema = z.object({
  display_name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  phone: z.string()
    .regex(/^[0-9]{10,15}$/, "Phone number must be 10-15 digits")
    .optional()
    .or(z.literal("")),
  address: z.string()
    .max(100, "Address cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  role: z.enum(["buyer", "seller", "admin"]),
  avatar: z.instanceof(File)
    .refine(file => file.size <= 5_000_000, "File size must be less than 5MB")
    .refine(
      file => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "Only .jpg, .png, and .webp formats are supported"
    )
    .optional()
    .or(z.literal("")),
});

// ======================
// Type Exports
// ======================
export type Products = z.infer<typeof ProductUpdateSchema>;
export type Product = z.infer<typeof ProductInputSchema>;
export type option = z.infer<typeof OptionSchema>;
export type ProductOption = z.infer<typeof OptionSchema>;
export type UserInput = z.infer<typeof UserInputSchema>;
export type UserProfileSchema = z.infer<typeof UserProfileSchema>;