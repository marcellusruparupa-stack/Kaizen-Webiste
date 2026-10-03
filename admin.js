/* Kaizen-website: dashboard admin. Login Supabase, edit, simpan ke database dan Storage. */
(function () {
  'use strict';
  var KZ = window.KZ, CATS = KZ.CATS, esc = KZ.esc, safeImg = KZ.safeImg, uid = KZ.uid, toast = KZ.toast, renderSite = KZ.renderSite, view = KZ.view;
  var state = KZ.state;
  var panelEl = document.getElementById('panel');
  var raf = 0;
  function setState(s) { state = s; KZ.state = s; }
  var TABS = [['profil', 'Profil'], ['kegiatan', 'Kegiatan'], ['karya', 'Karya'], ['perjalanan', 'Perjalanan'], ['channel', 'Channel'], ['kontak', 'Kontak']];

  function fld(f, val, ctx) {
    var id = 'f-' + (ctx.list ? ctx.list + '-' + ctx.i + '-' + f.k : ctx.path.replace('.', '-'));
    var bind = ctx.list ? 'data-list="' + ctx.list + '" data-i="' + ctx.i + '" data-k="' + f.k + '"' : 'data-path="' + ctx.path + '"';
    var o = '<div class="fld">';
    if (f.t === 'check') {
      return o + '<label class="chk"><input type="checkbox" id="' + id + '" ' + bind + (val ? ' checked' : '') + '> ' + esc(f.l) + '</label></div>';
    }
    o += '<label for="' + id + '">' + esc(f.l) + '</label>';
    if (f.t === 'area') o += '<textarea id="' + id + '" ' + bind + ' rows="' + (f.rows || 3) + '">' + esc(val) + '</textarea>';
    else if (f.t === 'select') o += '<select id="' + id + '" ' + bind + '>' + CATS.map(function (k) { return '<option' + (k === val ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select>';
    else if (f.t === 'image') {
      var im = safeImg(val);
      o += (im ? '<img class="thumb" src="' + im + '" alt="">' : '') + '<input type="file" accept="image/*" id="' + id + '" data-img ' + bind + '>' + (im ? '<button type="button" class="pbtn sm" data-act="clearimg" ' + bind + '>Hapus gambar</button>' : '');
    } else o += '<input type="text" id="' + id + '" ' + bind + ' value="' + esc(val) + '"' + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '') + '>';
    if (f.h) o += '<span class="h">' + esc(f.h) + '</span>';
    return o + '</div>';
  }
  function groupHTML(section, fields) {
    return fields.map(function (f) { return fld(f, state[section][f.k], { path: section + '.' + f.k }); }).join('');
  }
  function listHTML(name, fields, titleKey, addLabel, opts) {
    var items = state[name], h = '';
    opts = opts || {};
    items.forEach(function (it, i) {
      var key = name + ':' + i;
      h += '<div class="itm"><div class="itm-h"><strong>' + esc(it[titleKey] || 'Item baru') + '</strong><span class="itm-b">';
      h += '<button type="button" class="pbtn sm" data-act="up" data-list="' + name + '" data-i="' + i + '" aria-label="Naikkan"' + (i === 0 ? ' disabled' : '') + '>&uarr;</button>';
      h += '<button type="button" class="pbtn sm" data-act="down" data-list="' + name + '" data-i="' + i + '" aria-label="Turunkan"' + (i === items.length - 1 ? ' disabled' : '') + '>&darr;</button>';
      if (view.pendingDel === key) h += '<button type="button" class="pbtn sm go" data-act="del" data-list="' + name + '" data-i="' + i + '">Yakin hapus?</button>';
      else h += '<button type="button" class="pbtn sm" data-act="del" data-list="' + name + '" data-i="' + i + '">Hapus</button>';
      h += '</span></div>';
      fields.forEach(function (f) { h += fld(f, it[f.k], { list: name, i: i }); });
      h += '</div>';
    });
    if (!opts.noAdd) h += '<button type="button" class="pbtn" data-act="add" data-list="' + name + '">+ ' + addLabel + '</button>';
    return h;
  }

  function tabBody() {
    switch (view.tab) {
      case 'profil':
        return '<p class="note">Perubahan langsung terlihat di halaman. Klik Simpan supaya pengunjung ikut melihatnya.</p>' +
          groupHTML('profile', [
            { k: 'name', l: 'Nama' }, { k: 'tagline', l: 'Kalimat pembuka', t: 'area', h: 'Muncul di bawah judul besar.' },
            { k: 'grade', l: 'Status', ph: 'Kelas 11 / Calon mahasiswa' }, { k: 'city', l: 'Kota' }, { k: 'openTo', l: 'Terbuka untuk' },
            { k: 'photo', l: 'Foto (rasio 4:5 paling pas)', t: 'image' },
            { k: 'bio', l: 'Tentang aku', t: 'area', rows: 6, h: 'Pisahkan paragraf dengan satu baris kosong.' },
            { k: 'school', l: 'Sekolah' }, { k: 'interest', l: 'Minat' }, { k: 'languages', l: 'Bahasa' }, { k: 'learning', l: 'Lagi belajar' }
          ]);
      case 'kegiatan':
        return '<p class="note">Kegiatan tanpa judul tidak ditampilkan. Kalau daftar kosong, bagian Kegiatan hilang dari halaman.</p>' +
          listHTML('activities', [{ k: 'cat', l: 'Kategori', t: 'select' }, { k: 'title', l: 'Nama kegiatan' }, { k: 'role', l: 'Peran / hasil' }, { k: 'year', l: 'Tahun' }, { k: 'desc', l: 'Satu kalimat penjelasan', t: 'area' }], 'title', 'Tambah kegiatan');
      case 'karya':
        return listHTML('projects', [{ k: 'title', l: 'Judul karya' }, { k: 'desc', l: 'Penjelasan singkat', t: 'area' }, { k: 'url', l: 'Link karya', ph: 'https://', h: 'Kosongkan kalau karya tidak punya link.' }, { k: 'image', l: 'Gambar', t: 'image' }], 'title', 'Tambah karya');
      case 'perjalanan':
        return listHTML('timeline', [{ k: 'label', l: 'Judul', ph: 'SMA / Kuliah / Magang' }, { k: 'year', l: 'Tahun', ph: '2022 - sekarang' }, { k: 'text', l: 'Satu hal yang terjadi', t: 'area' }, { k: 'now', l: 'Tandai sebagai posisi sekarang', t: 'check' }], 'label', 'Tambah baris');
      case 'channel':
        return '<p class="note">Channel tanpa link tidak muncul di halaman. Isi link-nya saat akunnya sudah siap.</p>' +
          listHTML('channels', [{ k: 'name', l: 'Nama platform' }, { k: 'url', l: 'Link akun', ph: 'https://' }, { k: 'handle', l: 'Username / nama channel' }, { k: 'desc', l: 'Isi akun ini', ph: 'Video pendek' }], 'name', 'Tambah channel');
      case 'kontak':
        return groupHTML('contact', [{ k: 'email', l: 'Email', h: 'Ditampilkan sebagai teks dengan tombol Salin.' }, { k: 'cvUrl', l: 'Link CV (PDF)', ph: 'https://', h: 'Kosongkan kalau belum ada. Bagian Kontak hilang kalau email dan CV sama-sama kosong.' }, { k: 'text', l: 'Kalimat ajakan', t: 'area' }]);
    }
    return '';
  }

  function statusText() {
    if (view.saving) return ['Menyimpan…', ''];
    if (view.msg) return [view.msg, 'dirty'];
    return view.dirty ? ['Ada perubahan yang belum disimpan.', 'dirty'] : ['Semua perubahan sudah tersimpan.', 'ok'];
  }
  function updateBar() {
    var s = panelEl.querySelector('.st'); if (!s) return;
    var t = statusText(); s.textContent = t[0]; s.className = 'st ' + t[1];
    var b = panelEl.querySelector('[data-act="save"]'); if (b) b.disabled = view.saving || !view.dirty;
  }
  function renderPanel() {
    if (!view.canEdit) { panelEl.innerHTML = ''; document.documentElement.classList.remove('admin-open'); return; }
    document.documentElement.classList.add('admin-open');
    var h = '<aside class="panel" aria-label="Dashboard admin"><div class="ph"><strong>Dashboard</strong><span class="row"><a class="pbtn sm" style="display:inline-flex;align-items:center;text-decoration:none" href="index.html" target="_blank" rel="noopener">Buka situs</a><button type="button" class="pbtn sm" data-act="logout">Keluar</button></span></div>';
    h += '<div class="tabs" role="tablist">' + TABS.map(function (t) { return '<button type="button" role="tab" class="tab" data-tab="' + t[0] + '" aria-selected="' + (view.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>';
    h += '<div class="pb">' + tabBody() + '</div>';
    var st = statusText();
    h += '<div class="pf"><span class="st ' + st[1] + '" role="status">' + esc(st[0]) + '</span><button type="button" class="pbtn go" data-act="save"' + (view.saving || !view.dirty ? ' disabled' : '') + '>Simpan</button></div></aside>';
    var keep = panelEl.querySelector('.pb'), top = keep ? keep.scrollTop : 0;
    panelEl.innerHTML = h;
    var nb = panelEl.querySelector('.pb'); if (nb) nb.scrollTop = top;
  }

  function touch() {
    view.dirty = true; view.msg = '';
    updateBar();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(renderSite);
  }
  function setVal(el, v) {
    var d = el.dataset;
    if (d.list) state[d.list][+d.i][d.k] = v;
    else { var p = d.path.split('.'); state[p[0]][p[1]] = v; }
  }
  function onField(e) {
    var el = e.target;
    if (!el.dataset || el.hasAttribute('data-img')) return;
    if (!(el.dataset.path || el.dataset.list)) return;
    setVal(el, el.type === 'checkbox' ? el.checked : el.value);
    if (el.dataset.list && el.dataset.k === (({ activities: 'title', projects: 'title', timeline: 'label', channels: 'name' })[el.dataset.list])) {
      var h = el.closest('.itm') && el.closest('.itm').querySelector('.itm-h strong');
      if (h) h.textContent = el.value || 'Item baru';
    }
    touch();
  }
  panelEl.addEventListener('input', onField);
  panelEl.addEventListener('change', function (e) {
    var el = e.target;
    if (el.hasAttribute && el.hasAttribute('data-img')) { onImage(el); return; }
    if (el.type === 'checkbox' || el.tagName === 'SELECT') onField(e);
  });

  function onImage(el) {
    var file = el.files && el.files[0]; if (!file) return;
    var max = el.dataset.path ? 900 : 1000, c = KZ.client();
    var fr = new FileReader();
    fr.onerror = function () { toast('Gambar tidak bisa dibaca'); };
    fr.onload = function () {
      var im = new Image();
      im.onerror = function () { toast('File itu bukan gambar yang valid'); };
      im.onload = function () {
        var s = Math.min(1, max / Math.max(im.width, im.height));
        var cv = document.createElement('canvas'); cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s);
        var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height);
        toast('Mengunggah gambar…');
        cv.toBlob(function (blob) {
          var path = 'img/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
          c.storage.from('portfolio').upload(path, blob, { contentType: 'image/jpeg', upsert: false }).then(function (r) {
            if (r.error) { toast('Unggah gagal: ' + r.error.message); return; }
            setVal(el, c.storage.from('portfolio').getPublicUrl(path).data.publicUrl);
            touch(); renderPanel(); toast('Gambar terunggah');
          });
        }, 'image/jpeg', 0.82);
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  panelEl.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab],[data-act]'); if (!t) return;
    if (t.dataset.tab) { view.tab = t.dataset.tab; view.pendingDel = ''; renderPanel(); return; }
    var a = t.dataset.act, name = t.dataset.list, i = +t.dataset.i;
    if (a === 'logout') { KZ.client().auth.signOut().then(function () { location.reload(); }); return; }
    if (a === 'save') { save(); return; }
    if (a === 'clearimg') { setVal(t, ''); touch(); renderPanel(); return; }
    if (a === 'add') {
      var tpl = {
        activities: { id: uid(), cat: 'Organisasi', title: '', role: '', year: '', desc: '' },
        projects: { id: uid(), title: '', desc: '', url: '', image: '' },
        timeline: { id: uid(), label: '', year: '', text: '', now: false },
        channels: { id: uid(), name: '', handle: '', url: '', desc: '' }
      }[name];
      state[name].push(tpl); touch(); renderPanel();
      var last = panelEl.querySelectorAll('.itm'); if (last.length) { var l = last[last.length - 1]; l.scrollIntoView({ block: 'center' }); var inp = l.querySelector('input[type=text]'); if (inp) inp.focus(); }
      return;
    }
    if (a === 'up' || a === 'down') {
      var j = a === 'up' ? i - 1 : i + 1, arr = state[name];
      if (j >= 0 && j < arr.length) { var x = arr[i]; arr[i] = arr[j]; arr[j] = x; touch(); renderPanel(); }
      return;
    }
    if (a === 'del') {
      var key = name + ':' + i;
      if (view.pendingDel !== key) { view.pendingDel = key; renderPanel(); return; }
      state[name].splice(i, 1); view.pendingDel = ''; touch(); renderPanel();
    }
  });

  function save() {
    if (view.saving || !view.dirty) return;
    var c = KZ.client(), p = state.profile, k = state.contact;
    view.saving = true; view.msg = ''; updateBar();
    p.updated = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    function sync(table, rows) {
      return c.from(table).select('id').then(function (r) {
        if (r.error) throw r.error;
        var keep = rows.map(function (x) { return x.id; });
        var gone = r.data.map(function (x) { return x.id; }).filter(function (id) { return keep.indexOf(id) < 0; });
        var del = gone.length ? c.from(table).delete().in('id', gone) : Promise.resolve({});
        return del.then(function (d) {
          if (d.error) throw d.error;
          return rows.length ? c.from(table).upsert(rows) : { error: null };
        });
      }).then(function (u) { if (u && u.error) throw u.error; });
    }
    var prof = { id: 1, name: p.name, tagline: p.tagline, grade: p.grade, city: p.city, open_to: p.openTo, school: p.school, interest: p.interest, languages: p.languages, learning: p.learning, bio: p.bio, photo_url: p.photo, updated_label: p.updated, email: k.email, cv_url: k.cvUrl, contact_text: k.text };
    c.from('profile').upsert(prof).then(function (r) {
      if (r.error) throw r.error;
      return sync('activities', state.activities.map(function (x, i) { return { id: x.id, sort: i, cat: x.cat, title: x.title, role: x.role, year: x.year, descr: x.desc }; }));
    }).then(function () {
      return sync('projects', state.projects.map(function (x, i) { return { id: x.id, sort: i, title: x.title, descr: x.desc, url: x.url, image_url: x.image }; }));
    }).then(function () {
      return sync('timeline', state.timeline.map(function (x, i) { return { id: x.id, sort: i, label: x.label, year: x.year, body: x.text, is_now: !!x.now }; }));
    }).then(function () {
      return sync('channels', state.channels.map(function (x, i) { return { id: x.id, sort: i, name: x.name, handle: x.handle, url: x.url, descr: x.desc }; }));
    }).then(function () {
      view.saving = false; view.dirty = false; renderSite(); updateBar(); toast('Tersimpan');
      cleanImages();
    }).catch(function (e) {
      view.saving = false;
      view.msg = /row-level security|permission|JWT/i.test((e && e.message) || '') ? 'Akun ini tidak punya izin menyimpan. Pakai email pemilik yang terdaftar di schema.sql.' : 'Gagal menyimpan: ' + ((e && e.message) || 'coba lagi');
      updateBar();
    });
  }


  // Hapus gambar di Storage yang tidak dipakai lagi (dihapus dari situs, atau diunggah tapi batal disimpan).
  function cleanImages() {
    var c = KZ.client(), used = {};
    [state.profile.photo].concat(state.projects.map(function (x) { return x.image; })).forEach(function (u) {
      var m = /\/portfolio\/(img\/[^?#]+)/.exec(u || ''); if (m) used[decodeURIComponent(m[1])] = 1;
    });
    c.storage.from('portfolio').list('img', { limit: 1000 }).then(function (r) {
      if (r.error || !r.data) return;
      var gone = r.data.map(function (f) { return 'img/' + f.name; }).filter(function (p) { return !used[p]; });
      if (gone.length) c.storage.from('portfolio').remove(gone);
    });
  }
  window.addEventListener('beforeunload', function (e) {
    if (view.dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  function showApp(user) {
    document.getElementById('login').hidden = true;
    KZ.loadState().then(function (s) {
      setState(s); view.canEdit = true; view.open = true;
      renderSite(); renderPanel();
    }, function () { KZ.showError('Data tidak bisa dimuat. Jalankan supabase/schema.sql dulu.'); });
  }
  function boot() {
    var c = KZ.client(), form = document.getElementById('login-form'), msg = document.getElementById('login-msg');
    if (!c) { document.getElementById('login').hidden = false; msg.textContent = 'Isi URL dan anon key Supabase di config.js dulu.'; form.hidden = true; return; }
    c.auth.getSession().then(function (r) {
      if (r.data && r.data.session) showApp(r.data.session.user); else document.getElementById('login').hidden = false;
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); msg.textContent = 'Masuk…';
      c.auth.signInWithPassword({ email: form.email.value.trim(), password: form.password.value }).then(function (r) {
        if (r.error) { msg.textContent = 'Email atau password salah.'; return; }
        showApp(r.data.user);
      });
    });
  }
  boot();
})();
