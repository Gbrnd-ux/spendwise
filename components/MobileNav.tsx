// components/MobileNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Receipt,
    Plus,
    BarChart3,
    Settings
} from "lucide-react";
import { useModal } from "@/context/ModalContext";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/transactions", label: "Trans.", icon: Receipt },
    { href: "#add", label: "Add", icon: Plus, isCenter: true },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
];

export default function MobileNav() {
    const pathname = usePathname();
    const { openAddTransaction } = useModal();

    return (
        <nav className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
            <div className="relative flex items-center justify-around p-2 rounded-2xl bg-[#1E293B]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    if (item.isCenter) {
                        return (
                            <div key={item.label} className="relative w-14 h-14 flex-shrink-0">
                                {/* Tombol mengambang */}
                                <button
                                    onClick={openAddTransaction}
                                    aria-label="Add Transaction"
                                    className="absolute left-1/2 -translate-x-1/2 -top-8 z-20 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.6)] hover:scale-110 active:scale-95 transition-all duration-200"
                                >
                                    <Icon size={24} className="text-white" strokeWidth={2.5} />
                                </button>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                                isActive
                                    ? "text-[#A78BFA]"
                                    : "text-[#94A3B8] hover:text-white"
                            }`}
                        >
                            <Icon size={20} />
                            <span className="text-[10px] font-semibold whitespace-nowrap">
                                {item.label}
                            </span>
                            {isActive && (
                                <div className="absolute bottom-0 w-6 h-0.5 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}