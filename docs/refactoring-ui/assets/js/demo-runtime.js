/* ==========================================================================
   demo-runtime.js — mounts interactive demos, provides the shared kit
   A demo module registers itself:
     RUIDemo.register("fidelity", {
       build(body, ctx) { ... },     // required: fill `body` with controls + stage
       reset(body, ctx) { ... }      // optional: custom reset (default: re-build)
     });
   ========================================================================== */
(function () {
  "use strict";

  var registry = Object.create(null);
  var meta = window.RUI_DEMOS || {};
  var mountedCount = 0;

  /* ------------------------------- kit ---------------------------------- */

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var val = attrs[key];
        if (val === null || val === undefined || val === false) return;
        if (key === "class") node.className = val;
        else if (key === "text") node.textContent = val;
        else if (key === "html") node.innerHTML = val;
        else if (key === "dataset") Object.keys(val).forEach(function (k) { node.dataset[k] = val[k]; });
        else if (key === "style") Object.keys(val).forEach(function (k) { node.style[k] = val[k]; });
        else if (key.indexOf("on") === 0 && typeof val === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), val);
        } else node.setAttribute(key, val);
      });
    }
    append(node, children);
    return node;
  }

  function append(node, children) {
    if (children === null || children === undefined) return;
    if (Array.isArray(children)) { children.forEach(function (c) { append(node, c); }); return; }
    if (typeof children === "string") { node.insertAdjacentHTML("beforeend", children); return; }
    if (children.nodeType) node.appendChild(children);
  }

  function frag(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content;
  }

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function round(v, digits) {
    var p = Math.pow(10, digits || 0);
    return Math.round(v * p) / p;
  }
  function fmtPct(v) { return Math.round(v) + "%"; }

  function hsl(h, s, l) { return "hsl(" + h + " " + s + "% " + l + "%)"; }

  function srgbToLinear(c) {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function luminance(rgb) {
    return 0.2126 * srgbToLinear(rgb[0]) + 0.7152 * srgbToLinear(rgb[1]) + 0.0722 * srgbToLinear(rgb[2]);
  }
  function contrast(rgb1, rgb2) {
    var l1 = luminance(rgb1), l2 = luminance(rgb2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  function rgbCss(rgb) { return "rgb(" + rgb.join(",") + ")"; }

  function ctl(labelText, control, hintText) {
    var wrap = el("div", { class: "ctl" }, [el("label", { class: "ctl__label", text: labelText }), control]);
    if (hintText) wrap.appendChild(el("p", { class: "ctl__hint", text: hintText }));
    return wrap;
  }

  function range(opts) {
    var input = el("input", {
      class: "range",
      type: "range",
      min: opts.min, max: opts.max, step: opts.step || 1, value: opts.value,
      "aria-label": opts.label || "滑块"
    });
    var output = el("output", { class: "ctl__value", text: opts.format ? opts.format(opts.value) : String(opts.value) });
    var row = el("div", { class: "ctl__row" }, [input, output]);
    input.addEventListener("input", function () {
      var v = Number(input.value);
      output.textContent = opts.format ? opts.format(v) : String(v);
      if (opts.onInput) opts.onInput(v);
    });
    var wrap = ctl(opts.label || "", row, opts.hint);
    return {
      el: wrap,
      input: input,
      output: output,
      set: function (v) {
        input.value = v;
        output.textContent = opts.format ? opts.format(Number(v)) : String(v);
      }
    };
  }

  function seg(opts) {
    var buttons = [];
    var wrap = el("div", { class: "seg seg--demo", role: "group", "aria-label": opts.label || "" });
    (opts.options || []).forEach(function (opt) {
      var b = el("button", {
        type: "button",
        text: opt.label,
        "aria-pressed": String(String(opt.value) === String(opts.value)),
        onclick: function () {
          buttons.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
          b.setAttribute("aria-pressed", "true");
          if (opts.onChange) opts.onChange(opt.value);
        }
      });
      buttons.push(b);
      wrap.appendChild(b);
    });
    var outer = ctl(opts.label || "", wrap, opts.hint);
    return {
      el: outer,
      set: function (v) {
        buttons.forEach(function (b, i) {
          b.setAttribute("aria-pressed", String(String(opts.options[i].value) === String(v)));
        });
      }
    };
  }

  function toggle(opts) {
    var input = el("input", { type: "checkbox", checked: opts.checked ? "checked" : null });
    var sw = el("span", { class: "switch" }, [input, el("span", { class: "switch__track" }, el("span", { class: "switch__thumb" }))]);
    input.addEventListener("change", function () { if (opts.onChange) opts.onChange(input.checked); });
    var wrap = el("label", { class: "ctl ctl--toggle" }, [
      el("span", { class: "ctl__label", text: opts.label || "" }), sw
    ]);
    if (opts.hint) wrap.appendChild(el("p", { class: "ctl__hint", text: opts.hint }));
    return { el: wrap, input: input, checked: function () { return input.checked; } };
  }

  function chips(opts) {
    var buttons = [];
    var wrap = el("div", { class: "chips", role: "group", "aria-label": opts.label || "" });
    (opts.options || []).forEach(function (opt) {
      var b = el("button", {
        type: "button",
        class: "chip",
        text: opt.label,
        "aria-pressed": String(String(opt.value) === String(opts.value)),
        onclick: function () {
          buttons.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
          b.setAttribute("aria-pressed", "true");
          if (opts.onChange) opts.onChange(opt.value);
        }
      });
      buttons.push(b);
      wrap.appendChild(b);
    });
    var outer = opts.label ? ctl(opts.label, wrap, opts.hint) : wrap;
    return {
      el: outer,
      set: function (v) {
        buttons.forEach(function (b, i) {
          b.setAttribute("aria-pressed", String(String(opts.options[i].value) === String(v)));
        });
      }
    };
  }

  function stage(extraClass) {
    return el("div", { class: "demo__stage" + (extraClass ? " " + extraClass : "") });
  }
  function cols(nodes) { return el("div", { class: "demo__cols" }, nodes); }
  function panel(opts) {
    var head = el("div", { class: "demo__panel-head" }, [
      opts.title ? el("h4", { class: "demo__panel-title", text: opts.title }) : null,
      opts.badge ? el("span", { class: "demo__badge", text: opts.badge }) : null
    ]);
    var body = el("div", { class: "demo__panel-body" });
    var node = el("div", { class: "demo__panel" + (opts.plain ? " demo__panel--plain" : "") }, [head, body]);
    return { el: node, body: body };
  }
  function note(text) { return el("p", { class: "demo__note", html: text }); }
  function badge(text) { return el("span", { class: "demo__badge", text: text }); }
  function mono(text) { return el("span", { class: "demo__mono", text: text }); }
  function value(text) { return el("span", { class: "demo__value", text: text }); }
  function ui(html) { return frag(html); }

  var kit = {
    el: el, h: frag, ui: ui, frag: frag, append: append,
    ctl: ctl, range: range, seg: seg, toggle: toggle, chips: chips,
    stage: stage, cols: cols, panel: panel, note: note, badge: badge, mono: mono, value: value,
    clamp: clamp, lerp: lerp, round: round, fmtPct: fmtPct,
    hsl: hsl, hslToRgb: hslToRgb, rgbCss: rgbCss, contrast: contrast, luminance: luminance
  };

  /* ----------------------------- registry -------------------------------- */

  function register(slug, spec) {
    registry[slug] = spec || {};
  }

  /* ----------------------------- mounting -------------------------------- */

  function mount(slot) {
    if (slot.dataset.mounted === "1") return;
    var slug = slot.dataset.demo;
    var spec = registry[slug];
    if (!spec) {
      slot.innerHTML = '<p class="demo__error">实验脚本未加载：' + slug + "</p>";
      slot.dataset.mounted = "1";
      return;
    }
    slot.dataset.mounted = "1";
    mountedCount += 1;

    var info = meta[slug] || { title: slug, desc: "", hint: "", chapter: "" };
    var section = el("section", {
      class: "demo",
      id: "demo-" + slug,
      "aria-labelledby": "demo-" + slug + "-title"
    });
    section.dataset.demoSlug = slug;

    var kickerBits = ["互动实验"];
    if (info.chapter) kickerBits.push("第 " + Number(info.chapter) + " 章");
    kickerBits.push(String(mountedCount).padStart(2, "0"));

    var head = el("div", { class: "demo__head" }, [
      el("span", { class: "demo__kicker", text: kickerBits.join(" · ") }),
      el("h3", { class: "demo__title", id: "demo-" + slug + "-title", text: info.title || slug }),
      info.desc ? el("p", { class: "demo__desc", text: info.desc }) : null
    ]);

    var body = el("div", { class: "demo__body" });
    var resetBtn = el("button", { class: "demo__reset", type: "button", text: "重置实验" });
    var foot = el("div", { class: "demo__foot" }, [
      el("p", { class: "demo__hint" }, [
        el("span", { class: "demo__hintlabel", text: "怎么玩" }),
        el("span", { text: info.hint || "拖动控件，观察预览的变化。" })
      ]),
      resetBtn
    ]);

    section.appendChild(head);
    section.appendChild(body);
    section.appendChild(foot);
    slot.replaceWith(section);

    var ctx = {
      slug: slug,
      meta: info,
      chapter: info.chapter,
      kit: kit,
      isLab: slot.dataset.lab === "1",
      mountIndex: mountedCount,
      build: function () { buildInto(body, spec, ctx); }
    };

    resetBtn.addEventListener("click", function () {
      if (typeof spec.reset === "function") {
        try { spec.reset(body, ctx); } catch (e) { reportError(body, e); }
      } else {
        buildInto(body, spec, ctx);
      }
      resetBtn.textContent = "已重置";
      setTimeout(function () { resetBtn.textContent = "重置实验"; }, 1200);
    });

    buildInto(body, spec, ctx);

    try {
      window.dispatchEvent(new CustomEvent("rui:demo-mounted", { detail: { slug: slug } }));
    } catch (e) { /* older browsers: no CustomEvent constructor */ }
  }

  function buildInto(body, spec, ctx) {
    body.innerHTML = "";
    try {
      spec.build(body, ctx);
    } catch (e) {
      reportError(body, e);
    }
  }

  function reportError(body, e) {
    body.innerHTML = "";
    var box = el("div", { class: "demo__error" }, [
      el("strong", { text: "这个实验没能启动" }),
      el("p", { text: String(e && e.message ? e.message : e) }),
      el("p", { class: "demo__errorhint", text: "刷新页面即可重试；如果持续出现，说明脚本有错误。" })
    ]);
    body.appendChild(box);
    if (window.console) console.error("[demo]", e);
  }

  function mountAll() {
    var slots = Array.prototype.slice.call(document.querySelectorAll(".demo-slot[data-demo]"));
    if (!slots.length) return;

    var hash = location.hash ? location.hash.slice(1) : "";
    var supportsIO = "IntersectionObserver" in window;

    var hashTarget = null, hashIndex = -1;
    slots.forEach(function (slot, i) {
      if (hash && ("demo-" + slot.dataset.demo) === hash) { hashTarget = hash; hashIndex = i; }
    });
    /* Deep link: mount every demo above the target up front, otherwise those
       demos lazily grow later and push the target out of the viewport. */
    slots.forEach(function (slot, i) {
      if (hashIndex >= 0 && i <= hashIndex) { mount(slot); return; }
      if (!supportsIO) { mount(slot); return; }
    });
    if (hashTarget) {
      var jump = function () {
        var el = document.getElementById(hashTarget);
        if (el) el.scrollIntoView({ block: "start" });
      };
      setTimeout(jump, 40);
      setTimeout(jump, 320);
    }

    if (!supportsIO) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        mount(entry.target);
      });
    }, { rootMargin: "700px 0px", threshold: 0 });
    slots.forEach(function (slot) {
      if (slot.dataset.mounted !== "1") io.observe(slot);
    });
  }

  window.RUIDemo = {
    register: register,
    mountAll: mountAll,
    kit: kit,
    _registry: registry
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll);
  } else {
    mountAll();
  }
})();
