/* ==========================================================================
   live-runtime.js — mounts the "figure rebuilt as a playable UI" widgets
   in the reading flow. Each chapter ships src/assets/js/live/<NN>.js which
   registers renderers with RUILive.register("<chapter>-<figNo>", {...}).
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------------------------------------------- kit */
  var kit = {};

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") node.className = v;
        else if (k === "text") node.textContent = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
        else if (k === "dataset") Object.keys(v).forEach(function (d) { node.dataset[d] = v[d]; });
        else node.setAttribute(k, v === true ? "" : String(v));
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c === null || c === undefined || c === false) return;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  function ui(tag, cls, text) {
    var node = el(tag, { class: cls || null });
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function row(children) { return el("div", { class: "lv-row" }, children); }
  function spread(children) { return el("div", { class: "lv-spread" }, children); }
  function note(html) { return el("p", { class: "lv-note", html: html }); }
  function badge(text) { return el("span", { class: "lv-badge", text: text }); }
  function mono(text) { return el("span", { class: "lv-mono", text: text }); }
  function canvas(extra) { return el("div", { class: "lv-canvas" + (extra ? " " + extra : "") }); }
  function controls(children) { return el("div", { class: "lv-controls" }, children); }

  function fmtDefault(v) { return String(v); }

  kit.el = el;
  kit.ui = ui;
  kit.row = row;
  kit.spread = spread;
  kit.note = note;
  kit.badge = badge;
  kit.mono = mono;
  kit.canvas = canvas;
  kit.controls = controls;

  kit.range = function (opts) {
    var out = el("output", { class: "ctl__value", text: (opts.format || fmtDefault)(opts.value) });
    var input = el("input", {
      class: "range",
      type: "range",
      min: opts.min, max: opts.max, step: opts.step === undefined ? 1 : opts.step,
      value: opts.value,
      "aria-label": opts.label
    });
    input.addEventListener("input", function () {
      var v = Number(input.value);
      out.textContent = (opts.format || fmtDefault)(v);
      if (opts.onInput) opts.onInput(v);
    });
    var wrap = el("div", { class: "ctl" }, [
      el("span", { class: "ctl__label", text: opts.label }),
      el("div", { class: "ctl__row" }, [input, out])
    ]);
    if (opts.hint) wrap.appendChild(el("span", { class: "ctl__hint", text: opts.hint }));
    return {
      el: wrap, input: input, output: out,
      set: function (v) {
        input.value = String(v);
        out.textContent = (opts.format || fmtDefault)(v);
      }
    };
  };

  kit.seg = function (opts) {
    var buttons = [];
    var group = el("div", { class: "seg seg--demo", role: "group", "aria-label": opts.label });
    opts.options.forEach(function (opt) {
      var value = opt.value !== undefined ? opt.value : opt;
      var label = opt.label !== undefined ? opt.label : opt;
      var btn = el("button", { type: "button", text: label, "aria-pressed": String(value === opts.value) });
      btn.dataset.value = value;
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        if (opts.onChange) opts.onChange(value);
      });
      buttons.push(btn);
      group.appendChild(btn);
    });
    var wrap = el("div", { class: "ctl ctl--seg" }, [el("span", { class: "ctl__label", text: opts.label }), group]);
    return {
      el: wrap, group: group,
      set: function (value) {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.value === String(value))); });
      }
    };
  };

  kit.toggle = function (opts) {
    var input = el("input", { type: "checkbox" });
    input.checked = !!opts.checked;
    var label = el("label", { class: "switch" }, [input, el("span", { class: "switch__track" }), el("span", { class: "switch__label", text: opts.label })]);
    input.addEventListener("change", function () { if (opts.onChange) opts.onChange(input.checked); });
    var wrap = el("div", { class: "ctl ctl--toggle" }, [label]);
    if (opts.hint) wrap.appendChild(el("span", { class: "ctl__hint", text: opts.hint }));
    return { el: wrap, input: input, checked: function () { return input.checked; } };
  };

  kit.chips = function (items) {
    return el("div", { class: "chips" }, items.map(function (t) {
      return el("span", { class: "chip", text: t });
    }));
  };

  kit.clamp = function (v, min, max) { return Math.max(min, Math.min(max, v)); };
  kit.lerp = function (a, b, t) { return a + (b - a) * t; };
  kit.round = function (v, p) { var m = Math.pow(10, p || 0); return Math.round(v * m) / m; };
  kit.fmtPct = function (v) { return Math.round(v) + "%"; };

  kit.hsl = function (h, s, l) { return "hsl(" + h + " " + s + "% " + l + "%)"; };
  kit.hslToRgb = function (h, s, l) {
    h = ((h % 360) + 360) % 360 / 360; s = s / 100; l = l / 100;
    if (s === 0) { var v = Math.round(l * 255); return [v, v, v]; }
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    return [Math.round(hue2rgb(p, q, h + 1 / 3) * 255), Math.round(hue2rgb(p, q, h) * 255), Math.round(hue2rgb(p, q, h - 1 / 3) * 255)];
  };
  kit.rgbCss = function (rgb) { return "rgb(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ")"; };
  kit.luminance = function (rgb) {
    var a = rgb.map(function (c) {
      c = c / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  };
  kit.contrast = function (rgb1, rgb2) {
    var l1 = kit.luminance(rgb1), l2 = kit.luminance(rgb2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  /* ------------------------------------------------------------ registry */
  var registry = {};

  function register(id, spec) { registry[id] = spec; }

  function mount(host) {
    var id = host.dataset.live;
    var spec = registry[id];
    var stage = host.querySelector("[data-live-stage]");
    if (!stage) return;
    if (!spec) {
      host.dataset.liveMissing = "1";
      if (window.console) console.warn("[live] no renderer registered for", id);
      return;
    }
    var ctx = { id: id, host: host, stage: stage, kit: kit };

    function build() {
      stage.innerHTML = "";
      var body = el("div", { class: "lv" });
      stage.appendChild(body);
      try {
        spec.build(body, ctx);
      } catch (e) {
        stage.innerHTML = "";
        var err = el("div", { class: "livefig__error" });
        err.textContent = "这个可玩示例没能启动：" + (e && e.message ? e.message : e);
        stage.appendChild(err);
        if (window.console) console.error("[live]", id, e);
      }
    }

    host.dataset.mode = "live";
    build();

    // the toolbar (mode switch + reset) is a sibling of .livefig, inside the <figure>
    var root = host.closest("figure") || host;

    var modeButtons = root.querySelectorAll("[data-live-mode]");
    Array.prototype.forEach.call(modeButtons, function (btn) {
      btn.addEventListener("click", function () {
        host.dataset.mode = btn.dataset.liveMode;
        Array.prototype.forEach.call(modeButtons, function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
      });
    });

    var reset = root.querySelector("[data-live-reset]");
    if (reset) {
      reset.addEventListener("click", function () {
        build();
        reset.textContent = "已重置";
        setTimeout(function () { reset.textContent = "重置"; }, 1200);
      });
    }

    try {
      window.dispatchEvent(new CustomEvent("rui:live-mounted", { detail: { id: id } }));
    } catch (e) { /* old browser */ }
  }

  function mountAll() {
    var hosts = Array.prototype.slice.call(document.querySelectorAll("[data-live]"));
    if (!hosts.length) return;
    if (!("IntersectionObserver" in window)) {
      hosts.forEach(mount);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        mount(entry.target);
      });
    }, { rootMargin: "700px 0px", threshold: 0 });
    hosts.forEach(function (host) { io.observe(host); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll);
  } else {
    mountAll();
  }

  window.RUILive = { register: register, kit: kit, mountAll: mountAll, _registry: registry };
})();
