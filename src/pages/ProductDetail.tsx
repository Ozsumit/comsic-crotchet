import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Truck } from 'lucide-react';
import { useCartStore, Product } from '../store';
import { motion } from 'motion/react';

export function ProductDetail() {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const [product, setProduct] = useState<Product | null>(null);
 const [loading, setLoading] = useState(true);
 const addItem = useCartStore(state => state.addItem);

 const handleBuyNow = () => {
 if (product) {
 addItem(product);
 navigate('/checkout');
 }
 };

 useEffect(() => {
 fetch(`/api/products/${id}`)
 .then(res => {
 if (!res.ok) throw new Error("Not found");
 return res.json();
 })
 .then(data => {
 setProduct(data);
 setLoading(false);
 })
 .catch(err => {
 console.error(err);
 setLoading(false);
 });
 }, [id]);

 if (loading) {
 return (
 <div className="flex-grow flex items-center justify-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-theme-brand"></div>
 </div>
 );
 }

 if (!product) {
 return (
 <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
 <h2 className="text-4xl font-medium text-theme-text mb-4">Product Not Found</h2>
 <p className="text-theme-muted mb-8 text-lg font-medium">Looks like this item has vanished into thin air!</p>
 <Link to="/shop" className="bg-theme-brand text-white px-8 py-4 rounded-full font-medium hover:scale-[1.02] active:scale-[0.98] transition- shadow-lg shadow-pink-200 border hover:border-pink-200">
 Back to Shop
 </Link>
 </div>
 );
 }

 return (
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 transition={{ duration: 0.4 }}
 className="max-w-6xl mx-auto w-full pt-4 pb-12 flex flex-col md:flex-row gap-10"
 >
 {/* Back button and Image */}
 <div className="flex-1 flex flex-col gap-4">
 <Link to="/shop" className="inline-flex items-center text-theme-muted hover:text-theme-brand transition-colors font-medium self-start w-max">
 <ArrowLeft className="w-5 h-5 mr-2" /> Back to Shop
 </Link>
 <div className="w-full aspect-square bg-theme-light-pink-box rounded-2xl border border-gray-100 flex items-center justify-center p-4">
 <motion.img 
 initial={{ scale: 0.9, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ delay: 0.2, duration: 0.5 }}
 src={product.imageUrl} 
 alt={product.title} 
 className="w-full h-full object-cover mix-blend-multiply rounded-2xl"
 />
 </div>
 </div>

 {/* Details */}
 <div className="flex-1 flex flex-col pt-8 md:pt-16 px-4 md:px-0">
 <span className="bg-white px-4 py-2 rounded-full text-xs font-medium uppercase tracking-widest text-theme-muted w-max mb-6 border border-gray-100 shadow-sm ">
 {product.category}
 </span>
 <h1 className="text-4xl md:text-6xl font-medium text-theme-text mb-4 leading-tight">{product.title}</h1>
 <div className="text-4xl font-medium text-theme-brand mb-6 drop-shadow-sm">${product.price.toFixed(2)}</div>
 
 <p className="text-theme-muted text-lg mb-8 leading-relaxed font-medium">
 {product.description}
 </p>

 <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4 mb-8 hover:scale-[1.01] transition-">
 <div className="flex items-center gap-4">
 <div className="p-4 bg-theme-light-green rounded-full">
 <Truck className="w-6 h-6 text-green-600" />
 </div>
 <div>
 <div className="font-medium text-theme-text">Free Shipping</div>
 <div className="text-sm font-medium text-theme-muted">Estimated delivery: 2-4 business days</div>
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-4">
 <button 
 onClick={() => addItem(product)}
 disabled={product.stock <= 0}
 className="w-full bg-theme-light-pink text-theme-brand hover:text-white py-5 rounded-full font-medium text-xl hover:bg-theme-brand hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 border hover:border-pink-200"
 >
 <ShoppingBag className="w-6 h-6" />
 {product.stock > 0 ? 'Add to Basket' : 'Out of Stock'}
 </button>
 {product.stock > 0 && (
 <button
 onClick={handleBuyNow}
 className="w-full bg-theme-brand text-white py-5 rounded-full font-medium text-xl shadow-lg shadow-pink-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border hover:border-white"
 >
 Buy it Now
 </button>
 )}
 </div>
 {product.stock > 0 && product.stock <= 3 && (
 <p className="text-center text-sm font-normal text-orange-500 mt-4">
 Only {product.stock} left in stock!
 </p>
 )}
 </div>
 </motion.div>
 );
}
