// src/app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"]
});

export const metadata: Metadata = {
    title: "SpendWise",
    description: "Premium Personal Finance App",
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body className={`${jakarta.className} bg-[#0B1120] text-white antialiased`}>
                {children}
            </body>
        </html>
    );
}