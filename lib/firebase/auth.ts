// lib/firebase/auth.ts
import { auth } from "./config";
import {
    signInWithPopup,
    GoogleAuthProvider,
    fetchSignInMethodsForEmail
} from "firebase/auth";

export async function loginWithGoogle(): Promise<{ user: any; warning?: string }> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
        const result = await signInWithPopup(auth, provider);
        return { user: result.user };
    } catch (error: any) {
        // Deteksi konflik akun
        if (error.code === "auth/account-exists-with-different-credential") {
            const email = error.customData?.email;
            // Cek provider yang sudah terdaftar untuk email ini
            const methods = await fetchSignInMethodsForEmail(auth, email);

            if (methods.includes("password")) {
                throw new Error(
                    `Email "${email}" sudah terdaftar dengan password. ` +
                    `Silakan login menggunakan email & password, ` +
                    `lalu tautkan akun Google di halaman Settings.`
                );
            }
        }
        throw error;
    }
}