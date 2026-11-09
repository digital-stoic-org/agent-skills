/* gist:commit file viewer (commit-view.html). Read-only: Rendered / Diff / Raw per changed file.
   Data = #view-data, written by make-page.py from the scan (diffs and snapshot copies taken at scan time).
   Live files are fetched from the same http server; a FNV-1a hash flags a file changed since the snapshot
   (crypto.subtle does not exist on a plain-http origin). Route = #p=<project>&f=<path>&t=<tab>. */
(function () {
  'use strict';
  const D = JSON.parse(document.getElementById('view-data').textContent);
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const KL = { har: 'harness', stg: 'steering', trc: 'trace', dlv: 'deliverable', inp: 'input', gen: 'generated' };
  const SL = { A: 'added', M: 'modified', R: 'moved', D: 'deleted', T: 'type changed', U: 'unmerged' };
  const P = {}; D.projects.forEach(p => { P[p.id] = p; });
  const byName = {};  // wikilink target -> [project id, path], changed files only
  D.projects.forEach(p => p.files.forEach(f => {
    const b = f.path.split('/').pop().replace(/\.(md|markdown)$/i, '').toLowerCase();
    if (!(b in byName)) byName[b] = [p.id, f.path];
  }));
  const liveUrl = path => D.live_base + '/' + path.split('/').map(encodeURIComponent).join('/');
  const route = (p, f, t) => '#' + new URLSearchParams(Object.assign({ p: p, f: f }, t ? { t: t } : {})).toString();
  const dirOf = path => path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : '';
  const norm = path => { const o = []; path.split('/').forEach(s => { if (s === '..') o.pop(); else if (s !== '.' && s !== '') o.push(s); }); return o.join('/'); };

  /* theme: same key as the verdict pages, so one choice for the radar and the viewer */
  const TK = 'verdict:theme', TL = { auto: 'theme: auto', light: 'theme: light', dark: 'theme: dark' }, TN = { auto: 'light', light: 'dark', dark: 'auto' };
  let theme; try { theme = localStorage.getItem(TK); } catch (e) {}
  if (!TL[theme]) theme = 'auto';
  const isDark = () => theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  const applyTheme = () => { if (theme === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = theme; $('theme').textContent = TL[theme]; };
  applyTheme();
  $('theme').onclick = () => { theme = TN[theme]; try { localStorage.setItem(TK, theme); } catch (e) {} applyTheme(); show(); };

  /* Markdown: GFM, wikilinks, mermaid blocks, relative links resolved against the file's folder */
  let curPath = '';
  if (window.marked) {
    marked.use({
      gfm: true,
      extensions: [{
        name: 'wikilink', level: 'inline',
        start(src) { const i = src.indexOf('[['); return i < 0 ? undefined : (i > 0 && src[i - 1] === '!' ? i - 1 : i); },
        tokenizer(src) {
          const m = /^!?\[\[([^\]|#]+)(#[^\]|]*)?(?:\|([^\]]+))?\]\]/.exec(src);
          if (m) return { type: 'wikilink', raw: m[0], target: m[1].trim(), label: (m[3] || m[1]).trim(), embed: m[0][0] === '!' };
        },
        renderer(t) {
          const hit = byName[t.target.split('/').pop().replace(/\.(md|markdown)$/i, '').toLowerCase()];
          const lbl = (t.embed ? '↳ ' : '') + esc(t.label);
          return hit ? `<a class="wl" href="${route(hit[0], hit[1])}">${lbl}</a>` : `<span class="wl" title="wikilink, target not in this changeset">${lbl}</span>`;
        }
      }],
      renderer: {
        code(t) { return t.lang === 'mermaid' ? `<pre class="mermaid">${esc(t.text)}</pre>` : false; },
        link(t) { const h = rel(t.href); return h === t.href ? false : `<a href="${esc(h)}"${t.title ? ` title="${esc(t.title)}"` : ''}>${this.parser.parseInline(t.tokens)}</a>`; },
        image(t) { const h = rel(t.href); return `<img src="${esc(h)}" alt="${esc(t.text || '')}">`; }
      }
    });
  }
  function rel(href) {
    if (!href || /^([a-z][a-z0-9+.-]*:|#|\/)/i.test(href)) return href;
    const [p, frag] = href.split('#'), target = norm(dirOf(curPath) + decodeURIComponent(p));
    for (const pr of D.projects) for (const f of pr.files) if (f.path === target) return route(pr.id, f.path);
    return liveUrl(target) + (frag ? '#' + frag : '');
  }
  function frontmatter(text) {
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
    if (!m) return ['', text];
    const rows = m[1].split(/\r?\n/).map(l => { const k = /^([\w.-]+):\s?(.*)$/.exec(l); return k ? `<tr><td>${esc(k[1])}</td><td>${esc(k[2])}</td></tr>` : `<tr><td></td><td>${esc(l)}</td></tr>`; });
    return [`<table class="fm">${rows.join('')}</table>`, text.slice(m[0].length)];
  }
  let mermaidTheme = null;
  async function runMermaid(root) {
    const nodes = root.querySelectorAll('pre.mermaid');
    if (!nodes.length || !window.mermaid) return;
    const t = isDark() ? 'dark' : 'neutral';
    if (t !== mermaidTheme) { mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: t }); mermaidTheme = t; }
    try { await mermaid.run({ nodes: nodes }); } catch (e) { root.insertAdjacentHTML('afterbegin', `<div class="ban warn">Mermaid could not draw a diagram: ${esc(e.message || e)}</div>`); }
  }

  /* FNV-1a 32 bits over the raw bytes, same as viewdata.py */
  function fnv(bytes) { let h = 0x811c9dc5; for (let i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); }

  /* content of a file: snapshot copy, or a fetch of the live file (cached per path) */
  const cache = {};
  function load(f) {
    if (f.src === 'snap') return Promise.resolve(f.snap ? { text: f.snap.text, url: f.snap.url, changed: false } : { error: f.note || 'no copy' });
    if (f.src !== 'live') return Promise.resolve({ error: f.note || 'not shown' });
    if (!cache[f.path]) cache[f.path] = fetch(liveUrl(f.path), { cache: 'no-store' }).then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.arrayBuffer();
    }).then(buf => {
      const b = new Uint8Array(buf);
      return { text: new TextDecoder('utf-8').decode(b), url: liveUrl(f.path), changed: f.hash ? fnv(b) !== f.hash : false };
    }).catch(e => ({ error: 'live file unreachable (' + e.message + '): page opened as a file, or the file moved since the snapshot', url: liveUrl(f.path) }));
    return cache[f.path];
  }

  /* state */
  let cur = { p: null, f: null, t: null };
  const order = p => p.files;
  function defaultTab(f) {
    if (f.diff && f.diff.hunks && (f.st === 'M' || f.st === 'R' || f.st === 'T')) return 'diff';
    return 'rendered';
  }
  function parseHash() {
    const q = new URLSearchParams(location.hash.slice(1));
    let p = P[q.get('p')] || D.projects[0];
    if (!p) return null;
    let f = p.files.find(x => x.path === q.get('f')) || p.files[0];
    return { p: p, f: f, t: ['rendered', 'diff', 'raw'].includes(q.get('t')) ? q.get('t') : null };
  }

  function sidebar(p) {
    $('pname').textContent = p.name;
    $('pinfo').textContent = '· ' + p.repo + ' · ' + p.files.length + ' files';
    $('proj').value = p.id;
    let h = '', last = null, lastFolder = null;
    for (const f of p.files) {
      if (f.kind !== last) {
        const n = p.files.filter(x => x.kind === f.kind).length;
        h += `<div class="kg"><i class="sq k-${f.kind}"></i>${KL[f.kind] || f.kind} ${n}</div>`; last = f.kind; lastFolder = null;
      }
      if (f.folder && f.folder !== lastFolder) { h += `<div class="fi mute"><code class="st">?</code><span class="nm">${esc(f.folder.replace(/\/$/, '').split('/').pop())}/</span></div>`; lastFolder = f.folder; }
      const name = f.folder ? f.path.slice(f.folder.length) : f.path.split('/').pop();
      const marks = (f.secret ? ' ⛔' : '') + (f.partial ? ' ½' : '');
      h += `<a class="fi${f === cur.f ? ' on' : ''}" href="${route(p.id, f.path)}" title="${esc((SL[f.st] || f.st) + ' · ' + f.path + (f.orig ? ' ← ' + f.orig : ''))}"><code class="st st-${f.st}">${f.st}</code><span class="nm${f.folder ? ' in' : ''}">${esc(name)}${marks}</span></a>`;
    }
    $('flist').innerHTML = h;
    const on = $('flist').querySelector('.fi.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  }

  function bannerHTML(f, c) {
    const b = [];
    if (f.secret) b.push(['no', '⛔ Sensitive path: never read, never shown by this page.']);
    if (f.st === 'D') b.push(['no', `🗑️ Deleted. Content as of HEAD ${esc(f.rev || '')}.`]);
    if (c && c.changed) b.push(['warn', '⚠️ Changed since the snapshot: the live file differs from the scanned one. Rescan with /gist:commit before committing.']);
    if (c && c.error) b.push(['warn', '⚠️ ' + esc(c.error)]);
    if (f.partial) b.push(['info', '½ Partly staged: the diff shows staged and unstaged changes together, as the commit block runs git add -A.']);
    if (f.src === 'snap' && f.st !== 'D') b.push(['info', 'Copy taken at scan time: this repo is not served by the http server.']);
    return b.map(([k, t]) => `<div class="ban ${k}">${t}</div>`).join('');
  }

  function diffHTML(f) {
    const d = f.diff;
    if (f.st === 'A') return `<p class="empty">New file${f.lines != null ? ', ' + f.lines + ' lines' : ''}: see Rendered or Raw.</p>`;
    if (f.st === 'D') return '<p class="empty">Deleted file: Rendered shows the HEAD version.</p>';
    if (!d) return `<p class="empty">No diff${f.lang === 'img' || f.lang === 'bin' || f.lang === 'pdf' ? ` (binary, ${f.size_before ?? '?'} → ${f.size_after ?? '?'} bytes)` : ''}.</p>`;
    if (d.note === 'binary') return `<p class="empty">Binary file, ${f.size_before ?? '?'} → ${f.size_after ?? '?'} bytes.</p>`;
    if (d.note === 'too big') return `<p class="empty">Diff too big to show (${d.size} characters, +${d.add ?? '?'} −${d.dele ?? '?'}): use Raw.</p>`;
    if (!d.hunks.length) return '<p class="empty">No content change (mode or rename only).</p>';
    const prose = d.mode === 'word' ? ' prose' : '';
    let h = '';
    for (const hk of d.hunks) {
      let a = hk.a, b = hk.b;
      h += `<div class="dh">@@ −${hk.a} +${hk.b}${hk.h ? ' · ' + esc(hk.h) : ''}</div>`;
      for (const line of hk.lines) {
        const types = new Set(line.filter(s => s[1] !== '' || line.length === 1).map(s => s[0]));
        const kind = types.size === 1 && types.has('+') ? 'ad' : types.size === 1 && types.has('-') ? 'rm' : types.has('+') || types.has('-') ? 'mx' : 'ctx';
        const n = kind === 'rm' ? a : b;
        const body = kind === 'mx' ? line.map(s => s[0] === '+' ? `<ins>${esc(s[1])}</ins>` : s[0] === '-' ? `<del>${esc(s[1])}</del>` : esc(s[1])).join('') : esc(line.map(s => s[1]).join(''));
        const sg = kind === 'ad' ? '+' : kind === 'rm' ? '−' : kind === 'mx' ? '~' : ' ';
        h += `<div class="dl ${kind}${prose}"><span class="ln">${n}</span><span class="sg">${sg}</span><span>${body || ' '}</span></div>`;
        if (kind !== 'rm') b++;
        if (kind !== 'ad') a++;
      }
    }
    return h;
  }

  async function renderedHTML(f, c, pane) {
    if (f.secret) return;
    if (c.error && !c.url) { pane.innerHTML = '<p class="empty">Nothing to show.</p>'; return; }
    const L = f.lang;
    if (L === 'html') {
      const live = f.src === 'live';
      pane.innerHTML = (live ? `<p class="mute"><a href="${esc(c.url)}" target="_blank" rel="noopener">open in its own tab ↗</a> · scripts run sandboxed</p>` : '<p class="mute">Snapshot copy: relative assets may not load; inline scripts are blocked.</p>') +
        `<iframe class="frame" sandbox="allow-scripts allow-popups" referrerpolicy="no-referrer"${live ? ` src="${esc(c.url)}"` : ''}></iframe>`;
      if (!live) pane.querySelector('iframe').srcdoc = c.text || '';
      return;
    }
    if (L === 'img' || (L === 'svg' && !c.text)) { pane.innerHTML = `<img class="img" src="${esc(c.url)}" alt="${esc(f.path)}">`; return; }
    if (L === 'svg') { pane.innerHTML = `<img class="img" src="${esc(f.src === 'live' ? c.url : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(c.text))}" alt="${esc(f.path)}">`; return; }
    if (L === 'pdf') {
      let u = c.url;
      if (u && u.startsWith('data:')) u = URL.createObjectURL(await (await fetch(u)).blob());
      pane.innerHTML = `<iframe class="frame" src="${esc(u)}"></iframe>`; return;
    }
    if (L === 'bin') { pane.innerHTML = `<p class="empty">Binary file, ${f.size_after ?? f.size_before ?? '?'} bytes: no rendering.</p>`; return; }
    if (c.text == null) { pane.innerHTML = '<p class="empty">Nothing to show.</p>'; return; }
    if (L === 'md' && window.marked) {
      const [fm, body] = frontmatter(c.text);
      pane.innerHTML = `<div class="md">${fm}${marked.parse(body)}</div>`;
      await runMermaid(pane); return;
    }
    if (L === 'mmd') { pane.innerHTML = `<pre class="mermaid">${esc(c.text)}</pre>`; await runMermaid(pane); return; }
    pane.innerHTML = `<pre class="raw">${esc(c.text)}</pre>`;
  }

  let token = 0;
  async function show() {
    const r = parseHash();
    if (!r) { $('pane').innerHTML = '<p class="empty">Nothing changed in this snapshot.</p>'; return; }
    const f = r.f, p = r.p, t = r.t || defaultTab(f), my = ++token;
    cur = { p: p, f: f, t: t };
    curPath = f.path;
    sidebar(p);
    document.title = f.path.split('/').pop() + ' · Files · gist:commit';
    $('fst').textContent = f.st; $('fst').className = 'st st-' + f.st;
    $('fpath').textContent = f.path + (f.orig ? '  ← ' + f.orig : '');
    $('fmeta').textContent = '· ' + (KL[f.kind] || f.kind) + ' · ' + p.repo + (f.src === 'live' ? ' · live' : f.src === 'snap' ? ' · snapshot' : '');
    const d = f.diff && f.diff.hunks ? f.diff : null;
    $('tinfo').textContent = d ? `+${d.add ?? '?'} −${d.dele ?? '?'} · ${d.hunks.length} hunk${d.hunks.length > 1 ? 's' : ''} · vs HEAD${d.mode === 'word' ? ' · word diff' : ''}` : '';
    document.querySelectorAll('.tabs button').forEach(b => { b.setAttribute('aria-selected', String(b.dataset.t === t)); b.disabled = f.secret; });
    $('vw').classList.toggle('vfile', !!new URLSearchParams(location.hash.slice(1)).get('f'));
    const pane = $('pane');
    pane.innerHTML = '<p class="empty">Loading…</p>';
    $('bans').innerHTML = bannerHTML(f, null);
    if (f.secret) { pane.innerHTML = '<p class="empty">Not shown.</p>'; return; }
    if (t === 'diff') { pane.innerHTML = diffHTML(f); }
    const c = await load(f);
    if (my !== token) return;  // the user moved on while the file was loading
    $('bans').innerHTML = bannerHTML(f, c);
    if (t === 'raw') pane.innerHTML = c.text != null && f.lang !== 'img' && f.lang !== 'pdf' && f.lang !== 'bin' ? `<pre class="raw">${esc(c.text)}</pre>` : '<p class="empty">No text to show.</p>';
    else if (t === 'rendered') await renderedHTML(f, c, pane);
  }

  /* controls */
  $('proj').innerHTML = D.projects.map(p => `<option value="${esc(p.id)}">${esc(p.name)} · ${p.files.length}</option>`).join('');
  $('proj').onchange = e => { const p = P[e.target.value]; location.hash = route(p.id, p.files[0].path); };
  document.querySelectorAll('.tabs button').forEach(b => { b.onclick = () => { location.hash = route(cur.p.id, cur.f.path, b.dataset.t); }; });
  const step = k => { const fs = order(cur.p), i = fs.indexOf(cur.f) + k; if (i >= 0 && i < fs.length) location.hash = route(cur.p.id, fs[i].path); };
  $('prev').onclick = () => step(-1); $('next').onclick = () => step(1);
  $('back').onclick = () => { location.hash = '#' + new URLSearchParams({ p: cur.p.id }).toString(); };
  document.addEventListener('keydown', e => {
    if (e.target.closest('select,input,textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'j') step(1); else if (e.key === 'k') step(-1);
    else if (e.key === '1' || e.key === '2' || e.key === '3') location.hash = route(cur.p.id, cur.f.path, ['rendered', 'diff', 'raw'][+e.key - 1]);
  });
  window.addEventListener('hashchange', show);
  const snap = new Date(D.generated_at);
  $('snap').textContent = 'snapshot ' + (isNaN(snap) ? D.generated_at : snap.toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }));
  show();
})();
