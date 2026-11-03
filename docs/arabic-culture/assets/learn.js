/* ============================================================================
 * learn.js —— 「学习中心」互动层
 * ----------------------------------------------------------------------------
 * 数据：window.EXTRAS（契约见 content/EXTRAS.md），缺失/为空时逐段回退到内置
 *       样例数据（3 字母 / 5 词卡 / 2 题 / 3 名人），保证面板永远可用。
 * 依赖：window.BOOK（页面标题、页码）、window.__acb（跳页），均缺失时降级。
 * 存储：localStorage，key 前缀 ac-（ac-letters / ac-vocab / ac-quiz /
 *       ac-bm / ac-notes）。
 * 约束：零依赖、零网络、无图片；深色完全交给 style.css 的 CSS 变量。
 * ==========================================================================*/
(function () {
  'use strict';

  /* ======================================================================
   * 0. 常量
   * ==================================================================== */
  var LS = {
    letters: 'ac-letters',
    vocab: 'ac-vocab',
    quiz: 'ac-quiz',
    bm: 'ac-bm',
    notes: 'ac-notes',
    words: 'ac-words'
  };
  var TAB_IDS = ['letters', 'vocab', 'quiz', 'people', 'mine'];
  var TAB_NAMES = {
    letters: '字母表',
    vocab: '词卡',
    quiz: '自测',
    people: '名人',
    mine: '我的'
  };

  /* 内置样例数据：extras.js 尚未生成时（或某段为空时）使用 */
  var FALLBACK = {
    letters: [
      { ch: 'ا', name: 'ألف 艾利夫', part: '喉音', manner: '清音', ex_ar: 'أَبٌ', ex_zh: '父亲', page: 'p024' },
      { ch: 'ب', name: 'باء 巴乌', part: '唇音', manner: '浊音', ex_ar: 'بَيْتٌ', ex_zh: '房子', page: 'p024' },
      { ch: 'ت', name: 'تاء 塔乌', part: '齿音', manner: '清音', ex_ar: 'تِينٌ', ex_zh: '无花果', page: 'p024' }
    ],
    vocab: [
      { ar: 'كِتَاب', zh: '书', page: 'p042' },
      { ar: 'قَلَم', zh: '笔', page: 'p042' },
      { ar: 'مَدْرَسَة', zh: '学校', page: 'p042' },
      { ar: 'بَيْت', zh: '房子', page: 'p042' },
      { ar: 'مَاء', zh: '水', page: 'p042' }
    ],
    quiz: [
      {
        part: '第一编 阿拉伯语语言概略', page: 'p009',
        items: [{ q: '简述阿拉伯语的历史渊源。', hint: '' }]
      },
      {
        part: '第二编 阿拉伯文学概略', page: 'p020',
        items: [{ q: '阿拉伯语是如何在沙姆地区、两河流域及北非地区得到传播的？', hint: '' }]
      }
    ],
    people: [
      { no: 1, name: '穆罕默德先知', dates: '公元 570—632 年', period: '蒙昧时期和伊斯兰教初期', page: 'p190', summary: '伊斯兰教创始人，阿拉伯文化的精神源头。' },
      { no: 2, name: '贾希兹', dates: '公元 776—868 年', period: '阿拔斯时期', page: 'p190', summary: '阿拉伯散文大家，《动物书》《吝人列传》作者。' },
      { no: 3, name: '纪伯伦', dates: '1883—1931 年', period: '近现代', page: 'p190', summary: '旅美派文学代表，《先知》作者。' }
    ]
  };

  /* ======================================================================
   * 1. 存储
   * ==================================================================== */
  function loadJSON(key, dflt) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return dflt;
      var v = JSON.parse(raw);
      return v === null || v === undefined ? dflt : v;
    } catch (e) { return dflt; }
  }
  function saveJSON(key, val) {
    try { window.localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  /* ======================================================================
   * 2. 小工具
   * ==================================================================== */
  function $(sel, root) { return (root || document).querySelector(sel); }

  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function str(v) {
    if (typeof v === 'string') return v.trim();
    if (typeof v === 'number' && isFinite(v)) return String(v);
    return '';
  }
  function arr(v) { return Object.prototype.toString.call(v) === '[object Array]' ? v : []; }
  function pct(n, d) { return d > 0 ? Math.round((n / d) * 100) : 0; }
  function clamp(n, lo, hi) { return n < lo ? lo : (n > hi ? hi : n); }

  function toast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('show'); }, 1900);
  }

  /* ======================================================================
   * 3. 书籍信息（全部容错）
   * ==================================================================== */
  function book() { return window.BOOK || null; }

  function pageInfo(id) {
    var b = book();
    if (!b || !id || !b.pages || !b.pages[id]) return null;
    var i = b.order ? b.order.indexOf(id) : -1;
    return {
      id: id,
      title: str(b.pages[id].title) || id,
      no: i >= 0 ? i + 1 : 0
    };
  }
  function hasPage(id) { return !!pageInfo(id); }
  function pageLabel(id) {
    var p = pageInfo(id);
    if (!p) return id || '';
    return (p.no ? '第 ' + p.no + ' 节 · ' : '') + p.title;
  }
  function currentPageId() {
    try {
      var a = window.__acb;
      if (a && a.state && a.state.pageId) return a.state.pageId;
    } catch (e) {}
    var h = String(window.location.hash || '').replace(/^#\/?/, '').split('?')[0];
    try { h = decodeURIComponent(h); } catch (e) {}
    return h || null;
  }
  function jumpTo(id) {
    if (!id) return;
    if (!hasPage(id)) { toast('书中没有这一页'); return; }
    closeLearn();
    closeNoteModal();
    var a = window.__acb;
    if (a && typeof a.go === 'function') { a.go(id, { scroll: 'top' }); return; }
    window.location.hash = '#/' + id;
  }

  /* ======================================================================
   * 4. 数据归一化（EXTRAS 优先，逐段回退）
   * ==================================================================== */
  var DATA = { letters: [], vocab: [], quiz: [], people: [], sample: {} };

  function normalizeMail(data) {
    var raw = (window.EXTRAS && typeof window.EXTRAS === 'object') ? window.EXTRAS : {};

    /* ---- 字母表 ---- */
    DATA.letters = arr(raw.letters).map(function (x) {
      if (!x || typeof x !== 'object') return null;
      var ch = str(x.ch);
      if (!ch) return null;
      return {
        ch: ch,
        name: str(x.name),
        part: str(x.part),
        manner: str(x.manner),
        ex_ar: str(x.ex_ar),
        ex_zh: str(x.ex_zh),
        page: str(x.page)
      };
    }).filter(Boolean);
    if (!DATA.letters.length) { DATA.letters = FALLBACK.letters.slice(); DATA.sample.letters = true; }

    /* ---- 词卡 ---- */
    DATA.vocab = arr(raw.vocab).map(function (x) {
      if (!x || typeof x !== 'object') return null;
      var ar = str(x.ar);
      if (!ar) return null;
      return { ar: ar, zh: str(x.zh), page: str(x.page) };
    }).filter(Boolean);
    if (!DATA.vocab.length) { DATA.vocab = FALLBACK.vocab.slice(); DATA.sample.vocab = true; }

    /* ---- 思考题（按编分组） ---- */
    DATA.quiz = arr(raw.quiz).map(function (g, gi) {
      if (!g || typeof g !== 'object') return null;
      var items = arr(g.items).map(function (it) {
        if (!it || typeof it !== 'object') return null;
        var q = str(it.q);
        if (!q) return null;
        return { q: q, hint: str(it.hint) };
      }).filter(Boolean);
      if (!items.length) return null;
      return {
        part: str(g.part) || ('第 ' + (gi + 1) + ' 组'),
        page: str(g.page),
        items: items
      };
    }).filter(Boolean);
    if (!DATA.quiz.length) { DATA.quiz = FALLBACK.quiz.slice(); DATA.sample.quiz = true; }

    /* ---- 名人 ---- */
    DATA.people = arr(raw.people).map(function (x, i) {
      if (!x || typeof x !== 'object') return null;
      var name = str(x.name);
      if (!name) return null;
      var no = parseInt(x.no, 10);
      return {
        no: isFinite(no) ? no : (i + 1),
        name: name,
        dates: str(x.dates),
        period: str(x.period) || '其他',
        page: str(x.page),
        summary: str(x.summary)
      };
    }).filter(Boolean);
    if (!DATA.people.length) { DATA.people = FALLBACK.people.slice(); DATA.sample.people = true; }
  }

  /* ======================================================================
   * 5. 状态
   * ==================================================================== */
  var S = {
    ready: false,
    open: false,
    tab: 'letters',
    /* 持久化 */
    letters: [],   /* 已掌握字母 ch 数组 */
    vocab: {},     /* ar -> 'know' | 'later' */
    quiz: {},      /* groupKey:index -> 'know' | 'later' */
    bms: [],       /* [{id, ts}] */
    notes: {},     /* id -> {text, ts} */
    words: {},     /* 归一化词 -> {ar, zh, page, ts} */
    /* 运行时 */
    vi: 0,
    vflip: false,
    onlyUnlearned: false,
    peoplePeriod: 'all',
    peopleQ: '',
    sideCh: null,
    notePage: null
  };

  function loadState() {
    var l = loadJSON(LS.letters, []);
    S.letters = arr(l).map(str).filter(Boolean);

    var v = loadJSON(LS.vocab, {});
    S.vocab = {};
    if (v && typeof v === 'object') {
      Object.keys(v).forEach(function (k) {
        if (v[k] === 'know' || v[k] === 'later') S.vocab[k] = v[k];
      });
    }

    var q = loadJSON(LS.quiz, {});
    S.quiz = {};
    if (q && typeof q === 'object') {
      Object.keys(q).forEach(function (k) {
        if (q[k] === 'know' || q[k] === 'later') S.quiz[k] = q[k];
      });
    }

    var b = loadJSON(LS.bm, []);
    S.bms = arr(b).map(function (x) {
      if (typeof x === 'string') return { id: x, ts: 0 };
      if (!x || typeof x !== 'object' || !str(x.id)) return null;
      var ts = parseInt(x.ts, 10);
      return { id: str(x.id), ts: isFinite(ts) ? ts : 0 };
    }).filter(Boolean);

    var n = loadJSON(LS.notes, {});
    S.notes = {};
    if (n && typeof n === 'object') {
      Object.keys(n).forEach(function (k) {
        var o = n[k];
        if (!o) return;
        var text = typeof o === 'string' ? o : str(o.text);
        if (!text) return;
        var ts = o && typeof o === 'object' ? parseInt(o.ts, 10) : 0;
        S.notes[k] = { text: text, ts: isFinite(ts) ? ts : 0 };
      });
    }

    var w = loadJSON(LS.words, {});
    S.words = {};
    if (w && typeof w === 'object') {
      Object.keys(w).forEach(function (k) {
        var o = w[k];
        if (!o) return;
        var ar = typeof o === 'string' ? o : str(o.ar);
        if (!ar) return;
        var wts = o && typeof o === 'object' ? parseInt(o.ts, 10) : 0;
        S.words[k] = {
          ar: ar,
          zh: o && typeof o === 'object' ? str(o.zh) : '',
          page: o && typeof o === 'object' ? str(o.page) : '',
          ts: isFinite(wts) ? wts : 0
        };
      });
    }
  }

  /* ---- 字母 ---- */
  function isMastered(ch) { return S.letters.indexOf(ch) >= 0; }
  function toggleMastered(ch) {
    var i = S.letters.indexOf(ch);
    if (i >= 0) S.letters.splice(i, 1);
    else S.letters.push(ch);
    saveJSON(LS.letters, S.letters);
  }
  function countMasteredLetters() {
    var n = 0;
    DATA.letters.forEach(function (x) { if (isMastered(x.ch)) n++; });
    return n;
  }

  /* ---- 词卡 ---- */
  function vocabStatus(ar) { return S.vocab[ar] || ''; }
  function countKnownVocab() {
    var n = 0;
    DATA.vocab.forEach(function (v) { if (S.vocab[v.ar] === 'know') n++; });
    return n;
  }

  /* ---- 自测 ---- */
  function qkey(g, gi, ii) { return (g.page || ('g' + gi)) + ':' + ii; }
  function quizStatus(g, gi, ii) { return S.quiz[qkey(g, gi, ii)] || ''; }
  function countQuiz() {
    var total = 0, done = 0, know = 0;
    DATA.quiz.forEach(function (g, gi) {
      g.items.forEach(function (it, ii) {
        total++;
        var st = quizStatus(g, gi, ii);
        if (st) done++;
        if (st === 'know') know++;
      });
    });
    return { total: total, done: done, know: know };
  }

  /* ---- 书签 ---- */
  function bookmarkIndex(id) {
    for (var i = 0; i < S.bms.length; i++) if (S.bms[i].id === id) return i;
    return -1;
  }
  function isBookmarked(id) { return !!id && bookmarkIndex(id) >= 0; }
  function bookmarksSorted() { return S.bms.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }); }

  function toggleBookmark(id) {
    if (!id || !hasPage(id)) { toast('当前页面无法加书签'); return; }
    var i = bookmarkIndex(id);
    if (i >= 0) {
      S.bms.splice(i, 1);
      saveJSON(LS.bm, S.bms);
      toast('已取消书签');
    } else {
      S.bms.unshift({ id: id, ts: Date.now() });
      saveJSON(LS.bm, S.bms);
      toast('已加书签 · ' + pageLabel(id));
    }
    syncPageButtons();
    if (S.open && S.tab === 'mine') renderBody();
  }
  function removeBookmark(id) {
    var i = bookmarkIndex(id);
    if (i < 0) return;
    S.bms.splice(i, 1);
    saveJSON(LS.bm, S.bms);
    syncPageButtons();
    renderBody();
    toast('已删除书签');
  }

  /* ---- 笔记 ---- */
  function hasNote(id) { return !!(id && S.notes[id] && S.notes[id].text); }
  function notesSorted() {
    return Object.keys(S.notes).map(function (id) {
      return { id: id, text: S.notes[id].text, ts: S.notes[id].ts || 0 };
    }).sort(function (a, b) { return b.ts - a.ts; });
  }
  function saveNote(id, text) {
    if (!id) return;
    text = String(text || '').replace(/\s+$/, '');
    if (!text) {
      delete S.notes[id];
      saveJSON(LS.notes, S.notes);
      toast('已删除本页笔记');
      return;
    }
    S.notes[id] = { text: text, ts: Date.now() };
    saveJSON(LS.notes, S.notes);
    toast('笔记已保存');
  }
  function removeNote(id) {
    if (!S.notes[id]) return;
    delete S.notes[id];
    saveJSON(LS.notes, S.notes);
    syncPageButtons();
    renderBody();
    toast('已删除笔记');
  }

  /* ---- 生词本 ---- */
  function wordsSorted() {
    var out = [];
    Object.keys(S.words || {}).forEach(function (k) {
      var w = S.words[k];
      if (!w || !w.ar) return;
      out.push({ key: k, ar: w.ar, zh: w.zh || '', page: w.page || '', ts: w.ts || 0 });
    });
    return out.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
  }
  function addWord(raw, zh, page) {
    var k = normAr(raw);
    if (!k) { toast('没有可保存的词'); return; }
    S.words[k] = { ar: String(raw || ''), zh: String(zh || '').trim(), page: page || '', ts: Date.now() };
    saveJSON(LS.words, S.words);
    if (S.open && S.tab === 'mine') renderBody();
    toast('已加入生词本');
  }
  function removeWord(key) {
    if (!key || !S.words || !S.words[key]) return;
    delete S.words[key];
    saveJSON(LS.words, S.words);
    if (S.open && S.tab === 'mine') renderBody();
    toast('已移出生词本');
  }

  /* ======================================================================
   * 6. DOM：入口、面板、侧卡、弹层
   * ==================================================================== */
  var panel = null, tabsEl = null, bodyEl = null, subEl = null;
  var sideEl = null, sideBg = null;
  var modalBg = null, noteTextEl = null, noteSubEl = null;

  function ensureEntryButton() {
    if (document.getElementById('btnLearn')) return;
    var ta = $('.top-actions');
    if (!ta) return;
    var b = document.createElement('button');
    b.id = 'btnLearn';
    b.type = 'button';
    b.className = 'lp-entry';
    b.textContent = '互动';
    b.title = '打开学习中心（字母表 · 词卡 · 自测 · 名人 · 我的）';
    ta.insertBefore(b, ta.firstChild);
  }

  /* 阅读页工具栏：书签 / 笔记（注入到 top-actions，持久存在，不随 render 重建） */
  function ensurePageButtons() {
    var ta = $('.top-actions');
    if (!ta || document.getElementById('btnBookmark')) return;

    var bm = document.createElement('button');
    bm.type = 'button';
    bm.id = 'btnBookmark';
    bm.className = 'icon-btn learn-page-btn';
    bm.textContent = '☆';
    bm.title = '加书签';
    bm.setAttribute('aria-label', '加书签');
    bm.setAttribute('aria-pressed', 'false');

    var nt = document.createElement('button');
    nt.type = 'button';
    nt.id = 'btnNote';
    nt.className = 'icon-btn learn-page-btn';
    nt.textContent = '✎';
    nt.title = '写本页笔记';
    nt.setAttribute('aria-label', '写本页笔记');
    nt.setAttribute('aria-pressed', 'false');

    var anchor = document.getElementById('btnLearn');
    if (anchor && anchor.parentNode === ta) {
      anchor.insertAdjacentElement('afterend', nt);
      anchor.insertAdjacentElement('afterend', bm);
    } else {
      ta.appendChild(bm);
      ta.appendChild(nt);
    }
  }

  function buildPanel() {
    if (document.getElementById('learnPanel')) {
      panel = document.getElementById('learnPanel');
      tabsEl = document.getElementById('lpTabs');
      bodyEl = document.getElementById('lpBody');
      subEl = document.getElementById('lpSub');
      return;
    }
    panel = document.createElement('div');
    panel.id = 'learnPanel';
    panel.className = 'lp';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'lpTitle');

    panel.innerHTML =
      '<div class="lp-inner">' +
        '<div class="lp-head">' +
          '<div class="lp-hd-text">' +
            '<h2 class="lp-title" id="lpTitle">学习中心</h2>' +
            '<p class="lp-sub" id="lpSub"></p>' +
          '</div>' +
          '<button class="lp-close" id="lpClose" type="button" aria-label="关闭学习中心" title="关闭 (Esc)">✕</button>' +
        '</div>' +
        '<div class="lp-tabs" id="lpTabs" role="tablist" aria-label="学习中心分区"></div>' +
        '<div class="lp-body" id="lpBody" role="tabpanel" tabindex="-1"></div>' +
      '</div>';

    document.body.appendChild(panel);
    tabsEl = document.getElementById('lpTabs');
    bodyEl = document.getElementById('lpBody');
    subEl = document.getElementById('lpSub');
  }

  function buildSide() {
    if (document.getElementById('lpSide')) {
      sideEl = document.getElementById('lpSide');
      sideBg = document.getElementById('lpSideBg');
      return;
    }
    sideBg = document.createElement('div');
    sideBg.id = 'lpSideBg';
    sideBg.className = 'lp-side-bg';
    sideBg.hidden = true;
    document.body.appendChild(sideBg);

    sideEl = document.createElement('aside');
    sideEl.id = 'lpSide';
    sideEl.className = 'lp-side';
    sideEl.hidden = true;
    sideEl.setAttribute('role', 'dialog');
    sideEl.setAttribute('aria-modal', 'true');
    sideEl.setAttribute('aria-label', '字母详情');
    document.body.appendChild(sideEl);
  }

  function buildModal() {
    if (document.getElementById('lpModal')) {
      modalBg = document.getElementById('lpModal');
      noteTextEl = document.getElementById('lpNoteText');
      noteSubEl = document.getElementById('lpModalSub');
      return;
    }
    modalBg = document.createElement('div');
    modalBg.id = 'lpModal';
    modalBg.className = 'lp-modal-bg';
    modalBg.hidden = true;
    modalBg.innerHTML =
      '<div class="lp-modal" role="dialog" aria-modal="true" aria-labelledby="lpModalTitle">' +
        '<h3 id="lpModalTitle">本页笔记</h3>' +
        '<p class="lp-modal-sub" id="lpModalSub"></p>' +
        '<textarea id="lpNoteText" placeholder="写下这一页的想法、疑问或摘抄…" spellcheck="false"></textarea>' +
        '<p class="lp-modal-tip">只保存在本机浏览器（localStorage），不会上传；清空后保存即删除。</p>' +
        '<div class="lp-modal-row">' +
          '<button class="lp-btn ghost" id="lpNoteCancel" type="button">取消</button>' +
          '<button class="lp-btn warn" id="lpNoteDelete" type="button">删除</button>' +
          '<button class="lp-btn primary" id="lpNoteSave" type="button">保存</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modalBg);
    noteTextEl = document.getElementById('lpNoteText');
    noteSubEl = document.getElementById('lpModalSub');
  }

  /* ======================================================================
   * 7. 面板开关 / tab
   * ==================================================================== */
  function renderTabs() {
    if (!tabsEl) return;
    var h = '';
    TAB_IDS.forEach(function (id) {
      h += '<button class="lp-tab" id="lpTab-' + id + '" type="button" role="tab"' +
        ' data-tab="' + id + '" aria-controls="lpBody" aria-selected="' +
        (S.tab === id ? 'true' : 'false') + '">' + TAB_NAMES[id] + '</button>';
    });
    tabsEl.innerHTML = h;
    var active = document.getElementById('lpTab-' + S.tab);
    if (active && active.scrollIntoView) {
      try { active.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {}
    }
  }

  function updateSub() {
    if (!subEl) return;
    var t = '';
    if (S.tab === 'letters') {
      t = DATA.letters.length ? (DATA.letters.length + ' 个字母 · 已掌握 ' + countMasteredLetters() + ' / ' + DATA.letters.length) : '数据准备中';
    } else if (S.tab === 'vocab') {
      t = DATA.vocab.length ? (DATA.vocab.length + ' 张词卡 · 已掌握 ' + countKnownVocab() + ' / ' + DATA.vocab.length) : '数据准备中';
    } else if (S.tab === 'quiz') {
      var q = countQuiz();
      t = DATA.quiz.length ? (DATA.quiz.length + ' 编 · ' + q.total + ' 道思考题 · 已完成 ' + q.done + ' / ' + q.total) : '数据准备中';
    } else if (S.tab === 'people') {
      t = DATA.people.length ? (DATA.people.length + ' 位文化名人 · 可按时期与姓名筛选') : '数据准备中';
    } else {
      t = bookmarksSorted().length + ' 个书签 · ' + notesSorted().length + ' 条笔记';
    }
    subEl.textContent = t;
  }

  function renderBody() {
    if (!panel || panel.hidden || !bodyEl) return;
    var y = bodyEl.scrollTop;
    bodyEl.innerHTML = viewForTab();
    bodyEl.scrollTop = y;
    bodyEl.setAttribute('aria-labelledby', 'lpTab-' + S.tab);
    updateSub();
  }

  function viewForTab() {
    if (S.tab === 'vocab') return viewVocab();
    if (S.tab === 'quiz') return viewQuiz();
    if (S.tab === 'people') return viewPeople();
    if (S.tab === 'mine') return viewMine();
    return viewLetters();
  }

  function openLearn(tab) {
    if (!panel) return;
    if (tab && TAB_IDS.indexOf(tab) >= 0) S.tab = tab;
    else if (TAB_IDS.indexOf(S.tab) < 0) S.tab = 'letters';

    closeWordPop();
    closeSide();
    S.open = true;
    panel.hidden = false;
    document.documentElement.classList.add('lp-open');
    renderTabs();
    if (bodyEl) bodyEl.scrollTop = 0;
    renderBody();

    var active = document.getElementById('lpTab-' + S.tab);
    if (active && active.focus) { try { active.focus(); } catch (e) {} }
  }

  function closeLearn() {
    if (!panel || !S.open) return;
    closeSide();
    S.open = false;
    panel.hidden = true;
    document.documentElement.classList.remove('lp-open');
    var b = document.getElementById('btnLearn');
    if (b && b.focus) { try { b.focus(); } catch (e) {} }
  }

  function setTab(id) {
    if (TAB_IDS.indexOf(id) < 0 || S.tab === id) return;
    S.tab = id;
    S.vflip = false;
    closeSide();
    renderTabs();
    if (bodyEl) bodyEl.scrollTop = 0;
    renderBody();
  }

  /* ======================================================================
   * 8. 视图：字母表
   * ==================================================================== */
  function viewLetters() {
    if (!DATA.letters.length) return '<div class="lp-sec">' + emptyBox('暂无字母表数据', '') + '</div>';
    var total = DATA.letters.length;
    var n = countMasteredLetters();
    var h = '<div class="lp-sec">';
    h += '<div class="lp-prog"><div class="lp-bar"><i style="width:' + pct(n, total) + '%"></i></div>' +
      '<span class="lp-prog-txt">已掌握 ' + n + ' / ' + total + '</span></div>';
    h += '<div class="lp-letters">';
    DATA.letters.forEach(function (x, i) {
      var m = isMastered(x.ch);
      var sel = S.sideCh === x.ch;
      h += '<button type="button" class="lp-letter' + (m ? ' mastered' : '') + '"' +
        ' data-act="letter" data-i="' + i + '"' +
        (sel ? ' aria-current="true"' : '') +
        ' aria-label="' + esc(x.name || x.ch) + '">' +
        '<span class="lp-lch">' + esc(x.ch) + '</span>' +
        '<span class="lp-lnm">' + esc(x.name || '') + '</span>' +
        '</button>';
    });
    h += '</div>';
    h += '<p class="lp-hint-row">点击任意字母查看名称、发音部位、发音方法与书中例词；标记的「已掌握」会保存在本机。</p>';
    if (DATA.sample.letters) h += sampleNote();
    h += '</div>';
    return h;
  }

  function openLetter(i) {
    var it = DATA.letters[i];
    if (!it || !sideEl) return;
    S.sideCh = it.ch;
    renderSide(it);
    sideBg.hidden = false;
    sideEl.hidden = false;
    document.documentElement.classList.add('lp-side-open');
    var c = sideEl.querySelector('.lp-side-close');
    if (c && c.focus) { try { c.focus(); } catch (e) {} }
    /* 网格上标出当前项 */
    if (bodyEl) {
      var all = bodyEl.querySelectorAll('.lp-letter');
      for (var k = 0; k < all.length; k++) all[k].removeAttribute('aria-current');
      var cur = bodyEl.querySelector('.lp-letter[data-i="' + i + '"]');
      if (cur) cur.setAttribute('aria-current', 'true');
    }
  }

  function renderSide(it) {
    if (!sideEl) return;
    var m = isMastered(it.ch);
    var h = '<div class="lp-side-top">' +
      '<div class="lp-side-ch">' + esc(it.ch) + '</div>' +
      '<div class="lp-side-head">' +
        '<h3 class="lp-side-name">' + esc(it.name || it.ch) + '</h3>' +
        '<p class="lp-side-kind">' + esc([it.part, it.manner].filter(Boolean).join(' · ') || '阿拉伯语字母') + '</p>' +
      '</div>' +
      '<button class="lp-side-close" type="button" data-act="side-close" aria-label="关闭详情">✕</button>' +
      '</div>';

    var kv = '';
    if (it.part) kv += '<div><dt>发音部位</dt><dd>' + esc(it.part) + '</dd></div>';
    if (it.manner) kv += '<div><dt>发音方法</dt><dd>' + esc(it.manner) + '</dd></div>';
    if (kv) h += '<dl class="lp-kv">' + kv + '</dl>';

    if (it.ex_ar || it.ex_zh) {
      h += '<div class="lp-ex">' +
        '<p class="lp-ex-label">书中例词</p>' +
        (it.ex_ar ? '<p class="lp-ex-ar">' + esc(it.ex_ar) + '</p>' : '') +
        (it.ex_zh ? '<p class="lp-ex-zh">' + esc(it.ex_zh) + '</p>' : '') +
        '</div>';
    }

    h += '<div class="lp-side-actions">';
    h += '<button class="lp-btn good" type="button" data-act="side-master" data-ch="' + esc(it.ch) + '"' +
      ' aria-pressed="' + (m ? 'true' : 'false') + '">' + (m ? '✓ 已掌握（点击取消）' : '标为已掌握') + '</button>';
    if (it.page && hasPage(it.page)) {
      h += '<button class="lp-btn" type="button" data-act="jump" data-page="' + esc(it.page) + '"' +
        ' title="' + esc(pageLabel(it.page)) + '">跳到正文 · 第 ' + (pageInfo(it.page) || {}).no + ' 节</button>';
    }
    h += '</div>';
    sideEl.innerHTML = h;
  }

  function closeSide() {
    if (sideEl) sideEl.hidden = true;
    if (sideBg) sideBg.hidden = true;
    document.documentElement.classList.remove('lp-side-open');
    S.sideCh = null;
    if (bodyEl) {
      var cur = bodyEl.querySelector('.lp-letter[aria-current="true"]');
      if (cur) cur.removeAttribute('aria-current');
    }
  }
  function sideIsOpen() { return !!(sideEl && !sideEl.hidden); }

  /* ======================================================================
   * 9. 视图：词卡
   * ==================================================================== */
  function vocabPool() {
    var out = [];
    DATA.vocab.forEach(function (v, i) {
      if (S.onlyUnlearned && S.vocab[v.ar] === 'know') return;
      out.push({ v: v, i: i });
    });
    return out;
  }
  function clampVi() {
    var pool = vocabPool();
    if (!pool.length) { S.vi = 0; return; }
    S.vi = clamp(S.vi, 0, pool.length - 1);
  }

  function viewVocab() {
    if (!DATA.vocab.length) return '<div class="lp-sec">' + emptyBox('暂无词卡数据', '') + '</div>';
    var total = DATA.vocab.length;
    var known = countKnownVocab();
    var pool = vocabPool();
    var h = '<div class="lp-sec">';
    h += '<div class="lp-prog"><div class="lp-bar green"><i style="width:' + pct(known, total) + '%"></i></div>' +
      '<span class="lp-prog-txt">已掌握 ' + known + ' / ' + total + '</span></div>';

    if (!pool.length) {
      h += emptyBox('这一组词卡都标成「会了」了', '点下面的按钮可以重新看到全部词卡。');
      h += '<div class="lp-vnav"><button class="lp-btn" type="button" data-act="vreset">查看全部词卡</button></div>';
      h += '</div>';
      return h;
    }

    clampVi();
    var cur = pool[S.vi];
    var st = vocabStatus(cur.v.ar);
    h += '<div class="lp-vtop">' +
      '<span class="lp-tag">第 ' + (S.vi + 1) + ' / ' + pool.length + ' 张</span>' +
      (S.onlyUnlearned ? '<span class="lp-tag">只练未掌握</span>' : '') +
      (st === 'know' ? '<span class="lp-tag good">已标：会了</span>' : '') +
      (st === 'later' ? '<span class="lp-tag warn">已标：再看看</span>' : '') +
      '</div>';

    h += '<div class="lp-vwrap">';
    h += '<div class="lp-vcard' + (S.vflip ? ' flipped' : '') + '" id="lpVCard" data-act="flip"' +
      ' tabindex="0" role="button" aria-label="词卡：点击翻转" aria-pressed="' + (S.vflip ? 'true' : 'false') + '">';
    h += '<div class="lp-vface front">' +
      '<p class="lp-var">' + esc(cur.v.ar) + '</p>' +
      '<p class="lp-vhint">点击翻转看中文</p>' +
      '</div>';
    h += '<div class="lp-vface back">' +
      '<p class="lp-vzh">' + esc(cur.v.zh || '（暂无中文）') + '</p>' +
      '<p class="lp-vpage">' + esc(cur.v.page && hasPage(cur.v.page) ? pageLabel(cur.v.page).slice(0, 26) : '') + '</p>' +
      '<p class="lp-vhint">再点一次翻回</p>' +
      '</div>';
    h += '</div></div>';

    h += '<div class="lp-vmeta">' + (S.onlyUnlearned ? '筛选后 ' + pool.length + ' 张 · ' : '') +
      '已掌握 ' + known + ' / ' + total + '</div>';

    h += '<div class="lp-vnav">' +
      '<button class="lp-btn" type="button" data-act="vprev">‹ 上一张</button>' +
      '<button class="lp-btn primary" type="button" data-act="vnext">下一张 ›</button>' +
      '<button class="lp-btn" type="button" data-act="vrand">随机</button>' +
      '<button class="lp-btn" type="button" data-act="vfilter" aria-pressed="' + (S.onlyUnlearned ? 'true' : 'false') + '">只练未掌握</button>' +
      '</div>';

    h += '<div class="lp-vmark">' +
      '<button class="lp-btn good" type="button" data-act="vknow" aria-pressed="' + (st === 'know' ? 'true' : 'false') + '">会了</button>' +
      '<button class="lp-btn warn" type="button" data-act="vlater" aria-pressed="' + (st === 'later' ? 'true' : 'false') + '">再看看</button>' +
      (cur.v.page && hasPage(cur.v.page) ? '<button class="lp-btn" type="button" data-act="jump" data-page="' + esc(cur.v.page) + '">跳到该词正文</button>' : '') +
      '</div>';

    h += '<p class="lp-hint-row">键盘 ← / → 切换，空格翻转；标注会保存在本机。</p>';
    if (DATA.sample.vocab) h += sampleNote();
    h += '</div>';
    return h;
  }

  function vocabStep(d) {
    var pool = vocabPool();
    if (!pool.length) return;
    clampVi();
    S.vi = clamp(S.vi + d, 0, pool.length - 1);
    S.vflip = false;
    renderBody();
  }
  function vocabRandom() {
    var pool = vocabPool();
    if (!pool.length) return;
    if (pool.length === 1) { S.vi = 0; S.vflip = false; renderBody(); return; }
    var n = pool.length, cur = clamp(S.vi, 0, n - 1), next = cur;
    while (next === cur) next = Math.floor(Math.random() * n);
    S.vi = next;
    S.vflip = false;
    renderBody();
  }
  function toggleFlip() {
    var card = document.getElementById('lpVCard');
    if (!card) return;
    card.classList.toggle('flipped');
    S.vflip = card.classList.contains('flipped');
    card.setAttribute('aria-pressed', S.vflip ? 'true' : 'false');
  }
  function markVocab(status) {
    var pool = vocabPool();
    if (!pool.length) return;
    clampVi();
    var cur = pool[S.vi];
    var key = cur.v.ar;
    if (S.vocab[key] === status) delete S.vocab[key];
    else S.vocab[key] = status;
    saveJSON(LS.vocab, S.vocab);

    if (S.vocab[key] === 'know') {
      /* 「会了」后自动翻到下一张；池子末尾则留在原地 */
      S.vflip = false;
      var was = S.vi;
      var nextPool = vocabPool();
      if (nextPool.length) {
        S.vi = clamp(S.vi, 0, nextPool.length - 1);
        if (S.vi < nextPool.length - 1) S.vi += 1;
        else S.vi = was;
      }
    }
    renderBody();
  }

  /* ======================================================================
   * 10. 视图：自测
   * ==================================================================== */
  function viewQuiz() {
    if (!DATA.quiz.length) return '<div class="lp-sec">' + emptyBox('暂无思考题数据', '') + '</div>';
    var all = countQuiz();
    var h = '<div class="lp-sec">';
    h += '<div class="lp-prog"><div class="lp-bar teal"><i style="width:' + pct(all.done, all.total) + '%"></i></div>' +
      '<span class="lp-prog-txt">总完成度 ' + all.done + ' / ' + all.total + '</span></div>';

    DATA.quiz.forEach(function (g, gi) {
      var total = g.items.length, done = 0;
      g.items.forEach(function (it, ii) { if (quizStatus(g, gi, ii)) done++; });
      var p = pageInfo(g.page);
      h += '<section class="lp-qgroup">';
      h += '<div class="lp-qhead">' +
        '<h4>' + esc(g.part) + '</h4>' +
        '<span class="lp-bar teal"><i style="width:' + pct(done, total) + '%"></i></span>' +
        '<span class="lp-count">' + done + ' / ' + total + '</span>' +
        (p ? '<button class="lp-btn sm ghost" type="button" data-act="jump" data-page="' + esc(g.page) + '" title="' + esc(pageLabel(g.page)) + '">跳到正文</button>' : '') +
        '</div>';
      h += '<ul class="lp-qlist">';
      g.items.forEach(function (it, ii) {
        var st = quizStatus(g, gi, ii);
        var tag = st === 'know' ? '会了' : (st === 'later' ? '再看看' : '待自测');
        var tagCls = st === 'know' ? ' good' : (st === 'later' ? ' warn' : '');
        h += '<li class="lp-qitem">' +
          '<p class="lp-qq"><span class="lp-qn">' + (ii + 1) + '.</span>' + esc(it.q) + '</p>' +
          (it.hint ? '<p class="lp-qhint">提示：' + esc(it.hint) + '</p>' : '') +
          '<div class="lp-qrow">' +
            '<button class="lp-btn sm good" type="button" data-act="qknow" data-g="' + gi + '" data-i="' + ii + '"' +
              ' aria-pressed="' + (st === 'know' ? 'true' : 'false') + '">会了</button>' +
            '<button class="lp-btn sm warn" type="button" data-act="qlater" data-g="' + gi + '" data-i="' + ii + '"' +
              ' aria-pressed="' + (st === 'later' ? 'true' : 'false') + '">再看看</button>' +
            '<span class="lp-tag' + tagCls + '">' + tag + '</span>' +
          '</div>' +
          '</li>';
      });
      h += '</ul></section>';
    });

    h += '<p class="lp-hint-row">「会了」= 已能自己答出来；「再看看」= 待复习。再次点击同一按钮可取消标注。</p>';
    if (DATA.sample.quiz) h += sampleNote();
    h += '</div>';
    return h;
  }

  function markQuiz(gi, ii, status) {
    var g = DATA.quiz[gi];
    if (!g || !g.items[ii]) return;
    var k = qkey(g, gi, ii);
    if (S.quiz[k] === status) delete S.quiz[k];
    else S.quiz[k] = status;
    saveJSON(LS.quiz, S.quiz);
    renderBody();
  }

  /* ======================================================================
   * 11. 视图：名人
   * ==================================================================== */
  function peoplePeriods() {
    var out = [];
    DATA.people.forEach(function (p) {
      var k = p.period || '其他';
      if (out.indexOf(k) < 0) out.push(k);
    });
    return out;
  }
  function peopleFiltered() {
    var q = S.peopleQ.trim();
    return DATA.people.filter(function (p) {
      if (S.peoplePeriod !== 'all' && (p.period || '其他') !== S.peoplePeriod) return false;
      if (!q) return true;
      return (p.name || '').indexOf(q) >= 0 || (p.dates || '').indexOf(q) >= 0 || (p.summary || '').indexOf(q) >= 0;
    });
  }
  function peopleGridHtml() {
    var list = peopleFiltered();
    if (!list.length) {
      return emptyBox('没有匹配的人物', S.peopleQ ? '换个关键词或点「全部」试试。' : '这个时期暂无条目。');
    }
    var h = '<div class="lp-people">';
    list.forEach(function (p) {
      var jumpable = p.page && hasPage(p.page);
      h += '<button type="button" class="lp-person" data-act="' + (jumpable ? 'jump' : 'nopage') + '"' +
        (jumpable ? ' data-page="' + esc(p.page) + '"' : '') +
        ' title="' + esc(jumpable ? pageLabel(p.page) : (p.summary || p.name)) + '">' +
        '<span class="lp-pno">' + (isFinite(p.no) ? 'No. ' + p.no : '') + '</span>' +
        '<span class="lp-pnm">' + esc(p.name) + '</span>' +
        (p.dates ? '<span class="lp-pdt">' + esc(p.dates) + '</span>' : '') +
        (p.period ? '<span class="lp-pperiod">' + esc(p.period) + '</span>' : '') +
        (p.summary ? '<span class="lp-psum">' + esc(p.summary) + '</span>' : '') +
        '</button>';
    });
    h += '</div>';
    return h;
  }
  function viewPeople() {
    if (!DATA.people.length) return '<div class="lp-sec">' + emptyBox('暂无名人数据', '') + '</div>';
    var periods = peoplePeriods();
    var h = '<div class="lp-sec">';
    h += '<div class="lp-filters" id="lpPeriods">';
    h += '<button class="lp-chip" type="button" data-act="period" data-p="all" aria-pressed="' + (S.peoplePeriod === 'all' ? 'true' : 'false') + '">全部</button>';
    periods.forEach(function (p, i) {
      h += '<button class="lp-chip" type="button" data-act="period" data-p="' + esc(p) + '"' +
        ' aria-pressed="' + (S.peoplePeriod === p ? 'true' : 'false') + '">' + esc(p) + '</button>';
    });
    h += '</div>';
    h += '<input class="lp-search" type="search" id="lpPeopleSearch" data-people-search' +
      ' placeholder="按姓名搜索…" aria-label="按姓名搜索名人" value="' + esc(S.peopleQ) + '" autocomplete="off">';
    h += '<p class="lp-hint-row" id="lpPeopleCount"></p>';
    h += '<div id="lpPeopleGrid">' + peopleGridHtml() + '</div>';
    h += '<p class="lp-hint-row">点击卡片跳到正文对应页；生卒年与时期取自第五编。</p>';
    if (DATA.sample.people) h += sampleNote();
    h += '</div>';
    return h;
  }
  function renderPeopleGrid() {
    var grid = document.getElementById('lpPeopleGrid');
    if (!grid) return;
    grid.innerHTML = peopleGridHtml();
    var cnt = document.getElementById('lpPeopleCount');
    if (cnt) cnt.textContent = '共 ' + peopleFiltered().length + ' / ' + DATA.people.length + ' 位';
  }

  /* ======================================================================
   * 12. 视图：我的
   * ==================================================================== */
  function mineStat(label, val) {
    return '<span class="lp-tag">' + esc(label) + ' ' + esc(val) + '</span>';
  }
  function viewMine() {
    var bms = bookmarksSorted();
    var notes = notesSorted();
    var words = wordsSorted();
    var q = countQuiz();
    var h = '<div class="lp-sec">';

    /* 概览 */
    h += '<div class="lp-filters">' +
      mineStat('字母', countMasteredLetters() + '/' + DATA.letters.length) +
      mineStat('词卡', countKnownVocab() + '/' + DATA.vocab.length) +
      mineStat('自测', q.done + '/' + q.total) +
      mineStat('书签', bms.length) +
      mineStat('笔记', notes.length) +
      mineStat('生词', words.length) +
      '</div>';

    /* 书签 */
    h += '<section class="lp-mine-sec">';
    h += '<div class="lp-mine-head"><h4>书签</h4><span class="lp-count">' + bms.length + ' 个</span></div>';
    if (!bms.length) {
      h += emptyBox('还没有书签', '在阅读页点顶栏的 ☆ 即可为当前页加书签。');
    } else {
      h += '<ul class="lp-list">';
      bms.forEach(function (x) {
        var p = pageInfo(x.id);
        h += '<li class="lp-item">' +
          '<div class="lp-item-main">' +
            '<span class="lp-item-ttl">' + esc(p ? p.title : x.id) + '</span>' +
            '<span class="lp-item-sub">' + esc(p && p.no ? '第 ' + p.no + ' 节 · ' : '') + esc(x.id) + '</span>' +
          '</div>' +
          '<div class="lp-item-acts">' +
            '<button class="lp-icon-btn" type="button" data-act="jump" data-page="' + esc(x.id) + '" title="打开这一页" aria-label="打开这一页">↗</button>' +
            '<button class="lp-icon-btn" type="button" data-act="bm-del" data-page="' + esc(x.id) + '" title="删除书签" aria-label="删除书签">×</button>' +
          '</div>' +
          '</li>';
      });
      h += '</ul>';
    }
    h += '</section>';

    /* 笔记（按页面聚合） */
    h += '<section class="lp-mine-sec">';
    h += '<div class="lp-mine-head"><h4>笔记</h4><span class="lp-count">' + notes.length + ' 条 · 按页面聚合</span></div>';
    if (!notes.length) {
      h += emptyBox('还没有笔记', '在阅读页点顶栏的 ✎ 记下想法，会按页面归档在这里。');
    } else {
      notes.forEach(function (n) {
        var p = pageInfo(n.id);
        h += '<div class="lp-note">' +
          '<div class="lp-note-head">' +
            '<span class="lp-item-ttl">' + esc(p ? p.title : n.id) + '</span>' +
            '<span class="lp-item-sub">' + esc(p && p.no ? '第 ' + p.no + ' 节 · ' : '') + esc(n.id) + '</span>' +
            '<span style="flex:1 1 auto"></span>' +
            '<button class="lp-btn sm ghost" type="button" data-act="jump" data-page="' + esc(n.id) + '">跳转</button>' +
            '<button class="lp-icon-btn" type="button" data-act="note-del" data-page="' + esc(n.id) + '" title="删除笔记" aria-label="删除笔记">×</button>' +
          '</div>' +
          '<p class="lp-note-text">' + esc(n.text) + '</p>' +
          '</div>';
      });
    }
    h += '</section>';

    /* 生词本（正文点词加入） */
    h += '<section class="lp-mine-sec">';
    h += '<div class="lp-mine-head"><h4>生词本</h4><span class="lp-count">' + words.length + ' 个 · 正文点击阿语词可加入</span></div>';
    if (!words.length) {
      h += emptyBox('生词本还是空的', '在正文里点击阿拉伯语词，即可把词加入生词本；未收录的词还能补中文释义。');
    } else {
      h += '<ul class="lp-list">';
      words.forEach(function (w) {
        h += '<li class="lp-item">' +
          '<div class="lp-item-main">' +
            '<span class="lp-item-ttl lp-item-ar" dir="rtl" lang="ar">' + esc(w.ar) + '</span>' +
            '<span class="lp-item-sub">' + esc(w.zh || '（未补释义）') + (w.page ? ' · ' + esc(w.page) : '') + '</span>' +
          '</div>' +
          '<div class="lp-item-acts">' +
            (w.page && hasPage(w.page) ? '<button class="lp-icon-btn" type="button" data-act="jump" data-page="' + esc(w.page) + '" title="打开该词所在页" aria-label="打开该词所在页">↗</button>' : '') +
            '<button class="lp-icon-btn" type="button" data-act="word-remove" data-key="' + esc(w.key) + '" title="移出生词本" aria-label="移出生词本">×</button>' +
          '</div>' +
          '</li>';
      });
      h += '</ul>';
    }
    h += '</section>';

    /* 导出 */
    h += '<section class="lp-mine-sec">';
    h += '<div class="lp-mine-head"><h4>导出</h4></div>';
    h += '<div class="lp-vnav" style="justify-content:flex-start">' +
      '<button class="lp-btn primary" type="button" data-act="export">导出 Markdown（书签 + 笔记 + 生词）</button>' +
      '</div>';
    h += '<p class="lp-hint-row">导出文件保存在本机，直接下载为 .md，不含任何网络请求。</p>';
    h += '</section>';

    h += '</div>';
    return h;
  }

  function fmtDate(d) {
    function p2(n) { return n < 10 ? '0' + n : '' + n; }
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) +
      ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
  }
  function mdTitle(id) {
    var p = pageInfo(id);
    if (!p) return id;
    return p.title + '（' + (p.no ? '第 ' + p.no + ' 节 · ' : '') + id + '）';
  }
  function exportMarkdown() {
    var b = book();
    var title = (b && b.meta && b.meta.title) || '阿拉伯文化背景知识基础教程';
    var bms = bookmarksSorted();
    var notes = notesSorted();
    var lines = [];
    lines.push('# ' + title + ' · 学习记录');
    lines.push('');
    lines.push('> 导出时间：' + fmtDate(new Date()));
    lines.push('');
    lines.push('## 书签（' + bms.length + '）');
    lines.push('');
    if (!bms.length) lines.push('（暂无书签）');
    bms.forEach(function (x, i) { lines.push((i + 1) + '. ' + mdTitle(x.id)); });
    lines.push('');
    lines.push('## 笔记（' + notes.length + '）');
    lines.push('');
    if (!notes.length) lines.push('（暂无笔记）');
    notes.forEach(function (n) {
      lines.push('### ' + mdTitle(n.id));
      lines.push('');
      lines.push(n.text);
      lines.push('');
    });

    var words = wordsSorted();
    lines.push('## 生词本（' + words.length + '）');
    lines.push('');
    if (!words.length) lines.push('（暂无生词）');
    words.forEach(function (w, i) {
      var tail = [];
      if (w.zh) tail.push(w.zh);
      if (w.page) tail.push(w.page);
      lines.push((i + 1) + '. ' + w.ar + (tail.length ? ' — ' + tail.join(' · ') : ''));
    });
    lines.push('');

    var text = lines.join('\n');
    var name = 'arabic-culture-notes-' + fmtDate(new Date()).slice(0, 10) + '.md';
    try {
      var blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        try { URL.revokeObjectURL(url); } catch (e) {}
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 1200);
      toast('已导出 ' + name);
    } catch (e) {
      toast('导出失败：当前浏览器不支持下载');
    }
  }

  /* ======================================================================
   * 13. 小片段
   * ==================================================================== */
  function emptyBox(title, sub) {
    return '<div class="lp-empty"><b>' + esc(title) + '</b>' +
      (sub ? '<br>' + esc(sub) : '') + '</div>';
  }
  function sampleNote() {
    return '<p class="lp-hint-row"><span class="lp-sample">样例数据</span> 当前展示内置样例，' +
      '接入真实数据（content/extras.js）后会自动替换。</p>';
  }

  /* ======================================================================
   * 14. 阅读页按钮同步
   * ==================================================================== */
  function syncPageButtons() {
    var id = currentPageId();
    var ok = !!(id && hasPage(id));
    var bm = document.getElementById('btnBookmark');
    var nt = document.getElementById('btnNote');

    if (bm) {
      var on = ok && isBookmarked(id);
      bm.disabled = !ok;
      bm.classList.toggle('on', on);
      bm.textContent = on ? '★' : '☆';
      bm.title = on ? '取消书签' : '加书签';
      bm.setAttribute('aria-label', bm.title);
      bm.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (nt) {
      var has = ok && hasNote(id);
      nt.disabled = !ok;
      nt.classList.toggle('on', has);
      nt.title = has ? '编辑本页笔记' : '写本页笔记';
      nt.setAttribute('aria-label', nt.title);
      nt.setAttribute('aria-pressed', has ? 'true' : 'false');
    }
  }

  /* ======================================================================
   * 15. 笔记弹层
   * ==================================================================== */
  function openNoteModal(id) {
    if (!modalBg) return;
    if (!id || !hasPage(id)) { toast('当前页面无法写笔记'); return; }
    S.notePage = id;
    if (noteSubEl) noteSubEl.textContent = pageLabel(id);
    if (noteTextEl) {
      noteTextEl.value = hasNote(id) ? S.notes[id].text : '';
    }
    modalBg.hidden = false;
    document.documentElement.classList.add('lp-note-open');
    if (noteTextEl) {
      try { noteTextEl.focus(); } catch (e) {}
      try { noteTextEl.setSelectionRange(noteTextEl.value.length, noteTextEl.value.length); } catch (e) {}
    }
  }
  function closeNoteModal() {
    if (!modalBg || modalBg.hidden) return;
    modalBg.hidden = true;
    document.documentElement.classList.remove('lp-note-open');
    S.notePage = null;
    if (S.open && S.tab === 'mine') renderBody();
    syncPageButtons();
  }
  function submitNote() {
    if (!S.notePage || !noteTextEl) return;
    saveNote(S.notePage, noteTextEl.value);
    closeNoteModal();
  }

  /* ======================================================================
   * 16. 正文阿语词：可点击（词表命中→释义卡；未命中→复制 / 自建释义）
   * ==================================================================== */
  var AR_WORD_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g;
  var AR_HAS_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  var AR_STRIP_RE = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
  var WP_SKIP = '.lp, .lp-word-pop, [data-acw], h1, h2, h3, h4, .fn, .page-head, script, style, textarea, input, select';

  var WP = { idx: null, pop: null, el: null, timer: 0, obs: null, adding: false, scanning: false, raf: 0 };

  /* 归一化：去掉音符、叠音符与 tatweel，用于和词表比对 */
  function normAr(s) {
    return String(s === null || s === undefined ? '' : s).replace(AR_STRIP_RE, '').replace(/\s+/g, '');
  }

  function buildWordIndex() {
    var m = {};
    (DATA.vocab || []).forEach(function (v) {
      if (!v || !v.ar) return;
      var k = normAr(v.ar);
      if (!k || m[k]) return;
      m[k] = { ar: v.ar, zh: v.zh, page: v.page || '' };
    });
    WP.idx = m;
  }
  function lookupWord(raw) {
    if (!WP.idx) buildWordIndex();
    var k = normAr(raw);
    return (k && WP.idx[k]) || null;
  }
  function hasWord(raw) {
    var k = normAr(raw);
    return !!(k && S.words && S.words[k]);
  }

  /* ---- 扫描正文并包裹（幂等：已包裹的节点带 data-acw） ---- */
  function wrapTextNode(node) {
    if (!node || !node.parentNode) return 0;
    var p = node.parentNode;
    if (p && p.nodeType === 1 && p.closest && p.closest(WP_SKIP)) return 0;
    var text = node.nodeValue || '';
    if (!text || !AR_HAS_RE.test(text)) return 0;

    AR_WORD_RE.lastIndex = 0;
    var frag = document.createDocumentFragment();
    var last = 0, m, n = 0;
    while ((m = AR_WORD_RE.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      var w = m[0];
      var sp = document.createElement('span');
      sp.className = 'w-ar';
      sp.setAttribute('data-acw', w);
      sp.textContent = w;
      frag.appendChild(sp);
      last = m.index + w.length;
      n++;
    }
    if (!n) return 0;
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    try { node.parentNode.replaceChild(frag, node); } catch (e) { return 0; }
    return n;
  }

  function wrapWordsIn(root) {
    if (!root || !document.createTreeWalker) return 0;
    var walker = document.createTreeWalker(root, 4 /* SHOW_TEXT */, null, false);
    var nodes = [], n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && AR_HAS_RE.test(n.nodeValue)) nodes.push(n);
    }
    var count = 0;
    for (var i = 0; i < nodes.length; i++) count += wrapTextNode(nodes[i]);
    return count;
  }

  function scanPaper() {
    if (WP.scanning) return;
    WP.scanning = true;
    try {
      var root = document.getElementById('content') || document.getElementById('paper');
      if (root) wrapWordsIn(root);
    } finally { WP.scanning = false; }
  }
  function scheduleScan() {
    clearTimeout(WP.timer);
    WP.timer = setTimeout(scanPaper, 120);
  }

  function observePaper() {
    scanPaper();
    if (typeof MutationObserver !== 'function') return;
    var paper = document.getElementById('paper');
    if (!paper) return;
    if (WP.obs) { try { WP.obs.disconnect(); } catch (e) {} }
    WP.obs = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'characterData' ||
            (m.type === 'childList' && m.addedNodes && m.addedNodes.length) ||
            (m.type === 'attributes' && m.attributeName === 'data-page')) {
          scheduleScan();
          return;
        }
      }
    });
    WP.obs.observe(paper, { childList: true, subtree: true, characterData: true });
  }

  /* ---- 弹层 ---- */
  function buildWordPop() {
    if (document.getElementById('lpWordPop')) {
      WP.pop = document.getElementById('lpWordPop');
      return;
    }
    var p = document.createElement('div');
    p.id = 'lpWordPop';
    p.className = 'lp-word-pop';
    p.hidden = true;
    p.setAttribute('role', 'dialog');
    p.setAttribute('aria-label', '阿语词释义');
    document.body.appendChild(p);
    WP.pop = p;
  }

  function renderWordPop(raw) {
    if (!WP.pop) return;
    raw = String(raw || '');
    var hit = lookupWord(raw);
    var saved = hasWord(raw);
    var h = '<div class="lp-wp-head"><span class="lp-wp-ar" dir="rtl" lang="ar">' + esc(raw) + '</span>' +
      (hit ? '' : '<span class="lp-tag warn">书中未收录</span>') + '</div>';

    if (hit) h += '<p class="lp-wp-zh">' + esc(hit.zh || '（词表暂无中文释义）') + '</p>';
    else h += '<p class="lp-wp-zh muted">书中未收录释义</p>';

    if (WP.adding) {
      h += '<div class="lp-wp-addrow">' +
        '<input class="lp-wp-input" id="lpWpZh" type="text" maxlength="60" autocomplete="off" ' +
        'placeholder="补一个中文释义（可留空）" aria-label="中文释义">' +
        '</div>';
    }

    h += '<div class="lp-wp-acts">';
    if (WP.adding) {
      h += '<button class="lp-btn sm primary" type="button" data-act="word-save" data-ar="' + esc(raw) + '">保存</button>' +
        '<button class="lp-btn sm ghost" type="button" data-act="word-cancel">取消</button>';
    } else if (saved) {
      h += '<span class="lp-tag good">已在生词本</span>' +
        '<button class="lp-btn sm ghost" type="button" data-act="word-del" data-key="' + esc(normAr(raw)) + '">移出</button>';
    } else {
      h += '<button class="lp-btn sm good" type="button" data-act="word-add" data-ar="' + esc(raw) + '">加入生词本</button>';
    }
    if (!hit) {
      h += '<button class="lp-btn sm ghost" type="button" data-act="word-copy" data-ar="' + esc(raw) + '">复制</button>';
    }
    if (hit && hit.page && hasPage(hit.page)) {
      h += '<button class="lp-btn sm" type="button" data-act="word-jump" data-page="' + esc(hit.page) + '">跳到该词正文</button>';
    }
    h += '</div>';

    WP.pop.innerHTML = h;
  }

  function positionWordPop(wEl) {
    var pop = WP.pop;
    if (!pop || pop.hidden) return;
    if (!wEl || !wEl.getBoundingClientRect) return;
    var r = wEl.getBoundingClientRect();
    if (r.bottom < -60 || r.top > window.innerHeight + 60) { closeWordPop(); return; }

    /* 手机：底部 sheet，位置完全交给 CSS */
    if (window.innerWidth <= 819) {
      pop.classList.add('sheet');
      pop.style.left = '';
      pop.style.top = '';
      pop.style.bottom = '';
      pop.style.width = '';
      return;
    }
    pop.classList.remove('sheet');
    var margin = 10;
    var pw = pop.offsetWidth || 260;
    var ph = pop.offsetHeight || 120;
    var left = clamp(r.left + r.width / 2 - pw / 2, margin, Math.max(margin, window.innerWidth - pw - margin));
    var top = r.bottom + 8;
    if (top + ph > window.innerHeight - margin && r.top - ph - 8 >= margin) top = r.top - ph - 8;
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(top) + 'px';
    pop.style.bottom = 'auto';
    pop.style.width = '';
  }

  function openWordPop(wEl) {
    if (!wEl) return;
    if (!WP.pop) buildWordPop();
    if (!WP.pop) return;
    WP.el = wEl;
    WP.adding = false;
    renderWordPop(wEl.getAttribute('data-acw') || wEl.textContent || '');
    WP.pop.hidden = false;
    positionWordPop(wEl);
  }

  function closeWordPop() {
    if (!WP.pop || WP.pop.hidden) return false;
    WP.pop.hidden = true;
    WP.pop.innerHTML = '';
    WP.el = null;
    WP.adding = false;
    return true;
  }

  function copyText(text) {
    var done = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        var pr = navigator.clipboard.writeText(text);
        if (pr && pr.catch) pr.catch(function () {});
        done = true;
      }
    } catch (e) { done = false; }
    if (!done) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', 'readonly');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        done = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e2) { done = false; }
    }
    toast(done ? '已复制' : '复制失败，可手动选择文本');
  }

  function bootWords(tries) {
    if (!document.getElementById('paper')) {
      if (tries < 40) setTimeout(function () { bootWords(tries + 1); }, 100);
      return;
    }
    buildWordPop();
    observePaper();
  }

  /* ======================================================================
   * 17. 事件
   * ==================================================================== */
  function inField(t) {
    return !!(t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable));
  }

  function onDocumentClick(e) {
    var t = e.target;
    if (!t || !t.closest) return;

    /* 词元弹层：点内部不关；点别的词会重开；点其它地方关闭 */
    if (WP.pop && !WP.pop.hidden) {
      if (!WP.pop.contains(t) && !t.closest('.w-ar')) closeWordPop();
    }

    /* 顶栏「互动」 */
    if (t.closest('#btnLearn')) { e.preventDefault(); openLearn(S.tab); return; }

    /* 正文内联按钮：[data-learn-tab] */
    var inline = t.closest('[data-learn-tab]');
    if (inline) {
      e.preventDefault();
      openLearn(inline.getAttribute('data-learn-tab'));
      return;
    }

    /* 面板 tab */
    var tab = t.closest('.lp-tab[data-tab]');
    if (tab) { setTab(tab.getAttribute('data-tab')); return; }

    /* 关闭面板 */
    if (t.closest('#lpClose')) { closeLearn(); return; }

    /* 阅读页书签 / 笔记 */
    if (t.closest('#btnBookmark')) {
      toggleBookmark(currentPageId());
      return;
    }
    if (t.closest('#btnNote')) {
      openNoteModal(currentPageId());
      return;
    }

    /* 笔记弹层 */
    if (modalBg && !modalBg.hidden) {
      if (t === modalBg) { closeNoteModal(); return; }
      if (t.closest('#lpNoteCancel')) { closeNoteModal(); return; }
      if (t.closest('#lpNoteSave')) { submitNote(); return; }
      if (t.closest('#lpNoteDelete')) {
        var nid = S.notePage;
        if (nid) { removeNote(nid); }
        closeNoteModal();
        return;
      }
    }

    /* 侧卡 */
    if (sideBg && !sideBg.hidden && t === sideBg) { closeSide(); return; }

    /* 正文阿语词 */
    var w = t.closest('.w-ar');
    if (w && w.getAttribute('data-acw')) { e.preventDefault(); openWordPop(w); return; }

    /* data-act 动作 */
    var el = t.closest('[data-act]');
    if (!el) return;
    onAct(el.getAttribute('data-act'), el.getAttribute('data-page'), el);
  }

  function onAct(act, page, el) {
    switch (act) {
      /* ---- 字母表 ---- */
      case 'letter':
        openLetter(parseInt(el.getAttribute('data-i'), 10));
        break;
      case 'side-close':
        closeSide();
        break;
      case 'side-master': {
        var ch = el.getAttribute('data-ch');
        if (!ch) break;
        toggleMastered(ch);
        var it = null;
        for (var i = 0; i < DATA.letters.length; i++) if (DATA.letters[i].ch === ch) { it = DATA.letters[i]; break; }
        if (it) renderSide(it);
        renderBody();
        break;
      }

      /* ---- 通用 ---- */
      case 'jump':
        jumpTo(page);
        break;
      case 'nopage':
        toast('这一条暂无正文页码');
        break;

      /* ---- 正文阿语词 ---- */
      case 'word-add': {
        var rawAdd = el.getAttribute('data-ar') || '';
        var hitAdd = lookupWord(rawAdd);
        if (hitAdd) {
          WP.adding = false;
          addWord(hitAdd.ar, hitAdd.zh, hitAdd.page);
          renderWordPop(rawAdd);
          positionWordPop(WP.el);
        } else {
          WP.adding = true;
          renderWordPop(rawAdd);
          positionWordPop(WP.el);
          var inpAdd = document.getElementById('lpWpZh');
          if (inpAdd) { try { inpAdd.focus(); } catch (e) {} }
        }
        break;
      }
      case 'word-save': {
        var rawSave = el.getAttribute('data-ar') || (WP.el && WP.el.getAttribute('data-acw')) || '';
        var inpSave = document.getElementById('lpWpZh');
        var zhSave = inpSave ? inpSave.value : '';
        WP.adding = false;
        addWord(rawSave, zhSave, '');
        renderWordPop(rawSave);
        positionWordPop(WP.el);
        break;
      }
      case 'word-cancel':
        WP.adding = false;
        if (WP.el) {
          renderWordPop(WP.el.getAttribute('data-acw') || '');
          positionWordPop(WP.el);
        }
        break;
      case 'word-copy':
        copyText(el.getAttribute('data-ar') || '');
        break;
      case 'word-jump':
        closeWordPop();
        jumpTo(page);
        break;
      case 'word-del':
        removeWord(el.getAttribute('data-key') || '');
        if (WP.el) {
          renderWordPop(WP.el.getAttribute('data-acw') || '');
          positionWordPop(WP.el);
        }
        break;
      case 'word-remove':
        removeWord(el.getAttribute('data-key') || '');
        break;
      case 'word-close':
        closeWordPop();
        break;

      /* ---- 词卡 ---- */
      case 'flip':
        toggleFlip();
        break;
      case 'vprev':
        vocabStep(-1);
        break;
      case 'vnext':
        vocabStep(1);
        break;
      case 'vrand':
        vocabRandom();
        break;
      case 'vfilter':
        S.onlyUnlearned = !S.onlyUnlearned;
        S.vi = 0;
        S.vflip = false;
        renderBody();
        break;
      case 'vreset':
        S.onlyUnlearned = false;
        S.vi = 0;
        S.vflip = false;
        renderBody();
        break;
      case 'vknow':
        markVocab('know');
        break;
      case 'vlater':
        markVocab('later');
        break;

      /* ---- 自测 ---- */
      case 'qknow':
        markQuiz(parseInt(el.getAttribute('data-g'), 10), parseInt(el.getAttribute('data-i'), 10), 'know');
        break;
      case 'qlater':
        markQuiz(parseInt(el.getAttribute('data-g'), 10), parseInt(el.getAttribute('data-i'), 10), 'later');
        break;

      /* ---- 名人 ---- */
      case 'period':
        S.peoplePeriod = el.getAttribute('data-p') || 'all';
        if (bodyEl) {
          var chips = bodyEl.querySelectorAll('.lp-chip');
          for (var c = 0; c < chips.length; c++) {
            chips[c].setAttribute('aria-pressed', chips[c] === el ? 'true' : 'false');
          }
        }
        renderPeopleGrid();
        break;

      /* ---- 我的 ---- */
      case 'bm-del':
        if (page) removeBookmark(page);
        break;
      case 'note-del':
        if (page) removeNote(page);
        break;
      case 'export':
        exportMarkdown();
        break;

      default:
        break;
    }
  }

  function onDocumentInput(e) {
    var t = e.target;
    if (t && t.id === 'lpPeopleSearch') {
      S.peopleQ = t.value || '';
      renderPeopleGrid();
    }
  }

  function onKeyCapture(e) {
    var modalOpen = !!(modalBg && !modalBg.hidden);
    var panelOpen = S.open;
    var wpOpen = !!(WP.pop && !WP.pop.hidden);
    if (!modalOpen && !panelOpen && !wpOpen) return;

    var k = e.key;

    /* Esc：词元弹层 > 笔记弹层 > 侧卡 > 面板 */
    if (k === 'Escape' || k === 'Esc') {
      if (wpOpen) closeWordPop();
      else if (modalOpen) closeNoteModal();
      else if (sideIsOpen()) closeSide();
      else if (panelOpen) closeLearn();
      else return;
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      return;
    }

    /* 弹层内输入时交给浏览器 */
    if (modalOpen) return;

    /* 词元弹层的补释义输入框：Enter 保存，其余交给浏览器 */
    if (wpOpen && e.target && e.target.id === 'lpWpZh') {
      if (k === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        var saveBtn = WP.pop.querySelector('[data-act="word-save"]');
        if (saveBtn) saveBtn.click();
      }
      return;
    }
    if (inField(e.target)) return;

    var arrows = (k === 'ArrowLeft' || k === 'ArrowRight');
    var space = (k === ' ' || k === 'Spacebar' || e.code === 'Space');

    /* 词元弹层打开时屏蔽阅读器快捷键 */
    if (wpOpen) {
      if (arrows || space || k === '/' || k === 'ArrowUp' || k === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }

    /* 词卡键盘：← / → 切换，空格翻转 */
    if (panelOpen && S.tab === 'vocab' && !sideIsOpen()) {
      if (k === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); vocabStep(1); return; }
      if (k === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); vocabStep(-1); return; }
      if (space) { e.preventDefault(); e.stopPropagation(); toggleFlip(); return; }
    }

    /* 面板内屏蔽阅读器快捷键（←/→ 翻页、/ 搜索、↑/↓ 命中） */
    if (arrows || space || k === '/' || k === 'ArrowUp' || k === 'ArrowDown') {
      if (arrows || space || k === '/') e.preventDefault();
      e.stopPropagation();
    }
  }

  function bindEvents() {
    document.addEventListener('click', onDocumentClick, false);
    document.addEventListener('input', onDocumentInput, false);
    document.addEventListener('keydown', onKeyCapture, true);

    window.addEventListener('hashchange', function () {
      closeWordPop();
      syncPageButtons();
      scheduleScan();
      /* 深链接：#/p042?learn=vocab 在运行中切换 hash 也打开（也方便截图/自检） */
      var p = hashParams();
      var t = p.learn || p.tab;
      if (t && !S.open) openLearn(t);
    }, false);

    window.addEventListener('resize', function () {
      if (WP.pop && !WP.pop.hidden) positionWordPop(WP.el);
    }, false);

    /* capture 阶段：面板/页面内滚动时跟随词元 */
    window.addEventListener('scroll', function () {
      if (!WP.pop || WP.pop.hidden) return;
      if (WP.raf) return;
      WP.raf = window.requestAnimationFrame ? window.requestAnimationFrame(function () {
        WP.raf = 0;
        positionWordPop(WP.el);
      }) : 0;
    }, true);

    if (modalBg) {
      modalBg.addEventListener('keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          submitNote();
        }
      }, false);
    }
  }

  /* ======================================================================
   * 18. 启动
   * ==================================================================== */
  function hashParams() {
    var out = {};
    var h = String(window.location.hash || '');
    var qi = h.indexOf('?');
    if (qi < 0) return out;
    h.slice(qi + 1).split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      var k = i < 0 ? kv : kv.slice(0, i);
      var v = i < 0 ? '' : kv.slice(i + 1);
      try { out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); }
      catch (e) { out[k] = v; }
    });
    return out;
  }

  function boot() {
    loadState();
    normalizeMail();
    ensureEntryButton();
    ensurePageButtons();
    buildPanel();
    buildSide();
    buildModal();
    renderTabs();
    bindEvents();
    syncPageButtons();
    S.ready = true;

    /* 深链接：#/p042?learn=vocab 直接打开对应 tab（也方便截图/自检） */
    var p = hashParams();
    var tab = p.learn || p.tab;
    if (tab) openLearn(tab);

    /* 正文阿语词：包装 + 监听重渲染 */
    bootWords(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, false);
  } else {
    boot();
  }

  /* 调试出口（只读/手动调用，无副作用） */
  window.__learn = {
    open: openLearn,
    close: closeLearn,
    tab: setTab,
    data: DATA,
    state: S
  };
})();
