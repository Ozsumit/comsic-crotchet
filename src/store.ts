import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  imageUrls?: string[];
  category: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantityToAdd?: number) => void;
  decreaseItem: (productId: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      decreaseItem: (productId: number) =>
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.id === productId,
          );

          if (existingItem) {
            if (existingItem.quantity > 1) {
              return {
                items: state.items.map((item) =>
                  item.id === productId
                    ? { ...item, quantity: item.quantity - 1 }
                    : item,
                ),
              };
            } else {
              return {
                items: state.items.filter((item) => item.id !== productId),
              };
            }
          }
          return state;
        }),

      addItem: (product, quantityToAdd = 1) =>
        set((state) => {
          const existing = state.items.find((item) => item.id === product.id);

          if (existing) {
            if (existing.quantity >= product.stock) return state;

            const newQuantity = Math.min(
              existing.quantity + quantityToAdd,
              product.stock,
            );

            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: newQuantity }
                  : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...product,
                quantity: Math.min(quantityToAdd, product.stock),
              },
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
    }),
    {
      name: "cart-storage", // key in localStorage
    },
  ),
);

interface WishlistState {
  items: Product[];
  toggleItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleItem: (product) => {
        const exists = get().items.find((item) => item.id === product.id);
        if (exists) {
          set({ items: get().items.filter((item) => item.id !== product.id) });
        } else {
          set({ items: [...get().items, product] });
        }
      },
      removeItem: (productId) =>
        set({ items: get().items.filter((item) => item.id !== productId) }),
      isInWishlist: (productId) => get().items.some((item) => item.id === productId),
    }),
    {
      name: "wishlist-storage",
    },
  ),
);

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  addToast: (message, type = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
