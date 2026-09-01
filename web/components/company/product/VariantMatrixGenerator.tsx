"use client";

import React, { useState } from "react";
import { Plus, Sparkles, Trash2, Layers, Check } from "lucide-react";
import type { ProductVariantItem, ProductAttributeItem } from "@/types/product";

interface Props {
  parentSku: string;
  parentPriceCents: number;
  attributes: ProductAttributeItem[];
  variants: ProductVariantItem[];
  onChangeAttributes: (attrs: ProductAttributeItem[]) => void;
  onChangeVariants: (vars: ProductVariantItem[]) => void;
}

export function VariantMatrixGenerator({
  parentSku,
  parentPriceCents,
  attributes,
  variants,
  onChangeAttributes,
  onChangeVariants,
}: Props) {
  const [attrName, setAttrName] = useState("");
  const [attrValue, setAttrValue] = useState("");

  const handleAddAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrName.trim() || !attrValue.trim()) return;

    const newAttr: ProductAttributeItem = {
      name: attrName.trim(),
      value: attrValue.trim(),
      is_variation: true,
    };

    onChangeAttributes([...attributes, newAttr]);
    setAttrName("");
    setAttrValue("");
  };

  const handleRemoveAttribute = (index: number) => {
    onChangeAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleGenerateCartesianVariants = () => {
    const variationAttrs = attributes.filter((a) => a.is_variation);
    if (variationAttrs.length === 0) return;

    // Build array of arrays: [ [Color: Black, Color: White], [Size: S, Size: M] ]
    const optionArrays = variationAttrs.map((attr) => {
      const vals = attr.value.split(",").map((v) => v.trim()).filter(Boolean);
      return vals.map((val) => ({ [attr.name]: val }));
    });

    // Cartesian product helper
    const cartesian = (acc: Record<string, string>[], curr: Record<string, string>[]) =>
      acc.flatMap((a) => curr.map((c) => ({ ...a, ...c })));

    const combinations: Record<string, string>[] = optionArrays.reduce(
      (acc, curr) => (acc.length === 0 ? curr : cartesian(acc, curr)),
      []
    );

    const generatedVariants: ProductVariantItem[] = combinations.map((comb, idx) => {
      const codeSuffix = Object.values(comb)
        .map((v) => v.toUpperCase().replace(/\s+/g, ""))
        .join("-");

      return {
        sku: parentSku ? `${parentSku}-${codeSuffix}` : `DB-VAR-${codeSuffix}`,
        price: parentPriceCents || 0,
        stock: 10,
        low_stock_threshold: 5,
        attributes: comb,
        is_active: true,
      };
    });

    onChangeVariants(generatedVariants);
  };

  const handleVariantChange = (index: number, field: keyof ProductVariantItem, val: any) => {
    const clone = [...variants];
    clone[index] = { ...clone[index], [field]: val };
    onChangeVariants(clone);
  };

  const handleRemoveVariant = (index: number) => {
    onChangeVariants(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Attribute Builder Header */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Configurable Variant Attributes</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Add attributes like Color (Black, White, Red) or Size (S, M, L) comma-separated to generate variant matrix.
            </p>
          </div>

          {attributes.length > 0 && (
            <button
              type="button"
              onClick={handleGenerateCartesianVariants}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-2xs transition-colors shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Variants Combination ({attributes.length})</span>
            </button>
          )}
        </div>

        {/* Add Attribute Input Row */}
        <form onSubmit={handleAddAttribute} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={attrName}
            onChange={(e) => setAttrName(e.target.value)}
            placeholder="Attribute Name (e.g. Color)"
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
          />
          <input
            type="text"
            value={attrValue}
            onChange={(e) => setAttrValue(e.target.value)}
            placeholder="Comma-separated values (e.g. Black, White, Red)"
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Attribute</span>
          </button>
        </form>

        {/* Attribute Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {attributes.map((attr, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 shadow-2xs"
            >
              <span className="font-bold text-indigo-600">{attr.name}:</span>
              <span>{attr.value}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttribute(idx)}
                className="text-slate-400 hover:text-rose-600 ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Generated Variants Combination Table */}
      {variants.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-xs">Generated Product Variants ({variants.length})</h4>
            <span className="text-[11px] text-slate-500 font-medium">Customize individual variant SKU, price, and stock</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Combination</th>
                  <th className="py-3 px-4">Variant SKU</th>
                  <th className="py-3 px-4">Price (PKR)</th>
                  <th className="py-3 px-4">Sale Price (PKR)</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {variants.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {Object.entries(v.attributes)
                        .map(([k, val]) => `${k}: ${val}`)
                        .join(" / ")}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => handleVariantChange(idx, "sku", e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step="0.01"
                        value={(v.price / 100).toString()}
                        onChange={(e) => handleVariantChange(idx, "price", Math.round(parseFloat(e.target.value || "0") * 100))}
                        className="w-24 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step="0.01"
                        value={v.sale_price ? (v.sale_price / 100).toString() : ""}
                        onChange={(e) =>
                          handleVariantChange(
                            idx,
                            "sale_price",
                            e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined
                          )
                        }
                        placeholder="Optional"
                        className="w-24 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={v.stock.toString()}
                        onChange={(e) => handleVariantChange(idx, "stock", parseInt(e.target.value || "0", 10))}
                        className="w-20 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
