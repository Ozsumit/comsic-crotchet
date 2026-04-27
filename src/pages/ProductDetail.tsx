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
} from "lucide-react";
import { useCartStore, Product } from "../store";
import { motion, AnimatePresence } from "framer-motion";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
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

  const cartItem = product
    ? items.find((item) => item.id === product.id)
    : null;

  const isInCart = !!cartItem;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
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
      setAddedToCart(false);
    } else {
      addItem(product, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 1500);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product, quantity);
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
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
      className="max-w-7xl mx-auto px-4 md:px-8 py-10"
    >
      {/* BACK */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* IMAGE SECTION */}
        <div className="space-y-6">
          {/* MAIN IMAGE */}
          <div
            className="relative aspect-square h-[25rem] md:h-[35rem] rounded-3xl overflow-hidden bg-white shadow-xl border"
            onMouseEnter={() => setShowZoom(true)}
            onMouseLeave={() => setShowZoom(false)}
            onMouseMove={handleMouseMove}
          >
            {/* BASE IMAGE */}
            <img
              src={images[activeImageIdx]}
              className="w-full h-full object-cover"
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow"
                >
                  <ChevronLeft />
                </button>

                <button
                  onClick={() =>
                    setActiveImageIdx((p) => (p + 1) % images.length)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow"
                >
                  <ChevronRight />
                </button>
              </>
            )}
          </div>

          {/* THUMBNAILS */}
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIdx(i)}
                  className={`w-20 aspect-square rounded-xl overflow-hidden border-2 transition ${
                    i === activeImageIdx
                      ? "border-black scale-105"
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
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl font-bold">{product.title}</h1>

          <div className="text-3xl font-bold text-black">
            Rs. {product.price.toFixed(2)}
          </div>

          <p className="text-gray-600 text-lg">{product.description}</p>

          {/* FEATURES */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-2xl flex gap-3">
              <Truck className="text-green-600" />
              <div>
                <div className="font-semibold">Fast Delivery</div>
                <div className="text-sm text-gray-500">2–4 days</div>
              </div>
            </div>

            <div className="p-4 border rounded-2xl flex gap-3">
              <ShieldCheck className="text-black" />
              <div>
                <div className="font-semibold">Handmade</div>
                <div className="text-sm text-gray-500">Premium quality</div>
              </div>
            </div>
          </div>

          {/* QUANTITY */}
          <div className="flex items-center gap-4">
            <span className="text-sm">Quantity</span>

            <div className="flex items-center border rounded-full px-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2"
              >
                <Minus />
              </button>

              <span className="w-10 text-center">{quantity}</span>

              <button
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
                className="p-2"
              >
                <Plus />
              </button>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              className={`flex-1 py-4 rounded-full font-semibold ${
                isInCart
                  ? "bg-black text-white border-black"
                  : "bg-none border border-black text-black"
              }`}
            >
              {isInCart ? "Remove from Cart" : "Add to Cart"}
            </button>

            <button
              onClick={handleBuyNow}
              className="flex-1 py-4 rounded-full bg-theme-brand text-white font-semibold"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
