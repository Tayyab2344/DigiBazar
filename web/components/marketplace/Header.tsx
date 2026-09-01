"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  User,
  Package,
  ChevronDown,
  Menu,
  X,
  Store,
  Sparkles,
  ArrowRight,
  Trash2,
  Plus,
  Minus,
  Heart,
  Truck,
  HelpCircle,
  Tag,
  Smartphone,
  Shirt,
  Home,
  Trophy,
  Car,
  Baby,
  ShoppingBasket,
  Watch,
  MoreHorizontal,
  Flame,
  Grid3x3,
  CheckCircle2,
} from "lucide-react";

import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { publicApi, SearchSuggestionResponse, PublicCategory } from "@/lib/api/public";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { AuthenticatedMenu } from "@/components/auth/AuthenticatedMenu";

export const Header: React.FC = () => {
  const router = useRouter();
  const { cartCount, cartItems, subtotalCents, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, initializeAuth } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [suggestions, setSuggestions] = useState<SearchSuggestionResponse>({ products: [], categories: [], companies: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [activeMegaCategory, setActiveMegaCategory] = useState("Electronics");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Load live search suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions({ products: [], categories: [], companies: [] });
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      publicApi
        .searchSuggestions(searchQuery)
        .then((res) => {
          setSuggestions(res);
          setShowSuggestions(true);
        })
        .finally(() => setIsSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target as Node)) {
        setShowMegaMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      const categoryFilter = selectedCategory !== "All" ? `&category=${encodeURIComponent(selectedCategory)}` : "";
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}${categoryFilter}`);
    }
  };

  const formatPKR = (cents: number) =>
    `Rs. ${(cents / 100).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

  const navCategories = [
    { name: "Electronics", slug: "electronics", icon: Smartphone },
    { name: "Fashion", slug: "fashion", icon: Shirt },
    { name: "Home & Living", slug: "home-living", icon: Home },
    { name: "Beauty", slug: "beauty", icon: Sparkles },
    { name: "Sports", slug: "sports", icon: Trophy },
    { name: "Automotive", slug: "automotive", icon: Car },
    { name: "Toys & Kids", slug: "toys-kids", icon: Baby },
    { name: "Groceries", slug: "groceries", icon: ShoppingBasket },
    { name: "Accessories", slug: "accessories", icon: Watch },
  ];

  const megaMenuData: Record<string, { title: string; links: string[] }[]> = {
    Electronics: [
      { title: "Mobiles & Tablets", links: ["Smartphones", "Tablets", "Power Banks", "Smartwatches", "Phone Cases"] },
      { title: "Laptops & Computers", links: ["Gaming Laptops", "Monitors", "Keyboards & Mice", "Storage & SSDs", "PC Components"] },
      { title: "Audio & Entertainment", links: ["Wireless Earbuds", "Bluetooth Speakers", "Headphones", "Home Theater", "Microphones"] },
    ],
    Fashion: [
      { title: "Men's Clothing", links: ["T-Shirts & Polos", "Shirts", "Jeans & Trousers", "Jackets & Coats", "Eastern Wear"] },
      { title: "Women's Fashion", links: ["Unstitched Fabrics", "Ready to Wear", "Handbags & Totes", "Jewelry & Watches", "Abayas"] },
      { title: "Footwear", links: ["Sneakers", "Formal Shoes", "Sandals & Slippers", "Heels & Pumps", "Boots"] },
    ],
    "Home & Living": [
      { title: "Furniture & Decor", links: ["Living Room Sets", "Bedframes & Mattresses", "Wall Art & Mirrors", "Lighting & Lamps"] },
      { title: "Kitchen & Dining", links: ["Cookware Sets", "Air Fryers", "Dinnerware", "Drinkware & Tumblers"] },
      { title: "Home Essentials", links: ["Bed Sheets", "Towels", "Storage Organizers", "Cleaning Supplies"] },
    ],
    Beauty: [
      { title: "Skincare", links: ["Cleansers & Serums", "Sunscreen & Moisturizers", "Face Masks", "Eye Cream"] },
      { title: "Makeup & Hair", links: ["Foundations & Concealers", "Lipsticks", "Shampoos & Hair Serums", "Styling Tools"] },
      { title: "Fragrances", links: ["Men's Perfume", "Women's Perfume", "Body Mists", "Attars"] },
    ],
  };

  return (
    <>
      {/* ======================================== */}
      {/* 1. TOP UTILITY BAR (Slim, ~34px high)    */}
      {/* ======================================== */}
      <div className="bg-[#121417] text-zinc-300 text-[11px] h-[34px] flex items-center border-b border-zinc-800/80 font-sans">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Shipping perk */}
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium truncate">
            <Truck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>Free Delivery on orders above Rs. 1,499</span>
          </div>

          {/* Center: Promotional Banner */}
          <div className="hidden md:flex items-center gap-1.5 font-medium text-amber-300/90 tracking-wide">
            <span>🔥 Summer Sale | Up to 40% OFF</span>
          </div>

          {/* Right: Utility Links */}
          <div className="flex items-center gap-3 text-zinc-400">
            <Link
              href="/register/company"
              className="hover:text-white transition-colors font-medium flex items-center gap-1"
            >
              <Store className="w-3 h-3 text-amber-400/90" />
              <span>Sell on DigiBazar</span>
            </Link>
            <span className="text-zinc-700">|</span>
            <Link href="/account/settings" className="hover:text-white transition-colors">
              Help & Support
            </Link>
            <span className="text-zinc-700">|</span>
            <Link href="/customer/orders" className="hover:text-white transition-colors">
              Track Order
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================== */}
      {/* 2. MAIN NAVIGATION ROW (~76px high)     */}
      {/* ======================================== */}
      <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-40 shadow-xs h-[76px] flex items-center font-sans">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sm:gap-6">
          
          {/* Left: Brand Identity & Mega Menu Toggle */}
          <div className="flex items-center gap-5 shrink-0">
            {/* DigiBazar Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <ShoppingBag className="w-7 h-7 text-zinc-900 stroke-[2.2] group-hover:text-amber-600 transition-colors" />
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-2xl tracking-tight text-zinc-900">
                  Digi<span className="font-light text-zinc-700">Bazar</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-medium tracking-tight mt-0.5">
                  Digital Bazar for Modern Commerce
                </span>
              </div>
            </Link>

            {/* All Categories Button (Desktop) */}
            <div className="hidden lg:block relative" ref={megaMenuRef}>
              <button
                onClick={() => setShowMegaMenu(!showMegaMenu)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-900 font-semibold text-xs transition-all shadow-2xs"
              >
                <Grid3x3 className="w-4 h-4 text-zinc-700" />
                <span>All Categories</span>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${showMegaMenu ? "rotate-180" : ""}`} />
              </button>

              {/* MEGA MENU OVERLAY */}
              {showMegaMenu && (
                <div className="absolute left-0 mt-3 w-[820px] bg-white rounded-2xl border border-zinc-200 shadow-2xl z-50 p-6 grid grid-cols-12 gap-6 animate-in fade-in zoom-in-95 duration-150">
                  {/* Left Column: Categories List */}
                  <div className="col-span-4 bg-zinc-50 rounded-xl p-2 border border-zinc-100 space-y-1">
                    {["Electronics", "Fashion", "Home & Living", "Beauty", "Sports", "Automotive", "Groceries", "Toys & Kids"].map((cat) => {
                      const isActive = activeMegaCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveMegaCategory(cat)}
                          onMouseEnter={() => setActiveMegaCategory(cat)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                            isActive
                              ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200"
                              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
                          }`}
                        >
                          <span>{cat}</span>
                          <ChevronDown className="-rotate-90 w-3.5 h-3.5 text-zinc-400" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Middle Column: Subcategories Grid */}
                  <div className="col-span-5 grid grid-cols-1 gap-4 py-1">
                    {(megaMenuData[activeMegaCategory] || megaMenuData["Electronics"]).map((group, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-1">
                          {group.title}
                        </h4>
                        <div className="space-y-1 text-xs text-zinc-600">
                          {group.links.map((link, lIdx) => (
                            <Link
                              key={lIdx}
                              href={`/search?q=${encodeURIComponent(link)}`}
                              onClick={() => setShowMegaMenu(false)}
                              className="block hover:text-zinc-900 hover:underline transition-colors text-[11px]"
                            >
                              {link}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Column: Featured Banner */}
                  <div className="col-span-3 rounded-xl bg-gradient-to-br from-amber-50 to-zinc-50 p-4 border border-amber-200/50 flex flex-col justify-between text-left">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md inline-block">
                        Featured Store
                      </span>
                      <h3 className="text-sm font-extrabold text-zinc-900 mt-2 leading-snug">
                        {activeMegaCategory} Showcase 2026
                      </h3>
                      <p className="text-[11px] text-zinc-500 mt-1">
                        Up to 40% OFF on certified marketplace items.
                      </p>
                    </div>

                    <Link
                      href={`/search?q=${encodeURIComponent(activeMegaCategory)}`}
                      onClick={() => setShowMegaMenu(false)}
                      className="mt-4 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold text-center transition-colors shadow-2xs"
                    >
                      Shop {activeMegaCategory} →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Search Field (Widest Interactive Element) */}
          <div className="flex-1 max-w-2xl relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="h-11 border border-zinc-300 focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900 rounded-lg bg-white overflow-hidden transition-all flex items-center shadow-2xs">
                <Search className="w-4 h-4 text-zinc-400 ml-3.5 shrink-0" />
                
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, brands and stores..."
                  className="w-full px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 bg-transparent focus:outline-none"
                />

                {/* Category Dropdown inside Search Field */}
                <div className="hidden sm:flex items-center border-l border-zinc-200 pl-2 pr-1 shrink-0 text-xs text-zinc-600 font-medium">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-xs font-medium text-zinc-700 hover:text-zinc-900 focus:outline-none cursor-pointer py-1 pr-1"
                  >
                    <option value="All">All Categories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home & Living">Home & Living</option>
                    <option value="Beauty">Beauty</option>
                    <option value="Sports">Sports</option>
                    <option value="Automotive">Automotive</option>
                  </select>
                </div>

                {/* Search Action Button */}
                <button
                  type="submit"
                  className="bg-zinc-900 hover:bg-zinc-800 text-white h-full px-5 transition-colors flex items-center justify-center shrink-0 font-medium text-xs border-l border-zinc-200"
                  aria-label="Submit search"
                >
                  <Search className="w-4 h-4 text-white" />
                </button>
              </div>
            </form>

            {/* Live Autocomplete Dropdown */}
            {showSuggestions && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl border border-zinc-200 shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-zinc-500 font-medium flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                    <span>Searching DigiBazar catalog...</span>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100 text-xs">
                    {/* Matching Products */}
                    {suggestions.products.length > 0 && (
                      <div className="p-3">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Products</div>
                        <div className="space-y-1">
                          {suggestions.products.map((prod) => (
                            <Link
                              key={prod.id}
                              href={prod.url}
                              onClick={() => setShowSuggestions(false)}
                              className="flex items-center gap-3 p-2 hover:bg-zinc-50 rounded-lg transition-colors"
                            >
                              <img
                                src={prod.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"}
                                alt={prod.title}
                                className="w-9 h-9 rounded-md object-cover border border-zinc-200"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-zinc-900 truncate">{prod.title}</p>
                                <p className="text-[11px] font-extrabold text-zinc-900">
                                  {prod.price ? formatPKR(prod.price) : (prod.subtitle || "Product")}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Stores */}
                    {suggestions.companies.length > 0 && (
                      <div className="p-3 bg-zinc-50/50">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Verified Sellers</div>
                        <div className="space-y-1">
                          {suggestions.companies.map((comp) => (
                            <Link
                              key={comp.id}
                              href={comp.url}
                              onClick={() => setShowSuggestions(false)}
                              className="flex items-center justify-between p-2 hover:bg-white rounded-lg transition-colors"
                            >
                              <div className="flex items-center gap-2 font-bold text-zinc-900">
                                <Store className="w-3.5 h-3.5 text-zinc-700" />
                                <span>{comp.title}</span>
                              </div>
                              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">Verified Seller</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Four Clean Navigation Actions */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {/* 1. ACCOUNT */}
            {isAuthenticated && user ? (
              <AuthenticatedMenu />
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 text-left group hover:text-zinc-600 transition-colors"
              >
                <User className="w-5 h-5 text-zinc-700 stroke-[1.8] shrink-0" />
                <div className="hidden xl:flex flex-col leading-none">
                  <span className="text-[10px] text-zinc-400 font-medium uppercase">Account</span>
                  <span className="text-xs font-medium text-zinc-900 leading-none mt-0.5 group-hover:text-zinc-600">
                    Sign in / Register
                  </span>
                </div>
              </Link>
            )}

            {/* 2. WISHLIST */}
            <Link
              href="/customer/wishlist"
              className="flex items-center gap-2 text-left group hover:text-zinc-600 transition-colors relative"
            >
              <div className="relative">
                <Heart className="w-5 h-5 text-zinc-700 stroke-[1.8] shrink-0" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-white font-semibold text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center border border-white">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <div className="hidden xl:flex flex-col leading-none">
                <span className="text-[10px] text-zinc-400 font-medium uppercase">Wishlist</span>
                <span className="text-xs font-medium text-zinc-900 leading-none mt-0.5 group-hover:text-zinc-600">
                  Saved Items
                </span>
              </div>
            </Link>

            {/* 3. TRACK ORDERS */}
            <Link
              href="/customer/orders"
              className="hidden lg:flex items-center gap-2 text-left group hover:text-zinc-600 transition-colors"
            >
              <Package className="w-5 h-5 text-zinc-700 stroke-[1.8] shrink-0" />
              <div className="hidden xl:flex flex-col leading-none">
                <span className="text-[10px] text-zinc-400 font-medium uppercase">Orders</span>
                <span className="text-xs font-medium text-zinc-900 leading-none mt-0.5 group-hover:text-zinc-600">
                  Track Packages
                </span>
              </div>
            </Link>

            {/* 4. CART */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 text-left group focus:outline-none"
            >
              <div className="relative p-2 bg-zinc-100 group-hover:bg-zinc-200 rounded-xl transition-colors">
                <ShoppingBag className="w-5 h-5 text-zinc-900 stroke-[1.8]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-600 text-white font-semibold text-[10px] min-w-[18px] h-4.5 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-[10px] text-zinc-400 font-medium uppercase">Cart</span>
                <span className="text-xs font-semibold text-zinc-900 leading-none mt-0.5">
                  {formatPKR(subtotalCents)}
                </span>
              </div>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-700 lg:hidden"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* ======================================== */}
      {/* 3. SECOND NAVIGATION ROW (~46px high)    */}
      {/* ======================================== */}
      <div className="bg-white border-b border-zinc-200/80 h-[46px] hidden lg:flex items-center font-sans">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs font-medium text-zinc-700">
          {/* Horizontal Categories Links */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            {navCategories.map((cat) => {
              const IconComp = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/search?q=${encodeURIComponent(cat.name)}`}
                  className="flex items-center gap-1.5 hover:text-zinc-900 transition-colors whitespace-nowrap text-zinc-700 font-semibold"
                >
                  <IconComp className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{cat.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Far Right: Today's Deals Tag (Champagne Gold Accent) */}
          <Link
            href="/search?q=deals"
            className="bg-amber-50 text-amber-900 border border-amber-200/80 px-3 py-1 rounded-md text-xs font-bold font-sans flex items-center gap-1.5 hover:bg-amber-100 transition-colors shrink-0"
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>Today&apos;s Deals</span>
          </Link>
        </div>
      </div>

      {/* ======================================== */}
      {/* 4. MINI CART SLIDE-OVER DRAWER           */}
      {/* ======================================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 border-l border-zinc-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-zinc-900" />
                <h3 className="font-extrabold text-sm text-zinc-900">Your Shopping Cart</h3>
                <span className="bg-zinc-200 text-zinc-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {cartCount} items
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 divide-y divide-zinc-100 space-y-4">
              {cartItems.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <ShoppingBag className="w-12 h-12 text-zinc-300 mx-auto" />
                  <p className="text-xs font-bold text-zinc-700">Your cart is currently empty</p>
                  <p className="text-[11px] text-zinc-400">Discover trending products across Pakistani vendors.</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="pt-4 first:pt-0 flex items-start gap-3.5">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover border border-zinc-200 shrink-0 bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-xs text-zinc-900 line-clamp-2">{item.name}</span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-zinc-400 hover:text-rose-600 p-0.5 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-amber-800 font-semibold mt-0.5">By {item.companyName}</p>

                      <div className="flex items-center justify-between mt-3">
                        <span className="font-extrabold text-xs text-zinc-900">
                          {formatPKR((item.salePrice || item.price) * item.quantity)}
                        </span>
                        <div className="flex items-center border border-zinc-200 rounded-md bg-zinc-50">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 text-zinc-600 hover:bg-zinc-200 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 font-bold text-xs text-zinc-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 text-zinc-600 hover:bg-zinc-200 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Drawer Footer */}
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-zinc-200 bg-zinc-50 space-y-3">
                <div className="flex justify-between items-center text-xs text-zinc-600 font-medium">
                  <span>Subtotal</span>
                  <span className="text-zinc-900 font-bold">{formatPKR(subtotalCents)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-600 font-medium">
                  <span>Shipping</span>
                  <span className="text-emerald-700 font-bold">Calculated at Checkout</span>
                </div>
                <div className="border-t border-zinc-200 pt-2 flex justify-between items-center text-sm font-black text-zinc-900">
                  <span>Total Amount</span>
                  <span className="text-zinc-900">{formatPKR(subtotalCents)}</span>
                </div>

                <div className="pt-2">
                  <Link
                    href={isAuthenticated ? "/checkout" : "/login?redirect=/checkout"}
                    onClick={() => setIsCartOpen(false)}
                    className="w-full block py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-md"
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-4 font-sans">
          <div className="font-bold text-xs text-zinc-400 uppercase tracking-wider">Categories</div>
          <div className="grid grid-cols-2 gap-2">
            {navCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/search?q=${encodeURIComponent(cat.name)}`}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 bg-zinc-50 hover:bg-zinc-100 text-xs font-semibold text-zinc-800 rounded-lg border border-zinc-200"
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-xs font-bold bg-zinc-900 text-white rounded-xl"
            >
              Sign In to Account
            </Link>
            <Link
              href="/register/company"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 rounded-xl"
            >
              Sell on DigiBazar
            </Link>
          </div>
        </div>
      )}
    </>
  );
};
