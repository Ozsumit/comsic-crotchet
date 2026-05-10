import { useWishlistStore } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { ProductCard } from "../components/ProductCard";
import { Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function Wishlist() {
  const items = useWishlistStore((state) => state.items);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto w-full flex flex-col items-center px-4 pt-8"
    >
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-theme-light-pink rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-theme-brand fill-theme-brand" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-theme-text mb-4">
          My Wishlist
        </h1>
        <p className="text-theme-muted font-light max-w-md">
          A collection of all the cute things you've set your heart on.
        </p>
      </div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 text-theme-muted flex flex-col items-center bg-white w-full rounded-3xl border border-gray-100 shadow-sm"
        >
          <p className="text-2xl font-serif mb-6 text-theme-text">
            Your wishlist is empty
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-theme-brand text-white px-8 py-4 rounded-full font-semibold shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
          >
            Go Shopping <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full mb-20">
          <AnimatePresence>
            {items.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
