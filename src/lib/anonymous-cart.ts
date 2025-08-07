"use client";

export interface AnonymousCartItem {
  id: string;
  product_id?: string | null;
  bundle_id?: string | null;
  offer_id?: string | null;
  quantity: number;
  price: number;
  option?: any | null;
  created_at: string;
}

const ANONYMOUS_CART_KEY = "feedme_anonymous_cart";

export class AnonymousCart {
  private getCartItems(): AnonymousCartItem[] {
    if (typeof window === "undefined") return [];
    
    try {
      const items = localStorage.getItem(ANONYMOUS_CART_KEY);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error("Error reading anonymous cart:", error);
      return [];
    }
  }

  private saveCartItems(items: AnonymousCartItem[]): void {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(ANONYMOUS_CART_KEY, JSON.stringify(items));
      // Dispatch a storage event to notify other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: ANONYMOUS_CART_KEY,
        newValue: JSON.stringify(items),
        storageArea: localStorage
      }));
    } catch (error) {
      console.error("Error saving anonymous cart:", error);
    }
  }

  async addItem(
    productId: string | null,
    quantity: number,
    price: number,
    option?: any | null,
    bundleId?: string | null,
    offerId?: string | null
  ): Promise<void> {
    const items = this.getCartItems();
    
    // Find existing item with same product/bundle/offer and option
    const existingItemIndex = items.findIndex(
      (item) =>
        item.product_id === productId &&
        item.bundle_id === bundleId &&
        item.offer_id === offerId &&
        JSON.stringify(item.option || null) === JSON.stringify(option || null)
    );

    // If this is an offer, validate availability
    if (offerId) {
      try {
        const response = await fetch(`/api/offers/${offerId}`);
        if (!response.ok) throw new Error('Failed to fetch offer data');
        
        const { offer } = await response.json();
        if (!offer) throw new Error('Offer not found');
        
        if (offer.status !== 'active') {
          throw new Error(`Offer "${offer.title}" is no longer active`);
        }
        
        const currentQuantityInCart = existingItemIndex > -1 ? items[existingItemIndex].quantity : 0;
        const newTotalQuantity = currentQuantityInCart + quantity;
        
        if (newTotalQuantity > offer.available_slots) {
          throw new Error(`Only ${offer.available_slots} slots available for "${offer.title}". You currently have ${currentQuantityInCart} in cart.`);
        }
      } catch (error) {
        throw error; // Re-throw validation errors
      }
    }

    if (existingItemIndex > -1) {
      // Update existing item quantity
      items[existingItemIndex].quantity += quantity;
      items[existingItemIndex].price = price; // Update price in case it changed
    } else {
      // Add new item
      const newItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        product_id: productId,
        bundle_id: bundleId,
        offer_id: offerId,
        quantity,
        price,
        option: option || null,
        created_at: new Date().toISOString(),
      };
      items.push(newItem);
    }

    this.saveCartItems(items);
  }

  async updateQuantity(itemId: string, quantity: number): Promise<void> {
    const items = this.getCartItems();
    const itemIndex = items.findIndex((item) => item.id === itemId);
    
    if (itemIndex > -1) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        items.splice(itemIndex, 1);
      } else {
        const item = items[itemIndex];
        
        // If this is an offer, validate availability
        if (item.offer_id) {
          try {
            const response = await fetch(`/api/offers/${item.offer_id}`);
            if (!response.ok) throw new Error('Failed to fetch offer data');
            
            const { offer } = await response.json();
            if (!offer) throw new Error('Offer not found');
            
            if (offer.status !== 'active') {
              throw new Error(`Offer "${offer.title}" is no longer active`);
            }
            
            if (quantity > offer.available_slots) {
              throw new Error(`Only ${offer.available_slots} slots available for "${offer.title}"`);
            }
          } catch (error) {
            throw error; // Re-throw validation errors
          }
        }
        
        items[itemIndex].quantity = quantity;
      }
      this.saveCartItems(items);
    }
  }

  removeItem(itemId: string): void {
    const items = this.getCartItems();
    const filteredItems = items.filter((item) => item.id !== itemId);
    this.saveCartItems(filteredItems);
  }

  getItems(): AnonymousCartItem[] {
    return this.getCartItems();
  }

  clear(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ANONYMOUS_CART_KEY);
    }
  }

  getItemCount(): number {
    return this.getCartItems().reduce((total, item) => total + item.quantity, 0);
  }

  getTotal(): number {
    return this.getCartItems().reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  // Method to transfer anonymous cart to authenticated user
  async transferToUser(transferFunction: (items: AnonymousCartItem[]) => Promise<void>): Promise<void> {
    const items = this.getCartItems();
    if (items.length > 0) {
      try {
        await transferFunction(items);
        this.clear(); // Clear anonymous cart after successful transfer
      } catch (error) {
        console.error("Error transferring anonymous cart:", error);
        throw error;
      }
    }
  }
}

// Singleton instance
export const anonymousCart = new AnonymousCart();