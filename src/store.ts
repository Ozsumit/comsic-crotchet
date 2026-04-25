import { create } from "zustand";

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl?: string; // Optional since we are transitioning to multiple images
  imageUrls?: string[]; // Added to support multiple images
  category: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  // Updated to accept an optional quantity to add (defaults to 1)
  addItem: (product: Product, quantityToAdd?: number) => void;
  decreaseItem: (productId: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  decreaseItem: (productId: number) =>
    set((state) => {
      const existingItem = state.items.find((item) => item.id === productId);

      if (existingItem) {
        if (existingItem.quantity > 1) {
          // If quantity > 1, just subtract 1
          return {
            items: state.items.map((item) =>
              item.id === productId
                ? { ...item, quantity: item.quantity - 1 }
                : item,
            ),
          };
        } else {
          // If quantity is 1, remove the item entirely from the cart
          return {
            items: state.items.filter((item) => item.id !== productId),
          };
        }
      }
      return state;
    }),

  // Updated to handle adding multiple quantities at once from the ProductDetail page
  addItem: (product, quantityToAdd = 1) =>
    set((state) => {
      const existing = state.items.find((item) => item.id === product.id);

      if (existing) {
        // Stop if we are already at the max stock
        if (existing.quantity >= product.stock) return state;

        // Add the requested quantity, but cap it at the available stock limit
        const newQuantity = Math.min(
          existing.quantity + quantityToAdd,
          product.stock,
        );

        return {
          items: state.items.map((item) =>
            item.id === product.id ? { ...item, quantity: newQuantity } : item,
          ),
        };
      }

      // If adding a new item, also ensure we don't request more than available stock
      return {
        items: [
          ...state.items,
          { ...product, quantity: Math.min(quantityToAdd, product.stock) },
        ],
      };
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item,
      ),
    })),

  clearCart: () => set({ items: [] }),

  total: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));
