"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Star,
  CheckCircle,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Store,
  ChevronRight,
  Plus,
  Minus,
  Check,
  Heart,
  Share2,
  Package,
} from "lucide-react";

import { publicApi, ProductDetail, ReviewItem, ReviewSummary, PublicProductCard } from "@/lib/api/public";
import { useCart } from "@/context/CartContext";
import { addRecentlyViewed, getRecentlyViewed } from "@/lib/recentlyViewed";

import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/marketplace/Footer";
import { ProductGallery } from "@/components/marketplace/ProductGallery";
import { ProductReviews } from "@/components/marketplace/ProductReviews";
import { ProductCard } from "@/components/marketplace/ProductCard";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const { addToCart } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviewsData, setReviewsData] = useState<{ reviews: ReviewItem[]; summary: ReviewSummary } | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<PublicProductCard[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<PublicProductCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Variant selection state
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "reviews" | "shipping">("description");

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);

    Promise.all([
      publicApi.getProductDetail(slug),
      publicApi.getProductReviews(slug),
      publicApi.getProducts({ limit: 4 }),
    ])
      .then(([prodRes, revRes, relRes]) => {
        setProduct(prodRes);
        setReviewsData(revRes);
        setRelatedProducts(relRes.items.filter((p) => p.slug !== slug).slice(0, 4));

        // Initial default variant attributes selection
        if (prodRes && prodRes.variants && prodRes.variants.length > 0) {
          setSelectedAttributes(prodRes.variants[0].attributes || {});
        }

        // Add to recently viewed localStorage
        if (prodRes) {
          const cardObj: PublicProductCard = {
            id: prodRes.id,
            name: prodRes.name,
            slug: prodRes.slug,
            brand: prodRes.brand,
            price: prodRes.price,
            sale_price: prodRes.sale_price,
            discount_percentage: prodRes.discount_percentage,
            rating: prodRes.rating,
            review_count: prodRes.review_count,
            stock: prodRes.stock,
            is_free_delivery: prodRes.is_free_delivery,
            badge: prodRes.badge,
            primary_image: prodRes.images[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
            company_id: prodRes.company.id,
            company_name: prodRes.company.name,
            company_slug: prodRes.company.slug,
            company_is_verified: prodRes.company.is_verified,
            created_at: new Date().toISOString(),
          };
          addRecentlyViewed(cardObj);
        }

        setRecentlyViewed(getRecentlyViewed().filter((p) => p.slug !== slug));
      })
      .catch((err) => console.error("Error loading product detail:", err))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header />
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 space-y-8">
          <div className="w-48 h-6 bg-slate-200 animate-pulse rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="aspect-square bg-slate-200 animate-pulse rounded-3xl"></div>
            <div className="space-y-4">
              <div className="w-3/4 h-8 bg-slate-200 animate-pulse rounded"></div>
              <div className="w-1/2 h-6 bg-slate-200 animate-pulse rounded"></div>
              <div className="w-full h-32 bg-slate-200 animate-pulse rounded-2xl"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate dynamic variant values if selected
  const activeVariant = product.variants.find((v) => {
    return Object.entries(selectedAttributes).every(([k, val]) => v.attributes[k] === val);
  });

  const displayPrice = activeVariant ? (activeVariant.sale_price || activeVariant.price) : (product.sale_price || product.price);
  const originalPrice = activeVariant
    ? (activeVariant.sale_price ? activeVariant.price : null)
    : (product.sale_price ? product.price : null);
  const discount = product.discount_percentage;
  const currentStock = activeVariant ? activeVariant.stock : product.stock;

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      companyId: product.company.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      salePrice: product.sale_price,
      image: activeVariant?.image_url || product.images[0]?.url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      companyName: product.company.name,
      companySlug: product.company.slug,
      quantity: quantity,
      variantId: activeVariant?.id,
      variantTitle: activeVariant ? Object.values(activeVariant.attributes).join(" / ") : undefined,
      stock: currentStock,
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto py-1">
          <Link href="/" className="hover:text-amber-700 transition-colors shrink-0">
            Marketplace
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {product.category && (
            <>
              <Link href={`/category/${product.category.slug}`} className="hover:text-amber-700 transition-colors shrink-0">
                {product.category.name}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </>
          )}
          <span className="text-slate-900 truncate">{product.name}</span>
        </nav>

        {/* Main Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Gallery Column */}
          <div className="lg:col-span-6">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Product Details & Actions Column */}
          <div className="lg:col-span-6 space-y-6">
            {/* Verified Seller Link & Brand */}
            <div className="flex items-center justify-between gap-4">
              <Link
                href={`/company/${product.company.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200/80 hover:bg-emerald-100 transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                <span>{product.company.name}</span>
                {product.company.is_verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
              </Link>

              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <span>Brand: <strong className="text-slate-700">{product.brand}</strong></span>
              </div>
            </div>

            {/* Title & Ratings */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug mb-3">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-extrabold">{product.rating.toFixed(1)}</span>
                  <span className="text-amber-700">({product.review_count} reviews)</span>
                </div>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 font-semibold">{product.sales_count}+ Sold</span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Verified Catalog Item
                </span>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-zinc-950 rounded-3xl text-white shadow-xl space-y-2 relative overflow-hidden">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  Rs. {(displayPrice / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
                {originalPrice && (
                  <span className="text-base text-slate-400 line-through">
                    Rs. {(originalPrice / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                )}
                {discount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-600 text-white shadow-sm">
                    SAVE {discount}% OFF
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">Inclusive of all taxes & instant seller discount.</p>
            </div>

            {/* Stock Status & Shipping Perks */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 text-center text-xs font-semibold">
              <div className="flex flex-col items-center gap-1">
                <Package className="w-4 h-4 text-amber-600" />
                <span className={currentStock > 0 ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                  {currentStock > 0 ? `In Stock (${currentStock})` : "Out of Stock"}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 border-x border-slate-100">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-700">Free Express Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span className="text-slate-700">1 Year Warranty</span>
              </div>
            </div>

            {/* Dynamic Variant Selectors */}
            {product.variants.length > 0 && (
              <div className="space-y-4 pt-2">
                {/* Group variants by attribute name */}
                {Object.keys(product.variants[0].attributes).map((attrName) => {
                  const options = Array.from(new Set(product.variants.map((v) => v.attributes[attrName])));
                  return (
                    <div key={attrName} className="space-y-2">
                      <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                        Select {attrName}: <span className="text-amber-700 font-semibold">{selectedAttributes[attrName]}</span>
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {options.map((opt) => {
                          const isSelected = selectedAttributes[attrName] === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => setSelectedAttributes((prev) => ({ ...prev, [attrName]: opt }))}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                isSelected
                                  ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md ring-2 ring-amber-500/30"
                                  : "bg-white text-slate-700 border-slate-300 hover:border-amber-400"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quantity:</label>
                <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2.5 text-slate-600 hover:bg-slate-100 transition-colors rounded-l-xl"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 font-bold text-sm text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(currentStock || 99, q + 1))}
                    className="p-2.5 text-slate-600 hover:bg-slate-100 transition-colors rounded-r-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons: Add to Cart & Buy Now */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={currentStock <= 0}
                  className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <ShoppingBag className="w-5 h-5 text-slate-950" />
                  <span>Add to Cart</span>
                </button>
                <Link
                  href="/login?redirect=/checkout"
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all text-center"
                >
                  <span>Buy Now</span>
                </Link>
              </div>

              {addedToast && (
                <div className="p-3 bg-emerald-50 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-200 flex items-center gap-2 animate-in fade-in duration-150">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Product successfully added to your cart!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ Daraz/Amazon–style Tabbed Product Information ═══ */}
        {(() => {
          const tabItems = [
            { key: "description" as const, label: "Description" },
            { key: "specifications" as const, label: "Specifications" },
            { key: "reviews" as const, label: `Reviews (${product.review_count})` },
            { key: "shipping" as const, label: "Shipping & Returns" },
          ];

          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-slate-200">
              {/* Left Column — Tabbed Content (8 cols) */}
              <div className="lg:col-span-8 space-y-0">
                {/* Tab Nav Bar */}
                <div className="flex items-center gap-0 border-b border-slate-200 bg-white rounded-t-3xl overflow-x-auto">
                  {tabItems.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`relative px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap ${
                        activeTab === tab.key
                          ? "text-amber-600"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.key && (
                        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber-500 rounded-t-full" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Content Panels */}
                <div className="bg-white rounded-b-3xl border border-t-0 border-slate-200 shadow-xs overflow-hidden">
                  {/* ── DESCRIPTION TAB ── */}
                  {activeTab === "description" && (
                    <div className="p-6 sm:p-8 space-y-8">
                      {/* Product Highlights */}
                      {product.short_description && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-6 rounded-full bg-amber-500" />
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Product Highlights</h3>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {product.short_description.split(/[.\n]/).filter(Boolean).map((highlight, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-3.5 bg-gradient-to-r from-amber-50/80 to-orange-50/40 rounded-xl border border-amber-100/60">
                                <div className="mt-0.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3" />
                                </div>
                                <span className="text-sm text-slate-700 font-medium leading-snug">{highlight.trim()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Main Description */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-6 rounded-full bg-emerald-500" />
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">Product Description</h3>
                        </div>
                        {product.description ? (
                          <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed">
                            {product.description.split('\n').map((paragraph, idx) => (
                              paragraph.trim() ? (
                                <p key={idx} className="mb-3 text-[14.5px] text-slate-600 leading-[1.8] font-normal">
                                  {paragraph.trim()}
                                </p>
                              ) : null
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <p className="text-sm text-slate-400 font-medium">No description available for this product yet.</p>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {product.tags && product.tags.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tags</span>
                          <div className="flex flex-wrap gap-2">
                            {product.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg border border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors cursor-pointer"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key Info Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-3 p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100/60">
                          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-emerald-800">Authentic Product</div>
                            <div className="text-[11px] text-emerald-600 font-medium">100% Genuine Guarantee</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-blue-50/80 rounded-2xl border border-blue-100/60">
                          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
                            <Truck className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-blue-800">Fast Delivery</div>
                            <div className="text-[11px] text-blue-600 font-medium">Nationwide Express Shipping</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-violet-50/80 rounded-2xl border border-violet-100/60">
                          <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center shrink-0">
                            <RotateCcw className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-violet-800">Easy Returns</div>
                            <div className="text-[11px] text-violet-600 font-medium">14-Day Return Policy</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── SPECIFICATIONS TAB ── */}
                  {activeTab === "specifications" && (
                    <div className="p-6 sm:p-8 space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-6 rounded-full bg-blue-500" />
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Technical Specifications</h3>
                      </div>
                      {Object.keys(product.specifications).length > 0 ? (
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                          <table className="w-full text-sm">
                            <tbody>
                              {Object.entries(product.specifications).map(([key, val], idx) => (
                                <tr key={key} className={idx % 2 === 0 ? "bg-slate-50/80" : "bg-white"}>
                                  <td className="py-3.5 px-5 font-bold text-slate-500 text-xs uppercase tracking-wider w-2/5 border-r border-slate-100">
                                    {key}
                                  </td>
                                  <td className="py-3.5 px-5 font-semibold text-slate-800 text-sm">
                                    {val}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <p className="text-sm text-slate-400 font-medium">No specifications available for this product.</p>
                        </div>
                      )}

                      {/* Additional Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
                        {product.brand && (
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Brand</span>
                            <span className="block text-xs font-extrabold text-slate-800">{product.brand}</span>
                          </div>
                        )}
                        {product.sku && (
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SKU</span>
                            <span className="block text-xs font-extrabold text-slate-800">{product.sku}</span>
                          </div>
                        )}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</span>
                          <span className="block text-xs font-extrabold text-slate-800">{product.category?.name || "General"}</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Availability</span>
                          <span className={`block text-xs font-extrabold ${product.stock > 0 ? "text-emerald-700" : "text-rose-600"}`}>
                            {product.stock > 0 ? "In Stock" : "Out of Stock"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── REVIEWS TAB ── */}
                  {activeTab === "reviews" && (
                    <div className="p-6 sm:p-8">
                      {reviewsData ? (
                        <ProductReviews summary={reviewsData.summary} reviews={reviewsData.reviews} />
                      ) : (
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <p className="text-sm text-slate-400 font-medium">No reviews yet for this product.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── SHIPPING & RETURNS TAB ── */}
                  {activeTab === "shipping" && (
                    <div className="p-6 sm:p-8 space-y-6">
                      {/* Shipping Information */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-6 rounded-full bg-blue-500" />
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">Shipping Information</h3>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-4 p-4 bg-blue-50/60 rounded-2xl border border-blue-100/60">
                            <Truck className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-bold text-slate-800 mb-1">{product.shipping_info || "Standard Delivery (2-4 Days)"}</div>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Free delivery available on orders above Rs. 999. Express delivery option available at checkout for priority shipping across Pakistan.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100/60">
                            <Package className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-bold text-slate-800 mb-1">Cash on Delivery Available</div>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Pay when you receive your order. Online payment via debit/credit card is also supported with secure checkout.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Warranty Information */}
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-6 rounded-full bg-amber-500" />
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">Warranty</h3>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-amber-50/60 rounded-2xl border border-amber-100/60">
                          <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-slate-800 mb-1">{product.warranty_info || "1 Year Brand Warranty"}</div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              This product comes with the seller&apos;s warranty. For warranty claims, contact the seller through our platform for hassle-free resolution.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Returns Information */}
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-6 rounded-full bg-violet-500" />
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">Return Policy</h3>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-violet-50/60 rounded-2xl border border-violet-100/60">
                          <RotateCcw className="w-6 h-6 text-violet-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-slate-800 mb-1">{product.return_info || "14 Days Easy Returns"}</div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Change of mind is not applicable as a return reason. Items must be returned in original condition with all tags and packaging intact. Damaged or defective items are eligible for a full refund or replacement.
                            </p>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-700 mb-2">Return Conditions:</h4>
                          <ul className="space-y-1.5">
                            {[
                              "Item must be unused and in original packaging",
                              "Return request must be made within 14 days of delivery",
                              "Damaged/defective items eligible for full refund",
                              "Original receipt or proof of purchase required",
                            ].map((condition, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{condition}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column — Seller Sidebar (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Seller Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 sticky top-24">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg border border-emerald-100 shrink-0">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 font-extrabold text-slate-900 text-sm">
                        <span>{product.company.name}</span>
                        {product.company.is_verified && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </div>
                      <span className="text-xs text-slate-500">Verified Marketplace Vendor</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-center text-xs">
                    <div>
                      <div className="font-extrabold text-slate-900">{product.company.rating.toFixed(1)} ★</div>
                      <div className="text-[11px] text-slate-400">Seller Rating</div>
                    </div>
                    <div className="border-l border-slate-100">
                      <div className="font-extrabold text-slate-900">{product.company.sales_count}+</div>
                      <div className="text-[11px] text-slate-400">Products Sold</div>
                    </div>
                  </div>

                  <Link
                    href={`/company/${product.company.slug}`}
                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <span>Visit Seller Store</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Why Buy from Us card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <h4 className="text-sm font-black text-slate-900">Why Buy from digiBazar?</h4>
                  <div className="space-y-3">
                    {[
                      { icon: <ShieldCheck className="w-4 h-4" />, title: "Buyer Protection", desc: "Full refund if item is not as described", color: "text-emerald-600 bg-emerald-50" },
                      { icon: <Truck className="w-4 h-4" />, title: "Free Delivery", desc: "On selected items above Rs. 999", color: "text-blue-600 bg-blue-50" },
                      { icon: <RotateCcw className="w-4 h-4" />, title: "Easy Returns", desc: "14-day hassle-free return policy", color: "text-violet-600 bg-violet-50" },
                      { icon: <Star className="w-4 h-4" />, title: "Verified Sellers", desc: "All vendors are identity-verified", color: "text-amber-600 bg-amber-50" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                          {item.icon}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{item.title}</div>
                          <div className="text-[11px] text-slate-400 font-medium">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="pt-8 border-t border-slate-200">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-6">
              You May Also Like
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <section className="pt-8 border-t border-slate-200">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-6">
              Recently Viewed Products
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {recentlyViewed.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
