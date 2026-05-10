"use client";
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Truck,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Minus,
  Plus,
  Heart,
  ShoppingBag,
} from "lucide-react";
import { useCartStore, useWishlistStore, useToastStore, Product } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { ProductCard } from "../components/ProductCard";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // 🔥 ZOOM STATE
  const [showZoom, setShowZoom] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<any>({});

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const addToast = useToastStore((s) => s.addToast);

  const cartItem = product
    ? items.find((item) => item.id === product.id)
    : null;

  const isInCart = !!cartItem;
  const isFavorite = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setProduct(data);
        setActiveImageIdx(0);
        setQuantity(1);

        // Fetch related products
        const relatedRes = await fetch(`/api/products?category=${data.category}`);
        if (relatedRes.ok) {
          const relatedData = await relatedRes.json();
          setRelated(relatedData.filter((p: Product) => p.id !== data.id).slice(0, 4));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
    window.scrollTo(0, 0);
  }, [id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();

    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomStyle({
      backgroundPosition: `${x}% ${y}%`,
    });
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (isInCart) {
      removeItem(product.id);
      addToast(`${product.title} removed from cart`, "info");
    } else {
      addItem(product, quantity);
      addToast(`${product.title} added to cart!`);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product, quantity);
    navigate("/checkout");
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleItem(product);
    if (!isFavorite) {
      addToast(`${product.title} saved to wishlist!`);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-theme-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-gray-500">
        Product not found
      </div>
    );
  }

  const images =
    product.imageUrls?.length > 0
      ? product.imageUrls
      : [product.imageUrl || "/placeholder.png"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-7xl mx-auto px-4 md:px-8 py-10 w-full"
    >
      {/* BACK */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-sm text-theme-muted hover:text-theme-brand mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        {/* IMAGE SECTION */}
        <div className="space-y-6">
          {/* MAIN IMAGE */}
          <div
            className="relative aspect-square h-auto md:h-[35rem] rounded-3xl overflow-hidden bg-white shadow-xl border border-gray-100"
            onMouseEnter={() => setShowZoom(true)}
            onMouseLeave={() => setShowZoom(false)}
            onMouseMove={handleMouseMove}
          >
            {/* BASE IMAGE */}
            <img
              src={images[activeImageIdx]}
              className="w-full h-full object-cover"
              alt={product.title}
            />

            {/* ZOOM LAYER */}
            {showZoom && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${images[activeImageIdx]})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "220%",
                  ...zoomStyle,
                }}
              />
            )}

            {/* NAV ARROWS */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActiveImageIdx((p) =>
                      p === 0 ? images.length - 1 : p - 1,
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <ChevronLeft />
                </button>

                <button
                  onClick={() =>
                    setActiveImageIdx((p) => (p + 1) % images.length)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <ChevronRight />
                </button>
              </>
            )}
          </div>

          {/* THUMBNAILS */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIdx(i)}
                  className={`w-20 aspect-square rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    i === activeImageIdx
                      ? "border-theme-brand scale-105"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="flex flex-col gap-8">
          <div>
            <p className="text-theme-brand font-bold uppercase tracking-widest text-xs mb-2">
              {product.category}
            </p>
            <h1 className="text-4xl md:text-5xl font-serif text-theme-text mb-4 leading-tight">
              {product.title}
            </h1>

            <div className="text-3xl font-bold text-theme-text">
              Rs. {product.price.toFixed(2)}
            </div>
          </div>

          <p className="text-theme-muted text-lg leading-relaxed">{product.description}</p>

          {/* FEATURES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-theme-bg rounded-2xl flex gap-3 border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">Fast Delivery</div>
                <div className="text-xs text-theme-muted">2–4 days shipping</div>
              </div>
            </div>

            <div className="p-4 bg-theme-bg rounded-2xl flex gap-3 border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-theme-brand">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">Handmade</div>
                <div className="text-xs text-theme-muted">Premium quality yarn</div>
              </div>
            </div>
          </div>

          {/* QUANTITY */}
          <div className="flex items-center gap-6">
            <span className="font-medium text-theme-text">Quantity</span>

            <div className="flex items-center bg-theme-bg rounded-full p-1 border border-gray-100 shadow-sm">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="w-10 text-center font-bold">{quantity}</span>

              <button
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs text-theme-muted uppercase tracking-wider font-bold">
              {product.stock} in stock
            </span>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleAddToCart}
              className={`flex-[2] py-5 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                isInCart
                  ? "bg-theme-text text-white"
                  : "bg-white border-2 border-theme-brand text-theme-brand hover:bg-theme-light-pink"
              }`}
            >
              {isInCart ? "Remove from Cart" : "Add to Cart"}
              {!isInCart && <ShoppingBag className="w-5 h-5" />}
            </button>

            <button
              onClick={handleToggleWishlist}
              className={`flex-1 py-5 rounded-full font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                isFavorite
                  ? "bg-theme-brand text-white border-theme-brand"
                  : "bg-white border-gray-100 text-theme-muted hover:text-theme-brand hover:border-theme-brand"
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
              Wishlist
            </button>
          </div>

          <button
            onClick={handleBuyNow}
            className="w-full py-5 rounded-full bg-theme-brand text-white font-bold text-lg shadow-lg shadow-pink-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Buy It Now
          </button>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {related.length > 0 && (
        <section className="border-t border-gray-100 pt-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-serif text-theme-text mb-2">
                Related Cuties
              </h2>
              <p className="text-theme-muted font-medium">
                You might also love these from the {product.category} collection.
              </p>
            </div>
            <Link
              to="/shop"
              className="text-theme-brand font-bold flex items-center gap-1 hover:underline"
            >
              Shop All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {related.map((item, i) => (
              <ProductCard key={item.id} product={item} index={i} />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
