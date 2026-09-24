// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Receipt,
    Wallet,
    Target,
    Tags,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: Receipt },
    { href: "/accounts", label: "Accounts", icon: Wallet },
    { href: "/budgets", label: "Budgets", icon: Target },
    { href: "/categories", label: "Categories", icon: Tags },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { userProfile } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

return (
    <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 border-r border-white/5 bg-[#0B1120]/80 backdrop-blur-xl transition-all duration-300 ${
            isCollapsed ? "w-20" : "w-64"
        }`}
    >
            {/* Logo */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
                <Link href="/dashboard" className="flex items-center gap-2 group">
                    <div className="w-9 h-9 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)] flex-shrink-0">
                        <Wallet size={20} className="text-white" />
                    </div>
                    {!isCollapsed && (
                        <span className="text-lg font-bold text-white tracking-wide">
                            SpendWise
                        </span>
                    )}
                </Link>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-all"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
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
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${isActive
                                    ? "bg-gradient-to-r from-[#6366F1]/20 to-[#8B5CF6]/20 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                                    : "text-[#94A3B8] hover:text-white hover:bg-white/5"
                                }`}
                        >
                            {/* Active indicator pill */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#6366F1] to-[#8B5CF6] rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
                            )}
                            <Icon
                                size={20}
                                className={`flex-shrink-0 ${isActive ? "text-[#A78BFA]" : ""
                                    }`}
                            />
                            {!isCollapsed && (
                                <span className="text-sm font-semibold">{item.label}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile & Logout */}
            <div className="p-3 border-t border-white/5">
                {!isCollapsed && userProfile && (
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 ${isCollapsed ? "justify-center" : ""
                        }`}
                >
                    <LogOut size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span className="text-sm font-semibold">Logout</span>}
                </button>
            </div>
        </aside>
    );
}