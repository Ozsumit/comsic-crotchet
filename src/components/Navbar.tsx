import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart, Menu, X, Sparkles } from "lucide-react";
import { useCartStore, useWishlistStore } from "../store";
import { motion, AnimatePresence } from "motion/react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.items);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-theme-brand text-white py-2 px-4 text-center text-xs font-bold tracking-[0.1em] uppercase relative z-[60]">
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3 h-3" />
          Free shipping on all orders over Rs. 1000!
          <Sparkles className="w-3 h-3" />
        </motion.p>
      </div>

      <header className="flex items-center justify-between px-6 sm:px-10 py-5 bg-white/80 backdrop-blur-md border-b border-gray-100/50 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-3xl text-theme-brand font-serif hover:opacity-80 transition-opacity"
          >
            <img src="/logo.svg" alt="Logo" className="w-32 h-auto" />
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8 font-medium text-sm text-theme-muted tracking-wide items-center">
          <Link to="/" className="hover:text-theme-brand transition-colors">
            Home
          </Link>
          <Link to="/shop" className="hover:text-theme-brand transition-colors">
            Shop All
          </Link>
          <Link to="/sellers" className="hover:text-theme-brand transition-colors">
            Seller Portal
          </Link>
          <Link
            to="/track"
            className="hover:text-theme-brand transition-colors px-3 py-1 bg-gray-50 border border-gray-100 rounded-full"
          >
            Track Order
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/wishlist"
            className="p-2 text-theme-muted hover:text-theme-brand transition-colors relative"
            aria-label="Wishlist"
          >
            <Heart className={`w-6 h-6 ${wishlistItems.length > 0 ? "fill-theme-brand text-theme-brand" : ""}`} />
            {wishlistItems.length > 0 && (
              <span className="absolute top-0 right-0 bg-theme-brand text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          <div className="relative">
            <Link
              to="/cart"
              className="bg-theme-bg text-theme-brand px-4 sm:px-5 py-2.5 rounded-full font-medium flex items-center gap-2 hover:bg-theme-light-pink transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden sm:inline">{itemCount} Items</span>
              <span className="sm:hidden">{itemCount}</span>
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-theme-muted hover:text-theme-brand transition-colors"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[70] md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[280px] bg-white z-[80] shadow-2xl p-8 flex flex-col md:hidden"
            >
              <button
                className="self-end p-2 text-theme-muted hover:text-theme-brand transition-colors mb-8"
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>

              <nav className="flex flex-col gap-6 font-serif text-2xl text-theme-text">
                <Link
                  to="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-theme-brand transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/shop"
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-theme-brand transition-colors"
                >
                  Shop All
                </Link>
                <Link
                  to="/sellers"
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-theme-brand transition-colors"
                >
                  Seller Portal
                </Link>
                <Link
                  to="/track"
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-theme-brand transition-colors"
                >
                  Track Order
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-theme-brand transition-colors flex items-center gap-2"
                >
                  Wishlist
                  {wishlistItems.length > 0 && (
                    <span className="text-sm bg-theme-brand text-white px-2 py-0.5 rounded-full font-sans font-bold">
                      {wishlistItems.length}
                    </span>
                  )}
                </Link>
              </nav>

              <div className="mt-auto">
                <Link
                  to="/cart"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full bg-theme-brand text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-100"
                >
                  <ShoppingBag className="w-5 h-5" />
                  View Cart ({itemCount})
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
