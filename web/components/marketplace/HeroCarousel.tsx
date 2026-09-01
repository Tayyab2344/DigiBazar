"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { HeroSlide } from "@/lib/api/public";

interface HeroCarouselProps {
  slides?: HeroSlide[];
}

const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    title: "Everything you need.\nAll in one marketplace.",
    subtitle: "Shop smartphones, laptops & smartwatches from verified stores across Pakistan.",
    description: "Discover authentic tech, fashion, and lifestyle items with verified seller warranties and nationwide express delivery.",
    desktop_image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80",
    side_image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    button_text: "Shop Electronics",
    button_url: "/search?q=Electronics",
    badge_text: "DIGIBAZAR EXCLUSIVE",
  },
  {
    id: "slide-2",
    title: "Upgrade your everyday\ntech & fashion",
    subtitle: "Explore direct deals from top Pakistani clothing & fashion brand stores.",
    description: "Best prices on genuine electronics, home appliances, and apparel with 100% buyer protection.",
    desktop_image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&auto=format&fit=crop&q=80",
    side_image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80",
    button_text: "Shop Fashion",
    button_url: "/search?q=Fashion",
    badge_text: "VERIFIED BRANDS",
  },
  {
    id: "slide-3",
    title: "Redefine your home\n& living space",
    subtitle: "Discover designer furniture, decor, and smart kitchen appliances with express shipping.",
    description: "Elevate your living room and kitchen with durable, stylish home essentials.",
    desktop_image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=80",
    side_image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&auto=format&fit=crop&q=80",
    button_text: "Explore Home",
    button_url: "/search?q=Home",
    badge_text: "HOME ESSENTIALS",
  },
  {
    id: "slide-4",
    title: "Immersive sound &\nsmart wearables",
    subtitle: "Top rated wireless earbuds, headphones, and fitness watches with brand warranties.",
    description: "Experience high-fidelity audio and health tracking with original brand guarantees.",
    desktop_image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&auto=format&fit=crop&q=80",
    side_image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80",
    button_text: "Shop Wearables",
    button_url: "/search?q=Wearables",
    badge_text: "TRENDING GADGETS",
  },
  {
    id: "slide-5",
    title: "Glow with authentic\nbeauty & skincare",
    subtitle: "100% genuine skincare products, serums, and luxury perfumes from certified sellers.",
    description: "Nourish your skin with top dermatologist recommended brands and organic cosmetics.",
    desktop_image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&auto=format&fit=crop&q=80",
    side_image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
    button_text: "Shop Beauty",
    button_url: "/search?q=Beauty",
    badge_text: "BEAUTY CARE",
  },
  {
    id: "slide-6",
    title: "Gear up for ultimate\nfitness & sports",
    subtitle: "High-grade training equipment, activewear, and footwear for everyday athletes.",
    description: "Achieve your fitness goals with premium sports gear and durable gym accessories.",
    desktop_image: "https://images.unsplash.com/photo-1517649763962-0c623266010b?w=1600&auto=format&fit=crop&q=80",
    side_image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80",
    button_text: "Shop Sports",
    button_url: "/search?q=Sports",
    badge_text: "ACTIVE GEAR",
  },
  {
    id: "slide-7",
    title: "Unbeatable deals &\nseasonal price cuts",
    subtitle: "Save up to 50% on top Pakistani stores with nationwide express shipping.",
    description: "Limited time flash discounts on top-selling marketplace categories.",
    desktop_image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&auto=format&fit=crop&q=80",
    side_image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&auto=format&fit=crop&q=80",
    button_text: "View Flash Deals",
    button_url: "/search?q=deals",
    badge_text: "SPECIAL DISCOUNTS",
  },
];

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const displaySlides = slides && slides.length >= 5 ? slides : DEFAULT_HERO_SLIDES;

  useEffect(() => {
    if (displaySlides.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displaySlides.length);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [displaySlides.length, isPaused]);

  if (displaySlides.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + displaySlides.length) % displaySlides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displaySlides.length);
  };

  return (
    <div
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative w-full aspect-[16/7] min-h-[340px] sm:min-h-[400px] lg:min-h-[440px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900 group">
        {/* Background Slide Images & Gradients */}
        {displaySlides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.id || index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Desktop / Mobile Background Image */}
              <picture className="absolute inset-0 w-full h-full">
                {slide.mobile_image && <source media="(max-width: 640px)" srcSet={slide.mobile_image} />}
                <img
                  src={slide.desktop_image}
                  alt={slide.title}
                  loading={index === 0 ? "eager" : "lazy"}
                  className="w-full h-full object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-1000"
                />
              </picture>

              {/* Dark Gradient Overlay for Contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/30"></div>

              {/* Grid Layout: Left Content & Right Composition */}
              <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-12 md:px-16 grid grid-cols-1 md:grid-cols-12 items-center text-left text-white z-20 gap-6">
                <div className="md:col-span-7 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 border border-amber-300/50 w-fit mb-3 shadow-sm backdrop-blur-xs">
                    <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                    <span>{slide.badge_text || "DIGIBAZAR MARKETPLACE"}</span>
                  </div>

                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-3 text-white whitespace-pre-line">
                    {slide.title}
                  </h2>

                  <p className="text-sm sm:text-base font-normal text-slate-300 mb-6 leading-relaxed max-w-xl">
                    {slide.subtitle || "Shop products from trusted stores across Pakistan."}
                  </p>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href={slide.button_url || "/search"}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium text-xs sm:text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                    >
                      <span>{slide.button_text || "Shop Now"}</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </Link>

                    <Link
                      href="/search"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium text-xs sm:text-sm transition-all backdrop-blur-xs"
                    >
                      <span>Explore Categories</span>
                    </Link>
                  </div>
                </div>

                {/* Right side Product Composition Image */}
                <div className="hidden md:flex md:col-span-5 items-center justify-center relative">
                  <div className="relative w-full max-w-xs aspect-square rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-white/5 backdrop-blur-xs p-2">
                    <img
                      src={slide.side_image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"}
                      alt={slide.title}
                      className="w-full h-full object-cover rounded-xl shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Navigation Arrows */}
        {displaySlides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-slate-900/40 hover:bg-slate-900/80 text-white/80 hover:text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-slate-900/40 hover:bg-slate-900/80 text-white/80 hover:text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Pagination Indicators (Dots) in Amber Brand Theme */}
        {displaySlides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/50 backdrop-blur-md border border-white/10">
            {displaySlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex ? "w-6 h-2 bg-amber-400 shadow-xs" : "w-2 h-2 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
