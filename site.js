/* Kaizen-website: shared code. Renders the public site from Supabase data and holds the data mapping used by admin.js. */
(function () {
  'use strict';
  var CFG = window.KAIZEN_CONFIG || {};
  var CATS = ['Organisasi', 'Lomba', 'Sekolah', 'Hobi', 'Sukarela', 'Lainnya'];
  var DEFAULT_CHANNELS = [
    ['instagram', 'Instagram', 'Dokumentasi kegiatan'], ['tiktok', 'TikTok', 'Video pendek'], ['youtube', 'YouTube', 'Video panjang'],
    ['linkedin', 'LinkedIn', 'Profil profesional'], ['github', 'GitHub', 'Kode dan proyek'], ['website', 'Website lain', 'Blog, Behance, atau lainnya']
  ];
  var state = emptyState();
  var view = { filter: 'Semua', open: false, tab: 'profil', canEdit: false, dirty: false, saving: false, msg: '', pendingDel: '' };
  var siteEl = document.getElementById('site');
  var sb = null;

  function emptyState() {
    return {
      profile: { name: '', tagline: '', grade: '', city: '', openTo: '', school: '', interest: '', languages: '', learning: '', bio: '', photo: '', updated: '' },
      activities: [], projects: [], timeline: [],
      channels: DEFAULT_CHANNELS.map(function (c) { return { id: c[0], name: c[1], handle: '', url: '', desc: c[2] }; }),
      contact: { email: '', cvUrl: '', text: '' }
    };
  }
  function client() {
    if (sb) return sb;
    if (!CFG.url || !CFG.anonKey || /YOUR_/.test(CFG.url + CFG.anonKey) || !window.supabase) return null;
    sb = window.supabase.createClient(CFG.url, CFG.anonKey);
    return sb;
  }
  function orderBySort(q) { return q.order('sort', { ascending: true }); }
  function loadState() {
    var c = client();
    if (!c) return Promise.reject(new Error('config'));
    return Promise.all([
      c.from('profile').select('*').eq('id', 1).maybeSingle(),
      orderBySort(c.from('activities').select('*')),
      orderBySort(c.from('projects').select('*')),
      orderBySort(c.from('timeline').select('*')),
      orderBySort(c.from('channels').select('*'))
    ]).then(function (r) {
      for (var i = 0; i < r.length; i++) if (r[i].error) throw r[i].error;
      var s = emptyState(), p = r[0].data;
      if (p) {
        s.profile = { name: p.name || '', tagline: p.tagline || '', grade: p.grade || '', city: p.city || '', openTo: p.open_to || '', school: p.school || '', interest: p.interest || '', languages: p.languages || '', learning: p.learning || '', bio: p.bio || '', photo: p.photo_url || '', updated: p.updated_label || '' };
        s.contact = { email: p.email || '', cvUrl: p.cv_url || '', text: p.contact_text || '' };
      }
      s.activities = r[1].data.map(function (x) { return { id: x.id, cat: x.cat || 'Lainnya', title: x.title || '', role: x.role || '', year: x.year || '', desc: x.descr || '' }; });
      s.projects = r[2].data.map(function (x) { return { id: x.id, title: x.title || '', desc: x.descr || '', url: x.url || '', image: x.image_url || '' }; });
      s.timeline = r[3].data.map(function (x) { return { id: x.id, label: x.label || '', year: x.year || '', text: x.body || '', now: !!x.is_now }; });
      if (r[4].data.length) s.channels = r[4].data.map(function (x) { return { id: x.id, name: x.name || '', handle: x.handle || '', url: x.url || '', desc: x.descr || '' }; });
      state = s; return s;
    });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(u)) return 'https://' + u;
    return '';
  }
  function safeImg(u) { return /^https:\/\/[^\s"'<>]+$/.test(u || '') ? u : ''; }
  function paras(t) { return String(t || '').split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function uid() { return 'i' + Math.random().toString(36).slice(2, 11); }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

  var ICONS = {
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
    tiktok: '<path d="M9 18a4 4 0 1 1 0-8v-3a7 7 0 0 0 7 7"/><path d="M13 4v10a4 4 0 1 1-4-4"/>',
    youtube: '<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 11v6M8 7.5v.01M12 17v-6M12 13a3 3 0 0 1 6 0v4"/>',
    github: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    website: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'
  };
  function icon(id) {
    var p = ICONS[id] || ICONS.website;
    return '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  /* ---------- public site ---------- */
  function renderSite() {
    var p = state.profile, c = state.contact || {};
    var acts = state.activities.filter(function (a) { return a.title; });
    var projs = state.projects.filter(function (x) { return x.title; });
    var tl = state.timeline.filter(function (x) { return x.label || x.text; });
    var chs = state.channels.filter(function (x) { return safeUrl(x.url); });
    var bio = paras(p.bio);
    var facts = [['Sekolah', p.school], ['Minat', p.interest], ['Bahasa', p.languages], ['Lagi belajar', p.learning]].filter(function (f) { return f[1]; });
    var cv = safeUrl(c.cvUrl);
    var hasContact = !!(c.email || cv);
    var secs = [];
    if (bio.length || facts.length) secs.push(['tentang', 'Tentang']);
    if (acts.length) secs.push(['kegiatan', 'Kegiatan']);
    if (projs.length) secs.push(['karya', 'Karya']);
    if (tl.length) secs.push(['perjalanan', 'Perjalanan']);
    if (chs.length) secs.push(['channel', 'Channel']);
    var name = p.name || 'Namamu';
    var firstSec = secs.length ? secs[0] : null;
    var h = '';

    h += '<header class="nav"><nav class="wrap" aria-label="Menu utama"><a class="brand" href="#beranda"><span class="hanko" aria-hidden="true">私</span><b>' + esc(name) + '</b></a><div class="links">';
    secs.forEach(function (s) { h += '<a href="#' + s[0] + '">' + s[1] + '</a>'; });
    if (hasContact) h += '<a class="cta" href="#kontak">Kontak</a>';
    h += '</div></nav></header>';

    h += '<section id="beranda" class="hero"><div class="wrap"><div class="stack"><div class="row"><span class="pix dark">ポートフォリオ</span>';
    if (p.updated) h += '<span class="pix line">Diperbarui ' + esc(p.updated) + '</span>';
    h += '</div><h1 class="big">Halo, aku <span class="ac">' + esc(name) + '</span>.</h1>';
    if (p.tagline) h += '<p class="lead">' + esc(p.tagline) + '</p>';
    h += '<div class="row" style="gap:14px">';
    if (firstSec) h += '<a class="btn-big red lift" href="#' + (acts.length ? 'kegiatan' : firstSec[0]) + '">Lihat ' + (acts.length ? 'kegiatanku' : firstSec[1].toLowerCase()) + ' &rarr;</a>';
    if (hasContact) h += '<a class="btn-big white lift" href="#kontak">Hubungi aku</a>';
    h += '</div><div class="row">';
    if (p.grade) h += '<span class="chip p">' + esc(p.grade) + '</span>';
    if (p.city) h += '<span class="chip b">' + esc(p.city) + '</span>';
    if (p.openTo) h += '<span class="chip">' + esc(p.openTo) + '</span>';
    h += '</div></div><div class="photo-wrap"><div class="photo"><div class="in">';
    var ph = safeImg(p.photo);
    h += ph ? '<img src="' + ph + '" alt="Foto ' + esc(name) + '">' : '<span aria-hidden="true">私</span>';
    h += '</div><div class="tape"></div></div><div class="stamp" aria-hidden="true"><i>私</i><small>WATASHI</small></div><div class="vert" aria-hidden="true">自己紹介・ポートフォリオ</div></div></div></section>';

    var tk = 'PORTOFOLIO ✱ ポートフォリオ ✱ ' + name.toUpperCase() + ' ✱ 活動 ✱ 作品 ✱ ';
    h += '<div class="band" aria-hidden="true"><div class="tick"><span>' + esc(tk + tk) + '</span><span>' + esc(tk + tk) + '</span></div></div>';

    if (bio.length || facts.length) {
      h += '<section id="tentang" class="sec wrap"><h2>Tentang aku <span class="ac">私</span></h2><div class="gap"></div><div class="about">';
      if (bio.length) { h += '<div class="card"><div class="txt">'; bio.forEach(function (t) { h += '<p>' + esc(t) + '</p>'; }); h += '</div></div>'; }
      if (facts.length) { h += '<div class="facts">'; facts.forEach(function (f) { h += '<div class="fact"><small>' + esc(f[0]) + '</small><b>' + esc(f[1]) + '</b></div>'; }); h += '</div>'; }
      h += '</div></section>';
    }

    if (acts.length) {
      var present = CATS.filter(function (k) { return acts.some(function (a) { return a.cat === k; }); });
      if (view.filter !== 'Semua' && present.indexOf(view.filter) < 0) view.filter = 'Semua';
      h += '<section id="kegiatan" class="sec wrap"><h2>Kegiatan <span class="ac">活動</span></h2><p class="sub">Pilih kategori untuk menyaring kegiatan.</p>';
      if (present.length > 1) {
        h += '<div class="filters" role="group" aria-label="Filter kategori kegiatan">';
        ['Semua'].concat(present).forEach(function (k) {
          h += '<button type="button" class="fbtn" data-filter="' + esc(k) + '" aria-pressed="' + (view.filter === k) + '">' + esc(k) + '</button>';
        });
        h += '</div>';
      }
      h += '<div class="grid">';
      acts.filter(function (a) { return view.filter === 'Semua' || a.cat === view.filter; }).forEach(function (a) {
        h += '<article class="card lift"><div class="meta"><span class="cat c-' + slug(a.cat || 'Lainnya') + '">' + esc(a.cat || 'Lainnya') + '</span>' + (a.year ? '<span class="yr">' + esc(a.year) + '</span>' : '') + '</div><h3>' + esc(a.title) + '</h3>' + (a.role ? '<div class="role">' + esc(a.role) + '</div>' : '') + (a.desc ? '<p>' + esc(a.desc) + '</p>' : '') + '</article>';
      });
      h += '</div></section>';
    }

    if (projs.length) {
      h += '<section id="karya" class="sec wrap"><h2>Karya pilihan <span class="ac">作品</span></h2><div class="gap"></div><div class="grid">';
      projs.forEach(function (x) {
        var u = safeUrl(x.url), im = safeImg(x.image);
        var inner = '<div class="img">' + (im ? '<img src="' + im + '" alt="Karya: ' + esc(x.title) + '">' : '<span aria-hidden="true">作</span>') + '</div><div class="body"><h3>' + esc(x.title) + '</h3>' + (x.desc ? '<p>' + esc(x.desc) + '</p>' : '') + (u ? '<span class="more">Lihat karya &rarr;</span>' : '') + '</div>';
        h += u ? '<a class="card proj lift" href="' + esc(u) + '" target="_blank" rel="noopener">' + inner + '</a>' : '<div class="card proj">' + inner + '</div>';
      });
      h += '</div></section>';
    }

    if (tl.length) {
      h += '<section id="perjalanan" class="sec wrap"><h2>Perjalanan <span class="ac">道</span></h2><p class="sub">Garis waktu yang terus bertambah, dari sekolah sampai karier.</p><div class="tl">';
      tl.forEach(function (x) {
        h += '<div class="card' + (x.now ? ' now' : '') + '">' + (x.year || x.now ? '<span class="yr">' + (x.now && !x.year ? 'SEKARANG' : esc(x.year)) + '</span>' : '') + '<h3>' + esc(x.label) + '</h3>' + (x.text ? '<p>' + esc(x.text) + '</p>' : '') + '</div>';
      });
      h += '</div></section>';
    }

    if (chs.length) {
      h += '<section id="channel" class="sec wrap"><h2>Channel &amp; sosmed <span class="ac">配信</span></h2><p class="sub">Klik kartu untuk langsung ke akunku.</p><div class="chgrid">';
      chs.forEach(function (x) {
        var sub = [x.desc, x.handle].filter(Boolean).join(' · ');
        h += '<a class="chan lift" href="' + esc(safeUrl(x.url)) + '" target="_blank" rel="noopener"><span class="ic">' + icon(x.id) + '</span><span class="t"><strong>' + esc(x.name || 'Link') + '</strong>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span></a>';
      });
      h += '</div></section>';
    }

    if (hasContact) {
      h += '<section id="kontak" class="sec wrap"><div class="contact"><div class="stack" style="gap:16px"><span class="pix">連絡</span><h2>Mau ngobrol atau kolaborasi?</h2>' + (c.text ? '<p class="lead">' + esc(c.text) + '</p>' : '') + '</div><div class="stack" style="gap:14px;align-items:flex-start">';
      if (c.email) h += '<div class="mailrow"><span class="mail">' + esc(c.email) + '</span><button type="button" class="btn-big white lift" style="min-height:48px;padding:0 18px;font-size:16px" data-copy="' + esc(c.email) + '">Salin email</button></div>';
      if (cv) h += '<a class="btn-big dark lift" style="box-shadow:6px 6px 0 var(--bg)" href="' + esc(cv) + '" target="_blank" rel="noopener">Lihat CV</a>';
      h += '</div></div></section>';
    }

    h += '<footer class="foot"><div class="wrap"><b>' + esc(name) + ' · ポートフォリオ</b><span>' + (p.updated ? 'Diperbarui ' + esc(p.updated) : '') + '</span></div></footer>';
    siteEl.innerHTML = h;
  }

  siteEl.addEventListener('click', function (e) {
    var f = e.target.closest('[data-filter]');
    if (f) { view.filter = f.getAttribute('data-filter'); renderSite(); return; }
    var cp = e.target.closest('[data-copy]');
    if (cp) {
      var txt = cp.getAttribute('data-copy');
      var ok = function () { toast('Email disalin'); };
      var fail = function () { toast('Salin manual: ketuk alamat emailnya'); };
      try { navigator.clipboard.writeText(txt).then(ok, fail); } catch (err) { fail(); }
    }
  });

  var toastT = 0;
  function toast(t) {
    var old = document.querySelector('.toast'); if (old) old.remove();
    var d = document.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = t;
    document.body.appendChild(d); clearTimeout(toastT); toastT = setTimeout(function () { d.remove(); }, 2400);
  }


  function showError(msg) {
    siteEl.innerHTML = '<section class="sec wrap"><div class="card"><h3>Situs belum tersambung ke data</h3><p>' + esc(msg) + '</p></div></section>';
  }
  function boot() {
    loadState().then(function () { renderSite(); if (state.profile.name) document.title = state.profile.name + ' | Portofolio'; }, function (e) {
      showError(e && e.message === 'config' ? 'Isi SUPABASE URL dan anon key di config.js, lalu muat ulang halaman.' : 'Data tidak bisa dimuat. Cek tabel dan aturan akses di Supabase (lihat README).');
    });
  }
  window.KZ = {
    get state() { return state; }, set state(v) { state = v; }, view: view, CATS: CATS, esc: esc, safeUrl: safeUrl, safeImg: safeImg,
    uid: function () { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : uid(); },
    client: client, loadState: loadState, renderSite: renderSite, toast: toast, boot: boot, showError: showError
  };
})();
