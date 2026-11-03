/* quiz.js — 第 9 章：全书测验，6 道单选 */
(function () {
  "use strict";
  var K = window.RUIDemo.kit;
  var STYLE_ID = "qz-style";
  var Q = [
    {
      topic: "层级", stem: "一个页面里想突出「保存」按钮，下面哪种做法最接近书里的建议？",
      options: [
        "把按钮字号加大，比页面标题还大",
        "只留一个实心高对比主按钮，其余做成描边或链接",
        "给所有按钮都加红色背景，红色最显眼",
        "给按钮加一圈发光阴影，越大越显眼"
      ],
      answer: 1,
      exp: "书里说，一个页面只留一个主操作：实心、高对比；其余描边或做成链接——靠弱化别人来强调它。"
    },
    {
      topic: "间距", stem: "表单里「标签 + 输入框」和下一组字段之间，间距应该怎么处理？",
      options: [
        "组内和组间用同样的间距，看起来才整齐",
        "组内更紧、组间更松，让分组关系一眼可见",
        "全部贴在一起，省空间",
        "组间比组内更紧，让表单更紧凑"
      ],
      answer: 1,
      exp: "只靠间距分组时，组与组之间的留白必须大于组内：标签贴着输入框，字段之间再拉开。"
    },
    {
      topic: "文字", stem: "一段正文在宽屏上被拉成很长的一行，最该先改什么？",
      options: [
        "把字号加大到 20px",
        "把行高降到 1.2",
        "把段落宽度限制在 45–75 个字符",
        "改成居中对齐"
      ],
      answer: 2,
      exp: "书里建议正文每行 45–75 个字符（约 20–35em）；布局再宽，段落也要自己收窄。"
    },
    {
      topic: "颜色", stem: "要给一个品牌蓝做主色，书里更推荐哪种做法？",
      options: [
        "只用一个蓝色，靠透明度调深浅",
        "用 lighten() / darken() 随手生成深浅",
        "先定一套 100–900 色阶，再挑深色文字和浅色背景",
        "最深色直接用纯黑，最稳"
      ],
      answer: 2,
      exp: "书里建议提前定好色阶：基色 500，深色 700+ 当文字，浅色 100–300 当背景；不要用 lighten/darken 临时算。"
    },
    {
      topic: "深度", stem: "一个「浮起来」的卡片，阴影应该是什么样？",
      options: [
        "四周均匀的大模糊阴影，越大越像浮起来",
        "顶部亮边 + 下方小而清晰的深色阴影",
        "只在左侧加一道深色阴影",
        "完全不要阴影，纯白就是浮起来"
      ],
      answer: 1,
      exp: "光源在上：浮起的元素顶部有亮边，底部是一层小、清晰、略微下移的深色阴影；模糊越大，离用户越远。"
    },
    {
      topic: "图片", stem: "在照片上放白色标题，最稳的做法是？",
      options: [
        "把文字加粗、加大，直到看清",
        "给文字加一个模糊的大阴影就够了",
        "先加半透明黑色遮罩压暗亮部，再放白字",
        "把照片换成纯色背景"
      ],
      answer: 2,
      exp: "照片的动态范围太大，问题不在文字：先用遮罩压暗亮部（或降对比、着色），白字才有稳定的对比度。"
    }
  ];
  var KEYS = ["A", "B", "C", "D"];

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent =
      ".qz-wrap{max-width:760px}" +
      ".qz-intro{margin:16px 0 0;font-size:12px;color:var(--ink-3);display:flex;flex-wrap:wrap;gap:4px 14px}" +
      ".qz-intro b{color:var(--ink-2);font-weight:600}" +
      ".qz-list{display:grid;gap:12px;margin-top:14px}" +
      ".qz-q{border:1px solid var(--rule);border-radius:10px;padding:15px 16px;background:var(--surface);transition:border-color .15s}" +
      ".qz-q.is-answered{border-color:var(--rule-strong)}" +
      ".qz-qhead{display:flex;align-items:baseline;gap:8px;margin-bottom:7px}" +
      ".qz-num{font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--ink-3)}" +
      ".qz-topic{font-size:10px;font-weight:700;letter-spacing:.12em;color:var(--blue)}" +
      ".qz-stem{margin:0 0 10px;font-size:14px;font-weight:600;line-height:1.55;color:var(--ink)}" +
      ".qz-opts{display:grid;gap:6px}" +
      ".qz-opt{display:flex;align-items:flex-start;gap:9px;width:100%;text-align:left;padding:8px 10px;" +
      "border:1px solid var(--rule);border-radius:7px;background:var(--bg);color:var(--ink-2);" +
      "font-family:inherit;font-size:13px;line-height:1.5;cursor:pointer;transition:border-color .15s,background .15s}" +
      ".qz-opt:hover:not(:disabled){border-color:var(--ink-3);color:var(--ink)}" +
      ".qz-opt:focus-visible{outline:2px solid var(--accent);outline-offset:2px}" +
      ".qz-opt:disabled{cursor:default}" +
      ".qz-key{flex:none;font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--ink-3);padding-top:1px}" +
      ".qz-txt{flex:1;min-width:0}" +
      ".qz-mark{flex:none;font-weight:700;font-size:13px;line-height:1.4}" +
      ".qz-opt.is-correct{border-color:#2f9e6a;background:rgba(47,158,106,.08);color:var(--ink)}" +
      ".qz-opt.is-correct .qz-key,.qz-opt.is-correct .qz-mark{color:#1f7a4d}" +
      ".qz-opt.is-wrong{border-color:#d05a4c;background:rgba(208,90,76,.08);color:var(--ink)}" +
      ".qz-opt.is-wrong .qz-key,.qz-opt.is-wrong .qz-mark{color:#b42318}" +
      ".qz-opt.is-muted{opacity:.55}" +
      "html[data-theme=dark] .qz-opt.is-correct{border-color:#7ee0a8;background:rgba(126,224,168,.12)}" +
      "html[data-theme=dark] .qz-opt.is-correct .qz-key,html[data-theme=dark] .qz-opt.is-correct .qz-mark{color:#7ee0a8}" +
      "html[data-theme=dark] .qz-opt.is-wrong{border-color:#ff8f82;background:rgba(255,122,107,.12)}" +
      "html[data-theme=dark] .qz-opt.is-wrong .qz-key,html[data-theme=dark] .qz-opt.is-wrong .qz-mark{color:#ff8f82}" +
      ".qz-exp{margin:10px 0 0;padding:8px 10px;border-left:2px solid var(--blue);border-radius:0 6px 6px 0;" +
      "background:var(--bg-2);font-size:12.5px;line-height:1.65;color:var(--ink-2)}" +
      ".qz-score{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:16px;padding:14px 16px;" +
      "border:1px solid var(--rule);border-radius:10px;background:var(--surface)}" +
      ".qz-score.is-done{border-color:var(--blue)}" +
      ".qz-big{font-family:var(--font-mono);font-size:26px;font-weight:700;line-height:1;color:var(--ink);font-variant-numeric:tabular-nums}" +
      ".qz-big small{font-size:13px;font-weight:400;color:var(--ink-3);margin-left:1px}" +
      ".qz-scoretext{display:grid;gap:2px;min-width:0;flex:1}" +
      ".qz-scoretext b{font-size:13px;font-weight:600;color:var(--ink)}" +
      ".qz-scoretext span{font-size:11.5px;color:var(--ink-3)}" +
      ".qz-again{flex:none;margin-left:auto;padding:8px 14px;border:1px solid var(--rule-strong);border-radius:8px;" +
      "background:var(--bg);color:var(--ink);font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:border-color .15s}" +
      ".qz-again:hover{border-color:var(--ink-3)}" +
      ".qz-again:focus-visible{outline:2px solid var(--accent);outline-offset:2px}" +
      "@media(max-width:560px){.qz-q{padding:13px 13px}.qz-stem{font-size:13.5px}.qz-opt{font-size:12.5px;padding:8px 9px}}";
    document.head.appendChild(s);
  }

  function build(body) {
    injectStyle();
    var answers = Q.map(function () { return -1; });
    var intro = K.el("p", { class: "qz-intro" }, [
      K.el("span", {}, [K.el("b", { text: "6 道题" }), " · 覆盖层级、间距、文字、颜色、深度、图片"]),
      K.el("span", { text: "点击选项即判分，答错会标出正确项" })
    ]);
    var list = K.el("div", { class: "qz-list" });
    var cards = Q.map(function (q, qi) {
      var exp = K.el("p", { class: "qz-exp" });
      exp.hidden = true;
      var opts = q.options.map(function (text, oi) {
        var mark = K.el("span", { class: "qz-mark" });
        var btn = K.el("button", {
          class: "qz-opt", type: "button",
          onclick: function () { choose(qi, oi); }
        }, [
          K.el("span", { class: "qz-key", text: KEYS[oi] }),
          K.el("span", { class: "qz-txt", text: text }),
          mark
        ]);
        return { btn: btn, mark: mark };
      });
      var card = K.el("div", { class: "qz-q" }, [
        K.el("div", { class: "qz-qhead" }, [
          K.el("span", { class: "qz-num", text: ("0" + (qi + 1)).slice(-2) }),
          K.el("span", { class: "qz-topic", text: q.topic })
        ]),
        K.el("p", { class: "qz-stem", text: q.stem }),
        K.el("div", { class: "qz-opts" }, opts.map(function (o) { return o.btn; })),
        exp
      ]);
      list.appendChild(card);
      return { card: card, opts: opts, exp: exp };
    });

    var big = K.el("b", { class: "qz-big" });
    var sub = K.el("span");
    var scoreText = K.el("div", { class: "qz-scoretext" }, [K.el("b", { text: "答对" }), sub]);
    var again = K.el("button", { class: "qz-again", type: "button", text: "再测一次", onclick: reset });
    var score = K.el("div", { class: "qz-score", role: "status", "aria-live": "polite" }, [
      K.el("div", { class: "qz-big" }, [big, K.el("small", { text: "/6" })]),
      scoreText,
      again
    ]);
    var verdict = K.note("");
    body.appendChild(K.el("div", { class: "qz-wrap" }, [intro, list, score, verdict]));

    function choose(qi, oi) {
      if (answers[qi] > -1) return;
      answers[qi] = oi;
      render();
    }
    function reset() {
      answers = Q.map(function () { return -1; });
      render();
    }
    function render() {
      var answered = 0, correct = 0;
      Q.forEach(function (q, qi) {
        var a = answers[qi];
        if (a > -1) answered++;
        if (a === q.answer) correct++;
        cards[qi].opts.forEach(function (o, oi) {
          o.btn.disabled = a > -1;
          o.btn.classList.remove("is-correct", "is-wrong", "is-muted");
          o.mark.textContent = "";
          if (a > -1) {
            o.btn.classList.add("is-muted");
            if (oi === q.answer) {
              o.btn.classList.remove("is-muted");
              o.btn.classList.add("is-correct");
              o.mark.textContent = "✓";
            } else if (oi === a) {
              o.btn.classList.remove("is-muted");
              o.btn.classList.add("is-wrong");
              o.mark.textContent = "✗";
            }
          }
        });
        cards[qi].exp.hidden = a < 0;
        cards[qi].exp.textContent = "解析：" + q.exp;
        cards[qi].card.classList.toggle("is-answered", a > -1);
      });
      big.textContent = String(correct);
      sub.textContent = "已答 " + answered + "/6";
      score.classList.toggle("is-done", answered === 6);
      if (answered < 6) {
        verdict.textContent = answered === 0
          ? "6 道题覆盖层级、间距、文字、颜色、深度和图片——点击选项，马上知道书里的答案。"
          : "还有 " + (6 - answered) + " 题没答，答完看看总分。";
      } else if (correct === 6) {
        verdict.textContent = "6/6：这本书你是真读进手感里了。";
      } else if (correct >= 4) {
        verdict.textContent = "大部分观点都接住了，错的那几题回对应章节再翻翻。";
      } else if (correct >= 2) {
        verdict.textContent = "有几处还是「看起来对」——回第 2–7 章补一补。";
      } else {
        verdict.textContent = "别灰心，先读第 2 章「层级就是一切」，再回来。";
      }
    }
    render();
  }

  window.RUIDemo.register("quiz", { build: build });
})();
