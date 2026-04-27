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
  MapPin,
  Loader2,
  Package,
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
    localStorage.removeItem("checkout_draft");
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

      {/* Improved Confirmation Modal with Item Details */}
      <AnimatePresence>
        {showConfirmModal && orderPayload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[30px] max-w-lg w-full shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 md:p-8 pb-4 shrink-0 relative text-center">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 bg-theme-light-pink rounded-full flex items-center justify-center mx-auto mb-4 text-theme-brand">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3
                  style={cursiveStyle}
                  className="text-4xl font-bold text-gray-900"
                >
                  Review Order
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Please confirm your details below
                </p>
              </div>

              {/* Scrollable Content */}
              <div className="px-6 md:px-8 overflow-y-auto pb-4 custom-scrollbar">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-6 space-y-5 text-sm font-sans">
                  {/* Shipping Details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">
                      <MapPin className="w-4 h-4" /> Shipping Address
                    </div>
                    <p className="font-bold text-gray-900 text-base">
                      {orderPayload.customerName}
                    </p>
                    <p className="text-gray-600">{orderPayload.phone}</p>
                    <p className="text-gray-600 leading-relaxed pr-4">
                      {orderPayload.address}
                    </p>
                  </div>

                  <div className="w-full h-px bg-gray-200" />

                  {/* Items List */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-wider">
                      <Package className="w-4 h-4" /> Items (
                      {orderPayload.items.reduce(
                        (acc, item) => acc + item.quantity,
                        0,
                      )}
                      )
                    </div>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {items.map((cartItem) => (
                        <div
                          key={cartItem.id}
                          className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm"
                        >
                          <img
                            src={cartItem.imageUrls?.[0] || cartItem.imageUrl}
                            alt={cartItem.title}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-50 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate text-sm">
                              {cartItem.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Qty: {cartItem.quantity}
                            </p>
                          </div>
                          <div className="font-bold text-theme-brand text-sm shrink-0 pl-2">
                            Rs.{" "}
                            {(cartItem.price * cartItem.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-full h-px bg-gray-200" />

                  {/* Payment Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-wider">
                      <CreditCard className="w-4 h-4" /> Payment
                    </div>
                    <div className="font-bold text-gray-900 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                      {orderPayload.paymentMethod === "cod" ? (
                        <>
                          <Truck className="w-4 h-4 text-theme-brand" /> Cash on
                          Delivery
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4 text-theme-brand" /> QR
                          Transfer
                        </>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-px bg-gray-200" />

                  {/* Total Info */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-gray-500 font-bold text-xs uppercase tracking-wider">
                      Total
                    </div>
                    <div className="font-bold text-theme-brand text-2xl">
                      Rs. {orderPayload.total.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Informative alert for QR Payment */}
                {orderPayload.paymentMethod === "qr" && (
                  <div className="mb-2 p-4 bg-blue-50 border border-blue-100 text-blue-800 rounded-2xl flex items-start gap-3 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 text-blue-500" />
                    <p className="leading-relaxed">
                      Make sure you have completed the QR payment. We'll verify
                      your transaction before dispatching.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 md:p-8 pt-4 shrink-0 bg-white border-t border-gray-50 flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={loading}
                  className="flex-1 py-4 rounded-full font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={executeOrder}
                  disabled={loading}
                  className="flex-[2] py-4 rounded-full font-bold bg-theme-brand text-white shadow-lg shadow-pink-200 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" /> Confirm & Place Order
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
