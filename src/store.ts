import { create } from "zustand";

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}
interface SearchState {
  globalSearch: string;
  setGlobalSearch: (term: string) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  globalSearch: "",
  setGlobalSearch: (term) => set({ globalSearch: term }),
}));
interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  decreaseItem: (productId: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}
export const useSearchStore = create((set) => ({
  globalSearch: "",
  setGlobalSearch: (term: string) => set({ globalSearch: term }),
}));
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
  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return state;
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }
      return { items: [...state.items, { ...product, quantity: 1 }] };
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
