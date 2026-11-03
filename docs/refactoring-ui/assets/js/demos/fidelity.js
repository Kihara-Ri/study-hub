/* fidelity.js — 低保真 → 高保真：先做结构，再做视觉 */
(function () {
  "use strict";
  var K = window.RUIDemo.kit;

  function mix(a, b, t) {
    return [
      Math.round(K.lerp(a[0], b[0], t)),
      Math.round(K.lerp(a[1], b[1], t)),
      Math.round(K.lerp(a[2], b[2], t))
    ];
  }
  function rgba(rgb, alpha) { return "rgba(" + rgb.join(",") + "," + alpha + ")"; }
  function css(rgb) { return "rgb(" + rgb.join(",") + ")"; }

  var INK = [27, 27, 31];
  var MUTED = [122, 122, 132];
  var LINE = [214, 214, 220];
  var PAPER = [255, 255, 255];
  var BRAND = [47, 93, 138];
  var BRAND_SOFT = [232, 238, 245];
  var AVATAR = [232, 232, 236];

  var STYLE_ID = "fx-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent =
      ".fx-wrap{display:grid;gap:18px;width:100%}" +
      ".fx-canvas{display:grid;place-items:center;padding:8px 0 4px}" +
      ".fx-card{width:100%;max-width:360px;padding:20px;background:#fff;border:1px solid #d6d6dc;" +
      "font-family:var(--font-ui);color:#1b1b1f;transition:box-shadow .2s ease,background .2s ease}" +
      ".fx-card__head{display:flex;align-items:center;gap:12px}" +
      ".fx-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:700;flex:none;transition:background .2s,color .2s}" +
      ".fx-name{font-size:14px;font-weight:700;line-height:1.3}" +
      ".fx-sub{font-size:12px;line-height:1.4}" +
      ".fx-title{margin:18px 0 8px;font-size:19px;line-height:1.25;transition:color .2s,font-weight .2s}" +
      ".fx-lines{display:grid;gap:7px;margin-top:10px}" +
      ".fx-line{height:9px;border-radius:3px;transition:background .2s}" +
      ".fx-line--short{width:72%}" +
      ".fx-thumb{position:relative;height:104px;margin-top:16px;border-radius:0;overflow:hidden;background:#ececf0;transition:border-radius .2s,background .2s}" +
      ".fx-thumb__art{position:absolute;inset:0;background:linear-gradient(135deg,#5b8fb9 0%,#2f5d8a 48%,#1d3c5c 100%);transition:opacity .2s,filter .2s}" +
      ".fx-thumb__art::after{content:\"\";position:absolute;inset:0;background:radial-gradient(120px 90px at 78% 18%,rgba(255,255,255,.35),transparent 70%)}" +
      ".fx-thumb__glyph{position:absolute;inset:0;display:grid;place-items:center;font-size:22px;color:#9a9aa4;transition:opacity .2s}" +
      ".fx-tag{display:inline-flex;align-items:center;gap:5px;margin-top:16px;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:700;letter-spacing:.04em;transition:background .2s,color .2s}" +
      ".fx-actions{display:flex;align-items:center;gap:10px;margin-top:16px}" +
      ".fx-btn{flex:1;padding:10px 14px;border-radius:0;border:1px solid #d6d6dc;font-size:13px;font-weight:600;text-align:center;transition:background .2s,color .2s,border-color .2s,border-radius .2s}" +
      ".fx-btn--ghost{flex:0 0 auto;padding:10px 14px}" +
      ".fx-meter{display:flex;align-items:center;gap:10px;font-size:11px;color:var(--ink-3)}" +
      ".fx-meter__track{flex:1;height:3px;background:var(--rule);position:relative;overflow:hidden}" +
      ".fx-meter__fill{position:absolute;inset:0 auto 0 0;width:0;background:var(--blue);transition:width .15s}" +
      ".fx-readout{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11.5px;color:var(--ink-3);min-height:18px}" +
      ".fx-readout b{color:var(--ink-2);font-weight:600}" +
      ".fx-flag{display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:999px;background:color-mix(in srgb,var(--blue) 10%,transparent);color:var(--blue);font-size:10.5px;font-weight:700}" +
      ".fx-grayscale .fx-canvas{filter:grayscale(1) contrast(1.02)}";
    document.head.appendChild(s);
  }

  window.RUIDemo.register("fidelity", {
    build: function (body, ctx) {
      injectStyle();
      var t = 0;
      var grayscale = false;

      var wrap = K.el("div", { class: "fx-wrap" });

      /* --- canvas --- */
      var stage = K.stage("demo__stage--plain fx-grayscale-off");
      stage.classList.add("fx-canvas-wrap");
      var canvas = K.el("div", { class: "fx-canvas" });
      var card = K.el("div", { class: "fx-card" });
      card.innerHTML =
        '<div class="fx-card__head">' +
          '<span class="fx-avatar" data-fx="avatar">LM</span>' +
          '<div><div class="fx-name" data-fx="name">林默</div>' +
          '<div class="fx-sub" data-fx="sub">产品设计师 · 上海</div></div>' +
        "</div>" +
        '<div class="fx-title" data-fx="title">把复杂的事情做简单</div>' +
        '<div class="fx-lines">' +
          '<i class="fx-line" data-fx="line" style="width:96%"></i>' +
          '<i class="fx-line" data-fx="line" style="width:88%"></i>' +
          '<i class="fx-line fx-line--short" data-fx="line"></i>' +
        "</div>" +
        '<div class="fx-thumb" data-fx="thumb">' +
          '<div class="fx-thumb__art" data-fx="art"></div>' +
          '<div class="fx-thumb__glyph">▧</div>' +
        "</div>" +
        '<span class="fx-tag" data-fx="tag">案例研究</span>' +
        '<div class="fx-actions">' +
          '<span class="fx-btn" data-fx="btn">阅读全文</span>' +
          '<span class="fx-btn fx-btn--ghost" data-fx="ghost">收藏</span>' +
        "</div>";
      canvas.appendChild(card);
      stage.appendChild(canvas);

      var q = function (sel) { return card.querySelector('[data-fx="' + sel + '"]'); };
      var avatar = q("avatar"), name = q("name"), sub = q("sub"), title = q("title");
      var lines = card.querySelectorAll('[data-fx="line"]');
      var thumb = q("thumb"), art = q("art"), tag = q("tag"), btn = q("btn"), ghost = q("ghost");

      var readout = K.el("div", { class: "fx-readout", "aria-live": "polite" });
      var meterFill = K.el("i", { class: "fx-meter__fill" });
      var meter = K.el("div", { class: "fx-meter" }, [
        K.el("span", { text: "完成度" }),
        K.el("div", { class: "fx-meter__track" }, meterFill),
        K.el("b", { class: "demo__value", text: "0%" })
      ]);

      /* --- controls --- */
      var controls = K.el("div", { class: "controls controls--row" });
      var slider = K.range({
        label: "完成度",
        min: 0, max: 100, step: 1, value: 0,
        format: function (v) { return v + "%"; },
        onInput: function (v) { t = v / 100; render(); }
      });
      var grayToggle = K.toggle({
        label: "灰度检查",
        checked: false,
        hint: "去掉颜色后，层级还成立吗？",
        onChange: function (on) {
          grayscale = on;
          stage.classList.toggle("fx-grayscale", on);
        }
      });
      controls.appendChild(slider.el);
      controls.appendChild(grayToggle.el);

      wrap.appendChild(controls);
      wrap.appendChild(stage);
      wrap.appendChild(meter);
      wrap.appendChild(readout);
      body.appendChild(wrap);

      function render() {
        var e = t;
        /* shell */
        card.style.borderRadius = K.round(K.lerp(2, 14, e), 1) + "px";
        card.style.borderStyle = e < 0.18 ? "dashed" : "solid";
        card.style.borderColor = css(mix(LINE, [230, 230, 235], e));
        card.style.boxShadow = e < 0.05 ? "none" :
          "0 " + K.round(K.lerp(1, 12, e), 1) + "px " + K.round(K.lerp(2, 30, e), 1) + "px -12px " +
          rgba([16, 20, 28], K.round(K.lerp(0.05, 0.32, e) * 100) / 100);

        /* text */
        avatar.style.background = css(mix(AVATAR, BRAND, e));
        avatar.style.color = css(mix([122, 122, 132], [255, 255, 255], e));
        name.style.color = css(mix(MUTED, INK, e));
        sub.style.color = css(mix([154, 154, 164], [107, 107, 116], e));
        title.style.color = css(mix([122, 122, 132], INK, e));
        title.style.fontWeight = String(K.round(K.lerp(600, 800, e)));
        title.style.letterSpacing = K.round(K.lerp(0, -0.02, e), 3) + "em";

        /* body copy: skeleton bars -> real text lines */
        lines.forEach(function (line) {
          line.style.background = css(mix([228, 228, 233], [90, 90, 100], e));
          line.style.height = K.round(K.lerp(9, 8, e), 1) + "px";
          line.style.opacity = String(K.round(K.lerp(1, 0.85, e), 2));
        });

        /* thumbnail */
        thumb.style.borderRadius = K.round(K.lerp(0, 10, e), 1) + "px";
        art.style.opacity = String(K.round(K.lerp(0, 1, e), 2));
        art.style.filter = "saturate(" + K.round(K.lerp(0.2, 1, e), 2) + ")";

        /* tag */
        tag.style.background = css(mix([236, 236, 240], BRAND_SOFT, e));
        tag.style.color = css(mix([122, 122, 132], BRAND, e));

        /* buttons */
        btn.style.borderRadius = K.round(K.lerp(0, 9, e), 1) + "px";
        ghost.style.borderRadius = K.round(K.lerp(0, 9, e), 1) + "px";
        btn.style.background = css(mix(PAPER, BRAND, e));
        btn.style.borderColor = css(mix(LINE, BRAND, e));
        btn.style.color = css(mix(INK, [255, 255, 255], e));
        ghost.style.color = css(mix(MUTED, [74, 74, 82], e));

        /* readout */
        meterFill.style.width = Math.round(e * 100) + "%";
        meter.querySelector("b").textContent = Math.round(e * 100) + "%";
        var items = [];
        items.push('<span>结构 <b>已就位</b></span>');
        items.push("<span>字体与颜色 <b>" + (e > 0.25 ? "已加入" : "待加入") + "</b></span>");
        items.push("<span>圆角与阴影 <b>" + (e > 0.55 ? "已加入" : "待加入") + "</b></span>");
        items.push("<span>图像与细节 <b>" + (e > 0.8 ? "已加入" : "待加入") + "</b></span>");
        readout.innerHTML = items.join("");
        if (e >= 0.999) readout.innerHTML += '<span class="fx-flag">高保真完成</span>';
        else if (e <= 0.001) readout.innerHTML += '<span class="fx-flag">低保真线框</span>';
        else readout.innerHTML += '<span class="fx-flag">打磨中</span>';

        if (grayscale) stage.classList.add("fx-grayscale");
      }

      render();
      slider.set(0);
      return function reset() { t = 0; grayscale = false; grayToggle.input.checked = false; stage.classList.remove("fx-grayscale"); slider.set(0); render(); };
    }
  });
})();
