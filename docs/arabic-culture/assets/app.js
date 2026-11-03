/* ============================================================================
 * app.js —— 阿拉伯文化背景知识基础教程 · 纯阅读版
 * ----------------------------------------------------------------------------
 * 零依赖、零网络请求、无 ES module、无 fetch：
 *   · 数据：window.BOOK（由 ../content/book.js 或 assets/mock-book.js 提供）
 *   · 路由：#/page-id（hash），切页只改 DOM
 *   · 存储：localStorage（主题 / 字号 / 进度 / 目录展开状态），失败时静默降级
 *
 * 开发期 URL 参数（不影响正常使用）：
 *   #/p1c1s1?theme=dark&fs=2&q=اللغة
 * ==========================================================================*/
(function () {
  'use strict';

  /* ======================================================================
   * 0. 小工具
   * ==================================================================== */
  var K = {
    theme: 'acb.theme',
    fs: 'acb.fs',
    prog: 'acb.prog',
    toc: 'acb.toc'
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  /* localStorage 安全封装：file:// 或隐私模式下可能抛错 */
  function storeGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function storeSet(key, val) {
    try {
      if (val == null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, val);
    } catch (e) { /* 忽略 */ }
  }

  var reduceMotion = false;
  try {
    reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) {}

  /* ======================================================================
   * 1. 数据兜底与归一化
   * ==================================================================== */
  var BOOK = window.BOOK;

  function normalizeBook() {
    if (!BOOK || typeof BOOK !== 'object') return false;
    if (!BOOK.pages || typeof BOOK.pages !== 'object') return false;

    var meta = BOOK.meta || (BOOK.meta = {});
    meta.title = meta.title || '阿拉伯文化背景知识基础教程';
    meta.subtitle = meta.subtitle || '';
    meta.author = meta.author || '';
    meta.edition = meta.edition || '';
    meta.note = meta.note || '';

    // order：缺失时用 toc + pages 兜底
    if (!Array.isArray(BOOK.order) || !BOOK.order.length) {
      var o = [];
      if (Array.isArray(BOOK.toc)) {
        BOOK.toc.forEach(function (t) { if (BOOK.pages[t.id] && o.indexOf(t.id) < 0) o.push(t.id); });
      }
      Object.keys(BOOK.pages).forEach(function (id) { if (o.indexOf(id) < 0) o.push(id); });
      BOOK.order = o;
    }

    // 只保留真的有页面的 id，并补齐页面字段
    BOOK.order = BOOK.order.filter(function (id) { return !!BOOK.pages[id]; });

    var totalChars = 0;
    BOOK.order.forEach(function (id) {
      var p = BOOK.pages[id] || (BOOK.pages[id] = {});
      p.id = id;
      p.title = p.title || '（无标题）';
      p.html = p.html || '';
      if (!Array.isArray(p.crumbs)) p.crumbs = [];
      if (typeof p.chars !== 'number' || !p.chars) {
        p.chars = plainText(p.html).replace(/\s+/g, '').length;
      }
      totalChars += p.chars;
    });

    meta.stats = meta.stats || {};
    if (!meta.stats.pages) meta.stats.pages = BOOK.order.length;
    if (!meta.stats.chars) meta.stats.chars = totalChars;

    if (!Array.isArray(BOOK.toc)) BOOK.toc = [];
    return true;
  }

  /* ======================================================================
   * 2. 文本工具：去阿拉伯文附加符号的归一化 + 原文偏移映射
   *    —— 让「اللغة」能搜到「اللُّغَةُ」，中文搜索不受影响。
   * ==================================================================== */
  var AR_MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/;
  var AR_FOLD = {
    '\u0623': '\u0627', '\u0625': '\u0627', '\u0622': '\u0627', '\u0671': '\u0627', // أ إ آ ٱ → ا
    '\u0649': '\u064A', // ى → ي
    '\u0626': '\u064A', // ئ → ي
    '\u0624': '\u0648', // ؤ → و
    '\u0629': '\u0647'  // ة → ه
  };

  function normWithMap(s) {
    s = String(s == null ? '' : s);
    var out = '', map = [];
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (AR_MARKS.test(ch)) continue;
      ch = AR_FOLD[ch] || ch;
      var low = ch.toLowerCase();
      if (low.length !== 1) low = ch;
      out += low;
      map.push(i);
    }
    return { n: out, map: map };
  }

  /* 在原文里找出所有命中区间（原文坐标） */
  function findRanges(text, qNorm) {
    var ranges = [];
    if (!text || !qNorm) return ranges;
    var info = normWithMap(text);
    var from = 0, i;
    while ((i = info.n.indexOf(qNorm, from)) !== -1) {
      ranges.push([info.map[i], info.map[i + qNorm.length - 1] + 1]);
      from = i + qNorm.length;
      if (ranges.length >= 400) break;
    }
    return ranges;
  }

  /* 从 HTML 片段取纯文本（块级之间补空格） */
  function plainText(html) {
    if (!html) return '';
    var d = document.createElement('div');
    d.innerHTML = html;
    // 脚注标记并入正文
    $$('sup', d).forEach(function (n) {
      n.parentNode.replaceChild(document.createTextNode(' ' + n.textContent + ' '), n);
    });
    $$('p, h1, h2, h3, h4, li, tr, figcaption, div, br', d).forEach(function (n) {
      n.appendChild(document.createTextNode(' '));
    });
    return (d.textContent || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* ======================================================================
   * 3. 状态
   * ==================================================================== */
  var state = {
    pageId: null,
    ratio: 0,
    fs: 1,
    theme: 'auto',
    q: '',                 // 搜索框里的词
    highlight: { q: '', qn: '' },   // 正文里正在高亮的词
    hits: [],              // 正文里的 mark 节点
    hitIdx: 0,
    pendingIntent: null,
    nodeByKey: {},
    parentKey: {},
    keyByPageId: {},
    navKey: null,
    lastPct: -1,
    lastDone: -1
  };

  var prog = {};        // { pageId: { d:1, y:123 } }
  var tocState = {};    // { groupId: 0|1 }
  var IDX = null;       // 搜索索引（懒建）

  function loadSettings() {
    var t = storeGet(K.theme);
    state.theme = (t === 'dark' || t === 'light') ? t : 'auto';

    var f = parseInt(storeGet(K.fs), 10);
    state.fs = (f >= 0 && f <= 3) ? f : 1;

    try {
      var raw = storeGet(K.prog);
      prog = raw ? (JSON.parse(raw) || {}) : {};
      if (typeof prog !== 'object' || Array.isArray(prog)) prog = {};
    } catch (e) { prog = {}; }

    try {
      var rawT = storeGet(K.toc);
      tocState = rawT ? (JSON.parse(rawT) || {}) : {};
      if (typeof tocState !== 'object' || Array.isArray(tocState)) tocState = {};
    } catch (e) { tocState = {}; }
  }

  function saveProgSoon() {
    clearTimeout(saveProgSoon._t);
    saveProgSoon._t = setTimeout(function () {
      storeSet(K.prog, JSON.stringify(prog));
    }, 400);
  }
  function saveTocState() {
    storeSet(K.toc, JSON.stringify(tocState));
  }

  /* ======================================================================
   * 4. DOM 引用
   * ==================================================================== */
  var el = {};
  function grabDom() {
    el.html = document.documentElement;
    el.sidebar = $('#sidebar');
    el.nav = $('#nav');
    el.searchInput = $('#searchInput');
    el.searchClear = $('#searchClear');
    el.searchResults = $('#searchResults');
    el.stage = $('#stage');
    el.paper = $('#paper');
    el.content = $('#content');
    el.outline = $('#outline');
    el.pager = $('#pager');
    el.bookFoot = $('#bookFoot');
    el.crumb = $('#crumb');
    el.progLabel = $('#progLabel');
    el.progCount = $('#progCount');
    el.progBar = $('#progBar');
    el.progBarWrap = $('#progBarWrap');
    el.progPillText = $('#progPillText');
    el.progPill = $('#progPill');
    el.hamburger = $('#hamburger');
    el.scrim = $('#scrim');
    el.themeBtn = $('#themeBtn');
    el.themeBtn2 = $('#themeBtn2');
    el.fsGroup = $('#fsGroup');
    el.printBtn = $('#printBtn');
    el.printBtn2 = $('#printBtn2');
    el.hitbar = $('#hitbar');
    el.hbCount = $('#hbCount');
    el.hbPrev = $('#hbPrev');
    el.hbNext = $('#hbNext');
    el.hbClose = $('#hbClose');
    el.lightbox = $('#lightbox');
    el.lbImg = $('#lbImg');
    el.lbCap = $('#lbCap');
    el.toast = $('#toast');
    el.brandTitle = $('#brandTitle');
    el.brandSub = $('#brandSub');
    el.brandMeta = $('#brandMeta');
    el.demoTag = $('#demoTag');
    el.themeColor = $('#themeColor');
  }

  /* ======================================================================
   * 5. 提示条
   * ==================================================================== */
  var toastTimer = null;
  function toast(msg) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove('show'); }, 1900);
  }

  /* ======================================================================
   * 6. 主题
   * ==================================================================== */
  function sysDark() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch (e) { return false; }
  }
  function effectiveTheme() {
    return state.theme === 'auto' ? (sysDark() ? 'dark' : 'light') : state.theme;
  }
  function applyTheme(mode, persist) {
    if (mode !== 'auto' && mode !== 'light' && mode !== 'dark') mode = 'auto';
    state.theme = mode;
    if (mode === 'auto') el.html.removeAttribute('data-theme');
    else el.html.setAttribute('data-theme', mode);
    if (persist !== false) storeSet(K.theme, mode === 'auto' ? null : mode);

    var eff = effectiveTheme();
    var label = mode === 'auto' ? '主题：跟随系统' : (mode === 'dark' ? '主题：深色' : '主题：浅色');
    [el.themeBtn, el.themeBtn2].forEach(function (b) {
      if (!b) return;
      b.textContent = mode === 'auto' ? '◐' : (mode === 'dark' ? '●' : '○');
      b.title = label + '（点击切换）';
      b.setAttribute('aria-label', label);
    });
    if (el.themeColor) {
      el.themeColor.setAttribute('content', eff === 'dark' ? '#171512' : '#fbf7f2');
    }
  }
  function cycleTheme() {
    var order = ['auto', 'dark', 'light'];
    var next = order[(order.indexOf(state.theme) + 1) % order.length];
    applyTheme(next);
    toast(next === 'auto' ? '主题：跟随系统' : (next === 'dark' ? '主题：深色' : '主题：浅色'));
  }

  /* ======================================================================
   * 7. 字号
   * ==================================================================== */
  var FS_NAMES = ['小', '标准', '大', '特大'];
  function applyFs(n, persist) {
    n = clamp(parseInt(n, 10) || 0, 0, 3);
    state.fs = n;
    el.html.setAttribute('data-fs', String(n));
    if (persist !== false) storeSet(K.fs, String(n));
    if (el.fsGroup) {
      $$('button[data-fs]', el.fsGroup).forEach(function (b) {
        var on = parseInt(b.getAttribute('data-fs'), 10) === n;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
  }

  /* ======================================================================
   * 8. 路由
   * ==================================================================== */
  function firstPage() { return BOOK.order[0]; }

  function parseHash() {
    var h = String(window.location.hash || '');
    if (h.charAt(0) === '#') h = h.slice(1);
    if (h.charAt(0) === '/') h = h.slice(1);
    var qi = h.indexOf('?');
    var query = '';
    if (qi >= 0) { query = h.slice(qi + 1); h = h.slice(0, qi); }
    var id = h;
    try { id = decodeURIComponent(h); } catch (e) { id = h; }
    var params = {};
    query.split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      var k = i < 0 ? kv : kv.slice(0, i);
      var v = i < 0 ? '' : kv.slice(i + 1);
      try { params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); }
      catch (e) { params[k] = v; }
    });
    return { id: id, params: params };
  }

  function setHash(id, replace) {
    var target = '#/' + id;
    if (window.location.hash === target) return false;
    if (replace) {
      try { window.history.replaceState(null, '', target); return true; } catch (e) {}
    }
    window.location.hash = target;
    return true;
  }

  /* 跳页。intent: { scroll:'top'|'restore'|'hit', hit:Number } */
  function go(id, intent) {
    if (!BOOK.pages[id]) id = firstPage();
    if (!id) return;
    state.pendingIntent = intent || { scroll: 'top' };
    if (!setHash(id)) {
      // hash 没变（同页）：直接渲染
      var it = state.pendingIntent;
      state.pendingIntent = null;
      render(id, it);
    }
  }
  function prevPage() {
    var i = BOOK.order.indexOf(state.pageId);
    if (i <= 0) { toast('已经是第一节了'); return; }
    go(BOOK.order[i - 1], { scroll: 'top' });
  }
  function nextPage() {
    var i = BOOK.order.indexOf(state.pageId);
    if (i < 0 || i >= BOOK.order.length - 1) { toast('已经是最后一节了'); return; }
    go(BOOK.order[i + 1], { scroll: 'top' });
  }

  function applyRoute(intent) {
    var parsed = parseHash();
    var id = parsed.id;

    if (!id || !BOOK.pages[id]) {
      var fb = firstPage();
      if (parsed.id && parsed.id !== fb) {
        // 未知 id：修正 URL，不留脏历史
        setHash(fb, true);
      } else if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
        setHash(fb, true);
      }
      id = fb;
    }
    if (!id) { renderEmpty('书中没有可显示的页面。'); return; }

    var it = intent || state.pendingIntent || { scroll: state.pageId ? 'restore' : 'top' };
    state.pendingIntent = null;
    render(id, it);
    if (parsed.params && parsed.params.sec) {
      var aid = parsed.params.sec;
      setTimeout(function () { scrollToId(aid); }, 40);
    }
  }

  /* ======================================================================
   * 9. 目录树
   * ==================================================================== */
  function buildTree() {
    var roots = [], stack = [], parentKey = {}, nodeByKey = {}, keyByPageId = {};
    var toc = BOOK.toc || [];

    // toc 的 id 是「页面 id」，同一个页面可能同时挂着 编 / 章 / 节 三条，
    // 所以树节点的身份用合成 key（n0、n1…），id 只用来导航。
    function reg(node) {
      nodeByKey[node.key] = node;
      var prev = keyByPageId[node.id];
      if (!prev || (nodeByKey[prev] && nodeByKey[prev].level <= node.level)) {
        keyByPageId[node.id] = node.key;   // 同页多条时，最深的（节）作为代表
      }
    }

    if (!toc.length) {
      BOOK.order.forEach(function (id, i) {
        var node = { key: 'n' + i, id: id, title: BOOK.pages[id].title, level: 3, children: [], page: BOOK.pages[id] };
        roots.push(node);
        reg(node);
      });
      state.nodeByKey = nodeByKey; state.parentKey = parentKey; state.keyByPageId = keyByPageId;
      return roots;
    }

    toc.forEach(function (item, i) {
      if (!item || !item.id) return;
      var node = {
        key: 'n' + i,
        id: item.id,
        title: item.title || (BOOK.pages[item.id] && BOOK.pages[item.id].title) || '（无标题）',
        level: clamp(parseInt(item.level, 10) || 1, 1, 6),
        children: [],
        anchor: item.anchor || '',
        page: BOOK.pages[item.id] || null
      };
      while (stack.length && stack[stack.length - 1].level >= node.level) stack.pop();
      if (stack.length) {
        var p = stack[stack.length - 1];
        p.children.push(node);
        parentKey[node.key] = p.key;
      } else {
        roots.push(node);
      }
      stack.push(node);
      reg(node);
    });

    state.nodeByKey = nodeByKey;
    state.parentKey = parentKey;
    state.keyByPageId = keyByPageId;
    return roots;
  }

  function keyForPage(id) { return state.keyByPageId[id] || null; }

  /* 当前页在目录里就用自己；若是长节续页（chunk，不在 toc），
     回退到 BOOK.order 中前面最近的目录页 —— 目录高亮与展开都跟随它。 */
  function navTargetId() {
    if (keyForPage(state.pageId)) return state.pageId;
    var idx = BOOK.order.indexOf(state.pageId);
    while (idx > 0) {
      idx -= 1;
      if (keyForPage(BOOK.order[idx])) return BOOK.order[idx];
    }
    return state.pageId;
  }

  function currentAncestors() {
    var set = {}, key = state.navKey || keyForPage(state.navId || state.pageId), guard = 0;
    while (key && state.nodeByKey[key] && guard++ < 40) {
      set[key] = 1;
      key = state.parentKey[key];
    }
    return set;
  }

  function isOpen(key) {
    if (tocState[key] === 0) return false;
    if (tocState[key] === 1) return true;
    return !!currentAncestors()[key];
  }

  function toggleGroup(key) {
    if (!key) return;
    tocState[key] = isOpen(key) ? 0 : 1;
    saveTocState();
    syncOpen();
  }

  function syncOpen() {
    if (!el.nav) return;
    var anc = currentAncestors();
    $$('.nav-group', el.nav).forEach(function (g) {
      var id = g.getAttribute('data-gid');
      var open = tocState[id] === 0 ? false : (tocState[id] === 1 ? true : !!anc[id]);
      g.classList.toggle('open', open);
      var row = g.firstElementChild;
      if (row && row.hasAttribute('aria-expanded')) {
        row.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
    });
  }

  function navRowClass(level) {
    return 'nav-row nav-l' + Math.min(level, 3);
  }

  function makeNavRow(node) {
    var hasKids = node.children && node.children.length > 0;
    var hasPage = !!node.page;
    var row;
    if (hasPage) {
      row = document.createElement('a');
      row.href = '#/' + node.id + (node.anchor ? '?sec=' + encodeURIComponent(node.anchor) : '');
    } else {
      row = document.createElement('div');
      row.setAttribute('role', 'button');
      row.tabIndex = 0;
    }
    row.className = navRowClass(node.level);
    row.setAttribute('data-nav-id', node.id);
    row.setAttribute('data-nav-key', node.key);
    if (node.level > 3) row.style.paddingLeft = (14 + 17 * (node.level - 3)) + 'px';
    if (hasKids) row.setAttribute('aria-expanded', 'false');

    // 折叠箭头
    var tw = document.createElement('span');
    tw.className = hasKids ? 'twisty' : 'twisty-spacer';
    if (hasKids) tw.textContent = '▶';
    tw.setAttribute('aria-hidden', 'true');
    row.appendChild(tw);

    // 标题
    var t = document.createElement('span');
    t.className = 'nav-title';
    t.textContent = node.title;
    row.appendChild(t);

    // 已读 / 在读点
    var dot = document.createElement('span');
    dot.className = 'dot';
    dot.setAttribute('data-dot', node.key);
    dot.setAttribute('aria-hidden', 'true');
    row.appendChild(dot);

    return row;
  }

  function navNodeEl(node) {
    var wrap = document.createElement('div');
    wrap.className = 'nav-group';
    wrap.setAttribute('data-gid', node.key);
    wrap.appendChild(makeNavRow(node));
    if (node.children && node.children.length) {
      var kids = document.createElement('div');
      kids.className = 'nav-children';
      node.children.forEach(function (c) { kids.appendChild(navNodeEl(c)); });
      wrap.appendChild(kids);
    }
    return wrap;
  }

  function buildNav() {
    if (!el.nav) return;
    el.nav.innerHTML = '';
    var roots = buildTree();
    var inToc = {};
    (BOOK.toc || []).forEach(function (t) { inToc[t.id] = 1; });

    // 有页面但不在目录里的（如「导言」）：放在目录最前
    BOOK.order.forEach(function (id) {
      if (inToc[id]) return;
      var p = BOOK.pages[id];
      if (!p || p.chunk === true) return;   // 长节续页（chunk）不进目录，只参与翻页/进度
      var onode = { key: 'x' + id, id: id, title: p.title, level: 3, children: [], page: p };
      state.nodeByKey[onode.key] = onode;
      if (!state.keyByPageId[id]) state.keyByPageId[id] = onode.key;
      var row = document.createElement('a');
      row.className = 'nav-row nav-l3';
      row.href = '#/' + id;
      row.setAttribute('data-nav-id', id);
      row.setAttribute('data-nav-key', onode.key);
      var sp = document.createElement('span');
      sp.className = 'twisty-spacer';
      row.appendChild(sp);
      var t = document.createElement('span');
      t.className = 'nav-title';
      t.textContent = p.title;
      row.appendChild(t);
      var dot = document.createElement('span');
      dot.className = 'dot';
      dot.setAttribute('data-dot', onode.key);
      dot.setAttribute('aria-hidden', 'true');
      row.appendChild(dot);
      el.nav.appendChild(row);
    });

    roots.forEach(function (r) { el.nav.appendChild(navNodeEl(r)); });
    syncOpen();
    updateDots();
    markActiveNav();
  }

  function dotClass(id) {
    if (!BOOK.pages[id]) return '';
    if (prog[id] && prog[id].d) return 'done';
    if (id === state.pageId) return 'reading';
    return '';
  }

  function groupDotClass(node) {
    var ids = [];
    (function walk(n) {
      if (n.page) ids.push(n.id);
      (n.children || []).forEach(walk);
    })(node);
    if (!ids.length) return '';
    var done = 0;
    ids.forEach(function (id) { if (prog[id] && prog[id].d) done++; });
    if (done === ids.length) return 'done';
    if (done > 0 || ids.indexOf(state.pageId) >= 0) return 'reading';
    return '';
  }

  function updateDots() {
    if (!el.nav) return;
    $$('[data-dot]', el.nav).forEach(function (dot) {
      var key = dot.getAttribute('data-dot');
      var node = state.nodeByKey[key];
      var cls = 'dot';
      if (node && node.children && node.children.length) cls += ' ' + groupDotClass(node);
      else cls += ' ' + dotClass(node ? node.id : key);
      dot.className = cls.replace(/\s+/g, ' ').trim();
    });
  }

  function markActiveNav() {
    if (!el.nav) return;
    var rows = {};
    $$('.nav-row', el.nav).forEach(function (row) {
      rows[row.getAttribute('data-nav-key')] = row;
      row.classList.remove('active', 'active-cont');
      row.removeAttribute('aria-current');
    });
    var target = state.navId || navTargetId();
    var active = rows[state.navKey || keyForPage(target)];
    var cont = target !== state.pageId;   // 当前页是续页：高亮其所属的上一节
    if (active) {
      active.classList.add('active');
      if (cont) active.classList.add('active-cont');
      active.setAttribute('aria-current', cont ? 'true' : 'page');
    }
    if (!active) return;
    var nr = el.nav.getBoundingClientRect();
    var ar = active.getBoundingClientRect();
    if (ar.top < nr.top + 6) el.nav.scrollTop -= (nr.top + 6 - ar.top);
    else if (ar.bottom > nr.bottom - 6) el.nav.scrollTop += (ar.bottom - nr.bottom + 6);
  }

  /* ======================================================================
   * 10. 渲染一页
   * ==================================================================== */
  function renderEmpty(msg) {
    if (!el.content) return;
    el.content.innerHTML = '<p class="lead">' + esc(msg) + '</p>';
    if (el.pager) el.pager.innerHTML = '';
    if (el.outline) { el.outline.hidden = true; el.stage.classList.remove('with-outline'); }
  }

  function crumbList(p) {
    var cr = (p.crumbs || []).slice(0, 4);
    // 末尾与页标题重复的层级不再重复显示
    while (cr.length && squash(cr[cr.length - 1]) === squash(p.title)) cr.pop();
    return cr;
  }
  function crumbsHtml(p) {
    var parts = [];
    crumbList(p).forEach(function (c) { parts.push('<span>' + esc(c) + '</span>'); });
    return parts.join('');
  }

  /* 页首的「编 / 章」标题：提取成页头 kicker（与页标题重复的丢弃） */
  var KICK_RE = /^\s*<h([12])\s+class="(part-title|chapter-title)"[^>]*>([\s\S]*?)<\/h\1>\s*/;
  function extractKickers(page) {
    var html = page.html || '';
    var out = '';
    var m;
    while ((m = KICK_RE.exec(html))) {
      html = html.slice(m[0].length);
      var txt = m[3].replace(/<[^>]+>/g, '').trim();
      if (!txt || squash(txt) === squash(page.title)) continue;
      out += '<p class="kicker kicker-' + (m[2] === 'part-title' ? 'part' : 'chapter') + '">' + txt + '</p>';
    }
    return { kicks: out, html: html };
  }

  function render(id, intent) {
    intent = intent || { scroll: 'top' };
    var page = BOOK.pages[id];
    if (!page) { renderEmpty('这一页不存在。'); return; }

    // 离开上一页时，读了过半就记「已读」
    if (state.pageId && state.pageId !== id) commitRead(state.pageId);

    state.pageId = id;
    state.ratio = 0;

    var i = BOOK.order.indexOf(id);
    var total = BOOK.order.length;

    var kick = extractKickers(page);
    var head = '<header class="page-head">' +
      (page.crumbs && page.crumbs.length ? '<p class="page-crumbs">' + crumbsHtml(page) + '</p>' : '') +
      kick.kicks +
      '<h1 class="page-title">' + esc(page.title) + '</h1>' +
      '<div class="page-meta">' +
        '<span>第 ' + (i + 1) + ' / ' + total + ' 节</span>' +
        '<span>约 ' + (page.chars || 0) + ' 字</span>' +
        (prog[id] && prog[id].d ? '<span>已读</span>' : '') +
      '</div></header>';

    el.content.innerHTML = head + (kick.html || '<p class="lead">（本节内容尚未生成。）</p>');
    dedupeHead(page);
    enhanceContent();

    // 文档标题 / 面包屑
    var mt = (BOOK.meta && BOOK.meta.title) || '阿拉伯文化背景知识基础教程';
    document.title = page.title + ' · ' + mt;
    if (el.crumb) {
      var c = crumbList(page).slice(-2);
      var txt = c.length ? c.join(' › ') : page.title;
      el.crumb.innerHTML = '<b>' + esc(txt) + '</b>';
    }

    buildOutline();
    buildPager();
    buildFoot();
    state.navId = navTargetId();
    state.navKey = keyForPage(state.navId);
    markActiveNav();
    syncOpen();
    updateDots();
    updateProgress(true);

    // 滚动位置
    var savedY = prog[id] && prog[id].y ? prog[id].y : 0;
    var wantRestore = intent.scroll === 'restore' && savedY > 0;
    if (intent.scroll !== 'hit') {
      window.scrollTo(0, wantRestore ? savedY : 0);
      state.ratio = wantRestore ? estimateRatio(savedY) : 0;
    }

    // 搜索高亮（跨页保留）
    if (state.highlight.q) {
      applyHighlight(0, intent.scroll === 'hit');
    } else {
      hideHitbar();
    }

    if (el.content && el.content.focus) {
      try { el.content.focus({ preventScroll: true }); } catch (e) { el.content.focus(); }
    }
    closeDrawer();
    updateOutlineActive();
  }

  function estimateRatio(y) {
    var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return max < 1 ? 1 : clamp(y / max, 0, 1);
  }

  /* 生成器常把「页标题」同时写成页内 h2.sec-title，这里去掉重复的那一个 */
  function dedupeHead(page) {
    var kids = el.content.children;
    var head = kids[0];
    if (!head || !head.classList || !head.classList.contains('page-head')) return;
    var h = kids[1];
    if (!h || h.tagName !== 'H2' || !h.classList.contains('sec-title')) return;
    var a = squash(h.textContent || '');
    var b = squash(page.title || '');
    if (a && b && a === b) h.parentNode.removeChild(h);
  }
  function squash(s) {
    return String(s || '').replace(/[\s\u00a0\u3000]+/g, '').replace(/[·・:：,，。.、—–\-]+$/g, '');
  }

  /* 对契约里的 HTML 片段做轻量增强（不改内容，只加容器/属性） */
  function enhanceContent() {
    // 表格包一层横向滚动容器，手机上不撑破版心
    $$('table', el.content).forEach(function (t) {
      var p = t.parentNode;
      if (p && p.classList && p.classList.contains('table-wrap')) return;
      var w = document.createElement('div');
      w.className = 'table-wrap';
      p.insertBefore(w, t);
      w.appendChild(t);
    });
    // 阿语块/行内阿语补 dir，保证即使生成器漏写也是 RTL + 隔离
    $$('.ar-block', el.content).forEach(function (b) {
      if (!b.getAttribute('dir')) b.setAttribute('dir', 'rtl');
    });
    $$('.ar', el.content).forEach(function (s) {
      if (!s.getAttribute('dir')) s.setAttribute('dir', 'rtl');
    });
    // 插图：懒加载 + 可点放大
    $$('figure img', el.content).forEach(function (img) {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      if (!img.getAttribute('alt')) img.setAttribute('alt', '插图');
    });
    wrapInlineArabic();
  }

  /* 中文正文里裸露的阿拉伯文片段包成 <span class="ar" dir="rtl">：
     这样行内阿语也能拿到 Naskh 字体栈 + 双向隔离，不会被中文的标点/字距带跑。
     生成器以后若自带 .ar 包裹，这里会自动跳过（父级已有 .ar 的文本节点不处理）。 */
  var AR_HAS = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  // 阿语「串」= 阿语字母（含附加符号）+ 中间夹杂的标点/空格 + 更多阿语。
  // 关键：标点必须包进同一个隔离段，否则中文段落里的「الكاف, اللام, النون」
  // 会被拆成多个 isolate，在 LTR 基底里按从左到右排队 —— 视觉词序正好反了。
  var AR_CLS = '[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]';
  var AR_JOIN = '[ \u00a0\t,;:.!?/\\\-\u2013\u2014\u060C\u061B\u061F\u066B\u066C\u00AB\u00BB\u2039\u203A\u2018\u2019\u201C\u201D\uFF0C\u3001\uFF1B\uFF1A\uFF08\uFF09\uFF3B\uFF3D\u300A\u300B\u3008\u3009\u3010\u3011]';
  var AR_RUN = new RegExp(AR_CLS + '+(?:' + AR_JOIN + '+' + AR_CLS + '+)*', 'g');
  function wrapInlineArabic() {
    if (!el.content || !document.createTreeWalker) return;
    var walker = document.createTreeWalker(el.content, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || !n.nodeValue || !AR_HAS.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('.ar-block, .ar, code, pre, .page-head')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var str = node.nodeValue;
      var frag = document.createDocumentFragment();
      var last = 0, m;
      AR_RUN.lastIndex = 0;
      while ((m = AR_RUN.exec(str))) {
        if (m.index > last) frag.appendChild(document.createTextNode(str.slice(last, m.index)));
        var sp = document.createElement('span');
        sp.className = 'ar';
        sp.setAttribute('dir', 'rtl');
        sp.textContent = m[0];
        frag.appendChild(sp);
        last = m.index + m[0].length;
      }
      if (last < str.length) frag.appendChild(document.createTextNode(str.slice(last)));
      if (node.parentNode) node.parentNode.replaceChild(frag, node);
    });
  }

  function commitRead(prevId) {
    if (!prevId || !prog[prevId]) return;
    if (state.ratio >= 0.5 && !prog[prevId].d) {
      prog[prevId].d = 1;
      saveProgSoon();
      updateDots();
    }
  }

  /* ---- 页内大纲 ---- */
  function buildOutline() {
    if (!el.outline) return;
    var hs = $$('h2', el.content);
    var items = [];
    hs.forEach(function (h, n) {
      var t = (h.textContent || '').trim();
      if (!t) return;
      if (!h.id) h.id = 'sec-' + (n + 1);
      items.push({ id: h.id, text: t });
    });

    el.outline.innerHTML = '';
    if (items.length < 2) {
      el.outline.hidden = true;
      el.stage.classList.remove('with-outline');
      return;
    }
    var h2 = document.createElement('h2');
    h2.textContent = '本页要点';
    el.outline.appendChild(h2);
    items.forEach(function (it) {
      var a = document.createElement('a');
      a.href = '#' + it.id;
      a.textContent = it.text;
      a.setAttribute('data-target', it.id);
      a.addEventListener('click', function (e) {
        e.preventDefault();
        scrollToId(it.id);
      });
      el.outline.appendChild(a);
    });
    el.outline.hidden = false;
    el.stage.classList.add('with-outline');
  }

  function scrollToId(id) {
    var t = document.getElementById(id);
    if (!t) return;
    var top = window.scrollY + t.getBoundingClientRect().top - 78;
    window.scrollTo(0, Math.max(0, top));
  }

  function updateOutlineActive() {
    if (!el.outline || el.outline.hidden) return;
    var links = $$('a[data-target]', el.outline);
    if (!links.length) return;
    var y = window.scrollY + 92;
    var activeId = null;
    links.forEach(function (a) {
      var h = document.getElementById(a.getAttribute('data-target'));
      if (!h) return;
      var top = window.scrollY + h.getBoundingClientRect().top;
      if (top <= y) activeId = a.getAttribute('data-target');
    });
    if (!activeId && links.length) activeId = links[0].getAttribute('data-target');
    links.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-target') === activeId);
    });
  }

  /* ---- 翻页 ---- */
  function buildPager() {
    if (!el.pager) return;
    var i = BOOK.order.indexOf(state.pageId);
    var prev = i > 0 ? BOOK.pages[BOOK.order[i - 1]] : null;
    var next = (i >= 0 && i < BOOK.order.length - 1) ? BOOK.pages[BOOK.order[i + 1]] : null;
    el.pager.innerHTML = '';
    el.pager.appendChild(pgEl(prev, 'prev'));
    el.pager.appendChild(pgEl(next, 'next'));
  }

  function pgEl(p, kind) {
    var a = document.createElement(p ? 'a' : 'div');
    a.className = 'pg ' + kind + (p ? '' : ' empty');
    if (p) a.href = '#/' + p.id;
    var k = document.createElement('span');
    k.className = 'pg-k';
    k.textContent = kind === 'prev' ? '← 上一节' : '下一节 →';
    var t = document.createElement('span');
    t.className = 'pg-t';
    t.textContent = p ? p.title : (kind === 'prev' ? '已是第一节' : '已是最后一节');
    a.appendChild(k);
    a.appendChild(t);
    return a;
  }

  /* ---- 页脚 ---- */
  function buildFoot() {
    if (!el.bookFoot) return;
    var m = BOOK.meta || {};
    var bits = [];
    if (m.author) bits.push(m.author);
    if (m.edition) bits.push(m.edition);
    bits.push(BOOK.order.length + ' 节');
    if (m.stats && m.stats.chars) bits.push(fmtChars(m.stats.chars));
    el.bookFoot.innerHTML =
      '<div class="src">《' + esc(m.title || '') + '》' + (m.subtitle ? '（' + esc(m.subtitle) + '）' : '') +
      ' · ' + esc(bits.join(' · ')) + '</div>' +
      '<div class="hint"><span><kbd>←</kbd> <kbd>→</kbd> 翻节</span>' +
      '<span><kbd>/</kbd> 搜索全书</span><span>字号与深浅色会记住</span></div>';
  }

  function fmtChars(n) {
    if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + ' 万字';
    return n + ' 字';
  }

  /* ======================================================================
   * 11. 进度
   * ==================================================================== */
  function progressInfo() {
    var total = BOOK.order.length || 1;
    var done = 0;
    BOOK.order.forEach(function (id) { if (prog[id] && prog[id].d) done++; });
    var partial = 0;
    if (state.pageId && !(prog[state.pageId] && prog[state.pageId].d)) {
      partial = clamp(state.ratio, 0, 0.95);
    }
    var pct = clamp(Math.round(((done + partial) / total) * 100), 0, 100);
    return { pct: pct, done: done, total: total };
  }

  function updateProgress(force) {
    var info = progressInfo();
    if (!force && info.pct === state.lastPct && info.done === state.lastDone) return;
    state.lastPct = info.pct;
    state.lastDone = info.done;
    if (el.progLabel) el.progLabel.textContent = '已读 ' + info.pct + '%';
    if (el.progCount) el.progCount.textContent = info.done + ' / ' + info.total;
    if (el.progBar) el.progBar.style.width = info.pct + '%';
    if (el.progBarWrap) el.progBarWrap.setAttribute('aria-valuenow', String(info.pct));
    if (el.progPillText) el.progPillText.textContent = '全书 ' + info.pct + '%';
  }

  /* ======================================================================
   * 12. 搜索
   * ==================================================================== */
  function buildIndex() {
    if (IDX) return IDX;
    IDX = BOOK.order.map(function (id) {
      var p = BOOK.pages[id] || {};
      return { id: id, title: p.title || '', text: plainText(p.html || '') };
    });
    return IDX;
  }

  function markWhole(text, range) {
    return esc(text.slice(0, range[0])) + '<mark>' + esc(text.slice(range[0], range[1])) +
      '</mark>' + esc(text.slice(range[1]));
  }

  function snippetHtml(text, ranges, focusIdx) {
    var pad = 32;
    var r = ranges[focusIdx] || ranges[0];
    if (!r) return '';
    var start = Math.max(0, r[0] - pad);
    var end = Math.min(text.length, r[1] + pad);
    var out = start > 0 ? '…' : '';
    var last = start;
    ranges.forEach(function (rr) {
      if (rr[0] < start || rr[1] > end) return;
      if (rr[0] < last) return;
      out += esc(text.slice(last, rr[0])) + '<mark>' + esc(text.slice(rr[0], rr[1])) + '</mark>';
      last = rr[1];
    });
    out += esc(text.slice(last, end));
    return out + (end < text.length ? '…' : '');
  }

  function pickSpread(n, k) {
    if (n <= 0) return [];
    if (n <= k) {
      var all = [];
      for (var i = 0; i < n; i++) all.push(i);
      return all;
    }
    var picks = [];
    for (var j = 0; j < k; j++) {
      picks.push(Math.round((j * (n - 1)) / (k - 1)));
    }
    return picks.filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  function runSearch(raw) {
    var q = String(raw == null ? '' : raw).trim();
    state.q = q;
    if (el.searchClear) el.searchClear.hidden = !q;

    if (!q) {
      showNav();
      clearHighlight();
      return;
    }

    var qn = normWithMap(q).n;
    if (!qn) { showNav(); clearHighlight(); return; }

    var idx = buildIndex();
    var list = [];
    var totalHits = 0;

    idx.forEach(function (entry) {
      var titleR = findRanges(entry.title, qn);
      var bodyR = findRanges(entry.text, qn);
      var n = titleR.length + bodyR.length;
      if (!n) return;
      totalHits += n;

      var snips = [];
      if (titleR.length) snips.push(markWhole(entry.title, titleR[0]));
      pickSpread(bodyR.length, 3).forEach(function (k) {
        var s = snippetHtml(entry.text, bodyR, k);
        if (s) snips.push(s);
      });
      list.push({
        id: entry.id,
        title: entry.title,
        page: BOOK.pages[entry.id],
        hits: n,
        snips: snips
      });
    });

    renderResults(list, totalHits, q);
    showResults();

    // 当前页同步高亮
    if (state.pageId) {
      state.highlight.q = q;
      state.highlight.qn = qn;
      applyHighlight(0, false);
    }
  }

  var MAX_RESULTS = 60;

  function renderResults(list, totalHits, q) {
    if (!el.searchResults) return;
    el.searchResults.innerHTML = '';

    if (!list.length) {
      var empty = document.createElement('div');
      empty.className = 'res-empty';
      empty.innerHTML = '没有找到「' + esc(q) + '」。<br>可以试试更短的词、只输入一个汉字，' +
        '或去掉阿拉伯文的附加符号（如 اللُّغَة → اللغة）。';
      el.searchResults.appendChild(empty);
      return;
    }

    var head = document.createElement('div');
    head.className = 'res-head';
    head.innerHTML = '<span><b>' + list.length + '</b> 节 · ' + totalHits + ' 处</span>' +
      '<span>Enter 打开首条</span>';
    el.searchResults.appendChild(head);

    var shown = list.slice(0, MAX_RESULTS);
    shown.forEach(function (r, n) {
      var d = document.createElement('div');
      d.className = 'result';
      d.setAttribute('role', 'button');
      d.tabIndex = 0;
      d.setAttribute('data-id', r.id);

      var crumbs = (r.page && r.page.crumbs) ? r.page.crumbs.slice(-2).join(' › ') : '';
      var html = '<div class="rt">' + esc(r.title) + '</div>' +
        (crumbs ? '<div class="rc">' + esc(crumbs) + '</div>' : '');
      r.snips.forEach(function (s) { html += '<div class="rs">' + s + '</div>'; });
      d.innerHTML = html;

      d.addEventListener('click', function () { openResult(r.id); });
      d.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openResult(r.id); }
      });
      el.searchResults.appendChild(d);
    });

    if (list.length > MAX_RESULTS) {
      var more = document.createElement('div');
      more.className = 'res-head';
      more.innerHTML = '<span>只显示前 ' + MAX_RESULTS + ' 节</span>';
      el.searchResults.appendChild(more);
    }
  }

  function openResult(id) {
    state.highlight.q = state.q;
    state.highlight.qn = normWithMap(state.q).n;
    go(id, { scroll: 'hit', hit: 0 });
    showNav();
  }

  function showResults() {
    if (el.nav) el.nav.hidden = true;
    if (el.searchResults) el.searchResults.hidden = false;
  }
  function showNav() {
    if (el.nav) el.nav.hidden = false;
    if (el.searchResults) el.searchResults.hidden = true;
  }

  function focusSearch() {
    if (!el.searchInput) return;
    if (isMobile()) openDrawer();
    el.searchInput.focus();
    try { el.searchInput.select(); } catch (e) {}
  }

  function clearSearch() {
    if (el.searchInput) el.searchInput.value = '';
    runSearch('');
  }

  /* ======================================================================
   * 13. 正文高亮 + 命中条
   * ==================================================================== */
  function clearMarks() {
    if (!el.content) return 0;
    var marks = $$('mark.hit', el.content);
    marks.forEach(function (m) {
      var t = document.createTextNode(m.textContent);
      m.parentNode.replaceChild(t, m);
    });
    if (marks.length) el.content.normalize();
    state.hits = [];
    state.hitIdx = 0;
    return marks.length;
  }

  /* 在 #content 里标出 q 的所有命中（按文本节点，去附加符号匹配） */
  function highlightIn(root, qn) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n;
    while ((n = walker.nextNode())) {
      if (!n.nodeValue || !n.nodeValue.trim()) continue;
      var p = n.parentNode;
      if (!p) continue;
      if (/^(SCRIPT|STYLE|MARK)$/.test(p.nodeName)) continue;
      if (p.closest && p.closest('mark.hit')) continue;
      nodes.push(n);
    }

    var marks = [];
    nodes.forEach(function (node) {
      var text = node.nodeValue;
      var ranges = findRanges(text, qn);
      if (!ranges.length) return;
      var frag = document.createDocumentFragment();
      var last = 0;
      ranges.forEach(function (r) {
        if (r[0] > last) frag.appendChild(document.createTextNode(text.slice(last, r[0])));
        var mk = document.createElement('mark');
        mk.className = 'hit';
        mk.textContent = text.slice(r[0], r[1]);
        frag.appendChild(mk);
        marks.push(mk);
        last = r[1];
      });
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
    return marks;
  }

  function applyHighlight(jumpTo, doScroll) {
    if (!el.content) return;
    clearMarks();
    var qn = state.highlight.qn || normWithMap(state.highlight.q).n;
    if (!qn) { hideHitbar(); return; }

    var marks = highlightIn(el.content, qn);
    state.hits = marks;
    if (!marks.length) { hideHitbar(); return; }

    state.hitIdx = clamp(jumpTo || 0, 0, marks.length - 1);
    updateHitbar();
    if (doScroll) jumpToMark(state.hitIdx);
  }

  function updateHitbar() {
    if (!el.hitbar) return;
    var n = state.hits.length;
    if (!n) { hideHitbar(); return; }
    el.hitbar.hidden = false;
    if (el.hbCount) el.hbCount.textContent = (state.hitIdx + 1) + ' / ' + n;
    state.hits.forEach(function (m, i) {
      m.classList.toggle('current', i === state.hitIdx);
    });
  }

  function hideHitbar() {
    if (el.hitbar) el.hitbar.hidden = true;
  }

  function jumpToMark(i) {
    var m = state.hits[i];
    if (!m) return;
    var r = m.getBoundingClientRect();
    var y = window.scrollY + r.top - Math.max(120, window.innerHeight * 0.34);
    window.scrollTo(0, Math.max(0, y));
  }

  function stepHit(delta) {
    if (!state.hits.length) return;
    var n = state.hits.length;
    state.hitIdx = (state.hitIdx + delta + n) % n;
    updateHitbar();
    jumpToMark(state.hitIdx);
  }

  function clearHighlight() {
    state.highlight.q = '';
    state.highlight.qn = '';
    clearMarks();
    hideHitbar();
  }

  /* ======================================================================
   * 14. 抽屉 / 灯箱
   * ==================================================================== */
  function isMobile() {
    return window.innerWidth < 820;
  }
  function openDrawer() {
    if (!isMobile()) return;
    el.html.classList.add('drawer');
    if (el.scrim) el.scrim.hidden = false;
    if (el.hamburger) el.hamburger.setAttribute('aria-expanded', 'true');
  }
  function closeDrawer() {
    el.html.classList.remove('drawer');
    if (el.scrim) el.scrim.hidden = true;
    if (el.hamburger) el.hamburger.setAttribute('aria-expanded', 'false');
  }
  function toggleDrawer() {
    if (el.html.classList.contains('drawer')) closeDrawer();
    else openDrawer();
  }

  function openLightbox(img) {
    if (!el.lightbox || !el.lbImg) return;
    el.lbImg.src = img.currentSrc || img.src;
    el.lbImg.alt = img.alt || '';
    var fig = img.closest ? img.closest('figure') : null;
    var cap = fig ? $('figcaption', fig) : null;
    if (el.lbCap) el.lbCap.textContent = cap ? cap.textContent : (img.alt || '');
    el.lightbox.hidden = false;
    el.html.classList.add('lb-open');
    try { el.lightbox.focus({ preventScroll: true }); } catch (e) {}
  }
  function closeLightbox() {
    if (!el.lightbox || el.lightbox.hidden) return;
    el.lightbox.hidden = true;
    el.html.classList.remove('lb-open');
    if (el.lbImg) el.lbImg.removeAttribute('src');
  }

  /* ======================================================================
   * 15. 滚动
   * ==================================================================== */
  var scrollTick = false;
  function onScroll() {
    if (scrollTick) return;
    scrollTick = true;
    window.requestAnimationFrame(function () {
      scrollTick = false;
      var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      var y = window.scrollY || window.pageYOffset || 0;
      var ratio = max < 1 ? 1 : clamp(y / max, 0, 1);
      state.ratio = ratio;

      if (state.pageId) {
        if (!prog[state.pageId]) prog[state.pageId] = {};
        prog[state.pageId].y = Math.round(y);
        if (max >= 120 && ratio >= 0.92 && !prog[state.pageId].d) {
          prog[state.pageId].d = 1;
          updateDots();
          updateProgress(true);
        }
        saveProgSoon();
      }
      updateProgress(false);
      updateOutlineActive();
    });
  }

  /* ======================================================================
   * 16. 事件绑定
   * ==================================================================== */
  function bindEvents() {
    /* ---- 路由 ---- */
    window.addEventListener('popstate', function () {
      state.pendingIntent = { scroll: 'restore' };
    });
    window.addEventListener('hashchange', function () {
      var intent = state.pendingIntent || { scroll: 'top' };
      state.pendingIntent = null;
      applyRoute(intent);
    });

    /* ---- 滚动 ---- */
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      if (!isMobile()) closeDrawer();
      updateOutlineActive();
    });

    /* ---- 目录树：点击 ---- */
    el.nav.addEventListener('click', function (e) {
      var row = e.target.closest ? e.target.closest('[data-nav-id]') : null;
      if (!row) return;
      var id = row.getAttribute('data-nav-id');
      var key = row.getAttribute('data-nav-key');
      var wrap = row.parentNode;
      var kids = wrap && wrap.classList && wrap.classList.contains('nav-group') ? wrap.querySelector('.nav-children') : null;

      var onTwisty = !!(e.target.closest && e.target.closest('.twisty'));
      var isLink = row.tagName === 'A';

      if (onTwisty || !isLink) {
        e.preventDefault();
        if (kids) toggleGroup(key);
        return;
      }
      // 有子项的分组行：导航的同时展开
      if (kids && key && tocState[key] !== 0) {
        tocState[key] = 1;
        saveTocState();
        syncOpen();
      }
      if (isMobile()) closeDrawer();
    });

    /* ---- 目录树：键盘（纯分组行） ---- */
    el.nav.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var row = e.target.closest ? e.target.closest('[data-nav-id]') : null;
      if (!row || row.tagName === 'A') return;
      e.preventDefault();
      toggleGroup(row.getAttribute('data-nav-key'));
    });

    /* ---- 搜索 ---- */
    var searchTimer = null;
    el.searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      var v = el.searchInput.value;
      searchTimer = setTimeout(function () { runSearch(v); }, 90);
    });
    el.searchInput.addEventListener('focus', function () {
      if (el.searchInput.value.trim()) showResults();
    });
    el.searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var first = $('.result', el.searchResults);
        if (first) openResult(first.getAttribute('data-id'));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearSearch();
        el.searchInput.blur();
      }
    });
    el.searchInput.addEventListener('search', function () {
      if (!el.searchInput.value) runSearch('');
    });
    el.searchClear.addEventListener('click', function () {
      clearSearch();
      el.searchInput.focus();
    });

    /* ---- 主题 / 字号 / 打印 ---- */
    [el.themeBtn, el.themeBtn2].forEach(function (b) {
      if (b) b.addEventListener('click', cycleTheme);
    });
    if (el.fsGroup) {
      el.fsGroup.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('button[data-fs]') : null;
        if (!b) return;
        var n = parseInt(b.getAttribute('data-fs'), 10);
        applyFs(n);
        toast('字号：' + FS_NAMES[n]);
      });
    }
    [el.printBtn, el.printBtn2].forEach(function (b) {
      if (b) b.addEventListener('click', function () { window.print(); });
    });

    /* ---- 抽屉 ---- */
    if (el.hamburger) el.hamburger.addEventListener('click', toggleDrawer);
    if (el.scrim) el.scrim.addEventListener('click', closeDrawer);

    /* ---- 进度胶囊 ---- */
    if (el.progPill) {
      el.progPill.addEventListener('click', function () {
        var info = progressInfo();
        var i = BOOK.order.indexOf(state.pageId);
        toast('已读 ' + info.done + ' / ' + info.total + ' 节（' + info.pct + '%）· 当前第 ' + (i + 1) + ' 节');
      });
    }

    /* ---- 命中条 ---- */
    if (el.hbPrev) el.hbPrev.addEventListener('click', function () { stepHit(-1); });
    if (el.hbNext) el.hbNext.addEventListener('click', function () { stepHit(1); });
    if (el.hbClose) el.hbClose.addEventListener('click', clearHighlight);

    /* ---- 灯箱 ---- */
    el.content.addEventListener('click', function (e) {
      var img = e.target && e.target.tagName === 'IMG' ? e.target : null;
      if (img && img.closest && img.closest('#content')) openLightbox(img);
    });
    if (el.lightbox) {
      el.lightbox.setAttribute('tabindex', '-1');
      el.lightbox.addEventListener('click', closeLightbox);
    }

    /* ---- 键盘 ---- */
    document.addEventListener('keydown', onKeydown);

    /* ---- 系统主题变化 ---- */
    try {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onMq = function () { if (state.theme === 'auto') applyTheme('auto', false); };
      if (mq.addEventListener) mq.addEventListener('change', onMq);
      else if (mq.addListener) mq.addListener(onMq);
    } catch (e) {}

    /* ---- 打印前收灯箱 ---- */
    window.addEventListener('beforeprint', function () {
      closeLightbox();
    });
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      if (el.lightbox && !el.lightbox.hidden) { closeLightbox(); return; }
      if (el.html.classList.contains('drawer')) { closeDrawer(); return; }
      if (el.searchInput && el.searchInput.value) {
        clearSearch();
        if (document.activeElement === el.searchInput) el.searchInput.blur();
        return;
      }
      if (!el.hitbar.hidden) { clearHighlight(); return; }
      return;
    }

    if (e.metaKey || e.ctrlKey) {
      if ((e.key === 'k' || e.key === 'K')) { e.preventDefault(); focusSearch(); }
      return;
    }
    if (e.altKey) return;

    var t = e.target;
    var inField = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
    if (inField) return;

    if (e.key === 'ArrowLeft') { e.preventDefault(); prevPage(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); nextPage(); }
    else if (e.key === '/') { e.preventDefault(); focusSearch(); }
    else if (e.key === 'ArrowDown' && !el.hitbar.hidden) { e.preventDefault(); stepHit(1); }
    else if (e.key === 'ArrowUp' && !el.hitbar.hidden) { e.preventDefault(); stepHit(-1); }
  }

  /* ======================================================================
   * 17. 首屏信息
   * ==================================================================== */
  function fillMeta() {
    var m = BOOK.meta || {};
    if (el.brandTitle) el.brandTitle.textContent = m.title || '阿拉伯文化背景知识基础教程';
    if (el.brandSub) el.brandSub.textContent = m.subtitle || '纯阅读版';
    if (el.brandMeta) {
      var bits = [];
      if (m.author) bits.push(m.author);
      if (m.edition) bits.push(m.edition);
      bits.push(BOOK.order.length + ' 节');
      if (m.stats && m.stats.chars) bits.push(fmtChars(m.stats.chars));
      el.brandMeta.textContent = bits.join(' · ');
      if (m.note) el.brandMeta.title = m.note;
    }
    if (el.demoTag) el.demoTag.hidden = !window.BOOK_MOCK;
  }

  /* ======================================================================
   * 18. 启动
   * ==================================================================== */
  function init() {
    grabDom();

    if (!normalizeBook()) {
      renderEmpty('没有找到书籍数据：请先生成 content/book.js，或保留 assets/mock-book.js 作为示例数据。');
      return;
    }

    try { window.history.scrollRestoration = 'manual'; } catch (e) {}

    loadSettings();
    applyFs(state.fs, false);
    applyTheme(state.theme, false);
    fillMeta();
    buildNav();
    bindEvents();

    // 开发参数：?theme=dark&fs=2&q=…
    var params = parseHash().params;
    if (params.theme) applyTheme(params.theme, false);
    if (params.fs !== undefined && params.fs !== '') applyFs(params.fs, false);
    if (params.q) {
      el.searchInput.value = params.q;
      runSearch(params.q);
    }

    applyRoute({ scroll: 'top' });

    // 开发参数：?drawer=1 便于截手机抽屉图，?y=1200 便于截正文深处（生产环境无影响）
    if (params.drawer === '1') openDrawer();
    if (params.y) {
      var yv = parseInt(params.y, 10) || 0;
      window.scrollTo(0, yv);
      state.ratio = estimateRatio(yv);
    }

    // 调试出口（无副作用，方便截图/自检脚本断言）
    window.__acb = {
      state: state,
      prog: prog,
      go: go,
      runSearch: runSearch,
      theme: applyTheme,
      fs: applyFs
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
