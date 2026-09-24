// components/categories/CategoryCard.tsx
"use client";

import { Edit3, Trash2 } from "lucide-react";
import { Category } from "@/lib/types";

interface Props {
    category: Category;
    onEdit: (cat: Category) => void;
    onDelete: (cat: Category) => void;
}

export default function CategoryCard({ category, onEdit, onDelete }: Props) {
    return (
        <div className="group relative p-4 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg"
                    style={{ backgroundColor: `${category.color}20` }}
                >
                    {category.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                        {category.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: category.color }}
                        />
                        <p className="text-xs text-[#94A3B8] truncate">
                            {category.type === "income" ? "Pemasukan" : "Pengeluaran"}
                        </p>
                        {category.isDefault && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#94A3B8] font-semibold">
                                Default
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions — show on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(category)}
                        className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all"
                        title="Edit"
                    >
                        <Edit3 size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(category)}
                        className="p-2 rounded-lg text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Hapus"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}