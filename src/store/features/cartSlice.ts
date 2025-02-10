import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Cart, OrderItem, ShippingAddress } from 'src/types';

const calculateItemsPrice = (items: OrderItem[]) => {
  return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
};

const loadCartState = (): Cart => {
  if (typeof window !== 'undefined') {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      return JSON.parse(savedCart);
    }
  }
  return {
    items: [],
    itemsPrice: 0,
    taxPrice: undefined,
    shippingPrice: undefined,
    totalPrice: 0,
    shippingAddress: undefined,
    deliveryDateIndex: undefined,
  };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: loadCartState(),
  reducers: {
    setCartState: (state, action: PayloadAction<Partial<Cart>>) => {
      const newState = { ...state, ...action.payload };
      localStorage.setItem('cart', JSON.stringify(newState));
      return newState;
    },
    
    addItem: (state, action: PayloadAction<{ item: OrderItem; quantity: number }>) => {
      const { item, quantity } = action.payload;
      const existItem = state.items.find((x) => x.product === item.product);
    
      if (existItem) {
        existItem.quantity += quantity;
      } else {
        state.items.push({ ...item, quantity });
      }
      
      state.itemsPrice = calculateItemsPrice(state.items);
      localStorage.setItem('cart', JSON.stringify(state));
    },
    
    updateItem: (state, action: PayloadAction<{ item: OrderItem; quantity: number }>) => {
      const { item, quantity } = action.payload;
      const existItem = state.items.find((x) => x.product === item.product);
      if (existItem) {
        existItem.quantity = quantity;
      }
    
      state.itemsPrice = calculateItemsPrice(state.items);
      localStorage.setItem('cart', JSON.stringify(state));
    },
    
    removeItem: (state, action: PayloadAction<OrderItem>) => {
      state.items = state.items.filter((x) => x.product !== action.payload.product);
      state.itemsPrice = calculateItemsPrice(state.items);
      localStorage.setItem('cart', JSON.stringify(state));
    },
    
    clearCart: (state) => {
      state.items = [];
      state.itemsPrice = 0;
      localStorage.setItem('cart', JSON.stringify(state));
    },

    setShippingAddress: (state, action: PayloadAction<ShippingAddress>) => {
      state.shippingAddress = action.payload;
      localStorage.setItem('cart', JSON.stringify(state));
    },

    setDeliveryDateIndex: (state, action: PayloadAction<number>) => {
      state.deliveryDateIndex = action.payload;
      localStorage.setItem('cart', JSON.stringify(state));
    }
  }
});

export const {
  setCartState,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  setShippingAddress,
  setDeliveryDateIndex
} = cartSlice.actions;

export default cartSlice.reducer;
