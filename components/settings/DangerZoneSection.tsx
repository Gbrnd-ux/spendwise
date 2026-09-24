// components/settings/DangerZoneSection.tsx
"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2, X, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteUser, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { deleteAllUserData } from "@/lib/firebase/firestore";
import Modal from "@/components/ui/Modal";

export default function DangerZoneSection() {
    const { user } = useAuth();
    const router = useRouter();

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut(auth);
            toast.success("Berhasil logout");
            router.push("/login");
        } catch (err) {
            toast.error("Gagal logout");
            setIsLoggingOut(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        if (confirmText !== "DELETE") return;

        setIsDeleting(true);
        try {
            // 1. Hapus semua data dari Firestore
            await deleteAllUserData(user.uid);

            // 2. Hapus user dari Firebase Auth
            await deleteUser(user);

            toast.success("Akun berhasil dihapus", {
                description: "Semua data Anda telah dihapus permanen.",
            });

            router.push("/login");
        } catch (err: any) {
            console.error("[SpendWise] Delete account error:", err);
            if (err.code === "auth/requires-recent-login") {
                toast.error("Sesi sudah lama", {
                    description: "Silakan logout dan login ulang sebelum menghapus akun.",
                    duration: 6000,
                });
            } else {
                toast.error("Gagal menghapus akun", {
                    description: err.message || "Silakan coba lagi.",
                });
            }
            setIsDeleting(false);
        }
    };

    return (
        <>
            <div className="space-y-4">
                {/* Logout */}
                <div className="p-5 rounded-xl bg-[#1E293B]/40 border border-white/10 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-white mb-0.5">Logout</p>
                        <p className="text-xs text-[#94A3B8]">
                            Keluar dari akun saat ini
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                        {isLoggingOut ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <LogOut size={14} />
                        )}
                        Logout
                    </button>
                </div>

                {/* Delete Account */}
                <div className="p-5 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={18} className="text-rose-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-white mb-1">
                                Hapus Akun Permanen
                            </p>
                            <p className="text-xs text-[#94A3B8] leading-relaxed">
                                Semua transaksi, akun, kategori, dan budget Anda akan dihapus selamanya. Tindakan ini tidak bisa dibatalkan.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold text-sm hover:bg-rose-500/20 transition-all"
                    >
                        <Trash2 size={14} />
                        Delete Account
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => !isDeleting && setShowDeleteModal(false)}
                maxWidth="md"
                closeOnBackdrop={!isDeleting}
                closeOnEsc={!isDeleting}
            >
                <div className="p-6">
                    <button
                        onClick={() => !isDeleting && setShowDeleteModal(false)}
                        disabled={isDeleting}
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
                        Hapus Akun?
                    </h2>
                    <p className="text-sm text-[#94A3B8] text-center mb-5">
                        Semua data akan dihapus <strong className="text-rose-400">permanen</strong>. Tidak bisa dikembalikan.
                    </p>

                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-5">
                        <p className="text-xs text-rose-300 mb-3">
                            Yang akan dihapus:
                        </p>
                        <ul className="text-xs text-rose-300/80 space-y-1 ml-4 list-disc">
                            <li>Semua transaksi Anda</li>
                            <li>Semua akun dan dompet</li>
                            <li>Semua kategori custom</li>
                            <li>Semua budget yang sudah di-set</li>
                        </ul>
                    </div>

                    {/* Confirmation Input */}
                    <div className="mb-5">
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-2 uppercase tracking-wider">
                            Ketik <span className="text-rose-400 font-bold">DELETE</span> untuk konfirmasi
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            disabled={isDeleting}
                            placeholder="DELETE"
                            className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-white/10 text-white text-center font-bold tracking-widest placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all disabled:opacity-50"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            disabled={isDeleting}
                            className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting || confirmText !== "DELETE"}
                            className={`flex-1 py-3.5 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                isDeleting || confirmText !== "DELETE"
                                    ? "bg-rose-600/30 cursor-not-allowed"
                                    : "bg-gradient-to-r from-rose-500 to-rose-600 hover:shadow-[0_0_25px_rgba(244,63,94,0.6)] hover:scale-[1.02] active:scale-[0.98]"
                            }`}
                        >
                            {isDeleting ? (
                                <><Loader2 size={16} className="animate-spin" /> Menghapus...</>
                            ) : (
                                <><Trash2 size={16} /> Delete Forever</>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}