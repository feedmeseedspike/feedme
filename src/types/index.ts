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

export type IReviewInput = z.infer<typeof ReviewInputSchema>
export type IReviewDetails = IReviewInput & {
  _id: string
  createdAt: string
  user: {
    name: string
  }
}
export type IProductInput = z.infer<typeof ProductInputSchema>
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
  avatar: {
    url: string;
    public_id: string;
  };
  vouchers: any[];
  deletedAt: string | null;
  _id: string;
  name: string;
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
  __v: number;
};

export type User = {
  data: UserData;
};

