# Starlog

Pelacak kebiasaan harian + catatan sederhana. Setiap hari yang kamu selesaikan
menjadi satu titik cahaya yang tersambung jadi rasi bintang. Tidak ada
database — semua data (kebiasaan, riwayat harian, catatan) disimpan sebagai
satu file JSON di dalam repo GitHub-mu sendiri, lewat GitHub Contents API.

**Kebiasaan**: klik tombol centang bulat untuk menandai hari ini selesai —
langsung menambah hitungan "beruntun" dan "total". Setiap tanda tercatat
lengkap dengan tanggal dan jam saat disimpan. Tiap kebiasaan bisa diberi:
- **Jadwal**: hari-hari tertentu dalam seminggu (misalnya cuma Senin/Rabu/
  Jumat) — hari di luar jadwal ditandai redup di garis waktu dan tidak
  memutus hitungan "beruntun" kalau dilewati
- **Jam dilakukan** (opsional)
- **Target hari** (opsional) — muncul sebagai progress bar menuju target itu

**Catatan**: setiap catatan punya kategori berwarna (Umum, Ide, Refleksi,
Tugas) sebagai pembeda antar poin, bisa difilter lewat chip di atas, dan
dikelompokkan otomatis per kategori saat menampilkan semua. Catatan juga
bisa dibuat dalam mode **Tabel** (kolom & baris bebas — cocok untuk catatan
pengeluaran atau daftar apa pun), bukan cuma teks bebas. Tiap catatan punya
tombol **Lihat penuh** yang membuka tampilan satu layar penuh berisi seluruh
isi catatan (teks lengkap atau tabel lengkap), lengkap dengan tombol ubah/
hapus di sana.

Sudah lengkap sebagai PWA: bisa dipasang ke home screen (Android/desktop
lewat tombol "Pasang aplikasi", iOS lewat Share → Add to Home Screen), punya
ikon di semua ukuran standar, dan tetap bisa dibuka (mode baca, versi
terakhir yang sempat dimuat) walau sedang offline berkat service worker.

## Ikon

Semua ikon (`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`,
`apple-touch-icon.png`, `icons/icon-192.png`, `icons/icon-512.png`, dan
versi `-maskable`) sudah digenerate dan ada di `public/`. Kalau mau ganti
desainnya, cukup timpa file-file itu dengan ukuran yang sama — tidak ada
langkah build tambahan yang diperlukan.

## Cara kerja penyimpanan

- Setiap baca/tulis data memanggil GitHub API untuk membaca atau menimpa file
  `data/starlog.json` (path bisa diubah) di repo yang kamu tentukan.
- Penulisan memakai mekanisme retry dengan backoff bila terjadi konflik SHA
  (dua tulisan bersamaan), jadi aman dipakai walau dibuka dari beberapa tab.
- Tidak perlu database, tidak perlu server terpisah — cukup Vercel + repo
  GitHub.

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local
# isi GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO di .env.local
npm run dev
```

Buka http://localhost:3000

## Menyiapkan GitHub

1. Siapkan repo tempat data disimpan. Bisa repo baru khusus data, atau repo
   ini sendiri setelah kamu push ke GitHub.
2. Buat Personal Access Token:
   - Buka GitHub → Settings → Developer settings → Personal access tokens →
     Fine-grained tokens → Generate new token.
   - Batasi token ke repo yang dipilih di langkah 1.
   - Beri izin **Contents: Read and write**.
3. Catat token, nama pemilik repo (username/organisasi), dan nama repo.

## Deploy ke Vercel

1. Push folder ini ke sebuah repo GitHub (bisa repo yang sama dengan tempat
   data disimpan, atau repo terpisah — keduanya didukung).
2. Buka [vercel.com/new](https://vercel.com/new) dan import repo tersebut.
3. Di pengaturan project, buka **Environment Variables** dan tambahkan:
   - `GITHUB_TOKEN`
   - `GITHUB_OWNER`
   - `GITHUB_REPO`
   - `GITHUB_BRANCH` (opsional, default `main`)
   - `GITHUB_DATA_PATH` (opsional, default `data/starlog.json`)
4. Klik **Deploy**. Setelah selesai, buka domain yang diberikan Vercel.

Jika env variable belum lengkap, aplikasi akan menampilkan pesan konfigurasi
yang jelas di halaman utama, bukan error yang membingungkan.

## Struktur data

```json
{
  "habits": [
    {
      "id": "hb_...",
      "name": "Minum air putih",
      "emoji": "💧",
      "color": "gold",
      "createdAt": "2026-08-01T00:00:00.000Z",
      "logs": { "2026-08-29": true }
    }
  ],
  "notes": [
    {
      "id": "nt_...",
      "title": "Ide untuk minggu depan",
      "content": "...",
      "createdAt": "2026-08-29T00:00:00.000Z",
      "updatedAt": "2026-08-29T00:00:00.000Z"
    }
  ]
}
```

File ini dibuat otomatis saat data pertama kali disimpan — tidak perlu
membuatnya secara manual.
