/* 第 1 章 · 实时重制图（Lead 参考实现，队友按同一契约扩展本章其余图） */
(function () {
  "use strict";
  var K = window.RUILive.kit;

  /* shared styles for this chapter's live figures */
  var style = document.createElement("style");
  style.id = "lv-01-style";
  style.textContent = [
    ".l01-win { width: 100%; border: 1px solid #d5dbe2; border-radius: 10px; overflow: hidden; background: #eef1f5; box-shadow: 0 18px 40px -30px rgba(20,30,40,.55); }",
    ".l01-win__bar { display: flex; align-items: center; gap: 8px; padding: 9px 12px; background: #fff; border-bottom: 1px solid #e3e8ee; }",
    ".l01-dot { width: 9px; height: 9px; border-radius: 50%; background: #d7dde5; }",
    ".l01-url { flex: 1; height: 22px; border-radius: 999px; background: #f1f4f7; border: 1px solid #e3e8ee; }",
    ".l01-app { display: flex; min-height: 268px; }",
    ".l01-side { width: 168px; flex: none; background: #fff; border-right: 1px solid #e3e8ee; padding: 14px 12px; display: flex; flex-direction: column; gap: 10px; }",
    ".l01-logo { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }",
    ".l01-logo i { width: 22px; height: 22px; border-radius: 6px; background: #16222e; }",
    ".l01-logo b { font-size: 12px; letter-spacing: .04em; color: #16222e; }",
    ".l01-nav { display: flex; flex-direction: column; gap: 4px; }",
    ".l01-nav span { height: 26px; border-radius: 6px; background: #f3f6f9; }",
    ".l01-nav span:first-child { background: #e8eef5; }",
    ".l01-main { flex: 1; padding: 26px 22px; display: grid; place-items: center; }",
    ".l01-hero { margin: 0 0 18px; font-size: 19px; font-weight: 400; letter-spacing: -.01em; color: #263544; text-align: center; }",
    ".l01-form { width: 100%; max-width: 372px; background: #fff; border-radius: 10px; padding: 18px; box-shadow: 0 12px 30px -22px rgba(20,30,40,.5); }",
    ".l01-field { margin-bottom: 11px; }",
    ".l01-field label { display: block; font-size: 11px; color: #5b6b7b; margin-bottom: 5px; }",
    ".l01-input { display: block; width: 100%; box-sizing: border-box; height: 30px; border: 1px solid #dde3ea; border-radius: 5px; background: #eef1f5; padding: 0 8px; font: inherit; font-size: 12px; color: #263544; }",
    ".l01-input:focus { outline: 2px solid #2f5d8a; outline-offset: 1px; background: #fff; }",
    ".l01-duo { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }",
    ".l01-submit { width: 100%; height: 34px; margin-top: 4px; border: 0; border-radius: 5px; background: #16222e; color: #fff; font: inherit; font-size: 12px; font-weight: 700; letter-spacing: .02em; cursor: pointer; }",
    ".l01-submit:hover { background: #24384a; }",
    ".l01-extras { margin-top: 18px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }",
    ".l01-extra { height: 54px; border-radius: 7px; background: #fff; border: 1px solid #e3e8ee; }",
    ".l01-focus { width: 100%; display: grid; place-items: center; padding: 22px 0; }",
    ".l01-focus .l01-form { max-width: 396px; }",
    ".l01-focus .l01-hero { color: #2a3947; }",

    ".l01-type { width: 100%; background: #fff; border-radius: 10px; padding: 22px 22px 18px; box-shadow: 0 14px 34px -26px rgba(20,30,40,.45); }",
    ".l01-type__kicker { margin: 0 0 8px; font-size: 10px; letter-spacing: .18em; font-weight: 700; color: #7c8794; }",
    ".l01-type__h { margin: 0 0 10px; font-size: 27px; line-height: 1.18; letter-spacing: -.01em; color: #1b2733; }",
    ".l01-type__p { margin: 0 0 16px; font-size: 13px; line-height: 1.75; color: #4c5b6a; }",
    ".l01-type__btn { display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: 7px; background: #1b2733; color: #fff; font: inherit; font-size: 12px; font-weight: 700; padding: 9px 14px; cursor: pointer; }",
    ".l01-type__meta { margin-top: 14px; padding-top: 10px; border-top: 1px dashed #dfe5ec; font-family: var(--font-mono); font-size: 10px; color: #7c8794; }",

    ".l01-radius { width: 100%; display: grid; place-items: center; }",
    ".l01-card { width: 100%; max-width: 330px; background: #fff; border: 1px solid #e2e8ef; padding: 16px; box-shadow: 0 16px 36px -30px rgba(20,30,40,.5); }",
    ".l01-card__top { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }",
    ".l01-avatar { width: 34px; height: 34px; flex: none; background: #c8d6e4; }",
    ".l01-card__name { margin: 0; font-size: 13px; font-weight: 700; color: #1b2733; }",
    ".l01-card__sub { margin: 2px 0 0; font-size: 11px; color: #7c8794; }",
    ".l01-card__text { margin: 0 0 12px; font-size: 12px; line-height: 1.7; color: #4c5b6a; }",
    ".l01-tag { display: inline-block; padding: 3px 9px; font-size: 10px; font-weight: 700; background: #eef2f7; color: #4c5b6a; }",
    ".l01-card__btn { margin-top: 12px; width: 100%; border: 0; background: #1b2733; color: #fff; font: inherit; font-size: 12px; font-weight: 700; padding: 10px; cursor: pointer; }",
    ".l01-card__input { margin-top: 12px; width: 100%; box-sizing: border-box; border: 1px solid #dbe2ea; background: #f5f8fb; font: inherit; font-size: 12px; padding: 9px 10px; color: #263544; }",
    ".l01-readout { display: flex; align-items: baseline; gap: 8px; }",
    ".l01-readout b { font-size: 20px; color: #1b2733; }",
    ".l01-readout span { font-size: 12px; color: #7c8794; }",
    ".l01-graywrap { width: 100%; background: #eef1f5; padding: 20px; border-radius: 8px; }",
    ".l01-grayhead { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }",
    ".l01-grayhead h4 { margin: 0; font-size: 20px; line-height: 1.35; font-weight: 400; color: #2a3947; max-width: 20em; }",
    ".l01-bill { display: flex; align-items: center; gap: 7px; font-size: 11px; color: #6b7a89; }",
    ".l01-bill i { width: 30px; height: 17px; border-radius: 999px; background: #cdd6e0; position: relative; }",
    ".l01-bill i::after { content: \"\"; position: absolute; top: 2px; right: 2px; width: 13px; height: 13px; border-radius: 50%; background: #fff; }",
    ".l01-bill i.is-on { background: #6b7a89; }",
    ".l01-bill i.is-on::after { right: auto; left: 2px; }",
    ".l01-graybody { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }",
    ".l01-formcard { background: transparent; }",
    ".l01-formcard .l01-input { background: #fff; border-color: #e3e8ee; margin-bottom: 9px; }",
    ".l01-create { width: 100%; height: 38px; border: 0; border-radius: 5px; background: #3f4c5a; color: #fff; font: inherit; font-size: 11px; font-weight: 700; letter-spacing: .06em; cursor: pointer; }",
    ".l01-plans { display: flex; flex-direction: column; gap: 10px; }",
    ".l01-plan { position: relative; background: #fff; border-radius: 8px; padding: 14px 16px; border: 2px solid transparent; cursor: pointer; text-align: left; font: inherit; width: 100%; display: block; }",
    ".l01-plan__kicker { display: block; font-size: 10px; font-weight: 700; letter-spacing: .12em; color: #7c8794; margin-bottom: 4px; }",
    ".l01-plan__line { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }",
    ".l01-plan__size { font-size: 22px; color: #263544; letter-spacing: -.01em; }",
    ".l01-plan__size b { font-size: 26px; }",
    ".l01-plan__size em { font-style: normal; font-size: 12px; color: #7c8794; }",
    ".l01-plan__price { font-size: 13px; font-weight: 700; color: #3f4c5a; white-space: nowrap; }",
    ".l01-plan.is-sel { border-color: #55657a; }",
    ".l01-plan .l01-check { position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; border-radius: 50%; background: #55657a; color: #fff; font-size: 11px; line-height: 20px; text-align: center; display: none; }",
    ".l01-plan.is-sel .l01-check { display: block; }",
    ".l01-plans.is-color .l01-plan.is-sel { border-color: #2b4bd6; }",
    ".l01-plans.is-color .l01-plan.is-sel .l01-check { background: #2b4bd6; }",
    ".l01-plans.is-color .l01-plan.is-sel .l01-plan__price { color: #2b4bd6; }",
    ".l01-graywrap.is-color .l01-create { background: #2b4bd6; }",
    ".l01-graywrap.is-color .l01-bill i.is-on { background: #2b4bd6; }",

    ".l01-icons { width: 100%; background: #fff; border-radius: 10px; padding: 16px; }",
    ".l01-icons__bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }",
    ".l01-icons__title { font-size: 14px; font-weight: 700; color: #1b2733; }",
    ".l01-tools { display: flex; gap: 6px; }",
    ".l01-tool { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 30px; border-radius: 6px; background: #f1f4f8; color: #3f4c5a; }",
    ".l01-tool svg { display: block; }",
    ".l01-list { display: flex; flex-direction: column; }",
    ".l01-li { display: flex; align-items: center; gap: 10px; padding: 9px 4px; border-top: 1px solid #eef1f5; }",
    ".l01-li__icon { flex: none; color: #55657a; display: flex; align-items: center; }",
    ".l01-li__main { flex: 1; min-width: 0; }",
    ".l01-li__t { display: block; font-size: 13px; color: #263544; }",
    ".l01-li__m { display: block; font-size: 11px; color: #8a96a3; }",
    ".l01-li__act { color: #9aa6b2; display: flex; }",
    ".l01-cta { display: inline-flex; align-items: center; gap: 7px; margin-top: 13px; border: 0; border-radius: 6px; background: #1b2733; color: #fff; font: inherit; font-size: 12px; font-weight: 700; padding: 9px 13px; cursor: pointer; }",
    ".l01-sizes { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 11px; }",
  ].join("\n");
  document.head.appendChild(style);

  /* ---------------------------------------------------------------- 1-2 */
  RUILive.register("01-2", {
    build: function (body) {
      var state = { shell: false };
      var win = K.el("div", { class: "l01-win" }, [
        K.el("div", { class: "l01-win__bar" }, [
          K.el("i", { class: "l01-dot" }), K.el("i", { class: "l01-dot" }), K.el("i", { class: "l01-dot" }),
          K.el("span", { class: "l01-url" })
        ])
      ]);
      var app = K.el("div", { class: "l01-app" });
      win.appendChild(app);

      var form = K.el("div", { class: "l01-form" }, [
        K.el("p", { class: "l01-hero", text: "Find the best deals on flights right now" }),
        K.el("div", { class: "l01-field" }, [
          K.el("label", { text: "Leaving from…", for: "l01-from" }),
          K.el("input", { class: "l01-input", id: "l01-from", type: "text", value: "Shanghai (PVG)", autocomplete: "off" })
        ]),
        K.el("div", { class: "l01-field" }, [
          K.el("label", { text: "Going to…", for: "l01-to" }),
          K.el("input", { class: "l01-input", id: "l01-to", type: "text", value: "Tokyo (HND)", autocomplete: "off" })
        ]),
        K.el("div", { class: "l01-duo" }, [
          K.el("div", { class: "l01-field" }, [
            K.el("label", { text: "Depart", for: "l01-dep" }),
            K.el("input", { class: "l01-input", id: "l01-dep", type: "text", value: "Dec 18" })
          ]),
          K.el("div", { class: "l01-field" }, [
            K.el("label", { text: "Return", for: "l01-ret" }),
            K.el("input", { class: "l01-input", id: "l01-ret", type: "text", value: "Dec 26" })
          ])
        ]),
        K.el("button", { class: "l01-submit", type: "button", text: "Search Flights" })
      ]);

      function paint() {
        app.innerHTML = "";
        if (state.shell) {
          app.appendChild(K.el("div", { class: "l01-side" }, [
            K.el("div", { class: "l01-logo" }, [K.el("i"), K.el("b", { text: "Skyline" })]),
            K.el("div", { class: "l01-nav" }, [K.el("span"), K.el("span"), K.el("span"), K.el("span")])
          ]));
          app.appendChild(K.el("div", { class: "l01-main" }, [
            K.el("div", { style: { width: "100%" } }, [
              form,
              K.el("div", { class: "l01-extras" }, [
                K.el("div", { class: "l01-extra" }), K.el("div", { class: "l01-extra" }), K.el("div", { class: "l01-extra" })
              ])
            ])
          ]));
        } else {
          app.appendChild(K.el("div", { class: "l01-focus" }, [form]));
        }
      }
      paint();

      var seg = K.seg({
        label: "做到哪一步",
        options: [{ value: "focus", label: "只做搜索功能" }, { value: "shell", label: "加上完整外壳" }],
        value: "focus",
        onChange: function (v) { state.shell = v === "shell"; paint(); }
      });

      body.appendChild(K.controls([seg.el]));
      body.appendChild(win);
      body.appendChild(K.note("先把 4 个字段 + 1 个按钮跑通；导航、侧栏、推荐位这些「外壳」，等这个功能真的需要时再加。"));
    }
  });

  /* --------------------------------------------------------------- 1-13 */
  RUILive.register("01-13", {
    build: function (body) {
      var fonts = {
        serif: { label: "衬线", stack: '"Noto Serif CJK SC","Songti SC",Georgia,"Times New Roman",serif', feel: "优雅、经典，像一本印刷杂志" },
        sans: { label: "无衬线", stack: '"Noto Sans CJK SC","PingFang SC","Helvetica Neue",Arial,sans-serif', feel: "中性、现代，让内容自己说话" },
        mono: { label: "等宽", stack: '"SFMono-Regular","Cascadia Code","Noto Sans Mono",monospace', feel: "技术、极客，像代码编辑器" }
      };
      var card = K.el("div", { class: "l01-type" }, [
        K.el("p", { class: "l01-type__kicker", text: "TRIP PLANNER" }),
        K.el("h4", { class: "l01-type__h", text: "计划你的下一趟旅行" }),
        K.el("p", { class: "l01-type__p", text: "把想去的地方、日期和预算放进来，我们帮你把路线排成一条不用来回折返的线。" }),
        K.el("button", { class: "l01-type__btn", type: "button", text: "开始规划 →" }),
        K.el("p", { class: "l01-type__meta", "data-meta": "" })
      ]);

      function apply(key) {
        var f = fonts[key];
        card.style.fontFamily = f.stack;
        card.querySelector("[data-meta]").textContent = f.label + " · " + f.feel;
      }
      var seg = K.seg({
        label: "字体",
        options: [{ value: "serif", label: "衬线" }, { value: "sans", label: "无衬线" }, { value: "mono", label: "等宽" }],
        value: "sans",
        onChange: apply
      });
      apply("sans");
      body.appendChild(K.controls([seg.el]));
      body.appendChild(K.canvas());
      body.lastChild.appendChild(card);
      body.appendChild(K.note("同一段文案，只换字体家族，读者对产品的第一印象就变了——这就是「个性」最便宜的来源。"));
    }
  });

  /* --------------------------------------------------------------- 1-19 */
  RUILive.register("01-19", {
    build: function (body) {
      var state = { radius: 6 };
      var card = K.el("div", { class: "l01-card" }, [
        K.el("div", { class: "l01-card__top" }, [
          K.el("i", { class: "l01-avatar", "data-avatar": "" }),
          K.el("div", {}, [
            K.el("p", { class: "l01-card__name", text: "Mia Chen" }),
            K.el("p", { class: "l01-card__sub", text: "产品设计师 · 上海" })
          ])
        ]),
        K.el("p", { class: "l01-card__text", text: "把上周的用户访谈整理成了一份可执行的改进清单，周四之前同步给大家。" }),
        K.el("span", { class: "l01-tag", text: "进行中" }),
        K.el("input", { class: "l01-card__input", type: "text", placeholder: "留一句评论…" }),
        K.el("button", { class: "l01-card__btn", type: "button", text: "查看详情" })
      ]);
      var readout = K.el("div", { class: "l01-readout" }, [
        K.el("b", { text: "6", "data-r": "" }), K.el("span", { text: "px 圆角" })
      ]);

      function paint() {
        var r = state.radius;
        card.style.borderRadius = r + "px";
        card.querySelector("[data-avatar]").style.borderRadius = r + "px";
        card.querySelector(".l01-card__btn").style.borderRadius = r + "px";
        card.querySelector(".l01-card__input").style.borderRadius = Math.max(0, r - 2) + "px";
        card.querySelector(".l01-tag").style.borderRadius = "999px";
        readout.querySelector("[data-r]").textContent = String(r);
      }
      paint();

      var range = K.range({
        label: "圆角",
        min: 0, max: 24, step: 1, value: 6,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.radius = v; paint(); }
      });

      var canvas = K.canvas();
      canvas.appendChild(K.el("div", { class: "l01-radius" }, [readout, card]));
      body.appendChild(K.controls([range.el]));
      body.appendChild(canvas);
      body.appendChild(K.note("0px = 严肃正式，小圆角 = 中性克制，大圆角 = 活泼轻松。圆角是整套 UI 的「语气」，要么统一，要么有理由地不统一。"));
    }
  });

  /* ---------------------------------------------------------------- 1-5 */
  RUILive.register("01-5", {
    build: function (body) {
      var plans = [
        { key: "essential", kicker: "ESSENTIAL", size: "200", unit: "GB", price: "$10 / mo" },
        { key: "pro", kicker: "PRO", size: "1", unit: "TB", price: "$20 / mo" },
        { key: "premium", kicker: "PREMIUM", size: "2", unit: "TB", price: "$40 / mo" }
      ];
      var state = { color: false, sel: "essential" };
      var wrap = K.el("div", { class: "l01-graywrap" }, [
        K.el("div", { class: "l01-grayhead" }, [
          K.el("h4", { html: "Choose the amount of storage<br>that’s right for you." }),
          K.el("div", { class: "l01-bill" }, [K.el("span", { text: "Bill yearly" }), K.el("i", { class: "is-on" }), K.el("span", { text: "Bill monthly" })])
        ]),
        K.el("div", { class: "l01-graybody" }, [
          K.el("div", { class: "l01-formcard" }, [
            K.el("input", { class: "l01-input", type: "text", placeholder: "Full name" }),
            K.el("input", { class: "l01-input", type: "text", placeholder: "Email" }),
            K.el("input", { class: "l01-input", type: "password", placeholder: "Password" }),
            K.el("input", { class: "l01-input", type: "text", placeholder: "Card number   MM/YY   CVC" }),
            K.el("button", { class: "l01-create", type: "button", text: "CREATE ACCOUNT" })
          ]),
          K.el("div", { class: "l01-plans" })
        ])
      ]);
      wrap.style.transition = "none";

      var plansEl = wrap.querySelector(".l01-plans");

      function paint() {
        wrap.classList.toggle("is-color", state.color);
        plansEl.classList.toggle("is-color", state.color);
        plansEl.innerHTML = "";
        plans.forEach(function (pl) {
          var btn = K.el("button", {
            class: "l01-plan" + (pl.key === state.sel ? " is-sel" : ""),
            type: "button",
            "aria-pressed": String(pl.key === state.sel)
          }, [
            K.el("span", { class: "l01-plan__kicker", text: pl.kicker }),
            K.el("span", { class: "l01-plan__line" }, [
              K.el("span", { class: "l01-plan__size", html: "<b>" + pl.size + "</b> <em>" + pl.unit + "</em> of storage" }),
              K.el("span", { class: "l01-plan__price", text: pl.price })
            ]),
            K.el("span", { class: "l01-check", text: "✓" })
          ]);
          btn.addEventListener("click", function () { state.sel = pl.key; paint(); });
          plansEl.appendChild(btn);
        });
      }
      paint();

      var colorSeg = K.seg({
        label: "配色",
        options: [{ value: "gray", label: "先保持灰度" }, { value: "color", label: "最后再上色" }],
        value: "gray",
        onChange: function (v) { state.color = v === "color"; paint(); }
      });

      body.appendChild(K.controls([colorSeg.el]));
      body.appendChild(K.canvas());
      body.lastChild.appendChild(wrap);
      body.appendChild(K.note("灰度里能看清层级，颜色才有意义：颜色是最后加的一层，不是结构本身。点右侧方案条切换选中态，再切到「上色」看品牌色落在哪。"));
    }
  });

  /* --------------------------------------------------------------- 1-27 */
  var ICONS = {
    search: '<circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 12l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    bell: '<path d="M4 12V8a4 4 0 0 1 8 0v4l1.5 2h-11L4 12z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M6.5 14a1.8 1.8 0 0 0 3.5 0" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    gear: '<path d="M2 5h12M2 11h12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="6.2" cy="5" r="1.9" fill="currentColor"/><circle cx="9.8" cy="11" r="1.9" fill="currentColor"/>',
    plus: '<path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    folder: '<path d="M2 4.5h4l1.4 1.6H14V13H2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    user: '<circle cx="8" cy="5.6" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3.4 13.2c.6-2.5 2.4-3.8 4.6-3.8s4 1.3 4.6 3.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    cal: '<rect x="2.4" y="3.6" width="11.2" height="10.4" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2.4 6.8h11.2M5.4 2v3M10.6 2v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    chevron: '<path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
  };

  RUILive.register("01-27", {
    build: function (body) {
      function svg(name, size) {
        var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        s.setAttribute("width", size); s.setAttribute("height", size);
        s.setAttribute("viewBox", "0 0 16 16"); s.setAttribute("aria-hidden", "true");
        s.innerHTML = ICONS[name];
        return s;
      }

      var state = { snap: true, base: 14 };
      var rowData = [
        { icon: "folder", title: "设计规范 v3", meta: "最后更新 · 2 天前" },
        { icon: "user", title: "Mia Chen 邀请了你", meta: "团队 · 设计组" },
        { icon: "cal", title: "每周评审", meta: "周四 14:00 · 会议室 B" }
      ];
      var card = K.el("div", { class: "l01-icons" }, [
        K.el("div", { class: "l01-icons__bar" }, [
          K.el("span", { class: "l01-icons__title", text: "工作区" }),
          K.el("div", { class: "l01-tools" })
        ]),
        K.el("div", { class: "l01-list" }),
        K.el("button", { class: "l01-cta", type: "button" })
      ]);
      var readout = K.el("div", { class: "l01-sizes" });

      function sizes() {
        if (state.snap) return { tools: [20, 20, 20, 20], rows: [16, 16, 16], act: [16], cta: 16 };
        return { tools: [22, 17, 26, 14], rows: [13, 19, 15], act: [18], cta: 15 };
      }

      function paint() {
        var z = sizes();
        var tools = card.querySelector(".l01-tools"); tools.innerHTML = "";
        ["search", "bell", "gear", "plus"].forEach(function (n, i) {
          tools.appendChild(K.el("span", { class: "l01-tool" }, [svg(n, Math.round(z.tools[i] * 0.72))]));
        });
        var list = card.querySelector(".l01-list"); list.innerHTML = "";
        rowData.forEach(function (r, idx) {
          list.appendChild(K.el("div", { class: "l01-li" }, [
            K.el("span", { class: "l01-li__icon" }, [svg(r.icon, Math.round(z.rows[idx] * 1.05))]),
            K.el("span", { class: "l01-li__main" }, [
              K.el("span", { class: "l01-li__t", text: r.title, style: { fontSize: state.base + "px" } }),
              K.el("span", { class: "l01-li__m", text: r.meta, style: { fontSize: Math.max(10, state.base - 3) + "px" } })
            ]),
            K.el("span", { class: "l01-li__act" }, [svg("chevron", Math.round(z.act[0] * 0.9))])
          ]));
        });
        var cta = card.querySelector(".l01-cta"); cta.innerHTML = "";
        cta.appendChild(svg("plus", z.cta));
        cta.appendChild(document.createTextNode("新建项目"));
        cta.style.fontSize = Math.max(11, state.base - 1) + "px";

        readout.innerHTML = "";
        readout.appendChild(K.el("span", { class: "lv-badge", text: "图标尺寸" }));
        if (state.snap) {
          [["工具栏", z.tools[0]], ["列表", z.rows[0]], ["操作", z.act[0]], ["底部", z.cta]].forEach(function (p) {
            readout.appendChild(K.el("span", { class: "lv-badge", text: p[0] + " " + p[1] + "px" }));
          });
          readout.appendChild(K.el("span", { class: "lv-badge", text: "← 全部落在阶梯上" }));
        } else {
          readout.appendChild(K.el("span", { class: "lv-badge", text: "工具栏 " + z.tools.join(" · ") }));
          readout.appendChild(K.el("span", { class: "lv-badge", text: "列表 " + z.rows.join(" · ") }));
          readout.appendChild(K.el("span", { class: "lv-badge", text: "操作 " + z.act[0] + " · 底部 " + z.cta }));
          readout.appendChild(K.el("span", { class: "lv-badge", text: "← 每个都随手定" }));
        }
      }
      paint();

      var modeSeg = K.seg({
        label: "尺寸策略",
        options: [{ value: "snap", label: "跟随尺寸阶梯" }, { value: "loose", label: "每个随手定" }],
        value: "snap",
        onChange: function (v) { state.snap = v === "snap"; paint(); }
      });
      var baseRange = K.range({
        label: "基准字号",
        min: 12, max: 18, step: 1, value: 14,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.base = v; paint(); }
      });

      body.appendChild(K.controls([modeSeg.el, baseRange.el]));
      body.appendChild(K.canvas());
      body.lastChild.appendChild(card);
      body.lastChild.appendChild(readout);
      body.appendChild(K.note("图标和文字一样需要一套尺寸阶梯：12 / 16 / 24 / 32。随手定 18、22、27，单看都行，放在一起就露馅。"));
    }
  });
})();
