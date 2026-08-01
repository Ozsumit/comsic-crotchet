import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, Mail, MapPin, Phone, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 px-6 sm:px-10 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        {/* Brand Section */}
        <div className="flex flex-col gap-6">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="Logo" className="w-32" />
          </Link>
          <p className="text-theme-muted text-sm leading-relaxed max-w-xs">
            Handcrafting cute amigurumi plushies and accessories to bring a little bit of magic into your everyday life.
          </p>
          <div className="flex gap-4">
            {[Instagram, Twitter, Facebook].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-10 h-10 rounded-full bg-theme-bg flex items-center justify-center text-theme-muted hover:bg-theme-brand hover:text-white transition-all shadow-sm"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-serif text-xl text-theme-text mb-6">Shop</h4>
          <ul className="flex flex-col gap-4 text-sm text-theme-muted">
            <li><Link to="/shop" className="hover:text-theme-brand transition-colors">All Products</Link></li>
            <li><Link to="/shop?category=plushies" className="hover:text-theme-brand transition-colors">Amigurumi</Link></li>
            <li><Link to="/shop?category=accessories" className="hover:text-theme-brand transition-colors">Accessories</Link></li>
            <li><Link to="/wishlist" className="hover:text-theme-brand transition-colors">My Wishlist</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-serif text-xl text-theme-text mb-6">Support</h4>
          <ul className="flex flex-col gap-4 text-sm text-theme-muted">
            <li><Link to="/track" className="hover:text-theme-brand transition-colors">Track Order</Link></li>
            <li><Link to="/sellers" className="hover:text-theme-brand transition-colors font-semibold text-theme-brand">Seller Portal</Link></li>
            <li><a href="#" className="hover:text-theme-brand transition-colors">Shipping Policy</a></li>
            <li><a href="#" className="hover:text-theme-brand transition-colors">Returns & Exchanges</a></li>
            <li><a href="#" className="hover:text-theme-brand transition-colors">FAQ</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-serif text-xl text-theme-text mb-6">Stay in Touch</h4>
          <p className="text-sm text-theme-muted mb-4">Subscribe for new releases and secret sales!</p>
          <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email address"
              className="w-full px-4 py-3 rounded-2xl bg-theme-bg border border-gray-100 focus:bg-white focus:border-theme-brand outline-none text-sm transition-all"
            />
            <button className="w-full bg-theme-brand text-white py-3 rounded-2xl font-semibold text-sm hover:shadow-md transition-all active:scale-95">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto border-t border-gray-50 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center text-[11px] font-normal text-theme-muted uppercase tracking-widest">
          <div className="flex gap-6">
            <span>Pastel Stitches</span>
            <span>
              Developed in partnership with{" "}
              <a
                href="https://sumit.info.np"
                target="_blank"
                rel="noopener noreferrer"
                className="text-theme-brand hover:underline"
              >
                Comsic
              </a>
            </span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Order System Online
            </span>
          </div>
        </div>
        <div className="text-[11px] font-normal text-theme-muted uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Pastel Stitches. Made with <Heart className="w-3 h-3 inline fill-theme-brand text-theme-brand" /> for you.
        </div>
      </div>
    </footer>
  );
}
