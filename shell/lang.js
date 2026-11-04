"use strict";
/* lang 引擎：语言入门课（法语 / 阿拉伯语 / 韩语）共用。
   书目里 book.lang 描述这门语言的差异：
     id        语言标识，决定加载 lang-<id>.js（字母/发音页）
     term pron 数据里「外语词」和「注音」的字段名（fr/ipa、ar/rom、kr/rom）
     name      "法语"；pronName "音标"；script 用来给文字加样式的正则名
     srsKey    复习进度的存储键（沿用旧站，已有的学习记录不丢）
     cardPrefix 卡片 id 前缀（沿用旧站）
   数据：<book>/data/course.json = {COURSE, AUDIO_MAP, …}；音频 <book>/audio/<id>.mp3 */
window.HubLangPlugins = window.HubLangPlugins || {};
window.HubLang = function (ctx) {
  const { view, base } = ctx;
  const B = ctx.book, F = B.lang;
  const SCRIPTS = {
    kr: /[ᄀ-ᇿ㄰-㆏가-힯]+/g,
    fr: /[A-Za-zÀ-ɏŒœ]+/g,
    ar: /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]+/g,
  };
  const WORD = SCRIPTS[F.id];
  const CJK = /[一-鿿]/;
  const isTx = s => { WORD.lastIndex = 0; const hit = WORD.test(s); WORD.lastIndex = 0; return hit && !CJK.test(s); };
  let D = null, AUDIO_MAP = {}, EXTRA = {};

  /* ---------------- 工具 ---------------- */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const wrap = html => html.replace(/(^|>)([^<]+)/g, (m, p, t) => p + t.replace(WORD, x => '<span class="tx">' + x + "</span>"));
  const md = s => wrap(esc(s).replace(/\*\*(.+?)\*\*/g, "<mark>$1</mark>").replace(/\n/g, "<br>"));
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const $ = s => view.querySelector(s);
  let toastEl = null;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "lang-toast"; document.body.append(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }
  const secs = () => D.chapters.flatMap(ch => ch.sections.map(s => Object.assign({ _ch: ch }, s)));
  const findSec = id => secs().find(s => s.id === id);
  const audioOf = say => say ? (AUDIO_MAP[say] || "") : "";
  const SVG = (d, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${extra || ""}>${d}</svg>`;
  const SPK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L13 5v14L7.5 14.5H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  const spkBtn = (aid, cls) => `<button class="spk ${cls || ""}" type="button" data-audio="${esc(aid || "")}" aria-label="播放" title="播放">${SPK_SVG}</button>`;

  /* ---------------- 学习数据（间隔重复） ---------------- */
  const DEF = { v: 1, progress: {}, srs: {}, days: {}, wrong: {}, settings: { hideZh: true, newPerDay: 15, rate: 1 }, lastLesson: null };
  let state = null;
  const clone = o => JSON.parse(JSON.stringify(o));
  const SRS = {
    load() {
      if (state) return state;
      try {
        const raw = localStorage.getItem(F.srsKey);
        state = raw ? Object.assign({}, DEF, JSON.parse(raw)) : clone(DEF);
        state.settings = Object.assign({}, DEF.settings, state.settings || {});
      } catch { state = clone(DEF); }
      return state;
    },
    save() { try { localStorage.setItem(F.srsKey, JSON.stringify(state)); } catch {} },
    day(n = 0) {
      const d = new Date(); d.setDate(d.getDate() + n);
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    },
    cards: null,
    buildCards() {
      if (this.cards) return this.cards;
      const cards = [], seen = new Set(), P = F.cardPrefix;
      D.chapters.forEach(ch => ch.sections.forEach(sec => {
        const meta = { secId: sec.id, chId: ch.id, secTitle: sec.title, chTitle: ch.title };
        (sec.vocab || []).forEach(v => {
          const base_ = sec.id + "|" + v.t;
          if (seen.has(base_)) return;
          seen.add(base_);
          cards.push({ id: P + ":" + base_, dir: "t2zh", front: v.t, rom: v.p, back: v.zh, audio: v.a, kind: "vocab", ...meta });
          cards.push({ id: "vz:" + base_, dir: "zh2t", front: v.zh, rom: v.p, back: v.t, audio: v.a, kind: "vocab", ...meta });
        });
        (sec.examples || []).forEach((e, i) => {
          cards.push({ id: "ex:" + sec.id + "|" + i, dir: "t2zh", front: e.t, rom: e.p, back: e.zh, note: e.note, audio: e.a, kind: "example", ...meta });
        });
      }));
      return this.cards = cards;
    },
    cardState(id) {
      const s = this.load();
      return s.srs[id] || (s.srs[id] = { e: 2.5, i: 0, r: 0, l: 0, due: this.day(), seen: 0 });
    },
    dueQueue(limit) {
      const t = this.day(), s = this.load();
      return this.buildCards().filter(c => s.srs[c.id] && s.srs[c.id].r > 0 && s.srs[c.id].due <= t)
        .sort((a, b) => s.srs[a.id].due < s.srs[b.id].due ? -1 : 1).slice(0, limit || 200);
    },
    newQueue(limit) {
      const s = this.load(), out = [];
      for (const c of this.buildCards()) {
        if (!s.srs[c.id] || s.srs[c.id].r === 0) {
          if (c.dir === "zh2t" && (!s.srs[c.id] || !s.srs[c.id].seen)) continue;   // 先认读再回忆
          out.push(c);
        }
        if (out.length >= (limit || 15)) break;
      }
      return out;
    },
    rate(cardId, r) {
      const s = this.load(), st = this.cardState(cardId), day = this.day();
      st.seen = (st.seen || 0) + 1;
      s.days[day] = s.days[day] || { rev: 0, new: 0, sec: 0 };
      s.days[day].rev++;
      if (r === 0) {
        st.l++; st.r = 0; st.i = 0; st.e = Math.max(1.3, st.e - 0.2); st.due = day;
        s.wrong[cardId] = (s.wrong[cardId] || 0) + 1;
      } else {
        st.r++;
        st.i = st.r === 1 ? 1 : st.r === 2 ? 3 : Math.round(Math.max(1, st.i) * st.e);
        if (r === 1) st.e = Math.max(1.3, st.e - 0.15);
        if (r === 3) st.e = Math.min(3.2, st.e + 0.15);
        st.due = this.day(st.i);
      }
      this.save();
    },
    markDone(secId) {
      const s = this.load(), day = this.day();
      s.progress[secId] = { done: true, ts: Date.now() };
      s.lastLesson = secId;
      s.days[day] = s.days[day] || { rev: 0, new: 0, sec: 0 };
      s.days[day].sec++;
      this.save();
    },
    isDone: id => !!(SRS.load().progress[id] && SRS.load().progress[id].done),
    chapterProgress(ch) {
      const tot = ch.sections.length, done = ch.sections.filter(s => SRS.isDone(s.id)).length;
      return { done, tot, pct: pct(done, tot) };
    },
    streak() {
      const s = this.load(); let n = 0; const d = new Date();
      for (let i = 0; i < 400; i++) {
        const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
        const rec = s.days[k];
        if (rec && (rec.rev > 0 || rec.sec > 0)) { n++; d.setDate(d.getDate() - 1); }
        else if (i === 0) d.setDate(d.getDate() - 1);                       // 今天还没学，不算断
        else break;
      }
      return n;
    },
    cardStats() {
      const s = this.load(), t = this.day();
      let total = 0, seen = 0, mature = 0, due = 0;
      for (const c of this.buildCards()) {
        total++;
        const st = s.srs[c.id];
        if (st && st.r > 0) { seen++; if (st.i >= 21) mature++; if (st.due <= t) due++; }
      }
      return { total, seen, mature, due };
    },
    reset() { state = clone(DEF); this.save(); },
  };

  /* ---------------- 测验题生成 ---------------- */
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const QUIZ = {
    build(secIds, count) {
      const inSec = [], inCh = [], global = [], set = new Set(secIds);
      D.chapters.forEach(ch => ch.sections.forEach(sec => (sec.vocab || []).forEach(v => {
        const item = { t: v.t, zh: v.zh, p: v.p, audio: v.a };
        if (!item.zh) return;
        if (set.has(sec.id)) inSec.push(item); else if (secIds.some(s => s.startsWith(ch.id))) inCh.push(item);
        global.push(item);
      })));
      const pool = inSec.length >= 4 ? inSec : inSec.length + inCh.length >= 4 ? inSec.concat(inCh) : global;
      if (pool.length < 4) return [];
      const types = ["t2zh", "zh2t", "audio2t", "p2t"], qs = [], used = new Set();
      const LABEL = { t2zh: `看${F.name}选中文`, zh2t: `看中文选${F.name}`, audio2t: "听音选词", p2t: `看${F.pronName}选${F.name}` };
      const distract = (src, ans, key, n) => {
        const out = [], seen = new Set([ans[key]]);
        for (const p of shuffle(src.slice())) { if (out.length >= n) break; const v = p[key]; if (!v || seen.has(v)) continue; seen.add(v); out.push(p); }
        return out;
      };
      let guard = 0;
      while (qs.length < count && guard++ < count * 12) {
        const item = pick(pool);
        if (!item.t || !item.zh) continue;
        let type = pick(types);
        if (type === "p2t" && !item.p) type = "t2zh";
        const ukey = item.t + "|" + type;
        if (used.has(ukey)) continue;
        used.add(ukey);
        let prompt, promptClass, audio = null, answer, optKey;
        if (type === "t2zh") { prompt = item.t; promptClass = "tx"; answer = item.zh; optKey = "zh"; }
        else if (type === "zh2t") { prompt = item.zh; promptClass = "zh-q"; answer = item.t; optKey = "t"; }
        else if (type === "audio2t") { prompt = "🔊 听发音，选出你听到的词"; promptClass = "zh-q"; answer = item.t; optKey = "t"; audio = item.audio; }
        else { prompt = "[" + item.p + "]"; promptClass = "mono"; answer = item.t; optKey = "t"; }
        const ds = distract(pool.length > 8 ? pool : global, item, optKey, 3);
        if (ds.length < 3) continue;
        const opts = shuffle([item].concat(ds)).map(x => ({ text: x[optKey], tx: optKey === "t" }));
        const ansIdx = opts.findIndex(o => o.text === answer);
        if (ansIdx < 0) continue;
        qs.push({ type, label: LABEL[type], prompt, promptClass, audio, options: opts, answerIndex: ansIdx,
          explain: (item.p ? "[" + item.p + "] " : "") + item.t + " — " + item.zh });
      }
      return qs;
    },
  };

  /* ---------------- 音频 ---------------- */
  const player = new Audio();
  let curSpk = null;
  function play(aid, rate, spkEl) {
    if (!aid) { toast("这句没有音频"); return; }
    if (curSpk) curSpk.classList.remove("playing");
    if (spkEl) { spkEl.classList.add("playing"); curSpk = spkEl; }
    player.src = base + "audio/" + aid + ".mp3";
    player.playbackRate = rate || SRS.load().settings.rate || 1;
    player.currentTime = 0;
    player.play().catch(() => {});
    player.onended = () => { if (spkEl) spkEl.classList.remove("playing"); };
  }
  function stopAudio() { if (curSpk) { curSpk.classList.remove("playing"); curSpk = null; } player.pause(); }
  function bindAudio(root) {
    (root || view).querySelectorAll("[data-audio]").forEach(el => {
      el.onclick = ev => { ev.stopPropagation(); play(el.dataset.audio, el.dataset.rate ? +el.dataset.rate : null, el.classList.contains("spk") ? el : null); };
    });
  }
  const bindGo = () => view.querySelectorAll("[data-go]").forEach(el => el.onclick = () => ctx.go(el.dataset.go));
  function show(html, cls) {
    view.querySelector(".lang-in")?.remove();
    const box = document.createElement("div");
    box.className = "lang-in" + (cls ? " " + cls : "");
    box.innerHTML = html;
    view.replaceChildren(box);
    view.scrollTo(0, 0);
    bindGo(); bindAudio(box);
    return box;
  }
  const pageHead = (title, sub) => `<h2 class="page-title">${esc(title)}</h2>${sub ? `<p class="page-sub">${esc(sub)}</p>` : ""}`;

  /* ---------------- 图标 ---------------- */
  const ICON = {
    plan: SVG('<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M7.5 14h2M11 14h2M14.5 14h2M7.5 17.5h2M11 17.5h2"/>'),
    check: SVG('<circle cx="12" cy="12" r="9.2"/><path d="m7.8 12.3 2.9 2.9 5.6-5.9"/>'),
  };

  /* ---------------- 目录（放进外壳抽屉） ---------------- */
  function pushToc() {
    const items = [
      { label: "学习台", rest: "", key: "home" },
      { label: F.lettersLabel, rest: "letters", key: "letters" },
      { label: "复习", rest: "review", key: "review" },
      { label: "测验", rest: "quiz", key: "quiz" },
      { label: "词库", rest: "vocab", key: "vocab" },
      { label: "12 周计划", rest: "plan", key: "plan" },
      { label: "统计", rest: "stats", key: "stats" },
    ];
    D.chapters.forEach(ch => ch.sections.forEach(s => items.push({
      label: (SRS.isDone(s.id) ? "✓ " : "") + s.title.replace(/[：:]\s*$/, "").trim(),
      rest: "lesson/" + s.id, key: s.id, group: ch.title,
    })));
    (B.docs || []).forEach(d => items.push({ label: d.label, href: d.href, group: "资料" }));
    ctx.setToc(items);
  }

  /* ---------------- 首页 ---------------- */
  function home() {
    const st = SRS.cardStats(), due = SRS.dueQueue(999).length, all = secs();
    const doneN = all.filter(s => SRS.isDone(s.id)).length;
    const next = all.find(s => !SRS.isDone(s.id)) || all[0];
    const hr = new Date().getHours();
    const greet = hr < 6 ? "夜深了" : hr < 11 ? "早上好" : hr < 14 ? "中午好" : hr < 19 ? "下午好" : "晚上好";
    show(`<div class="hero">
        <h2>${greet}，今天也来学一点${F.name}吧</h2>
        <p>${next ? `下一节：${esc(next._ch.title)} · ${esc(next.title)}` : "全书已学完，去复习巩固吧"}</p>
        <div class="btns">
          ${next ? `<button class="btn" type="button" data-go="lesson/${next.id}">继续学习 →</button>` : ""}
          <button class="btn ghost" type="button" data-go="review">开始复习${due ? `（${due}）` : ""}</button>
          <button class="btn ghost" type="button" data-go="quiz">来一组测验</button>
        </div></div>
      <form class="lang-search" id="sf" role="search"><input id="sq" type="search" placeholder="搜索${F.name} / 中文 / ${F.pronName}…" autocomplete="off" enterkeyhint="search" aria-label="搜索"></form>
      <div class="grid4" style="margin-top:16px">
        <div class="stat"><div class="n">${SRS.streak()}<small> 天</small></div><div class="l">连续学习</div></div>
        <div class="stat"><div class="n">${st.seen}<small> / ${st.total}</small></div><div class="l">已接触卡片</div></div>
        <div class="stat"><div class="n" style="color:var(--pink)">${due}</div><div class="l">今日待复习</div></div>
        <div class="stat"><div class="n">${pct(doneN, all.length)}<small>%</small></div><div class="l">全书进度（${doneN}/${all.length} 节）</div></div>
      </div>
      <div class="grid2" style="margin-top:16px;align-items:start">
        <div class="card"><h3>今日任务</h3><ul class="todo-list">
          <li><span class="dot ${doneN >= all.length ? "done" : ""}"></span><div class="t"><b>学完 1 节新课</b><span>${next ? esc(next.title) : "—"}</span></div>
            ${next ? `<button class="btn sm line" type="button" data-go="lesson/${next.id}">去学</button>` : ""}</li>
          <li><span class="dot ${due === 0 ? "done" : ""}"></span><div class="t"><b>复习 ${due} 张卡片</b><span>间隔重复，别让记忆漏掉</span></div>
            <button class="btn sm line" type="button" data-go="review">去复习</button></li>
          <li><span class="dot"></span><div class="t"><b>做 10 道测验</b><span>检验今天的学习效果</span></div>
            <button class="btn sm line" type="button" data-go="quiz">去测验</button></li>
        </ul></div>
        <div class="card"><h3>章节进度</h3>${D.chapters.map(ch => {
          const p = SRS.chapterProgress(ch);
          return `<div style="margin:12px 0"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px">
            <span>${esc(ch.title)}</span><span style="color:var(--ink3)">${p.done}/${p.tot}</span></div><div class="bar"><i style="width:${p.pct}%"></i></div></div>`;
        }).join("")}</div>
      </div>
      <div class="card" style="margin-top:16px"><h3>怎么用</h3><div class="grid3" style="margin-top:10px">
        <div><b style="color:var(--pink)">① 先学发音</b><p class="how">第一章务必学扎实，点每个字母都能听发音。发音是后面一切的地基。</p></div>
        <div><b style="color:var(--teal)">② 每天 1 节 + 复习</b><p class="how">新知识只学 1 节，剩下的时间交给「复习」。卡片按记忆曲线自动排期。</p></div>
        <div><b style="color:var(--green)">③ 学完就测</b><p class="how">测验题从学过的词汇里随机生成，做错的会回到复习队列。键盘：复习时空格翻面、1-4 评分；课程页 ← → 切节。</p></div>
      </div></div>`);
    $("#sf").onsubmit = e => { e.preventDefault(); const q = $("#sq").value.trim(); if (q) ctx.go("search/" + encodeURIComponent(q)); };
    ctx.touch("", "学习台");
  }

  /* ---------------- 课程页 ---------------- */
  function lesson(secId) {
    const s = findSec(secId);
    if (!s) { show('<div class="empty">没找到这一节</div>'); return; }
    const ch = s._ch, all = secs(), idx = all.findIndex(x => x.id === secId), prev = all[idx - 1], next = all[idx + 1];
    const st = SRS.load(), hideZh = st.settings.hideZh;
    let h = `<div class="lesson-head"><div class="ch">${esc(ch.title)}</div><h2>${esc(s.title)}</h2>
      <div class="meta">
        <span class="pill">${(s.concepts || []).length} 个知识点</span><span class="pill">${(s.vocab || []).length} 个词</span>
        <span class="pill">${(s.examples || []).length} 个例句</span>
        ${SRS.isDone(secId) ? '<span class="pill green">✓ 已学</span>' : ""}
        <button class="pill" type="button" data-go="quiz/sec:${secId}">本节测验</button>
        <button class="pill" type="button" id="toggleZh">${hideZh ? "中文已遮挡 · 点击显示" : "中文已显示 · 点击遮挡"}</button>
      </div></div>`;
    if ((s.concepts || []).length) {
      h += `<div class="card"><h3>讲解</h3>`;
      s.concepts.forEach(c => {
        const tbls = (c.tables || []).map(tb => {
          const col = tb.header.map((_, i) => tb.rows.length > 0 && tb.rows.every(r => isTx(r[i] || "")));
          return `<div class="tbl-wrap"><table class="tbl tt"><thead><tr>${tb.header.map((x, i) => `<th${col[i] ? ' class="tx"' : ""}>${md(x)}</th>`).join("")}</tr></thead><tbody>${
            tb.rows.map(r => `<tr>${r.map(x => `<td class="${isTx(x) ? "tx" : ""}">${wrap(esc(x))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
        }).join("");
        h += `<div class="concept"><h4>${wrap(esc(c.title))}</h4>${c.body ? c.body.split("\n").map(p => p.trim()).filter(Boolean)
          .map(p => isTx(p) ? `<p class="tx-para">${wrap(esc(p))}</p>` : `<p>${md(p)}</p>`).join("") : ""}${tbls}</div>`;
      });
      h += `</div>`;
    }
    if ((s.vocab || []).length) {
      h += `<div class="card"><h3>词汇 <span class="hint">点喇叭听发音，点中文可显示/遮挡</span></h3><div class="vocab-grid">`;
      s.vocab.forEach(v => {
        h += `<div class="vcard ${hideZh ? "hide" : ""}">${spkBtn(v.a)}<div class="body"><div class="k tx">${esc(v.t)}</div><div class="r">${esc(v.p)}</div><div class="z">${esc(v.zh)}</div></div></div>`;
      });
      h += `</div></div>`;
    }
    if ((s.examples || []).length) {
      h += `<div class="card"><h3>例句</h3>`;
      s.examples.forEach(e => {
        h += `<div class="ex"><div class="top">${spkBtn(e.a)}<div style="flex:1;min-width:0"><div class="tx-line tx">${esc(e.t)}</div><div class="rom">${esc(e.p)}</div></div>
          <button class="spk slow" type="button" data-audio="${esc(e.a)}" data-rate="0.7" aria-label="慢速播放" title="慢速 0.7×">0.7×</button></div>
          <div class="zh ${hideZh ? "hidden-zh" : ""}">${esc(e.zh)}</div>${e.note ? `<div class="note">${esc(e.note)}</div>` : ""}</div>`;
      });
      h += `</div>`;
    }
    if ((s.drills || []).length) {
      h += `<div class="card"><h3>练习</h3>`;
      s.drills.forEach((d, i) => { h += `<div class="drill"><div class="q">${i + 1}. ${md(d.q)}</div><div class="a">答案：${md(d.a || "—")}</div><button class="reveal" type="button">显示答案</button></div>`; });
      h += `</div>`;
    }
    if ((s.tips || []).length) h += `<div>${s.tips.map(t => `<div class="tip"><b>易错提示</b> · ${md(t)}</div>`).join("")}</div>`;
    h += SRS.isDone(secId)
      ? `<div class="done-banner">✓ 本节已学完 · ${st.progress[secId] ? new Date(st.progress[secId].ts).toLocaleDateString("zh-CN") : ""}<button class="btn sm line" type="button" data-go="review" style="margin-left:auto">去复习</button></div>`
      : `<div style="margin-top:22px"><button class="btn" type="button" id="markDone">✓ 学完了，标记本节完成</button></div>`;
    h += `<div class="lesson-nav"><div>${prev ? `<button class="btn line" type="button" data-go="lesson/${prev.id}">← ${esc(prev.title)}</button>` : ""}</div>
      <div>${next ? `<button class="btn line" type="button" data-go="lesson/${next.id}">${esc(next.title)} →</button>` : ""}</div></div>`;
    show(h);
    st.lastLesson = secId; SRS.save();
    view.querySelectorAll(".vcard").forEach(c => c.onclick = ev => { if (!ev.target.closest(".spk")) c.classList.toggle("hide"); });
    view.querySelectorAll(".ex .zh.hidden-zh").forEach(z => z.onclick = () => z.classList.remove("hidden-zh"));
    view.querySelectorAll(".drill").forEach(d => { const rv = d.querySelector(".reveal"); rv.onclick = () => { d.classList.add("open"); rv.hidden = true; }; });
    const md_ = $("#markDone");
    if (md_) md_.onclick = () => { SRS.markDone(secId); toast("已标记完成"); pushToc(); lesson(secId); };
    $("#toggleZh").onclick = () => { SRS.load().settings.hideZh = !SRS.load().settings.hideZh; SRS.save(); lesson(secId); };
    ctx.touch("lesson/" + secId, `${ch.title} · ${s.title}`);
  }

  /* ---------------- 复习 ---------------- */
  let rev = null;
  function review() {
    if (!rev) {
      const due = SRS.dueQueue(120), nw = SRS.newQueue(SRS.load().settings.newPerDay);
      rev = { queue: due.concat(nw), i: 0, flipped: false, ok: 0, again: 0, started: Date.now() };
    }
    const q = rev.queue;
    if (rev.i >= q.length) return reviewDone();
    const c = q[rev.i], total = q.length;
    const toTx = c.dir === "zh2t";
    let h = `<div class="review-wrap"><div class="rev-progress"><span>${rev.i + 1} / ${total}</span><div class="bar"><i style="width:${pct(rev.i, total)}%"></i></div><span>✓ ${rev.ok}</span></div>
      <div class="flash" id="flash" role="button" tabindex="0" aria-label="点击翻面">`;
    if (!rev.flipped) {
      h += toTx ? `<div class="front-zh">${esc(c.front)}</div>` : `<div class="front-tx tx">${esc(c.front)}</div>${c.audio ? `<div class="front-audio">${spkBtn(c.audio)}</div>` : ""}`;
      h += `<div class="hint">点击卡片翻面 · 空格键</div></div>`;
    } else {
      h += `<div class="front-tx tx" style="font-size:30px">${esc(toTx ? c.back : c.front)}</div><div class="back">
        ${c.audio ? `<div style="margin-bottom:10px">${spkBtn(c.audio)}</div>` : ""}
        ${toTx ? `<div class="zh2">${esc(c.front)}</div>` : `<div class="zh2">${esc(c.back)}</div>`}
        <div class="rom2">${esc(c.rom || "")}</div>${c.note ? `<div class="note2">${esc(c.note)}</div>` : ""}
        <div class="src">${esc(c.chTitle)} · ${esc(c.secTitle)}</div></div></div>`;
    }
    h += rev.flipped
      ? `<div class="rate-row">${["忘记", "模糊", "记得", "太简单"].map((t, i) => `<button class="rate" type="button" data-r="${i}">${t}<small>${i + 1}</small></button>`).join("")}</div>`
      : `<div style="text-align:center;margin-top:14px"><button class="btn line" type="button" id="flipBtn">显示答案</button></div>`;
    show(h + `</div>`);
    const flip = () => { rev.flipped = true; review(); };
    const fl = $("#flash");
    if (fl && !rev.flipped) { fl.onclick = e => { if (!e.target.closest(".spk")) flip(); }; }
    const fb = $("#flipBtn"); if (fb) fb.onclick = flip;
    view.querySelectorAll(".rate").forEach(b => b.onclick = () => {
      const r = +b.dataset.r;
      SRS.rate(c.id, r);
      if (r === 0) { rev.again++; rev.queue.push(c); } else rev.ok++;
      rev.flipped = false; rev.i++; review();
    });
  }
  function reviewDone() {
    const n = rev ? rev.ok + rev.again : 0, mins = rev ? Math.max(1, Math.round((Date.now() - rev.started) / 60000)) : 0, st = SRS.cardStats();
    show(`<div class="empty"><div class="big">${ICON.check}</div><h2 class="page-title">今天的复习完成了</h2>
      <p class="page-sub">复习 ${n} 张 · 用时约 ${mins} 分钟 · 待复习 ${st.due} 张</p>
      <div class="btn-row"><button class="btn" type="button" data-go="">回到学习台</button>
      <button class="btn line" type="button" id="againBtn">再复习一轮</button><button class="btn line" type="button" data-go="quiz">做测验</button></div></div>`);
    $("#againBtn").onclick = () => { rev = null; review(); };
    rev = null;
  }

  /* ---------------- 测验 ---------------- */
  let qz = null;
  function quiz(scope) {
    if (!qz && scope && String(scope).startsWith("sec:")) {
      const sid = String(scope).slice(4), qs = QUIZ.build([sid], 8);
      if (!qs.length) { toast("这一节还没有足够的词汇，先去学一下"); return quiz(); }
      qz = { qs, i: 0, wrong: [], right: 0, secIds: [sid], scope: "sec" };
      return quiz();
    }
    if (!qz) {
      show(`${pageHead("测验", "题目从学过的词汇里自动生成，做错的词会回到复习队列。")}<div class="card"><h3>选择范围</h3><div class="btn-row" style="margin-top:10px;justify-content:flex-start">
        ${D.chapters.map(ch => `<button class="btn line" type="button" data-scope="${ch.id}">${esc(ch.title)} <span class="hint">${SRS.chapterProgress(ch).pct}%</span></button>`).join("")}
        <button class="btn" type="button" data-scope="all">全书随机 20 题</button></div></div>`);
      view.querySelectorAll("[data-scope]").forEach(b => b.onclick = () => {
        const sc = b.dataset.scope, ids = sc === "all" ? secs().map(s => s.id) : D.chapters.find(c => c.id === sc).sections.map(s => s.id);
        const qs = QUIZ.build(ids, sc === "all" ? 20 : 10);
        if (!qs.length) { toast("这一章还没有足够的词汇，先去学几节吧"); return; }
        qz = { qs, i: 0, wrong: [], right: 0, secIds: ids, scope: sc };
        quiz();
      });
      return;
    }
    const S = qz;
    if (S.i >= S.qs.length) return quizResult();
    const q = S.qs[S.i];
    show(`<div class="qbox"><div class="qhead"><span class="qtype">${esc(q.label)}</span><span class="qmeta">${S.i + 1} / ${S.qs.length}</span></div>
      <div class="qtext ${q.promptClass}">${esc(q.prompt)}</div>
      ${q.audio ? `<div style="margin:-10px 0 16px">${spkBtn(q.audio)} <span class="hint">点喇叭再听一次</span></div>` : ""}
      <div class="opts">${q.options.map((o, i) => `<button class="opt ${o.tx ? "tx-opt tx" : ""}" type="button" data-i="${i}">${esc(o.text)}</button>`).join("")}</div>
      <div class="qfeed" id="feed" aria-live="polite"></div>
      <div class="qfoot"><span class="qmeta">✓ ${S.right}</span><button class="btn line" type="button" id="nextBtn" hidden>下一题 →</button></div></div>`);
    if (q.audio) setTimeout(() => play(q.audio), 260);
    let answered = false;
    view.querySelectorAll(".opt").forEach(btn => btn.onclick = () => {
      if (answered) return;
      answered = true;
      const i = +btn.dataset.i, ok = i === q.answerIndex;
      view.querySelectorAll(".opt").forEach((b, j) => { b.disabled = true; if (j === q.answerIndex) b.classList.add("correct"); else if (j === i) b.classList.add("wrong"); });
      if (ok) { S.right++; $("#feed").textContent = "✓ 答对了 · " + q.explain; }
      else { S.wrong.push(q); $("#feed").innerHTML = "✗ 正确答案：" + esc(q.options[q.answerIndex].text) + `<br><span class="hint">${esc(q.explain)}</span>`; }
      const nb = $("#nextBtn"); nb.hidden = false;
      nb.textContent = S.i + 1 >= S.qs.length ? "看结果 →" : "下一题 →";
      nb.onclick = () => { S.i++; quiz(); };
      nb.focus();
    });
  }
  function quizResult() {
    const S = qz, acc = Math.round(S.right / S.qs.length * 100);
    show(`<div class="empty"><div class="big">${acc >= 80 ? "🏆" : acc >= 60 ? "👍" : "💪"}</div><h2 class="page-title">${S.right} / ${S.qs.length} 正确（${acc}%）</h2>
      <p class="page-sub">${acc >= 80 ? "掌握得不错，继续保持！" : "错题已记录，会在复习里再见到它们。"}</p></div>
      ${S.wrong.length ? `<div class="card"><h3>错题回顾</h3>${S.wrong.map(q => `<div class="ex"><div class="tx-line tx">${esc(q.options[q.answerIndex].text)}</div><div class="zh">${esc(q.explain)}</div></div>`).join("")}</div>` : ""}
      <div class="btn-row" style="margin-top:18px;justify-content:flex-start"><button class="btn" type="button" data-go="quiz" id="again">再来一组</button>
      <button class="btn line" type="button" data-go="">回到学习台</button><button class="btn line" type="button" id="retryWrong">重做错题</button></div>`);
    $("#again").onclick = () => { qz = null; ctx.go("quiz"); quiz(); };
    $("#retryWrong").onclick = () => {
      if (!S.wrong.length) { toast("没有错题"); return; }
      qz = { qs: S.wrong.slice(), i: 0, wrong: [], right: 0, secIds: S.secIds, scope: S.scope };
      quiz();
    };
    qz = null;
    SRS.save();
  }

  /* ---------------- 统计 / 词库 / 搜索 / 计划 ---------------- */
  function exportData() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(SRS.load(), null, 1)], { type: "application/json" }));
    a.download = F.name + "学习数据-" + SRS.day() + ".json";
    a.click(); toast("已导出");
  }
  function stats() {
    const st = SRS.cardStats(), s = SRS.load(), days = [];
    for (let i = 29; i >= 0; i--) days.push(SRS.day(-i));
    const maxRev = Math.max(1, ...days.map(k => (s.days[k] && s.days[k].rev) || 0));
    const wrongIds = Object.keys(s.wrong || {}).sort((a, b) => s.wrong[b] - s.wrong[a]).slice(0, 20);
    const cmap = {}; SRS.buildCards().forEach(c => cmap[c.id] = c);
    show(`${pageHead("学习统计", "数据保存在本机浏览器里，换设备不同步，可导出备份。")}
      <div class="grid4"><div class="stat"><div class="n">${SRS.streak()}<small> 天</small></div><div class="l">连续学习</div></div>
      <div class="stat"><div class="n">${st.seen}<small> / ${st.total}</small></div><div class="l">已接触卡片</div></div>
      <div class="stat"><div class="n">${st.mature}</div><div class="l">长期记住（间隔≥21天）</div></div>
      <div class="stat"><div class="n" style="color:var(--pink)">${st.due}</div><div class="l">今日待复习</div></div></div>
      <div class="card"><h3>最近 30 天复习量</h3><div class="chart">${days.map(k => { const v = (s.days[k] && s.days[k].rev) || 0;
        return `<div title="${k} · ${v} 张" style="height:${Math.max(3, v / maxRev * 100)}%;background:${v ? "var(--pink)" : "var(--bg2)"}"></div>`; }).join("")}</div>
        <div class="chart-ax"><span>30 天前</span><span>今天</span></div></div>
      <div class="card"><h3>各章进度</h3>${D.chapters.map(ch => { const p = SRS.chapterProgress(ch);
        return `<div style="margin:14px 0"><div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:5px"><span>${esc(ch.title)}</span><span style="color:var(--ink3)">${p.done}/${p.tot} 节</span></div><div class="bar"><i style="width:${p.pct}%"></i></div></div>`; }).join("")}</div>
      ${wrongIds.length ? `<div class="card"><h3>最常错的卡</h3><div class="table-wrap" style="max-height:340px"><table class="tbl"><thead><tr><th>内容</th><th>释义</th><th>错误次数</th></tr></thead><tbody>${
        wrongIds.map(id => { const c = cmap[id]; return c ? `<tr><td class="tx">${esc(c.front)}</td><td>${esc(c.dir === "zh2t" ? c.front : c.back)}</td><td>${s.wrong[id]}</td></tr>` : ""; }).join("")}</tbody></table></div></div>` : ""}
      <div class="btn-row" style="margin-top:20px;justify-content:flex-start"><button class="btn line" type="button" id="exportBtn">导出学习数据（JSON）</button>
      <button class="btn line danger" type="button" id="resetBtn">清空所有学习记录</button></div>`);
    $("#exportBtn").onclick = exportData;
    let armed = false;
    $("#resetBtn").onclick = e => {
      if (!armed) { armed = true; e.target.textContent = "再点一次确认清空"; setTimeout(() => { armed = false; e.target.textContent = "清空所有学习记录"; }, 3500); return; }
      SRS.reset(); toast("已清空"); pushToc(); stats();
    };
  }
  let vq = "";
  function vocabView() {
    const all = [];
    D.chapters.forEach(ch => ch.sections.forEach(s => (s.vocab || []).forEach(v => all.push({ ...v, sec: s.title, ch: ch.title }))));
    show(`${pageHead("词库", `全书共 ${all.length} 个词条。点喇叭听发音。`)}
      <input id="vq" class="lang-input" type="search" placeholder="筛选：${F.name} / 中文 / ${F.pronName}" value="${esc(vq)}" aria-label="筛选词库">
      <div id="vlist"></div>`, "wide");
    const draw = () => {
      const q = vq.toLowerCase(), list = q ? all.filter(v => (v.t + v.zh + v.p).toLowerCase().includes(q)) : all;
      $("#vlist").innerHTML = list.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>${F.name}</th><th>${F.pronName}</th><th>中文</th><th>出处</th></tr></thead><tbody>${
        list.slice(0, 1500).map(v => `<tr><td class="tx">${esc(v.t)}${spkBtn(v.a)}</td><td class="rom">${esc(v.p)}</td><td>${esc(v.zh)}</td><td class="src">${esc(v.ch)} · ${esc(v.sec)}</td></tr>`).join("")}</tbody></table></div>`
        + (list.length > 1500 ? `<p class="hint">只显示前 1500 条，请继续筛选。</p>` : "") : `<div class="empty">没有匹配的词</div>`;
      bindAudio($("#vlist"));
    };
    $("#vq").oninput = e => { vq = e.target.value; draw(); };
    draw();
  }
  function searchView(q) {
    if (!q) { show('<div class="empty">输入关键词搜索</div>'); return; }
    const res = [];
    secs().forEach(s => {
      const hit = [];
      (s.concepts || []).forEach(c => { if ((c.title + c.body).includes(q)) hit.push({ t: c.title, b: (c.body || "").slice(0, 120) }); });
      (s.vocab || []).forEach(v => { if ((v.t + v.zh + v.p).includes(q)) hit.push({ t: v.t + " " + v.zh, b: v.p }); });
      (s.examples || []).forEach(e => { if ((e.t + e.zh).includes(q)) hit.push({ t: e.t, b: e.zh }); });
      if (hit.length) res.push({ s, hit });
    });
    show(`${pageHead(`搜索「${q}」`, `${res.length} 节命中`)}${res.map(r => `<div class="card"><h3><a href="${ctx.href("lesson/" + r.s.id)}">${esc(r.s._ch.title)} · ${esc(r.s.title)}</a></h3>${
      r.hit.slice(0, 6).map(x => `<div class="hit"><b>${wrap(esc(x.t))}</b> <span>${wrap(esc(x.b))}</span></div>`).join("")}</div>`).join("")}${res.length ? "" : `<div class="empty">没有找到「${esc(q)}」</div>`}`);
  }
  function plan() {
    const pd = D.plan || [];
    show(`${pageHead("12 周学习计划", "按每周 5 天、每天 40–60 分钟设计。")}${pd.length ? pd.map((w, i) => {
      const ids = w.sections || [], done = ids.filter(id => SRS.isDone(id)).length;
      return `<div class="week-card"><div class="wk-h"><span class="tag">第 ${i + 1} 周</span><h4>${esc(w.name || w.title)}</h4><span class="hint">${done}/${ids.length} 节</span></div>
        <div class="bar" style="margin:8px 0 10px"><i style="width:${pct(done, ids.length)}%"></i></div><ul>${(w.goals || []).map(g => `<li>${esc(g)}</li>`).join("")}</ul>
        <div class="btn-row" style="margin-top:10px;justify-content:flex-start">${ids.map(id => { const s = findSec(id);
          return s ? `<button class="btn sm line ${SRS.isDone(id) ? "done" : ""}" type="button" data-go="lesson/${id}">${SRS.isDone(id) ? "✓ " : ""}${esc(s.title)}</button>` : ""; }).join("")}</div></div>`;
    }).join("") : '<div class="empty">计划生成中</div>'}`);
  }

  /* ---------------- 引擎接口（给语言插件用） ---------------- */
  const E = { ctx, esc, md, wrap, show, pageHead, spkBtn, audioOf, play, bindAudio, bindGo, toast, SPK_SVG, SVG, secs, view, $: s => view.querySelector(s),
    get D() { return D; }, get EXTRA() { return EXTRA; }, shuffle, pick, go: ctx.go };

  /* ---------------- 加载与路由 ---------------- */
  const loadScript = src => new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.append(s); });
  let ready = null, plugin = null;
  /* 加锁的书：data/course.enc 是 AES-256-GCM 密文（PBKDF2-SHA256 派生密钥），在浏览器里凭密码解开 */
  const b64 = x => Uint8Array.from(atob(x), c => c.charCodeAt(0));
  async function decryptWith(pw) {
    const meta = await fetch(base + "data/course.enc").then(r => r.json());
    const raw = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64(meta.salt), iterations: meta.iter, hash: "SHA-256" }, raw, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(meta.iv) }, key, b64(meta.ct))));
  }
  const ss = { get: k => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} } };
  async function loadData() {
    if (!B.locked) return fetch(base + "data/course.json").then(r => { if (!r.ok) throw new Error("course.json"); return r.json(); });
    const KEYS = ["kr-book-unlocked", "kr-handout-unlocked"];            // 沿用旧站的会话键，讲义页也能免输
    const saved = ss.get(KEYS[0]);
    if (saved) { try { return await decryptWith(saved); } catch {} }
    return new Promise(resolve => {
      const box = show(`<div class="card lang-gate"><h2>${esc(B.title)}</h2><p>这本课程整理自正式出版的教材，仅供个人学习，请输入访问密码。</p>
        <form id="gf"><input id="gp" type="password" placeholder="输入访问密码" autocomplete="current-password" aria-label="访问密码"><button class="btn" type="submit">进入</button></form><p class="err" id="ge" role="alert"></p></div>`);
      const input = box.querySelector("#gp"), err = box.querySelector("#ge"), go = box.querySelector(".btn");
      input.focus();
      box.querySelector("#gf").onsubmit = async e => {
        e.preventDefault(); go.disabled = true; err.textContent = "";
        try {
          if (!crypto.subtle) throw new Error("insecure");
          const j = await decryptWith(input.value);
          KEYS.forEach(k => ss.set(k, input.value));
          resolve(j);
        } catch { err.textContent = "密码不对，或当前环境不支持解密（请用 https 访问）"; go.disabled = false; input.select(); }
      };
    });
  }
  async function init() {
    const j = await loadData();
    D = j.COURSE; AUDIO_MAP = j.AUDIO_MAP || {}; EXTRA = j;
    const norm = o => ({ ...o, t: o[F.term], p: o[F.pron] });
    D.chapters.forEach(ch => ch.sections.forEach(s => { s.vocab = (s.vocab || []).map(norm); s.examples = (s.examples || []).map(norm); }));
    await loadScript(`lang-${F.id}.js`);
    plugin = window.HubLangPlugins[F.id](E);
    pushToc();
  }
  view.classList.add("lang", "lang-" + F.id);
  let fontEl = null;
  if (F.font) {                                                     // 随书的字体（阿语的 Naskh）
    fontEl = document.createElement("style");
    fontEl.textContent = `@font-face{font-family:"BookFont";src:url("${base}${F.font}") format("woff2");font-weight:400 700;font-display:swap}
      .lang-${F.id}{--tx-font:"BookFont","Geeza Pro","Noto Naskh Arabic",Georgia,serif}`;
    document.head.append(fontEl);
  }
  async function route(rest) {
    ready ||= init();
    try { await ready; } catch (e) { console.error(e); show('<div class="empty">加载失败，请刷新重试。</div>'); return; }
    const [name, ...more] = rest.split("/"), arg = more.join("/");
    stopAudio();
    if (name !== "review") rev = null;
    ctx.setCurrent(name === "lesson" ? arg : name || "home");
    switch (name) {
      case "lesson": return lesson(arg);
      case "letters": return plugin.letters(arg);
      case "review": return review();
      case "quiz": return quiz(arg);
      case "stats": return stats();
      case "plan": return plan();
      case "vocab": return vocabView();
      case "search": return searchView(decodeURIComponent(arg || ""));
      default: return home();
    }
  }
  const onKey = e => {
    if (/INPUT|TEXTAREA|SELECT/.test((document.activeElement && document.activeElement.tagName) || "") || e.metaKey || e.ctrlKey) return;
    const r = location.hash.replace(/^#\/b\/[^/]+\/?/, "");
    if (r.startsWith("review") && rev) {
      if ((e.key === " " || e.key === "Enter") && !rev.flipped) { e.preventDefault(); rev.flipped = true; review(); }
      else if (rev.flipped && /^[1-4]$/.test(e.key)) view.querySelector(`.rate[data-r="${+e.key - 1}"]`)?.click();
    } else if (r.startsWith("lesson/")) {
      const all = secs(), i = all.findIndex(x => x.id === r.split("/")[1]);
      if (e.key === "ArrowRight" && all[i + 1]) ctx.go("lesson/" + all[i + 1].id);
      if (e.key === "ArrowLeft" && all[i - 1]) ctx.go("lesson/" + all[i - 1].id);
    }
  };
  addEventListener("keydown", onKey);
  function destroy() {
    stopAudio(); player.removeAttribute("src"); player.load();
    removeEventListener("keydown", onKey);
    toastEl?.remove(); fontEl?.remove();
    view.classList.remove("lang", "lang-" + F.id);
    view.replaceChildren();
  }
  return { route, destroy };
};
