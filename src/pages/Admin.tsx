import React, { useState, useEffect } from "react";
import { Package, Upload, Image as ImageIcon, Lock } from "lucide-react";
import { motion } from "motion/react";

export function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);

  const [tab, setTab] = useState<"orders" | "add">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "pastelstitches") {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  useEffect(() => {
    if (isAuthenticated && tab === "orders") {
      fetch("/api/orders")
        .then((res) => res.json())
        .then((data) => setOrders(data))
        .catch(console.error);
    }
  }, [tab, isAuthenticated]);

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData, // fetch will set multipart/form-data correctly
      });
      if (res.ok) {
        alert("Product added successfully!");
        (e.target as HTMLFormElement).reset();
      } else {
        alert("Failed to add product.");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding product.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="max-w-md mx-auto w-full pt-12 flex-grow flex items-center justify-center p-4"
      >
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm w-full">
          <div className="w-16 h-16 bg-theme-light-pink rounded-2xl border flex items-center justify-center mx-auto mb-6 ">
            <Lock className="w-8 h-8 text-theme-brand" />
          </div>
          <h2 className="text-3xl font-medium text-center text-theme-text mb-6">
            Admin Access
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`w-full px-5 py-4 rounded-full border bg-theme-bg focus:bg-white focus:ring-0 transition-colors outline-none font-medium ${authError ? "border-red-400 focus:border-red-500" : "border-gray-100 focus:border-theme-brand"}`}
              />
              {authError && (
                <p className="text-red-500 text-sm mt-3 font-normal px-2 uppercase tracking-wide">
                  Incorrect password. Try 'pastelstitches'.
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-theme-brand text-white py-5 rounded-full font-medium text-lg hover:scale-[1.02] active:scale-[0.98] transition- shadow-lg shadow-pink-200 border hover:border-pink-200"
            >
              Enter Dashboard
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-7xl mx-auto w-full pt-4"
    >
      <div className="flex gap-4 mb-10 w-full overflow-x-auto pb-4 px-2">
        <button
          onClick={() => setTab("orders")}
          className={`px-8 py-3 font-medium border transition-all whitespace-nowrap ${tab === "orders" ? "bg-theme-brand text-white border-theme-brand rounded-full" : "bg-white text-theme-muted border-gray-100 hover:bg-theme-hover hover:text-theme-brand rounded-2xl"}`}
        >
          View Orders
        </button>
        <button
          onClick={() => setTab("add")}
          className={`px-8 py-3 font-medium border transition-all whitespace-nowrap ${tab === "add" ? "bg-theme-brand text-white border-theme-brand rounded-full" : "bg-white text-theme-muted border-gray-100 hover:bg-theme-hover hover:text-theme-brand rounded-2xl"}`}
        >
          Add Product
        </button>
      </div>

      {tab === "orders" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b-[3px] border-gray-100 flex items-center justify-between bg-white">
            <h2 className="text-2xl font-medium text-theme-text flex items-center gap-3">
              <Package className="w-6 h-6 text-theme-brand" /> Pending Orders
            </h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-theme-bg text-theme-muted border-b-[3px] border-gray-100 text-sm uppercase tracking-widest font-medium">
                  <th className="p-5 font-medium">Tracking / ID</th>
                  <th className="p-5 font-medium">Customer</th>
                  <th className="p-5 font-medium">Date</th>
                  <th className="p-5 font-medium">Status / Update</th>
                  <th className="p-5 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-16 text-center text-theme-muted font-normal"
                    >
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr
                        className="border-b border-gray-100 flex-col relative group"
                      >
                        <td className="p-5 font-mono text-sm text-theme-muted group-hover:bg-theme-bg/50 transition-colors">
                          #{order.id}
                          <br />
                          <span className="text-xs text-theme-brand font-medium tracking-wide">
                            {order.trackingId}
                          </span>
                        </td>
                        <td className="p-5 group-hover:bg-theme-bg/50 transition-colors">
                          <div className="font-medium text-theme-text text-lg">
                            {order.customerName}
                          </div>
                          <div className="text-sm font-medium text-theme-muted">
                            {order.email}
                          </div>
                        </td>
                        <td className="p-5 text-theme-muted font-medium group-hover:bg-theme-bg/50 transition-colors">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-5 group-hover:bg-theme-bg/50 transition-colors relative z-10 w-48">
                          <select
                            value={order.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                const res = await fetch(
                                  `/api/orders/${order.id}/status`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({ status: newStatus }),
                                  },
                                );
                                if (res.ok) {
                                  setOrders(
                                    orders.map((o) =>
                                      o.id === order.id
                                        ? { ...o, status: newStatus }
                                        : o,
                                    ),
                                  );
                                }
                              } catch (err) {
                                console.error("Failed to update status", err);
                              }
                            }}
                            className="w-full px-3 py-2 bg-pink-50 text-theme-brand font-medium uppercase tracking-widest rounded-xl border border-pink-100 outline-none focus:ring-1 focus:ring-theme-brand text-xs cursor-pointer appearance-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>
                        <td className="p-5 font-medium text-xl text-right text-theme-text group-hover:bg-theme-bg/50 transition-colors">
                          ${order.total.toFixed(2)}
                        </td>
                      </tr>
                      {order.items && order.items.length > 0 && (
                        <tr className="border-b-[3px] border-gray-100 bg-theme-bg/30">
                          <td colSpan={5} className="p-4 pl-4 md:pl-24">
                            <div className="flex gap-4 flex-wrap">
                              {order.items.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm min-w-[200px]">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.title} className="w-10 h-10 object-cover rounded-lg" />
                                  ) : (
                                    <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center text-pink-200">
                                      <Package className="w-5 h-5" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-theme-text">{item.title}</p>
                                    <p className="text-xs text-theme-muted">Qty: {item.quantity} × ${(item.price || 0).toFixed(2)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "add" && (
        <div className="max-w-2xl bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100">
          <h2 className="text-3xl font-medium text-theme-text mb-8 flex items-center gap-3">
            <Upload className="w-8 h-8 text-theme-brand" /> Add New Item
          </h2>

          <form onSubmit={handleAddProduct} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-theme-muted mb-2 uppercase tracking-widest text-xs">
                  Title
                </label>
                <input
                  required
                  name="title"
                  className="w-full px-5 py-4 rounded-full border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white focus:ring-0 outline-none font-medium transition-colors"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-theme-muted mb-2 uppercase tracking-widest text-xs">
                  Price ($)
                </label>
                <input
                  required
                  name="price"
                  type="number"
                  step="0.01"
                  className="w-full px-5 py-4 rounded-full border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white focus:ring-0 outline-none font-medium transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-theme-muted mb-2 uppercase tracking-widest text-xs">
                  Category
                </label>
                <select
                  required
                  name="category"
                  className="w-full px-5 py-4 rounded-full border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white focus:ring-0 outline-none font-medium transition-colors text-theme-text"
                >
                  <option value="plushies">Plushies</option>
                  <option value="apparel">Apparel</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-theme-muted mb-2 uppercase tracking-widest text-xs">
                  Stock
                </label>
                <input
                  required
                  name="stock"
                  type="number"
                  defaultValue="1"
                  min="1"
                  className="w-full px-5 py-4 rounded-full border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white focus:ring-0 outline-none font-medium transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-muted mb-2 uppercase tracking-widest text-xs">
                Description
              </label>
              <textarea
                required
                name="description"
                rows={3}
                className="w-full px-5 py-4 rounded-full border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white focus:ring-0 outline-none font-medium transition-colors resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-muted mb-2 uppercase tracking-widest text-xs">
                Product Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border border-gray-100 border-dashed rounded-full hover:border-theme-brand hover:bg-theme-hover transition-colors cursor-pointer relative bg-theme-bg">
                <input
                  required
                  type="file"
                  name="image"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-white rounded-full border border-gray-100 flex items-center justify-center mx-auto shadow-sm ">
                    <ImageIcon className="h-8 w-8 text-theme-brand" />
                  </div>
                  <div className="flex text-lg font-medium text-theme-muted justify-center items-center mt-4">
                    <span className="relative bg-transparent rounded-md font-medium text-theme-brand hover:focus-within:outline-none">
                      Upload a file
                    </span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-theme-muted font-normal tracking-widest uppercase">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-theme-brand text-white font-medium text-xl rounded-full shadow-lg shadow-pink-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 transition-all border hover:border-pink-200 mt-4"
            >
              {loading ? "Uploading..." : "Save Product"}
            </button>
          </form>
        </div>
      )}
    </motion.div>
  );
}
