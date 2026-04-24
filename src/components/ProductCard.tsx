import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { Product, useCartStore } from '../store';

export function ProductCard({ product, index }: { product: Product, index: number }) {
 const addItem = useCartStore(state => state.addItem);
 
 const bgColors = [
 'bg-theme-light-pink-box', 
 'bg-theme-light-yellow', 
 'bg-theme-light-purple',
 'bg-theme-light-green'
 ];
 const bgClass = bgColors[index % bgColors.length];

 return (
 <motion.div 
 layout
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.4 }}
 className="bg-white p-4 rounded-3xl border border-gray-100 flex flex-col hover:-translate-y-1 transition-all duration-300 group shadow-sm hover:shadow-xl"
 >
 <Link to={`/product/${product.id}`} className={`w-full aspect-square ${bgClass} rounded-2xl mb-5 overflow-hidden relative block transition-all duration-500`}>
 <motion.img 
 whileHover={{ scale: 1.05 }}
 transition={{ duration: 0.6, ease: "easeOut" }}
 src={product.imageUrl} 
 alt={product.title} 
 className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90 transition-opacity group-hover:opacity-100" 
 />
 {product.stock <= 0 && (
 <div className="absolute inset-0 bg-white/40 flex items-center justify-center backdrop-blur-[2px]">
 <span className="bg-white/90 px-4 py-2 text-xs font-semibold text-red-500 uppercase tracking-widest shadow-sm rounded-full">Sold Out</span>
 </div>
 )}
 </Link>
 <div className="px-2 flex flex-col flex-grow">
 <Link to={`/product/${product.id}`}>
 <h3 className="font-semibold text-lg text-theme-text group-hover:text-theme-brand transition-colors line-clamp-1">{product.title}</h3>
 </Link>
 <p className="text-xl text-theme-muted mb-4 font-serif mt-1">{product.category}</p>
 <div className="mt-auto flex justify-between items-center pt-2">
 <span className="font-semibold text-theme-brand text-xl">${product.price.toFixed(2)}</span>
 <button
 onClick={() => addItem(product)}
 disabled={product.stock <= 0}
 className="w-10 h-10 bg-theme-light-pink flex items-center justify-center font-medium text-theme-brand hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 rounded-full hover:bg-theme-brand hover:text-white shadow-sm"
 aria-label="Add to cart"
 >
 <ShoppingCart className="w-4 h-4" />
 </button>
 </div>
 </div>
 </motion.div>
 );
}
