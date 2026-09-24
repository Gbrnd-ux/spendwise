// components/budgets/DeleteBudgetModal.tsx
"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { deleteBudget, BudgetWithProgress } from "@/lib/firebase/firestore";
import Modal from "@/components/ui/Modal";

interface Props {
    budget: BudgetWithProgress | null;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function DeleteBudgetModal({ budget, onClose, onSuccess }: Props) {
    const { user } = useAuth();
    const { bumpDataVersion } = useModal();
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (!user || !budget) return;

        setIsLoading(true);
        try {
            await deleteBudget(user.uid, budget.id);
            toast.success("Budget berhasil dihapus", {
                description: `${budget.categoryIcon} ${budget.categoryName}`,
            });
            bumpDataVersion();
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error("[SpendWise] Delete budget error:", err);
            toast.error("Gagal menghapus budget", {
                description: err.message || "Silakan coba lagi.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!budget) return null;

    return (
        <Modal isOpen={true} onClose={onClose} maxWidth="md">
            <div className="p-6">
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
                    Hapus Budget?
                </h2>
                <p className="text-sm text-[#94A3B8] text-center mb-5">
                    Tindakan ini tidak dapat dibatalkan.
                </p>

                <div className="p-4 rounded-xl bg-[#0B1120]/60 border border-white/5 mb-5">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                            style={{ backgroundColor: `${budget.categoryColor}20` }}
                        >
                            {budget.categoryIcon}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-white">
                                {budget.categoryName}
                            </p>
                            <p className="text-xs text-[#94A3B8]">
                                Budget: {budget.amount.toLocaleString("id-ID")}
                            </p>
                        </div>
                    </div>
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
        </Modal>
    );
}