// components/accounts/AccountCard.tsx
"use client";

import { Wallet, Banknote, Landmark, Smartphone, Edit3, Trash2, MoreVertical } from "lucide-react";
import { useState } from "react";
import { Account } from "@/lib/types";

interface Props {
    account: Account;
    currencySymbol: string;
    onEdit: (account: Account) => void;
    onDelete: (account: Account) => void;
}

const TYPE_ICONS = {
    cash: Banknote,
    bank: Landmark,
    ewallet: Smartphone,
};

const TYPE_LABELS = {
    cash: "Cash",
    bank: "Bank",
    ewallet: "E-Wallet",
};

export default function AccountCard({ account, currencySymbol, onEdit, onDelete }: Props) {
    const [showMenu, setShowMenu] = useState(false);
    const TypeIcon = TYPE_ICONS[account.type] || Wallet;

    return (
        <div className="group relative p-5 rounded-2xl bg-gradient-to-br from-[#1E293B]/60 to-[#0B1120]/60 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden">
            {/* Gradient background */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${account.color} opacity-20 blur-3xl group-hover:opacity-30 transition-opacity`} />

            {/* Header */}
            <div className="relative flex items-start justify-between mb-6">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${account.color} flex items-center justify-center shadow-lg`}>
                    <TypeIcon size={20} className="text-white" />
                </div>

                {/* Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all"
                    >
                        <MoreVertical size={16} />
                    </button>

                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenu(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 z-20 w-36 p-1 rounded-xl bg-[#1E293B] border border-white/10 shadow-xl animate-fade-in-up">
                                <button
                                    onClick={() => {
                                        onEdit(account);
                                        setShowMenu(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10 transition-all"
                                >
                                    <Edit3 size={14} /> Edit
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(account);
                                        setShowMenu(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-500/10 transition-all"
                                >
                                    <Trash2 size={14} /> Hapus
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="relative">
                <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">
                    {TYPE_LABELS[account.type] || "Account"}
                </p>
                <h3 className="text-lg font-bold text-white mb-4 truncate">
                    {account.name}
                </h3>

                <p className="text-xs text-[#94A3B8] mb-1">Saldo</p>
                <p className="text-2xl font-extrabold text-white">
                    {currencySymbol} {account.balance.toLocaleString("id-ID")}
                </p>
            </div>
        </div>
    );
}