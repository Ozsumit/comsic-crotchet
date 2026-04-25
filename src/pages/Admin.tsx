import React, { useState, useEffect, useMemo } from "react";
import {
  Package,
  Upload,
  Image as ImageIcon,
  Lock,
  Trash2,
  Edit,
  X,
  Box,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  LogOut,
  MapPin,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
interface OrderItem {
  title: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface Order {
  id: number;
  trackingId?: string;
  customerName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt: string;
  status: string;
  total: number;
  items: OrderItem[];
  notes?: string;
}

interface Product {
  id: number;
  title: string;
  price: number;
  category: string;
  stock: number;
  description: string;
  imageUrl: string;
}

// Fetch password from .env based on your framework (Vite, Next.js, or CRA)
const ADMIN_PASSWORD =
  import.meta.env?.VITE_ADMIN_PASSWORD ||
  process.env?.NEXT_PUBLIC_ADMIN_PASSWORD ||
  process.env?.REACT_APP_ADMIN_PASSWORD;

export function Admin() {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("adminAuth") === "true";
  });
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);

  // --- DATA STATES ---
  const [tab, setTab] = useState<"orders" | "inventory" | "add">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]); // <-- NEW: Categories state
  const [isFetching, setIsFetching] = useState(false);
  const [loading, setLoading] = useState(false);

  // State for adding products (Preview & Progress)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // State for editing a product and viewing images
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // --- ORDER MANAGEMENT STATES ---
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderSort, setOrderSort] = useState<"newest" | "oldest">("newest");
  const [orderPage, setOrderPage] = useState(1);
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);
  const ORDERS_PER_PAGE = 10;

  // --- AUTH HANDLERS ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError(false);
      sessionStorage.setItem("adminAuth", "true");
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("adminAuth");
    setPassword("");
  };

  // --- DATA FETCHING ---
  const fetchCategories = () => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Failed to fetch categories:", err));
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    setIsFetching(true);

    // Always fetch categories so they are ready for the Add/Edit tabs
    fetchCategories();

    if (tab === "orders") {
      fetch("/api/orders")
        .then((res) => res.json())
        .then((data) => setOrders(data))
        .catch((err) => console.error("Failed to fetch orders:", err))
        .finally(() => setIsFetching(false));
    } else if (tab === "inventory") {
      fetch("/api/products")
        .then((res) => res.json())
        .then((data) => setProducts(data))
        .catch((err) => console.error("Failed to fetch products:", err))
        .finally(() => setIsFetching(false));
    } else {
      setIsFetching(false);
    }
  }, [tab, isAuthenticated]);

  // --- ORDER MANAGEMENT LOGIC ---
  const processedOrders = useMemo(() => {
    let result = [...orders];

    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toString().includes(q) ||
          o.trackingId?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.email?.toLowerCase().includes(q) ||
          o.phone?.includes(q),
      );
    }

    if (orderStatusFilter !== "all") {
      result = result.filter((o) => o.status === orderStatusFilter);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return orderSort === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [orders, orderSearch, orderStatusFilter, orderSort]);

  const totalOrderPages =
    Math.ceil(processedOrders.length / ORDERS_PER_PAGE) || 1;
  const paginatedOrders = processedOrders.slice(
    (orderPage - 1) * ORDERS_PER_PAGE,
    orderPage * ORDERS_PER_PAGE,
  );

  useEffect(() => {
    setOrderPage(1);
  }, [orderSearch, orderStatusFilter, orderSort]);

  const toggleOrderExpand = (id: number) => {
    setExpandedOrders((prev) =>
      prev.includes(id)
        ? prev.filter((orderId) => orderId !== id)
        : [...prev, id],
    );
  };

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
      alert("An error occurred while deleting the order.");
    }
  };

  // --- INVENTORY MANAGEMENT LOGIC ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview(null);
    }
  };

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);

    // Using XMLHttpRequest instead of fetch to track upload progress natively
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/products", true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        alert("Product added successfully!");
        formElement.reset();
        setImagePreview(null);
        setUploadProgress(0);
        fetchCategories(); // Refresh categories in case they added a new one
        setTab("inventory");
      } else {
        alert("Failed to add product.");
      }
      setLoading(false);
    };

    xhr.onerror = () => {
      console.error("XHR Error during upload");
      alert("Error adding product.");
      setLoading(false);
      setUploadProgress(0);
    };

    xhr.send(formData);
  };

  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const updatedData = {
      title: formData.get("title") as string,
      price: parseFloat(formData.get("price") as string),
      category: formData.get("category") as string,
      stock: parseInt(formData.get("stock") as string, 10),
      description: formData.get("description") as string,
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
        fetchCategories(); // Refresh categories in case they created a new one
        setEditingProduct(null);
      } else {
        alert("Failed to update product.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while updating.");
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
        fetchCategories(); // Refresh categories in case deleting this removed a category entirely
      } else {
        alert("Failed to delete product.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting.");
    }
  };

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

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
          <div className="w-16 h-16 bg-theme-light-pink rounded-2xl border flex items-center justify-center mx-auto mb-6">
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
                className={`w-full px-5 py-4 rounded-full border bg-theme-bg focus:bg-white focus:ring-0 transition-colors outline-none font-medium ${
                  authError
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-100 focus:border-theme-brand"
                }`}
              />
              {authError && (
                <p className="text-red-500 text-sm mt-3 font-normal px-2 uppercase tracking-wide">
                  Incorrect password.
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-theme-brand text-white py-5 rounded-full font-medium text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-pink-200 border hover:border-pink-200"
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 px-2 gap-4">
        <div className="flex gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setTab("orders")}
            className={`px-8 py-3 font-medium border transition-all whitespace-nowrap ${
              tab === "orders"
                ? "bg-theme-brand text-white border-theme-brand rounded-full"
                : "bg-white text-theme-muted border-gray-100 hover:bg-theme-hover hover:text-theme-brand rounded-2xl"
            }`}
          >
            View Orders
          </button>
          <button
            onClick={() => setTab("inventory")}
            className={`px-8 py-3 font-medium border transition-all whitespace-nowrap ${
              tab === "inventory"
                ? "bg-theme-brand text-white border-theme-brand rounded-full"
                : "bg-white text-theme-muted border-gray-100 hover:bg-theme-hover hover:text-theme-brand rounded-2xl"
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setTab("add")}
            className={`px-8 py-3 font-medium border transition-all whitespace-nowrap ${
              tab === "add"
                ? "bg-theme-brand text-white border-theme-brand rounded-full"
                : "bg-white text-theme-muted border-gray-100 hover:bg-theme-hover hover:text-theme-brand rounded-2xl"
            }`}
          >
            Add Product
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-full transition-colors whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      {/* --- TAB: ORDERS --- */}
      {tab === "orders" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[800px] max-h-[85vh]">
          {/* Header & Controls */}
          <div className="p-6 border-b border-gray-100 bg-white">
            <h2 className="text-2xl font-medium text-theme-text flex items-center gap-3 mb-6">
              <Package className="w-6 h-6 text-theme-brand" /> Order Management
            </h2>

            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
              <div className="relative w-full lg:w-96">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tracking, ID, phone, or customer..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-theme-brand outline-none text-sm font-medium transition-colors"
                />
              </div>

              <div className="flex gap-3 w-full lg:w-auto overflow-x-auto">
                <div className="relative min-w-[140px]">
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="w-full pl-9 pr-8 py-3 rounded-xl border border-gray-200 bg-white focus:border-theme-brand outline-none text-sm font-medium appearance-none cursor-pointer text-theme-text"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="relative min-w-[140px]">
                  <ListOrdered className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    value={orderSort}
                    onChange={(e) =>
                      setOrderSort(e.target.value as "newest" | "oldest")
                    }
                    className="w-full pl-9 pr-8 py-3 rounded-xl border border-gray-200 bg-white focus:border-theme-brand outline-none text-sm font-medium appearance-none cursor-pointer text-theme-text"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container (Scrollable) */}
          <div className="flex-1 overflow-auto bg-theme-bg/10 relative">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 bg-theme-bg shadow-sm z-20">
                <tr className="text-theme-muted border-b border-gray-200 text-xs uppercase tracking-widest font-semibold">
                  <th className="p-5 w-12"></th>
                  <th className="p-5">Order ID</th>
                  <th className="p-5">Customer Overview</th>
                  <th className="p-5">Date</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Total</th>
                  <th className="p-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-16 text-center text-theme-muted font-normal bg-white"
                    >
                      Loading orders...
                    </td>
                  </tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-16 text-center text-theme-muted font-normal bg-white"
                    >
                      No orders found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const isExpanded = expandedOrders.includes(order.id);
                    return (
                      <React.Fragment key={order.id}>
                        <tr
                          className={`border-b border-gray-100 group bg-white transition-colors hover:bg-gray-50/50 ${
                            order.status === "cancelled" ? "opacity-60" : ""
                          }`}
                        >
                          <td className="p-5 text-center">
                            <button
                              onClick={() => toggleOrderExpand(order.id)}
                              className="p-1.5 text-gray-400 hover:text-theme-brand hover:bg-pink-50 rounded-lg transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                          <td className="p-5 font-mono text-sm text-theme-muted">
                            <span className="text-gray-900 font-medium text-base">
                              #{order.id}
                            </span>
                            <br />
                            <span className="text-xs text-theme-brand font-medium tracking-wide">
                              {order.trackingId || "No Tracking"}
                            </span>
                          </td>
                          <td className="p-5">
                            <div className="font-medium text-theme-text text-base">
                              {order.customerName}
                            </div>
                            <div className="text-sm font-medium text-theme-muted">
                              {order.email}
                            </div>
                          </td>
                          <td className="p-5 text-theme-muted font-medium text-sm">
                            {new Date(order.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </td>
                          <td className="p-5 relative z-10 w-48">
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
                                      body: JSON.stringify({
                                        status: newStatus,
                                      }),
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
                                  } else {
                                    alert("Failed to update status");
                                  }
                                } catch (err) {
                                  console.error("Failed to update status", err);
                                  alert(
                                    "An error occurred while updating status",
                                  );
                                }
                              }}
                              className={`w-full px-3 py-2 font-bold uppercase tracking-widest rounded-xl border outline-none text-[10px] cursor-pointer appearance-none transition-colors ${
                                order.status === "cancelled"
                                  ? "bg-red-50 text-red-500 border-red-100"
                                  : order.status === "delivered"
                                    ? "bg-green-50 text-green-600 border-green-100"
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
                          <td className="p-5 font-bold text-lg text-right text-theme-text">
                            Rs. {order.total?.toFixed(2)}
                          </td>
                          <td className="p-5 text-center">
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 className="w-5 h-5 mx-auto" />
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDED DETAILS ROW */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr className="bg-gray-50/60 border-b-[3px] border-gray-100">
                              <td colSpan={7} className="p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-6 mx-12 my-4 bg-white rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* LEFT COLUMN: Customer & Shipping Info */}
                                    <div>
                                      <h4 className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Customer
                                        Details
                                      </h4>

                                      <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 space-y-4">
                                        {/* Name & Email Row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                          <div className="flex items-start gap-3">
                                            <User className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <div>
                                              <p className="text-[10px] text-theme-muted uppercase tracking-widest font-bold mb-0.5">
                                                Name
                                              </p>
                                              <p className="text-sm font-medium text-theme-text">
                                                {order.customerName}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-start gap-3">
                                            <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <div>
                                              <p className="text-[10px] text-theme-muted uppercase tracking-widest font-bold mb-0.5">
                                                Email
                                              </p>
                                              <p className="text-sm font-medium text-theme-text">
                                                {order.email}
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        <hr className="border-gray-100" />

                                        {/* Phone & Address Row */}
                                        <div className="space-y-4">
                                          <div className="flex items-start gap-3">
                                            <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <div>
                                              <p className="text-[10px] text-theme-muted uppercase tracking-widest font-bold mb-0.5">
                                                Phone Number
                                              </p>
                                              <p className="text-sm font-medium text-theme-text">
                                                {order.phone || "Not provided"}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-start gap-3">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <div>
                                              <p className="text-[10px] text-theme-muted uppercase tracking-widest font-bold mb-0.5">
                                                Shipping Address
                                              </p>
                                              <p className="text-sm font-medium text-theme-text leading-relaxed">
                                                {order.address ||
                                                  "No address provided."}
                                                {(order.city ||
                                                  order.state ||
                                                  order.zipCode) && (
                                                  <>
                                                    <br />
                                                    {[
                                                      order.city,
                                                      order.state,
                                                      order.zipCode,
                                                    ]
                                                      .filter(Boolean)
                                                      .join(", ")}
                                                  </>
                                                )}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Order Notes */}
                                      {order.notes && (
                                        <div className="mt-4 p-4 bg-yellow-50/50 text-yellow-800 rounded-xl text-sm border border-yellow-100 flex items-start gap-3">
                                          <span className="font-bold whitespace-nowrap">
                                            Order Note:
                                          </span>
                                          <span className="italic">
                                            {order.notes}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* RIGHT COLUMN: Order Items List */}
                                    <div>
                                      <h4 className="text-xs font-bold text-theme-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Box className="w-4 h-4" /> Ordered
                                        Items
                                      </h4>

                                      {order.items && order.items.length > 0 ? (
                                        <div className="space-y-3">
                                          {order.items.map((item, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                                            >
                                              <div className="flex items-center gap-4">
                                                {item.imageUrl ? (
                                                  <img
                                                    src={item.imageUrl}
                                                    alt={item.title}
                                                    onClick={() =>
                                                      setSelectedImage(
                                                        item.imageUrl!,
                                                      )
                                                    }
                                                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                                  />
                                                ) : (
                                                  <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                                                    <Box className="w-5 h-5 text-gray-300" />
                                                  </div>
                                                )}
                                                <div>
                                                  <p className="font-semibold text-theme-text">
                                                    {item.title}
                                                  </p>
                                                  <p className="text-xs font-medium text-theme-muted uppercase tracking-widest mt-0.5">
                                                    Qty: {item.quantity}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="font-bold text-theme-text">
                                                Rs.{" "}
                                                {(
                                                  item.price * item.quantity
                                                ).toFixed(2)}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="p-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                          <p className="text-sm text-theme-muted italic">
                                            No item details available for this
                                            order.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalOrderPages > 1 && (
            <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between">
              <span className="text-sm font-medium text-theme-muted">
                Showing {(orderPage - 1) * ORDERS_PER_PAGE + 1} to{" "}
                {Math.min(orderPage * ORDERS_PER_PAGE, processedOrders.length)}{" "}
                of {processedOrders.length} orders
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                  disabled={orderPage === 1}
                  className="p-2 border border-gray-200 rounded-lg text-theme-text hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 text-sm font-medium text-theme-text bg-gray-50 rounded-lg border border-gray-100">
                  Page {orderPage} of {totalOrderPages}
                </span>
                <button
                  onClick={() =>
                    setOrderPage((p) => Math.min(totalOrderPages, p + 1))
                  }
                  disabled={orderPage === totalOrderPages}
                  className="p-2 border border-gray-200 rounded-lg text-theme-text hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
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
                {isFetching ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-16 text-center text-theme-muted font-normal"
                    >
                      Loading inventory...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
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
                          onClick={() => setSelectedImage(product.imageUrl)}
                          className="w-12 h-12 object-cover rounded-xl border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
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
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            product.stock > 5
                              ? "bg-green-100 text-green-700"
                              : product.stock > 0
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
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
                  step="1"
                  className="w-full px-5 py-4 rounded-full border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white focus:ring-0 outline-none font-medium transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* DYNAMIC CATEGORY FIELD */}
              <div className="col-span-2 sm:col-span-1 relative">
                <label className="block text-sm font-medium text-theme-muted mb-2 uppercase tracking-widest text-xs">
                  Category
                </label>
                <input
                  required
                  name="category"
                  list="category-options"
                  placeholder="Select or type new..."
                  className="w-full px-5 py-4 rounded-full border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white focus:ring-0 outline-none font-medium transition-colors text-theme-text"
                />
                <datalist id="category-options">
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat} />
                  ))}
                </datalist>
                <p className="text-[10px] text-theme-muted mt-2 ml-2 leading-tight">
                  Double-click input to select an existing category, or type to
                  create a new one.
                </p>
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
                className="w-full px-5 py-4 rounded-3xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white focus:ring-0 outline-none font-medium transition-colors resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-muted mb-2 uppercase tracking-widest text-xs">
                Product Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border border-gray-100 border-dashed rounded-3xl hover:border-theme-brand hover:bg-theme-hover transition-colors cursor-pointer relative bg-theme-bg overflow-hidden group">
                <input
                  required
                  type="file"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {imagePreview ? (
                  <div className="relative w-full flex flex-col items-center pointer-events-none">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-48 w-auto object-cover rounded-xl shadow-sm mb-3 border border-gray-200"
                    />
                    <p className="text-sm font-medium text-theme-brand group-hover:underline">
                      Click or drag to change image
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-center pointer-events-none">
                    <div className="w-16 h-16 bg-white rounded-full border border-gray-100 flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                      <ImageIcon className="h-8 w-8 text-theme-brand" />
                    </div>
                    <div className="flex text-lg font-medium text-theme-muted justify-center items-center mt-4">
                      <span className="relative bg-transparent rounded-md font-medium text-theme-brand">
                        Upload a file
                      </span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                  </div>
                )}

                {/* File Upload Progress Overlay inside Dropzone */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6"
                    >
                      <div className="w-full max-w-xs bg-gray-100 rounded-full h-3 mb-3 overflow-hidden shadow-inner border border-gray-200">
                        <div
                          className="bg-theme-brand h-3 rounded-full transition-all duration-300 relative overflow-hidden"
                          style={{ width: `${uploadProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-theme-brand uppercase tracking-widest">
                        Uploading {uploadProgress}%
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-theme-brand text-white font-medium text-xl rounded-full shadow-lg transition-all border mt-4 relative overflow-hidden disabled:opacity-90 disabled:cursor-wait hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Upload className="w-5 h-5 animate-bounce" /> Uploading (
                    {uploadProgress}%)
                  </>
                ) : (
                  "Save Product"
                )}
              </span>
              {/* Button background progress fill */}
              {loading && (
                <div
                  className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              )}
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
                      step="1"
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

                {/* DYNAMIC CATEGORY FIELD FOR EDIT */}
                <div>
                  <label className="block text-sm font-medium text-theme-muted mb-2 uppercase tracking-widest text-xs">
                    Category
                  </label>
                  <input
                    required
                    name="category"
                    list="category-options-edit"
                    defaultValue={editingProduct.category}
                    placeholder="Select or type new..."
                    className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-medium transition-colors text-theme-text"
                  />
                  <datalist id="category-options-edit">
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat} />
                    ))}
                  </datalist>
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

      {/* --- ENLARGED IMAGE VIEW MODAL --- */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center cursor-auto"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              <img
                src={selectedImage}
                alt="Enlarged view"
                className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
