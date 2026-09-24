// components/ui/Modal.tsx
"use client";

import { useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    maxWidth?: "sm" | "md" | "lg" | "xl";
    closeOnBackdrop?: boolean;
    closeOnEsc?: boolean;
    hideCloseButton?: boolean;
}

const MAX_WIDTHS = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
};

export default function Modal({
    isOpen,
    onClose,
    children,
    maxWidth = "md",
    closeOnBackdrop = true,
    closeOnEsc = true,
}: ModalProps) {
    const [mounted, setMounted] = useState(false);

    // Hanya render di client (untuk SSR safety)
    useEffect(() => {
        setMounted(true);
    }, []);

    // Kunci scroll body saat modal terbuka
    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    // Tutup saat tekan ESC
    useEffect(() => {
        if (!isOpen || !closeOnEsc) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, closeOnEsc, onClose]);

    if (!mounted || !isOpen) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-[100] overflow-y-auto"
            style={{ WebkitOverflowScrolling: "touch" }}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
                onClick={closeOnBackdrop ? onClose : undefined}
            />

            {/* Centering wrapper */}
            <div className="flex min-h-screen items-center justify-center p-4 py-10">
                <div
                    className={`relative w-full ${MAX_WIDTHS[maxWidth]} rounded-3xl bg-[#1E293B]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-fade-in-up`}
                >
                    {children}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}