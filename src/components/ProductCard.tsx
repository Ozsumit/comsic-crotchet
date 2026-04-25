import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, useCartStore } from "../store";

export function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  // Fetch both the add function AND the cart items from your store
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items || state.cart || []);

  const [isJustAdded, setIsJustAdded] = useState(false);

  // Check how many of this specific product are currently in the cart
  const cartItem = cartItems.find((item: any) => item.id === product.id);
  const inCartQuantity = cartItem ? cartItem.quantity : 0;

  // Revert the green checkmark animation after 1.5s
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isJustAdded) {
      timeout = setTimeout(() => setIsJustAdded(false), 1500);
    }
    return () => clearTimeout(timeout);
  }, [isJustAdded]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents triggering the Link if accidentally overlapping
    addItem(product);
    setIsJustAdded(true);
  };

  const bgColors = [
    "bg-theme-light-pink-box",
    "bg-theme-light-yellow",
    "bg-theme-light-purple",
    "bg-theme-light-green",
  ];
  const bgClass = bgColors[index % bgColors.length];

  // Disable if standard stock is 0, OR if they already have the max stock in their cart
  const isOutOfStock = product.stock <= 0;
  const isMaxStockReached = inCartQuantity >= product.stock;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col hover:-translate-y-1 transition-all duration-300 group shadow-sm hover:shadow-xl"
    >
      <Link
        to={`/product/${product.id}`}
        className={`w-full aspect-square ${bgClass} rounded-2xl mb-5 overflow-hidden relative block transition-all duration-500`}
      >
        <motion.img
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          src={product.imageUrl}
          alt={product.title}
          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90 transition-opacity group-hover:opacity-100"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center backdrop-blur-[2px]">
            <span className="bg-white/70 px-4 py-2 text-xs font-semibold text-red-500 uppercase tracking-widest shadow-sm rounded-full">
              Sold Out
            </span>
          </div>
        )}
      </Link>

      <div className="px-2 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-lg text-theme-text group-hover:text-theme-brand transition-colors line-clamp-1">
            {product.title}
          </h3>
        </Link>
        <p className="text-xl text-theme-muted mb-4 font-serif mt-1">
          {product.category}
        </p>

        <div className="mt-auto flex justify-between items-center pt-2">
          <span className="font-semibold text-theme-brand text-xl">
            Rs. {product.price.toFixed(2)}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isMaxStockReached}
            title={isMaxStockReached ? "Max stock reached" : "Add to cart"}
            className={`w-10 h-10 flex items-center justify-center font-medium transition-all disabled:opacity-50 disabled:hover:scale-100 rounded-full shadow-sm relative overflow-hidden ${
              isJustAdded
                ? "bg-green-500 text-white hover:bg-green-600 scale-110" // Just clicked (Green Check)
                : inCartQuantity > 0
                  ? "bg-theme-brand text-white hover:bg-theme-brand/90" // Already in cart (Solid color)
                  : "bg-theme-light-pink text-theme-brand hover:bg-theme-brand hover:text-white hover:scale-105 active:scale-95" // Not in cart (Light pink)
            }`}
            aria-label="Add to cart"
          >
            <AnimatePresence mode="wait">
              {isJustAdded ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Check className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="cart"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="relative flex items-center justify-center w-full h-full"
                >
                  <ShoppingCart className="w-4 h-4" />

                  {/* Quantity Badge if item is already in cart */}
                  {inCartQuantity > 0 && !isJustAdded && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-[1.5px] border-white">
                      {inCartQuantity}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
