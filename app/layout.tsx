// app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
    title: "SpendWise",
    description: "Premium Personal Finance App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${jakarta.className} bg-[#0B1120] text-white antialiased`}>
                <AuthProvider>
                    {children}
                    <Toaster
                        position="top-center"
                        theme="dark"
                        richColors
                        closeButton
                        toastOptions={{
                            style: {
                                background: "rgba(30, 41, 59, 0.95)",
                                backdropFilter: "blur(20px)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                color: "white",
                                borderRadius: "14px",
                            },
                        }}
                    />
                </AuthProvider>
            </body>
        </html>
    );
}