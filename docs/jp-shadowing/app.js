"use strict";
/* 影子跟读：单页静态应用。路由 #/  #/expr  #/lesson/NN[/行号] */

const $ = (s, r = document) => r.querySelector(s);
const app = $("#app");
const bar = $("#bar");
/* 挂载页面：展开数组并丢弃 null，避免被当成文字渲染 */
const mount = (...nodes) => app.replaceChildren(...nodes.flat(Infinity).filter(Boolean));

/* ---------- 小工具 ---------- */
function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k === "html") n.innerHTML = v; // 仅用于构建期已转义的注音 HTML
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat()) if (k != null) n.append(k.nodeType ? k : document.createTextNode(k));
  return n;
}
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
/* ---------- 加密模式：公开部署时数据与音频都是密文，凭密码在浏览器里解密 ---------- */
const LOCKED = !!document.querySelector('meta[name="jps-lock"]');
let aesKey = null;
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function decryptBin(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(path);
  const buf = new Uint8Array(await r.arrayBuffer());
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: buf.slice(0, 12) }, aesKey, buf.slice(12));
}
async function tryPassword(pw) {
  const meta = await (await fetch("lock.json")).json();
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  aesKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: b64(meta.salt), iterations: meta.iter, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  await decryptBin("data/check.bin"); // 密码错误时这里会抛错
}
function unlock() {
  return new Promise(resolve => {
    const saved = (() => { try { return sessionStorage.getItem("jps-pw"); } catch { return null; } })();
    const done = pw => { try { sessionStorage.setItem("jps-pw", pw); } catch { /* ignore */ } gate.remove(); resolve(); };
    const input = el("input", { type: "password", placeholder: "输入访问密码", autocomplete: "current-password", "aria-label": "访问密码" });
    const err = el("p", { class: "err" });
    const go = el("button", { type: "button" }, "进入");
    const submit = async () => {
      go.disabled = true; err.textContent = "";
      try {
        if (!crypto.subtle) throw new Error("insecure");
        await tryPassword(input.value); done(input.value);
      } catch { err.textContent = "密码不对，或当前环境不支持解密（请用 https 访问）"; go.disabled = false; input.select(); }
    };
    go.onclick = submit;
    input.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
    const gate = el("div", { id: "gate" }, el("div", { class: "gc" },
      el("h2", {}, "影子跟读"),
      el("p", { class: "sub" }, "课文与音频整理自正式出版的教材，仅供个人学习，请输入访问密码。"),
      input, go, err, el("p", { class: "gback" }, el("a", { href: "../index.html" }, "← 返回选书"))));
    document.body.append(gate);
    if (saved) tryPassword(saved).then(() => done(saved)).catch(() => input.focus()); else input.focus();
  });
}
async function readSecure(u) {
  return JSON.parse(new TextDecoder().decode(await decryptBin(u.replace(/\.json$/, ".bin"))));
}
let blobUrl = null;
async function audioSrc(n) {
  if (!LOCKED) return `audio/${n}.mp3`;
  const pt = await decryptBin(`audio/${n}.bin`);
  if (blobUrl) URL.revokeObjectURL(blobUrl);
  return blobUrl = URL.createObjectURL(new Blob([pt], { type: "audio/mpeg" }));
}
const getJSON = (() => {
  const c = {};
  return u => c[u] ||= LOCKED ? readSecure(u) : fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
})();

/* ---------- 本地状态（localStorage 不可用时静默降级） ---------- */
const store = (() => {
  let d = {};
  try { d = JSON.parse(localStorage.getItem("jps") || "{}"); } catch { /* ignore */ }
  const save = () => { try { localStorage.setItem("jps", JSON.stringify(d)); } catch { /* ignore */ } };
  return { get: (k, def) => d[k] ?? def, set: (k, v) => { d[k] = v; save(); } };
})();

/* ---------- 播放器 ---------- */
const audio = new Audio();
audio.preload = "metadata";
const P = { L: null, cur: -1, mode: store.get("mode", "one"), waiting: null, raf: 0 };
audio.playbackRate = +store.get("rate", 1);
$("#rate").value = String(audio.playbackRate);

