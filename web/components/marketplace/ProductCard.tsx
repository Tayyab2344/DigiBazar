"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, CheckCircle, ShoppingBag, Truck, Heart } from "lucide-react";
import { PublicProductCard } from "@/lib/api/public";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

interface ProductCardProps {
  product: PublicProductCard;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);

  const isWishlisted = isInWishlist(product.id);

  const displayPrice = product.sale_price && product.sale_price < product.price ? product.sale_price : product.price;
  const originalPrice = product.sale_price && product.sale_price < product.price ? product.price : null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
      className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-amber-300 transition-all duration-300 flex flex-col justify-between overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div>
        {/* Image Container */}
        <div className="relative w-full aspect-square bg-slate-100 overflow-hidden">
          <Link href={`/products/${product.slug}`} className="block w-full h-full">
            <img
              src={isHovered && product.hover_image ? product.hover_image : product.primary_image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
          </Link>

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
            {product.stock <= 0 && (
              <span className="px-2 py-0.5 rounded-md font-black text-[10px] bg-rose-600 text-white shadow-xs tracking-wider uppercase">
                OUT OF STOCK
              </span>
            )}
            {product.discount_percentage > 0 && product.stock > 0 && (
              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-600 text-white shadow-xs tracking-wider">
                {product.discount_percentage}% OFF
              </span>
            )}
            {product.badge && product.badge !== "FLASH SALE" && product.stock > 0 && (
              <span
                className={`px-2 py-0.5 rounded-md font-semibold text-[10px] text-white shadow-xs uppercase tracking-wider ${
                  product.badge === "BEST SELLER"
                    ? "bg-amber-500"
                    : product.badge === "NEW"
                    ? "bg-emerald-600"
                    : "bg-zinc-900"
                }`}
              >
                {product.badge}
              </span>
            )}
          </div>

          {/* Favorite Toggle Button */}
          <button
            onClick={handleWishlistToggle}
            className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md shadow-xs transition-all z-10 ${
              isWishlisted
                ? "bg-rose-50 text-rose-600"
                : "bg-white/80 hover:bg-white text-slate-400 hover:text-rose-500"
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-600" : ""}`} />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-3.5 sm:p-4 flex flex-col gap-1.5">
          {/* Verified Seller Link */}
          <Link
            href={`/company/${product.company_slug}`}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-amber-700 transition-colors w-fit"
          >
            <span className="truncate max-w-[140px]">{product.company_name}</span>
            {product.company_is_verified && <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />}
          </Link>

          {/* Product Title */}
          <Link href={`/products/${product.slug}`} className="group-hover:text-amber-700 transition-colors">
            <h3 className="font-semibold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Rating & Total Sold */}
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </div>
            <span className="text-xs font-semibold text-slate-800">{product.rating.toFixed(1)}</span>
            <span className="text-[11px] text-slate-400">({product.review_count})</span>
            <span className="text-slate-300 text-[10px]">•</span>
            <span className="text-[11px] text-slate-500 font-medium">{product.sales_count || 0} sold</span>
          </div>

          {/* Pricing */}
          <div className="mt-1 flex items-baseline gap-2 flex-wrap">
            <span className="font-bold text-sm sm:text-base text-slate-900">
              Rs. {(displayPrice / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
            {originalPrice && (
              <span className="text-xs text-slate-400 line-through">
                Rs. {(originalPrice / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            )}
          </div>

          {/* Free Delivery Tag */}
          {product.is_free_delivery && (
            <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit mt-1">
              <Truck className="w-3 h-3" />
              <span>Free Delivery</span>
            </div>
          )}
        </div>
      </div>

      {/* Add to Cart Footer Button */}
      <div className="p-3.5 pt-0">
        <button
          onClick={handleQuickAdd}
          disabled={product.stock <= 0}
          className={`w-full py-2 px-3 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs ${
            product.stock <= 0
              ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 opacity-80"
              : "bg-slate-100 hover:bg-amber-500 text-slate-700 hover:text-slate-950 cursor-pointer"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{product.stock <= 0 ? "Out of Stock" : "Add to Cart"}</span>
        </button>
      </div>
    </div>
  );
};
