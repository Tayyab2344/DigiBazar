"use client";

import React, { useState, useRef } from "react";
import { Upload, X, RefreshCw, AlertCircle } from "lucide-react";

interface LogoUploaderProps {
  onLogoChange?: (file: File | null, previewUrl: string | null) => void;
  error?: string;
  maxSizeMB?: number;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  onLogoChange,
  error: externalError,
  maxSizeMB = 5,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (selectedFile: File) => {
    setLocalError(null);

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(selectedFile.type)) {
      setLocalError("Invalid file type. Please upload JPG, PNG, or WebP.");
      return;
    }

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`File size exceeds ${maxSizeMB}MB limit.`);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setPreviewUrl(objectUrl);
    if (onLogoChange) {
      onLogoChange(selectedFile, objectUrl);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    setFile(null);
    setPreviewUrl(null);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onLogoChange) {
      onLogoChange(null, null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const currentError = externalError || localError;

  return (
    <div className="w-full space-y-2">
      <label className="block text-xs font-medium text-slate-700">
        Company / Business Logo
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!previewUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-4 sm:p-5 flex flex-col items-center justify-center text-center transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50/50"
              : currentError
              ? "border-red-300 bg-red-50/30"
              : "border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs mb-2">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-xs font-semibold text-slate-800">
            Click to upload <span className="font-normal text-slate-500">or drag & drop logo</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            JPG, PNG, or WebP (max {maxSizeMB}MB)
          </p>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center gap-3.5 shadow-2xs">
          {/* Square Thumbnail Preview */}
          <div className="relative w-14 h-14 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Business Logo Preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {file?.name || "company-logo.png"}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {file ? formatFileSize(file.size) : "Ready"}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {currentError && (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {currentError}
        </p>
      )}
    </div>
  );
};
