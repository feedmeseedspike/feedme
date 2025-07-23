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
    .coerce.number({
      invalid_type_error: "Price must be a number",
      required_error: "Price is required",
    })
    .min(50, "Price must be at least ₦50"),
  list_price: z
    .coerce.number({
      invalid_type_error: "List price must be a number",
    })
    .min(0, "List price must be at least ₦0")
    .optional(),
  stockStatus: z.enum(["In Stock", "Out of Stock"], {
    required_error: "Stock status is required",
  }).optional(),
  image: z.union([
    z.instanceof(File, { message: "Image must be a File" })
      .refine((file) => file.size <= 5 * 1024 * 1024, {
        message: "Image must be less than 5MB",
      })
      .refine((file) => file.type.startsWith("image/"), {
        message: "Only image files are allowed",
      }),
    z.string().url("Invalid image URL"),
    z.null() // Allow null
  ]).optional(), // Make the image field optional
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
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  street: z.string().trim().min(5, "Street address must be at least 5 characters"),
  location: z.string().trim().min(1, "Please select a location"),
  phone: z.string().regex(/^(?\d{8,15})$/, "Please enter a valid phone number"),
  // email: z.string().email("Please enter a valid email address"),
});

// ======================
// Cart Schemas
// ======================
export const CartSchema = z.object({
  items: z
    .array(OrderItemSchema)
    .min(1, 'Order must contain at least one item'),
  itemsPrice: z.number(),
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
  id: z.string(),
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  category: array(z.string()),
  images: z
    .array(z.union([
        z.string(),
        z.object({ url: z.string() })
    ]))
    .min(0, "Images field must be an array") // Allow empty array initially
    .optional(), // Allow the entire images field to be optional
  tags: z.array(z.string()).default([]),
  is_published: z.boolean(),
  price: Price("Price"),
  list_price: Price("List price"),
  stockStatus: z.any().optional(),
  brand: z.string().min(1, "Brand is required"),
  vendor: VendorReferenceSchema.optional(), // Make vendor optional
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

const UserRole = z.enum(['customer', 'vendor', 'admin', 'buyer', 'seller'], {
  required_error: 'Role is required',
  invalid_type_error: 'Role must be either customer, vendor, admin, buyer, or seller',
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
  referralCode: z.string().optional(),
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
  product: z.string(),
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  comment: z.string().min(1, "Comment is required").max(1000, "Comment must be less than 1000 characters"),
  rating: z.number().min(1, "Rating is required").max(5, "Rating must be between 1 and 5"),
  isVerifiedPurchase: z.boolean().optional(),
  image_urls: z.array(z.string().url("Invalid image URL")).max(3, "You can upload a maximum of 3 images").nullable().optional(),
});

// ======================
// User 
// ======================
export const UserProfileSchema = z.object({
  display_name: z.string().min(1, { message: "Display name is required" }),
  role: UserRole.optional(),
  avatar: z
    .union([
      z
        .instanceof(File, { message: "Avatar must be a File" })
        .refine((file) => file.size <= 2 * 1024 * 1024, {
          message: "Image must be less than 2MB",
        })
        .refine((file) => file.type.startsWith("image/"), {
          message: "Only image files are allowed",
        }),
      z.string().url("Invalid image URL"),
      z.string().length(0), // Allow empty string for removal
    ])
    .nullable()
    .optional(),
  birthday: z.string().nullable().optional().transform(e => e === "" ? null : e),
  favorite_fruit: z.string().optional(),
});

// ======================
// Address Schemas
// ======================
export const UserAddressSchema = z.object({
  label: z.string().optional(),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "Zip code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(1, "Phone number is required"),
});

export type UserAddress = z.infer<typeof UserAddressSchema>;

// Define a type for address objects that include the database ID
export type AddressWithId = UserAddress & { id: string };

// ======================
// Type Exports
// ======================
export type Products = z.infer<typeof ProductUpdateSchema>;
export type Product = z.infer<typeof ProductInputSchema>;
export type option = z.infer<typeof OptionSchema>;
export type ProductOption = z.infer<typeof OptionSchema>;
export type UserInput = z.infer<typeof UserInputSchema>;
export type UserProfileSchema = z.infer<typeof UserProfileSchema>;