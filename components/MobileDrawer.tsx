// components/MobileDrawer.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
    LayoutDashboard, Receipt, Wallet, Target, Tags, BarChart3,
    Settings, LogOut, X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { toast } from "sonner";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: Receipt },
    { href: "/accounts", label: "Accounts", icon: Wallet },
    { href: "/budgets", label: "Budgets", icon: Target },
    { href: "/categories", label: "Categories", icon: Tags },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
];

export default function MobileDrawer({ isOpen, onClose }: Props) {
    const pathname = usePathname();
    const router = useRouter();
    const { userProfile } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Kunci body scroll saat drawer buka
    useEffect(() => {
        if (!isOpen) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = original;
        };
    }, [isOpen]);

    // Tutup saat ESC
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success("Berhasil logout");
            router.push("/login");
        } catch {
            toast.error("Gagal logout");
        }
    };

    if (!mounted || !isOpen) return null;

    const content = (
        <div className="fixed inset-0 z-[100] lg:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="relative h-full w-72 max-w-[80vw] bg-[#0B1120] border-r border-white/10 flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                            <Wallet size={18} className="text-white" />
                        </div>
                        <span className="text-lg font-bold text-white tracking-wide">
                            SpendWise
                        </span>
                    </Link>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                                    isActive
                                        ? "bg-gradient-to-r from-[#6366F1]/20 to-[#8B5CF6]/20 text-white"
                                        : "text-[#94A3B8] hover:text-white hover:bg-white/5"
                                }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#6366F1] to-[#8B5CF6] rounded-r-full" />
                                )}
                                <Icon size={20} className={isActive ? "text-[#A78BFA]" : ""} />
                                <span className="text-sm font-semibold">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-3 border-t border-white/5">
                    {userProfile && (
                        <div className="flex items-center gap-3 p-3 mb-2 rounded-xl bg-white/5">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-sm font-bold">
                                    {userProfile.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                    {userProfile.name}
                                </p>
                                <p className="text-xs text-[#94A3B8] truncate">
                                    {userProfile.email}
                                </p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                    >
                        <LogOut size={18} />
                        <span className="text-sm font-semibold">Logout</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}