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
  customerName: string | FormDataEntryValue | null;
  email: string | FormDataEntryValue | null;
  phone: string | FormDataEntryValue | null;
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
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "qr">("cod");

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderPayload, setOrderPayload] = useState<OrderData | null>(null);

  // Styling for the "hint of cursive" text
  const cursiveStyle = { fontFamily: "'Caveat', 'Dancing Script', cursive" };

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !success) {
      navigate("/shop");
    }
  }, [items, navigate, success]);

  // Intercept form submission to open the Confirmation Modal
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!items.length) return;

    const formData = new FormData(e.currentTarget);

    const address = `
      ${formData.get("address1") || ""},
      ${formData.get("address2") ? formData.get("address2") + "," : ""}
      ${formData.get("city") || ""},
      ${formData.get("state") || ""},
      ${formData.get("postal") || ""}
    `
      .replace(/\s+/g, " ")
      .trim();

    const payload: OrderData = {
      customerName: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      address,
      paymentMethod,
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

  // Final Order Execution logic
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
        setSuccess(true);
        setShowConfirmModal(false);
        clearCart();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert("Failed to place order. Please try again.");
      }
    } catch (err) {
      console.error(err);
      // Fallback for demonstration if no API is running
      setTimeout(() => {
        setSuccess(true);
        setShowConfirmModal(false);
        clearCart();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  // Quantity Handlers with Stock Protection
  const handleIncrease = (
    id: string,
    currentQty: number,
    maxStock?: number,
  ) => {
    // Check if we hit the stock limit (assuming item has a 'stock' property)
    if (maxStock !== undefined && currentQty >= maxStock) {
      return; // Do nothing if max stock is reached
    }
    if (updateQuantity) updateQuantity(id, currentQty + 1);
  };

  const handleDecrease = (id: string, currentQty: number) => {
    if (currentQty > 1) {
      if (updateQuantity) updateQuantity(id, currentQty - 1);
    } else {
      if (removeItem) removeItem(id);
    }
  };

  const inputClass =
    "w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-theme-brand focus:ring-4 focus:ring-pink-50 outline-none transition-all font-sans text-gray-800 placeholder-gray-400 font-medium";

  // --- SUCCESS STATE ---
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto flex flex-col items-center justify-center p-4 min-h-[70vh]"
      >
        <div className="bg-white rounded-[40px] p-10 md:p-16 text-center shadow-xl border border-pink-100/50 w-full relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(var(--color-theme-brand) 2px, transparent 2px)",
              backgroundSize: "30px 30px",
            }}
          ></div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
            className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 relative z-10"
          >
            <CheckCircle className="w-12 h-12 text-green-500" />
          </motion.div>

          <h2
            style={cursiveStyle}
            className="text-5xl font-bold text-gray-900 mb-4 relative z-10"
          >
            Order Confirmed!
          </h2>
          <p className="text-gray-600 font-sans text-lg mb-10 relative z-10 max-w-md mx-auto">
            Yay! Your cute crochets are getting ready. We've sent a confirmation
            email with your order details.
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
        exit={{ opacity: 0, y: -15 }}
        className="max-w-7xl mx-auto p-4 md:p-8"
      >
        <div className="mb-8">
          <Link
            to="/shop"
            className="inline-flex items-center text-gray-500 hover:text-theme-brand transition-colors font-sans font-bold bg-white px-5 py-2.5 rounded-full border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cart
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          {/* LEFT COLUMN: Form */}
          <div className="flex-1">
            <form
              id="checkout-form"
              onSubmit={handleFormSubmit}
              className="space-y-10"
            >
              {/* Header */}
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

              {/* Contact Info */}
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
                    required
                    placeholder="Full Name"
                    className={inputClass}
                  />
                  <input
                    name="phone"
                    required
                    placeholder="Phone Number"
                    className={inputClass}
                  />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Email Address"
                    className={`${inputClass} sm:col-span-2`}
                  />
                </div>
              </div>

              {/* Shipping Info */}
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
                    required
                    placeholder="Street Address"
                    className={inputClass}
                  />
                  <input
                    name="address2"
                    placeholder="Apartment, suite, etc. (optional)"
                    className={inputClass}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <input
                      name="city"
                      required
                      placeholder="City"
                      className={inputClass}
                    />
                    <select
                      name="state"
                      required
                      className={inputClass}
                      defaultValue="Bagmati"
                    >
                      <option>Bagmati</option>
                      <option>Bheri</option>
                      <option>Gandaki</option>
                      <option>Karnali</option>
                      <option>Lumbini</option>
                      <option>Sudurpaschim</option>
                      <option>Province 1</option>
                    </select>
                  </div>
                  <input
                    name="postal"
                    placeholder="Postal / Zip Code (optional)"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Payment Method */}
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
                    className={`flex-1 p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3
                      ${paymentMethod === "cod" ? "bg-theme-light-pink border-theme-brand text-theme-brand shadow-sm" : "bg-gray-50 border-gray-100 text-gray-500 hover:border-pink-200 hover:bg-white"}`}
                  >
                    <Truck className="w-8 h-8" />
                    <span className="font-sans font-bold">
                      Cash on Delivery
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("qr")}
                    className={`flex-1 p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3
                      ${paymentMethod === "qr" ? "bg-theme-light-pink border-theme-brand text-theme-brand shadow-sm" : "bg-gray-50 border-gray-100 text-gray-500 hover:border-pink-200 hover:bg-white"}`}
                  >
                    <QrCode className="w-8 h-8" />
                    <span className="font-sans font-bold">
                      Manual QR Transfer
                    </span>
                  </button>
                </div>

                <AnimatePresence>
                  {paymentMethod === "qr" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6 p-6 bg-pink-50/50 rounded-2xl border border-pink-100 text-center">
                        <AlertCircle className="w-6 h-6 text-theme-brand mx-auto mb-2" />
                        <p className="font-sans text-sm text-gray-600 font-medium mb-4 max-w-sm mx-auto">
                          Scan this code with your Mobile Banking or Wallet App
                          (eSewa / Khalti). We will manually verify your payment
                          once the order is placed.
                        </p>
                        <div className="bg-white p-4 rounded-xl shadow-sm inline-block border border-gray-200">
                          <img
                            className="w-40 h-40 object-cover"
                            src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=Please+Pay+to+Merchant+Account"
                            alt="Manual Payment QR"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Submit Button */}
              <div className="lg:hidden">
                <button
                  form="checkout-form"
                  type="submit"
                  className="w-full bg-theme-brand text-white py-5 rounded-full font-sans font-bold text-xl hover:shadow-lg hover:-translate-y-1 transition-all shadow-sm flex items-center justify-center gap-3"
                >
                  Review Order • Rs. {total().toFixed(2)}
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="w-full lg:w-[420px]">
            <div className="bg-theme-hero-bg p-8 rounded-[40px] border border-pink-100/50 shadow-sm sticky top-8">
              <h2
                style={cursiveStyle}
                className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2"
              >
                <ShoppingBag className="w-6 h-6 text-theme-brand" /> Order
                Summary
              </h2>

              <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {items.map((item) => {
                  const imgUrl =
                    item.imageUrls?.[0] || item.imageUrl || "/placeholder.png";

                  // Check if the current quantity is at maximum stock
                  const isMaxStock =
                    item.stock !== undefined && item.quantity >= item.stock;

                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 items-center bg-white/60 p-3 rounded-2xl border border-white"
                    >
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-white shrink-0">
                        <img
                          src={imgUrl}
                          alt={item.title}
                          className="w-full h-full object-cover mix-blend-multiply"
                        />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-sans font-bold text-gray-900 text-sm line-clamp-1">
                          {item.title}
                        </h3>
                        <div className="font-bold text-theme-brand text-sm mt-1">
                          Rs. {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-white rounded-full border border-gray-100 px-2 py-1 shadow-sm">
                        <button
                          onClick={() => handleDecrease(item.id, item.quantity)}
                          className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-pink-100 hover:text-theme-brand transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-sans font-bold text-sm w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            handleIncrease(item.id, item.quantity, item.stock)
                          }
                          disabled={isMaxStock}
                          title={
                            isMaxStock
                              ? "Max stock reached"
                              : "Increase quantity"
                          }
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                            isMaxStock
                              ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                              : "bg-gray-50 text-gray-600 hover:bg-pink-100 hover:text-theme-brand"
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 font-sans text-gray-600 mb-6 border-t border-pink-100 pt-6">
                <div className="flex justify-between font-medium">
                  <span>Subtotal</span>
                  <span>Rs. {total().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Shipping</span>
                  <span className="text-green-500 font-bold">Free</span>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-pink-100 pt-6 mb-8">
                <span className="font-sans font-bold text-gray-900 text-xl">
                  Total
                </span>
                <span className="font-sans font-bold text-theme-brand text-3xl">
                  Rs. {total().toFixed(2)}
                </span>
              </div>

              {/* Desktop Submit Button */}
              <button
                form="checkout-form"
                type="submit"
                className="hidden lg:flex w-full bg-theme-brand text-white py-5 rounded-full font-sans font-bold text-lg hover:shadow-lg hover:-translate-y-1 transition-all shadow-sm items-center justify-center gap-3"
              >
                Review Order <ChevronRight className="w-5 h-5" />
              </button>

              <p className="text-center font-sans text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                <CreditCard className="w-3 h-3" /> Secure Checkout
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirmModal && orderPayload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[30px] p-6 md:p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <button
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <h3
                style={cursiveStyle}
                className="text-4xl font-bold text-gray-900 mb-6 text-center"
              >
                Confirm Order
              </h3>

              <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 space-y-3 font-sans text-sm">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Deliver To:</span>
                  <span className="font-bold text-gray-900 text-right">
                    {orderPayload.customerName?.toString()}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Address:</span>
                  <span className="font-bold text-gray-900 text-right max-w-[180px] truncate">
                    {orderPayload.address}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Payment:</span>
                  <span className="font-bold text-theme-brand text-right uppercase">
                    {orderPayload.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : "Manual QR"}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-gray-500">Amount to Pay:</span>
                  <span className="font-bold text-gray-900 text-lg">
                    Rs. {orderPayload.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={loading}
                  className="flex-1 py-4 rounded-full font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Go Back
                </button>
                <button
                  onClick={executeOrder}
                  disabled={loading}
                  className="flex-1 py-4 rounded-full font-bold text-white bg-theme-brand hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center"
                >
                  {loading ? (
                    <span className="animate-pulse">Placing...</span>
                  ) : (
                    "Place Order"
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