function seek(t) {
  if (audio.readyState >= 1) audio.currentTime = t;
  else audio.addEventListener("loadedmetadata", () => { audio.currentTime = t; }, { once: true });
}
function cancelWait() { clearTimeout(P.waiting); P.waiting = null; }
function setActive(i) {
  P.cur = i;
  document.querySelectorAll(".line.active").forEach(n => n.classList.remove("active"));
  const n = document.querySelector(`.line[data-i="${i}"]`);
  if (n) {
    n.classList.add("active");
    const r = n.getBoundingClientRect();
    if (r.top < 70 || r.bottom > innerHeight - bar.offsetHeight - 10) n.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  const ln = P.L && P.L.lines[i];
  $("#barLine").textContent = ln ? `${ln.sp ? ln.sp + "　" : ""}${ln.ja}` : "–";
  if (P.L) store.set("last", { n: P.L.n, line: i });
  syncUI();
}
function playLine(i, play = true) {
  cancelWait();
  const ln = P.L.lines[i];
  seek(ln.s);
  setActive(i);
  if (play) audio.play().catch(() => {});
  startTick();
}
function startTick() {
  if (!P.raf) P.raf = requestAnimationFrame(tick);
}
function tick() {
  P.raf = 0;
  if (audio.paused || !P.L) return;
  const L = P.L.lines, t = audio.currentTime, ln = L[P.cur];
  if (P.mode === "flow") {
    let j = P.cur;
    while (j + 1 < L.length && t >= L[j + 1].s) j++;
    if (j !== P.cur) setActive(j);
    if (j === L.length - 1 && t >= L[j].e) { audio.pause(); syncUI(); return; }
  } else if (t >= ln.e) {
    if (P.mode === "loop") { seek(ln.s); }
    else if (P.mode === "shadow") {
      audio.pause();
      const wait = ((ln.e - ln.s) / audio.playbackRate) * 1000 + 500;
      $("#barTime").textContent = "轮到你了…";
      const next = P.cur + 1;
      P.waiting = setTimeout(() => { P.waiting = null; next < L.length ? playLine(next) : syncUI(); }, wait);
      syncUI();
      return;
    } else { audio.pause(); seek(ln.s); syncUI(); return; }
  }
  $("#barTime").textContent = `${fmt(t)} / ${fmt(P.L.duration)}`;
  P.raf = requestAnimationFrame(tick);
}
function toggle() {
  if (!P.L) return;
  if (P.waiting) { cancelWait(); syncUI(); return; }
  if (!audio.paused) { audio.pause(); return; }
  if (P.cur < 0) return playLine(0);
  const ln = P.L.lines[P.cur];
  if (audio.currentTime < ln.s - 0.3 || audio.currentTime >= ln.e) seek(ln.s);
  audio.play().catch(() => {}); startTick();
}
const step = d => { if (!P.L) return; const i = Math.min(Math.max((P.cur < 0 ? 0 : P.cur) + d, 0), P.L.lines.length - 1); playLine(i); };
function syncUI() {
  $("#bPlay").textContent = !audio.paused || P.waiting ? "⏸" : "▶";
  document.querySelectorAll("#modeSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === P.mode));
}
audio.addEventListener("play", () => { syncUI(); startTick(); });
audio.addEventListener("pause", syncUI);
$("#bPlay").onclick = toggle;
$("#bPrev").onclick = () => step(-1);
$("#bNext").onclick = () => step(1);
$("#modeSeg").onclick = e => {
  const b = e.target.closest("button"); if (!b) return;
  P.mode = b.dataset.mode; store.set("mode", P.mode); cancelWait(); syncUI();
};
$("#rate").onchange = e => { audio.playbackRate = +e.target.value; store.set("rate", +e.target.value); };
addEventListener("keydown", e => {
  if (!P.L || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.metaKey || e.ctrlKey) return;
  if (e.code === "Space") { e.preventDefault(); toggle(); }
  else if (e.code === "ArrowRight") step(1);
  else if (e.code === "ArrowLeft") step(-1);
});
if ("mediaSession" in navigator) {
  const ms = navigator.mediaSession;
  ms.setActionHandler("play", toggle); ms.setActionHandler("pause", toggle);
  ms.setActionHandler("previoustrack", () => step(-1)); ms.setActionHandler("nexttrack", () => step(1));
}
new ResizeObserver(() => {
  document.documentElement.style.setProperty("--bar-h", bar.hidden ? "0px" : bar.offsetHeight + "px");
}).observe(bar);

/* ---------- 页面：首页 ---------- */
async function pageHome() {
  const idx = await getJSON("data/index.json");
  const nScenes = idx.reduce((a, l) => a + l.scenes.length, 0);
  const nLines = idx.reduce((a, l) => a + l.nl, 0);
  const mins = Math.round(idx.reduce((a, l) => a + l.dur, 0) / 60);
  const last = store.get("last");
  const done = store.get("done", {});
  const q = el("input", { class: "search", type: "search", placeholder: "搜索场景或课题，例如：牙、面试、お願い", "aria-label": "搜索" });
  const grid = el("div", { class: "grid" });
  const draw = () => {
    const kw = q.value.trim().toLowerCase();
    const items = idx.filter(l => !kw || l.n.includes(kw) || (l.title + l.scenes.join("")).toLowerCase().includes(kw));
    grid.replaceChildren(...(items.length ? items.map(card) : [el("p", { class: "empty" }, "没有匹配的场景")]));
  };
  const card = l => el("div", { class: "card" + (done[l.n] ? " done" : "") },
    el("div", { class: "no" }, `LESSON ${l.n}`),
    el("h3", {}, el("a", { href: `#/lesson/${l.n}` }, l.title)),
    el("ul", {}, l.scenes.map((s, i) => el("li", {}, el("a", { href: `#/lesson/${l.n}/${l.sf[i]}`, style: "color:inherit" }, s)))),
    el("div", { class: "foot" }, `⏱ ${fmt(l.dur)}`, `${l.nl} 句`, l.nx ? `${l.nx} 条表达` : "", done[l.n] ? "✓ 已跟读" : ""));
  q.oninput = draw; draw();
  mount(
    el("section", { class: "hero" },
      el("h1", {}, "把日常口语，一句一句跟读出来"),
      el("p", {}, `${idx.length} 课 · ${nScenes} 个生活场景 · ${nLines} 句对话 · 约 ${mins} 分钟音频。逐句点播、变速、循环、停顿跟读。`)),
    last && idx.find(l => l.n === last.n)
      ? el("a", { class: "resume", href: `#/lesson/${last.n}/${last.line}`, style: "color:inherit" },
        "继续上次：", el("b", {}, `L${last.n} ${idx.find(l => l.n === last.n).title}`), `（第 ${last.line + 1} 句）→`)
      : null,
    q, grid);
}

/* ---------- 页面：课程 ---------- */
async function pageLesson(n, focus) {
  const [idx, L] = await Promise.all([getJSON("data/index.json"), getJSON(`data/${n}.json`)]);
  const pos = idx.findIndex(l => l.n === n);
  if (P.L?.n !== n) {
    audio.pause(); cancelWait();
    P.L = L; P.cur = -1;
    audio.src = await audioSrc(n);
  }
  const lines = L.lines;
  const toggleChip = (key, label, cls, inverse) => {
    const on = store.get(key, inverse ? false : true);
    const apply = v => document.body.classList.toggle(cls, inverse ? v : !v);
    apply(on);
    const b = el("button", { class: "chip", "aria-pressed": on, type: "button" }, label);
    b.onclick = () => { const v = !(store.get(key, inverse ? false : true)); store.set(key, v); apply(v); b.setAttribute("aria-pressed", v); };
    return b;
  };
  const sceneEls = L.scenes.map((sc, si) => {
    const end = si + 1 < L.scenes.length ? L.scenes[si + 1].from : lines.length;
    return el("section", { class: "scene", id: `s${si}` },
      el("h2", {}, el("span", { class: "scno" }, `场景 ${si + 1}`), sc.name),
      lines.slice(sc.from, end).map((ln, k) => {
        const i = sc.from + k;
        return el("button", { class: "line", type: "button", "data-i": i, onclick: e => { e.currentTarget.classList.add("peek"); playLine(i); } },
          el("div", { class: "ja" }, ln.sp ? el("span", { class: "sp " + ln.sp }, ln.sp) : null,
            el("span", { html: ln.jr }), ln.ok ? null : el("span", { class: "weak", title: "此句时间点为估算" })),
          el("div", { class: "zh" }, ln.zh));
      }));
  });
  const favs = store.get("fav", {});
  const ecard = x => {
    const key = `${n}:${x.line}:${x.expr}`;
    const star = el("button", { class: "star" + (favs[key] ? " on" : ""), type: "button", "aria-label": "收藏" }, "★");
    star.onclick = () => { const f = store.get("fav", {}); f[key] ? delete f[key] : f[key] = 1; store.set("fav", f); star.classList.toggle("on", !!f[key]); };
    return exprCard(x, star, false);
  };
  const vocab = L.vocab?.length ? el("section", { class: "sect" }, el("h2", {}, "単語"),
    el("table", { class: "vocab" }, el("thead", {}, el("tr", {}, ["単語", "読み", "意味"].map(h => el("th", {}, h)))),
      el("tbody", {}, L.vocab.map(v => el("tr", {}, el("td", {}, v.word), el("td", {}, v.reading), el("td", {}, v.meaning)))))) : null;
  const nb = (l, dir) => l ? el("a", { href: `#/lesson/${l.n}` }, el("small", {}, dir), `L${l.n} ${l.title}`) : el("span");
  mount(
    el("div", { class: "crumb" }, el("a", { href: "#/" }, "← 全部场景"), `　·　${pos + 1} / ${idx.length}`),
    el("header", { class: "lhead" }, el("h1", {}, `L${n}　${L.title}`),
      el("div", { class: "meta" }, `⏱ ${fmt(L.duration)}　场景 ${L.scenes.length}　${lines.length} 句`)),
    el("div", { class: "tools" },
      toggleChip("ruby", "注音", "no-ruby"), toggleChip("zh", "中文", "no-zh"), toggleChip("blind", "盲听（模糊日文）", "blind", true),
      (() => { const b = el("button", { class: "chip", type: "button" }, "标记已跟读");
        const d = store.get("done", {}); b.setAttribute("aria-pressed", !!d[n]);
        b.onclick = () => { const d2 = store.get("done", {}); d2[n] ? delete d2[n] : d2[n] = 1; store.set("done", d2); b.setAttribute("aria-pressed", !!d2[n]); };
        return b; })()),
    sceneEls,
    L.expr?.length ? el("section", { class: "sect" }, el("h2", {}, "地道表达"), el("div", { class: "ecards" }, L.expr.map(ecard))) : null,
    vocab,
    el("nav", { class: "pn" }, nb(idx[pos - 1], "← 上一课"), nb(idx[pos + 1], "下一课 →")));
  bar.hidden = false;
  syncUI();
  if (focus != null && lines[focus]) {
    setActive(focus); seek(lines[focus].s);
    document.querySelector(`.line[data-i="${focus}"]`)?.scrollIntoView({ block: "center" });
  } else if (P.cur >= 0) setActive(P.cur);
  else { $("#barLine").textContent = "点任意一句开始"; $("#barTime").textContent = ""; }
}

/* ---------- 页面：表达库 ---------- */
function exprCard(x, star, withLesson) {
  const jump = () => { location.hash = `#/lesson/${x.lesson}/${x.line}`; };
  return el("article", { class: "ecard" },
    el("div", { class: "row" },
      el("div", {}, el("div", { class: "ex" }, x.expr), el("div", { class: "rd" }, x.reading)), star),
    el("div", { class: "zh" }, x.zh),
    x.nuance ? el("div", { class: "nu" }, x.nuance) : null,
    el("blockquote", {}, x.src,
      el("button", { type: "button", onclick: withLesson ? jump : () => { playLine(x.line); } }, withLesson ? `→ L${x.lesson} 听原句` : "▶ 听原句"),
      x.alt_ja ? el("small", {}, `${x.alt_ja}　${x.alt_zh || ""}`) : null),
    x.tags?.length ? el("div", { class: "tags" }, x.tags.map(t => el("span", { class: "tag" }, t))) : null);
}
async function pageExpr() {
  const all = await getJSON("data/expr.json");
  if (!all.length) {
    mount(el("h1", {}, "表达库"), el("p", { class: "empty" }, "地道表达卡片正在整理中，稍后上线。"));
    return;
  }
  const favs = () => store.get("fav", {});
  const tags = [...new Set(all.flatMap(x => x.tags || []))];
  let tag = "", onlyFav = false;
  const q = el("input", { class: "search", type: "search", placeholder: "搜索表达、读音、中文含义", "aria-label": "搜索表达" });
  const chips = el("div", { class: "filters" });
  const list = el("div", { class: "ecards" });
  const draw = () => {
    const kw = q.value.trim().toLowerCase(), f = favs();
    const items = all.filter(x => (!tag || x.tags?.includes(tag)) && (!onlyFav || f[`${x.lesson}:${x.line}:${x.expr}`]) &&
      (!kw || `${x.expr}${x.reading}${x.zh}${x.nuance || ""}`.toLowerCase().includes(kw)));
    note.textContent = `共 ${items.length} 条`;
    list.replaceChildren(...items.map(x => {
      const key = `${x.lesson}:${x.line}:${x.expr}`;
      const s = el("button", { class: "star" + (f[key] ? " on" : ""), type: "button", "aria-label": "收藏" }, "★");
      s.onclick = () => { const g = favs(); g[key] ? delete g[key] : g[key] = 1; store.set("fav", g); s.classList.toggle("on", !!g[key]); if (onlyFav) draw(); };
      return exprCard(x, s, true);
    }));
  };
  const note = el("p", { class: "note" });
  const mkChip = (label, on, fn) => { const b = el("button", { class: "chip", type: "button", "aria-pressed": on }, label); b.onclick = fn; return b; };
  const drawChips = () => chips.replaceChildren(
    mkChip("★ 收藏", onlyFav, () => { onlyFav = !onlyFav; drawChips(); draw(); }),
    mkChip("全部", !tag, () => { tag = ""; drawChips(); draw(); }),
    ...tags.map(t => mkChip(t, tag === t, () => { tag = tag === t ? "" : t; drawChips(); draw(); })));
  q.oninput = draw; drawChips(); draw();
  mount(el("h1", {}, "地道表达库"), el("p", { class: "note" }, "从 74 课对话里挑出的口语句式、语气和惯用搭配。点 ★ 收藏，数据只存在你的浏览器里。"), q, chips, note, list);
}

/* ---------- 路由 ---------- */
async function route() {
  const [, p, a, b] = location.hash.split("/");
  document.querySelectorAll(".top nav a").forEach(x => x.classList.toggle("on", x.dataset.nav === (p === "expr" ? "expr" : p === "lesson" ? "" : "home")));
  if (p !== "lesson") { bar.hidden = true; if (!audio.paused) audio.pause(); cancelWait(); }
  document.documentElement.style.setProperty("--bar-h", bar.hidden ? "0px" : bar.offsetHeight + "px");
  try {
    if (p === "expr") await pageExpr();
    else if (p === "lesson" && /^\d+$/.test(a || "")) await pageLesson(a, b != null && /^\d+$/.test(b) ? +b : null);
    else await pageHome();
    if (p !== "lesson") scrollTo(0, 0);
  } catch (e) {
    mount(el("p", { class: "empty" }, "加载失败，请刷新重试。"));
    console.error(e);
  }
}
addEventListener("hashchange", route);
(LOCKED ? unlock() : Promise.resolve()).then(route);
