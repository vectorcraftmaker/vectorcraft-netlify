# 🚀 VectorCraft Netlify Edition

**VectorCraft Netlify Edition** adalah aplikasi web konversi gambar (PNG, JPG, WEBP, BMP) menjadi **Vektor SVG Asli** yang berjalan **100% Client-Side di browser pengguna menggunakan WebAssembly (WASM)**.

Didesain khusus untuk di-deploy secara **100% GRATIS ke Netlify** (atau Vercel) tanpa butuh server backend Python sama sekali!

---

## ✨ Fitur Utama

- 🌐 **100% Client-Side WebAssembly (WASM)**: Tracing gambar dikerjakan langsung oleh CPU browser pengguna via WASM. Super cepat & aman (gambar tidak di-upload ke server manapun).
- ⚡ **Single Auto-Magic Converter**: Otomatis mendeteksi tipe gambar (Logo, Ilustrasi, Foto, Monokrom).
- 📦 **Batch Multi-File Converter (ZIP)**: Upload puluhan gambar sekaligus -> konversi otomatis -> download semua SVG dalam 1 file `.ZIP`.
- 🎨 **Inspector Canvas**: Pilihan background preview Checkerboard (Transparan), Putih Bersih, atau Dark Mode.
- 🚀 **Netlify Native**: Dilengkapi `netlify.toml` dan Next.js Static Export (`out/`).

---

## 🛠️ Cara Deploy ke Netlify (100% Gratis)

### Langkah 1: Push Proyek Ini ke GitHub
1. Buat repositori baru di akun [GitHub](https://github.com/new) kamu (misal: `vectorcraft-netlify`).
2. Di terminal komputer kamu, masuk ke folder ini:
   ```bash
   cd /Users/sunkiss2/.gemini/antigravity/scratch/vectorcraft_netlify
   git init
   git add .
   git commit -m "Initial commit VectorCraft Netlify Edition"
   git branch -M main
   git remote add origin https://github.com/USERNAME_KAMU/vectorcraft-netlify.git
   git push -u origin main
   ```

### Langkah 2: Sambungkan ke Netlify
1. Buka [app.netlify.com](https://app.netlify.com) dan login/daftar akun Netlify gratis.
2. Klik tombol **"Add new site"** -> **"Import an existing project"**.
3. Pilih **GitHub** dan berikan izin ke repositori `vectorcraft-netlify`.
4. Netlify akan **otomatis mendeteksi** file `netlify.toml`:
   - **Build Command**: `npm run build`
   - **Publish directory**: `out`
5. Klik **Deploy vectorcraft-netlify**!

🎉 **Selesai!** Dalam 1 menit, Netlify akan memberikan URL live website kamu (misal `https://vectorcraft.netlify.app`).

---

## 💻 Cara Menjalankan Secara Lokal di Komputer (Dev Mode)

```bash
cd /Users/sunkiss2/.gemini/antigravity/scratch/vectorcraft_netlify
npm run dev
```

Buka `http://localhost:3000` di browser.
