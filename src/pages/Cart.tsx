import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCartStore } from "../store";
import { motion } from "motion/react";

export function Cart() {
  const { items, removeItem, updateQuantity, total } = useCartStore();

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="max-w-2xl mx-auto flex-grow flex items-center justify-center p-4 w-full"
      >
        <div className="flex flex-col gap-6 flex-1">
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col w-full text-center py-16">
            <h2 className="text-3xl font-serif text-theme-text mb-4">
              Your basket is empty!
            </h2>
            <p className="text-theme-muted mb-8 font-light">
              Looks like you haven't added any cute crochets yet.
            </p>
            <Link
              to="/shop"
              className="inline-flex bg-theme-text text-white px-8 py-3 rounded-full font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all text-center justify-center w-max mx-auto"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-7xl mx-auto flex gap-6 flex-col md:flex-row w-full pt-4"
    >
      {/* Cart Items List */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col flex-1">
          <h1 className="text-2xl font-serif text-theme-text mb-6">
            Review Items
          </h1>
          <div className="space-y-4 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 group bg-theme-bg p-3 rounded-2xl border hover:border-gray-200 transition-colors"
              >
                <div className="w-20 h-20 bg-theme-light-pink-box rounded-xl flex-shrink-0 overflow-hidden relative">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-multiply"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-theme-text">
                    {item.title}
                  </div>
                  <div className="text-sm text-theme-muted mt-1">
                    Rs. {item.price.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white rounded-full px-2 py-1 border border-gray-100 shadow-sm">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 hover:text-theme-brand transition-colors text-theme-muted flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-medium w-4 text-center text-sm text-theme-text">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="p-1 hover:text-theme-brand disabled:opacity-50 transition-colors text-theme-muted flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-theme-muted hover:text-red-500 transition-colors ml-2 rounded-full hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Order Summary Panel */}
      <div className="w-full md:w-[350px] bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col self-start sticky top-28">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-serif text-theme-text">Your Basket</h2>
          <span className="bg-theme-main text-theme-muted text-xs px-2 py-1 font-medium rounded-full tracking-wide">
            EST. 2 DAYS
          </span>
        </div>

        <div className="border-t border-gray-100 pt-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-theme-muted">Subtotal</span>
            <span className="font-medium text-theme-text">
              Rs. {total().toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-theme-muted">Delivery</span>
            <span className="font-medium text-green-500">FREE</span>
          </div>
          <div className="flex justify-between text-2xl pt-4 border-t border-gray-100 mt-2">
            <span className="text-theme-text font-serif">Total</span>
            <span className="text-theme-brand font-medium">
              Rs. {total().toFixed(2)}
            </span>
          </div>
          <Link
            to="/checkout"
            className="w-full bg-theme-text text-white text-center flex justify-center py-4 rounded-full font-medium mt-6 hover:-translate-y-0.5 active:translate-y-0 transition- shadow-sm hover:shadow-md"
          >
            Checkout Now
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
