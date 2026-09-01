"use client";

import React from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/marketplace/Footer";
import { ProductCard } from "@/components/marketplace/ProductCard";

export default function CustomerWishlistPage() {
  const { wishlistItems, removeFromWishlist, clearWishlist, wishlistCount } = useWishlist();
  const { addToCart } = useCart();

  const handleAddAllToCart = () => {
    wishlistItems.forEach((product) => {
      addToCart({
        productId: product.id,
        companyId: product.company_id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        salePrice: product.sale_price,
        image: product.primary_image,
        companyName: product.company_name,
        companySlug: product.company_slug,
        quantity: 1,
        stock: product.stock,
      });
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 shrink-0">
              <Heart className="w-6 h-6 fill-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Saved Wishlist</h1>
                <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {wishlistCount} {wishlistCount === 1 ? "Item" : "Items"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved products you are keeping an eye on across DigiBazar stores.
              </p>
            </div>
          </div>

          {wishlistCount > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleAddAllToCart}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 transition-colors shadow-sm"
              >
                <ShoppingBag className="w-4 h-4 text-slate-950" />
                <span>Move All to Cart</span>
              </button>
              <button
                onClick={clearWishlist}
                className="px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        {/* Wishlist Items Content */}
        {wishlistCount === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-12 space-y-5 shadow-xs">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-100">
              <Heart className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">Your wishlist is empty</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Explore thousands of verified products from top Pakistani vendors and tap the heart icon on any card to save items here!
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Explore Products</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlistItems.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
