/* ============================================================================
 * anno.js —— 注释交互层（术语标注 / 术语弹卡 / 脚注卡片 / 小知识 tips / 术语表）
 * ----------------------------------------------------------------------------
 * 零依赖、纯原生 JS。挂载点：
 *   window.ANNOTATIONS = {terms:[{id,term,kind,short,long,aliases}], tips:[…]}  (可选)
 *   window.BOOK.pages[id].notes = [{n:"41", text:"…"}]                          (脚注)
 * 只读正文 #content，不改动 app.js / learn.js 的任何逻辑；数据缺失时全程优雅降级。
 * 调试出口：window.__anno
 * ==========================================================================*/
(function () {
  'use strict';

  var VERSION = 'anno/1.0';

  /* ------------------------------------------------------------------ 常量 */

  var TERM_KIND_LABEL = {
    term: '术语', person: '人物', place: '地名', book: '典籍',
    quran: '古兰经', event: '事件', grammar: '语法'
  };
  var TERM_KIND_ORDER = ['term', 'person', 'place', 'book', 'quran', 'event', 'grammar'];

  var TIP_KIND_LABEL = {
    quran: '古兰经', islam: '宗教', language: '语言', history: '历史',
    geography: '地理', literature: '文学', reading: '读法'
  };

  var OTHER = 'other';
  var MIN_TERM_LEN = 2;          /* 单字术语不标，避免满页下划线 */
  var MAX_WRAP_PER_PAGE = 800;   /* 极端长页的保险丝 */
  var MAX_TERM_PER_PAGE = 12;    /* 同一术语在同一页最多标注 12 次，防止满页下划线 */
  var MOBILE_MAX = 600;          /* px，与 anno.css 的抽屉断点一致 */
  var SCAN_DEBOUNCE = 160;       /* ms，MutationObserver 合并窗口 */
  var HOVER_DELAY = 260;         /* ms，悬停短提示延迟 */

  /* 扫描时必须跳过的容器（标签名 / class / 属性） */
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, H1: 1, H2: 1, H3: 1, H4: 1,
    INPUT: 1, TEXTAREA: 1, SELECT: 1, BUTTON: 1, PRE: 1, CODE: 1, SVG: 1, CANVAS: 1 };
  var SKIP_CLASS = {
    'ar': 1, 'anno': 1, 'fn-ref': 1, 'page-head': 1, 'page-meta': 1,
    'w-ar': 1, 'anno-tip': 1, 'anno-card': 1, 'anno-hover': 1, 'print-notes': 1,
    'interactive-note': 1, 'no-anno': 1, 'hit': 1, 'lp': 1, 'lp-word-pop': 1,
    'at-body': 1, 'at-head': 1, 'ac-long': 1, 'ac-short': 1,
    'bk-t': 0, 'qref': 0, 'year': 0, 'bullet': 0, 'tip-para': 0
  };
  var SKIP_ATTRS = ['data-acw', 'data-no-anno'];

  /* ---------------------------------------------------------------- 工具层 */

  var doc = document;
  var html = doc.documentElement;

  function byId(id) { return doc.getElementById(id); }
  function qs(sel, root) { return (root || doc).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }

  function mk(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = String(text);
    return n;
  }

  function normWs(s) {
    return String(s == null ? '' : s).replace(/[\s\u00a0\u3000]+/g, ' ').trim();
  }

  function digits(s) {
    var m = String(s == null ? '' : s).match(/\d+/g);
    return m ? m.join('') : '';
  }

  function now() {
    return (window.performance && window.performance.now) ? window.performance.now() : Date.now();
  }

  function isMobile() {
    return (window.innerWidth || html.clientWidth || 0) <= MOBILE_MAX;
  }

  function canHover() {
    try {
      return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    } catch (e) { return true; }
  }

  function stop(e) {
    if (!e) return;
    if (e.stopPropagation) e.stopPropagation();
  }

  /* ------------------------------------------------------------ 站点契约层 */

  /* 当前页 id：优先 app.js 的 state，其次 hash，最后 DOM data-page */
  function currentPageId() {
    try {
      if (window.__acb && window.__acb.state && window.__acb.state.pageId) {
        return String(window.__acb.state.pageId);
      }
    } catch (e) { /* noop */ }
    var m = /^#\/?([^?&#]+)/.exec(location.hash || '');
    if (m) {
      var id = m[1];
      try { id = decodeURIComponent(id); } catch (e2) { /* noop */ }
      if (id && id !== '/') return id;
    }
    var c = byId('content') || byId('paper');
    if (c) {
      var d = c.getAttribute('data-page');
      if (d) return d;
    }
    return '';
  }

  function bookPages() {
    var B = window.BOOK;
    return (B && B.pages) ? B.pages : null;
  }

  function pageOf(id) {
    var pages = bookPages();
    if (!pages || !id) return null;
    return pages[id] || null;
  }

  function pageOrder() {
    var B = window.BOOK;
    if (B && B.order && B.order.length) return B.order;
    var pages = bookPages();
    return pages ? Object.keys(pages) : [];
  }

  function pageLabel(id) {
    var p = pageOf(id);
    return p && p.title ? p.title : id;
  }

  function annData() {
    var A = window.ANNOTATIONS;
    if (!A || typeof A !== 'object') return null;
    return A;
  }

  /* -------------------------------------------------------------- 术语索引 */

  var termIndex = null;   /* {byId, entries, buckets, maxLen, list, total} */

  /* 当前页的「同术语已标注次数」，跨多次扫描保持——否则重复扫描会把
     封顶后跳过的次生命中再包一轮，上限形同虚设。换页/正文重绘时重置。 */
  var termCounts = Object.create(null);
  var termCountsPage = null;

  function buildTermIndex() {
    if (termIndex) return termIndex;
    var A = annData();
    var terms = (A && Array.isArray(A.terms)) ? A.terms : [];
    var byId = Object.create(null);
    var list = [];
    var entries = [];
    var buckets = Object.create(null);
    var i, k;

    for (i = 0; i < terms.length; i++) {
      var raw = terms[i];
      if (!raw || typeof raw !== 'object') continue;
      var term = normWs(raw.term);
      if (!term) continue;
      var id = String(raw.id || ('t' + (i + 1)));
      if (byId[id]) continue;              /* 同 id 只收一条，保证稳定 */
      var rec = {
        id: id,
        term: term,
        kind: String(raw.kind || 'term'),
        short: normWs(raw.short),
        long: normWs(raw.long),
        aliases: []
      };
      if (Array.isArray(raw.aliases)) {
        for (k = 0; k < raw.aliases.length; k++) {
          var al = normWs(raw.aliases[k]);
          if (al && al !== term && rec.aliases.indexOf(al) < 0) rec.aliases.push(al);
        }
      }
      byId[id] = rec;
      list.push(rec);

      /* 术语本体 + 别名都参与匹配，最长优先 */
      var forms = [term].concat(rec.aliases);
      var seenForm = Object.create(null);
      for (k = 0; k < forms.length; k++) {
        var form = forms[k];
        if (!form || seenForm[form]) continue;
        seenForm[form] = 1;
        if (form.length < MIN_TERM_LEN) continue;
        entries.push({
          form: form,
          len: form.length,
          first: form.charAt(0),
          id: id,
          rec: rec
        });
      }
    }

    entries.sort(function (a, b) {
      if (b.len !== a.len) return b.len - a.len;
      return a.form < b.form ? -1 : (a.form > b.form ? 1 : 0);
    });
    for (i = 0; i < entries.length; i++) {
      var e = entries[i];
      (buckets[e.first] || (buckets[e.first] = [])).push(e);
    }

    termIndex = {
      byId: byId,
      list: list,
      entries: entries,
      buckets: buckets,
      total: list.length
    };
    return termIndex;
  }

  function termOf(id) {
    var idx = buildTermIndex();
    return (idx && idx.byId[id]) || null;
  }

  /* 在一段纯文本里做「最左最长」匹配，返回 [{start,end,entry}] */
  var startsWith = (function () {
    if (String.prototype.startsWith) {
      return function (s, sub, pos) { return s.startsWith(sub, pos); };
    }
    return function (s, sub, pos) { return s.indexOf(sub, pos) === pos; };
  })();

  function findMatches(text) {
    var idx = termIndex;
    if (!idx || !idx.entries.length || !text) return null;
    var out = null;
    var i = 0;
    var n = text.length;
    while (i < n) {
      var bucket = idx.buckets[text.charAt(i)];
      if (bucket) {
        var hit = null;
        for (var k = 0; k < bucket.length; k++) {
          var e = bucket[k];
          if (i + e.len <= n && startsWith(text, e.form, i)) { hit = e; break; }
        }
        if (hit) {
          (out || (out = [])).push({ start: i, end: i + hit.len, entry: hit });
          i += hit.len;
          continue;
        }
      }
      i++;
    }
    return out;
  }

  /* ------------------------------------------------------ 正文扫描（TreeWalker） */

  var scanState = {
    lastPage: '',
    lastMs: 0,
    scans: 0,
    wrapped: 0,
    tips: 0
  };

  function shouldSkip(node) {
    var p = node.parentNode;
    var content = scanState.content;
    while (p && p !== content) {
      if (p.nodeType === 1) {
        if (SKIP_TAGS[p.tagName]) return true;
        var cl = p.classList;
        if (cl && cl.length) {
          for (var i = 0; i < cl.length; i++) {
            if (SKIP_CLASS[cl[i]]) return true;
          }
        }
        for (var a = 0; a < SKIP_ATTRS.length; a++) {
          if (p.hasAttribute(SKIP_ATTRS[a])) return true;
        }
      }
      p = p.parentNode;
    }
    return false;
  }

  function wrapTextNode(node, budget, counts) {
    var text = node.nodeValue;
    var matches = findMatches(text);
    if (!matches || !matches.length) return 0;
    var frag = doc.createDocumentFragment();
    var pos = 0;
    var made = 0;
    for (var i = 0; i < matches.length && made < budget; i++) {
      var m = matches[i];
      var seen = counts[m.entry.id] || 0;
      /* 同页同术语封顶：这一处不包，字符留给下一个命中一起输出（pos 不前移） */
      if (seen >= MAX_TERM_PER_PAGE) continue;
      if (m.start > pos) frag.appendChild(doc.createTextNode(text.slice(pos, m.start)));
      var span = mk('span', 'anno', text.slice(m.start, m.end));
      span.setAttribute('data-anno', m.entry.id);
      span.setAttribute('role', 'button');
      span.setAttribute('tabindex', '0');
      var label = m.entry.rec.term;
      if (m.entry.form !== label) label = m.entry.rec.term + '（' + m.entry.form + '）';
      span.setAttribute('aria-label', label + '，查看注解');
      frag.appendChild(span);
      pos = m.end;
      counts[m.entry.id] = seen + 1;
      made++;
    }
    if (!made) return 0;
    if (pos < text.length) frag.appendChild(doc.createTextNode(text.slice(pos)));
    node.parentNode.replaceChild(frag, node);
    return made;
  }

  function wrapTerms(content) {
    var idx = termIndex;
    if (!idx || !idx.entries.length) return 0;
    var walker = doc.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var s = node.nodeValue;
        if (!s || s.length < MIN_TERM_LEN) return NodeFilter.FILTER_REJECT;
        if (!s.trim()) return NodeFilter.FILTER_REJECT;
        return shouldSkip(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    }, false);

    var nodes = [];
    var n;
    while ((n = walker.nextNode())) nodes.push(n);

    var made = 0;
    /* 页内计数：换页或正文整体重绘（该页还没有任何 .anno）时清零重来 */
    var pid = currentPageId() || '';
    if (pid !== termCountsPage || !content.querySelector('.anno')) {
      termCounts = Object.create(null);
      termCountsPage = pid;
    }
    var counts = termCounts;
    for (var i = 0; i < nodes.length && made < MAX_WRAP_PER_PAGE; i++) {
      made += wrapTextNode(nodes[i], MAX_WRAP_PER_PAGE - made, counts);
    }
    return made;
  }

  /* ------------------------------------------------------------- 小知识 tips */

  function allTips() {
    var A = annData();
    return (A && Array.isArray(A.tips)) ? A.tips : [];
  }

  function buildTip(tip, variant) {
    var wrap = mk('aside', 'anno-tip ' + variant);
    var id = String(tip.id || '');
    wrap.setAttribute('data-tip', id);

    var bodyId = 'anno-tip-' + (id || Math.floor(Math.random() * 1e6).toString(36)) + '-body';
    var head = mk('button', 'at-head');
    head.type = 'button';
    head.setAttribute('aria-expanded', 'false');
    head.setAttribute('aria-controls', bodyId);

    var ico = mk('span', 'at-ico', '\uD83D\uDCA1');
    ico.setAttribute('aria-hidden', 'true');
    var label = mk('span', 'at-label', '小知识');
    var title = mk('span', 'at-title', tip.title || '补充说明');
    var kind = String(tip.kind || '');
    var badge = mk('span', 'anno-badge k-' + (TIP_KIND_LABEL[kind] ? kind : OTHER),
      TIP_KIND_LABEL[kind] || '知识');
    var chev = mk('span', 'at-chev', '\u25BE');
    chev.setAttribute('aria-hidden', 'true');

    head.appendChild(ico);
    head.appendChild(label);
    head.appendChild(title);
    head.appendChild(badge);
    head.appendChild(chev);

    var body = mk('div', 'at-body', tip.body || '');
    body.id = bodyId;
    body.hidden = true;

    head.addEventListener('click', function () {
      var open = head.getAttribute('aria-expanded') === 'true';
      head.setAttribute('aria-expanded', open ? 'false' : 'true');
      body.hidden = open;
    });

    wrap.appendChild(head);
    wrap.appendChild(body);
    return wrap;
  }

  /* 按 after 前缀找落点段落；找不到返回 null（由调用方放文末） */
  function findTipAnchor(content, after) {
    var key = normWs(after);
    if (!key) return null;
    var probe = key.slice(0, 12);
    var cands = content.querySelectorAll('p, li, blockquote, dd, div.bullet, div.tip-para');
    var fallback = null;
    for (var i = 0; i < cands.length; i++) {
      var c = cands[i];
      if (c.closest('.page-head, .anno-tip, .interactive-note, .print-notes')) continue;
      var t = normWs(c.textContent);
      if (!t) continue;
      if (t.indexOf(key) === 0) return c;
      if (!fallback && probe && t.indexOf(probe) === 0) fallback = c;
    }
    return fallback;
  }

  function insertTips(pageId, content) {
    var tips = allTips();
    if (!tips.length || !pageId) return 0;
    var mine = [];
    for (var i = 0; i < tips.length; i++) {
      var t = tips[i];
      if (t && String(t.page || '') === pageId) mine.push(t);
    }
    if (!mine.length) return 0;

    var have = Object.create(null);
    qsa('.anno-tip[data-tip]', content).forEach(function (n) {
      have[n.getAttribute('data-tip')] = 1;
    });

    var made = 0;
    var lastAnchor = null;
    var lastEl = null;

    for (var j = 0; j < mine.length; j++) {
      var tip = mine[j];
      var tid = String(tip.id || ('k' + j));
      if (have[tid]) continue;
      var variant = (j === 0) ? 'at-v1' : 'at-v2';
      var node = buildTip(tip, variant);

      var anchor = findTipAnchor(content, tip.after);
      if (anchor && anchor.parentNode) {
        var ref = (lastAnchor && lastAnchor === anchor && lastEl && lastEl.parentNode)
          ? lastEl : anchor;
        ref.insertAdjacentElement('afterend', node);
      } else {
        content.appendChild(node);
      }
      have[tid] = 1;
      lastAnchor = anchor;
      lastEl = node;
      made++;
    }
    return made;
  }

  /* ------------------------------------------------------------- 脚注查找 */

  function pickNote(notes, want) {
    if (!notes || !notes.length) return null;
    var i, n, ns;
    if (want) {
      for (i = 0; i < notes.length; i++) {
        n = notes[i];
        if (n && digits(n.n) === want) return n;
      }
      return null;
    }
    for (i = 0; i < notes.length; i++) {
      n = notes[i];
      if (n && !digits(n.n)) return n;
    }
    return null;
  }

  function findNote(num, pageId) {
    var want = digits(num);
    var page = pageOf(pageId);
    var hit = pickNote(page && page.notes, want);
    if (hit) return { note: hit, pageId: pageId, cross: false };

    var pages = bookPages();
    if (!pages) return null;
    var ids = pageOrder();
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      if (id === pageId) continue;
      var p = pages[id];
      var h = pickNote(p && p.notes, want);
      if (h) return { note: h, pageId: id, cross: true };
    }
    return null;
  }

  /* chip 上取注号：data-fn → data-fn-n → 文本数字 → href=#fn41 */
  function fnNum(anchor) {
    var raw = anchor.getAttribute('data-fn');
    if (raw == null) raw = anchor.getAttribute('data-fn-n');
    var d = digits(raw);
    if (d) return d;
    var href = anchor.getAttribute('href') || '';
    if (href) {
      var hm = /#?fn-?(\d+)/i.exec(href);
      if (hm) return hm[1];
    }
    var m = /\d+/.exec(anchor.textContent || '');
    return m ? m[0] : '';
  }

  /* ---------------------------------------------------------------- 弹卡 UI */

  var ui = {
    card: null, name: null, badge: null, short: null, note: null, hint: null,
    foot: null, more: null, alias: null, long: null, close: null,
    scrim: null, hover: null
  };
  var cardState = { open: false, anchor: null, termId: '', expanded: false };
  var hoverState = { timer: 0, anchor: null, open: false };

  function buildCard() {
    if (ui.card) return;
    var card = mk('div', 'anno-card');
    card.hidden = true;
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'false');
    card.setAttribute('aria-labelledby', 'annoCardName');

    var top = mk('div', 'ac-top');
    var name = mk('h3', 'ac-name');
    name.id = 'annoCardName';
    var badge = mk('span', 'anno-badge');
    var close = mk('button', 'ac-x', '\u2715');
    close.type = 'button';
    close.setAttribute('aria-label', '关闭（Esc）');
    top.appendChild(name);
    top.appendChild(badge);
    top.appendChild(close);

    var short = mk('p', 'ac-short');
    short.hidden = true;
    var note = mk('p', 'ac-note');
    note.hidden = true;
    var hint = mk('p', 'ac-hint');
    hint.hidden = true;

    var foot = mk('div', 'ac-foot');
    foot.hidden = true;
    var more = mk('button', 'ac-more', '展开');
    more.type = 'button';
    more.setAttribute('aria-expanded', 'false');
    var alias = mk('span', 'ac-alias', '');
    foot.appendChild(more);
    foot.appendChild(alias);

    var long = mk('div', 'ac-long');
    long.hidden = true;

    card.appendChild(top);
    card.appendChild(short);
    card.appendChild(note);
    card.appendChild(hint);
    card.appendChild(foot);
    card.appendChild(long);

    var scrim = mk('div', 'anno-scrim');
    scrim.hidden = true;

    doc.body.appendChild(scrim);
    doc.body.appendChild(card);

    close.addEventListener('click', function () { closeCard(); });
    more.addEventListener('click', function () {
      var open = more.getAttribute('aria-expanded') === 'true';
      more.setAttribute('aria-expanded', open ? 'false' : 'true');
      more.textContent = open ? '展开' : '收起';
      long.hidden = open;
      cardState.expanded = !open;
      if (!open) positionCard();
    });
    scrim.addEventListener('click', function () { closeCard(); });

    ui.card = card;
    ui.name = name;
    ui.badge = badge;
    ui.short = short;
    ui.note = note;
    ui.hint = hint;
    ui.foot = foot;
    ui.more = more;
    ui.alias = alias;
    ui.long = long;
    ui.close = close;
    ui.scrim = scrim;
  }

  function showBadge(kind, label) {
    var cls = 'anno-badge k-' + kind;
    ui.badge.className = cls;
    ui.badge.textContent = label;
  }

  function resetCardBody() {
    cardState.expanded = false;
    ui.long.hidden = true;
    ui.long.textContent = '';
    ui.more.setAttribute('aria-expanded', 'false');
    ui.more.textContent = '展开';
    ui.more.hidden = true;
    ui.alias.textContent = '';
    ui.foot.hidden = true;
    ui.note.hidden = true;
    ui.note.textContent = '';
    ui.hint.hidden = true;
    ui.hint.textContent = '';
    ui.short.hidden = true;
    ui.short.textContent = '';
    ui.short.className = 'ac-short';
  }

  function positionCard() {
    var card = ui.card;
    var anchor = cardState.anchor;
    if (!card || !anchor || !anchor.isConnected) return;
    var mobile = isMobile();
    card.classList.toggle('sheet', mobile);
    ui.scrim.hidden = !mobile;
    if (mobile) return;

    var r = anchor.getBoundingClientRect();
    var vw = html.clientWidth || window.innerWidth;
    var vh = window.innerHeight || html.clientHeight;
    var cw = card.offsetWidth || 344;
    var ch = card.offsetHeight || 120;
    var pad = 8;

    var left = r.left + (r.width / 2) - (cw / 2);
    if (left < pad) left = pad;
    if (left + cw > vw - pad) left = Math.max(pad, vw - cw - pad);

    var top = r.bottom + 8;
    if (top + ch > vh - pad) {
      var above = r.top - ch - 8;
      top = (above >= pad) ? above : Math.max(pad, vh - ch - pad);
    }
    card.style.left = Math.round(left) + 'px';
    card.style.top = Math.round(top) + 'px';
  }

  function openCard(anchor) {
    buildCard();
    hideHover();
    var prev = doc.querySelector('.anno.anno-on');
    if (prev) prev.classList.remove('anno-on');
    cardState.anchor = anchor;
    cardState.open = true;
    anchor.classList.add('anno-on');
    ui.card.hidden = false;
    ui.card.style.visibility = 'hidden';
    positionCard();
    ui.card.style.visibility = '';
  }

  function closeCard() {
    if (ui.card) ui.card.hidden = true;
    if (ui.scrim) ui.scrim.hidden = true;
    if (cardState.anchor) {
      cardState.anchor.classList.remove('anno-on');
      cardState.anchor = null;
    }
    cardState.open = false;
    cardState.termId = '';
    hideHover();
  }

  function openTermCard(anchor) {
    var id = anchor.getAttribute('data-anno') || '';
    var rec = termOf(id);
    if (!rec) return;
    buildCard();
    resetCardBody();
    cardState.termId = id;

    ui.name.textContent = rec.term;
    var kind = TERM_KIND_LABEL[rec.kind] ? rec.kind : OTHER;
    showBadge(kind, TERM_KIND_LABEL[rec.kind] || '术语');

    if (rec.short) {
      ui.short.hidden = false;
      ui.short.textContent = rec.short;
    }
    if (rec.long) {
      ui.long.textContent = rec.long;
      ui.foot.hidden = false;
      ui.more.hidden = false;
    } else {
      ui.more.hidden = true;
      ui.foot.hidden = false;
    }
    if (rec.aliases.length) {
      ui.alias.textContent = '又称：' + rec.aliases.join('、');
    } else {
      ui.alias.textContent = '';
    }
    openCard(anchor);
  }

  function openNoteCard(anchor) {
    var num = fnNum(anchor);
    var pageId = currentPageId();
    var found = findNote(num, pageId);
    buildCard();
    resetCardBody();

    var note = found && found.note;
    var text = note ? String(note.text == null ? '' : note.text) : '';
    var label = note && digits(note.n) ? ('注 ' + digits(note.n)) : (num ? ('注 ' + num) : '注释');

    ui.name.textContent = label;
    showBadge('note', '脚注');

    if (note && text.trim()) {
      ui.note.hidden = false;
      ui.note.textContent = text;
      if (found.cross) {
        ui.hint.hidden = false;
        ui.hint.textContent = '该注文来自「' + pageLabel(found.pageId) + '」页。';
      }
    } else {
      ui.note.hidden = false;
      ui.note.textContent = '注释暂缺';
      ui.note.className = 'ac-note';
      ui.hint.hidden = false;
      ui.hint.textContent = '本页与全书的注释数据里都没有找到这条注文（数据可能仍在补全中）。';
      /* 兼容早期页底 p.fn / sup 的注释块 */
      var legacy = legacyNoteText(num);
      if (legacy) {
        ui.note.textContent = legacy;
        ui.hint.textContent = '该注文取自页内旧式脚注。';
      }
    }
    openCard(anchor);
  }

  function legacyNoteText(num) {
    var content = byId('content');
    if (!content) return '';
    var d = digits(num);
    var nodes = content.querySelectorAll('.fn, .fn-body, sup.fnref, .fnref');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var id = n.id || '';
      var owner = n.closest ? n.closest('[data-fn]') : null;
      if (d && (id === 'fn' + d || (owner && digits(owner.getAttribute('data-fn')) === d))) {
        var t = normWs(n.textContent);
        return t.length > 30 ? t : '';
      }
    }
    return '';
  }

  /* --------------------------------------------------------- 悬停短提示 */

  function buildHover() {
    if (ui.hover) return;
    var h = mk('div', 'anno-hover');
    h.hidden = true;
    doc.body.appendChild(h);
    ui.hover = h;
  }

  function hideHover() {
    clearTimeout(hoverState.timer);
    hoverState.timer = 0;
    hoverState.anchor = null;
    hoverState.open = false;
    if (ui.hover) ui.hover.hidden = true;
  }

  function showHover(anchor) {
    if (!canHover() || cardState.open) return;
    var rec = termOf(anchor.getAttribute('data-anno') || '');
    if (!rec) return;
    buildHover();
    var h = ui.hover;
    h.textContent = '';
    var strong = mk('strong', '', rec.term);
    h.appendChild(strong);
    if (rec.short) {
      h.appendChild(doc.createTextNode(' ' + rec.short));
    }
    h.hidden = false;
    var r = anchor.getBoundingClientRect();
    var vw = html.clientWidth || window.innerWidth;
    var vh = window.innerHeight || html.clientHeight;
    var w = h.offsetWidth;
    var ht = h.offsetHeight;
    var left = r.left + (r.width / 2) - (w / 2);
    if (left < 8) left = 8;
    if (left + w > vw - 8) left = Math.max(8, vw - w - 8);
    var top = r.bottom + 7;
    if (top + ht > vh - 8) top = Math.max(8, r.top - ht - 7);
    h.style.left = Math.round(left) + 'px';
    h.style.top = Math.round(top) + 'px';
    hoverState.open = true;
    hoverState.anchor = anchor;
  }

  /* ------------------------------------------------------------ 事件绑定 */

  function onContentClick(e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var fn = t.closest('.fn-ref, .fnref, sup.fnref, .fm-ref');
    if (fn) {
      e.preventDefault();
      openNoteCard(fn);
      return;
    }
    var a = t.closest('.anno');
    if (a) {
      e.preventDefault();
      openTermCard(a);
      return;
    }
    if (cardState.open) {
      var inCard = ui.card && ui.card.contains(t);
      if (!inCard) closeCard();
    }
  }

  function onContentKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    var t = e.target;
    if (!t || !t.closest) return;
    var fn = t.closest('.fn-ref, .fnref, sup.fnref, .fm-ref');
    if (fn) {
      e.preventDefault();
      openNoteCard(fn);
      return;
    }
    var a = t.closest('.anno');
    if (a) {
      e.preventDefault();
      openTermCard(a);
    }
  }

  function onContentOver(e) {
    if (!canHover()) return;
    var t = e.target;
    if (!t || !t.closest) return;
    var a = t.closest('.anno');
    if (!a) return;
    if (e.relatedTarget && a.contains(e.relatedTarget)) return;
    clearTimeout(hoverState.timer);
    hoverState.timer = setTimeout(function () {
      hoverState.timer = 0;
      showHover(a);
    }, HOVER_DELAY);
  }

  function onContentOut(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var a = t.closest('.anno');
    if (!a) return;
    if (e.relatedTarget && a.contains(e.relatedTarget)) return;
    hideHover();
  }

  function onDocKeydownCapture(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (cardState.open) {
        e.preventDefault();
        closeCard();
        stop(e);
        return;
      }
      if (panelState.open) {
        e.preventDefault();
        closePanel();
        stop(e);
        return;
      }
      hideHover();
      return;
    }
    if (panelState.open) {
      /* 面板打开时接管翻页键，避免翻页打断查阅；输入框内不拦 */
      var tag = (e.target && e.target.tagName) || '';
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          stop(e);
        }
        if (e.key === '/') {
          e.preventDefault();
          var inp = qs('#annoSearch');
          if (inp) inp.focus();
          stop(e);
        }
      }
    }
  }

  function onDocPointerDown(e) {
    if (!cardState.open) {
      if (!panelState.open && hoverState.open && ui.hover && !ui.hover.contains(e.target)) hideHover();
      return;
    }
    var t = e.target;
    if (!t) return;
    if (ui.card && ui.card.contains(t)) return;
    if (t.closest && (t.closest('.anno') || t.closest('.fn-ref') || t.closest('.fnref'))) return;
    closeCard();
  }

  function onViewportChange() {
    hideHover();
    if (cardState.open) positionCard();
  }

  function onRoute() {
    hideHover();
    closeCard();
    clearTimeout(scanState.timer);
    scanState.timer = setTimeout(function () {
      scanNow('route');
    }, 0);
  }

  /* --------------------------------------------------------------- 扫描调度 */

  function scanNow(reason) {
    var content = byId('content');
    if (!content || !content.firstChild) return;

    scanState.content = content;
    buildTermIndex();

    var t0 = now();
    var pageId = currentPageId();
    var wrapped = 0;
    var tips = 0;

    try { wrapped = wrapTerms(content); } catch (err) { warn(err); }
    try { tips = insertTips(pageId, content); } catch (err) { warn(err); }

    var ms = now() - t0;
    scanState.lastMs = ms;
    scanState.lastPage = pageId;
    scanState.scans++;
    scanState.wrapped += wrapped;
    scanState.tips += tips;

    if (ms > 200) {
      warn('scan slow: ' + ms.toFixed(1) + 'ms page=' + pageId);
    }
  }

  function scheduleScan() {
    if (scanState.timer) return;
    scanState.timer = setTimeout(function () {
      scanState.timer = 0;
      if (doc.hidden) return;
      scanNow('mutation');
    }, SCAN_DEBOUNCE);
  }

  function startObserver() {
    if (!window.MutationObserver) return;
    var root = byId('paper') || byId('content');
    if (!root) return;
    var mo = new MutationObserver(function () {
      scheduleScan();
    });
    mo.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['data-page']
    });
    scanState.mo = mo;
  }

  /* --------------------------------------------------------------- 打印注释 */

  function buildPrintNotes() {
    removePrintNotes();
    var content = byId('content');
    var page = pageOf(currentPageId());
    if (!content || !page || !page.notes || !page.notes.length) return;

    var box = mk('div', 'print-notes no-anno');
    box.id = 'annoPrintNotes';
    box.appendChild(mk('p', 'pn-title', '注释'));
    var list = mk('ol', 'pn-list');

    for (var i = 0; i < page.notes.length; i++) {
      var n = page.notes[i];
      if (!n) continue;
      var text = String(n.text == null ? '' : n.text).trim();
      if (!text) continue;
      var li = mk('li', 'pn-item');
      var num = digits(n.n);
      if (num) {
        var sn = mk('span', 'pn-n', num);
        li.appendChild(sn);
      }
      li.appendChild(mk('span', 'pn-t', text));
      list.appendChild(li);
    }
    if (!list.childNodes.length) return;
    box.appendChild(list);
    content.appendChild(box);
  }

  function removePrintNotes() {
    var old = byId('annoPrintNotes');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var stale = qsa('.print-notes');
    for (var i = 0; i < stale.length; i++) {
      if (stale[i] !== old && stale[i].parentNode) stale[i].parentNode.removeChild(stale[i]);
    }
  }

  /* ----------------------------------------------------------- 术语表面板 */

  var panelState = { open: false, built: false, total: 0, visible: 0, prevFocus: null };
  var panel = null;

  function buildPanel() {
    if (panel) return panel;
    var p = mk('div', '');
    p.id = 'annoPanel';
    p.hidden = true;
    p.setAttribute('role', 'dialog');
    p.setAttribute('aria-modal', 'true');
    p.setAttribute('aria-labelledby', 'annoPanelTitle');
    p.innerHTML =
      '<div class="ap-inner">' +
        '<div class="ap-head">' +
          '<div class="ap-hd-text">' +
            '<h2 class="ap-title" id="annoPanelTitle">术语注解</h2>' +
            '<p class="ap-sub" id="annoPanelSub"></p>' +
          '</div>' +
          '<button type="button" class="ap-close" id="annoPanelClose" aria-label="关闭术语表（Esc）">\u2715</button>' +
        '</div>' +
        '<div class="ap-toolbar">' +
          '<label class="ap-search">' +
            '<svg class="ap-sico" viewBox="0 0 16 16" aria-hidden="true" focusable="false">' +
              '<circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" stroke-width="1.5"></circle>' +
              '<path d="M10.4 10.4L14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>' +
            '</svg>' +
            '<input type="search" id="annoSearch" placeholder="搜索术语、别名或释义…" autocomplete="off" aria-label="搜索术语">' +
            '<button type="button" class="ap-clear" id="annoClear" hidden aria-label="清空搜索">\u2715</button>' +
          '</label>' +
          '<span class="ap-count" id="annoCount"></span>' +
        '</div>' +
        '<div class="ap-body" id="annoBody">' +
          '<div class="ap-empty" id="annoEmpty" hidden>' +
            '<span class="ap-empty-ico" aria-hidden="true">\u29C9</span>' +
            '<h3>术语数据尚未载入</h3>' +
            '<p>页面没有找到 <code>window.ANNOTATIONS</code>，术语表暂时为空。</p>' +
            '<p>数据文件 <code>content/annotations.js</code> 准备好后刷新即可自动生效。</p>' +
          '</div>' +
          '<div class="ap-nohit" id="annoNohit" hidden>没有匹配的术语，换个关键词试试。</div>' +
        '</div>' +
      '</div>';

    doc.body.appendChild(p);

    var closeBtn = qs('#annoPanelClose', p);
    closeBtn.addEventListener('click', closePanel);

    var input = qs('#annoSearch', p);
    var clearBtn = qs('#annoClear', p);
    input.addEventListener('input', function () {
      clearBtn.hidden = !input.value;
      applyFilter(input.value);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var first = qs('.ap-item-wrap:not([hidden]) .ap-item', p);
        if (first) { e.preventDefault(); first.click(); }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (input.value) { input.value = ''; clearBtn.hidden = true; applyFilter(''); }
        else closePanel();
        stop(e);
      }
    });
    clearBtn.addEventListener('click', function () {
      input.value = '';
      clearBtn.hidden = true;
      applyFilter('');
      input.focus();
    });

    p.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closePanel(); }
    });

    panel = p;
    return p;
  }

  function fillPanel() {
    var p = panel;
    if (!p || panelState.built) return;
    var body = qs('#annoBody', p);
    var idx = buildTermIndex();
    var list = (idx && idx.list) || [];
    var sub = qs('#annoPanelSub', p);
    var count = qs('#annoCount', p);
    var empty = qs('#annoEmpty', p);
    var nohit = qs('#annoNohit', p);

    if (!list.length) {
      empty.hidden = false;
      if (sub) sub.textContent = '暂无术语数据';
      if (count) count.textContent = '';
      panelState.built = true;
      panelState.total = 0;
      return;
    }
    empty.hidden = true;
    nohit.hidden = true;

    /* 按 kind 分组（固定顺序，未知 kind 归入 other） */
    var groups = Object.create(null);
    for (var i = 0; i < list.length; i++) {
      var rec = list[i];
      var kind = TERM_KIND_LABEL[rec.kind] ? rec.kind : OTHER;
      (groups[kind] || (groups[kind] = [])).push(rec);
    }
    var order = TERM_KIND_ORDER.filter(function (k) { return groups[k] && groups[k].length; });
    if (groups[OTHER] && groups[OTHER].length) order.push(OTHER);

    var frag = doc.createDocumentFragment();
    var total = 0;

    for (var g = 0; g < order.length; g++) {
      var k = order[g];
      var items = groups[k];
      total += items.length;

      var sec = mk('section', 'ap-group');
      sec.setAttribute('data-kind', k);
      var head = mk('h3', 'ap-ghead');
      var badge = mk('span', 'anno-badge k-' + k, TERM_KIND_LABEL[k] || '其它');
      var gc = mk('span', 'ap-gcount', items.length + ' 条');
      head.appendChild(badge);
      head.appendChild(gc);
      sec.appendChild(head);

      var ul = mk('ul', 'ap-list');
      for (var j = 0; j < items.length; j++) {
        var it = items[j];
        var wrap = mk('li', 'ap-item-wrap');
        var searchKey = normWs([it.term, it.short, it.long, it.aliases.join(' ')].join(' ')).toLowerCase();
        wrap.setAttribute('data-key', searchKey);

        var btn = mk('button', 'ap-item');
        btn.type = 'button';
        btn.setAttribute('aria-expanded', 'false');
        var termEl = mk('span', 'ap-term', it.term);
        var shortEl = mk('span', 'ap-short', it.short || '');
        var arrow = mk('span', 'ap-arrow', '\u25BE');
        arrow.setAttribute('aria-hidden', 'true');
        btn.appendChild(termEl);
        btn.appendChild(shortEl);
        btn.appendChild(arrow);

        var detail = mk('div', 'ap-detail');
        detail.hidden = true;
        var longEl = mk('p', 'ap-long', it.long || '暂无详细释义。');
        detail.appendChild(longEl);
        if (it.aliases.length) {
          detail.appendChild(mk('p', 'ap-alias', '又称：' + it.aliases.join('、')));
        }

        (function (wrapEl, btnEl, detailEl, arrowEl) {
          btnEl.addEventListener('click', function () {
            var open = btnEl.getAttribute('aria-expanded') === 'true';
            /* 单开手风琴 */
            qsa('.ap-item[aria-expanded="true"]', body).forEach(function (o) {
              o.setAttribute('aria-expanded', 'false');
              var d = o.parentNode.querySelector('.ap-detail');
              if (d) d.hidden = true;
              var ar = o.querySelector('.ap-arrow');
              if (ar) ar.textContent = '\u25BE';
            });
            btnEl.setAttribute('aria-expanded', open ? 'false' : 'true');
            detailEl.hidden = open;
            arrowEl.textContent = open ? '\u25BE' : '\u25B4';
          });
        })(wrap, btn, detail, arrow);

        wrap.appendChild(btn);
        wrap.appendChild(detail);
        ul.appendChild(wrap);
      }
      sec.appendChild(ul);
      frag.appendChild(sec);
    }

    body.appendChild(frag);
    panelState.built = true;
    panelState.total = total;
    if (sub) sub.textContent = total + ' 条术语 · ' + allTips().length + ' 条小知识 · 点击查看释义';
    if (count) count.textContent = '共 ' + total + ' 条';
    if (nohit) nohit.hidden = true;
  }

  function applyFilter(raw) {
    if (!panel) return;
    var body = qs('#annoBody', panel);
    var q = normWs(raw).toLowerCase();
    var wraps = qsa('.ap-item-wrap', body);
    var visible = 0;
    for (var i = 0; i < wraps.length; i++) {
      var w = wraps[i];
      var ok = !q || (w.getAttribute('data-key') || '').indexOf(q) >= 0;
      w.hidden = !ok;
      if (ok) visible++;
    }
    var groups = qsa('.ap-group', body);
    for (var g = 0; g < groups.length; g++) {
      var sec = groups[g];
      var shown = 0;
      var items = sec.querySelectorAll('.ap-item-wrap');
      for (var j = 0; j < items.length; j++) if (!items[j].hidden) shown++;
      sec.hidden = shown === 0;
      var gc = sec.querySelector('.ap-gcount');
      if (gc) {
        var all = items.length;
        gc.textContent = (q && shown !== all) ? (shown + ' / ' + all + ' 条') : (all + ' 条');
      }
    }
    var nohit = qs('#annoNohit', panel);
    if (nohit) nohit.hidden = !(q && visible === 0 && panelState.total > 0);
    var count = qs('#annoCount', panel);
    if (count) count.textContent = q ? ('找到 ' + visible + ' 条') : ('共 ' + panelState.total + ' 条');
    panelState.visible = visible;
  }

  function openPanel() {
    buildPanel();
    fillPanel();
    hideHover();
    closeCard();
    panelState.prevFocus = doc.activeElement;
    panel.hidden = false;
    panelState.open = true;
    html.classList.add('anno-open');
    var btn = byId('btnAnno');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    var input = qs('#annoSearch', panel);
    setTimeout(function () {
      if (!panelState.open) return;
      if (input) { try { input.focus(); } catch (e) { /* noop */ } }
    }, 40);
  }

  function closePanel() {
    if (!panel) return;
    if (panelState.open) {
      var input = qs('#annoSearch', panel);
      if (input && input.value) {
        input.value = '';
        var clearBtn = qs('#annoClear', panel);
        if (clearBtn) clearBtn.hidden = true;
        applyFilter('');
      }
    }
    panel.hidden = true;
    panelState.open = false;
    html.classList.remove('anno-open');
    var btn = byId('btnAnno');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    var prev = panelState.prevFocus;
    panelState.prevFocus = null;
    if (prev && prev.focus && prev.isConnected) {
      try { prev.focus(); } catch (e) { /* noop */ }
    }
  }

  function togglePanel() {
    if (panelState.open) closePanel();
    else openPanel();
  }

  /* ------------------------------------------------------------- 顶栏入口 */

  function makeEntryButton() {
    if (byId('btnAnno')) return;
    var actions = qs('.top-actions');
    if (!actions) {
      actions = qs('.topbar');
      if (!actions) return;
    }
    var btn = mk('button', 'icon-btn');
    btn.id = 'btnAnno';
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('title', '术语注解');
    btn.setAttribute('aria-label', '打开术语注解与注释面板');
    btn.appendChild(mk('span', '', '\u24D8'));
    btn.firstChild.setAttribute('aria-hidden', 'true');

    var learn = byId('btnLearn');
    if (learn && learn.parentNode === actions) actions.insertBefore(btn, learn);
    else actions.insertBefore(btn, actions.firstChild);

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      togglePanel();
    });
  }

  /* ------------------------------------------------------------------ 启动 */

  var warned = Object.create(null);
  function warn(msg) {
    var key = String(msg);
    if (warned[key]) return;
    warned[key] = 1;
    try { console.warn('[anno] ' + key); } catch (e) { /* noop */ }
  }

  function bind() {
    var content = byId('content');
    if (content) {
      content.addEventListener('click', onContentClick);
      content.addEventListener('keydown', onContentKeydown);
      content.addEventListener('mouseover', onContentOver);
      content.addEventListener('mouseout', onContentOut);
      content.addEventListener('scroll', onViewportChange, { passive: true });
    }
    doc.addEventListener('keydown', onDocKeydownCapture, true);
    doc.addEventListener('pointerdown', onDocPointerDown, true);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, { passive: true });
    window.addEventListener('hashchange', onRoute);
    window.addEventListener('beforeprint', buildPrintNotes);
    window.addEventListener('afterprint', removePrintNotes);

    /* fn-ref 兜底补齐可聚焦语义（生成器已加，这里只补缺） */
    var fns = qsa('.fn-ref');
    for (var i = 0; i < fns.length; i++) {
      var f = fns[i];
      if (!f.hasAttribute('tabindex')) f.setAttribute('tabindex', '0');
      if (!f.hasAttribute('role')) f.setAttribute('role', 'button');
      if (!f.hasAttribute('title')) f.setAttribute('title', '查看注释');
    }
  }

  function boot() {
    makeEntryButton();
    bind();
    buildTermIndex();
    startObserver();
    /* 首屏内容通常已由 app.js 渲染；再排一次 rAF 兜住渲染时序差 */
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(function () { scanNow('boot'); });
    } else {
      setTimeout(function () { scanNow('boot'); }, 0);
    }
    setTimeout(function () { scanNow('late'); }, 450);
  }

  function attachDebug() {
    window.__anno = {
      version: VERSION,
      scan: function () { scanNow('manual'); return scanState.lastMs; },
      openTerm: function (id) {
        var a = doc.querySelector('.anno[data-anno="' + String(id) + '"]');
        if (a) { openTermCard(a); return true; }
        return false;
      },
      openNote: function (num) {
        var fns = qsa('.fn-ref');
        for (var i = 0; i < fns.length; i++) {
          if (digits(fns[i].getAttribute('data-fn')) === digits(num)) {
            openNoteCard(fns[i]);
            return true;
          }
        }
        return false;
      },
      openPanel: openPanel,
      closePanel: closePanel,
      closeAll: function () { closeCard(); closePanel(); hideHover(); },
      index: function () { return buildTermIndex(); },
      state: function () {
        return {
          lastScanMs: scanState.lastMs,
          scans: scanState.scans,
          wrapped: scanState.wrapped,
          tips: scanState.tips,
          page: currentPageId(),
          terms: (termIndex ? termIndex.total : 0),
          tipsData: allTips().length,
          cardOpen: cardState.open,
          panelOpen: panelState.open
        };
      }
    };
  }

  function start() {
    try {
      attachDebug();
      boot();
    } catch (err) {
      warn('boot failed: ' + (err && err.message ? err.message : err));
    }
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
