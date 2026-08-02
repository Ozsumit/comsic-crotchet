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
  ListOrdered,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MapPin,
  Phone,
  Mail,
  User,
  Plus,
  TrendingUp,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
interface OrderItem {
  title: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  sellerId?: string;
}

interface Order {
  id: number;
  trackingId?: string;
  customerName: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  status: string;
  total: number;
  items: OrderItem[];
}

interface Product {
  id: number;
  title: string;
  price: number;
  category: string;
  stock: number;
  description: string;
  imageUrl?: string;
  imageUrls: string[];
  sellerId?: string;
}

interface Seller {
  id: number;
  sellerId: string;
  name: string;
  email: string;
}

export function Sellers() {
  // --- AUTH STATE ---
  const [seller, setSeller] = useState<Seller | null>(() => {
    const saved = sessionStorage.getItem("sellerAuth");
    return saved ? JSON.parse(saved) : null;
  });

  const [mode, setMode] = useState<"login" | "register">("login");
  const [sellerIdInput, setSellerIdInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // --- DATA STATES ---
  const [tab, setTab] = useState<"sales" | "inventory" | "add">("sales");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [loading, setLoading] = useState(false);

  // Add Product previews & progress
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Edit Product and selected image
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [tempImageUrls, setTempImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (editingProduct) {
      setTempImageUrls(editingProduct.imageUrls || []);
    } else {
      setTempImageUrls([]);
    }
  }, [editingProduct]);

  // Order Management States
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSort, setOrderSort] = useState<"newest" | "oldest">("newest");
  const [orderPage, setOrderPage] = useState(1);
  const [expandedOrders, setExpandedOrders] = useState<number[]>([]);
  const ORDERS_PER_PAGE = 5;

  const handleUpdateStock = async (
    items: OrderItem[],
    action: "reimburse" | "deduct",
  ) => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) return;
      const currentProducts: Product[] = await res.json();

      let stockUpdated = false;

      for (const item of items) {
        const product = currentProducts.find((p) => p.title === item.title);
        if (product) {
          const newStock =
            action === "reimburse"
              ? product.stock + item.quantity
              : Math.max(0, product.stock - item.quantity);

          const formData = new FormData();
          formData.append("title", product.title);
          formData.append("price", product.price.toString());
          formData.append("category", product.category);
          formData.append("description", product.description);
          formData.append("stock", newStock.toString());

          const patchRes = await fetch(`/api/products/${product.id}`, {
            method: "PATCH",
            body: formData,
          });

          if (patchRes.ok) {
            stockUpdated = true;
          }
        }
      }

      if (stockUpdated) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to update stocks:", err);
    }
  };

  const cursiveStyle = { fontFamily: "'Caveat', 'Dancing Script', cursive" };

  // --- FETCH DATA FOR DASHBOARD ---
  const fetchCategories = () => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Failed to fetch categories:", err));
  };

  const fetchDashboardData = () => {
    if (!seller) return;
    setIsFetching(true);
    fetchCategories();

    // Fetch seller-filtered products
    fetch(`/api/products?sellerId=${seller.sellerId}`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Failed to fetch products:", err));

    // Fetch seller-filtered orders
    fetch(`/api/orders?sellerId=${seller.sellerId}`)
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch((err) => console.error("Failed to fetch orders:", err))
      .finally(() => setIsFetching(false));
  };

  useEffect(() => {
    if (seller) {
      fetchDashboardData();
    }
  }, [seller]);

  // --- ENROLL / LOGIN HANDLERS ---
  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!nameInput || !emailInput || !sellerIdInput || !passwordInput) {
      setAuthError("All fields are required");
      return;
    }

    try {
      const res = await fetch("/api/sellers/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput,
          email: emailInput,
          sellerId: sellerIdInput,
          password: passwordInput,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAuthSuccess("Enrolled successfully! You can now log in.");
        setMode("login");
        // Clear enrollment fields but keep sellerId for convenience
        setNameInput("");
        setEmailInput("");
        setPasswordInput("");
      } else {
        setAuthError(data.error || "Enrollment failed");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Server error during enrollment");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!sellerIdInput || !passwordInput) {
      setAuthError("Seller ID and password are required");
      return;
    }

    try {
      const res = await fetch("/api/sellers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: sellerIdInput,
          password: passwordInput,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSeller(data.seller);
        sessionStorage.setItem("sellerAuth", JSON.stringify(data.seller));
      } else {
        setAuthError(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Server error during login");
    }
  };

  const handleLogout = () => {
    setSeller(null);
    sessionStorage.removeItem("sellerAuth");
    setSellerIdInput("");
    setPasswordInput("");
  };

  // --- ORDER PROCESSING LOGIC ---
  const processedOrders = useMemo(() => {
    let result = [...orders];

    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toString().includes(q) ||
          o.trackingId?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.email?.toLowerCase().includes(q)
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

  const totalOrderPages = Math.ceil(processedOrders.length / ORDERS_PER_PAGE) || 1;
  const paginatedOrders = processedOrders.slice(
    (orderPage - 1) * ORDERS_PER_PAGE,
    orderPage * ORDERS_PER_PAGE
  );

  useEffect(() => {
    setOrderPage(1);
  }, [orderSearch, orderStatusFilter, orderSort]);

  const toggleOrderExpand = (id: number) => {
    setExpandedOrders((prev) =>
      prev.includes(id) ? prev.filter((oId) => oId !== id) : [...prev, id]
    );
  };

  // --- PRODUCT MANAGEMENT LOGIC ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const urls = Array.from(files).map((file) => URL.createObjectURL(file));
      setImagePreviews(urls);
    } else {
      setImagePreviews([]);
    }
  };

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!seller) return;
    setLoading(true);
    setUploadProgress(0);

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    formData.append("sellerId", seller.sellerId);

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
        alert("Product listed successfully!");
        formElement.reset();
        setImagePreviews([]);
        setUploadProgress(0);
        fetchCategories();
        fetchDashboardData();
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
    if (!editingProduct || !seller) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("sellerId", seller.sellerId);
    formData.append("imageUrls", JSON.stringify(tempImageUrls));

    // If no files selected, clear them
    const files = formData.getAll("images") as File[];
    if (files.length > 0 && files[0].size === 0) {
      formData.delete("images");
    }

    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        alert("Product updated successfully!");
        setEditingProduct(null);
        fetchDashboardData();
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
    if (!window.confirm("Are you sure you want to delete this product from your shop?"))
      return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Product deleted successfully!");
        fetchDashboardData();
      } else {
        alert("Failed to delete product.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting.");
    }
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  // Total Seller Earnings
  const totalEarnings = useMemo(() => {
    return orders.reduce((total, order) => {
      const sellerItems = order.items.filter((item) => item.sellerId === seller?.sellerId);
      const sellerSubtotal = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return total + sellerSubtotal;
    }, 0);
  }, [orders, seller]);

  // Total Items Sold
  const totalItemsSold = useMemo(() => {
    return orders.reduce((total, order) => {
      const sellerItems = order.items.filter((item) => item.sellerId === seller?.sellerId);
      const sellerQty = sellerItems.reduce((sum, item) => sum + item.quantity, 0);
      return total + sellerQty;
    }, 0);
  }, [orders, seller]);

  // --- RENDER ENROLLMENT / LOGIN PORTAL ---
  if (!seller) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="max-w-xl mx-auto w-full pt-10 pb-16 flex-grow flex items-center justify-center p-4 font-sans"
      >
        <div className="bg-white p-8 md:p-12 rounded-[40px] border border-pink-100 shadow-xl w-full">
          <div className="w-20 h-20 bg-theme-light-pink rounded-3xl flex items-center justify-center mx-auto mb-6 border border-pink-200">
            <Award className="w-10 h-10 text-theme-brand" />
          </div>

          <h2
            style={cursiveStyle}
            className="text-5xl font-bold text-center text-gray-900 mb-2"
          >
            {mode === "login" ? "Seller Login" : "Join as a Seller"}
          </h2>
          <p className="text-gray-500 text-center font-medium mb-8">
            {mode === "login"
              ? "Access your dashboard and manage your crochet shop"
              : "Enroll today and start selling your handcrafted cuteness!"}
          </p>

          {authError && (
            <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100 font-medium">
              {authError}
            </div>
          )}

          {authSuccess && (
            <div className="p-4 mb-6 bg-green-50 text-green-700 rounded-2xl text-sm border border-green-100 font-medium">
              {authSuccess}
            </div>
          )}

          <form onSubmit={mode === "login" ? handleLogin : handleEnroll} className="space-y-5">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g., Jane Doe"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-theme-bg focus:bg-white focus:border-theme-brand focus:ring-4 focus:ring-pink-50 outline-none transition-all text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g., jane@example.com"
                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-theme-bg focus:bg-white focus:border-theme-brand focus:ring-4 focus:ring-pink-50 outline-none transition-all text-sm font-semibold"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                Seller ID (Unique Username)
              </label>
              <input
                type="text"
                required
                value={sellerIdInput}
                onChange={(e) => setSellerIdInput(e.target.value)}
                placeholder="e.g., cutecrochets12"
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-theme-bg focus:bg-white focus:border-theme-brand focus:ring-4 focus:ring-pink-50 outline-none transition-all text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                Password
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-theme-bg focus:bg-white focus:border-theme-brand focus:ring-4 focus:ring-pink-50 outline-none transition-all text-sm font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-theme-brand text-white py-4.5 rounded-full font-bold text-lg hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-pink-100 border border-transparent hover:border-pink-200 mt-6"
            >
              {mode === "login" ? "Log In" : "Register and Enroll"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            {mode === "login" ? (
              <p className="text-sm font-medium text-gray-500">
                Don't have a seller account yet?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className="text-theme-brand hover:underline font-bold"
                >
                  Sign Up & Enroll
                </button>
              </p>
            ) : (
              <p className="text-sm font-medium text-gray-500">
                Already registered?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setAuthError("");
                    setAuthSuccess("");
                  }}
                  className="text-theme-brand hover:underline font-bold"
                >
                  Log In Here
                </button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // --- RENDER SELLER DASHBOARD ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-7xl mx-auto w-full pt-4 relative font-sans"
    >
      {/* Seller Header Info */}
      <div className="bg-white rounded-[32px] border border-gray-100 p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <span className="text-theme-brand font-bold text-xs uppercase tracking-widest bg-pink-50 px-3.5 py-1.5 rounded-full border border-pink-100">
            Seller Portal
          </span>
          <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mt-3 font-medium">
            Welcome back, <span style={cursiveStyle} className="text-theme-brand text-4xl md:text-5xl font-bold">{seller.name}</span>!
          </h1>
          <p className="text-gray-500 text-sm mt-1.5 font-medium flex items-center gap-2">
            <User className="w-4 h-4 text-theme-brand" /> Seller ID: <span className="font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100 text-gray-700">{seller.sellerId}</span>
            <span className="text-gray-300">|</span>
            <Mail className="w-4 h-4 text-theme-brand" /> {seller.email}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3.5 font-bold text-red-500 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-full transition-colors whitespace-nowrap text-sm"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      {/* Seller Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-theme-brand border border-pink-100">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sales</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">Rs. {totalEarnings.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 border border-green-100">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items Sold</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalItemsSold} Plushies</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-100">
            <Box className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Inventory</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{products.length} Products</h3>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-4 overflow-x-auto pb-4 mb-8">
        <button
          onClick={() => setTab("sales")}
          className={`px-8 py-3.5 font-bold border transition-all whitespace-nowrap text-sm ${
            tab === "sales"
              ? "bg-theme-brand text-white border-theme-brand rounded-full shadow-md shadow-pink-100"
              : "bg-white text-gray-500 border-gray-100 hover:bg-theme-hover hover:text-theme-brand rounded-2xl"
          }`}
        >
          My Sales / Orders ({orders.length})
        </button>
        <button
          onClick={() => setTab("inventory")}
          className={`px-8 py-3.5 font-bold border transition-all whitespace-nowrap text-sm ${
            tab === "inventory"
              ? "bg-theme-brand text-white border-theme-brand rounded-full shadow-md shadow-pink-100"
              : "bg-white text-gray-500 border-gray-100 hover:bg-theme-hover hover:text-theme-brand rounded-2xl"
          }`}
        >
          My Inventory ({products.length})
        </button>
        <button
          onClick={() => setTab("add")}
          className={`px-8 py-3.5 font-bold border transition-all whitespace-nowrap text-sm ${
            tab === "add"
              ? "bg-theme-brand text-white border-theme-brand rounded-full shadow-md shadow-pink-100"
              : "bg-white text-gray-500 border-gray-100 hover:bg-theme-hover hover:text-theme-brand rounded-2xl"
          }`}
        >
          Add Product to Sell
        </button>
      </div>

      {/* --- TAB: SALES --- */}
      {tab === "sales" && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-gray-100 bg-white">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-theme-brand" /> My Sales Management
            </h2>
            <p className="text-sm text-gray-400 mt-1 mb-4 font-medium">Orders containing your listed products are shown below.</p>

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
                    className="w-full pl-9 pr-8 py-3 rounded-xl border border-gray-200 bg-white focus:border-theme-brand outline-none text-sm font-medium appearance-none cursor-pointer text-gray-700"
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
                    className="w-full pl-9 pr-8 py-3 rounded-xl border border-gray-200 bg-white focus:border-theme-brand outline-none text-sm font-medium appearance-none cursor-pointer text-gray-700"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-theme-bg">
                <tr className="text-gray-400 border-b border-gray-100 text-xs uppercase tracking-wider font-bold">
                  <th className="p-5 w-12"></th>
                  <th className="p-5">Order Details</th>
                  <th className="p-5">Customer info</th>
                  <th className="p-5">Date</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">My Earnings</th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-gray-400 font-medium bg-white">
                      Loading orders...
                    </td>
                  </tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-gray-400 font-medium bg-white">
                      No sales yet! list cute products to start selling.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const isExpanded = expandedOrders.includes(order.id);
                    // Calculate earnings from this order
                    const sellerItems = order.items.filter((item) => item.sellerId === seller.sellerId);
                    const sellerSubtotal = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

                    return (
                      <React.Fragment key={order.id}>
                        <tr className="border-b border-gray-100 bg-white hover:bg-gray-50/50 transition-colors">
                          <td className="p-5 text-center">
                            <button
                              onClick={() => toggleOrderExpand(order.id)}
                              className="p-1.5 text-gray-400 hover:text-theme-brand hover:bg-pink-50 rounded-lg transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </td>
                          <td className="p-5">
                            <span className="text-gray-900 font-bold text-sm">#{order.id}</span>
                            <br />
                            <span className="text-xs text-theme-brand font-bold tracking-wide">{order.trackingId}</span>
                          </td>
                          <td className="p-5">
                            <div className="font-bold text-gray-900 text-sm">{order.customerName}</div>
                            <div className="text-xs font-semibold text-gray-400">{order.email}</div>
                          </td>
                          <td className="p-5 text-gray-500 font-bold text-xs">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-5 relative z-10 w-48">
                            <select
                              value={order.status}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                const oldStatus = order.status;
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

                                    // Handle automatic stock inventory updates
                                    if (
                                      oldStatus !== "cancelled" &&
                                      newStatus === "cancelled"
                                    ) {
                                      await handleUpdateStock(
                                        order.items,
                                        "reimburse",
                                      );
                                    } else if (
                                      oldStatus === "cancelled" &&
                                      newStatus !== "cancelled"
                                    ) {
                                      await handleUpdateStock(
                                        order.items,
                                        "deduct",
                                      );
                                    }
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
                          <td className="p-5 font-bold text-base text-right text-theme-brand">
                            Rs. {sellerSubtotal.toFixed(2)}
                          </td>
                        </tr>

                        <AnimatePresence>
                          {isExpanded && (
                            <tr className="bg-gray-50/60 border-b border-gray-100">
                              <td colSpan={6} className="p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="p-6 mx-8 my-4 bg-white rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-theme-brand" /> Customer & Delivery Details
                                      </h4>
                                      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 text-sm space-y-2">
                                        <p><strong>Name:</strong> {order.customerName}</p>
                                        <p><strong>Phone:</strong> {order.phone || "Not provided"}</p>
                                        <p className="leading-relaxed"><strong>Address:</strong> {order.address || "No address provided"}</p>
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <Package className="w-4 h-4 text-theme-brand" /> My Sold Items
                                      </h4>
                                      <div className="space-y-2.5">
                                        {sellerItems.map((item, idx) => (
                                          <div key={idx} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100 text-sm">
                                            <div>
                                              <p className="font-bold text-gray-800">{item.title}</p>
                                              <p className="text-xs text-gray-400 mt-0.5 font-bold">Qty: {item.quantity} × Rs. {item.price.toFixed(2)}</p>
                                            </div>
                                            <p className="font-bold text-theme-brand">Rs. {(item.price * item.quantity).toFixed(2)}</p>
                                          </div>
                                        ))}
                                      </div>
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

          {/* Pagination */}
          {totalOrderPages > 1 && (
            <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between mt-auto">
              <span className="text-xs font-bold text-gray-400 uppercase">
                Page {orderPage} of {totalOrderPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                  disabled={orderPage === 1}
                  className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOrderPage((p) => Math.min(totalOrderPages, p + 1))}
                  disabled={orderPage === totalOrderPages}
                  className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB: INVENTORY --- */}
      {tab === "inventory" && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Box className="w-5 h-5 text-theme-brand" /> My Listed Products
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-theme-bg">
                <tr className="text-gray-400 border-b border-gray-100 text-xs uppercase tracking-wider font-bold">
                  <th className="p-5 w-32">Images</th>
                  <th className="p-5">Product Title</th>
                  <th className="p-5">Category</th>
                  <th className="p-5">Price</th>
                  <th className="p-5">Stock</th>
                  <th className="p-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-gray-400 font-medium">
                      Loading inventory...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-gray-400 font-medium">
                      You haven't listed any products yet! Click "Add Product" to list your first item.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                      <td className="p-5">
                        <div className="flex -space-x-3 items-center">
                          {product.imageUrls?.slice(0, 3).map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={product.title}
                              onClick={() => setSelectedImage(url)}
                              className="w-12 h-12 object-cover rounded-xl border-2 border-white cursor-pointer hover:z-10 relative transition-transform hover:scale-110 shadow-sm bg-white"
                            />
                          ))}
                        </div>
                      </td>
                      <td className="p-5">
                        <p className="font-bold text-gray-900 text-sm">{product.title}</p>
                        <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">{product.description}</p>
                      </td>
                      <td className="p-5 text-gray-400 uppercase tracking-wider text-xs font-bold">
                        {product.category}
                      </td>
                      <td className="p-5 font-bold text-gray-900 text-sm">
                        Rs. {product.price.toFixed(2)}
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          product.stock > 5 ? "bg-green-50 text-green-700 border border-green-100" :
                          product.stock > 0 ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                          "bg-red-50 text-red-700 border border-red-100"
                        }`}>
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
        <div className="max-w-2xl bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Plus className="w-6 h-6 text-theme-brand" /> List New Product
          </h2>

          <form onSubmit={handleAddProduct} className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Product Title
                </label>
                <input
                  required
                  name="title"
                  placeholder="e.g., Chubby Piglet Amigurumi"
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-semibold transition-all text-sm"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Price (Rs. )
                </label>
                <input
                  required
                  name="price"
                  type="number"
                  step="1"
                  placeholder="e.g., 250"
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-semibold transition-all text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Category
                </label>
                <input
                  required
                  name="category"
                  placeholder="e.g., plushies"
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-semibold transition-all text-sm"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Available Stock
                </label>
                <input
                  required
                  name="stock"
                  type="number"
                  defaultValue="1"
                  min="1"
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-semibold transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                Description
              </label>
              <textarea
                required
                name="description"
                rows={3}
                placeholder="Write details about the handmade materials, color, sizing, etc..."
                className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-semibold transition-all resize-none text-sm"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                Product Images
              </label>
              <div className="relative mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-100 border-dashed rounded-2xl hover:border-theme-brand hover:bg-theme-hover transition-colors cursor-pointer bg-theme-bg min-h-[140px] items-center">
                <input
                  required
                  type="file"
                  name="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {imagePreviews.length > 0 ? (
                  <div className="flex flex-wrap gap-2 justify-center p-2">
                    {imagePreviews.map((src, idx) => (
                      <img key={idx} src={src} alt="Preview" className="h-20 w-20 object-cover rounded-xl border border-gray-200" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-theme-brand mb-2" />
                    <span className="text-sm font-bold text-theme-brand">Upload Photos</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-theme-brand text-white font-bold text-lg rounded-full shadow-lg shadow-pink-100 hover:scale-[1.01] active:scale-[0.99] transition-all border border-transparent disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? "Listing Product..." : "List Product for Sale"}
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

              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Edit className="w-5 h-5 text-theme-brand" /> Edit Product Listing
              </h3>

              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                    Product Title
                  </label>
                  <input
                    required
                    name="title"
                    defaultValue={editingProduct.title}
                    className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-semibold transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                      Price (Rs. )
                    </label>
                    <input
                      required
                      name="price"
                      type="number"
                      step="1"
                      defaultValue={editingProduct.price}
                      className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-semibold transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                      Stock
                    </label>
                    <input
                      required
                      name="stock"
                      type="number"
                      min="0"
                      defaultValue={editingProduct.stock}
                      className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-semibold transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                    Category
                  </label>
                  <input
                    required
                    name="category"
                    defaultValue={editingProduct.category}
                    className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-semibold transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                    Description
                  </label>
                  <textarea
                    required
                    name="description"
                    rows={3}
                    defaultValue={editingProduct.description}
                    className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-semibold transition-all resize-none text-sm"
                  ></textarea>
                </div>

                {tempImageUrls.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                      Choose Hero Image (First is Hero)
                    </label>
                    <div className="flex flex-wrap gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      {tempImageUrls.map((url, idx) => (
                        <div key={idx} className="relative flex flex-col items-center">
                          <img
                            src={url}
                            alt="Product Thumbnail"
                            className={`w-20 h-20 object-cover rounded-xl border-2 ${
                              idx === 0 ? "border-theme-brand shadow-md" : "border-transparent"
                            }`}
                          />
                          {idx === 0 ? (
                            <span className="text-[10px] font-bold text-theme-brand bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100 mt-1">
                              ✨ Hero
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const reordered = [tempImageUrls[idx], ...tempImageUrls.filter((_, i) => i !== idx)];
                                setTempImageUrls(reordered);
                              }}
                              className="text-[10px] font-bold text-gray-500 hover:text-theme-brand bg-white px-2 py-0.5 rounded-full border border-gray-100 mt-1 cursor-pointer transition-colors hover:border-pink-200"
                            >
                              Set Hero
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                    Replace Images (Optional)
                  </label>
                  <input
                    type="file"
                    name="images"
                    multiple
                    accept="image/*"
                    className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-theme-bg focus:border-theme-brand focus:bg-white outline-none font-semibold transition-all text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-theme-brand text-white font-bold text-lg rounded-full shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-70"
                  >
                    {loading ? "Updating..." : "Save Product Changes"}
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
              <img src={selectedImage} alt="Enlarged view" className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
