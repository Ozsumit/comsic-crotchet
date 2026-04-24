/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Admin } from "./pages/Admin";
import { Track } from "./pages/Track";
import { ProductDetail } from "./pages/ProductDetail";
import { AnimatePresence } from "motion/react";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/track" element={<Track />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col overflow-x-hidden font-sans bg-theme-bg text-theme-text">
        <Navbar />
        <main className="flex-grow flex flex-col p-4 sm:p-8">
          <AnimatedRoutes />
        </main>

        <footer className="px-6 sm:px-10 py-4 bg-theme-border/30 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center text-[11px] font-normal text-theme-muted uppercase tracking-widest mt-auto">
          <div className="flex gap-6 mb-4 sm:mb-0">
            <span>Secure Checkout</span>
            <span>Cloud Hosting Active</span>
          </div>
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Order System Online
            </span>
            <span>&copy; {new Date().getFullYear()} Pastel Stitches</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
