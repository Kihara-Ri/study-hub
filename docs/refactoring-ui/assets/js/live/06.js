/* 第 6 章 · 营造层次感 —— 实时重制图（live-c） */
(function () {
  "use strict";
  var K = window.RUILive.kit;

  var style = document.createElement("style");
  style.id = "lv-06-style";
  style.textContent = [
    /* ---- 6-12 模拟光源 ---- */
    ".l06-panel { width: 100%; max-width: 470px; box-sizing: border-box; border-radius: 14px; padding: 22px 20px; background: #39404e; color: #e8edf5; box-shadow: 0 26px 54px -34px rgba(8,13,22,.9); }",
    ".l06-panel__kicker { margin: 0 0 6px; font-size: 10px; letter-spacing: .18em; font-weight: 700; color: #8d97a9; }",
    ".l06-panel__title { margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #f2f5fa; }",
    ".l06-form { display: flex; gap: 10px; align-items: stretch; flex-wrap: wrap; }",
    ".l06-input { flex: 1 1 150px; min-width: 0; width: 100%; height: 42px; box-sizing: border-box; border: 0; border-radius: 9px; padding: 0 13px; font: inherit; font-size: 13px; color: #e9eef6; outline: none; }",
    ".l06-input::placeholder { color: #98a2b4; }",
    ".l06-btn { flex: 0 0 auto; height: 42px; padding: 0 20px; border: 0; border-radius: 9px; background: #5b6cff; color: #fff; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; box-sizing: border-box; }",
    ".l06-btn:hover { background: #6c7aff; }",
    ".l06-checkrow { position: relative; display: inline-flex; align-items: center; gap: 10px; margin-top: 18px; font-size: 13px; color: #c6cdda; cursor: pointer; }",
    ".l06-check { position: absolute; width: 1px; height: 1px; opacity: 0; }",
    ".l06-checkbox { width: 22px; height: 22px; flex: none; box-sizing: border-box; border: 0; border-radius: 7px; display: grid; place-items: center; font-size: 12px; line-height: 1; color: #e9eef6; }",
    ".l06-check:checked + .l06-checkbox::after { content: \"✓\"; }",
    ".l06-check:focus-visible + .l06-checkbox { outline: 2px solid #9aa9ff; outline-offset: 2px; }",
    ".l06-css { margin: 18px 0 0; font-family: var(--font-mono); font-size: 10.5px; line-height: 1.65; color: #8d97a9; word-break: break-word; }",

    /* ---- 6-23 双层阴影 ---- */
    ".l06-shade { width: 100%; box-sizing: border-box; background: #eceef2; border-radius: 14px; padding: 20px 16px; }",
    ".l06-shade__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(178px, 1fr)); gap: 18px; align-items: start; }",
    ".l06-shadow { min-width: 0; }",
    ".l06-shadow__label { margin: 0 0 9px; font-size: 9.5px; letter-spacing: .14em; font-weight: 800; color: #7c8698; }",
    ".l06-shadow__card { display: flex; align-items: center; gap: 11px; background: #fff; border-radius: 12px; padding: 14px 13px; }",
    ".l06-app { width: 42px; height: 42px; flex: none; border-radius: 12px; background: linear-gradient(150deg, #93d8ff, #2f7fd6); display: grid; place-items: center; }",
    ".l06-app i { position: relative; width: 21px; height: 15px; border-radius: 8px 8px 8px 2px; background: #fff; }",
    ".l06-app i::after { content: \"\"; position: absolute; left: 4px; top: 6px; width: 3px; height: 3px; border-radius: 50%; background: #2f7fd6; box-shadow: 5px 0 0 #2f7fd6, 10px 0 0 #2f7fd6; }",
    ".l06-shadow__name { margin: 0; font-size: 13.5px; font-weight: 700; color: #1b2733; }",
    ".l06-shadow__sub { margin: 3px 0 0; font-size: 11px; color: #6b7686; }",
    ".l06-shadow__css { margin: 10px 0 0; font-family: var(--font-mono); font-size: 9.5px; line-height: 1.6; color: #7c8698; word-break: break-word; }",

    /* ---- 6-26 扁平层次 ---- */
    ".l06-flat { width: 100%; max-width: 430px; box-sizing: border-box; border-radius: 14px; padding: 22px 18px 18px; background: hsl(216 15% 90%); display: flex; flex-direction: column; align-items: center; gap: 14px; }",
    ".l06-login { width: 100%; box-sizing: border-box; border-radius: 12px; padding: 18px 16px; }",
    ".l06-login__h { margin: 0 0 14px; font-size: 18px; font-weight: 700; color: #1b2733; text-align: center; letter-spacing: -.01em; }",
    ".l06-field2 { height: 38px; box-sizing: border-box; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 12px; font-size: 12px; color: #6b7686; margin-bottom: 10px; background: rgba(15,23,42,.05); }",
    ".l06-field2 b { color: #5b6cff; font-weight: 600; }",
    ".l06-login__btn { width: 100%; height: 40px; margin-top: 4px; border: 0; border-radius: 8px; background: #6366f1; color: #fff; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }",
    ".l06-login__btn:hover { background: #7376f5; }",
    ".l06-banner { width: 100%; box-sizing: border-box; border-radius: 10px; padding: 13px; text-align: center; font-size: 12px; color: #3b4655; }",
    ".l06-banner b { color: #1b2733; }",
    ".l06-flat__read { margin: 0; font-family: var(--font-mono); font-size: 10.5px; color: #4f5a68; text-align: center; }",

    /* ---- 6-28 重叠出层次 ---- */
    ".l06-trip { width: 100%; max-width: 540px; border-radius: 14px; overflow: hidden; background: #f2f4f7; box-shadow: 0 22px 46px -34px rgba(15,23,42,.65); }",
    ".l06-trip__hero { position: relative; height: 174px; overflow: hidden; background: radial-gradient(110% 80% at 78% 16%, rgba(255,246,220,.92), rgba(255,246,220,0) 46%), linear-gradient(170deg, #7fb4d8 0%, #4a7fa8 38%, #2a5a7f 66%, #173a56 100%); }",
    ".l06-trip__nav { position: relative; z-index: 2; display: flex; align-items: center; gap: 9px; padding: 12px 16px 0; }",
    ".l06-trip__logo { width: 19px; height: 19px; flex: none; border-radius: 6px; background: #fff; }",
    ".l06-trip__brand { font-size: 11px; font-weight: 700; color: #fff; letter-spacing: .04em; }",
    ".l06-trip__links { margin-left: auto; font-size: 9.5px; color: rgba(255,255,255,.82); white-space: nowrap; }",
    ".l06-trip__h { position: relative; z-index: 2; margin: 17px 0 0; text-align: center; font-size: 21px; font-weight: 800; letter-spacing: .02em; color: #fff; text-shadow: 0 2px 12px rgba(10,24,40,.35); }",
    ".l06-trip__sky { position: absolute; left: 0; right: 0; bottom: 0; height: 78px; background: linear-gradient(180deg, #143a58, #0d2a42); clip-path: polygon(0 100%, 0 62%, 5% 62%, 5% 44%, 10% 44%, 10% 58%, 15% 58%, 15% 32%, 20% 32%, 20% 64%, 26% 64%, 26% 48%, 31% 48%, 31% 24%, 36% 24%, 36% 58%, 42% 58%, 42% 38%, 47% 38%, 47% 52%, 53% 52%, 53% 28%, 58% 28%, 58% 62%, 64% 62%, 64% 42%, 69% 42%, 69% 30%, 74% 30%, 74% 56%, 80% 56%, 80% 40%, 85% 40%, 85% 60%, 90% 60%, 90% 46%, 95% 46%, 95% 62%, 100% 62%, 100% 100%); }",
    ".l06-trip__body { position: relative; padding: 0 20px 18px; }",
    ".l06-search { position: relative; z-index: 3; box-sizing: border-box; background: #fff; border-radius: 12px; padding: 12px 12px 13px; }",
    ".l06-search__row { display: flex; gap: 8px; flex-wrap: wrap; }",
    ".l06-search__row + .l06-search__row { margin-top: 8px; }",
    ".l06-pill { flex: 1 1 72px; min-width: 0; height: 31px; border-radius: 7px; background: #eef1f5; display: flex; align-items: center; padding: 0 9px; font-size: 10.5px; color: #55606e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
    ".l06-pill--city { flex: 1 1 70px; background: #f6f8fb; border: 1px solid #e6eaf0; }",
    ".l06-search__btn { flex: 0 0 auto; height: 31px; padding: 0 16px; border: 0; border-radius: 7px; background: #e0b23c; color: #3b2c0a; font: inherit; font-size: 11px; font-weight: 700; cursor: pointer; }",
    ".l06-search__btn:hover { background: #eabf4d; }",
    ".l06-trip__sub { margin: 18px 0 9px; font-size: 12px; font-weight: 700; color: #33404f; }",
    ".l06-trip__row { display: flex; gap: 10px; }",
    ".l06-trip__photo { flex: 1 1 0; min-width: 0; height: 58px; border-radius: 8px; background: radial-gradient(circle at 74% 26%, #fff8d8 0 9%, rgba(255,248,216,0) 10%), linear-gradient(150deg, #a8d3b0, #4f8f6d); }",
    ".l06-trip__photo--b { background: radial-gradient(circle at 74% 26%, #fff3cf 0 9%, rgba(255,243,207,0) 10%), linear-gradient(150deg, #f0b98a, #c06a55); }"
  ].join("\n");
  document.head.appendChild(style);

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
  var W = [255, 255, 255];
  var B = [0, 0, 0];
  var PANEL = [57, 64, 78];
  var RAISED = [79, 89, 107];
  var INSET = [43, 49, 60];

  /* =============================================================== 6-12 */
  RUILive.register("06-12", {
    build: function (body) {
      var state = { profile: "inset", light: 64, blur: 3 };

      var email = K.el("input", { class: "l06-input", type: "email", placeholder: "输入你的邮箱", "aria-label": "邮箱地址" });
      var btn = K.el("button", { class: "l06-btn", type: "button", text: "订阅" });
      var check = K.el("input", { class: "l06-check", type: "checkbox" });
      var box = K.el("span", { class: "l06-checkbox", "aria-hidden": "true" });
      var row = K.el("label", { class: "l06-checkrow" }, [check, box, "偶尔给我发促销邮件"]);
      var readout = K.el("p", { class: "l06-css" });
      var panel = K.el("div", { class: "l06-panel" }, [
        K.el("p", { class: "l06-panel__kicker", text: "WEEKLY NOTES" }),
        K.el("h4", { class: "l06-panel__title", text: "订阅我们的通讯" }),
        K.el("div", { class: "l06-form" }, [email, btn]),
        row,
        readout
      ]);

      function paint() {
        var s = state.light / 100;
        var raised = state.profile === "raised";
        var bg = mix(PANEL, raised ? RAISED : INSET, s);
        var borderTop = raised ? rgba(W, 0.34 * s) : rgba(B, 0.5 * s);
        var borderBottom = raised ? rgba(B, 0.36 * s) : rgba(W, 0.18 * s);
        var shadow = raised
          ? "0 3px " + state.blur + "px " + rgba(B, 0.55 * s)
          : "inset 0 2px " + state.blur + "px " + rgba(B, 0.55 * s) + ", inset 0 -1px 0 " + rgba(W, 0.1 * s);

        function applyCtl(node) {
          node.style.background = K.rgbCss(bg);
          node.style.borderTop = "1px solid " + borderTop;
          node.style.borderBottom = "1px solid " + borderBottom;
          node.style.boxShadow = shadow;
        }
        applyCtl(email);
        applyCtl(box);

        btn.style.borderTop = "1px solid " + rgba(W, 0.1 + 0.24 * s);
        btn.style.borderBottom = "1px solid " + rgba(B, 0.3 * s);
        btn.style.boxShadow = "0 2px " + Math.round(state.blur * 0.7) + "px " + rgba(B, 0.5 * s);

        readout.textContent = (raised ? "凸起" : "内凹") + " · box-shadow: " + shadow + ";";
      }
      paint();

      var seg = K.seg({
        label: "剖面",
        options: [{ value: "inset", label: "内凹" }, { value: "raised", label: "凸起" }],
        value: "inset",
        onChange: function (v) { state.profile = v; paint(); }
      });
      var light = K.range({
        label: "光源强度", min: 0, max: 100, step: 1, value: 64,
        format: function (v) { return v + "%"; },
        onInput: function (v) { state.light = v; paint(); }
      });
      var blur = K.range({
        label: "阴影扩散", min: 0, max: 12, step: 1, value: 3,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.blur = v; paint(); }
      });

      body.appendChild(K.controls([seg.el, light.el, blur.el]));
      var canvas = K.canvas();
      canvas.appendChild(panel);
      body.appendChild(canvas);
      body.appendChild(K.note("光源在头顶：上沿更亮、下沿更暗。<b>凸起</b>是上亮 + 下方投影，<b>内凹</b>是上暗 + 下沿亮——方向反过来，同一个控件就陷进页面了。"));
    }
  });

  /* =============================================================== 6-23 */
  RUILive.register("06-23", {
    build: function (body) {
      var state = { big: 30, small: 45, combined: true };

      function makeCard(label) {
        var css = K.el("p", { class: "l06-shadow__css" });
        var card = K.el("div", { class: "l06-shadow__card" }, [
          K.el("div", { class: "l06-app" }, [K.el("i")]),
          K.el("div", {}, [
            K.el("p", { class: "l06-shadow__name", text: "ChitChat" }),
            K.el("p", { class: "l06-shadow__sub", text: "你有新消息" })
          ])
        ]);
        var root = K.el("div", { class: "l06-shadow" }, [
          K.el("p", { class: "l06-shadow__label", text: label }),
          card,
          css
        ]);
        return { root: root, card: card, css: css };
      }
      var c1 = makeCard("直射光 · 大而柔");
      var c2 = makeCard("环境光 · 小而紧");
      var c3 = makeCard("合成 · 两层一起用");
      var shade = K.el("div", { class: "l06-shade" }, [
        K.el("div", { class: "l06-shade__grid" }, [c1.root, c2.root, c3.root])
      ]);

      function paint() {
        var b = state.big;
        var a = state.small / 100;
        var bigS = "0 " + Math.round(b * 0.45) + "px " + b + "px rgba(15,23,42,0.14)";
        var smallS = "0 2px 5px rgba(15,23,42," + (a * 0.85).toFixed(2) + ")";
        c1.card.style.boxShadow = bigS;
        c2.card.style.boxShadow = smallS;
        c3.card.style.boxShadow = state.combined ? bigS + ", " + smallS : bigS;
        c1.css.textContent = "box-shadow: " + bigS + ";";
        c2.css.textContent = "box-shadow: " + smallS + ";";
        c3.css.textContent = "box-shadow: " + (state.combined ? bigS + ", " + smallS : bigS) + ";";
      }
      paint();

      var big = K.range({
        label: "大阴影模糊", min: 6, max: 64, step: 2, value: 30,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.big = v; paint(); }
      });
      var small = K.range({
        label: "小阴影浓度", min: 0, max: 100, step: 1, value: 45,
        format: function (v) { return v + "%"; },
        onInput: function (v) { state.small = v; paint(); }
      });
      var combo = K.toggle({
        label: "合成卡叠加两层阴影", checked: true,
        onChange: function (on) { state.combined = on; paint(); }
      });

      body.appendChild(K.controls([big.el, small.el, combo.el]));
      var canvas = K.canvas();
      canvas.appendChild(shade);
      body.appendChild(canvas);
      body.appendChild(K.note("第一层大而柔的阴影负责「离地」，第二层小而紧的阴影负责「贴地」。分开调比一层大阴影可控得多——高度越高，那层小阴影反而要越轻。"));
    }
  });

  /* =============================================================== 6-26 */
  RUILive.register("06-26", {
    build: function (body) {
      var state = { dir: "float", delta: 7, solid: false };

      var card = K.el("div", { class: "l06-login" }, [
        K.el("p", { class: "l06-login__h", text: "登录你的账户" }),
        K.el("div", { class: "l06-field2" }, [K.el("span", { text: "用户名" })]),
        K.el("div", { class: "l06-field2" }, [K.el("span", { text: "密码" }), K.el("b", { text: "忘记？" })]),
        K.el("button", { class: "l06-login__btn", type: "button", text: "登录" })
      ]);
      var banner = K.el("div", { class: "l06-banner", html: "还没有账号？ <b>立即注册</b>" });
      var read = K.el("p", { class: "l06-flat__read" });
      var flat = K.el("div", { class: "l06-flat" }, [card, banner, read]);

      function paint() {
        var up = state.dir === "float";
        var L = 90 + (up ? 1 : -1) * state.delta;
        card.style.background = K.hsl(216, 18, L);
        banner.style.background = K.hsl(216, 14, 85);
        card.style.boxShadow = state.solid ? "0 5px 0 rgba(15,23,42,0.13)" : "none";
        var ratio = K.contrast(K.hslToRgb(216, 18, L), [27, 39, 51]);
        read.textContent = "卡片" + (up ? "比背景浅" : "比背景深") + " " + state.delta + "% · 正文对比度 " + ratio.toFixed(1) + ":1";
      }
      paint();

      var dir = K.seg({
        label: "层次方向",
        options: [{ value: "float", label: "浮起来" }, { value: "sunken", label: "陷进去" }],
        value: "float",
        onChange: function (v) { state.dir = v; paint(); }
      });
      var delta = K.range({
        label: "与背景的明度差", min: 0, max: 9, step: 1, value: 7,
        format: function (v) { return "±" + v + "%"; },
        onInput: function (v) { state.delta = v; paint(); }
      });
      var solid = K.toggle({
        label: "再加一条实心阴影", checked: false,
        onChange: function (on) { state.solid = on; paint(); }
      });

      body.appendChild(K.controls([dir.el, delta.el, solid.el]));
      var canvas = K.canvas();
      canvas.appendChild(flat);
      body.appendChild(canvas);
      body.appendChild(K.note("扁平不等于没有层次：同色系里<b>浅一点就离你近，深一点就退到后面</b>。再加一条不模糊的短阴影，卡片就真的离开了页面。"));
    }
  });

  /* =============================================================== 6-28 */
  RUILive.register("06-28", {
    build: function (body) {
      var state = { overlap: 52, out: 8, shadow: true };

      var hero = K.el("div", { class: "l06-trip__hero" }, [
        K.el("div", { class: "l06-trip__nav" }, [
          K.el("i", { class: "l06-trip__logo" }),
          K.el("span", { class: "l06-trip__brand", text: "远行" }),
          K.el("span", { class: "l06-trip__links", text: "机票 · 酒店 · 租车" })
        ]),
        K.el("p", { class: "l06-trip__h", text: "你想去哪里？" }),
        K.el("div", { class: "l06-trip__sky" })
      ]);
      var card = K.el("div", { class: "l06-search" }, [
        K.el("div", { class: "l06-search__row" }, [
          K.el("span", { class: "l06-pill", text: "往返" }),
          K.el("span", { class: "l06-pill", text: "1 位乘客" }),
          K.el("span", { class: "l06-pill", text: "经济舱" })
        ]),
        K.el("div", { class: "l06-search__row" }, [
          K.el("span", { class: "l06-pill l06-pill--city", text: "多伦多" }),
          K.el("span", { class: "l06-pill l06-pill--city", text: "罗马" }),
          K.el("button", { class: "l06-search__btn", type: "button", text: "搜索" })
        ])
      ]);
      var trip = K.el("div", { class: "l06-trip" }, [
        hero,
        K.el("div", { class: "l06-trip__body" }, [
          card,
          K.el("p", { class: "l06-trip__sub", text: "为你推荐的行程" }),
          K.el("div", { class: "l06-trip__row" }, [
            K.el("i", { class: "l06-trip__photo" }),
            K.el("i", { class: "l06-trip__photo l06-trip__photo--b" })
          ])
        ])
      ]);

      function paint() {
        card.style.marginTop = (16 - state.overlap) + "px";
        card.style.marginLeft = -state.out + "px";
        card.style.marginRight = -state.out + "px";
        card.style.boxShadow = state.shadow ? "0 18px 38px -18px rgba(15,23,42,0.45)" : "none";
      }
      paint();

      var overlap = K.range({
        label: "卡片上移量", min: 0, max: 90, step: 2, value: 52,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.overlap = v; paint(); }
      });
      var out = K.range({
        label: "左右外扩", min: 0, max: 18, step: 1, value: 8,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.out = v; paint(); }
      });
      var shadow = K.toggle({
        label: "卡片带阴影", checked: true,
        onChange: function (on) { state.shadow = on; paint(); }
      });

      body.appendChild(K.controls([overlap.el, out.el, shadow.el]));
      var canvas = K.canvas();
      canvas.appendChild(trip);
      body.appendChild(canvas);
      body.appendChild(K.note("与其把卡片完整包进某个区块，不如让它<b>跨在两种背景的交界处</b>。重叠是制造层次最便宜的办法：0px 时它只是一张卡片，往上挪一点，整页就有了前后。"));
    }
  });
})();
