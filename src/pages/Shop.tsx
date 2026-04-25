import { useEffect, useState } from "react";
import { Product } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { ProductCard } from "../components/ProductCard";
import { Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom"; // Add this

// Define a type for your Category
interface Category {
  id: string;
  label: string;
}

export function Shop() {
  //   const globalSearch = useSearchStore((state) => state.globalSearch);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchParams] = useSearchParams(); // Add this hook

  // Categories State
  const [categories, setCategories] = useState<Category[]>([
    { id: "all", label: "All Categories" },
  ]);

  // Filter States
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  //   const [products, setProducts] = useState([]);
  //   const [activeCategory, setActiveCategory] = useState("all");

  // 1. Fetch Categories on Mount
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        const fetchedCategories = data.map((item: any) => {
          if (typeof item === "string") {
            const formattedLabel = item
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
            return { id: item, label: formattedLabel };
          }
          return {
            id: item.id || item.slug || item.value,
            label: item.label || item.name || item.title,
          };
        });
        setCategories([
          { id: "all", label: "All Categories" },
          ...fetchedCategories,
        ]);
      })
      .catch((err) => console.error("Failed to fetch categories", err));
  }, []);

  // 2. Debounce the Search Input (Waits 400ms after user stops typing before fetching)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 3. Fetch Products when ANY filter changes
  useEffect(() => {
    setLoadingProducts(true);

    // Build query parameters dynamically
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.append("category", activeCategory);
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (sortOption) params.append("sort", sortOption);

    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoadingProducts(false);
      })
      .catch((err) => {
        console.error("Failed to fetch products", err);
        setLoadingProducts(false);
      });
  }, [activeCategory, debouncedSearch, sortOption]);

  // Handler to clear all filters when no items are found
  const clearFilters = () => {
    setActiveCategory("all");
    setSearchQuery("");
    setSortOption("newest");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto w-full flex flex-col items-center px-4"
    >
      <h1 className="text-4xl md:text-5xl font-serif text-theme-text mb-8 text-center pt-8">
        Discover Cuties
      </h1>

      {/* FILTER BAR */}
      <div className="w-full bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between mb-12">
        {/* Text Search Input */}
        <div className="relative w-full md:w-1/2">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for plushies, keychains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-theme-brand focus:ring-2 focus:ring-pink-100 outline-none transition-all font-medium text-theme-text"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
          {/* Category Select */}
          <div className="relative w-full sm:w-48">
            <SlidersHorizontal className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="w-full pl-11 pr-8 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-theme-brand outline-none transition-all font-medium text-theme-text appearance-none cursor-pointer text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Sort Select */}
          <div className="relative w-full sm:w-48">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 focus:bg-white focus:border-theme-brand outline-none transition-all font-medium text-theme-text appearance-none cursor-pointer text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRODUCTS DISPLAY */}
      {loadingProducts ? (
        <div className="flex justify-center items-center flex-grow py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-theme-brand"></div>
        </div>
      ) : products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 text-theme-muted flex flex-col items-center bg-white w-full rounded-3xl border border-gray-100 shadow-sm"
        >
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-2xl font-serif mb-2 text-theme-text">
            No items found
          </p>
          <p className="text-gray-500 mb-6 max-w-md">
            We couldn't find any items matching "{searchQuery}" in this
            category.
          </p>
          <button
            onClick={clearFilters}
            className="px-8 py-3 bg-theme-brand text-white rounded-full font-medium hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            Clear all filters
          </button>
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full mb-20"
        >
          <AnimatePresence>
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
