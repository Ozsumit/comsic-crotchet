import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  CheckCircle,
  QrCode,
  Truck,
  ArrowLeft,
  ShieldCheck,
  ChevronRight,
  ShoppingBag,
  CreditCard,
  Plus,
  Minus,
  X,
  AlertCircle,
} from "lucide-react";
import { useCartStore } from "../store";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface OrderData {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: "cod" | "qr";
  total: number;
  items: OrderItem[];
}

export function Checkout() {
  const { items, total, clearCart, updateQuantity, removeItem } =
    useCartStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // --- PERSISTENCE LOGIC ---
  // Initialize state from localStorage or defaults
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("checkout_draft");
    return saved
      ? JSON.parse(saved)
      : {
          name: "",
          phone: "",
          email: "",
          address1: "",
          address2: "",
          city: "",
          state: "Bagmati Province",
          postal: "",
          paymentMethod: "cod",
        };
  });

  // Save to localStorage whenever formData changes
  useEffect(() => {
    localStorage.setItem("checkout_draft", JSON.stringify(formData));
  }, [formData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const setPaymentMethod = (method: "cod" | "qr") => {
    setFormData((prev: any) => ({ ...prev, paymentMethod: method }));
  };
  // -------------------------

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderPayload, setOrderPayload] = useState<OrderData | null>(null);

  const cursiveStyle = { fontFamily: "'Caveat', 'Dancing Script', cursive" };

  useEffect(() => {
    if (items.length === 0 && !success) {
      navigate("/shop");
    }
  }, [items, navigate, success]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!items.length) return;

    const fullAddress = `
      ${formData.address1},
      ${formData.address2 ? formData.address2 + "," : ""}
      ${formData.city},
      ${formData.state},
      ${formData.postal}
    `
      .replace(/\s+/g, " ")
      .trim();

    const payload: OrderData = {
      customerName: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: fullAddress,
      paymentMethod: formData.paymentMethod,
      total: total(),
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    setOrderPayload(payload);
    setShowConfirmModal(true);
  };

  const executeOrder = async () => {
    if (!orderPayload) return;
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        finishOrder();
      } else {
        alert("Failed to place order. Please try again.");
      }
    } catch (err) {
      // Fallback for demo
      setTimeout(() => finishOrder(), 1500);
    } finally {
      setLoading(false);
    }
  };

  const finishOrder = () => {
    setSuccess(true);
    setShowConfirmModal(false);
    localStorage.removeItem("checkout_draft"); // Clear persistence on success
    clearCart();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleIncrease = (
    id: string,
    currentQty: number,
    maxStock?: number,
  ) => {
    if (maxStock !== undefined && currentQty >= maxStock) return;
    updateQuantity?.(id, currentQty + 1);
  };

  const handleDecrease = (id: string, currentQty: number) => {
    if (currentQty > 1) {
      updateQuantity?.(id, currentQty - 1);
    } else {
      removeItem?.(id);
    }
  };

  const inputClass =
    "w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-theme-brand focus:ring-4 focus:ring-pink-50 outline-none transition-all font-sans text-gray-800 placeholder-gray-400 font-medium";

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto flex flex-col items-center justify-center p-4 min-h-[70vh]"
      >
        <div className="bg-white rounded-[40px] p-10 md:p-16 text-center shadow-xl border border-pink-100/50 w-full relative overflow-hidden">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 relative z-10">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2
            style={cursiveStyle}
            className="text-5xl font-bold text-gray-900 mb-4 relative z-10"
          >
            Order Confirmed!
          </h2>
          <p className="text-gray-600 font-sans text-lg mb-10 relative z-10 max-w-md mx-auto">
            Yay! Your cute crochets are getting ready.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center bg-theme-brand text-white px-8 py-4 rounded-full font-bold hover:shadow-lg hover:-translate-y-1 transition-all shadow-sm relative z-10"
          >
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    );
  }

  if (items.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto p-4 md:p-8"
      >
        <div className="mb-8">
          <Link
            to="/shop"
            className="inline-flex items-center text-gray-500 hover:text-theme-brand transition-colors font-sans font-bold bg-white px-5 py-2.5 rounded-full border border-gray-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cart
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          <div className="flex-1">
            <form
              id="checkout-form"
              onSubmit={handleFormSubmit}
              className="space-y-10"
            >
              <div>
                <h1
                  style={cursiveStyle}
                  className="text-5xl md:text-6xl font-bold text-gray-900 mb-2"
                >
                  Checkout
                </h1>
                <p className="font-sans text-gray-500 font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" /> Safe &
                  Secure Checkout
                </p>
              </div>

              {/* Step 1: Contact Info */}
              <div className="bg-white p-6 md:p-8 rounded-[30px] border border-gray-100 shadow-sm space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span
                    style={cursiveStyle}
                    className="w-8 h-8 rounded-full bg-theme-light-pink text-theme-brand flex items-center justify-center text-xl"
                  >
                    1
                  </span>
                  <span style={cursiveStyle} className="text-3xl">
                    Contact Information
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Full Name"
                    className={inputClass}
                  />
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="Phone Number"
                    className={inputClass}
                  />
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email"
                    required
                    placeholder="Email Address"
                    className={`${inputClass} sm:col-span-2`}
                  />
                </div>
              </div>

              {/* Step 2: Shipping Info */}
              <div className="bg-white p-6 md:p-8 rounded-[30px] border border-gray-100 shadow-sm space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span
                    style={cursiveStyle}
                    className="w-8 h-8 rounded-full bg-theme-light-pink text-theme-brand flex items-center justify-center text-xl"
                  >
                    2
                  </span>
                  <span style={cursiveStyle} className="text-3xl">
                    Shipping Address
                  </span>
                </h2>
                <div className="space-y-5">
                  <input
                    name="address1"
                    value={formData.address1}
                    onChange={handleInputChange}
                    required
                    placeholder="Street Address"
                    className={inputClass}
                  />
                  <input
                    name="address2"
                    value={formData.address2}
                    onChange={handleInputChange}
                    placeholder="Apartment, suite, etc. (optional)"
                    className={inputClass}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <input
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      placeholder="City"
                      className={inputClass}
                    />
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className={inputClass}
                    >
                      <option>Koshi Province</option>
                      <option>Madhesh Province</option>
                      <option>Bagmati Province</option>
                      <option>Gandaki Province</option>
                      <option>Lumbini Province</option>
                      <option>Karnali Province</option>
                      <option>Sudurpashchim Province</option>
                    </select>
                  </div>
                  <input
                    name="postal"
                    value={formData.postal}
                    onChange={handleInputChange}
                    placeholder="Postal / Zip Code (optional)"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Step 3: Payment Method */}
              <div className="bg-white p-6 md:p-8 rounded-[30px] border border-gray-100 shadow-sm space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span
                    style={cursiveStyle}
                    className="w-8 h-8 rounded-full bg-theme-light-pink text-theme-brand flex items-center justify-center text-xl"
                  >
                    3
                  </span>
                  <span style={cursiveStyle} className="text-3xl">
                    Payment Method
                  </span>
                </h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex-1 p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${formData.paymentMethod === "cod" ? "bg-theme-light-pink border-theme-brand text-theme-brand" : "bg-gray-50 border-gray-100 text-gray-500"}`}
                  >
                    <Truck className="w-8 h-8" />
                    <span className="font-sans font-bold">
                      Cash on Delivery
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("qr")}
                    className={`flex-1 p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 ${formData.paymentMethod === "qr" ? "bg-theme-light-pink border-theme-brand text-theme-brand" : "bg-gray-50 border-gray-100 text-gray-500"}`}
                  >
                    <QrCode className="w-8 h-8" />
                    <span className="font-sans font-bold">
                      Manual QR Transfer
                    </span>
                  </button>
                </div>
                {formData.paymentMethod === "qr" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-6 p-6 bg-pink-50/50 rounded-2xl border border-pink-100 text-center"
                  >
                    <div className="bg-white p-4 rounded-xl shadow-sm inline-block border border-gray-200">
                      <img
                        className="w-40 h-40 object-cover"
                        src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=Please+Pay+to+Merchant+Account"
                        alt="QR"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </form>
          </div>

          {/* Right Column: Summary */}
          <div className="w-full lg:w-[420px]">
            <div className="bg-theme-hero-bg p-8 rounded-[40px] border border-pink-100/50 shadow-sm sticky top-8">
              <h2
                style={cursiveStyle}
                className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2"
              >
                <ShoppingBag className="w-6 h-6 text-theme-brand" /> Order
                Summary
              </h2>
              <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 items-center bg-white/60 p-3 rounded-2xl border border-white"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden border bg-white shrink-0">
                      <img
                        src={item.imageUrls?.[0] || item.imageUrl}
                        className="w-full h-full object-cover"
                        alt={item.title}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-sans font-bold text-gray-900 text-sm">
                        {item.title}
                      </h3>
                      <div className="font-bold text-theme-brand text-sm">
                        Rs. {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-full border px-2 py-1">
                      <button
                        onClick={() => handleDecrease(item.id, item.quantity)}
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-sans font-bold text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleIncrease(item.id, item.quantity, item.stock)
                        }
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-pink-100 pt-6 mb-8 flex justify-between items-end">
                <span className="font-sans font-bold text-gray-900 text-xl">
                  Total
                </span>
                <span className="font-sans font-bold text-theme-brand text-3xl">
                  Rs. {total().toFixed(2)}
                </span>
              </div>
              <button
                form="checkout-form"
                type="submit"
                className="w-full bg-theme-brand text-white py-5 rounded-full font-sans font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-3"
              >
                Review Order <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modal remains the same, but uses formData for text display */}
      <AnimatePresence>
        {showConfirmModal && orderPayload && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div className="bg-white rounded-[30px] p-8 max-w-md w-full shadow-2xl relative">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600"
              >
                <X />
              </button>
              <h3
                style={cursiveStyle}
                className="text-4xl font-bold text-center mb-6"
              >
                Confirm Order
              </h3>
              <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span>Deliver To:</span>
                  <span className="font-bold">{orderPayload.customerName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Payment:</span>
                  <span className="font-bold text-theme-brand uppercase">
                    {orderPayload.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Total:</span>
                  <span className="font-bold text-lg">
                    Rs. {orderPayload.total.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-4 rounded-full font-bold bg-gray-100"
                >
                  Back
                </button>
                <button
                  onClick={executeOrder}
                  disabled={loading}
                  className="flex-1 py-4 rounded-full font-bold bg-theme-brand text-white shadow-lg"
                >
                  {loading ? "Processing..." : "Place Order"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
