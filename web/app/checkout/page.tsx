"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/marketplace/Header";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useCart } from "@/context/CartContext";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { companyApi } from "@/lib/api/company";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowRight,
  Package,
  ChevronRight,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  Sparkles,
  Loader2,
  AlertTriangle,
  Tag,
  X,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, subtotalCents, clearCart } = useCart();
  const user = useAuthStore((state) => state.user);

  // Form State
  const [fullName, setFullName] = useState(
    user ? `${user.first_name} ${user.last_name}` : ""
  );
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address?.address_line_1 || "");
  const [city, setCity] = useState(user?.address?.city || "Lahore");
  const [postalCode, setPostalCode] = useState(user?.address?.postal_code || "");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card" | "wallet">("cod");
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");

  // Stripe Card Form State
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountCents: number;
    message?: string;
    isCapped?: boolean;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState<{
    orderId: string;
    totalAmount: number;
  } | null>(null);

  // Auto populate address & details if user state initializes after mount
  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(`${user.first_name} ${user.last_name}`);
      if (!email) setEmail(user.email || "");
      if (!phone && user.phone) setPhone(user.phone);
      if (!address && user.address?.address_line_1) setAddress(user.address.address_line_1);
      if (user.address?.city) setCity(user.address.city);
      if (!postalCode && user.address?.postal_code) setPostalCode(user.address.postal_code);
    }
  }, [user]);

  // Check if a shareable discount link auto-applied a coupon code
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAutoCoupon = localStorage.getItem("digibazar_auto_coupon");
      if (savedAutoCoupon && !appliedCoupon && !couponCodeInput) {
        setCouponCodeInput(savedAutoCoupon);
      }
    }
  }, []);

  const formatCardNumber = (val: string) => {
    const v = val.replace(/\s+/g, "").replace(/[^0-9]/gi, "").slice(0, 16);
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.length > 0 ? parts.join(" ") : v;
  };

  const formatCardExpiry = (val: string) => {
    const v = val.replace(/\s+/g, "").replace(/[^0-9]/gi, "").slice(0, 4);
    if (v.length >= 3) {
      return `${v.slice(0, 2)}/${v.slice(2)}`;
    }
    return v;
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    setCouponError(null);
    setCouponLoading(true);

    try {
      const cartValidations = cartItems.map((item) => ({
        product_id: item.productId,
        company_id: item.companyId || "00000000-0000-0000-0000-000000000000",
        price: item.salePrice && item.salePrice < item.price ? item.salePrice : item.price,
        quantity: item.quantity,
      }));

      const res = await companyApi.validateCoupon({
        code: couponCodeInput.trim().toUpperCase(),
        cart_items: cartValidations,
        order_subtotal: subtotalCents,
      });

      if (res.valid) {
        setAppliedCoupon({
          code: res.code || couponCodeInput.trim().toUpperCase(),
          discountCents: res.total_discount,
          message: res.message,
          isCapped: (res as any).is_capped,
        });
        setCouponCodeInput("");
      } else {
        setCouponError(res.message || "Invalid or inapplicable coupon code.");
      }
    } catch (err: any) {
      console.error("Coupon validation error:", err);
      setCouponError(err?.detail || err?.message || "Failed to validate coupon code.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const shippingCostCents = shippingMethod === "express" ? 25000 : 0; // 250 PKR if express
  const couponDiscountCents = appliedCoupon ? appliedCoupon.discountCents : 0;
  const totalCents = Math.max(0, subtotalCents - couponDiscountCents + shippingCostCents);

  const formatPKR = (cents: number) =>
    `Rs. ${(cents / 100).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setErrorMessage(null);

    // Validate cart items stock before submitting checkout
    const outOfStockItems = cartItems.filter((item) => item.stock !== undefined && item.stock <= 0);
    if (outOfStockItems.length > 0) {
      const itemNames = outOfStockItems.map((it) => `"${it.name}"`).join(", ");
      setErrorMessage(`Cannot place order: ${itemNames} is currently out of stock. Please remove out-of-stock items from your cart.`);
      return;
    }

    const insufficientStockItems = cartItems.filter(
      (item) => item.stock !== undefined && item.stock > 0 && item.quantity > item.stock
    );
    if (insufficientStockItems.length > 0) {
      const itemNames = insufficientStockItems.map((it) => `"${it.name}" (Available: ${it.stock})`).join(", ");
      setErrorMessage(`Cannot place order: Insufficient stock for ${itemNames}. Please update cart quantities.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        shipping_address: {
          full_name: fullName,
          phone: phone,
          address: address,
          city: city,
          postal_code: postalCode,
        },
        payment_method: paymentMethod,
        shipping_method: shippingMethod,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        items: cartItems.map((item) => ({
          product_id: item.productId,
          company_id: item.companyId || "00000000-0000-0000-0000-000000000000",
          name: item.name,
          price: item.salePrice && item.salePrice < item.price ? item.salePrice : item.price,
          quantity: item.quantity,
          image: item.image,
          variant_id: item.variantId || null,
        })),
      };

      const res = await companyApi.checkoutOrder(payload);
      setOrderComplete({
        orderId: res.order_ids.join(", "),
        totalAmount: res.total_amount,
      });
      clearCart();
    } catch (err: any) {
      console.error("Order Checkout failed:", err);
      setErrorMessage(err?.detail || err?.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <ProtectedRoute allowedRoles={["CUSTOMER", "COMPANY", "SUPER_ADMIN"]}>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Header />
          <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8 sm:p-12 text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 uppercase tracking-wider">
                  Order Successfully Placed
                </span>
                <h1 className="text-3xl font-extrabold text-slate-900">Thank You for Your Order!</h1>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  We have received your order <span className="font-mono font-bold text-slate-900">{orderComplete.orderId}</span> and dispatched a confirmation to your email.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left max-w-md mx-auto space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Order Number</span>
                  <span className="font-mono font-bold text-slate-900">{orderComplete.orderId}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Payment Method</span>
                  <span className="font-bold text-slate-900 uppercase">{paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600">
                  <span>Estimated Delivery</span>
                  <span className="font-bold text-emerald-600">2 - 4 Business Days</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-extrabold text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-blue-600">{formatPKR(orderComplete.totalAmount)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <Link
                  href="/customer/dashboard"
                  className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  <span>View Customer Dashboard</span>
                </Link>
                <Link
                  href="/"
                  className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER", "COMPANY", "SUPER_ADMIN"]}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />

        {/* Breadcrumb Header */}
        <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link href="/" className="hover:text-blue-600 font-medium">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="hover:text-blue-600 font-medium">Cart</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-900">Checkout</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm my-8">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Your Cart is Empty</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You don&apos;t have any items in your shopping cart to proceed to checkout.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column - Shipping & Payment Details */}
              <div className="lg:col-span-7 space-y-6">
                {/* Shipping Address */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Shipping Details</h2>
                      <p className="text-xs text-slate-500">Where should we deliver your order?</p>
                    </div>
                  </div>

                  {/* Profile Address Pre-fill Info Banner */}
                  <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl text-[11px] text-blue-900">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Pre-filled from your profile address</span>
                      <p className="text-slate-600 mt-0.5">
                        Modifying here updates this order only. To change your saved address permanently, edit your details in{" "}
                        <Link href="/account/settings" className="font-bold text-blue-700 underline hover:text-blue-900">
                          Account Settings
                        </Link>.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Full Name</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Phone Number</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+92 300 1234567"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Street Address</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House #, Street, Block, Area"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">City</label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                      >
                        <option value="Lahore">Lahore</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="Rawalpindi">Rawalpindi</option>
                        <option value="Faisalabad">Faisalabad</option>
                        <option value="Multan">Multan</option>
                        <option value="Peshawar">Peshawar</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Postal Code</label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="54000"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Method */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Delivery Speed</h2>
                      <p className="text-xs text-slate-500">Choose your shipping options</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => setShippingMethod("standard")}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                        shippingMethod === "standard"
                          ? "border-blue-600 bg-blue-50/50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <Truck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">Standard Delivery</span>
                          <span className="text-xs font-extrabold text-emerald-600">FREE</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Delivered in 3 to 5 business days nationwide.</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setShippingMethod("express")}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                        shippingMethod === "express"
                          ? "border-blue-600 bg-blue-50/50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">Express Overnight</span>
                          <span className="text-xs font-extrabold text-slate-900">Rs. 250</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Priority dispatch with 24-hour delivery.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Payment Option</h2>
                      <p className="text-xs text-slate-500">Select how you want to pay</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div
                      onClick={() => setPaymentMethod("cod")}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        paymentMethod === "cod" ? "border-blue-600 bg-blue-50/50" : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-xs">
                          COD
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">Cash on Delivery</span>
                          <span className="text-[11px] text-slate-500">Pay with physical cash upon package arrival</span>
                        </div>
                      </div>
                      <input type="radio" checked={paymentMethod === "cod"} onChange={() => {}} className="text-blue-600" />
                    </div>

                    <div
                      onClick={() => setPaymentMethod("card")}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        paymentMethod === "card" ? "border-blue-600 bg-blue-50/50" : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">Credit / Debit Card (Stripe)</span>
                            <span className="text-[11px] text-slate-500">Instant & Secure online card payment</span>
                          </div>
                        </div>
                        <input type="radio" checked={paymentMethod === "card"} onChange={() => {}} className="text-blue-600" />
                      </div>

                      {/* Stripe Card Input Form */}
                      {paymentMethod === "card" && (
                        <div className="mt-4 pt-4 border-t border-blue-200/60 space-y-3 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1 text-slate-700 font-bold">
                              <Lock className="w-3 h-3 text-emerald-600" /> Powered by Stripe
                            </span>
                            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">256-Bit SSL Encrypted</span>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-700">Cardholder Name</label>
                            <input
                              type="text"
                              required={paymentMethod === "card"}
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              placeholder="e.g. John Doe"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-700">Card Number</label>
                            <div className="relative">
                              <input
                                type="text"
                                required={paymentMethod === "card"}
                                value={cardNumber}
                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                placeholder="4242 4242 4242 4242"
                                className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                              />
                              <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-slate-700">Expiry Date</label>
                              <input
                                type="text"
                                required={paymentMethod === "card"}
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
                                placeholder="MM/YY"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-slate-700">CVC / CVV</label>
                              <input
                                type="text"
                                required={paymentMethod === "card"}
                                maxLength={4}
                                value={cardCvc}
                                onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                                placeholder="123"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6 sticky top-24">
                  <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">
                    Order Summary ({cartItems.length} items)
                  </h2>

                  {/* Cart Items List */}
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{item.name}</h4>
                          <span className="text-[10px] text-slate-400 block font-medium">Store: {item.companyName}</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-semibold text-slate-600">Qty: {item.quantity}</span>
                            <span className="text-xs font-extrabold text-slate-900">
                              {formatPKR((item.salePrice || item.price) * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Code Input Section */}
                  <div className="border-t border-slate-100 pt-4 space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-600" />
                      <span>Promo / Coupon Code</span>
                    </label>

                    {appliedCoupon ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-800 uppercase px-2 py-0.5 bg-emerald-100 rounded-md">
                              {appliedCoupon.code}
                            </span>
                            <span className="text-emerald-700 font-semibold">
                              Saved {formatPKR(appliedCoupon.discountCents)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            title="Remove Coupon"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {appliedCoupon.isCapped && appliedCoupon.message && (
                          <p className="text-[10px] text-amber-800 font-medium pt-0.5">
                            ⚠️ {appliedCoupon.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value)}
                          placeholder="Enter coupon code"
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCodeInput.trim()}
                          className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                        >
                          {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                        </button>
                      </div>
                    )}

                    {couponError && (
                      <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>{couponError}</span>
                      </p>
                    )}
                  </div>

                  {/* Price Calculations */}
                  <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Items Subtotal</span>
                      <span className="font-bold text-slate-900">{formatPKR(subtotalCents)}</span>
                    </div>
                    {appliedCoupon && appliedCoupon.discountCents > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Coupon Discount</span>
                        <span>-{formatPKR(appliedCoupon.discountCents)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Estimated Shipping</span>
                      <span className="font-semibold text-emerald-600">
                        {shippingCostCents === 0 ? "FREE" : formatPKR(shippingCostCents)}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-base font-extrabold text-slate-900">
                      <span>Total Pay</span>
                      <span className="text-blue-600 text-xl">{formatPKR(totalCents)}</span>
                    </div>
                  </div>

                  {/* Submit Button - Changed to Black */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Complete Order & Pay</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-slate-400">
                    By clicking &quot;Complete Order & Pay&quot;, you agree to DigiBazar Marketplace Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            </form>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
