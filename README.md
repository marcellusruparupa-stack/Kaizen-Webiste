# Kaizen-website

Situs portofolio statis. Data ada di Supabase, diedit lewat `admin.html`.

## File

- `index.html` situs publik
- `admin.html` dashboard (login dulu)
- `site.js`, `admin.js`, `style.css` kode dan tampilan
- `config.js` URL dan anon key Supabase
- `supabase/schema.sql` tabel, aturan akses, bucket gambar, data contoh

## Setup (sekali)

1. Di Supabase, buka SQL Editor, jalankan `supabase/schema.sql`. Cek email pemilik di fungsi `is_owner()`; harus sama dengan email login dashboard.
2. Authentication > Users > Add user: buat satu akun dengan email dan password pemilik, centang auto confirm.
3. Authentication > Sign In / Providers: matikan "Allow new users to sign up".
4. Project Settings > API: salin Project URL dan anon key ke `config.js`.
5. Commit ke repo Kaizen-website dan aktifkan GitHub Pages (branch main, folder root).

## Cara pakai

Buka `/admin.html`, login, edit di panel kanan (situs di kiri ikut berubah), klik Simpan. Pengunjung melihat perubahan setelah muat ulang.

- Channel tanpa link tidak tampil di situs.
- Bagian kosong (Kegiatan, Karya, Perjalanan, Channel, Kontak) otomatis hilang dari menu dan halaman.
- Foto dan gambar karya diunggah ke Storage bucket `portfolio`.

## Keamanan

Anon key boleh terlihat publik. Yang membatasi penulisan data adalah aturan RLS: semua orang boleh baca, hanya email pemilik yang boleh menulis. Jangan taruh service role key di repo.
