// context/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { createUserDocument, getUserDocument } from "@/lib/firebase/firestore";
import { UserProfile } from "@/lib/types";

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (uid: string) => {
        try {
            const profile = await getUserDocument(uid);
            console.log("🟢 [AuthContext] Profile loaded:", profile);
            setUserProfile(profile);
        } catch (err) {
            console.error("🔴 [AuthContext] fetchProfile error:", err);
            setUserProfile(null);
        }
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.uid);
    };

    useEffect(() => {
        // Timeout safety: kalau 10 detik tidak resolve, matikan loading
        const timeout = setTimeout(() => {
            console.warn("⚠️ [AuthContext] Timeout: forcing loading=false");
            setLoading(false);
        }, 10000);

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("🔵 [AuthContext] onAuthStateChanged:", currentUser?.uid || "null");

            try {
                setUser(currentUser);

                if (currentUser) {
                    // Buat user document kalau belum ada
                    try {
                        await createUserDocument(currentUser);
                        console.log("✅ [AuthContext] createUserDocument OK");
                    } catch (err) {
                        console.error("🔴 [AuthContext] createUserDocument error:", err);
                        // Lanjut saja — mungkin user sudah ada
                    }

                    // Load profile
                    await fetchProfile(currentUser.uid);
                } else {
                    setUserProfile(null);
                }
            } catch (err) {
                console.error("🔴 [AuthContext] Outer error:", err);
            } finally {
                // SELALU dijalankan, apapun yang terjadi
                clearTimeout(timeout);
                setLoading(false);
                console.log("🟡 [AuthContext] Loading set to false");
            }
        });

        return () => {
            clearTimeout(timeout);
            unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);