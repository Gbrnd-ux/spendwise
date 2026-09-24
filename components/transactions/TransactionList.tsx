// components/transactions/TransactionList.tsx
"use client";

import { ArrowUpRight, ArrowDownRight, Edit3, Trash2, Receipt } from "lucide-react";
import { Transaction } from "@/lib/types";
import { toDate, formatRelativeDate } from "@/lib/utils";

interface Props {
    transactions: Transaction[];
    onEdit: (tx: Transaction) => void;
    onDelete: (tx: Transaction) => void;
}



export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
    if (transactions.length === 0) {
        return (
            <div className="p-12 rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Receipt size={28} className="text-[#94A3B8]" />
                </div>
                <p className="text-sm text-[#94A3B8] mb-2">Tidak ada transaksi</p>
                <p className="text-xs text-[#94A3B8]/70">
                    Coba ubah filter atau tambahkan transaksi baru
                </p>
            </div>
        );
    }

    // Group by date
    const grouped = new Map<string, Transaction[]>();
    transactions.forEach((tx) => {
        const date = toDate(tx.date);
        const key = date.toDateString();
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(tx);
    });

    // Sort groups descending
    const sortedGroups = Array.from(grouped.entries()).sort(
        (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );

    return (
        <div className="space-y-6">
            {sortedGroups.map(([dateKey, txs]) => {
                const date = new Date(dateKey);

                return (
                    <div key={dateKey}>
                        {/* Date Header */}
                        <div className="flex items-center gap-3 mb-3 px-1">
                            <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                                {formatRelativeDate(date)}
                            </h3>
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-xs text-[#94A3B8]">
                                {txs.length} transaksi
                            </span>
                        </div>

                        {/* Transactions */}
                        <div className="rounded-2xl bg-[#1E293B]/40 backdrop-blur-xl border border-white/10 overflow-hidden">
                            {txs.map((tx, idx) => {
                                const isIncome = tx.type === "income";
                                const txDate = toDate(tx.date);

                                return (
                                    <div
                                        key={tx.id}
                                        className={`group flex items-center justify-between p-4 hover:bg-white/5 transition-all duration-200 ${
                                            idx !== txs.length - 1 ? "border-b border-white/5" : ""
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {/* Icon */}
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                                                isIncome ? "bg-emerald-500/10" : "bg-rose-500/10"
                                            }`}>
                                                {tx.categoryIcon}
                                            </div>

                                            {/* Info */}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-white truncate">
                                                    {tx.categoryName}
                                                </p>
                                                <p className="text-xs text-[#94A3B8] truncate">
                                                    {tx.accountName}
                                                    {tx.note && ` • ${tx.note}`}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Amount & Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <p className={`text-sm font-bold ${
                                                isIncome ? "text-emerald-400" : "text-rose-400"
                                            }`}>
                                                {isIncome ? "+" : "-"}Rp {tx.amount.toLocaleString("id-ID")}
                                            </p>

                                            {/* Actions — show on hover */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                <button
                                                    onClick={() => onEdit(tx)}
                                                    className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(tx)}
                                                    className="p-2 rounded-lg text-[#94A3B8] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}