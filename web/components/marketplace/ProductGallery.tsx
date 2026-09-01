"use client";

import React, { useState } from "react";
import { Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { PublicProductImage } from "@/lib/api/public";

interface ProductGalleryProps {
  images: PublicProductImage[];
  productName: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images, productName }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayImages = images && images.length > 0 ? images : [
    {
      id: "default",
      url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      alt_text: productName,
      is_primary: true,
      sort_order: 0,
    },
  ];

  const currentImage = displayImages[selectedIndex] || displayImages[0];

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % displayImages.length);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Primary Image Container */}
      <div className="relative w-full aspect-square bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden group">
        <img
          src={currentImage.url}
          alt={currentImage.alt_text || productName}
          className="w-full h-full object-cover object-center transition-all duration-300"
        />

        {/* Zoom Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute top-4 right-4 p-2.5 rounded-2xl bg-white/90 hover:bg-white text-slate-700 shadow-md backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
          title="Fullscreen Zoom"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Thumbnails Row */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {displayImages.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                idx === selectedIndex
                  ? "border-blue-600 ring-2 ring-blue-600/20 shadow-md"
                  : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
              }`}
            >
              <img src={img.url} alt={img.alt_text || productName} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <img
              src={currentImage.url}
              alt={productName}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />

            {displayImages.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-2 p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
