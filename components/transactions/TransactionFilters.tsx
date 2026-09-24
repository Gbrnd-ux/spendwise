// components/transactions/TransactionFilters.tsx
"use client";

import { Search, X, Calendar, Tag, Wallet } from "lucide-react";
import { Account, Category } from "@/lib/types";

export interface FilterState {
    month: string;         // "2026-09" atau "" untuk semua
    categoryId: string;    // "" untuk semua
    accountId: string;     // "" untuk semua
    search: string;
}

interface Props {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    categories: Category[];
    accounts: Account[];
    currencySymbol?: string;
}

export default function TransactionFilters({
    filters,
    onFilterChange,
    categories,
    accounts,
    currencySymbol = "Rp",
}: Props) {
    const hasActiveFilters =
        filters.month || filters.categoryId || filters.accountId || filters.search;

    const clearFilters = () => {
        onFilterChange({ month: "", categoryId: "", accountId: "", search: "" });
    };

    return (
        <div className="p-4 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10 space-y-3">
            {/* Row 1: Search + Clear */}
            <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 focus-within:border-[#8B5CF6] focus-within:ring-1 focus-within:ring-[#8B5CF6] transition-all">
                    <Search size={16} className="text-[#94A3B8] flex-shrink-0" />
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                        placeholder="Cari transaksi..."
                        className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 flex-1 w-full"
                    />
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
                    >
                        <X size={14} />
                        Clear
                    </button>
                )}
            </div>

            {/* Row 2: Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Month */}
                <div className="relative">
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none z-10" />
                    <input
                        type="month"
                        value={filters.month}
                        onChange={(e) => onFilterChange({ ...filters, month: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white text-sm focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
                    />
                </div>

                {/* Category */}
                <div className="relative">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none z-10" />
                    <select
                        value={filters.categoryId}
                        onChange={(e) => onFilterChange({ ...filters, categoryId: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white text-sm focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Semua Kategori</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.icon} {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Account */}
                <div className="relative">
                    <Wallet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none z-10" />
                    <select
                        value={filters.accountId}
                        onChange={(e) => onFilterChange({ ...filters, accountId: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-white text-sm focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Semua Akun</option>
                        {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}