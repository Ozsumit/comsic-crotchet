import React, { useState, useEffect } from "react";
import {
  Package,
  Upload,
  Image as ImageIcon,
  Lock,
  Trash2,
  Edit,
  X,
  Box,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);

  const [tab, setTab] = useState<"orders" | "inventory" | "add">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // State for editing a product
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "pastelstitches") {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  // Fetch Data based on active tab
  useEffect(() => {
    if (!isAuthenticated) return;

    if (tab === "orders") {
      fetch("/api/orders")
        .then((res) => res.json())
        .then((data) => setOrders(data))
        .catch(console.error);
    } else if (tab === "inventory") {
      fetch("/api/products")
        .then((res) => res.json())
        .then((data) => setProducts(data))
        .catch(console.error);
    }
  }, [tab, isAuthenticated]);

  // --- ORDER MANAGEMENT ---

  const handleDeleteOrder = async (id: number) => {
    if (
      !window.confirm("Are you sure you want to permanently delete this order?")
    )
      return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        setOrders(orders.filter((o) => o.id !== id));
      } else {
        alert("Failed to delete order.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- INVENTORY MANAGEMENT ---

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        alert("Product added successfully!");
        (e.target as HTMLFormElement).reset();
        setTab("inventory"); // Redirect to inventory to see the new item
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

  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const updatedData = {
      title: formData.get("title"),
      price: parseFloat(formData.get("price") as string),
      category: formData.get("category"),
      stock: parseInt(formData.get("stock") as string, 10),
      description: formData.get("description"),
    };

    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        setProducts(
          products.map((p) =>
            p.id === editingProduct.id ? { ...p, ...updatedData } : p,
          ),
        );
        setEditingProduct(null);
      } else {
        alert("Failed to update product.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete product.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- RENDER LOGIN ---
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
                  Incorrect password. Try 'Comsic11'.
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

  // --- RENDER ADMIN DASHBOARD ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-7xl mx-auto w-full pt-4 relative"
    >
      <div className="flex gap-4 mb-10 w-full overflow-x-auto pb-4 px-2">
        <button
          onClick={() => setTab("orders")}
          className={`px-8 py-3 font-medium border transition-all whitespace-nowrap ${tab === "orders" ? "bg-theme-brand text-white border-theme-brand rounded-full" : "bg-white text-theme-muted border-gray-100 hover:bg-theme-hover hover:text-theme-brand rounded-2xl"}`}
        >
          View Orders
        </button>
        <button
          onClick={() => setTab("inventory")}
          className={`px-8 py-3 font-medium border transition-all whitespace-nowrap ${tab === "inventory" ? "bg-theme-brand text-white border-theme-brand rounded-full" : "bg-white text-theme-muted border-gray-100 hover:bg-theme-hover hover:text-theme-brand rounded-2xl"}`}
        >
          Inventory Management
        </button>
        <button
          onClick={() => setTab("add")}
          className={`px-8 py-3 font-medium border transition-all whitespace-nowrap ${tab === "add" ? "bg-theme-brand text-white border-theme-brand rounded-full" : "bg-white text-theme-muted border-gray-100 hover:bg-theme-hover hover:text-theme-brand rounded-2xl"}`}
        >
          Add Product
        </button>
      </div>

      {/* --- TAB: ORDERS --- */}
      {tab === "orders" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b-[3px] border-gray-100 flex items-center justify-between bg-white">
            <h2 className="text-2xl font-medium text-theme-text flex items-center gap-3">
              <Package className="w-6 h-6 text-theme-brand" /> Order Management
            </h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-theme-bg text-theme-muted border-b-[3px] border-gray-100 text-sm uppercase tracking-widest font-medium">
                  <th className="p-5 font-medium">Tracking / ID</th>
                  <th className="p-5 font-medium">Customer</th>
                  <th className="p-5 font-medium">Date</th>
                  <th className="p-5 font-medium">Status</th>
                  <th className="p-5 font-medium text-right">Total</th>
                  <th className="p-5 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-16 text-center text-theme-muted font-normal"
                    >
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr
                        className={`border-b border-gray-100 group ${order.status === "cancelled" ? "opacity-50" : ""}`}
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
                            className={`w-full px-3 py-2 font-medium uppercase tracking-widest rounded-xl border outline-none text-xs cursor-pointer appearance-none ${
                              order.status === "cancelled"
                                ? "bg-red-50 text-red-500 border-red-100"
                                : "bg-pink-50 text-theme-brand border-pink-100 focus:ring-1 focus:ring-theme-brand"
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-5 font-medium text-xl text-right text-theme-text group-hover:bg-theme-bg/50 transition-colors">
                          Rs. {order.total.toFixed(2)}
                        </td>
                        <td className="p-5 group-hover:bg-theme-bg/50 transition-colors text-center">
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 className="w-5 h-5 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB: INVENTORY --- */}
      {tab === "inventory" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b-[3px] border-gray-100 flex items-center justify-between bg-white">
            <h2 className="text-2xl font-medium text-theme-text flex items-center gap-3">
              <Box className="w-6 h-6 text-theme-brand" /> Inventory Management
            </h2>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-theme-bg text-theme-muted border-b-[3px] border-gray-100 text-sm uppercase tracking-widest font-medium">
                  <th className="p-5 font-medium w-20">Image</th>
                  <th className="p-5 font-medium">Product Details</th>
                  <th className="p-5 font-medium">Category</th>
                  <th className="p-5 font-medium">Price</th>
                  <th className="p-5 font-medium">Stock</th>
                  <th className="p-5 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-16 text-center text-theme-muted font-normal"
                    >
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-gray-100 group hover:bg-theme-bg/50 transition-colors"
                    >
                      <td className="p-5">
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded-xl border border-gray-100"
                        />
                      </td>
                      <td className="p-5">
                        <p className="font-medium text-theme-text">
                          {product.title}
                        </p>
                        <p className="text-xs text-theme-muted line-clamp-1 max-w-xs">
                          {product.description}
                        </p>
                      </td>
                      <td className="p-5 text-theme-muted uppercase tracking-widest text-xs font-medium">
                        {product.category}
                      </td>
                      <td className="p-5 font-medium text-theme-text">
                        Rs. {product.price.toFixed(2)}
                      </td>
                      <td className="p-5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${product.stock > 5 ? "bg-green-100 text-green-700" : product.stock > 0 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                        >
                          {product.stock} in stock
                        </span>
                      </td>
                      <td className="p-5 text-center flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 text-theme-brand hover:bg-pink-50 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB: ADD PRODUCT --- */}
      {tab === "add" && (
        // ... (Your existing add product form remains completely unchanged here)
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
                  Price (Rs. )
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
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-theme-brand text-white font-medium text-xl rounded-full shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all border mt-4"
            >
              {loading ? "Uploading..." : "Save Product"}
            </button>
          </form>
        </div>
      )}

      {/* --- EDIT PRODUCT MODAL --- */}
      <AnimatePresence>
        {editingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setEditingProduct(null)}
                className="absolute top-6 right-6 p-2 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-2xl font-medium text-theme-text mb-6 flex items-center gap-2">
                <Edit className="w-6 h-6 text-theme-brand" /> Edit Inventory
              </h3>

              <form onSubmit={handleUpdateProduct} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-theme-muted mb-2 uppercase tracking-widest text-xs">
                    Title
                  </label>
                  <input
                    required
                    name="title"
                    defaultValue={editingProduct.title}
                    className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-medium transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-theme-muted mb-2 uppercase tracking-widest text-xs">
                      Price (Rs. )
                    </label>
                    <input
                      required
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={editingProduct.price}
                      className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-medium transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-theme-muted mb-2 uppercase tracking-widest text-xs">
                      Stock
                    </label>
                    <input
                      required
                      name="stock"
                      type="number"
                      min="0"
                      defaultValue={editingProduct.stock}
                      className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-medium transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-muted mb-2 uppercase tracking-widest text-xs">
                    Category
                  </label>
                  <select
                    required
                    name="category"
                    defaultValue={editingProduct.category}
                    className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-medium transition-colors text-theme-text"
                  >
                    <option value="plushies">Plushies</option>
                    <option value="apparel">Apparel</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-muted mb-2 uppercase tracking-widest text-xs">
                    Description
                  </label>
                  <textarea
                    required
                    name="description"
                    rows={3}
                    defaultValue={editingProduct.description}
                    className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-medium transition-colors resize-none"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-theme-brand text-white font-medium text-lg rounded-full shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
