"use strict";
/* 阿拉伯语：字母表（四种形态）、短元音符号、长元音与叠音、鼻音符、形态练习、拼读练习、埃及方言 */
window.HubLangPlugins.ar = function (E) {
  const { esc, audioOf, spkBtn, show, pageHead, play, SPK_SVG } = E;
  const MARKS = [["َ", "fatha", "a"], ["ِ", "kasra", "i"], ["ُ", "damma", "u"], ["ْ", "sukun", "—"],
    ["ً", "tanwin an", "-an"], ["ٍ", "tanwin in", "-in"], ["ٌ", "tanwin un", "-un"]];
  const TABS = [["letters", "28 个字母"], ["harakat", "短元音符号"], ["long", "长元音与叠音"], ["tanwin", "鼻音符"], ["forms", "形态练习"], ["compose", "拼读练习"], ["dialect", "埃及方言"]];
  let tab = "letters", fq = null, cp = null;
  const tip = (title, ...ps) => `<div class="card tipcard"><b>${title}</b>${ps.map(p => `<p>${p}</p>`).join("")}</div>`;
  const cell = (audio, big, name, rom, zh, extra) => `<div class="syl-cell" role="button" tabindex="0" data-audio="${esc(audio)}">
    <div class="syl-big tx">${esc(big)}</div>${name ? `<div class="syl-name tx">${esc(name)}</div>` : ""}${rom ? `<div class="syl-rom">${esc(rom)}</div>` : ""}<div class="syl-zh">${esc(zh)}</div>${extra || ""}</div>`;

  function formQuizNew() {
    const ls = (E.D.letters && E.D.letters.letters) || [];
    const item = ls[Math.floor(Math.random() * ls.length)], pool = ls.filter(l => l.n !== item.n), opts = [item];
    while (opts.length < 4 && pool.length) opts.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    opts.sort(() => Math.random() - .5);
    return { item, opts, ans: opts.indexOf(item), picked: null };
  }
  function cpQuizNew(ls) {
    const it = ls[Math.floor(Math.random() * ls.length)], mk = MARKS[Math.floor(Math.random() * MARKS.length)], right = it.iso + mk[0];
    const cands = ls.filter(l => l.n !== it.n).sort(() => Math.random() - .5).slice(0, 3);
    const opts = [{ text: right, ok: true }].concat(cands.map(l => ({ text: l.iso + mk[0], ok: false }))).sort(() => Math.random() - .5);
    return { opts, ans: opts.findIndex(o => o.ok), ansAudio: audioOf(right), picked: null };
  }
  const optCls = (q, i) => q.picked === null ? "" : i === q.ans ? "right" : i === q.picked ? "wrong" : "";

  function letters(arg) {
    if (arg) tab = arg;
    const L = E.D.letters || {};
    let h = `${pageHead("字母与发音", "阿拉伯语从右往左写。同一个字母在词首、词中、词末会换写法。点任意字母或符号都能听发音。")}
      <div class="tabs" role="tablist">${TABS.map(([k, l]) => `<button class="tab ${tab === k ? "active" : ""}" type="button" role="tab" data-tab="${k}">${l}</button>`).join("")}</div>`;

    if (tab === "letters") {
      const ls = L.letters || [];
      h += ls.length ? `<div class="letter-grid">${ls.map(l => `<div class="lcard" role="button" tabindex="0" data-audio="${esc(audioOf(l.say))}">
        <div class="lbig tx">${esc(l.iso)}</div><div class="lname tx">${esc(l.name)}</div><div class="lrom">${esc(l.rom)}</div>
        <div class="lzh">${esc(l.zh)}${l.nonconn ? ' <span class="tag">不左连</span>' : ""}</div>
        <div class="lforms tx">${esc(l.ini)} <span class="sep">·</span> ${esc(l.med)} <span class="sep">·</span> ${esc(l.fin)}</div></div>`).join("")}</div>` : '<div class="empty">字母表加载中</div>';
      h += tip("四种形态怎么看", "每个字母都有四种写法：<b>独立形</b>（单独出现）、<b>词首形</b>（在词的开头）、<b>词中形</b>（在词中间）、<b>词末形</b>（在词末）。卡片底部三个小字依次是词首、词中、词末形。",
        "标了「不左连」的 6 个字母（ا د ذ ر ز و）只跟右边的字母连，不跟左边连，所以它们后面一定会断开。");
    } else if (tab === "harakat") {
      const hs = (L.harakat || []).filter(x => ["َ", "ِ", "ُ", "ْ", "ّ"].includes(x.ch));
      h += `<div class="syl-grid">${hs.map(x => { const demo = "ب" + x.ch; return cell(audioOf(demo), demo, x.name, x.rom, x.zh); }).join("")}</div>`
        + tip("为什么书上标了这些小符号", "阿拉伯语正文通常<b>不写</b>短元音，只写辅音。初学阶段教材会全部标出来，叫「标音（tashkeel）」。上面的符号写在字母<b>上方或下方</b>：",
          "开口符 َ 在上（a）· 齐齿符 ِ 在下（i）· 合口符 ُ 在上（u）· 静音符 ْ 表示这个字母不带元音 · 叠音符 ّ 表示辅音读两遍。");
    } else if (tab === "long") {
      h += `<div class="syl-grid">${(L.longvowels || []).map(x => cell(audioOf(x.say), x.ch, "", x.rom, x.zh)).join("")}${
        (L.harakat || []).filter(x => x.ch === "ّ").map(x => cell(audioOf(x.say), "بَّ", x.name, x.rom, x.zh)).join("")}</div>`
        + tip("长元音不是新的字母", "长元音 ā ī ū 就是「短元音 + 三个「半元音字母」ا و ي」：开口符 َ 后面跟 ا → ā；齐齿符 ِ 后面跟 ي → ī；合口符 ُ 后面跟 و → ū。拖两拍读。",
          "叠音符 ّ 表示这个辅音读两遍，第一遍不带元音，第二遍带元音。例如 مُدَرِّس 读 mu-dar-ris。");
    } else if (tab === "tanwin") {
      h += `<div class="syl-grid">${(L.tanwin || []).map(x => { const demo = "كِتَاب" + (x.ch.match(/[ً-ٍ]/) || [""])[0];
        return cell(audioOf(demo), demo, "", x.rom, x.zh, `<div class="syl-tip">${esc(x.tip)}</div>`); }).join("")}</div>`
        + tip("鼻音符 = 短元音 + n", "名词不确指（泛指）时，词尾要加 -n 的鼻音：-an（宾格）、-in（属格）、-un（主格）。写出来就是短元音符号<b>双写</b>。", "这是阿拉伯语格变化的关键：同一个词，格不同，词尾符号就不同。");
    } else if (tab === "forms") {
      if (!(L.letters || []).length) { show(h); return; }
      if (!fq) fq = formQuizNew();
      const q = fq;
      h += `<div class="qbox card"><div class="q-hint">这个字母的<b>词中形</b>是下面哪一个？</div>
        <div class="q-iso tx" role="button" data-audio="${esc(audioOf(q.item.say))}">${esc(q.item.iso)}</div><div class="q-name tx">${esc(q.item.name)} · ${esc(q.item.rom)}</div>
        <div class="opts form-opts">${q.opts.map((o, i) => `<button class="opt tx form-opt ${optCls(q, i)}" type="button" data-fi="${i}">${esc(o.med)}</button>`).join("")}</div>
        ${q.picked !== null ? `<div class="q-after"><b>${q.picked === q.ans ? "答对了" : "正确答案：" + esc(q.opts[q.ans].med) + "（" + esc(q.opts[q.ans].rom) + "）"}</b><button class="btn" type="button" id="fNext">下一个</button></div>` : ""}</div>`;
    } else if (tab === "compose") {
      const ls = L.letters || [];
      if (!ls.length) { show(h); return; }
      cp ||= { i: 1, q: null };
      const it = ls[cp.i];
      h += `<div class="cp-letterbar">${ls.map((l, i) => `<button class="cp-lbtn tx ${i === cp.i ? "on" : ""}" type="button" data-ci="${i}">${esc(l.iso)}</button>`).join("")}</div>
        <div class="syl-grid">${MARKS.map(([m, name, rom]) => { const t = it.iso + m; return cell(audioOf(t), t, "", rom === "—" ? "sukun" : rom, name); }).join("")}</div>`;
      cp.q ||= cpQuizNew(ls);
      const q = cp.q;
      h += `<div class="qbox card"><div class="q-hint">听发音，选出你听到的那个组合</div><button class="btn primary" type="button" data-audio="${esc(q.ansAudio)}">${SPK_SVG} 再听一次</button>
        <div class="opts syl-opts">${q.opts.map((o, i) => `<button class="opt tx ${optCls(q, i)}" type="button" data-si="${i}">${esc(o.text)}</button>`).join("")}</div>
        ${q.picked !== null ? `<div class="q-after"><b>${q.picked === q.ans ? "答对了" : "正确答案：" + esc(q.opts[q.ans].text)}</b><button class="btn" type="button" id="cNext">再来一个</button></div>` : ""}</div>`;
    } else if (tab === "dialect") {
      const G = E.EXTRA.EGYPT || { letters: [], words: [] };
      h += tip("先看清楚：你学的是标准语，不是方言", "这套课程教的是<b>现代标准阿拉伯语（MSA）</b>——新闻、书籍、正式场合都用它，阿拉伯各国通用。但一落地埃及，日常口语（العامية）和书本差别不小。下面只列「听懂当地人在说什么」必须知道的差异，<b>不要求你说方言</b>：你自己讲标准语，对方完全听得懂，只是会回你方言。")
        + `<div class="tbl-wrap"><table class="tbl tt"><thead><tr><th>字母</th><th>标准语</th><th>埃及口语</th><th>例子</th><th>中文</th><th>说明</th></tr></thead><tbody>${G.letters.map(r =>
          `<tr><td class="tx" style="font-size:22px;text-align:center">${esc(r.ch)}</td><td>${esc(r.msa)}</td><td>${esc(r.eg)}</td><td class="tx" data-audio="${esc(audioOf(r.ex))}" style="cursor:pointer">${esc(r.ex)}${spkBtn(audioOf(r.ex))}</td><td>${esc(r.ex_zh)}</td><td>${esc(r.tip)}</td></tr>`).join("")}</tbody></table></div>
        <h4 style="margin:22px 0 8px">常用词与语法替换</h4>
        <div class="tbl-wrap"><table class="tbl tt"><thead><tr><th>标准语</th><th>埃及口语</th><th>中文</th><th>说明</th></tr></thead><tbody>${G.words.map(w =>
          `<tr><td class="tx">${esc(w.msa)}</td><td class="tx">${esc(w.eg)}</td><td>${esc(w.zh)}</td><td>${esc(w.tip || "")}</td></tr>`).join("")}</tbody></table></div>`
        + tip("怎么用这张表", "先把标准语学扎实，到埃及第一周自然就听出规律了。硬背方言会打乱你正在建立的格与词尾体系——方言几乎没有格变化，先学方言会养成「不带词尾」的习惯，回头再补很痛苦。",
          `完整版场景句见抽屉里「资料」下的<a href="${E.ctx.base}速查表.html" target="_blank" rel="noopener">场景速查表</a>。`);
    }

    const box = show(h);
    box.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { tab = b.dataset.tab; letters(); });
    box.querySelectorAll("[role=button][data-audio]").forEach(el => el.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); } });
    box.querySelectorAll("[data-fi]").forEach(b => b.onclick = () => { if (fq.picked !== null) return; fq.picked = +b.dataset.fi; letters(); });
    box.querySelector("#fNext")?.addEventListener("click", () => { fq = formQuizNew(); letters(); });
    box.querySelectorAll("[data-ci]").forEach(b => b.onclick = () => { cp.i = +b.dataset.ci; cp.q = null; letters(); });
    box.querySelectorAll("[data-si]").forEach(b => b.onclick = () => { if (cp.q.picked !== null) return; cp.q.picked = +b.dataset.si; letters(); });
    box.querySelector("#cNext")?.addEventListener("click", () => { cp.q = cpQuizNew(E.D.letters.letters); letters(); });
    if (tab === "compose" && cp && cp.q && cp.q.picked === null) setTimeout(() => play(cp.q.ansAudio), 250);
  }
  return { letters };
};
