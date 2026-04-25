import { Link } from "react-router-dom";
import { ArrowRight, Star, Heart, Zap, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Product } from "../store";
import { motion } from "motion/react";
import { ProductCard } from "../components/ProductCard";

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full"
    >
      {/* Playful Hero Section */}
      <div className="bg-theme-hero-bg p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-between relative overflow-hidden rounded-[40px] shadow-sm transform hover:scale-[1.01] transition-transform duration-500 mt-4 border border-theme-hero-accent/10">
        <div className="z-10 w-full max-w-[500px] text-center md:text-left mb-8 md:mb-0">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-pink-100 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-theme-brand" />
            <span className="text-theme-brand text-xs font-bold tracking-widest uppercase">
              New Spring Collection
            </span>
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-serif leading-tight text-theme-hero-text mb-6">
            Handmade{" "}
            <span className="text-theme-hero-accent inline-block transform -rotate-2">
              with Love
            </span>
          </h1>
          <p className="text-theme-hero-muted mb-8 font-light text-xl leading-relaxed">
            Discover cute amigurumi plushies, adorable crochet accessories, and
            whimsical treasures for everyday life.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <Link
              to="/shop"
              className="w-full sm:w-auto bg-theme-brand text-white px-8 py-4 font-semibold shadow-sm hover:shadow-md hover:-translate-y-1 active:translate-y-0 transition-all rounded-full flex items-center justify-center gap-2 border-[3px] border-transparent hover:border-pink-200"
            >
              Explore Shop <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Abstract Floating Shapes (Playful vibe) */}
        <div className="relative w-full md:w-1/2 min-h-[300px] flex justify-center items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute w-[350px] h-[350px] bg-[#B2E2F2] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] opacity-60 mix-blend-multiply"
          ></motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute w-[300px] h-[300px] bg-theme-light-pink rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-80 mix-blend-multiply top-4 left-4"
          ></motion.div>
          <div className="relative z-10 w-64 h-64 bg-white/40 flex flex-col items-center justify-center border-[6px] border-white backdrop-blur-sm rounded-[30px] transform hover:rotate-3 transition-transform duration-500 shadow-xl">
            <Heart className="w-16 h-16 text-theme-brand fill-theme-brand mb-4 animate-pulse" />
            <img src="/logo.svg" alt="Logo" className="w-42 h-24" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {["Premium Yarn", "Ethically Made", "Worldwide Shipping"].map(
          (feature, idx) => (
            <div
              key={idx}
              className="bg-theme-bg p-6 rounded-3xl border border-theme-border/50 flex flex-col items-center text-center hover:-translate-y-1 transition-transform"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-theme-brand">
                {idx === 0 && <Sparkles className="w-6 h-6" />}
                {idx === 1 && <Heart className="w-6 h-6" />}
                {idx === 2 && <Zap className="w-6 h-6" />}
              </div>
              <h3 className="font-serif text-lg text-theme-text">{feature}</h3>
              <p className="text-sm text-theme-muted mt-2 font-medium">
                Crafted carefully with best practices & lots of love.
              </p>
            </div>
          ),
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-theme-brand"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-16 mt-8">
          <section>
            <div className="flex items-end justify-between mb-8 px-2">
              <div>
                <h2 className="text-3xl font-serif text-theme-text mb-2">
                  Recently Added
                </h2>
                <p className="text-theme-muted font-medium">
                  Fresh out of the crochet hook!
                </p>
              </div>
              <Link
                to="/shop"
                className="hidden sm:flex text-theme-brand font-medium hover:opacity-80 items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recent.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </section>

          <section
            id="popular"
            className="py-12 bg-theme-light-pink-box px-8 rounded-3xl border border-pink-100 relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(var(--color-theme-brand) 1.5px, transparent 1.5px)",
                backgroundSize: "24px 24px",
              }}
            ></div>
            <div className="relative z-10 text-center mb-10">
              <h2 className="text-4xl font-serif text-theme-text mb-4">
                Trending Cuties
              </h2>
              <p className="text-theme-muted font-medium max-w-xl mx-auto">
                These adorable creations are finding new homes fast. Grab them
                before they're gone!
              </p>
            </div>
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {popular.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i + 2} />
              ))}
            </div>
          </section>

          {/* Customer Reviews added */}
          <section className="mb-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-serif text-theme-text mb-2">
                Happy Customers
              </h2>
              <p className="text-theme-muted font-medium">
                See what they're saying
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: "Sarah J.",
                  text: "Absolutely in love with my strawberry cow plushie! So soft and cuddly.",
                },
                {
                  name: "Emily R.",
                  text: "The craftsmanship is incredible. Will definitely be buying more gifts here!",
                },
                {
                  name: "Jessica M.",
                  text: "Fast shipping and the cutest packaging. Made my entire week!",
                },
              ].map((review, i) => (
                <div
                  key={i}
                  className="bg-white p-8 rounded-[30px] border border-theme-border shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform"
                >
                  <div>
                    <div className="flex gap-1 mb-4 text-[#FDE047]">
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <p className="text-theme-muted italic mb-6 text-lg tracking-tight">
                      "{review.text}"
                    </p>
                  </div>
                  <p className="font-serif text-theme-text text-xl">
                    - {review.name}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </motion.div>
  );
}
