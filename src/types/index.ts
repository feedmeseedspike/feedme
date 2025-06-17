import {
  CartSchema,
  OptionSchema,
  OrderItemSchema,
  ProductInputSchema,
  ReviewInputSchema,
  ShippingAddressSchema,
  UserInputSchema,
  UserNameSchema,
  UserSignInSchema,
  UserSignUpSchema,
} from '../lib/validator'
import { z } from 'zod'
import { CartItem } from 'src/lib/actions/cart.actions'

export type IReviewInput = z.infer<typeof ReviewInputSchema>
export type IReviewDetails = IReviewInput & {
  _id: string
  createdAt: string
  user: {
    name: string
  }
}
export type IProductInput = z.infer<typeof ProductInputSchema> & {
  bundleId?: string;
}
export type OrderItem = z.infer<typeof OrderItemSchema>
export type Options = z.infer<typeof OptionSchema>
export type Cart = z.infer<typeof CartSchema>
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>


// user
export type IUserInput = z.infer<typeof UserInputSchema>
export type IUserSignIn = z.infer<typeof UserSignInSchema>
export type IUserSignUp = z.infer<typeof UserSignUpSchema>
export type IUserName = z.infer<typeof UserNameSchema>

export type Route = {
 title: string,
 url: string,
 icon: any,
};

export type UserData = {
  avatar_url: string;
  vouchers: any[];
  deletedAt: string | null;
  id: string;
  display_name: string;
  email: string;
  password: string;
  phone: string;
  role: "buyer" | "seller" | "admin";
  status: string;
  cart: object[]; 
  favorites: object[];
  reviews: object[];
  purchases: object[];
  products: object[];
  address: string;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  data: UserData;
};

export type PublicUserData = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: 'buyer' | 'seller' | 'admin';
  status: string;
  address: string | null;
  created_at: string;
  birthday: string | null;
  favorite_fruit: string | null;
};

export interface Purchase {
  id: string;
  userId: string;
  cartItems: CartItem[];
  shippingAddress: ShippingAddress;
  totalAmount: number;
  totalAmountPaid: number;
  deliveryFee: number;
  local_government: string;
  voucherCode?: string;
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

