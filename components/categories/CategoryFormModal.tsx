// components/categories/CategoryFormModal.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Check, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";
import { addCategory, updateCategory } from "@/lib/firebase/firestore";
import { Category, TransactionType } from "@/lib/types";

interface Props {
    category: Category | null;
    defaultType?: TransactionType;
    onClose: () => void;
    onSuccess?: () => void;
}

const ICON_OPTIONS = [
    "🍔", "🍕", "☕", "🍜", "🍰", "🛒", "🛍️", "👕", "👟", "💊",
    "🏥", "🚗", "🚕", "🚌", "⛽", "✈️", "🏠", "💡", "📱", "💻",
    "📚", "🎬", "🎮", "🎵", "🎁", "💼", "💰", "💵", "💳", "📈",
    "📄", "🏋️", "⚽", "🐕", "🐱", "💄", "🎓", "🛠️", "🎨", "📌",
];

const COLOR_OPTIONS = [
    "#F59E0B", "#EF4444", "#EC4899", "#8B5CF6", "#6366F1",
    "#0EA5E9", "#10B981", "#84CC16", "#F97316", "#64748B",
];

export default function CategoryFormModal({
    category,
    defaultType = "expense",
    onClose,
    onSuccess,
}: Props) {
    const { user } = useAuth();
    const { bumpDataVersion } = useModal();

    const isEdit = !!category;

    const [mounted, setMounted] = useState(false);
    const [name, setName] = useState("");
    const [type, setType] = useState<TransactionType>(defaultType);
    const [icon, setIcon] = useState("📌");
    const [color, setColor] = useState(COLOR_OPTIONS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Untuk React Portal — hanya render di client
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (category) {
            setName(category.name);
            setType(category.type);
            setIcon(category.icon);
            setColor(category.color);
        } else {
            setName("");
            setType(defaultType);
            setIcon("📌");
            setColor(COLOR_OPTIONS[0]);
        }
        setErrorMessage("");
    }, [category, defaultType]);

    // Kunci scroll body saat modal terbuka
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    // Tutup modal saat tekan ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isLoading) onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!name.trim()) {
            setErrorMessage("Nama kategori wajib diisi.");
            return;
        }

        setIsLoading(true);
        setErrorMessage("");

        try {
            if (isEdit && category) {
                await updateCategory(user.uid, category.id, {
                    name: name.trim(),
                    type,
                    icon,
                    color,
                });
                toast.success("Kategori berhasil diupdate!", {
                    description: `${icon} ${name}`,
                });
            } else {
                await addCategory(user.uid, {
                    name: name.trim(),
                    type,
                    icon,
                    color,
                });
                toast.success("Kategori berhasil dibuat! 🎉", {
                    description: `${icon} ${name}`,
                });
            }

            bumpDataVersion();
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error("[SpendWise] Category save error:", err);
            setErrorMessage(err.message || "Gagal menyimpan kategori. Silakan coba lagi.");
            toast.error("Gagal menyimpan kategori");
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-[100] overflow-y-auto"
            style={{ WebkitOverflowScrolling: "touch" }}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-md"
                onClick={() => !isLoading && onClose()}
            />

            {/* Centering wrapper */}
            <div className="flex min-h-screen items-center justify-center p-4 py-10">
                <div className="relative w-full max-w-md rounded-3xl bg-[#1E293B]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-fade-in-up">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {isEdit ? "Edit Category" : "Add Category"}
                            </h2>
                            <p className="text-xs text-[#94A3B8]">
                                {isEdit ? "Ubah detail kategori" : "Buat kategori custom baru"}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="flex justify-center">
                            <div
                                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg transition-all duration-300"
                                style={{
                                    backgroundColor: `${color}20`,
                                    border: `2px solid ${color}40`,
                                }}
                            >
                                {icon}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#0B1120]/60 border border-white/5">
                            <button
                                type="button"
                                onClick={() => setType("expense")}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-semibold text-sm ${
                                    type === "expense"
                                        ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                                        : "text-[#94A3B8] hover:text-white"
                                }`}
                            >
                                <TrendingDown size={16} /> Expense
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("income")}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 font-semibold text-sm ${
                                    type === "income"
                                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                        : "text-[#94A3B8] hover:text-white"
                                }`}
                            >
                                <TrendingUp size={16} /> Income
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                                Nama Kategori
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Contoh: Makanan, Zakat, Langganan"
                                maxLength={30}
                                className="w-full px-4 py-3.5 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-all"
                            />
                            <p className="text-[10px] text-[#94A3B8] mt-1.5 text-right">
                                {name.length}/30
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">
                                Pilih Ikon
                            </label>
                            <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto p-1">
                                {ICON_OPTIONS.map((ic) => (
                                    <button
                                        key={ic}
                                        type="button"
                                        onClick={() => setIcon(ic)}
                                        className={`aspect-square rounded-lg flex items-center justify-center text-xl transition-all duration-200 ${
                                            icon === ic
                                                ? "bg-[#8B5CF6]/20 border-2 border-[#8B5CF6] scale-110"
                                                : "bg-slate-900/60 border border-white/5 hover:border-white/20 hover:scale-105"
                                        }`}
                                    >
                                        {ic}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#94A3B8] mb-3 uppercase tracking-wider">
                                Pilih Warna
                            </label>
                            <div className="grid grid-cols-10 gap-2">
                                {COLOR_OPTIONS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={`relative aspect-square rounded-xl transition-all duration-300 ${
                                            color === c
                                                ? "ring-2 ring-white ring-offset-2 ring-offset-[#1E293B] scale-110"
                                                : "hover:scale-110"
                                        }`}
                                        style={{ backgroundColor: c }}
                                    >
                                        {color === c && (
                                            <Check
                                                size={14}
                                                className="absolute inset-0 m-auto text-white"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-2.5">
                                {errorMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                                isLoading
                                    ? "opacity-80 cursor-not-allowed animate-glow-pulse"
                                    : "hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    {isEdit ? "Save Changes" : "Create Category"}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );

    // Render ke document.body via Portal
    return createPortal(modalContent, document.body);
}