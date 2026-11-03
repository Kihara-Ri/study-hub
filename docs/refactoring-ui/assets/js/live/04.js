/* ==========================================================================
   第 4 章 · 实时重制图（文字设计）
   04-1  字号阶梯：一张商品页用了几种字号
   04-18 对齐基线：标题和旁边的小操作
   04-22 行长 × 行高：文章页的阅读宽度
   04-40 字距 × 大小写：SaaS 落地页大标题
   ========================================================================== */
(function () {
  "use strict";
  var K = window.RUILive.kit;

  // 让 .lv-canvas 的网格列跟随画布宽度，避免长内容把画布撑宽（窄屏横向溢出）
  function liveCanvas() {
    var cv = K.canvas();
    cv.style.gridTemplateColumns = "minmax(0,1fr)";
    return cv;
  }

  var style = document.createElement("style");
  style.id = "lv-04-style";
  style.textContent = [
    /* ---------------------------------------------------------- shared */
    ".l04-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:12px}",
    ".l04-wrap [data-k]{transition:font-size .14s ease}",
    "@media(max-width:600px){.lv-canvas .l04-wrap{gap:10px}}",

    /* --------------------------------------------------- 04-1 商品页 */
    ".l04-shop{width:100%;max-width:560px;display:grid;grid-template-columns:.92fr 1.08fr;background:#fff;border:1px solid #e3e8ee;border-radius:12px;overflow:hidden;box-shadow:0 20px 46px -34px rgba(20,32,48,.55)}",
    ".l04-shop__media{position:relative;display:grid;place-items:center;min-height:250px;background:linear-gradient(160deg,#f5efe5,#e8ddcb)}",
    ".l04-shop__tag{position:absolute;top:12px;left:12px;font-size:10px;font-weight:700;letter-spacing:.08em;color:#6b5a45;background:rgba(255,255,255,.85);border:1px solid rgba(120,100,70,.18);border-radius:999px;padding:3px 9px}",
    ".l04-sofa{position:relative;width:78%;aspect-ratio:16/10;filter:drop-shadow(0 12px 16px rgba(90,66,42,.2))}",
    ".l04-sofa i{position:absolute;display:block}",
    ".l04-sofa__back{left:8%;right:8%;top:5%;height:52%;border-radius:13px 13px 5px 5px;background:linear-gradient(172deg,#c9885a,#a76a42);z-index:1}",
    ".l04-sofa__cush{top:13%;width:36%;height:33%;border-radius:9px;background:linear-gradient(172deg,#d79a69,#bd8052);z-index:2}",
    ".l04-sofa__cush--l{left:11%}",
    ".l04-sofa__cush--r{right:11%}",
    ".l04-sofa__seat{left:4%;right:4%;bottom:16%;height:30%;border-radius:9px;background:linear-gradient(180deg,#d4925f,#b17149);z-index:3}",
    ".l04-sofa__arm{bottom:12%;width:11%;height:40%;border-radius:9px;background:linear-gradient(180deg,#cd8a5c,#a9693f);z-index:4}",
    ".l04-sofa__arm--l{left:0}",
    ".l04-sofa__arm--r{right:0}",
    ".l04-sofa__leg{bottom:4%;width:5%;height:12%;border-radius:2px;background:#6a4a33;z-index:1}",
    ".l04-sofa__leg--l{left:16%}",
    ".l04-sofa__leg--r{right:16%}",
    ".l04-shop__info{padding:19px 20px 17px;display:flex;flex-direction:column;gap:9px;min-width:0}",
    ".l04-brand{font-size:9.5px;font-weight:700;letter-spacing:.15em;color:#96a1ad}",
    ".l04-shop__title{margin:0;color:#1f2933;font-weight:800;line-height:1.25;letter-spacing:-.01em}",
    ".l04-shop__more{color:#2f5d8a;text-decoration:underline;text-underline-offset:2px;line-height:1.35;cursor:pointer}",
    ".l04-pick{display:flex;align-items:center;gap:7px;color:#52606d}",
    ".l04-pick__label{color:#7b8794;line-height:1.4}",
    ".l04-dot{width:15px;height:15px;border-radius:50%;border:1px solid rgba(0,0,0,.12);flex:none}",
    ".l04-dot.is-on{box-shadow:0 0 0 2px #fff,0 0 0 3px #2f5d8a}",
    ".l04-price{font-weight:800;color:#1f2933;line-height:1.1;letter-spacing:-.01em}",
    ".l04-warranty{margin:0;color:#6b7684;line-height:1.55}",
    ".l04-buy{align-self:flex-start;border-radius:7px;background:#1f2933;color:#fff;font-weight:700;padding:9px 13px;line-height:1.2;cursor:pointer}",
    ".l04-stock{display:flex;align-items:center;gap:5px;color:#1f7a4d;font-weight:700;line-height:1.3}",
    ".l04-stock::before{content:\"\";width:6px;height:6px;border-radius:50%;background:#1f7a4d;flex:none}",
    ".l04-deliv{border-top:1px solid #edf0f4;padding-top:10px;margin-top:2px;display:flex;flex-direction:column;gap:7px}",
    ".l04-deliv__h{font-weight:700;color:#1f2933;line-height:1.3}",
    ".l04-deliv__row{display:flex;gap:6px}",
    ".l04-input{flex:1;min-width:0;border:1px solid #dbe2ea;background:#f5f8fb;border-radius:5px;padding:7px 9px;font-size:12px;color:#9aa5b1}",
    ".l04-mini{border:1px solid #dbe2ea;background:#fff;border-radius:5px;padding:7px 10px;font-size:12px;font-weight:700;color:#52606d}",
    ".l04-hint{color:#8792a0;line-height:1.4}",
    ".l04-sz{display:inline-block;margin-left:4px;font-family:var(--font-mono);font-size:9px;line-height:1.5;font-weight:700;color:#b42318;background:#fff5f4;border:1px solid #f4c9c4;border-radius:3px;padding:0 3px;vertical-align:.4em;letter-spacing:0}",
    ".l04-buy .l04-sz{color:#ffd9d4;background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.32)}",
    ".l04-sizes{width:100%;max-width:560px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;background:#fff;border:1px solid #e3e8ee;border-radius:9px;padding:9px 12px;font-size:11px;color:#52606d}",
    ".l04-sizes b{color:#1f2933}",
    ".l04-sizechip{font-family:var(--font-mono);font-size:10px;font-weight:700;color:#2f5d8a;background:#eef4fb;border:1px solid #d6e3f2;border-radius:4px;padding:1px 5px}",
    ".l04-sizes__state{color:#7b8794;margin-left:auto}",
    "@media(max-width:600px){.l04-shop{grid-template-columns:1fr}.l04-shop__media{min-height:146px}.l04-shop__info{padding:15px}.l04-sizes__state{margin-left:0;flex-basis:100%}}",

    /* ------------------------------------------------- 04-18 基线对齐 */
    ".l04-follow{width:100%;max-width:440px;background:#fff;border:1px solid #e3e8ee;border-radius:12px;padding:16px 20px 6px;box-shadow:0 20px 44px -34px rgba(20,32,48,.55)}",
    ".l04-follow__head{position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:12px;border-bottom:1px solid #eef1f5}",
    ".l04-follow__title{margin:0;font-size:28px;line-height:1.2;font-weight:800;color:#1d2733;letter-spacing:-.015em}",
    ".l04-follow__acts{display:flex;align-items:center;gap:8px;font-size:14px;line-height:1.2;font-weight:700;color:#2f5d8a;white-space:nowrap}",
    ".l04-follow__dot{color:#c3cbd6;font-weight:400}",
    ".l04-guide{position:absolute;left:0;right:0;height:0;display:block;border-top:1px dashed;pointer-events:none;opacity:.82}",
    ".l04-guide--t{border-color:#2f5d8a}",
    ".l04-guide--a{border-color:#c22525}",
    ".l04-follow__row{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #f2f4f7}",
    ".l04-follow__row:last-child{border-bottom:0}",
    ".l04-ava{width:34px;height:34px;border-radius:50%;flex:none;display:grid;place-items:center;color:#fff;font-size:12px;font-weight:700}",
    ".l04-follow__who{display:flex;flex-direction:column;gap:2px;min-width:0}",
    ".l04-follow__name{font-size:13.5px;font-weight:700;color:#1d2733;line-height:1.4}",
    ".l04-follow__meta{font-size:11.5px;color:#8792a0;line-height:1.4}",
    ".l04-follow__btn{margin-left:auto;border:1px solid #cfd8e4;background:#fff;border-radius:999px;padding:5px 13px;font-size:11.5px;font-weight:700;color:#2f5d8a;flex:none}",
    ".l04-meta{width:100%;max-width:440px;display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;font-size:11px;color:var(--ink-3)}",
    ".l04-legend{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;color:var(--ink-3)}",
    ".l04-legend__item{display:inline-flex;align-items:center;gap:5px}",
    ".l04-legend__ln{width:20px;height:0;border-top:1px dashed;display:inline-block}",
    ".l04-legend__ln--t{border-color:#2f5d8a}",
    ".l04-legend__ln--a{border-color:#c22525}",
    ".l04-legend__diff{font-family:var(--font-mono);font-size:10.5px;color:var(--accent)}",
    ".l04-legend__diff.is-ok{color:var(--blue)}",
    ".l04-code{font-family:var(--font-mono);font-size:10.5px;color:var(--ink-2);background:var(--code-bg);border:1px solid var(--rule);border-radius:4px;padding:2px 7px;white-space:nowrap}",

    /* --------------------------------------------- 04-22 行长 × 行高 */
    ".l04-ll-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:11px}",
    ".l04-ll-col{width:100%;display:flex;flex-direction:column;align-items:center}",
    ".l04-ll-ruler{position:relative;height:36px;align-self:center;font-family:var(--font-mono);font-size:9px;color:var(--ink-3);transition:width .12s ease}",
    ".l04-ll-track{position:absolute;left:0;right:0;top:13px;height:1px;background:var(--rule-strong)}",
    ".l04-ll-tick{position:absolute;top:10px;width:1px;height:7px;background:var(--rule-strong)}",
    ".l04-ll-band{position:absolute;top:7px;height:12px;background:color-mix(in srgb,var(--blue) 15%,transparent);border-left:1px solid color-mix(in srgb,var(--blue) 50%,transparent);border-right:1px solid color-mix(in srgb,var(--blue) 50%,transparent)}",
    ".l04-ll-over{position:absolute;top:7px;height:12px;background:color-mix(in srgb,var(--accent) 12%,transparent);border-right:1px solid color-mix(in srgb,var(--accent) 45%,transparent)}",
    ".l04-ll-lab{position:absolute;top:20px;transform:translateX(-50%);white-space:nowrap}",
    ".l04-ll-end{position:absolute;top:0;right:0;font-weight:700;color:var(--ink-2);white-space:nowrap}",
    ".l04-ll-paperwrap{position:relative}",
    ".l04-ll-paper{position:absolute;left:0;top:0;transform-origin:top left;background:#fff;color:#2b3340;border:1px solid #e6eaf0;border-radius:4px;padding:20px 22px;box-shadow:0 26px 48px -36px rgba(20,30,45,.6)}",
    ".l04-ll-kicker{font-family:var(--font-mono);font-size:9px;letter-spacing:.14em;color:#9aa5b1;margin-bottom:6px}",
    ".l04-ll-h{margin:0 0 10px;font-size:22px;line-height:1.25;font-weight:800;letter-spacing:-.015em;color:#18202b}",
    ".l04-ll-p{margin:0 0 12px;color:#3b4655}",
    ".l04-ll-by{font-size:11px;color:#9aa5b1;border-top:1px solid #eef1f5;padding-top:8px}",
    ".l04-ll-stats{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;font-family:var(--font-mono);font-size:10px;color:var(--ink-3)}",
    ".l04-ll-chip{background:var(--code-bg);border:1px solid var(--rule);border-radius:4px;padding:2px 6px;color:var(--ink-2)}",
    ".l04-ll-chip b{color:var(--ink)}",
    ".l04-ll-chip--bad{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 38%,transparent);background:color-mix(in srgb,var(--accent) 9%,transparent)}",
    ".l04-ll-chip--ok{color:var(--blue);border-color:color-mix(in srgb,var(--blue) 38%,transparent);background:color-mix(in srgb,var(--blue) 9%,transparent)}",

    /* ----------------------------------------------- 04-40 字距 × 大写 */
    ".l04-hero{width:100%;max-width:560px;background:linear-gradient(180deg,#f8fafc,#edf2f8);border:1px solid #e2e8f0;border-radius:12px;padding:18px 26px 26px;text-align:center;box-shadow:0 20px 44px -34px rgba(20,32,48,.5)}",
    ".l04-hero__nav{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:11px;color:#7b8794}",
    ".l04-hero__logo{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:800;color:#16222e;letter-spacing:-.01em}",
    ".l04-hero__mark{width:16px;height:16px;border-radius:4px;background:#16222e;display:inline-block}",
    ".l04-hero__links{font-size:10.5px;letter-spacing:.02em}",
    ".l04-hero__kicker{margin:24px 0 10px;font-size:9.5px;font-weight:700;letter-spacing:.22em;color:#8c99a8}",
    ".l04-hero__title{margin:0 auto;max-width:15em;font-weight:800;line-height:1.08;color:#132030;letter-spacing:0;transition:font-size .12s ease}",
    ".l04-hero__sub{margin:13px auto 0;max-width:26em;font-size:12.5px;line-height:1.75;color:#5b6b7b}",
    ".l04-hero__cta{display:flex;justify-content:center;gap:8px;margin-top:18px}",
    ".l04-hero__btn{font-size:11.5px;font-weight:700;padding:9px 15px;border-radius:7px;background:#16222e;color:#fff;line-height:1.2}",
    ".l04-hero__btn--ghost{background:#fff;color:#34495e;border:1px solid #d7dfe8}",
    ".l04-hero__readout{width:100%;max-width:560px;display:flex;flex-wrap:wrap;align-items:center;gap:6px;background:#fff;border:1px solid #e3e8ee;border-radius:9px;padding:8px 12px;font-family:var(--font-mono);font-size:10px;color:#52606d}",
    ".l04-hero__readout b{color:#1f2933;font-weight:700}",
    ".l04-hero__readout span{white-space:nowrap}",
    "@media(max-width:600px){.l04-hero{padding:15px 16px 20px}.l04-hero__kicker{margin-top:18px}.l04-hero__title{max-width:100%}}"
  ].join("\n");
  document.head.appendChild(style);

  /* =========================================================== 04-1 */
  RUILive.register("04-1", {
    build: function (body) {
      var state = { scale: false, mark: true };
      var SPEC = [
        { k: "title", chaos: 18, scale: 20 },
        { k: "more", chaos: 13, scale: 14 },
        { k: "color", chaos: 11, scale: 12 },
        { k: "price", chaos: 26, scale: 30 },
        { k: "warranty", chaos: 15, scale: 14 },
        { k: "buy", chaos: 13, scale: 14 },
        { k: "stock", chaos: 12, scale: 12 },
        { k: "deliv", chaos: 17, scale: 18 },
        { k: "zip", chaos: 14, scale: 14 }
      ];

      function part(tag, cls, key, text) {
        return K.el(tag, { class: cls, dataset: { k: key } }, text);
      }

      function sofa() {
        var f = K.el("div", { class: "l04-sofa" });
        ["back", "cush--l", "cush--r", "seat", "arm--l", "arm--r", "leg--l", "leg--r"].forEach(function (s) {
          f.appendChild(K.el("i", { class: "l04-sofa__" + s }));
        });
        return f;
      }

      var colorRow = K.el("div", { class: "l04-pick" }, [
        part("span", "l04-pick__label", "color", "颜色 · 焦糖棕"),
        K.el("i", { class: "l04-dot is-on", style: { background: "#a9693f" } }),
        K.el("i", { class: "l04-dot", style: { background: "#7c8794" } }),
        K.el("i", { class: "l04-dot", style: { background: "#c9b49a" } })
      ]);

      var info = K.el("div", { class: "l04-shop__info" }, [
        K.el("div", { class: "l04-brand", text: "NORTHWIND · 家具" }),
        part("h3", "l04-shop__title", "title", "Brooklyn 三人位真皮沙发"),
        part("span", "l04-shop__more", "more", "查看完整商品详情 →"),
        colorRow,
        part("div", "l04-price", "price", "¥ 9,800"),
        part("p", "l04-warranty", "warranty", "头层牛皮整皮包覆，十年框架保修，下单后 3–5 天送达。"),
        part("span", "l04-buy", "buy", "加入购物车"),
        part("div", "l04-stock", "stock", "现货可发"),
        K.el("div", { class: "l04-deliv" }, [
          part("div", "l04-deliv__h", "deliv", "运费计算器"),
          K.el("div", { class: "l04-deliv__row" }, [
            K.el("span", { class: "l04-input", text: "输入邮编" }),
            K.el("span", { class: "l04-mini", text: "估算" })
          ]),
          part("div", "l04-hint", "zip", "输入邮编，估算配送费用")
        ])
      ]);

      var card = K.el("div", { class: "l04-shop" }, [
        K.el("div", { class: "l04-shop__media" }, [
          K.el("span", { class: "l04-shop__tag", text: "新品" }),
          sofa()
        ]),
        info
      ]);
      var strip = K.el("div", { class: "l04-sizes" });
      var wrap = K.el("div", { class: "l04-wrap" }, [card, strip]);

      function paint() {
        var key = state.scale ? "scale" : "chaos";
        var sizes = [];
        SPEC.forEach(function (s) {
          var el = wrap.querySelector('[data-k="' + s.k + '"]');
          if (!el) return;
          var px = s[key];
          el.style.fontSize = px + "px";
          var sup = el.querySelector(".l04-sz");
          if (!sup) {
            sup = K.el("sup", { class: "l04-sz" });
            el.appendChild(sup);
          }
          sup.textContent = String(px);
          sup.style.display = state.mark ? "inline-block" : "none";
          if (sizes.indexOf(px) < 0) sizes.push(px);
        });
        sizes.sort(function (a, b) { return a - b; });
        strip.innerHTML = "";
        strip.appendChild(K.el("span", { text: "本页用到 " }));
        strip.appendChild(K.el("b", { text: String(sizes.length) }));
        strip.appendChild(K.el("span", { text: " 种字号" }));
        sizes.forEach(function (px) {
          strip.appendChild(K.el("span", { class: "l04-sizechip", text: String(px) }));
        });
        strip.appendChild(K.el("span", {
          class: "l04-sizes__state",
          text: state.scale ? "全在同一套阶梯上" : "相邻两级只差 1–2px"
        }));
      }

      var seg = K.seg({
        label: "字号体系",
        options: [{ value: "chaos", label: "随手挑" }, { value: "scale", label: "一套阶梯" }],
        value: "chaos",
        onChange: function (v) { state.scale = v === "scale"; paint(); }
      });
      var mark = K.toggle({
        label: "标注字号",
        checked: true,
        onChange: function (v) { state.mark = v; paint(); }
      });

      body.appendChild(K.controls([seg.el, mark.el]));
      var cv = liveCanvas();
      cv.appendChild(wrap);
      body.appendChild(cv);
      body.appendChild(K.note("书里数过，一个普通商品页就用了 8 种字号。把它们收进一套 5 级阶梯，页面不会立刻变漂亮，但层级会变清楚，也少了很多「这个字号该用几号」的纠结。"));
      paint();
    }
  });

  /* ========================================================== 04-18 */
  RUILive.register("04-18", {
    build: function (body) {
      var state = { align: "center", size: 28, guides: true };
      var cvs = document.createElement("canvas");
      var c2 = cvs.getContext("2d");

      var title = K.el("h3", { class: "l04-follow__title", text: "推荐关注" });
      var acts = K.el("div", { class: "l04-follow__acts" }, [
        K.el("span", { text: "刷新" }),
        K.el("span", { class: "l04-follow__dot", text: "·" }),
        K.el("span", { text: "查看全部" })
      ]);
      var guideT = K.el("i", { class: "l04-guide l04-guide--t" });
      var guideA = K.el("i", { class: "l04-guide l04-guide--a" });
      var head = K.el("div", { class: "l04-follow__head" }, [title, acts, guideT, guideA]);

      var PEOPLE = [
        { initial: "林", name: "林 可", meta: "3 位共同关注", bg: "linear-gradient(140deg,#8aa4c8,#5c7ba6)" },
        { initial: "周", name: "周 野", meta: "2 位共同关注", bg: "linear-gradient(140deg,#c9a27e,#a3764f)" },
        { initial: "陈", name: "陈 一", meta: "1 位共同关注", bg: "linear-gradient(140deg,#9bb8a6,#6e917a)" }
      ];
      var rows = PEOPLE.map(function (p) {
        return K.el("div", { class: "l04-follow__row" }, [
          K.el("span", { class: "l04-ava", style: { background: p.bg }, text: p.initial }),
          K.el("span", { class: "l04-follow__who" }, [
            K.el("span", { class: "l04-follow__name", text: p.name }),
            K.el("span", { class: "l04-follow__meta", text: p.meta })
          ]),
          K.el("span", { class: "l04-follow__btn", text: "关注" })
        ]);
      });
      var card = K.el("div", { class: "l04-follow" }, [head].concat(rows));

      var diff = K.el("span", { class: "l04-legend__diff" });
      var code = K.el("code", { class: "l04-code" });
      var legend = K.el("div", { class: "l04-legend" }, [
        K.el("span", { class: "l04-legend__item" }, [
          K.el("i", { class: "l04-legend__ln l04-legend__ln--t" }),
          K.el("span", { text: "标题基线" })
        ]),
        K.el("span", { class: "l04-legend__item" }, [
          K.el("i", { class: "l04-legend__ln l04-legend__ln--a" }),
          K.el("span", { text: "操作文字基线" })
        ])
      ]);
      var meta = K.el("div", { class: "l04-meta" }, [legend, code, diff]);
      var wrap = K.el("div", { class: "l04-wrap" }, [card, meta]);

      function baselineOffset(el, base) {
        var cs = getComputedStyle(el);
        var fs = parseFloat(cs.fontSize);
        var lh = cs.lineHeight === "normal" ? fs * 1.2 : parseFloat(cs.lineHeight);
        var asc, desc;
        c2.font = cs.fontStyle + " " + cs.fontWeight + " " + fs + "px " + cs.fontFamily;
        var m = c2.measureText("Hg");
        if (m.fontBoundingBoxAscent !== undefined) {
          asc = m.fontBoundingBoxAscent;
          desc = m.fontBoundingBoxDescent;
        } else {
          asc = fs * 0.88;
          desc = fs * 0.22;
        }
        var top = el.getBoundingClientRect().top - base.getBoundingClientRect().top;
        return top + (lh - asc - desc) / 2 + asc;
      }

      function paint() {
        var on = state.align === "baseline";
        head.style.alignItems = on ? "baseline" : "center";
        title.style.fontSize = state.size + "px";
        code.textContent = "align-items: " + (on ? "baseline" : "center") + ";";
        guideT.style.display = state.guides ? "" : "none";
        guideA.style.display = state.guides ? "" : "none";
        if (!state.guides) {
          diff.textContent = "参考线已关闭";
          diff.className = "l04-legend__diff";
          return;
        }
        var yt = baselineOffset(title, head);
        var ya = baselineOffset(acts, head);
        guideT.style.top = yt.toFixed(1) + "px";
        guideA.style.top = ya.toFixed(1) + "px";
        var d = Math.abs(yt - ya);
        if (d < 0.6) {
          diff.textContent = "两条基线已重合";
          diff.className = "l04-legend__diff is-ok";
        } else {
          diff.textContent = "两条基线相差 " + d.toFixed(1) + "px";
          diff.className = "l04-legend__diff";
        }
      }

      var seg = K.seg({
        label: "对齐方式",
        options: [{ value: "center", label: "垂直居中" }, { value: "baseline", label: "基线对齐" }],
        value: "center",
        onChange: function (v) { state.align = v; paint(); }
      });
      var size = K.range({
        label: "标题字号", min: 16, max: 36, step: 1, value: 28,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.size = v; paint(); }
      });
      var guides = K.toggle({
        label: "基线参考线",
        checked: true,
        hint: "蓝色是标题基线，红色是右侧小字的基线",
        onChange: function (v) { state.guides = v; paint(); }
      });

      body.appendChild(K.controls([seg.el, size.el, guides.el]));
      var cv = liveCanvas();
      cv.appendChild(wrap);
      body.appendChild(cv);
      body.appendChild(K.note("混排大小字号时，按基线对齐而不是垂直居中：眼睛看的是文字坐在哪条线上，不是盒子中心。标题越大，旁边的小字偏得越明显。"));
      paint();
    }
  });

  /* ========================================================== 04-22 */
  RUILive.register("04-22", {
    build: function (body) {
      var TEXT = "排版里最容易被忽略的一对参数，是行宽和行高。行越长，眼睛从行尾跳回行首的距离就越远，跳错行的概率也越高；这时候就要靠更松的行距，让下一行的起点更容易被找到。反过来，行短的时候用紧一点的行高反而更连贯。所以这两个数要一起调：先定一个读起来舒服的宽度，再让行高去配合它，而不是各调各的。";
      var state = { w: 40, lh: 1.5 };
      var PAD = 22;

      var textEl = K.el("p", { class: "l04-ll-p" });
      textEl.textContent = TEXT;
      var paper = K.el("div", { class: "l04-ll-paper" }, [
        K.el("div", { class: "l04-ll-kicker", text: "阅读笔记 / 04" }),
        K.el("h3", { class: "l04-ll-h", text: "为什么留白比填满更重要" }),
        textEl,
        K.el("div", { class: "l04-ll-by", text: "— 摘自第 4 章 · 文字设计" })
      ]);
      var paperWrap = K.el("div", { class: "l04-ll-paperwrap" }, [paper]);
      var ruler = K.el("div", { class: "l04-ll-ruler" });
      var col = K.el("div", { class: "l04-ll-col" }, [ruler, paperWrap]);
      var stats = K.el("div", { class: "l04-ll-stats" });
      var wrap = K.el("div", { class: "l04-ll-wrap" }, [col, stats]);

      function renderRuler(w, pxW) {
        ruler.style.width = pxW.toFixed(1) + "px";
        var html = '<i class="l04-ll-track"></i>';
        var bandL = 20 / w;
        var bandR = Math.min(35, w) / w;
        if (bandR > bandL) {
          html += '<i class="l04-ll-band" style="left:' + (bandL * 100).toFixed(1) + "%;width:" + ((bandR - bandL) * 100).toFixed(1) + '%"></i>';
        }
        if (w > 35) {
          html += '<i class="l04-ll-over" style="left:' + (35 / w * 100).toFixed(1) + '%;right:0"></i>';
        }
        if (w > 20) {
          html += '<span class="l04-ll-lab" style="left:' + (20 / w * 100).toFixed(1) + '%">20em</span>';
        }
        if (w > 35) {
          html += '<span class="l04-ll-lab" style="left:' + (35 / w * 100).toFixed(1) + '%">35em</span>';
        }
        for (var t = 5; t < w; t += 5) {
          html += '<i class="l04-ll-tick" style="left:' + (t / w * 100).toFixed(1) + '%"></i>';
        }
        html += '<span class="l04-ll-end">' + w + "em</span>";
        ruler.innerHTML = html;
      }

      function chip(text, cls) {
        stats.appendChild(K.el("span", { class: "l04-ll-chip" + (cls ? " " + cls : ""), text: text }));
      }

      function render() {
        var avail = Math.max(200, wrap.clientWidth || 560);
        var fs = K.clamp(avail / 42, 10.5, 15);
        var w = state.w;
        paper.style.fontSize = fs + "px";
        textEl.style.lineHeight = state.lh;
        var designW = w * fs + PAD * 2;
        paper.style.width = designW + "px";
        var ph = paper.offsetHeight;
        var scale = Math.min(1, (avail - 4) / designW);
        paper.style.transform = "scale(" + scale.toFixed(4) + ")";
        paperWrap.style.width = (designW * scale).toFixed(1) + "px";
        paperWrap.style.height = (ph * scale).toFixed(1) + "px";
        renderRuler(w, w * fs * scale);

        var r = document.createRange();
        r.selectNodeContents(textEl);
        var rects = r.getClientRects();
        var lines = 0;
        for (var i = 0; i < rects.length; i++) {
          if (rects[i].width > 2) lines++;
        }
        var cpl = lines ? Math.round(TEXT.length / lines) : 0;

        stats.innerHTML = "";
        if (w > 35) chip("偏宽：超过 35em", "l04-ll-chip--bad");
        else if (w < 20) chip("偏窄：不到 20em", "l04-ll-chip--bad");
        else chip("在 20–35em 舒适区", "l04-ll-chip--ok");
        chip("栏宽 " + w + "em");
        chip("每行约 " + cpl + " 字");
        chip("行高 " + state.lh.toFixed(2) + " · " + (fs * state.lh).toFixed(1) + "px");
        chip("实际 " + lines + " 行");
        if (w > 30 && state.lh < 1.55) chip("宽行 + 紧行高，容易串行", "l04-ll-chip--bad");
        if (scale < 0.95) chip("预览缩放 " + Math.round(scale * 100) + "%");
      }

      var width = K.range({
        label: "栏宽", min: 16, max: 44, step: 1, value: 40,
        format: function (v) { return v + "em"; },
        hint: "书里的舒适区是 20–35em，约 45–75 个拉丁字符",
        onInput: function (v) { state.w = v; render(); }
      });
      var lh = K.range({
        label: "行高", min: 1.2, max: 2.2, step: 0.05, value: 1.5,
        format: function (v) { return v.toFixed(2); },
        hint: "行越宽，需要的行高越大",
        onInput: function (v) { state.lh = v; render(); }
      });

      body.appendChild(K.controls([width.el, lh.el]));
      var cv = liveCanvas();
      cv.appendChild(wrap);
      body.appendChild(cv);
      var note = K.note("行高和段落宽度是成比例的：窄段落 1.5 就够，宽段落可能要接近 2。先定一个读起来舒服的行长，再让行高去配合它。");
      body.appendChild(note);
      render();

      window.addEventListener("resize", function () {
        if (wrap.isConnected) render();
      });
    }
  });

  /* ========================================================== 04-40 */
  RUILive.register("04-40", {
    build: function (body) {
      var state = { upper: true, track: 0, size: 44 };

      var h1 = K.el("h1", { class: "l04-hero__title", text: "Team Chat Made Easy" });
      var hero = K.el("div", { class: "l04-hero" }, [
        K.el("div", { class: "l04-hero__nav" }, [
          K.el("span", { class: "l04-hero__logo" }, [K.el("i", { class: "l04-hero__mark" }), "Lattice"]),
          K.el("span", { class: "l04-hero__links", text: "功能 · 价格 · 博客" })
        ]),
        K.el("div", { class: "l04-hero__kicker", text: "PRODUCTIVITY" }),
        h1,
        K.el("p", { class: "l04-hero__sub", text: "把消息、文件和会议放进同一个地方，团队不用再在五个应用之间来回切换。" }),
        K.el("div", { class: "l04-hero__cta" }, [
          K.el("span", { class: "l04-hero__btn", text: "免费开始" }),
          K.el("span", { class: "l04-hero__btn l04-hero__btn--ghost", text: "看看怎么用" })
        ])
      ]);

      var outSize = K.el("span");
      var outTrack = K.el("span");
      var outCase = K.el("span");
      var readout = K.el("div", { class: "l04-hero__readout" }, [
        K.el("b", { text: "font-size" }), outSize,
        K.el("b", { text: "letter-spacing" }), outTrack,
        K.el("b", { text: "text-transform" }), outCase
      ]);
      var wrap = K.el("div", { class: "l04-wrap" }, [hero, readout]);

      function paint() {
        h1.style.fontSize = state.size + "px";
        h1.style.letterSpacing = state.track.toFixed(3) + "em";
        h1.style.textTransform = state.upper ? "uppercase" : "none";
        outSize.textContent = state.size + "px";
        outTrack.textContent = (state.track > 0 ? "+" : "") + state.track.toFixed(3) + "em";
        outCase.textContent = state.upper ? "uppercase" : "none";
      }

      var seg = K.seg({
        label: "大小写",
        options: [{ value: "upper", label: "全大写" }, { value: "normal", label: "原样" }],
        value: "upper",
        onChange: function (v) { state.upper = v === "upper"; paint(); }
      });
      var track = K.range({
        label: "字距", min: -0.05, max: 0.12, step: 0.005, value: 0,
        format: function (v) { return (v > 0 ? "+" : "") + v.toFixed(3) + "em"; },
        hint: "大标题可以收到 −0.02em；全大写则要放到 +0.05em 左右",
        onInput: function (v) { state.track = v; paint(); }
      });
      var size = K.range({
        label: "字号", min: 24, max: 64, step: 1, value: 44,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.size = v; paint(); }
      });

      body.appendChild(K.controls([seg.el, track.el, size.el]));
      var cv = liveCanvas();
      cv.appendChild(wrap);
      body.appendChild(cv);
      body.appendChild(K.note("字距不是一个固定值：大标题收紧一点更像「为标题设计」，全大写则相反，要放开一点，不然字母会挤成一团。"));
      paint();
    }
  });
})();
