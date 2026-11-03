/* ==========================================================================
   book.js — reading shell: settings, search, lightbox, progress, navigation
   ========================================================================== */
(function () {
  "use strict";

  var BASE = location.pathname.indexOf("/ch/") !== -1 ? "../" : "";
  var PAGE = window.RUI_PAGE || { kind: "doc" };
  var root = document.documentElement;
  var STORE = "rui:";

  /* ---------------- storage ---------------- */
  function get(key, fallback) {
    try {
      var v = localStorage.getItem(STORE + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  }
  function set(key, value) {
    try { localStorage.setItem(STORE + key, JSON.stringify(value)); } catch (e) {}
  }
  function readSettings() {
    return Object.assign(
      { theme: "paper", font: "sans", size: 17, leading: 1.9, width: 700 },
      get("settings", {})
    );
  }

  /* ---------------- settings ---------------- */
  var settings = readSettings();

  function applySettings() {
    root.dataset.theme = settings.theme;
    root.dataset.font = settings.font;
    root.style.setProperty("--reading-size", settings.size + "px");
    root.style.setProperty("--reading-leading", settings.leading);
    root.style.setProperty("--reading-width", settings.width + "px");
    var cycle = document.querySelector("[data-theme-cycle]");
    if (cycle) {
      var label = { paper: "纸色主题", white: "白色主题", dark: "暗色主题" }[settings.theme] || "主题";
      cycle.setAttribute("aria-label", label + "（点击切换）");
      cycle.setAttribute("title", label + " · T");
    }
  }

  function saveSettings() {
    set("settings", settings);
    applySettings();
    document.querySelectorAll("[data-setting]").forEach(function (seg) {
      var key = seg.dataset.setting;
      seg.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(String(settings[key]) === String(b.dataset.value)));
      });
    });
  }

  function cycleTheme() {
    var order = ["paper", "white", "dark"];
    settings.theme = order[(order.indexOf(settings.theme) + 1) % order.length];
    saveSettings();
  }

  /* ---------------- overlays ---------------- */
  var activeOverlay = null;
  var lastFocus = null;

  function openOverlay(el, focusTarget) {
    if (activeOverlay && activeOverlay !== el) closeOverlay();
    lastFocus = document.activeElement;
    el.classList.add("is-open");
    el.removeAttribute("aria-hidden");
    document.body.classList.add("is-locked");
    activeOverlay = el;
    if (focusTarget) setTimeout(function () { focusTarget.focus(); }, 30);
  }
  function closeOverlay() {
    if (!activeOverlay) return;
    activeOverlay.classList.remove("is-open");
    activeOverlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    Array.prototype.forEach.call(document.querySelectorAll('[aria-expanded="true"]'), function (btn) {
      if (btn.hasAttribute("data-settings-toggle") || btn.hasAttribute("data-nav-toggle")) {
        btn.setAttribute("aria-expanded", "false");
      }
    });
    activeOverlay = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------------- settings overlay ---------------- */
  var settingsOverlay = null;

  function buildSettings() {
    var rows = [
      ["theme", "主题", [["paper", "纸色"], ["white", "白色"], ["dark", "暗色"]]],
      ["font", "正文字体", [["sans", "黑体"], ["serif", "宋体"]]],
      ["size", "字号", [[16, "16"], [17, "17"], [18, "18"], [20, "20"]]],
      ["leading", "行高", [[1.7, "紧"], [1.9, "标准"], [2.1, "松"]]],
      ["width", "版心", [[620, "窄"], [700, "标准"], [780, "宽"]]]
    ];
    var html = rows.map(function (row) {
      var key = row[0], label = row[1], opts = row[2];
      var buttons = opts.map(function (o) {
        return '<button type="button" data-value="' + o[0] + '">' + o[1] + "</button>";
      }).join("");
      return '<div class="setting"><span class="setting__label">' + label +
        '</span><div class="seg" data-setting="' + key + '">' + buttons + "</div></div>";
    }).join("");

    var el = document.createElement("div");
    el.className = "overlay";
    el.id = "settings-overlay";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "阅读设置");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="settingsbox">' +
        '<div class="settingsbox__head"><h2>阅读设置</h2><button type="button" data-settings-reset>恢复默认</button></div>' +
        html +
        '<div class="settingsbox__foot">设置会自动保存在本机。快捷键：<kbd>T</kbd> 主题 · <kbd>F</kbd> 字体 · <kbd>Ctrl K</kbd> 搜索。</div>' +
      "</div>";
    el.addEventListener("click", function (e) {
      if (e.target === el) closeOverlay();
    });
    el.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-setting] button");
      if (btn) {
        var key = btn.parentElement.dataset.setting;
        var val = btn.dataset.value;
        settings[key] = key === "size" || key === "width" ? Number(val)
          : key === "leading" ? Number(val) : val;
        saveSettings();
        return;
      }
      if (e.target.closest("[data-settings-reset]")) {
        settings = { theme: "paper", font: "sans", size: 17, leading: 1.9, width: 700 };
        saveSettings();
      }
    });
    document.body.appendChild(el);
    return el;
  }

  function toggleSettings(trigger) {
    if (!settingsOverlay) settingsOverlay = buildSettings();
    if (settingsOverlay.classList.contains("is-open")) { closeOverlay(); return; }
    saveSettings();
    openOverlay(settingsOverlay, settingsOverlay.querySelector(".seg button"));
    if (trigger) trigger.setAttribute("aria-expanded", "true");
  }

  /* ---------------- search ---------------- */
  var searchOverlay = null, searchInput = null, searchResults = null, searchMeta = null;
  var searchData = null, searchPromise = null, hits = [], hitIndex = -1;

  function loadSearch() {
    if (searchPromise) return searchPromise;
    searchPromise = fetch(BASE + "data/search.json")
      .then(function (r) { return r.json(); })
      .then(function (data) { searchData = data; return data; })
      .catch(function () { searchData = []; return []; });
    return searchPromise;
  }

  function escHtml(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function escReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function mark(text, q) {
    var safe = escHtml(text);
    if (!q) return safe;
    try {
      return safe.replace(new RegExp("(" + escReg(escHtml(q)) + ")", "gi"), "<mark>$1</mark>");
    } catch (e) { return safe; }
  }

  function snippet(text, q) {
    if (!q) return text.slice(0, 90);
    var idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return text.slice(0, 90);
    var start = Math.max(0, idx - 28);
    var end = Math.min(text.length, idx + q.length + 52);
    return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
  }

  function buildSearch() {
    var el = document.createElement("div");
    el.className = "overlay";
    el.id = "search-overlay";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "搜索全书");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="searchbox">' +
        '<div class="searchbox__bar">' +
          '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.6"></circle><path d="M10.4 10.4 14 14"></path></svg>' +
          '<input class="searchbox__input" type="search" placeholder="搜索全书：层级、留白、色阶、行高…" aria-label="搜索关键词" autocomplete="off" spellcheck="false">' +
          "<kbd>Esc</kbd>" +
        "</div>" +
        '<div class="searchbox__meta"><span>输入中文或英文关键词</span><span data-search-count></span></div>' +
        '<div class="searchbox__results" data-search-results></div>' +
      "</div>";
    el.addEventListener("click", function (e) {
      if (e.target === el) closeOverlay();
    });
    document.body.appendChild(el);

    searchInput = el.querySelector(".searchbox__input");
    searchResults = el.querySelector("[data-search-results]");
    searchMeta = el.querySelector("[data-search-count]");

    searchInput.addEventListener("input", function () { runSearch(searchInput.value.trim()); });
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); moveHit(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); moveHit(-1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        var hit = hits[hitIndex];
        if (hit) goHit(hit);
        else if (hits[0]) goHit(hits[0]);
      }
    });
    searchResults.addEventListener("click", function (e) {
      var a = e.target.closest("[data-hit]");
      if (a) goHit(hits[Number(a.dataset.hit)]);
    });
    return el;
  }

  function openSearch() {
    if (!searchOverlay) searchOverlay = buildSearch();
    if (searchOverlay.classList.contains("is-open")) return;
    openOverlay(searchOverlay, searchInput);
    searchInput.value = "";
    searchInput.focus();
    runSearch("");
    loadSearch().then(function () { runSearch(searchInput.value.trim()); });
  }

  function runSearch(q) {
    if (!searchData) { searchResults.innerHTML = '<p class="searchbox__empty">正在载入索引…</p>'; return; }
    hits = [];
    hitIndex = -1;
    if (!q) {
      searchResults.innerHTML = '<p class="searchbox__empty">试试搜 <strong>留白</strong>、<strong>层级</strong>、<strong>HSL</strong> 或 <strong>阴影</strong>。</p>';
      searchMeta.textContent = searchData.length + " 个小节已索引";
      return;
    }
    var ql = q.toLowerCase();
    searchData.forEach(function (item) {
      var inTitle = item.h.toLowerCase().indexOf(ql) !== -1 || item.ct.toLowerCase().indexOf(ql) !== -1;
      var inText = item.x.toLowerCase().indexOf(ql) !== -1;
      if (!inTitle && !inText) return;
      hits.push({ item: item, score: inTitle ? 2 : 1 });
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    hits = hits.slice(0, 40);
    searchMeta.textContent = hits.length ? hits.length + " 个结果" : "";
    if (!hits.length) {
      searchResults.innerHTML = '<p class="searchbox__empty">没有找到「<strong>' + escHtml(q) + '</strong>」。换个词试试？</p>';
      return;
    }
    var lastChapter = null, html = "";
    hits.forEach(function (hit, i) {
      var it = hit.item;
      if (it.c !== lastChapter) {
        html += '<p class="searchbox__group">' + escHtml(it.c + " · " + it.ct) + "</p>";
        lastChapter = it.c;
      }
      html += '<a class="searchhit" data-hit="' + i + '" href="' + BASE + "ch/" + it.c + ".html#" + it.s + '">' +
        '<span class="searchhit__title">' + mark(it.h, q) + "</span>" +
        '<span class="searchhit__snippet">' + mark(snippet(it.x, q), q) + "</span>" +
        '<span class="searchhit__where">第 ' + Number(it.c) + " 章 · " + escHtml(it.ct) + "</span></a>";
    });
    searchResults.innerHTML = html;
    searchResults.scrollTop = 0;
  }

  function moveHit(dir) {
    if (!hits.length) return;
    hitIndex = (hitIndex + dir + hits.length) % hits.length;
    searchResults.querySelectorAll(".searchhit").forEach(function (el, i) {
      el.classList.toggle("is-active", i === hitIndex);
      if (i === hitIndex) el.scrollIntoView({ block: "nearest" });
    });
  }
  function goHit(hit) {
    if (!hit) return;
    closeOverlay();
    location.href = BASE + "ch/" + hit.item.c + ".html#" + hit.item.s;
  }

  /* ---------------- lightbox ---------------- */
  var lb = null, lbFigures = [], lbIndex = 0, lbZoom = 1, lbPan = { x: 0, y: 0 }, lbDrag = null;
  var lbMoved = 0, lbTouch = null;

  function buildLightbox() {
    var el = document.createElement("div");
    el.className = "lightbox";
    el.id = "lightbox";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "插图放大");
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="lightbox__bar">' +
        '<span class="lightbox__caption" data-lb-caption></span>' +
        '<div class="lightbox__tools">' +
          '<button class="lightbox__btn" type="button" data-lb-zoom-out aria-label="缩小">−</button>' +
          '<button class="lightbox__btn" type="button" data-lb-zoom-reset aria-label="原始大小">100%</button>' +
          '<button class="lightbox__btn" type="button" data-lb-zoom-in aria-label="放大">＋</button>' +
          '<button class="lightbox__btn" type="button" data-lb-close aria-label="关闭">关闭 Esc</button>' +
        "</div>" +
      "</div>" +
      '<div class="lightbox__stage" data-lb-stage>' +
        '<img class="lightbox__img" data-lb-img alt="">' +
        '<button class="lightbox__nav lightbox__nav--prev" type="button" data-lb-prev aria-label="上一张">←</button>' +
        '<button class="lightbox__nav lightbox__nav--next" type="button" data-lb-next aria-label="下一张">→</button>' +
      "</div>" +
      '<p class="lightbox__hint">滚轮缩放 · 放大后拖动 · ← → 切换插图 · Esc 关闭</p>';
    document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      if (e.target === el || e.target.closest("[data-lb-close]")) closeLightbox();
      else if (e.target.closest("[data-lb-prev]")) stepLightbox(-1);
      else if (e.target.closest("[data-lb-next]")) stepLightbox(1);
      else if (e.target.closest("[data-lb-zoom-in]")) zoomLightbox(1.25);
      else if (e.target.closest("[data-lb-zoom-out]")) zoomLightbox(0.8);
      else if (e.target.closest("[data-lb-zoom-reset]")) resetZoom();
    });
    var stage = el.querySelector("[data-lb-stage]");
    stage.addEventListener("click", function (e) {
      if (e.target.closest("[data-lb-prev],[data-lb-next],[data-lb-zoom-in],[data-lb-zoom-out],[data-lb-zoom-reset]")) return;
      if (lbMoved > 4) { lbMoved = 0; return; }
      if (lbZoom > 1) resetZoom(); else zoomLightbox(1.8);
    });
    stage.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { lbTouch = null; return; }
      lbTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (!lbTouch || lbZoom > 1) { lbTouch = null; return; }
      var t = e.changedTouches[0];
      if (!t) { lbTouch = null; return; }
      var dx = t.clientX - lbTouch.x, dy = t.clientY - lbTouch.y;
      lbTouch = null;
      if (Math.abs(dx) > 50 && Math.abs(dy) < 80) stepLightbox(dx < 0 ? 1 : -1);
    }, { passive: true });
    stage.addEventListener("wheel", function (e) {
      e.preventDefault();
      zoomLightbox(e.deltaY < 0 ? 1.12 : 0.9);
    }, { passive: false });
    stage.addEventListener("pointerdown", function (e) {
      lbMoved = 0;
      if (lbZoom <= 1) return;
      lbDrag = { x: e.clientX, y: e.clientY, px: lbPan.x, py: lbPan.y };
      stage.classList.add("is-dragging");
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointermove", function (e) {
      if (!lbDrag) return;
      lbMoved = Math.max(lbMoved, Math.abs(e.clientX - lbDrag.x) + Math.abs(e.clientY - lbDrag.y));
      lbPan.x = lbDrag.px + (e.clientX - lbDrag.x);
      lbPan.y = lbDrag.py + (e.clientY - lbDrag.y);
      paintZoom();
    });
    stage.addEventListener("pointerup", function (e) {
      lbDrag = null;
      stage.classList.remove("is-dragging");
      try { stage.releasePointerCapture(e.pointerId); } catch (err) {}
    });
    return el;
  }

  function paintZoom() {
    var img = lb.querySelector("[data-lb-img]");
    img.style.transform = "translate(" + lbPan.x + "px," + lbPan.y + "px) scale(" + lbZoom + ")";
    lb.querySelector("[data-lb-stage]").classList.toggle("is-zoomed", lbZoom > 1);
    lb.querySelector("[data-lb-zoom-reset]").textContent = Math.round(lbZoom * 100) + "%";
  }
  function zoomLightbox(factor) {
    lbZoom = Math.max(1, Math.min(4, lbZoom * factor));
    if (lbZoom === 1) lbPan = { x: 0, y: 0 };
    paintZoom();
  }
  function resetZoom() {
    lbZoom = 1; lbPan = { x: 0, y: 0 };
    paintZoom();
  }

  function figureData(btn) {
    var img = btn.querySelector("img");
    var best = img.getAttribute("src");
    var bestW = 0;
    (img.getAttribute("srcset") || "").split(",").forEach(function (part) {
      var bits = part.trim().split(/\s+/);
      var w = parseInt((bits[1] || "0").replace("w", ""), 10) || 0;
      if (w >= bestW) { bestW = w; best = bits[0]; }
    });
    return {
      src: best,
      caption: btn.dataset.caption || "插图",
      alt: img.getAttribute("alt") || ""
    };
  }

  function openLightbox(btn) {
    lbFigures = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
    lbIndex = lbFigures.indexOf(btn);
    if (lbIndex < 0) lbIndex = 0;
    if (!lb) lb = buildLightbox();
    openOverlay(lb, lb.querySelector("[data-lb-close]"));
    renderLightbox();
  }

  function renderLightbox() {
    var data = figureData(lbFigures[lbIndex]);
    var img = lb.querySelector("[data-lb-img]");
    img.src = data.src;
    img.alt = data.alt;
    lb.querySelector("[data-lb-caption]").textContent =
      data.caption + "  ·  " + (lbIndex + 1) + " / " + lbFigures.length;
    var multi = lbFigures.length > 1;
    lb.querySelector("[data-lb-prev]").hidden = !multi;
    lb.querySelector("[data-lb-next]").hidden = !multi;
    resetZoom();
  }

  function stepLightbox(dir) {
    if (!lbFigures.length) return;
    lbIndex = (lbIndex + dir + lbFigures.length) % lbFigures.length;
    renderLightbox();
  }

  function closeLightbox() {
    if (!lb) return;
    closeOverlay();
  }

  /* ---------------- progress ---------------- */
  var saveTimer = null;
  function chapterScrollFraction() {
    var el = document.querySelector(".chapter");
    if (!el) return 0;
    var doc = document.documentElement;
    if (window.scrollY + window.innerHeight >= doc.scrollHeight - 8) return 1;
    var top = el.offsetTop;
    var total = el.offsetHeight - window.innerHeight + 240;
    var y = window.scrollY - top + 120;
    return Math.max(0, Math.min(1, y / Math.max(1, total)));
  }

  function updateProgress() {
    var frac = chapterScrollFraction();
    var pct = Math.round(frac * 100);
    var bar = document.querySelector("[data-scroll-progress]");
    if (bar) bar.style.width = pct + "%";
    var chapBar = document.querySelector("[data-chapter-progress]");
    if (chapBar) chapBar.style.width = pct + "%";
    var pctEl = document.querySelector("[data-chapter-percent]");
    if (pctEl) pctEl.textContent = pct + "%";
    if (PAGE.kind === "chapter" && !get("read:" + PAGE.chapter, false)) {
      set("progress:" + PAGE.chapter, pct);
      set("last", { num: PAGE.chapter, pct: pct });
    }
  }

  function markReadState(num) {
    var read = get("read:" + num, false);
    var btn = document.querySelector("[data-mark-read]");
    var hint = document.querySelector("[data-read-hint]");
    if (!btn) return;
    btn.classList.toggle("is-read", read);
    btn.textContent = read ? "✓ 已读 · 取消标记" : "标记本章已读";
    if (hint) {
      hint.textContent = read ? "这一章已标记读完，首页与目录会记住。" : "读完点一下，首页会记住你的进度。";
      hint.classList.toggle("is-read", read);
    }
    document.querySelectorAll("[data-chap-progress]").forEach(function (b) {
      var n = b.dataset.chapProgress;
      var p = get("read:" + n, false) ? 100 : get("progress:" + n, 0);
      if (b.classList.contains("chapnav__bar")) b.querySelector("b");
      var fill = b.tagName === "B" ? b : b;
      if (b.classList.contains("chapnav__bar")) {
        fill = b.querySelector("b");
      }
      if (fill) fill.style.width = p + "%";
    });
  }

  function refreshNavProgress() {
    document.querySelectorAll("[data-chap-progress]").forEach(function (el) {
      var n = el.dataset.chapProgress;
      var p = get("read:" + n, false) ? 100 : get("progress:" + n, 0);
      el.style.setProperty("--p", p + "%");
      el.style.width = p + "%";
    });
  }

  function markRead() {
    var num = PAGE.chapter;
    var now = !get("read:" + num, false);
    set("read:" + num, now);
    markReadState(num);
    refreshNavProgress();
    updateProgress();
  }

  /* ---------------- scroll spy ---------------- */
  function initSpy() {
    var secs = Array.prototype.slice.call(document.querySelectorAll(".sec[id]"));
    if (!secs.length) return;
    var spyLinks = Array.prototype.slice.call(document.querySelectorAll("[data-spy]"));
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        spyLinks.forEach(function (a) {
          a.classList.toggle("is-active", a.dataset.spy === id || a.getAttribute("href") === "#" + id);
        });
      });
    }, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });
    secs.forEach(function (s) { obs.observe(s); });
  }

  /* ---------------- resume ---------------- */
  function tryResume() {
    if (PAGE.kind !== "chapter") return;
    var resume = null;
    try { resume = JSON.parse(sessionStorage.getItem("rui:resume") || "null"); } catch (e) {}
    if (!resume || resume.num !== PAGE.chapter) return;
    sessionStorage.removeItem("rui:resume");
    setTimeout(function () {
      var el = document.querySelector(".chapter");
      if (!el) return;
      var total = el.offsetHeight - window.innerHeight + 240;
      window.scrollTo({ top: el.offsetTop + resume.pct / 100 * total - 120, behavior: "auto" });
    }, 350);
  }

  /* ---------------- home ---------------- */
  function initHome() {
    var last = get("last", null);
    var btn = document.querySelector("[data-continue]");
    if (btn && last) {
      var chap = (window.RUI_CHAPTERS || []).filter(function (c) { return c.num === last.num; })[0];
      if (chap) {
        var pct = get("read:" + last.num, false) ? 100 : get("progress:" + last.num, 0);
        btn.textContent = "继续阅读 · 第 " + Number(last.num) + " 章 " + pct + "%";
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          try { sessionStorage.setItem("rui:resume", JSON.stringify({ num: last.num, pct: pct })); } catch (err) {}
          location.href = "ch/" + last.num + ".html";
        });
      }
    }
    (window.RUI_CHAPTERS || []).forEach(function (c) {
      var el = document.querySelector('[data-chap-progress="' + c.num + '"]');
      if (el) {
        var p = get("read:" + c.num, false) ? 100 : get("progress:" + c.num, 0);
        el.style.setProperty("--p", p + "%");
        el.style.width = p + "%";
      }
    });
  }

  /* ---------------- focus trap ---------------- */
  function trapTab(e, container) {
    var nodes = container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    var list = Array.prototype.filter.call(nodes, function (n) {
      return n.offsetWidth > 0 || n.offsetHeight > 0 || n === document.activeElement;
    });
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------------- deep links ---------------- */
  /* Lazy-mounted demos change the height of content above an anchor, so the
     browser's initial scroll to #s3 / #demo-x can drift by a screen or more.
     Re-anchor briefly after load (and when a demo mounts above the target). */
  var anchorStart = 0;
  function reanchor() {
    if (!location.hash || location.hash.length < 2) return;
    if (anchorStart && Date.now() - anchorStart > 6000) return;
    var id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { return; }
    var target = document.getElementById(id);
    if (!target) return;
    var before = window.pageYOffset;
    target.scrollIntoView({ block: "start", behavior: "auto" });
    if (Math.abs(window.pageYOffset - before) > 2) {
      /* keep the address bar clean of the extra scroll bookkeeping */
      history.replaceState(null, "", location.hash);
    }
  }

  /* ---------------- wiring ---------------- */
  function wire() {
    anchorStart = Date.now();
    applySettings();
    if (location.hash) {
      setTimeout(reanchor, 120);
      setTimeout(reanchor, 700);
      var onMount = function () {
        if (Date.now() - anchorStart < 6000) setTimeout(reanchor, 60);
      };
      window.addEventListener("rui:demo-mounted", onMount);
      window.addEventListener("rui:live-mounted", onMount);
    }
    refreshNavProgress();
    if (PAGE.kind === "chapter") {
      markReadState(PAGE.chapter);
      initSpy();
      tryResume();
      var markBtn = document.querySelector("[data-mark-read]");
      if (markBtn) markBtn.addEventListener("click", markRead);
      updateProgress();
      window.addEventListener("scroll", updateProgress, { passive: true });
      window.addEventListener("resize", updateProgress);
    }
    if (PAGE.kind === "home") initHome();

    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-search-open]")) { e.preventDefault(); openSearch(); }
      else if (e.target.closest("[data-settings-toggle]")) { e.preventDefault(); toggleSettings(e.target.closest("[data-settings-toggle]")); }
      else if (e.target.closest("[data-theme-cycle]")) { e.preventDefault(); cycleTheme(); }
      else if (e.target.closest("[data-lightbox]")) { e.preventDefault(); openLightbox(e.target.closest("[data-lightbox]")); }
      else if (e.target.closest("[data-nav-toggle]")) { toggleRail(); }
      else if (e.target.closest("[data-rail-scrim]")) { toggleRail(false); }
      else if (e.target.closest(".rail a")) { if (window.innerWidth <= 960) toggleRail(false); }
    });

    var railToggle = document.querySelector("[data-nav-toggle]");
    function toggleRail(force) {
      var rail = document.querySelector(".rail");
      var scrim = document.querySelector("[data-rail-scrim]");
      if (!rail) return;
      var open = typeof force === "boolean" ? force : !rail.classList.contains("is-open");
      rail.classList.toggle("is-open", open);
      if (scrim) scrim.hidden = !open;
      document.body.classList.toggle("is-locked", open);
      if (railToggle) railToggle.setAttribute("aria-expanded", String(open));
    }

    document.addEventListener("keydown", function (e) {
      if (activeOverlay && e.key === "Tab") { trapTab(e, activeOverlay); return; }
      var tag = (e.target.tagName || "").toLowerCase();
      var typing = tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable;
      var mod = e.ctrlKey || e.metaKey;

      if (mod && (e.key === "k" || e.key === "K")) { e.preventDefault(); openSearch(); return; }
      if (e.key === "Escape") {
        if (activeOverlay) { closeOverlay(); return; }
        var rail = document.querySelector(".rail.is-open");
        if (rail) { toggleRail(false); return; }
      }
      if (activeOverlay && activeOverlay.id === "lightbox") {
        if (e.key === "ArrowLeft") { e.preventDefault(); stepLightbox(-1); }
        else if (e.key === "ArrowRight") { e.preventDefault(); stepLightbox(1); }
        else if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomLightbox(1.2); }
        else if (e.key === "-") { e.preventDefault(); zoomLightbox(0.83); }
        return;
      }
      if (typing || mod) return;
      if (e.key === "/") { e.preventDefault(); openSearch(); }
      else if (e.key === "t" || e.key === "T") { cycleTheme(); }
      else if (e.key === "f" || e.key === "F") {
        settings.font = settings.font === "serif" ? "sans" : "serif";
        saveSettings();
      }
    });

    window.addEventListener("beforeunload", function () {
      if (PAGE.kind === "chapter" && !get("read:" + PAGE.chapter, false)) {
        set("progress:" + PAGE.chapter, Math.round(chapterScrollFraction() * 100));
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
