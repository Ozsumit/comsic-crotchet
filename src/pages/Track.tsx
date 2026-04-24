import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Package, Truck, CheckCircle2, Clock } from "lucide-react";
import { motion } from "motion/react";

export function Track() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState(searchParams.get("id") || "");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.get("id")) {
      handleSearch(searchParams.get("id")!);
    }
  }, [searchParams]);

  const handleSearch = async (id: string) => {
    if (!id.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/orders/track/${id.trim()}`);
      if (!res.ok) {
        throw new Error("Order not found. Please check your tracking ID.");
      }
      const data = await res.json();
      setOrder(data);
      setSearchParams({ id: id.trim() });
    } catch (err: any) {
      setError(err.message);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "processing":
        return <Package className="w-8 h-8 text-blue-500" />;
      case "shipped":
        return <Truck className="w-8 h-8 text-purple-500" />;
      case "delivered":
        return <CheckCircle2 className="w-8 h-8 text-green-500" />;
      default:
        return <Clock className="w-8 h-8 text-orange-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Order Placed & Pending";
      case "processing":
        return "Processing your order";
      case "shipped":
        return "Out for delivery";
      case "delivered":
        return "Delivered successfully";
      default:
        return status;
    }
  };

  const statuses = ["pending", "processing", "shipped", "delivered"];
  const currentStatusIndex = order
    ? statuses.indexOf(order.status.toLowerCase())
    : -1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-3xl mx-auto flex-grow flex flex-col p-4 w-full"
    >
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-8 mt-4">
        <h1 className="text-4xl font-serif text-theme-text mb-2 text-center">
          Track Order 📦
        </h1>
        <p className="text-center text-theme-muted mb-8 font-light">
          Enter the tracking ID sent to your email to check the status of your
          cute crochets!
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(trackingId);
          }}
          className="flex gap-2 max-w-lg mx-auto"
        >
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            className="flex-1 px-5 py-4 rounded-xl border border-gray-200 bg-theme-bg focus:bg-white focus:border-theme-brand focus:ring-1 focus:ring-theme-brand outline-none transition-all font-mono"
            placeholder="e.g. TRK171... "
            required
          />
          <button
            type="submit"
            disabled={loading || !trackingId}
            className="px-6 py-4 bg-theme-brand text-white rounded-xl shadow-sm hover:shadow-md active:translate-y-0 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Search className="w-6 h-6" />
            )}
          </button>
        </form>

        {error && (
          <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-xl text-center border border-red-100">
            {error}
          </div>
        )}

        {order && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-12"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-theme-bg p-6 rounded-2xl border border-theme-border">
              <div>
                <p className="text-sm font-medium text-theme-muted uppercase tracking-widest mb-1">
                  Order Details
                </p>
                <p className="text-theme-text font-serif text-xl">
                  {order.customerName}
                </p>
                <p className="text-theme-muted mt-1">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm font-medium text-theme-muted uppercase tracking-widest mb-1">
                  Total
                </p>
                <p className="text-2xl font-bold text-theme-brand">
                  ${order.total.toFixed(2)}
                </p>
                {order.paymentMethod === "qr" && (
                  <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded tracking-wider">
                    Paid via QR
                  </span>
                )}
              </div>
            </div>

            <div className="mb-10 px-4">
              <p className="text-sm font-medium text-theme-muted uppercase tracking-widest mb-6 text-center">
                Status
              </p>
              <div className="relative flex justify-between items-center max-w-lg mx-auto">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-theme-brand transition-all duration-1000 ease-in-out"
                    style={{
                      width: `${Math.max(0, (currentStatusIndex / (statuses.length - 1)) * 100)}%`,
                    }}
                  ></div>
                </div>

                {statuses.map((s, i) => {
                  const isActive = i <= currentStatusIndex;
                  return (
                    <div
                      key={s}
                      className="relative z-10 flex flex-col items-center gap-2 bg-white px-2"
                    >
                      <div
                        className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center transition-colors duration-500 ${isActive ? "bg-theme-brand border-theme-brand text-white shadow-md" : "bg-gray-50 border-gray-200 text-gray-300"}`}
                      >
                        {i === 0 && <Clock className="w-5 h-5" />}
                        {i === 1 && <Package className="w-5 h-5" />}
                        {i === 2 && <Truck className="w-5 h-5" />}
                        {i === 3 && <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      <p
                        className={`text-xs font-bold uppercase tracking-wider absolute -bottom-6 whitespace-nowrap ${isActive ? "text-theme-brand" : "text-gray-400"}`}
                      >
                        {s}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-16">
              <h3 className="font-serif text-lg text-theme-text mb-4 border-b border-gray-100 pb-2">
                Items Ordered
              </h3>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 items-bg-white hover:bg-theme-bg transition-colors"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-pink-50 rounded-lg flex items-center justify-center text-pink-200">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-theme-text">
                        {item.title}
                      </h4>
                      <p className="text-theme-muted text-sm">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-theme-text text-lg">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
