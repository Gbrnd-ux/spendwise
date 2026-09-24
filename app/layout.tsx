// app/(dashboard)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ModalProvider } from "@/context/ModalContext";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import MobileDrawer from "@/components/MobileDrawer";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, userProfile, loading } = useAuth();
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Redirect jika belum login
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Redirect ke onboarding jika belum onboarded
    useEffect(() => {
        if (!loading && userProfile && !userProfile.onboarded) {
            router.push("/onboarding");
        }
    }, [userProfile, loading, router]);

    // Loading state
    if (loading || (user && !userProfile)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-[#8B5CF6] mx-auto mb-4" />
                    <p className="text-[#94A3B8] text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // Belum login
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B1120]">
                <Loader2 size={32} className="animate-spin text-[#8B5CF6]" />
            </div>
        );
    }

    return (
        <ModalProvider>
            <div className="min-h-screen bg-[#0B1120] flex">
                {/* Desktop Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <Header onOpenDrawer={() => setDrawerOpen(true)} />

                    {/* Page Content */}
                    <main className="flex-1 px-4 lg:px-8 py-6 pb-40 lg:pb-40">
                        {children}
                    </main>
                </div>

                {/* Mobile Bottom Nav */}
                <MobileNav />

                {/* Mobile Drawer */}
                <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
            </div>

            {/* Global Modal — bisa dibuka dari FAB atau MobileNav */}
            <AddTransactionModal />
        </ModalProvider>
    );
}