// components/categories/DeleteCategoryModal.tsx
"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { deleteCategory, checkCategoryUsage } from "@/lib/firebase/firestore";
import { Category } from "@/lib/types";

interface Props {
    category: Category | null;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function DeleteCategoryModal({ category, onClose, onSuccess }: Props) {
    const { user } = useAuth();
    const { bumpDataVersion } = useModal();
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (!user || !category) return;

        setIsLoading(true);
        try {
            // Cek usage dulu untuk pesan error yang lebih informatif
            const usage = await checkCategoryUsage(user.uid, category.id);
            if (usage > 0) {
                toast.error("Tidak bisa hapus kategori", {
                    description: `Kategori ini masih digunakan di ${usage} transaksi.`,
                    duration: 5000,
                });
                setIsLoading(false);
                return;
            }

            await deleteCategory(user.uid, category.id);
            toast.success("Kategori berhasil dihapus", {
                description: `${category.icon} ${category.name}`,
            });
            bumpDataVersion();
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error("[SpendWise] Delete category error:", err);
            toast.error("Gagal menghapus kategori", {
                description: err.message || "Silakan coba lagi.",
                duration: 5000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!category) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-md p-6 rounded-3xl bg-[#1E293B]/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-fade-in-up">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-4 right-4 p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all"
                >
                    <X size={18} />
                </button>

                <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                        <AlertTriangle size={26} className="text-rose-400" />
                    </div>
                </div>

                <h2 className="text-xl font-bold text-white text-center mb-2">
                    Hapus Kategori?
                </h2>
                <p className="text-sm text-[#94A3B8] text-center mb-5">
                    Tindakan ini tidak dapat dibatalkan.
                </p>

                <div className="p-4 rounded-xl bg-[#0B1120]/60 border border-white/5 mb-5">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                            style={{ backgroundColor: `${category.color}20` }}
                        >
                            {category.icon}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">{category.name}</p>
                            <p className="text-xs text-[#94A3B8] capitalize">
                                {category.type === "income" ? "Pemasukan" : "Pengeluaran"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-5">
                    <p className="text-xs text-amber-300">
                        ⚠️ Kategori hanya bisa dihapus jika <span className="font-semibold">tidak dipakai di transaksi apapun</span>.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isLoading}
                        className={`flex-1 py-3.5 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                            isLoading
                                ? "bg-rose-600/50 cursor-not-allowed"
                                : "bg-gradient-to-r from-rose-500 to-rose-600 hover:shadow-[0_0_25px_rgba(244,63,94,0.6)] hover:scale-[1.02] active:scale-[0.98]"
                        }`}
                    >
                        {isLoading ? (
                            <><Loader2 size={16} className="animate-spin" /> Menghapus...</>
                        ) : (
                            <><Trash2 size={16} /> Delete</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}