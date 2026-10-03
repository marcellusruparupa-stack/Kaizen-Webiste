-- Kaizen-website: skema Supabase. Jalankan di SQL Editor sekali saja.
-- 1) Ganti email pemilik di fungsi is_owner() kalau berbeda dengan email login Supabase kamu.

create or replace function public.is_owner() returns boolean
language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = lower('marcellusruparupa@gmail.com')
$$;

create table if not exists public.profile (
  id int primary key default 1 check (id = 1),
  name text, tagline text, grade text, city text, open_to text,
  school text, interest text, languages text, learning text, bio text,
  photo_url text, email text, cv_url text, contact_text text, updated_label text
);
create table if not exists public.activities (
  id text primary key, sort int default 0, cat text, title text, role text, year text, descr text
);
create table if not exists public.projects (
  id text primary key, sort int default 0, title text, descr text, url text, image_url text
);
create table if not exists public.timeline (
  id text primary key, sort int default 0, label text, year text, body text, is_now boolean default false
);
create table if not exists public.channels (
  id text primary key, sort int default 0, name text, handle text, url text, descr text
);

-- Aturan akses: semua orang boleh baca, hanya pemilik yang boleh menulis.
do $$
declare t text;
begin
  foreach t in array array['profile','activities','projects','timeline','channels'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "read all" on public.%I', t);
    execute format('create policy "read all" on public.%I for select using (true)', t);
    execute format('drop policy if exists "owner write" on public.%I', t);
    execute format('create policy "owner write" on public.%I for all using (public.is_owner()) with check (public.is_owner())', t);
  end loop;
end $$;

-- Storage untuk foto dan gambar karya.
insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

-- Tidak ada policy baca umum: bucket public tetap bisa dibuka lewat URL, tapi daftar file tidak bisa dilihat orang lain.
drop policy if exists "portfolio read" on storage.objects;
drop policy if exists "portfolio owner write" on storage.objects;
create policy "portfolio owner write" on storage.objects for all
  using (bucket_id = 'portfolio' and public.is_owner())
  with check (bucket_id = 'portfolio' and public.is_owner());

-- Data contoh (boleh dihapus lewat dashboard).
insert into public.profile (id, name, tagline, grade, city, open_to, school, interest, languages, learning, bio, email, contact_text)
values (1, 'Nama Kamu', 'Pelajar kelas 11 yang suka desain, fotografi, dan coding. Di sini semua kegiatan, karya, dan channel-ku ada di satu tempat.',
 'Kelas 11', 'Jakarta, Indonesia', 'Terbuka untuk magang dan kolaborasi', 'Nama sekolah', 'Desain dan teknologi', 'Indonesia, Inggris', 'Fotografi dan Figma',
 E'Tulis 3 sampai 4 kalimat tentang dirimu: siapa kamu, apa yang kamu suka, dan apa yang sedang kamu pelajari sekarang.\n\nTulis satu kalimat tentang tujuanmu: kuliah di mana, jurusan apa, atau pekerjaan impianmu.',
 'nama@example.com', 'Kirim pesan singkat: siapa kamu dan apa idenya. Aku balas secepatnya.')
on conflict (id) do nothing;

insert into public.activities (id, sort, cat, title, role, year, descr) values
 ('a1', 0, 'Organisasi', 'Nama organisasi', 'Jabatan kamu', '2025', 'Tulis satu kalimat: apa yang kamu kerjakan dan apa hasilnya.'),
 ('a2', 1, 'Lomba', 'Nama lomba', 'Juara atau peserta', '2025', 'Tulis satu kalimat: apa yang kamu kerjakan dan apa hasilnya.'),
 ('a3', 2, 'Sekolah', 'Klub atau mata pelajaran', 'Peran kamu', '2024', 'Tulis satu kalimat: apa yang kamu kerjakan dan apa hasilnya.')
on conflict (id) do nothing;

insert into public.projects (id, sort, title, descr, url, image_url) values
 ('p1', 0, 'Judul karya 1', 'Satu kalimat tentang karya ini.', '', ''),
 ('p2', 1, 'Judul karya 2', 'Satu kalimat tentang karya ini.', '', '')
on conflict (id) do nothing;

insert into public.timeline (id, sort, label, year, body, is_now) values
 ('t1', 0, 'SMP', '2019 - 2022', 'Satu hal yang kamu mulai di sini.', false),
 ('t2', 1, 'SMA', '2022 - sekarang', 'Satu hal yang kamu capai di sini.', true)
on conflict (id) do nothing;

-- Channel tanpa url tidak tampil di situs.
insert into public.channels (id, sort, name, handle, url, descr) values
 ('instagram', 0, 'Instagram', '@username', 'https://www.instagram.com/', 'Dokumentasi kegiatan'),
 ('tiktok', 1, 'TikTok', '', '', 'Video pendek'),
 ('youtube', 2, 'YouTube', 'nama channel', 'https://www.youtube.com/', 'Video panjang'),
 ('linkedin', 3, 'LinkedIn', '', '', 'Profil profesional'),
 ('github', 4, 'GitHub', '', '', 'Kode dan proyek'),
 ('website', 5, 'Website lain', '', '', 'Blog, Behance, atau lainnya')
on conflict (id) do nothing;
