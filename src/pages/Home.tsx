import { Link } from "react-router-dom";
import { ArrowRight, Star, Heart, Zap, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Product } from "../store";
import { motion } from "motion/react";
import { ProductCard } from "../components/ProductCard";

// Helper component for a decorative wooden/plastic sewing button
function SewingButton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-4 h-4 rounded-full bg-[#E6C594] border-2 border-[#C99A5C] relative flex items-center justify-center shadow-sm shrink-0 ${className}`}
    >
      {/* 4 thread holes */}
      <div className="grid grid-cols-2 gap-[2px]">
        <span className="w-0.5 h-0.5 bg-[#8F6636] rounded-full" />
        <span className="w-0.5 h-0.5 bg-[#8F6636] rounded-full" />
        <span className="w-0.5 h-0.5 bg-[#8F6636] rounded-full" />
        <span className="w-0.5 h-0.5 bg-[#8F6636] rounded-full" />
      </div>
    </div>
  );
}

// Helper component for cross stitch decoration
function CrossStitch({ className = "" }: { className?: string }) {
  return (
    <span
      className={`text-[#D4A373]/50 font-mono select-none pointer-events-none text-xs ${className}`}
    >
      ✦ ✕ ✦
    </span>
  );
}

export function Home() {
  const [recent, setRecent] = useState<Product[]>([]);
  const [popular, setPopular] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        setRecent(data.slice(0, 4));
        setPopular([...data].sort(() => 0.5 - Math.random()).slice(0, 4));
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col gap-8 max-w-7xl mx-auto w-full relative px-4 md:px-6 py-2"
    >
      {/* Compact Hand-Stitched Hero Section */}
      <div className="bg-[#FFFDF9] p-6 md:p-10 flex flex-col lg:flex-row items-center justify-between relative overflow-hidden rounded-[28px] border-4 border-dashed border-theme-hero-accent/20 shadow-sm mt-2">
        {/* Soft fabric warm overlay grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#000 1px, transparent 1px), radial-gradient(#000 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 10px 10px",
          }}
        />

        {/* Mini Stitched Corners decoration */}
        <div className="absolute top-3 left-3 flex gap-1">
          <CrossStitch />
        </div>
        <div className="absolute bottom-3 right-3 flex gap-1">
          <CrossStitch />
        </div>

        {/* Hero Content */}
        <div className="z-10 w-full lg:w-1/2 text-center lg:text-left flex flex-col items-center lg:items-start relative">
          {/* Sewn Fabric Label Tag */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 bg-[#FAF6F0] px-3 py-1 rounded-md mb-4 border-y-2 border-dashed border-[#E3CBB5] relative shadow-sm"
          >
            <span className="w-1 h-1 rounded-full bg-[#E57C82]" />
            <span className="text-theme-brand text-[10px] font-bold tracking-widest uppercase font-mono">
              Woven with care
            </span>
            <span className="w-1 h-1 rounded-full bg-[#E57C82]" />
          </motion.div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif leading-[1.2] text-theme-hero-text mb-4">
            Handmade{" "}
            <span className="relative inline-block text-theme-hero-accent px-1">
              with Love
              <svg
                className="absolute -bottom-1 left-0 w-full h-1.5 text-theme-brand/40"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,5 Q25,10 50,5 T100,5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="3, 3"
                />
              </svg>
            </span>
          </h1>

          <p className="text-theme-hero-muted mb-6 font-light text-base md:text-lg leading-relaxed max-w-[430px]">
            Discover cozy amigurumi plushies, stitched accessories, and
            delightful yarn treasures crafted by hand.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto z-10">
            <Link
              to="/shop"
              className="w-full sm:w-auto bg-theme-brand text-white px-6 py-3 text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all rounded-full flex items-center justify-center gap-2 border-2 border-dashed border-white/60 hover:border-white"
            >
              Explore Shop <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Craft Embroidery Hoop Visual */}
        <div className="relative w-full lg:w-1/2 flex justify-center items-center py-2 mt-6 lg:mt-0">
          <div className="absolute w-[280px] h-[280px] border border-dashed border-stone-200 rounded-full pointer-events-none" />

          {/* Wooden Embroidery Hoop Frame Container */}
          <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full border-[8px] border-[#D4A373] bg-[#F7F4EF] shadow-md flex items-center justify-center p-3">
            {/* The metal screw tightener on top of the hoop */}
            <div className="absolute -top-3 w-8 h-4 bg-[#C99A5C] rounded border border-[#8F6636] flex items-center justify-center shadow-sm">
              <span className="w-4 h-0.5 bg-[#8F6636] rounded" />
            </div>

            {/* Inner fabric stitched border circle */}
            <div className="absolute inset-1.5 rounded-full border border-dashed border-[#D4A373]/60 pointer-events-none" />

            {/* Core Card (Stitched Patch) Inside the Canvas */}
            <div className="relative z-10 w-32 h-32 sm:w-36 sm:h-36 bg-white border-2 border-dashed border-[#E3CBB5] rounded-[20px] shadow-sm flex flex-col items-center justify-center p-3">
              <SewingButton className="absolute -top-1.5 -right-1.5" />
              <SewingButton className="absolute -bottom-1.5 -left-1.5" />

              <Heart className="w-7 h-7 text-theme-brand fill-theme-brand/10 mb-1 stroke-1.5" />
              <img
                src="/logo.svg"
                alt="Logo"
                className="w-24 h-12 object-contain"
              />
              <span className="text-[8px] uppercase font-mono tracking-widest text-[#B5A18C] mt-1">
                • Soft Wool •
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sewing-Themed Divider */}
      <div className="flex items-center justify-center gap-3 text-[#D4A373]/40">
        <div className="h-[2px] flex-1 bg-dashed border-t border-dashed border-[#D4A373]/30" />
        <CrossStitch />
        <div className="h-[2px] flex-1 bg-dashed border-t border-dashed border-[#D4A373]/30" />
      </div>

      {/* Handcrafted Patches Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: <Sparkles className="w-4 h-4" />,
            title: "Premium Yarn",
            description: "Sourced from cozy, natural cotton & wool fibers.",
          },
          {
            icon: <Heart className="w-4 h-4" />,
            title: "Ethically Made",
            description: "Lovingly crafted stitch-by-stitch by hand.",
          },
          {
            icon: <Zap className="w-4 h-4" />,
            title: "Worldwide Shipping",
            description: "Safely packaged in eco-friendly paper wrap.",
          },
        ].map((feature, idx) => (
          <div
            key={idx}
            className="bg-[#FFFDF9] p-4 rounded-xl border-2 border-dashed border-[#E5DAC3] flex flex-col items-center text-center relative hover:bg-white transition-colors"
          >
            <SewingButton className="absolute top-2 right-2 scale-75" />

            <div className="w-8 h-8 bg-theme-bg rounded-full flex items-center justify-center mb-2 text-theme-brand border border-[#F4E3D3]">
              {feature.icon}
            </div>

            <h3 className="font-serif text-sm text-theme-text font-bold">
              {feature.title}
            </h3>
            <p className="text-[11px] text-theme-muted mt-1 leading-normal max-w-[240px]">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-brand"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-10 mt-2">
          {/* Recently Stitched Items */}
          <section>
            <div className="flex items-end justify-between mb-4 px-2">
              <div>
                <h2 className="text-xl md:text-2xl font-serif text-theme-text">
                  Recently Stitched
                </h2>
                <p className="text-[11px] text-theme-muted font-mono mt-0.5">
                  Fresh off the needles!
                </p>
              </div>
              <Link
                to="/shop"
                className="text-xs text-theme-brand font-semibold hover:opacity-80 flex items-center gap-1"
              >
                View full catalog <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recent.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </section>

          {/* Stitched Pattern Grid Accent */}
          <section
            id="popular"
            className="py-8 bg-[#FFFDF9] px-4 md:px-8 rounded-[24px] border-2 border-dashed border-pink-200/60 relative overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(var(--color-theme-brand, #EC4899) 1.2px, transparent 1.2px)",
                backgroundSize: "20px 20px",
              }}
            />

            <div className="relative z-10 text-center mb-6">
              <span className="text-[9px] font-mono font-semibold text-theme-brand bg-[#FAF6F0] border border-pink-100 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                Popular Patterns
              </span>
              <h2 className="text-2xl font-serif text-theme-text mt-2 mb-1">
                Trending Cuties
              </h2>
              <p className="text-[11px] text-theme-muted max-w-xs mx-auto leading-normal">
                Our most-loved handknitted companions and collectable keepsakes.
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {popular.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i + 2} />
              ))}
            </div>
          </section>

          {/* Customer Reviews Section */}
          <section className="mb-2">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-serif text-theme-text">
                Loved by Cozy Homes
              </h2>
              <p className="text-[11px] text-theme-muted font-mono mt-0.5">
                Real feedback, genuine smiles
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  name: "Sarah J.",
                  text: "Absolutely in love with my strawberry cow plushie! Stitches are incredibly neat and strong.",
                },
                {
                  name: "Emily R.",
                  text: "The craftsmanship is gorgeous. Highly recommend if you want items with true character!",
                },
                {
                  name: "Jessica M.",
                  text: "Delicate cardboard boxing, soft thread accents. Beautiful addition to my bookshelf.",
                },
              ].map((review, i) => (
                <div
                  key={i}
                  className="bg-[#FFFDF9] p-5 rounded-xl border border-[#E5DAC3] shadow-sm flex flex-col justify-between relative"
                >
                  <div className="absolute top-2 right-2 text-[9px] font-mono text-stone-300 font-bold select-none">
                    NO. 0{i + 1}
                  </div>

                  <div>
                    <div className="flex gap-1 mb-2.5 text-[#E6C594]">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-stone-600 italic leading-relaxed mb-4">
                      "{review.text}"
                    </p>
                  </div>

                  <div className="border-t border-dashed border-stone-200 pt-2 flex items-center justify-between">
                    <p className="font-serif text-stone-800 text-[11px] font-bold">
                      — {review.name}
                    </p>
                    <SewingButton className="scale-75" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </motion.div>
  );
}
