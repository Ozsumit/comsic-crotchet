import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, useCartStore } from "../store";

export function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const addItem = useCartStore((state) => state.addItem);
  // Pulling decreaseItem instead of removeItem
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const cartItems = useCartStore((state) => state.items || state.cart || []);

  const [isJustAdded, setIsJustAdded] = useState(false);

  const cartItem = cartItems.find((item) => item.id === product.id);
  const inCartQuantity = cartItem ? cartItem.quantity : 0;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isJustAdded) {
      timeout = setTimeout(() => setIsJustAdded(false), 1500);
    }
    return () => clearTimeout(timeout);
  }, [isJustAdded]);

  const handleInitialAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    setIsJustAdded(true);
  };

  const handleIncreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  // NEW: Explicitly named handleDecreaseQuantity
  const handleDecreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (decreaseItem) {
      decreaseItem(product.id);
    }
  };

  const bgColors = [
    "bg-theme-light-pink-box",
    "bg-theme-light-yellow",
    "bg-theme-light-purple",
    "bg-theme-light-green",
  ];
  const bgClass = bgColors[index % bgColors.length];

  const isOutOfStock = product.stock <= 0;
  const isMaxStockReached = inCartQuantity >= product.stock;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className={`bg-white p-4 rounded-3xl border border-gray-100 flex flex-col transition-all duration-300 group shadow-sm relative ${
        isOutOfStock ? "opacity-75" : "hover:-translate-y-1 hover:shadow-xl"
      }`}
    >
      {/* ... (Image section remains exactly the same) ... */}
      <Link
        to={`/product/${product.id}`}
        className={`w-full aspect-square ${bgClass} rounded-2xl mb-4 overflow-hidden relative block transition-all duration-500`}
      >
        <motion.img
          whileHover={!isOutOfStock ? { scale: 1.05 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          src={product.imageUrl}
          alt={product.title}
          className={`absolute inset-0 w-full h-full object-cover mix-blend-multiply transition-all duration-500 ${
            isOutOfStock
              ? "grayscale opacity-40"
              : "opacity-90 group-hover:opacity-100"
          }`}
        />

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px] z-10 pointer-events-none">
            <span className="bg-red-600 text-white px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] shadow-lg rounded-full scale-110">
              Sold Out
            </span>
          </div>
        )}

        {!isOutOfStock && isLowStock && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <span className="bg-orange-100/90 text-orange-700 border border-orange-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm rounded-full backdrop-blur-md">
              Only {product.stock} left
            </span>
          </div>
        )}
      </Link>

      {/* DETAILS SECTION */}
      <div className="px-2 flex flex-col flex-grow relative z-10">
        <Link to={`/product/${product.id}`} className="block">
          <p className="text-sm text-theme-muted font-serif mb-1 uppercase tracking-wide text-xs">
            {product.category}
          </p>
          <h3
            className={`font-bold text-lg transition-colors line-clamp-2 leading-tight ${
              isOutOfStock
                ? "text-gray-400"
                : "text-theme-text group-hover:text-theme-brand"
            }`}
          >
            {product.title}
          </h3>
        </Link>

        {/* BOTTOM ROW: Price & Actions */}
        <div className="mt-auto flex justify-between items-end pt-4 min-h-[48px]">
          <div className="flex flex-col relative">
            <span
              className={`font-semibold text-xl ${isOutOfStock ? "text-gray-400" : "text-theme-text"}`}
            >
              Rs. {product.price.toFixed(2)}
            </span>
            {isMaxStockReached && !isOutOfStock && (
              <span className="text-[10px] text-red-500 font-medium absolute -bottom-4 whitespace-nowrap">
                Max limit reached
              </span>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="h-10 relative flex items-center justify-end">
            <AnimatePresence mode="popLayout">
              {inCartQuantity > 0 && !isJustAdded ? (
                // STEPPER CONTROLS
                <motion.div
                  key="stepper"
                  initial={{ opacity: 0, scale: 0.8, width: 40 }}
                  animate={{ opacity: 1, scale: 1, width: 100 }}
                  exit={{ opacity: 0, scale: 0.8, width: 40 }}
                  className="flex items-center justify-between bg-theme-brand text-white rounded-full h-10 px-1 shadow-md"
                >
                  <button
                    onClick={handleDecreaseQuantity} // <-- ATTACHED HERE
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors active:scale-95"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-sm w-4 text-center">
                    {inCartQuantity}
                  </span>
                  <button
                    onClick={handleIncreaseQuantity}
                    disabled={isMaxStockReached}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors disabled:opacity-30 disabled:hover:bg-transparent active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                // INITIAL ADD BUTTON
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleInitialAdd}
                  disabled={isOutOfStock}
                  className={`w-10 h-10 flex items-center justify-center font-medium transition-all rounded-full relative overflow-hidden ${
                    isOutOfStock
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                      : isJustAdded
                        ? "bg-green-500 text-white scale-110 shadow-md"
                        : "bg-theme-light-pink text-theme-brand hover:bg-theme-brand hover:text-white hover:scale-105 active:scale-95 shadow-sm"
                  }`}
                  aria-label="Add to cart"
                >
                  {isJustAdded ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <Check className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <ShoppingCart className="w-[18px] h-[18px]" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
