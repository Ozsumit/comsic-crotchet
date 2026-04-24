import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, Menu } from 'lucide-react';
import { useCartStore } from '../store';

export function Navbar() {
 const items = useCartStore(state => state.items);
 const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

 return (
 <header className="flex items-center justify-between px-6 sm:px-10 py-5 bg-white/80 backdrop-blur-md border-b border-gray-100/50 sticky top-0 z-50">
 <div className="flex items-center gap-4">
 <Link to="/" className="text-3xl text-theme-brand font-serif hover:opacity-80 transition-opacity">
 Pastel Stitches
 </Link>
 </div>
 
 <nav className="hidden md:flex gap-8 font-medium text-sm text-theme-muted tracking-wide items-center">
 <Link to="/" className="hover:text-theme-brand transition-colors">Home</Link>
 <Link to="/shop" className="hover:text-theme-brand transition-colors">Shop All</Link>
 <Link to="/track" className="hover:text-theme-brand transition-colors px-3 py-1 bg-gray-50 border border-gray-100 rounded-full">Track Order</Link>
 </nav>

 <div className="flex items-center gap-4">
 <div className="relative">
 <Link to="/cart" className="bg-theme-bg text-theme-brand px-5 py-2.5 rounded-full font-medium flex items-center gap-2 hover:bg-theme-light-pink transition-colors">
 <ShoppingBag className="w-5 h-5" />
 <span>{itemCount} Items</span>
 </Link>
 </div>
 </div>
 </header>
 );
}
