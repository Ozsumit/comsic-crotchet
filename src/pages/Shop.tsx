import { useEffect, useState } from 'react';
import { useCartStore, Product } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';

const CATEGORIES = [
 { id: 'all', label: 'Shop All' },
 { id: 'plushies', label: 'Amigurumi' },
 { id: 'apparel', label: 'Apparel' },
 { id: 'home-decor', label: 'Home Decor' },
 { id: 'accessories', label: 'Accessories' }
];

export function Shop() {
 const [products, setProducts] = useState<Product[]>([]);
 const [loading, setLoading] = useState(true);
 const [activeCategory, setActiveCategory] = useState('all');
 const addItem = useCartStore(state => state.addItem);

 useEffect(() => {
 setLoading(true);
 let url = '/api/products';
 if (activeCategory !== 'all') {
 url += `?category=${activeCategory}`;
 }
 fetch(url)
 .then(res => res.json())
 .then(data => {
 setProducts(data);
 setLoading(false);
 })
 .catch(err => {
 console.error("Failed to fetch products", err);
 setLoading(false);
 });
 }, [activeCategory]);

 return (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 transition={{ duration: 0.3 }}
 className="max-w-7xl mx-auto w-full flex flex-col items-center"
 >
 <h1 className="text-4xl font-serif text-theme-text mb-6 text-center pt-8">
 Discover Cuties
 </h1>
 
 {/* Category Filter */}
 <div className="flex flex-wrap justify-center gap-3 mb-12 w-full">
 {CATEGORIES.map(category => (
 <button
 key={category.id}
 onClick={() => setActiveCategory(category.id)}
 className={`px-6 py-2 transition-all whitespace-nowrap rounded-full border ${
 activeCategory === category.id 
 ? 'bg-theme-text text-white border-theme-text font-medium' 
 : 'bg-transparent text-theme-muted border-gray-100 hover:bg-theme-hover hover:text-theme-text font-normal'
 }`}
 >
 {category.label}
 </button>
 ))}
 </div>

 {loading ? (
 <div className="flex justify-center items-center flex-grow py-20">
 <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-theme-brand"></div>
 </div>
 ) : products.length === 0 ? (
 <div className="text-center py-20 text-theme-muted">
 No items found in this category yet!
 </div>
 ) : (
 <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
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
