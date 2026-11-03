/* 第 7 章 · 图片的运用 —— 实时重制图（live-c） */
(function () {
  "use strict";
  var K = window.RUILive.kit;

  var style = document.createElement("style");
  style.id = "lv-07-style";
  style.textContent = [
    /* ---- 7-04 背景图上的文字 ---- */
    ".l07-hero { position: relative; width: 100%; max-width: 540px; height: 230px; border-radius: 14px; overflow: hidden; background: #10161c; }",
    ".l07-hero__photo { position: absolute; inset: 0; background: radial-gradient(circle at 80% 34%, rgba(255,226,160,.95) 0%, rgba(255,196,120,.55) 16%, rgba(255,170,105,0) 44%), linear-gradient(180deg, #243a63 0%, #6b4a7a 30%, #c46a63 58%, #f2a45f 74%, #7a4f3d 88%, #2a201c 100%); }",
    ".l07-hero__photo::after { content: \"\"; position: absolute; left: -4%; right: -4%; bottom: 0; height: 48%; background: linear-gradient(180deg, rgba(11,18,12,0), #0b120c 76%); clip-path: polygon(0 100%, 0 74%, 12% 58%, 21% 70%, 33% 40%, 44% 66%, 56% 34%, 68% 62%, 79% 46%, 88% 68%, 100% 52%, 100% 100%); }",
    ".l07-hero__mask { position: absolute; inset: 0; }",
    ".l07-hero__copy { position: absolute; left: 22px; right: 22px; top: 50%; transform: translateY(-50%); }",
    ".l07-hero__k { margin: 0 0 9px; font-size: 9.5px; letter-spacing: .22em; font-weight: 800; color: rgba(255,255,255,.78); }",
    ".l07-hero__h { margin: 0; font-size: 24px; line-height: 1.28; font-weight: 800; color: #fff; letter-spacing: .01em; }",
    ".l07-hero__p { margin: 9px 0 0; font-size: 12px; color: rgba(255,255,255,.88); }",
    ".l07-col { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; }",
    ".l07-read { margin: 0; font-family: var(--font-mono); font-size: 10.5px; line-height: 1.7; color: var(--ink-3); text-align: center; }",

    /* ---- 7-11 小图标别放大 ---- */
    ".l07-pair { display: flex; gap: 12px; width: 100%; max-width: 470px; align-items: stretch; }",
    ".l07-card2 { flex: 1 1 0; min-width: 0; background: #fff; border-radius: 14px; padding: 16px 12px 14px; text-align: center; box-shadow: 0 18px 40px -32px rgba(15,23,42,.6); }",
    ".l07-card2__tag { margin: 0 0 10px; font-size: 9px; letter-spacing: .1em; font-weight: 800; color: #8a94a4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
    ".l07-slot { min-height: 96px; display: grid; place-items: center; }",
    ".l07-shape { display: grid; place-items: center; border-radius: 50%; }",
    ".l07-card2__t { margin: 10px 0 0; font-size: 13px; font-weight: 700; color: #1b2733; }",
    ".l07-card2__s { margin: 4px 0 0; font-size: 10.5px; color: #6b7686; }",
    ".l07-bell { display: inline-flex; color: #5b6cff; }",
    ".l07-bell svg { display: block; }",

    /* ---- 7-20 用户上传的图 ---- */
    ".l07-gal { width: 100%; max-width: 470px; }",
    ".l07-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: start; width: 100%; max-width: 470px; margin: 0 auto; }",
    ".l07-tile { position: relative; border-radius: 10px; overflow: hidden; background: #e6eaf0; }",
    ".l07-tile svg { display: block; width: 100%; }",
    ".l07-tile__cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 18px 8px 6px; background: linear-gradient(180deg, rgba(8,12,18,0), rgba(8,12,18,.62)); color: #fff; font-size: 9.5px; font-weight: 600; letter-spacing: .02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",

    /* ---- 7-22 背景渗色 ---- */
    ".l07-bleed { width: 100%; max-width: 470px; box-sizing: border-box; border-radius: 14px; padding: 18px 16px 16px; background: hsl(216 15% 92%); }",
    ".l07-bleed__head { margin: 0 0 12px; font-size: 9.5px; letter-spacing: .16em; font-weight: 800; color: #6d7686; }",
    ".l07-photo { position: relative; width: 100%; max-width: 340px; margin: 0 auto; aspect-ratio: 4 / 3; border-radius: 12px; overflow: hidden; }",
    ".l07-photo svg { display: block; width: 100%; height: 100%; }",
    ".l07-bleed__cap { margin: 12px 0 0; font-size: 10.5px; color: #5f6877; text-align: center; }"
  ].join("\n");
  document.head.appendChild(style);

  var WHITE = [255, 255, 255];

  function mix(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];
  }
  function rgba(c, a) {
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + Math.max(0, Math.min(1, a)).toFixed(2) + ")";
  }

  /* =============================================================== 07-04 */
  RUILive.register("07-4", {
    build: function (body) {
      var state = { mask: "black", strength: 52, filter: false, glow: false };
      var BRIGHT = [255, 214, 140];
      var DARK = [16, 24, 16];

      function wash(rgb) {
        return rgb.map(function (c) {
          var v = 128 + (c - 128) * 0.6;
          return Math.max(0, Math.min(255, Math.round(v * 1.05)));
        });
      }

      var photo = K.el("div", { class: "l07-hero__photo" });
      var mask = K.el("div", { class: "l07-hero__mask" });
      var copy = K.el("div", { class: "l07-hero__copy" }, [
        K.el("p", { class: "l07-hero__k", text: "ESCAPE THE CITY" }),
        K.el("h4", { class: "l07-hero__h", text: "把周末还给自己" }),
        K.el("p", { class: "l07-hero__p", text: "山野露营 · 秋季限定营位" })
      ]);
      var hero = K.el("div", { class: "l07-hero" }, [photo, mask, copy]);
      var read = K.el("p", { class: "l07-read" });
      var col = K.el("div", { class: "l07-col" }, [hero, read]);

      function paint() {
        var t = state.strength / 100;
        var mc = state.mask === "black" ? [10, 14, 20] : [255, 255, 255];
        mask.style.background = rgba(mc, t);
        photo.style.filter = state.filter ? "contrast(.6) brightness(1.05)" : "none";
        copy.style.textShadow = state.glow
          ? "0 0 22px rgba(9,14,20,.7), 0 0 48px rgba(9,14,20,.4)"
          : "none";

        var b = state.filter ? wash(BRIGHT) : BRIGHT;
        var d = state.filter ? wash(DARK) : DARK;
        var cb = K.contrast(mix(b, mc, t), WHITE);
        var cd = K.contrast(mix(d, mc, t), WHITE);
        var worst = Math.min(cb, cd);
        read.textContent = "白字对比度：亮区 " + cb.toFixed(1) + ":1 · 暗区 " + cd.toFixed(1) + ":1 → 最差 " +
          worst.toFixed(1) + ":1" + (worst >= 4.5 ? "（亮处也稳）" : "（亮处会丢字）");
      }
      paint();

      var maskSeg = K.seg({
        label: "蒙版颜色",
        options: [{ value: "black", label: "黑" }, { value: "white", label: "白" }],
        value: "black",
        onChange: function (v) { state.mask = v; paint(); }
      });
      var strength = K.range({
        label: "蒙版浓度", min: 0, max: 80, step: 1, value: 52,
        format: function (v) { return v + "%"; },
        onInput: function (v) { state.strength = v; paint(); }
      });
      var filter = K.toggle({
        label: "降低图片对比度", checked: false,
        onChange: function (on) { state.filter = on; paint(); }
      });
      var glow = K.toggle({
        label: "给文字加一层光晕", checked: false,
        onChange: function (on) { state.glow = on; paint(); }
      });

      body.appendChild(K.controls([maskSeg.el, strength.el, filter.el, glow.el]));
      var canvas = K.canvas();
      canvas.appendChild(col);
      body.appendChild(canvas);
      body.appendChild(K.note("照片里同时有很亮的太阳和很暗的山，白字总有一边会丢。蒙版把整个背景压到一个亮度区间，文字才有稳定的对比度——<b>白色蒙版只适合深色字</b>，配白字会更糟。"));
    }
  });

  /* =============================================================== 07-11 */
  RUILive.register("07-11", {
    build: function (body) {
      var state = { size: 64, fill: true };

      function bell(size) {
        var wrap = K.el("span", { class: "l07-bell" });
        wrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
          'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5"/>' +
          '<path d="M10.3 19a2 2 0 0 0 3.4 0"/></svg>';
        var svg = wrap.querySelector("svg");
        svg.style.width = size + "px";
        svg.style.height = size + "px";
        return { wrap: wrap, svg: svg };
      }

      var rawSlot = K.el("div", { class: "l07-slot" });
      var rawBell = bell(64);
      rawSlot.appendChild(rawBell.wrap);

      var shape = K.el("div", { class: "l07-shape" });
      var shapeSlot = K.el("div", { class: "l07-slot" });
      shapeSlot.appendChild(shape);
      var shapeBell = bell(26);
      shape.appendChild(shapeBell.wrap);

      function card(tag, slot) {
        return K.el("div", { class: "l07-card2" }, [
          K.el("p", { class: "l07-card2__tag", text: tag }),
          slot,
          K.el("p", { class: "l07-card2__t", text: "消息通知" }),
          K.el("p", { class: "l07-card2__s", text: "新消息实时提醒" })
        ]);
      }
      var pair = K.el("div", { class: "l07-pair" }, [
        card("直接放大", rawSlot),
        card("装进形状", shapeSlot)
      ]);
      var read = K.el("p", { class: "l07-read" });

      function paint() {
        var size = state.size;
        var inner = Math.max(16, Math.min(26, Math.round(size * 0.34)));
        rawBell.svg.style.width = size + "px";
        rawBell.svg.style.height = size + "px";
        shapeBell.svg.style.width = inner + "px";
        shapeBell.svg.style.height = inner + "px";
        shape.style.width = size + "px";
        shape.style.height = size + "px";
        shape.style.background = state.fill ? "#e3e8ff" : "transparent";
        read.textContent = "左边：图标直接画成 " + size + "px，笔画跟着等比变粗 · 右边：图标仍是 " + inner +
          "px，形状 " + size + "px 撑住版面";
      }
      paint();

      var size = K.range({
        label: "图标 / 形状尺寸", min: 24, max: 84, step: 2, value: 64,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.size = v; paint(); }
      });
      var fill = K.toggle({
        label: "形状填一层背景色", checked: true,
        onChange: function (on) { state.fill = on; paint(); }
      });

      body.appendChild(K.controls([size.el, fill.el]));
      var canvas = K.canvas();
      canvas.appendChild(K.el("div", { class: "l07-col" }, [pair, read]));
      body.appendChild(canvas);
      body.appendChild(K.note("矢量图放大不会糊，但按 24px 画的图标放大到 3 倍，细节撑不住，看起来又粗又笨。把它按原尺寸放进一个更大的形状里，<b>空间占住了，图标本身却不用变形</b>。"));
    }
  });

  /* =============================================================== 07-20 */
  RUILive.register("07-20", {
    build: function (body) {
      var state = { fill: "cover", height: 150, focus: "mid" };

      function shot(id, w, h, sky, art) {
        return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
          '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient></defs>' +
          '<rect width="' + w + '" height="' + h + '" fill="url(#' + id + ')"/>' + art + '</svg>';
      }

      var defs = [
        {
          cap: "海边日落",
          svg: shot("l07g1", 400, 300, ["#ffb27a", "#f56d6d"],
            '<circle cx="308" cy="86" r="42" fill="#ffe2ab" opacity=".95"/>' +
            '<path d="M0 210 L400 210 L400 300 L0 300 Z" fill="#2c4a63"/>' +
            '<path d="M0 212 C90 198 150 226 230 214 C300 204 350 218 400 210 L400 300 L0 300 Z" fill="#3d6584" opacity=".85"/>' +
            '<path d="M64 300 L64 168" stroke="#1d2b36" stroke-width="7" stroke-linecap="round"/>' +
            '<path d="M64 172 C40 158 26 176 20 196 M64 172 C92 156 104 178 110 198 M64 172 C44 150 60 138 78 142" stroke="#1d2b36" stroke-width="6" fill="none" stroke-linecap="round"/>')
        },
        {
          cap: "山间小屋",
          svg: shot("l07g2", 300, 400, ["#bfe3f2", "#e9f4ee"],
            '<circle cx="236" cy="74" r="30" fill="#fff3cf" opacity=".9"/>' +
            '<path d="M0 250 L86 140 L150 250 Z" fill="#6c8296"/>' +
            '<path d="M92 250 L190 118 L300 250 Z" fill="#556c80"/>' +
            '<path d="M0 250 L300 250 L300 400 L0 400 Z" fill="#41604b"/>' +
            '<path d="M186 318 L186 268 L232 268 L232 318 Z" fill="#d9c7a4"/>' +
            '<path d="M178 268 L209 240 L240 268 Z" fill="#8a5a44"/>')
        },
        {
          cap: "城市夜景",
          svg: shot("l07g3", 400, 300, ["#1b2a44", "#3b4f74"],
            '<circle cx="330" cy="58" r="22" fill="#f4f0d8" opacity=".9"/>' +
            '<rect x="30" y="150" width="58" height="150" fill="#243447"/>' +
            '<rect x="98" y="110" width="46" height="190" fill="#1c2a3a"/>' +
            '<rect x="154" y="170" width="64" height="130" fill="#2b3d52"/>' +
            '<rect x="228" y="128" width="52" height="172" fill="#1a2836"/>' +
            '<rect x="290" y="182" width="80" height="118" fill="#243447"/>' +
            '<g fill="#ffd88a" opacity=".85"><rect x="42" y="164" width="8" height="8"/><rect x="58" y="164" width="8" height="8"/>' +
            '<rect x="42" y="184" width="8" height="8"/><rect x="110" y="126" width="7" height="7"/><rect x="126" y="146" width="7" height="7"/>' +
            '<rect x="170" y="186" width="8" height="8"/><rect x="192" y="206" width="8" height="8"/><rect x="240" y="144" width="7" height="7"/>' +
            '<rect x="258" y="166" width="7" height="7"/><rect x="306" y="198" width="8" height="8"/><rect x="330" y="222" width="8" height="8"/></g>')
        },
        {
          cap: "花田",
          svg: shot("l07g4", 300, 400, ["#cfe9f7", "#f2f6d9"],
            '<circle cx="72" cy="82" r="34" fill="#fff2c4" opacity=".95"/>' +
            '<path d="M0 210 C70 186 150 224 300 194 L300 400 L0 400 Z" fill="#7fae5a"/>' +
            '<path d="M0 268 C90 244 190 292 300 258 L300 400 L0 400 Z" fill="#5f9146"/>' +
            '<g fill="#f2c94c"><circle cx="46" cy="292" r="7"/><circle cx="92" cy="318" r="6"/><circle cx="138" cy="286" r="7"/>' +
            '<circle cx="188" cy="330" r="6"/><circle cx="238" cy="300" r="7"/><circle cx="266" cy="352" r="6"/>' +
            '<circle cx="66" cy="360" r="6"/><circle cx="150" cy="368" r="7"/></g>')
        }
      ];

      var tiles = defs.map(function (d) {
        var tile = K.el("div", { class: "l07-tile" });
        tile.innerHTML = d.svg;
        tile.appendChild(K.el("span", { class: "l07-tile__cap", text: d.cap }));
        return { root: tile, svg: tile.querySelector("svg") };
      });
      var grid = K.el("div", { class: "l07-grid" }, tiles.map(function (t) { return t.root; }));
      var read = K.el("p", { class: "l07-read" });

      var FOCUS = { min: "xMinYMin", mid: "xMidYMid", max: "xMaxYMax" };

      function paint() {
        tiles.forEach(function (t) {
          var cover = state.fill !== "fit";
          t.svg.setAttribute("preserveAspectRatio", FOCUS[state.focus] + " " + (state.fill === "contain" ? "meet" : "slice"));
          t.svg.style.height = cover ? "100%" : "auto";
          t.svg.style.width = "100%";
          t.root.style.height = cover ? state.height + "px" : "auto";
        });
        if (state.fill === "cover") {
          read.textContent = "统一裁进 " + state.height + "px 高的框 · 每张图裁掉一部分，网格齐平";
        } else if (state.fill === "contain") {
          read.textContent = "完整塞进 " + state.height + "px 高的框 · 图变小、留白，网格还是齐的";
        } else {
          read.textContent = "按原始比例展示 · 行高被竖图撑开，网格开始错位";
        }
      }
      paint();

      var fill = K.seg({
        label: "填充方式",
        options: [
          { value: "cover", label: "居中裁切" },
          { value: "contain", label: "完整显示" },
          { value: "fit", label: "原始比例" }
        ],
        value: "cover",
        onChange: function (v) { state.fill = v; paint(); }
      });
      var height = K.range({
        label: "图片区高度", min: 90, max: 220, step: 2, value: 150,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.height = v; paint(); }
      });
      var focus = K.seg({
        label: "裁切焦点",
        options: [
          { value: "min", label: "左上" },
          { value: "mid", label: "居中" },
          { value: "max", label: "右下" }
        ],
        value: "mid",
        onChange: function (v) { state.focus = v; paint(); }
      });

      body.appendChild(K.controls([fill.el, height.el, focus.el]));
      var canvas = K.canvas();
      canvas.appendChild(K.el("div", { class: "l07-col" }, [grid, read]));
      body.appendChild(canvas);
      body.appendChild(K.note("用户上传的图，宽高比什么都有。让它们按原始比例进网格，页面结构就被图片牵着走了；<b>固定尺寸 + 居中裁切（object-fit: cover）</b>，形状由你决定，图片只负责填满。"));
    }
  });

  /* =============================================================== 07-22 */
  RUILive.register("07-22", {
    build: function (body) {
      var state = { fix: "none", strength: 55, light: 94 };

      var photo = K.el("div", { class: "l07-photo" });
      photo.innerHTML = '<svg viewBox="0 0 300 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<path d="M74 225c0-45 34-76 76-76s76 31 76 76z" fill="#8ba1b6"/>' +
        '<circle cx="150" cy="97" r="35" fill="#d8b69a"/>' +
        '<path d="M115 97a35 35 0 0 1 70 0c0-31-14-48-35-48s-35 17-35 48z" fill="#4a3f36"/>' +
        '<path d="M136 158h28l-14 23z" fill="#eef3f7"/>' +
        '</svg>';
      var head = K.el("p", { class: "l07-bleed__head", text: "用户上传 · 旅行相册" });
      var panel = K.el("div", { class: "l07-bleed" }, [head, photo]);
      var read = K.el("p", { class: "l07-read" });

      function paint() {
        var s = state.strength / 100;
        photo.style.background = K.hsl(216, 13, state.light);
        if (state.fix === "border") {
          photo.style.boxShadow = "0 0 0 2px rgba(15,23,42," + (0.06 + 0.26 * s).toFixed(2) + ")";
        } else if (state.fix === "inner") {
          photo.style.boxShadow = "inset 0 0 0 1px rgba(15,23,42," + (0.03 + 0.09 * s).toFixed(2) +
            "), inset 0 5px 22px rgba(15,23,42," + (0.04 + 0.2 * s).toFixed(2) + ")";
        } else if (state.fix === "line") {
          photo.style.boxShadow = "inset 0 0 0 1px rgba(15,23,42," + (0.06 + 0.28 * s).toFixed(2) + ")";
        } else {
          photo.style.boxShadow = "none";
        }
        var diff = state.light - 92;
        read.textContent = "图片背景 hsl(216 13% " + state.light + "%) · 界面 hsl(216 15% 92%) · 明度差 " +
          (diff > 0 ? "+" : "") + diff + "%";
      }
      paint();

      var fix = K.seg({
        label: "处理方式",
        options: [
          { value: "none", label: "不处理" },
          { value: "border", label: "外边框" },
          { value: "inner", label: "内阴影" },
          { value: "line", label: "内边框" }
        ],
        value: "none",
        onChange: function (v) { state.fix = v; paint(); }
      });
      var strength = K.range({
        label: "处理强度", min: 0, max: 100, step: 1, value: 55,
        format: function (v) { return v + "%"; },
        onInput: function (v) { state.strength = v; paint(); }
      });
      var light = K.range({
        label: "照片背景明度", min: 86, max: 100, step: 1, value: 94,
        format: function (v) { return v + "%"; },
        onInput: function (v) { state.light = v; paint(); }
      });

      body.appendChild(K.controls([fix.el, strength.el, light.el]));
      var canvas = K.canvas();
      canvas.appendChild(K.el("div", { class: "l07-col" }, [panel, read]));
      body.appendChild(canvas);
      body.appendChild(K.note("用户照片的背景色一旦接近界面底色，圆角就消失了，图看起来像浮在页面上的色块。加粗边框会把照片变成一张「卡片」；<b>一层很轻的内阴影（或内边框）</b>既能定住形状，又不抢图片本身。"));
    }
  });
})();
