import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, QrCode, CreditCard } from "lucide-react";
import { useCartStore } from "../store";
import { motion } from "motion/react";

export function Checkout() {
  const { items, total, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{
    id: number;
    trackingId: string;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "qr">("card");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const orderData = {
      customerName: formData.get("name"),
      email,
      phone: formData.get("phone"),
      address: formData.get("address"),
      paymentMethod,
      total: total(),
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        const data = await res.json();
        setOrderInfo(data);
        setSuccess(true);
        clearCart();
        // Simulate email
        console.log(
          `[Email sent to ${email}] Your order has been placed! Track it here with tracking ID: ${data.trackingId}`,
        );
      } else {
        alert("Failed to place order. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting order.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="max-w-2xl mx-auto flex-grow flex items-center justify-center p-4 w-full"
      >
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 transform rotate-3">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-serif text-theme-text mb-4">
            Yay! Order Confirmed
          </h2>
          <p className="text-theme-muted mb-4 font-light">
            Thank you for your purchase. Your cute crochets are getting ready to
            ship! We've sent a confirmation to your email.
          </p>

          {orderInfo && (
            <div className="mb-8 p-6 bg-theme-bg rounded-2xl border border-gray-100">
              <p className="text-sm font-medium text-theme-muted uppercase tracking-widest mb-2">
                Your Tracking ID
              </p>
              <p className="text-2xl font-mono text-theme-brand font-bold bg-white px-4 py-2 rounded-xl inline-block shadow-sm border border-pink-100">
                {orderInfo.trackingId}
              </p>
              <p className="text-xs text-theme-muted mt-4">
                Save this ID to track your order status anytime.
              </p>

              <button
                onClick={() => navigate(`/track?id=${orderInfo.trackingId}`)}
                className="mt-4 px-6 py-2 bg-white border border-theme-border rounded-full shadow-sm text-theme-brand font-medium hover:bg-theme-bg transition-colors"
              >
                Track Now
              </button>
            </div>
          )}

          <button
            onClick={() => navigate("/shop")}
            className="px-8 py-4 bg-theme-text text-white font-medium rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all text-lg"
          >
            Keep Shopping
          </button>
        </div>
      </motion.div>
    );
  }

  if (items.length === 0) {
    navigate("/shop");
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-3xl mx-auto flex-grow flex flex-col justify-center p-4 w-full"
    >
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-8">
        <h1 className="text-4xl font-serif text-theme-text mb-8 text-center">
          Checkout ✨
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-theme-muted mb-2 uppercase tracking-wide font-medium">
                Full Name
              </label>
              <input
                required
                name="name"
                type="text"
                className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-theme-bg focus:bg-white focus:border-theme-brand focus:ring-1 focus:ring-theme-brand outline-none transition-all"
                placeholder="Cute Customer"
              />
            </div>
            <div>
              <label className="block text-sm text-theme-muted mb-2 uppercase tracking-wide font-medium">
                Phone Number
              </label>
              <input
                required
                name="phone"
                type="tel"
                className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-theme-bg focus:bg-white focus:border-theme-brand focus:ring-1 focus:ring-theme-brand outline-none transition-all"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-theme-muted mb-2 uppercase tracking-wide font-medium">
              Email
            </label>
            <input
              required
              name="email"
              type="email"
              className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-theme-bg focus:bg-white focus:border-theme-brand focus:ring-1 focus:ring-theme-brand outline-none transition-all"
              placeholder="hello@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-theme-muted mb-2 uppercase tracking-wide font-medium">
              Shipping Address
            </label>
            <textarea
              required
              name="address"
              rows={3}
              className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-theme-bg focus:bg-white focus:border-theme-brand focus:ring-1 focus:ring-theme-brand outline-none transition-all resize-none"
              placeholder="123 Pastel Lane..."
            ></textarea>
          </div>

          <div className="pt-6">
            <label className="block text-sm text-theme-muted mb-4 uppercase tracking-wide font-medium">
              Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${paymentMethod === "card" ? "border-theme-brand bg-theme-light-pink" : "border-gray-200 bg-white hover:border-gray-300"}`}
              >
                <CreditCard
                  className={`w-6 h-6 ${paymentMethod === "card" ? "text-theme-brand" : "text-theme-muted"}`}
                />
                <span
                  className={`font-medium tracking-wide ${paymentMethod === "card" ? "text-theme-brand" : "text-theme-text"}`}
                >
                  Credit Card
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("qr")}
                className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${paymentMethod === "qr" ? "border-theme-brand bg-theme-light-pink" : "border-gray-200 bg-white hover:border-gray-300"}`}
              >
                <QrCode
                  className={`w-6 h-6 ${paymentMethod === "qr" ? "text-theme-brand" : "text-theme-muted"}`}
                />
                <span
                  className={`font-medium tracking-wide ${paymentMethod === "qr" ? "text-theme-brand" : "text-theme-text"}`}
                >
                  Advance Payment (QR)
                </span>
              </button>
            </div>

            {paymentMethod === "qr" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-6 flex flex-col items-center justify-center p-8 bg-theme-bg border border-gray-200 rounded-2xl"
              >
                <p className="text-theme-text font-serif text-lg mb-4 text-center">
                  Scan to Pay Advance Amount
                </p>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 inline-block">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=AdvancePaymentInfo1234`}
                    alt="Payment QR Code"
                    className="w-[180px] h-[180px]"
                  />
                </div>
                <p className="text-theme-muted text-sm mt-4 text-center">
                  Reference: Order pending
                </p>
              </motion.div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <p className="text-theme-muted text-xs uppercase tracking-widest font-medium mb-1">
                Total Amount
              </p>
              <p className="text-4xl font-medium text-theme-brand drop-shadow-sm">
                ${total().toFixed(2)}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-10 py-4 bg-theme-brand text-white font-medium text-lg rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 transition-all focus:ring-4 focus:ring-pink-200 border-none"
            >
              {loading
                ? "Processing..."
                : paymentMethod === "qr"
                  ? "Confirm Payment & Order"
                  : "Place Order"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
