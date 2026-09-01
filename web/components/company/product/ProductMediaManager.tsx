"use client";

import React, { useState } from "react";
import { UploadCloud, Link as LinkIcon, Star, Trash2, ArrowUp, ArrowDown, Edit2, Check, Image as ImageIcon, Loader2 } from "lucide-react";
import type { ProductImageItem } from "@/types/product";
import { authApi } from "@/lib/api/auth";

interface Props {
  images: ProductImageItem[];
  onChangeImages: (images: ProductImageItem[]) => void;
}

// Convert user selected File directly into a permanent Base64 Data URI
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export function ProductMediaManager({ images, onChangeImages }: Props) {
  const [externalUrl, setExternalUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [editingAltIdx, setEditingAltIdx] = useState<number | null>(null);
  const [altTextInput, setAltTextInput] = useState("");

  // Clean out any stale expired blob URLs from state
  const validImages = images.filter((img) => img.url && !img.url.startsWith("blob:"));

  const handleAddExternalUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetUrl = externalUrl.trim();
    if (!targetUrl) return;

    try {
      new URL(targetUrl);
    } catch {
      setUrlError("Please enter a valid HTTP or HTTPS image URL.");
      return;
    }

    setUrlError("");
    const newImage: ProductImageItem = {
      url: targetUrl,
      alt_text: "Product image",
      sort_order: validImages.length,
      is_primary: validImages.length === 0,
    };

    onChangeImages([...validImages, newImage]);
    setExternalUrl("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const newUploaded: ProductImageItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let finalUrl = "";
        let publicId: string | undefined = undefined;

        try {
          const uploadRes = await authApi.uploadImage(file);
          finalUrl = uploadRes.url;
          publicId = uploadRes.public_id;
        } catch {
          finalUrl = await readFileAsDataURL(file);
        }

        newUploaded.push({
          url: finalUrl,
          cloudinary_public_id: publicId,
          alt_text: file.name.split(".")[0],
          sort_order: validImages.length + i,
          is_primary: validImages.length === 0 && i === 0,
        });
      }

      onChangeImages([...validImages, ...newUploaded]);
    } catch (err: any) {
      console.error("Image processing error:", err);
      setUploadError(err.message || "Failed to process image file. Please try again.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const setPrimaryImage = (index: number) => {
    const updated = validImages.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    onChangeImages(updated);
  };

  const removeImage = (index: number) => {
    const filtered = validImages.filter((_, i) => i !== index);
    if (filtered.length > 0 && !filtered.some((img) => img.is_primary)) {
      filtered[0].is_primary = true;
    }
    onChangeImages(filtered);
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === validImages.length - 1)) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const clone = [...validImages];
    const temp = clone[index];
    clone[index] = clone[targetIdx];
    clone[targetIdx] = temp;
    onChangeImages(clone.map((img, i) => ({ ...img, sort_order: i })));
  };

  const saveAltText = (index: number) => {
    const clone = [...validImages];
    clone[index].alt_text = altTextInput;
    onChangeImages(clone);
    setEditingAltIdx(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone & External URL Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local File Uploader */}
        <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/30 rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center cursor-pointer relative group">
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 disabled:cursor-not-allowed"
          />
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-amber-600" /> : <UploadCloud className="w-6 h-6 text-amber-600" />}
          </div>
          <span className="font-bold text-slate-900 text-sm">
            {isUploading ? "Reading User Image Files..." : "Upload Image Files"}
          </span>
          <span className="text-xs text-slate-500 mt-1">Supports JPG, JPEG, PNG, WEBP (Max 5MB each)</span>
          {uploadError && <p className="text-xs text-rose-600 font-semibold mt-2">{uploadError}</p>}
        </div>

        {/* External Image URL Form */}
        <form onSubmit={handleAddExternalUrl} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <LinkIcon className="w-4 h-4 text-slate-500" />
            <span>Add External Image URL</span>
          </div>

          <input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="Enter direct image URL..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
          />

          {urlError && <p className="text-[11px] text-rose-600 font-medium">{urlError}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-2xs"
            >
              Add Image URL
            </button>
          </div>
        </form>
      </div>

      {/* Image Gallery & Controls */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-xs flex items-center justify-between">
          <span>Product Media Gallery ({validImages.length})</span>
          <span className="text-slate-400 font-normal">First image or starred image is Main Product Image</span>
        </h3>

        {validImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {validImages.map((img, idx) => (
              <div
                key={idx}
                className={`p-3 bg-white rounded-2xl border transition-all relative flex flex-col justify-between space-y-3 ${
                  img.is_primary ? "border-amber-400 ring-2 ring-amber-400/20 shadow-md" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Thumbnail Header & Badge */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                  <img src={img.url} alt={img.alt_text || "Product image"} className="w-full h-full object-cover" />

                  {img.is_primary && (
                    <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950 shadow-md flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current text-slate-950" />
                      Main Image
                    </span>
                  )}
                </div>

                {/* Alt Text Information */}
                <div className="text-xs text-slate-600 space-y-1">
                  {editingAltIdx === idx ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={altTextInput}
                        onChange={(e) => setAltTextInput(e.target.value)}
                        placeholder="Alt text..."
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                      />
                      <button onClick={() => saveAltText(idx)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="truncate max-w-[150px] font-medium text-slate-700">Alt: {img.alt_text || "None"}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAltIdx(idx);
                          setAltTextInput(img.alt_text || "");
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveImage(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(idx, "down")}
                      disabled={idx === validImages.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(idx)}
                        className="px-2 py-1 rounded text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100"
                      >
                        Set Main
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs space-y-1">
            <ImageIcon className="w-8 h-8 text-slate-300 m-auto" />
            <p>No product images uploaded yet.</p>
            <p className="text-[11px]">Upload image files above or enter image URLs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
