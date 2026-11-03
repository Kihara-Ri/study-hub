/* ===== 间隔重复 + 学习数据存储 ===== */
(function () {
  const KEY = 'fr-course-v1';
  const DEF = {
    v: 1,
    progress: {},   // secId -> {done:true, ts}
    srs: {},        // cardId -> {e,i,r,l,due,seen}
    days: {},       // 'YYYY-MM-DD' -> {rev, new, sec}
    wrong: {},      // cardId -> count
    settings: { theme: 'light', hideZh: true, newPerDay: 15, rate: 1 },
    lastLesson: null
  };

  let state = null;
  function load() {
    if (state) return state;
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? Object.assign({}, DEF, JSON.parse(raw)) : JSON.parse(JSON.stringify(DEF));
      state.settings = Object.assign({}, DEF.settings, state.settings || {});
    } catch (e) {
      state = JSON.parse(JSON.stringify(DEF));
    }
    return state;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function addDays(n) {
    const d = new Date(); d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  /* ---------- 卡片构建 ---------- */
  let CARDS = null;
  function buildCards() {
    if (CARDS) return CARDS;
    const D = window.COURSE;
    const cards = [];
    const seen = new Set();
    D.chapters.forEach(ch => ch.sections.forEach(sec => {
      (sec.vocab || []).forEach(v => {
        const base = sec.id + '|' + v.fr;
        if (seen.has(base)) return;
        seen.add(base);
        cards.push({
          id: 'vf:' + base, dir: 'fr2zh', secId: sec.id, chId: ch.id,
          front: v.fr, rom: v.ipa, back: v.zh, audio: v.a, kind: 'vocab',
          secTitle: sec.title, chTitle: ch.title
        });
        cards.push({
          id: 'vz:' + base, dir: 'zh2fr', secId: sec.id, chId: ch.id,
          front: v.zh, rom: v.ipa, back: v.fr, audio: v.a, kind: 'vocab',
          secTitle: sec.title, chTitle: ch.title
        });
      });
      (sec.examples || []).forEach((e, i) => {
        const base = sec.id + '|' + i;
        cards.push({
          id: 'ex:' + base, dir: 'fr2zh', secId: sec.id, chId: ch.id,
          front: e.fr, rom: e.ipa, back: e.zh, note: e.note, audio: e.a, kind: 'example',
          secTitle: sec.title, chTitle: ch.title
        });
      });
    }));
    CARDS = cards;
    return cards;
  }

  function cardState(id) {
    const s = load();
    if (!s.srs[id]) s.srs[id] = { e: 2.5, i: 0, r: 0, l: 0, due: today(), seen: 0 };
    return s.srs[id];
  }

  /* ---------- 复习队列 ---------- */
  function dueQueue(limit) {
    const t = today();
    const all = buildCards();
    const out = [];
    for (const c of all) {
      const st = load().srs[c.id];
      if (st && st.r > 0 && st.due <= t) out.push(c);
    }
    out.sort((a, b) => (load().srs[a.id].due < load().srs[b.id].due ? -1 : 1));
    return out.slice(0, limit || 200);
  }
  function newQueue(limit) {
    const all = buildCards();
    const out = [];
    const s = load();
    // 按章节顺序取新卡
    for (const c of all) {
      if (!s.srs[c.id] || s.srs[c.id].r === 0) {
        if (c.dir === 'zh2fr' && (!s.srs[c.id] || !s.srs[c.id].seen)) continue; // 先认读再回忆
        out.push(c);
      }
      if (out.length >= (limit || 15)) break;
    }
    return out;
  }

  function rate(cardId, r) {
    const s = load();
    const st = cardState(cardId);
    st.seen = (st.seen || 0) + 1;
    const day = today();
    s.days[day] = s.days[day] || { rev: 0, new: 0, sec: 0 };
    s.days[day].rev++;
    if (r === 0) {
      st.l++; st.r = 0; st.i = 0; st.e = Math.max(1.3, st.e - 0.2); st.due = day;
      s.wrong[cardId] = (s.wrong[cardId] || 0) + 1;
    } else {
      st.r++;
      if (st.r === 1) st.i = 1;
      else if (st.r === 2) st.i = 3;
      else st.i = Math.round(Math.max(1, st.i) * st.e);
      if (r === 1) st.e = Math.max(1.3, st.e - 0.15);
      if (r === 3) st.e = Math.min(3.2, st.e + 0.15);
      st.due = addDays(st.i);
    }
    save();
    return st;
  }

  /* ---------- 进度 ---------- */
  function markDone(secId) {
    const s = load();
    s.progress[secId] = { done: true, ts: Date.now() };
    s.lastLesson = secId;
    const day = today();
    s.days[day] = s.days[day] || { rev: 0, new: 0, sec: 0 };
    s.days[day].sec++;
    save();
  }
  function isDone(secId) { return !!(load().progress[secId] && load().progress[secId].done); }

  function chapterProgress(ch) {
    const tot = ch.sections.length;
    const done = ch.sections.filter(s => isDone(s.id)).length;
    return { done, tot, pct: tot ? Math.round(done / tot * 100) : 0 };
  }

  function streak() {
    const s = load();
    let n = 0;
    const d = new Date();
    for (let i = 0; i < 400; i++) {
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const rec = s.days[k];
      if (rec && (rec.rev > 0 || rec.sec > 0)) { n++; d.setDate(d.getDate() - 1); }
      else if (i === 0) { d.setDate(d.getDate() - 1); } // 今天还没学，不算断
      else break;
    }
    return n;
  }

  function cardStats() {
    const s = load();
    let total = 0, seen = 0, young = 0, mature = 0, due = 0;
    const t = today();
    for (const c of buildCards()) {
      total++;
      const st = s.srs[c.id];
      if (st && st.r > 0) {
        seen++;
        if (st.i >= 21) mature++; else young++;
        if (st.due <= t) due++;
      }
    }
    return { total, seen, young, mature, due };
  }

  function reset() {
    state = JSON.parse(JSON.stringify(DEF));
    save();
  }

  window.SRS = {
    load, save, today, addDays, buildCards, cardState,
    dueQueue, newQueue, rate, markDone, isDone, chapterProgress,
    streak, cardStats, reset, KEY
  };
})();
