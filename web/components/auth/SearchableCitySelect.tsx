"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

const PAKISTAN_CITIES = [
  "Karachi",
  "Lahore",
  "Faisalabad",
  "Rawalpindi",
  "Gujranwala",
  "Peshawar",
  "Multan",
  "Hyderabad",
  "Islamabad",
  "Quetta",
  "Bahawalpur",
  "Sargodha",
  "Sialkot",
  "Sukkur",
  "Larkana",
  "Sheikhupura",
  "Rahim Yar Khan",
  "Jhang",
  "Dera Ghazi Khan",
  "Gujrat",
  "Sahiwal",
  "Wah Cantt",
  "Mardan",
  "Kasur",
  "Okara",
  "Mingora",
  "Nawabshah",
  "Chiniot",
  "Kotri",
  "Kameshke",
  "Muzaffargarh",
  "Sadiqabad",
  "Mirpur Khas",
  "Burewala",
  "Kohat",
  "Khanewal",
  "Dera Ismail Khan",
  "Abbottabad",
  "Muzaffarabad",
  "Mirpur",
  "Gilgit",
  "Skardu",
  "Turbat",
];

interface SearchableCitySelectProps {
  label: string;
  value: string;
  onChange: (city: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export function SearchableCitySelect({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder = "Select your city",
}: SearchableCitySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCities = PAKISTAN_CITIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (city: string) => {
    onChange(city);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <label className="block text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[48px] px-3.5 flex items-center justify-between text-left rounded-lg border bg-white text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 ${
          error ? "border-red-500" : "border-slate-300"
        }`}
      >
        <span className={value ? "text-slate-900 font-medium" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search city..."
              className="w-full text-xs bg-transparent text-slate-900 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48 py-1">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleSelect(city)}
                  className="w-full px-3 py-2 text-xs text-left hover:bg-blue-50 text-slate-700 flex items-center justify-between transition-colors"
                >
                  <span>{city}</span>
                  {value === city && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              ))
            ) : (
              <div className="p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">No matching city found</p>
                {search && (
                  <button
                    type="button"
                    onClick={() => handleSelect(search)}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Use &quot;{search}&quot;
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600 font-medium mt-1">{error}</p>}
    </div>
  );
}
