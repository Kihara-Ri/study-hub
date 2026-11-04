(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const body = document.body, root = document.documentElement;
const view = $("#view"), dock = $("#dock"), frame = $("#book"), sideEl = $("#side"), crumb = $("#crumb"), prog = $("#prog");
const wide = matchMedia("(min-width:1100px)");
const BASE = location.pathname.replace(/[^/]*$/, "");          // 外壳所在目录（形如 /study-hub/）
const BOOKS = new URL($("meta[name=books-root]")?.content || "./", location.href).pathname;   // 各本书所在的目录

const I = {
  menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  home: '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7M6 10v9h12v-9"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  auto: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4v16" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
  light: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></svg>',
  dark: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/></svg>',
};

let data = { groups: [], books: [], updated: "" };
let bySlug = {};
const st = { slug: null, inst: null, toc: [], cur: null, tok: 0 };       // 当前打开的书；inst 是原生渲染器的实例

/* ---------------------------------------------------------------- 主题 */
const MODES = ["auto", "light", "dark"], MODE_NAME = { auto: "自动", light: "浅色", dark: "深色" };
let mode = LS.get("hub:theme", "auto");
if (!MODES.includes(mode)) mode = "auto";

function applyTheme(doc) {
  const el = (doc || document).documentElement;
  if (mode === "auto") el.removeAttribute("data-theme"); else el.dataset.theme = mode;
}
function paintTheme() {
  const b = $("#theme");
  b.innerHTML = I[mode];
  b.setAttribute("aria-label", "主题：" + MODE_NAME[mode] + "（点击切换）");
  b.title = "主题：" + MODE_NAME[mode];
}
$("#theme").addEventListener("click", () => {
  mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
  LS.set("hub:theme", mode);
  applyTheme(); paintTheme();
  try { applyTheme(frame.contentDocument); } catch {}
});

/* ---------------------------------------------------------------- 最近阅读 */
const recent = () => LS.get("hub:recent", []).filter(r => bySlug[r.slug]);
function touch(slug, rest, title) {
  const list = recent().filter(r => r.slug !== slug);
  list.unshift({ slug, rest, title: title || "", ts: Date.now() });
  LS.set("hub:recent", list.slice(0, 8));
}
function ago(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return m + " 分钟前";
  const h = Math.round(m / 60);
  if (h < 24) return h + " 小时前";
  const d = Math.round(h / 24);
  return d === 1 ? "昨天" : d + " 天前";
}
const routeOf = (slug, rest) => "#/b/" + slug + (rest ? "/" + rest : "");

/* ---------------------------------------------------------------- 侧栏 */
function renderSide() {
  const groups = data.groups.map(g => {
    const items = data.books.filter(b => b.group === g.id);
    if (!items.length) return "";
    return `<h3>${esc(g.name)}</h3>` + items.map(b =>
      `<a class="item" href="#/b/${b.slug}" data-slug="${b.slug}" style="--a:${b.accent}">
         <span class="gl">${esc(b.glyph)}</span>
         <span class="t">${esc(b.short || b.title)}<small>${esc(b.title)}</small></span>
         ${b.locked ? I.lock.replace("<svg", '<svg class="lk"') : ""}
       </a>`).join("");
  }).join("");
  sideEl.innerHTML = `
    <div class="side-h"><b>学习台</b><button class="ib" type="button" id="sideClose" aria-label="关闭目录">${I.close}</button></div>
    <div class="side-b">
      <a class="item" href="#/" data-slug=""><span class="home-ic">${I.home}</span><span class="t">全部书目</span></a>
      ${groups}
    </div>
    <div class="side-f"><a href="about.html">内容来源与限制</a><a href="https://github.com/Kihara-Ri/study-hub" target="_blank" rel="noopener">GitHub</a></div>`;
  $("#sideClose").addEventListener("click", () => setSide(false));
  markSide();
}
function renderToc() {
  sideEl.querySelectorAll(".toc").forEach(n => n.remove());
  if (!st.slug || !st.toc.length) return;
  const a = sideEl.querySelector(`.item[data-slug="${st.slug}"]`);
  if (!a) return;
  const box = document.createElement("div");
  box.className = "toc";
  let grp = null, html = "";
  for (const t of st.toc) {
    if (t.group && t.group !== grp) { grp = t.group; html += `<div class="sub">${esc(grp)}</div>`; }
    html += t.href
      ? `<a href="${esc(BOOKS + st.slug + "/" + t.href)}" target="_blank" rel="noopener" data-key="">${esc(t.label)} ↗</a>`
      : `<a href="${routeOf(st.slug, t.rest)}" data-key="${esc(t.key)}">${esc(t.label)}</a>`;
  }
  box.innerHTML = html;
  a.after(box);
  markToc(true);
}
function markToc(center) {
  sideEl.querySelectorAll(".toc a").forEach(a => {
    if (a.dataset.key === String(st.cur)) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  if (center && (wide.matches || body.classList.contains("side-open"))) centerToc();
}
function centerToc() {
  const a = sideEl.querySelector(".toc a[aria-current]");
  if (a) a.scrollIntoView({ block: "nearest" });
}
function markSide() {
  sideEl.querySelectorAll(".item").forEach(a => {
    if (a.dataset.slug === (st.slug || "")) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}
function setSide(open) {
  body.classList.toggle("side-open", open);
  $("#menu").setAttribute("aria-expanded", String(open));
  $("#menu").setAttribute("aria-label", open ? "收起目录" : "打开目录");
  if (open) { setBar(true); centerToc(); }
}
function togglePin() {
  const pin = !body.classList.contains("pin");
  body.classList.toggle("pin", pin);
  LS.set("hub:pin", pin);
  $("#menu").setAttribute("aria-expanded", String(pin));
}
$("#menu").addEventListener("click", () => {
  if (wide.matches) togglePin(); else setSide(!body.classList.contains("side-open"));
});
$("#scrim").addEventListener("click", () => setSide(false));
addEventListener("keydown", e => { if (e.key === "Escape") setSide(false); });
sideEl.addEventListener("click", e => { if (e.target.closest("a.item, .toc a") && !wide.matches) setSide(false); });
function syncLayout() {
  const pin = wide.matches && LS.get("hub:pin", true);
  body.classList.toggle("pin", !!pin);
  if (wide.matches) body.classList.remove("side-open");
  $("#menu").setAttribute("aria-expanded", String(!!pin));
  $("#menu").setAttribute("aria-label", wide.matches ? "显示/隐藏目录" : "打开目录");
}
wide.addEventListener("change", syncLayout);

/* ---------------------------------------------------------------- 首页 */
function badges(b) {
  const out = [];
  out.push(b.locked ? `<span class="bdg">${I.lock}需要密码</span>` : `<span class="bdg">直接打开</span>`);
  if (b.interactive) out.push(`<span class="bdg">可交互</span>`);
  return out.join("");
}
function renderHome() {
  const rec = recent();
  let cont = "";
  if (rec.length) {
    const r = rec[0], b = bySlug[r.slug];
    const sub = r.title && r.title !== b.title && r.title !== b.short ? r.title : b.meta;
    cont = `<section class="sec"><h2>继续学习</h2>
      <a class="resume" href="${routeOf(r.slug, r.rest)}" style="--a:${b.accent}">
        <span class="gl">${esc(b.glyph)}</span>
        <span class="t"><b>${esc(b.title)}</b><small>${esc(sub)} · ${ago(r.ts)}</small></span>
        <span class="go">继续${I.arrow.replace("<svg", '<svg width="18" height="18"')}</span>
      </a>
      ${rec.length > 1 ? `<div class="chips">${rec.slice(1, 6).map(x => {
        const bb = bySlug[x.slug];
        return `<a class="chip" href="${routeOf(x.slug, x.rest)}" style="--a:${bb.accent}"><span class="gl">${esc(bb.glyph)}</span>${esc(bb.short || bb.title)}</a>`;
      }).join("")}</div>` : ""}
    </section>`;
  }
  const groups = data.groups.map(g => {
    const items = data.books.filter(b => b.group === g.id);
    if (!items.length) return "";
    return `<section class="sec" data-g="${g.id}"><h2>${esc(g.name)}</h2><div class="grid">${items.map(b =>
      `<a class="card" href="#/b/${b.slug}" data-q="${esc((b.title + b.short + b.meta + b.desc + (b.keywords || "")).toLowerCase())}" style="--a:${b.accent}">
        <div class="hd"><span class="gl">${esc(b.glyph)}</span><div><h3>${esc(b.title)}</h3></div></div>
        <p class="meta">${esc(b.meta)}</p>
        <p class="desc">${esc(b.desc)}</p>
        <div class="badges">${badges(b)}</div>
      </a>`).join("")}</div></section>`;
  }).join("");
  view.innerHTML = `<div class="hub-home">
    <h1>学习台</h1>
    <p class="lead">自己在学的几门语言和几本书，放在同一个地方。浏览器里直接打开，进度和收藏只存在本机，不需要注册。</p>
    <label class="search">${I.search}<input id="q" type="search" placeholder="搜索书名或主题，如：日语、色彩、字母" autocomplete="off" enterkeyhint="search"></label>
    ${cont}
    <div id="shelves">${groups}</div>
    <p class="empty" id="none" hidden>没有找到匹配的书。</p>
    <footer class="foot">
      日语跟读与韩语课程的内容整理自正式出版的教材，版权归原作者及出版方所有，仅供个人学习使用，请勿转发或商用。
      阿拉伯语、法语课程为自编教材；韩/阿/法发音由 edge-tts 合成。<br>
      <a href="about.html">关于内容来源与已知限制 →</a>${data.updated ? ` · 更新于 ${esc(data.updated)}` : ""}
    </footer>
  </div>`;
  $("#q").addEventListener("input", filterBooks);
}
function filterBooks() {
  const q = $("#q").value.trim().toLowerCase();
  let shown = 0;
  view.querySelectorAll(".card").forEach(c => {
    const hit = !q || q.split(/\s+/).every(w => c.dataset.q.includes(w));
    c.hidden = !hit; if (hit) shown++;
  });
  view.querySelectorAll("#shelves .sec").forEach(s => { s.hidden = ![...s.querySelectorAll(".card")].some(c => !c.hidden); });
  $("#none").hidden = shown > 0;
}

/* ---------------------------------------------------------------- 书（嵌入） */
const splitRest = rest => {
  const i = rest.indexOf("#");
  let path = i < 0 ? rest : rest.slice(0, i);
  const hash = i < 0 ? "" : rest.slice(i);
  try { path = decodeURI(path); } catch {}
  if (path === "index.html") path = "";
  return [path, hash];
};
function frameRest() {                                            // iframe 当前位置 → rest 字符串
  if (!st.slug) return null;
  try {
    const l = frame.contentWindow.location;
    if (l.href === "about:blank") return null;
    const pre = BOOKS + st.slug + "/";
    if (!l.pathname.startsWith(pre)) return null;
    let path = l.pathname.slice(pre.length);
    try { path = decodeURI(path); } catch {}
    if (path === "index.html") path = "";
    return path + l.hash;
  } catch { return null; }
}
function loading(on) {
  prog.classList.remove("done");
  if (on) { prog.style.width = "0"; void prog.offsetWidth; prog.style.width = ""; prog.classList.add("on"); }
  else { prog.classList.remove("on"); prog.classList.add("done"); setTimeout(() => prog.classList.remove("done"), 400); }
}
function showHome() {
  ++st.tok; destroyInst();
  st.slug = null;
  frame.hidden = true;
  if (frame.getAttribute("src") !== "about:blank") frame.src = "about:blank";   // 停掉音频
  view.hidden = false;
  crumb.hidden = true;
  document.title = "学习台";
  setBar(true); loading(false); renderHome(); markSide();
}
function openBook(slug, rest) {
  const b = bySlug[slug];
  if (!b) { location.replace("#/"); return; }
  if (b.type === "legacy") { ++st.tok; destroyInst(); view.hidden = true; return openLegacy(b, rest); }
  if (rest.startsWith("#/")) rest = rest.slice(2);                // 旧链接 jp-shadowing/#/lesson/07
  return openNative(b, rest);
}
function openLegacy(b, rest) {
  const slug = b.slug;
  const [path, hash] = splitRest(rest);
  const target = path + hash;
  const cur = st.slug === slug ? frameRest() : null;
  st.slug = slug;
  frame.hidden = false;
  crumb.hidden = false; crumb.textContent = b.short || b.title;
  document.title = (b.short || b.title) + " · 学习台";
  markSide();
  if (cur === target) return;
  if (cur != null && splitRest(cur)[0] === path) {                // 同一页，只换 hash
    try { frame.contentWindow.location.hash = hash; return; } catch {}
  }
  loading(true);
  frame.src = BOOKS + slug + "/" + encodeURI(path) + hash;
}
/* 原生渲染器（按需加载 <type>.js / <type>.css） */
const RENDERERS = {
  course: { js: "course.js", css: "course.css", global: "HubCourse" },
  lang: { js: "lang.js", css: "lang.css", global: "HubLang" },
};
const loaded = {};
const loadRenderer = type => loaded[type] ||= new Promise((ok, no) => {
  const r = RENDERERS[type];
  if (!r) return no(new Error("未知类型 " + type));
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = r.css; document.head.append(l);
  const sc = document.createElement("script"); sc.src = r.js; sc.onload = () => ok(window[r.global]); sc.onerror = no; document.head.append(sc);
});
function makeCtx(b) {
  const key = b.storeKey || "hub:" + b.slug;
  const d = LS.get(key, {});
  return {
    book: b, view, dock, base: BOOKS + b.slug + "/",
    href: r => routeOf(b.slug, r),
    go: r => { location.hash = routeOf(b.slug, r); },
    store: { get: (k, def) => d[k] ?? def, set: (k, v) => { d[k] = v; LS.set(key, d); } },
    setToc(items) { st.toc = items; renderToc(); },
    setCurrent(k) { st.cur = k; markToc(true); },
    touch: (rest, title) => touch(b.slug, rest, title),
  };
}
function destroyInst() {
  if (st.inst) { try { st.inst.destroy(); } catch (e) { console.error(e); } }
  st.inst = null; st.toc = []; st.cur = null; renderToc();
}
async function openNative(b, rest) {
  const slug = b.slug, tok = ++st.tok;
  frame.hidden = true;
  if (frame.getAttribute("src") !== "about:blank") frame.src = "about:blank";
  if (st.slug !== slug || !st.inst) {
    destroyInst();
    st.slug = slug;
    view.hidden = false; view.replaceChildren();
    crumb.hidden = false; crumb.textContent = b.short || b.title;
    document.title = (b.short || b.title) + " · 学习台";
    markSide();
    try {
      const make = await loadRenderer(b.engine || b.type);
      if (tok !== st.tok) return;
      st.inst = make(makeCtx(b));
    } catch (e) {
      console.error(e);
      view.innerHTML = '<div class="hub-home"><p class="empty">这本书加载失败，请刷新重试。</p></div>';
      return;
    }
  }
  await st.inst.route(rest);
}

const HIDE_CSS = ".hub-back,#backhome,.backhome,.gback,nav a[href='../index.html']{display:none!important}";
frame.addEventListener("load", () => {
  let w, d;
  try { w = frame.contentWindow; d = w.document; } catch { return; }
  if (w.location.href === "about:blank" || !st.slug) return;
  loading(false);
  const s = d.createElement("style"); s.textContent = HIDE_CSS; (d.head || d.documentElement).appendChild(s);
  applyTheme(d);
  w.addEventListener("hashchange", sync);
  w.addEventListener("scroll", () => onScroll(w.scrollY), { passive: true });
  d.addEventListener("click", e => {                              // 书里指向学习台首页的链接 → 回壳的首页
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.target === "_blank") return;
    const u = new URL(a.href, w.location.href);
    if (u.origin === location.origin && [BASE, BOOKS].some(r => u.pathname === r || u.pathname === r + "index.html")) {
      e.preventDefault(); location.hash = "#/";
    }
  });
  sync();
});
function sync() {
  const rest = frameRest();
  if (rest == null) return;
  const want = routeOf(st.slug, rest);
  if (decodeURI(location.hash) !== decodeURI(want)) history.replaceState(null, "", location.pathname + location.search + want);
  let t = ""; try { t = frame.contentDocument.title || ""; } catch {}
  const b = bySlug[st.slug];
  if (t) document.title = (t === b.title || t === b.short ? b.short || b.title : t) + " · 学习台";
  touch(st.slug, rest, t);
}

/* ---------------------------------------------------------------- 手机：向下滑动时收起顶栏 */
let lastY = 0, lock = 0;
function setBar(on) {
  if (body.classList.contains("bar-off") === !on) return;
  body.classList.toggle("bar-off", !on);
  lock = Date.now() + 400;
}
view.addEventListener("scroll", () => { if (st.inst) onScroll(view.scrollTop); }, { passive: true });
function onScroll(y) {
  if (wide.matches || body.classList.contains("side-open")) return;
  if (Date.now() < lock) { lastY = y; return; }
  const dy = y - lastY;
  if (Math.abs(dy) < 12) return;
  lastY = y;
  setBar(!(dy > 0 && y > 80));
}

/* ---------------------------------------------------------------- 路由 */
function route() {
  const m = location.hash.replace(/^#/, "").match(/^\/b\/([^/]+)(?:\/(.*))?$/);
  if (m) openBook(m[1], m[2] || ""); else showHome();
}
addEventListener("hashchange", route);
addEventListener("pagehide", () => { if (st.slug && !st.inst) sync(); });
new ResizeObserver(() => root.style.setProperty("--dock-h", dock.hidden ? "0px" : dock.offsetHeight + "px")).observe(dock);

/* ---------------------------------------------------------------- 启动 */
fetch("books.json", { cache: "no-cache" }).then(r => r.json()).then(j => {
  data = j;
  bySlug = Object.fromEntries(j.books.map(b => [b.slug, b]));
  paintTheme(); syncLayout(); renderSide(); route();
}).catch(() => {
  view.innerHTML = '<div class="hub-home"><p class="empty">书目加载失败，请刷新重试。</p></div>';
});
})();
