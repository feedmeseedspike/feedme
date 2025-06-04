import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  CartSchema,
  OrderItemSchema,
  ShippingAddressSchema,
} from "src/lib/validator";
import { z } from "zod";

// Infer types from your Zod schemas
type Cart = z.infer<typeof CartSchema>;
type OrderItem = z.infer<typeof OrderItemSchema>;
type ShippingAddress = z.infer<typeof ShippingAddressSchema>;

const calculateItemsPrice = (items: OrderItem[]) => {
  return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
};

const initialState: Cart = {
  items: [],
  itemsPrice: 0,
  taxPrice: undefined,
  shippingPrice: undefined,
  totalPrice: 0,
  paymentMethod: undefined,
  shippingAddress: undefined,
  deliveryDateIndex: undefined,
  expectedDeliveryDate: undefined,
};

interface AddItemPayload {
  item: OrderItem;
  quantity: number;
  requiresOption?: boolean;
  selectedOption?: string | null;
}

interface UpdateCartItemPayload {
  productId: string;
  selectedOption?: string | null;
  newOption?: string;
  quantity?: number;
  option?: {
    name: string;
    price: number;
    image?: string;
  };
}

interface UpdateItemPayload {
  item: OrderItem;
  quantity: number;
}

interface RemoveItemPayload {
  productId: string;
  selectedOption?: string | null;
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartState: (state, action: PayloadAction<Partial<Cart>>) => {
      const newState = { ...state, ...action.payload };
      localStorage.setItem("cart", JSON.stringify(newState));
      return newState;
    },

    addItem: (state, action: PayloadAction<AddItemPayload>) => {
      const { item, quantity, selectedOption } = action.payload;
      
      const existingIndex = state.items.findIndex(
        x => x.product === item.product && (x.selectedOption ?? '') === (selectedOption ?? '')
      );

      if (existingIndex >= 0) {
        state.items[existingIndex].quantity += quantity;
      } else {
        state.items.push({
          ...item,
          quantity,
          selectedOption: selectedOption ?? undefined,
          options: item.options || [],
        });
      }

      // Only calculate prices once at the end
      state.itemsPrice = calculateItemsPrice(state.items);
      localStorage.setItem("cart", JSON.stringify(state));
    },


    updateCartItem: (state, action: PayloadAction<UpdateCartItemPayload>) => {
      const { productId, selectedOption, quantity } = action.payload;
    
      console.debug('[CartSlice] Updating item', {
        productId,
        selectedOption,
        quantity
      });
    
      const itemIndex = state.items.findIndex(
        item => item.product === productId && 
               (item.selectedOption ?? '') === (selectedOption ?? '')
      );
    
      if (itemIndex === -1) {
        console.warn('[CartSlice] Item not found for update');
        return;
      }
    
      if (quantity !== undefined) {
        console.debug('[CartSlice] Updating quantity from', 
          state.items[itemIndex].quantity, 'to', quantity);
        state.items[itemIndex].quantity = quantity;
      }
    
      state.itemsPrice = calculateItemsPrice(state.items);
      localStorage.setItem("cart", JSON.stringify(state));
    },

    removeItem: (state, action: PayloadAction<RemoveItemPayload>) => {
      const { productId, selectedOption } = action.payload;
      state.items = state.items.filter(
        (x) =>
          !(x.product === productId && (x.selectedOption ?? '') === (selectedOption ?? ''))
      );
      state.itemsPrice = calculateItemsPrice(state.items);
      localStorage.setItem("cart", JSON.stringify(state));
    },

    clearCart: (state) => {
      state.items = [];
      state.itemsPrice = 0;
      state.taxPrice = undefined;
      state.shippingPrice = undefined;
      state.totalPrice = 0;
      localStorage.removeItem("cart");
    },

    setShippingAddress: (state, action: PayloadAction<ShippingAddress>) => {
      state.shippingAddress = action.payload;
      localStorage.setItem("cart", JSON.stringify(state));
    },

    setDeliveryDateIndex: (state, action: PayloadAction<number>) => {
      state.deliveryDateIndex = action.payload;
      localStorage.setItem("cart", JSON.stringify(state));
    },
  },
});

export const {
  setCartState,
  addItem,
  updateCartItem,
  removeItem,
  clearCart,
  setShippingAddress,
  setDeliveryDateIndex,
} = cartSlice.actions;

export default cartSlice.reducer;
