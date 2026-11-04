"use strict";
/* course 渲染器：课程 / 对话类的书（目前是日语影子跟读，韩/阿/法随后接入）。
   由外壳（hub.js）按 book.type === "course" 按需加载，实例化时拿到 ctx：
     ctx.book      书目条目（books.json 里的一项）
     ctx.view      内容区（可滚动）
     ctx.dock      固定在底部的区域（播放条放这里）
     ctx.base      这本书的数据目录，如 /study-hub/jp-shadowing/
     ctx.href(r)   书内路径 → 外壳地址；ctx.go(r) 跳转
     ctx.store     本书的本地存储 {get,set}
     ctx.setToc / ctx.setCurrent   往抽屉里放章节目录并标出当前项
     ctx.touch(rest, title)        记入「继续学习」 */
window.HubCourse = function (ctx) {
  const { view, dock, base, store } = ctx;
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  function el(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;          // 仅用于构建期已转义的注音 HTML
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) if (k != null) n.append(k.nodeType ? k : document.createTextNode(k));
    return n;
  }
  const mount = (...nodes) => view.replaceChildren(el("div", { class: "course-in" }, nodes.flat(Infinity).filter(Boolean)));
  const json = (() => {
    const c = {};
    return p => c[p] ||= fetch(base + p).then(r => { if (!r.ok) throw new Error(p); return r.json(); });
  })();

  view.classList.add("course");
  const apply = (cls, on) => view.classList.toggle(cls, on);

  /* ---------- 播放条 ---------- */
  dock.replaceChildren(el("div", { class: "bar" },
    el("div", { class: "bar-now" }, el("b", { id: "barLine" }, "–"), el("small", { id: "barTime" })),
    el("div", { class: "bar-ctl" },
      el("button", { id: "bPrev", type: "button", "aria-label": "上一句" }, "⏮"),
      el("button", { id: "bPlay", type: "button", class: "main", "aria-label": "播放/暂停" }, "▶"),
      el("button", { id: "bNext", type: "button", "aria-label": "下一句" }, "⏭"),
      el("div", { class: "seg", id: "modeSeg", role: "group", "aria-label": "播放模式" },
        [["flow", "连续", "连续播放"], ["one", "单句", "播完当前句停下"], ["loop", "循环", "单句循环"], ["shadow", "跟读", "播完停顿一个句长，留给你跟读"]]
          .map(([m, t, d]) => el("button", { type: "button", "data-mode": m, title: d }, t))),
      el("select", { id: "rate", "aria-label": "语速" },
        [0.7, 0.85, 1, 1.15].map(v => el("option", { value: v }, v + "×"))))));
  dock.hidden = true;
  const $d = s => dock.querySelector(s);

  const audio = new Audio();
  audio.preload = "metadata";
  const P = { L: null, cur: -1, mode: store.get("mode", "one"), waiting: null, raf: 0 };
  audio.playbackRate = +store.get("rate", 1);
  $d("#rate").value = String(audio.playbackRate);

  function seek(t) {
    if (audio.readyState >= 1) audio.currentTime = t;
    else audio.addEventListener("loadedmetadata", () => { audio.currentTime = t; }, { once: true });
  }
  function cancelWait() { clearTimeout(P.waiting); P.waiting = null; }
  let touchT = 0;
  function setActive(i) {
    P.cur = i;
    view.querySelectorAll(".line.active").forEach(n => n.classList.remove("active"));
    const n = view.querySelector(`.line[data-i="${i}"]`);
    if (n) {
      n.classList.add("active");
      const r = n.getBoundingClientRect(), vr = view.getBoundingClientRect();
      if (r.top < vr.top + 20 || r.bottom > vr.bottom - 10) n.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    const ln = P.L && P.L.lines[i];
    $d("#barLine").textContent = ln ? `${ln.sp ? ln.sp + "　" : ""}${ln.ja}` : "–";
    if (P.L) {
      store.set("last", { n: P.L.n, line: i });
      clearTimeout(touchT);
      touchT = setTimeout(() => ctx.touch(`lesson/${P.L.n}/${i}`, `L${P.L.n} ${P.L.title}`), 1200);
    }
    syncUI();
  }
  function playLine(i, play = true) {
    cancelWait();
    seek(P.L.lines[i].s);
    setActive(i);
    if (play) audio.play().catch(() => {});
    startTick();
  }
  const startTick = () => { if (!P.raf) P.raf = requestAnimationFrame(tick); };
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
      if (P.mode === "loop") seek(ln.s);
      else if (P.mode === "shadow") {
        audio.pause();
        const wait = ((ln.e - ln.s) / audio.playbackRate) * 1000 + 500;
        $d("#barTime").textContent = "轮到你了…";
        const next = P.cur + 1;
        P.waiting = setTimeout(() => { P.waiting = null; next < L.length ? playLine(next) : syncUI(); }, wait);
        syncUI();
        return;
      } else { audio.pause(); seek(ln.s); syncUI(); return; }
    }
    $d("#barTime").textContent = `${fmt(t)} / ${fmt(P.L.duration)}`;
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
  const step = d => { if (!P.L) return; playLine(Math.min(Math.max((P.cur < 0 ? 0 : P.cur) + d, 0), P.L.lines.length - 1)); };
  function syncUI() {
    $d("#bPlay").textContent = !audio.paused || P.waiting ? "⏸" : "▶";
    dock.querySelectorAll("#modeSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === P.mode));
  }
  audio.addEventListener("play", () => { syncUI(); startTick(); });
  audio.addEventListener("pause", syncUI);
  $d("#bPlay").onclick = toggle;
  $d("#bPrev").onclick = () => step(-1);
  $d("#bNext").onclick = () => step(1);
  $d("#modeSeg").onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    P.mode = b.dataset.mode; store.set("mode", P.mode); cancelWait(); syncUI();
  };
  $d("#rate").onchange = e => { audio.playbackRate = +e.target.value; store.set("rate", +e.target.value); };
  const onKey = e => {
    if (!P.L || dock.hidden || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) || e.metaKey || e.ctrlKey) return;
    if (e.code === "Space") { e.preventDefault(); toggle(); }
    else if (e.code === "ArrowRight") step(1);
    else if (e.code === "ArrowLeft") step(-1);
  };
  addEventListener("keydown", onKey);
  const ms = "mediaSession" in navigator ? navigator.mediaSession : null;
  if (ms) {
    ms.setActionHandler("play", toggle); ms.setActionHandler("pause", toggle);
    ms.setActionHandler("previoustrack", () => step(-1)); ms.setActionHandler("nexttrack", () => step(1));
  }

  /* ---------- 公共小件 ---------- */
  const switcher = key => el("nav", { class: "switch", "aria-label": "栏目" },
    [["home", "场景", ""], ["expr", "表达库", "expr"]].map(([k, t, r]) =>
      el("a", { href: ctx.href(r), "aria-current": k === key ? "page" : null }, t)));
  let idxP = null;
  const index = () => idxP ||= json("data/index.json").then(idx => {
    ctx.setToc([{ label: "场景总览", rest: "", key: "home" }, { label: "地道表达库", rest: "expr", key: "expr" },
      ...idx.map(l => ({ label: `L${l.n}　${l.title}`, rest: `lesson/${l.n}`, key: l.n, group: "课程" }))]);
    return idx;
  });

  /* ---------- 页面：首页 ---------- */
  async function pageHome() {
    const idx = await index();
    ctx.setCurrent("home");
    const nScenes = idx.reduce((a, l) => a + l.scenes.length, 0);
    const nLines = idx.reduce((a, l) => a + l.nl, 0);
    const mins = Math.round(idx.reduce((a, l) => a + l.dur, 0) / 60);
    const last = store.get("last");
    const done = store.get("done", {});
    const q = el("input", { class: "search", type: "search", placeholder: "搜索场景或课题，例如：牙、面试、お願い", "aria-label": "搜索", enterkeyhint: "search" });
    const grid = el("div", { class: "grid" });
    const card = l => el("div", { class: "card" + (done[l.n] ? " done" : "") },
      el("div", { class: "no" }, `LESSON ${l.n}`),
      el("h3", {}, el("a", { href: ctx.href(`lesson/${l.n}`) }, l.title)),
      el("ul", {}, l.scenes.map((s, i) => el("li", {}, el("a", { href: ctx.href(`lesson/${l.n}/${l.sf[i]}`) }, s)))),
      el("div", { class: "foot" }, [`⏱ ${fmt(l.dur)}`, `${l.nl} 句`, l.nx ? `${l.nx} 条表达` : "", done[l.n] ? "✓ 已跟读" : ""]
        .filter(Boolean).map(t => el("span", {}, t))));
    const draw = () => {
      const kw = q.value.trim().toLowerCase();
      const items = idx.filter(l => !kw || l.n.includes(kw) || (l.title + l.scenes.join("")).toLowerCase().includes(kw));
      grid.replaceChildren(...(items.length ? items.map(card) : [el("p", { class: "empty" }, "没有匹配的场景")]));
    };
    q.oninput = draw; draw();
    mount(
      switcher("home"),
      el("section", { class: "hero" },
        el("h1", {}, "把日常口语，一句一句跟读出来"),
        el("p", {}, `${idx.length} 课 · ${nScenes} 个生活场景 · ${nLines} 句对话 · 约 ${mins} 分钟音频。逐句点播、变速、循环、停顿跟读。`)),
      last && idx.find(l => l.n === last.n)
        ? el("a", { class: "resume", href: ctx.href(`lesson/${last.n}/${last.line}`) },
          "继续上次：", el("b", {}, `L${last.n} ${idx.find(l => l.n === last.n).title}`), `（第 ${last.line + 1} 句）→`)
        : null,
      q, grid);
    view.scrollTo(0, 0);
  }

  /* ---------- 页面：课程 ---------- */
  async function pageLesson(n, focus) {
    const [idx, L] = await Promise.all([index(), json(`data/${n}.json`)]);
    const pos = idx.findIndex(l => l.n === n);
    ctx.setCurrent(n);
    if (P.L?.n !== n) {
      audio.pause(); cancelWait();
      P.L = L; P.cur = -1;
      audio.src = `${base}audio/${n}.mp3`;
    }
    const lines = L.lines;
    const chip = (key, label, cls, inverse) => {
      const on = store.get(key, inverse ? false : true);
      apply(cls, inverse ? on : !on);
      const b = el("button", { class: "chip", "aria-pressed": on, type: "button" }, label);
      b.onclick = () => { const v = !store.get(key, inverse ? false : true); store.set(key, v); apply(cls, inverse ? v : !v); b.setAttribute("aria-pressed", v); };
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
    const nb = (l, dir) => l ? el("a", { href: ctx.href(`lesson/${l.n}`) }, el("small", {}, dir), `L${l.n} ${l.title}`) : el("span");
    mount(
      el("div", { class: "crumb" }, el("a", { href: ctx.href("") }, "← 全部场景"), `　·　${pos + 1} / ${idx.length}`),
      el("header", { class: "lhead" }, el("h1", {}, `L${n}　${L.title}`),
        el("div", { class: "meta" }, `⏱ ${fmt(L.duration)}　场景 ${L.scenes.length}　${lines.length} 句`)),
      el("div", { class: "tools" },
        chip("ruby", "注音", "no-ruby"), chip("zh", "中文", "no-zh"), chip("blind", "盲听（模糊日文）", "blind", true),
        (() => { const b = el("button", { class: "chip", type: "button" }, "标记已跟读");
          b.setAttribute("aria-pressed", !!store.get("done", {})[n]);
          b.onclick = () => { const d = store.get("done", {}); d[n] ? delete d[n] : d[n] = 1; store.set("done", d); b.setAttribute("aria-pressed", !!d[n]); };
          return b; })()),
      sceneEls,
      L.expr?.length ? el("section", { class: "sect" }, el("h2", {}, "地道表达"), el("div", { class: "ecards" }, L.expr.map(ecard))) : null,
      vocab,
      el("nav", { class: "pn" }, nb(idx[pos - 1], "← 上一课"), nb(idx[pos + 1], "下一课 →")));
    dock.hidden = false;
    syncUI();
    if (focus != null && lines[focus]) {
      setActive(focus); seek(lines[focus].s);
      view.querySelector(`.line[data-i="${focus}"]`)?.scrollIntoView({ block: "center" });
    } else if (P.cur >= 0) setActive(P.cur);
    else { view.scrollTo(0, 0); $d("#barLine").textContent = "点任意一句开始"; $d("#barTime").textContent = ""; }
    ctx.touch(`lesson/${n}${focus != null ? "/" + focus : ""}`, `L${n} ${L.title}`);
  }

  /* ---------- 页面：表达库 ---------- */
  function exprCard(x, star, withLesson) {
    return el("article", { class: "ecard" },
      el("div", { class: "row" },
        el("div", {}, el("div", { class: "ex" }, x.expr), el("div", { class: "rd" }, x.reading)), star),
      el("div", { class: "zh" }, x.zh),
      x.nuance ? el("div", { class: "nu" }, x.nuance) : null,
      el("blockquote", {}, x.src,
        el("button", { type: "button", onclick: withLesson ? () => ctx.go(`lesson/${x.lesson}/${x.line}`) : () => playLine(x.line) },
          withLesson ? `→ L${x.lesson} 听原句` : "▶ 听原句"),
        x.alt_ja ? el("small", {}, `${x.alt_ja}　${x.alt_zh || ""}`) : null),
      x.tags?.length ? el("div", { class: "tags" }, x.tags.map(t => el("span", { class: "tag" }, t))) : null);
  }
  async function pageExpr() {
    await index();
    ctx.setCurrent("expr");
    const all = await json("data/expr.json");
    if (!all.length) { mount(switcher("expr"), el("p", { class: "empty" }, "地道表达卡片正在整理中，稍后上线。")); return; }
    const favs = () => store.get("fav", {});
    const tags = [...new Set(all.flatMap(x => x.tags || []))];
    let tag = "", onlyFav = false;
    const q = el("input", { class: "search", type: "search", placeholder: "搜索表达、读音、中文含义", "aria-label": "搜索表达", enterkeyhint: "search" });
    const chips = el("div", { class: "filters" });
    const list = el("div", { class: "ecards" });
    const note = el("p", { class: "note" });
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
    const mkChip = (label, on, fn) => { const b = el("button", { class: "chip", type: "button", "aria-pressed": on }, label); b.onclick = fn; return b; };
    const drawChips = () => chips.replaceChildren(
      mkChip("★ 收藏", onlyFav, () => { onlyFav = !onlyFav; drawChips(); draw(); }),
      mkChip("全部", !tag, () => { tag = ""; drawChips(); draw(); }),
      ...tags.map(t => mkChip(t, tag === t, () => { tag = tag === t ? "" : t; drawChips(); draw(); })));
    q.oninput = draw; drawChips(); draw();
    mount(switcher("expr"), el("h1", {}, "地道表达库"),
      el("p", { class: "note" }, "从 74 课对话里挑出的口语句式、语气和惯用搭配。点 ★ 收藏，数据只存在你的浏览器里。"), q, chips, note, list);
    view.scrollTo(0, 0);
  }

  /* ---------- 路由与销毁 ---------- */
  async function route(rest) {
    const [p, a, b] = rest.split("/");
    if (p !== "lesson") { dock.hidden = true; if (!audio.paused) audio.pause(); cancelWait(); }
    try {
      if (p === "expr") await pageExpr();
      else if (p === "lesson" && /^\d+$/.test(a || "")) await pageLesson(a, b != null && /^\d+$/.test(b) ? +b : null);
      else await pageHome();
    } catch (e) {
      mount(el("p", { class: "empty" }, "加载失败，请刷新重试。"));
      console.error(e);
    }
  }
  function destroy() {
    audio.pause(); audio.removeAttribute("src"); audio.load();
    cancelWait(); clearTimeout(touchT); cancelAnimationFrame(P.raf);
    removeEventListener("keydown", onKey);
    if (ms) for (const a of ["play", "pause", "previoustrack", "nexttrack"]) ms.setActionHandler(a, null);
    view.classList.remove("course", "no-ruby", "no-zh", "blind");
    dock.replaceChildren(); dock.hidden = true;
  }
  return { route, destroy };
};
