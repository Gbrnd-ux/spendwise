# 📘 Dokumentasi Fitur: Login

**Versi:** 1.0.0
**Terakhir Diperbarui:** 23 September 2026
**Status:** ✅ Production Ready

---

## 📋 Daftar Isi

1. [Ringkasan](#1-ringkasan)
2. [User Flow](#2-user-flow)
3. [Metode Login](#3-metode-login)
4. [Komponen UI](#4-komponen-ui)
5. [Logic & State](#5-logic--state)
6. [Error Handling](#6-error-handling)
7. [Keamanan](#7-keamanan)
8. [Testing Checklist](#8-testing-checklist)

---

## 1. Ringkasan

Fitur Login memungkinkan user yang sudah memiliki akun untuk masuk ke SpendWise. Sama seperti Register, ada **dua metode**:

| Metode | Deskripsi |
| :--- | :--- |
| **Email & Password** | Login manual dengan email dan password terdaftar |
| **Google OAuth** | Login satu-klik menggunakan akun Google |

Setelah login sukses, user diarahkan ke `/dashboard`. Jika user yang sudah login membuka `/login`, ia otomatis diarahkan ke `/dashboard` (lihat `AUTH_CONTEXT.md` bagian 6.1).

---

## 2. User Flow

```
┌────────────────────────────┐
│  User buka halaman /login  │
└──────────┬──────────────────┘
           ↓
   [Halaman Login /login]
           │
           ├── Isi form manual:
           │     - Email
           │     - Password
           │     → Klik "Sign in"
           │
           └── Klik "Continue with Google"
                     ↓
              [Google Popup]
                     ↓
              [Firebase Auth]
                     ↓
                [Dashboard]
```

Link tambahan di halaman ini:
- **"Forgot password?"** → `/forgot-password`
- **"Register now"** → `/register`

---

## 3. Metode Login

### 3.1. Login dengan Email & Password

**Fungsi Firebase:** `signInWithEmailAndPassword`

**Input:**
- Email (wajib, format valid)
- Password (wajib)

**Kode Inti:**
```tsx
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
        return setErrorMessage("Email dan password wajib diisi.");
    }

    setIsLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/dashboard");
    } catch (error: any) {
        // Error handling (Section 6)
    } finally {
        setIsLoading(false);
    }
};
```

### 3.2. Login dengan Google

**Fungsi Firebase:** `signInWithPopup` + `GoogleAuthProvider`

**Kode Inti:**
```tsx
const handleGoogleLogin = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
        await signInWithPopup(auth, provider);
        router.push("/dashboard");
    } catch (error: any) {
        // Error handling (Section 6)
    } finally {
        setIsLoading(false);
    }
};
```

**Catatan Penting:** Sama seperti di `AUTH_REGISTER.md`, Google Login dan Google Signup memakai fungsi yang identik — Firebase otomatis mendeteksi apakah akun sudah ada atau belum, jadi tidak perlu logic pembeda di sisi client.

### 3.3. Remember Me / Persistence

Secara default Firebase menyimpan sesi login via IndexedDB (persistent), sehingga user tidak perlu login ulang setiap kali membuka aplikasi. Lihat `AUTH_CONTEXT.md` bagian 6.2 untuk kustomisasi persistence.

---

## 4. Komponen UI

### 4.1. Form Fields

| Field | Tipe | Placeholder | Validasi |
| :--- | :--- | :--- | :--- |
| Email | email | alexander@premium.com | Format email valid |
| Password | password | Masukkan password | Wajib diisi |

### 4.2. Indikator Visual

| Indikator | Deskripsi |
| :--- | :--- |
| Toggle Password | Ikon mata untuk show/hide password |
| Loading Spinner | Muncul di tombol "Sign in" saat proses berlangsung |
| Error Banner | Muncul di atas form saat login gagal |

### 4.3. Animasi

| Animasi | Trigger | Class |
| :--- | :--- | :--- |
| Fade-in Up | Halaman dibuka | `animate-fade-in-up` |
| Shake | Error muncul | `animate-shake` |
| Float Orbs | Otomatis | `animate-float-slow`, `animate-float-reverse` |
| Glow Pulse | Loading state | `animate-glow-pulse` |

---

## 5. Logic & State

### 5.1. State Management

```tsx
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [hasError, setHasError] = useState(false);
const [errorMessage, setErrorMessage] = useState("");
```

### 5.2. Alur Validasi Submit

```
Klik "Sign in"
    ↓
1. Cek email & password terisi? → Tidak → Error
    ↓
Valid → Proses Firebase signInWithEmailAndPassword
    ↓
Sukses → Redirect /dashboard
Gagal  → Tampilkan error (Section 6)
```

### 5.3. Redirect Otomatis Jika Sudah Login

```tsx
const { user } = useAuth();
const router = useRouter();

useEffect(() => {
    if (user) router.push("/dashboard");
}, [user, router]);
```

---

## 6. Error Handling

| Kode Firebase | Pesan ke User |
| :--- | :--- |
| `auth/invalid-email` | "Format email tidak valid." |
| `auth/user-disabled` | "Akun ini telah dinonaktifkan." |
| `auth/user-not-found` | "Email atau password salah." |
| `auth/wrong-password` | "Email atau password salah." |
| `auth/invalid-credential` | "Email atau password salah." |
| `auth/too-many-requests` | "Terlalu banyak percobaan. Coba lagi nanti." |
| `auth/network-request-failed` | "Koneksi bermasalah. Coba lagi." |
| `auth/popup-closed-by-user` | "Proses dibatalkan. Silakan coba lagi." |
| `auth/account-exists-with-different-credential` | "Email sudah terdaftar dengan metode lain. Coba login dengan Google." |
| (default) | "Gagal login. Silakan coba lagi." |

> **Catatan Keamanan:** `auth/user-not-found` dan `auth/wrong-password` sengaja ditampilkan dengan pesan generik yang sama ("Email atau password salah") agar tidak membocorkan apakah suatu email terdaftar atau tidak (anti email-enumeration), konsisten dengan pendekatan di `AUTH_FORGOT_PASSWORD.md`.

---

## 7. Keamanan

### 7.1. Praktik Terbaik

- ✅ Password tidak pernah ditampilkan di log/console
- ✅ Pesan error tidak membocorkan status akun (anti-enumeration)
- ✅ Kredensial Firebase via environment variables (`NEXT_PUBLIC_FIREBASE_*`)
- ✅ Session dikelola otomatis oleh Firebase (`onAuthStateChanged`)
- ✅ Redirect otomatis mencegah user yang sudah login mengakses ulang form login

### 7.2. Rekomendasi Selanjutnya

| Fitur | Status | Prioritas |
| :--- | :--- | :--- |
| Captcha (reCAPTCHA) | ❌ Belum | Tinggi |
| Login attempt lockout (client-side) | ❌ Belum | Sedang |
| Firebase App Check | ❌ Belum | Sedang |
| Multi-factor authentication | ❌ Belum | Rendah |

---

## 8. Testing Checklist

### 8.1. Functional

- [ ] Login dengan email & password benar → berhasil, redirect ke `/dashboard`
- [ ] Login dengan email tidak terdaftar → error "Email atau password salah."
- [ ] Login dengan password salah → error "Email atau password salah."
- [ ] Login dengan format email salah → error "Format email tidak valid."
- [ ] Login dengan Google (akun sudah ada) → berhasil
- [ ] Tutup popup Google → error "Proses dibatalkan."
- [ ] Buka `/login` saat sudah login → auto-redirect ke `/dashboard`
- [ ] Klik "Forgot password?" → mengarah ke `/forgot-password`
- [ ] Klik "Register now" → mengarah ke `/register`

### 8.2. UI/UX

- [ ] Toggle password bekerja
- [ ] Tombol disabled saat loading
- [ ] Error banner tampil dengan animasi shake
- [ ] Responsive di mobile dan desktop

### 8.3. Security

- [ ] Cek Console → tidak ada password ter-log
- [ ] Cek Network tab → kredensial terkirim via HTTPS
- [ ] Pesan error tidak membedakan "email tidak ada" vs "password salah"
