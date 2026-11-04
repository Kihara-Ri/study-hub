"use strict";
/* 法语：字母与发音页（字母名、元音、鼻化元音、辅音、拼写规则、连诵、音标练习） */
window.HubLangPlugins.fr = function (E) {
  const { esc, audioOf, spkBtn, show, pageHead, ctx } = E;
  let tab = "letters", ipaQ = null;
  const TABS = [["letters", "26 个字母"], ["vowels", "元音"], ["nasal", "鼻化元音"], ["consonants", "辅音"], ["spelling", "拼写规则"], ["liaison", "连诵"], ["ipaq", "音标练习"]];

  function ipaQuizNew(pool) {
    const i = Math.floor(Math.random() * pool.length), ans = pool[i].ipa, set = new Set([ans]);
    while (set.size < 4) set.add(pool[Math.floor(Math.random() * pool.length)].ipa);
    const opts = [...set].sort(() => Math.random() - 0.5);
    return { n: pool.length, i, ans: opts.indexOf(ans), opts, picked: null };
  }
  const tip = (title, html) => `<div class="tipcard"><b>${title}</b><p>${html}</p></div>`;

  function letters(arg) {
    if (arg) tab = arg;
    const L = E.D.letters || {};
    let h = `${pageHead("字母与发音", "法语字母的名字跟英语不一样；而且写出来和读出来差得很远。点任意字母、音标或例词都能听发音。")}
      <div class="tabs" role="tablist">${TABS.map(([k, l]) => `<button class="tab ${tab === k ? "active" : ""}" type="button" role="tab" data-tab="${k}">${l}</button>`).join("")}</div>`;

    if (tab === "letters") {
      h += `<div class="letter-grid">${(L.letters || []).map(l => `<div class="lcard" role="button" tabindex="0" data-audio="${esc(audioOf(l.say))}">
        <div class="lbig tx">${esc(l.ch)}</div><div class="lname tx">${esc(l.name)}</div><div class="lrom">${esc(l.ipa)}</div><div class="lzh">${esc(l.zh)}</div></div>`).join("")}</div>`
        + tip("为什么要单独记字母名？", "拼读单词时读的是「音」，但说字母、拼缩写、听写时读的是「字母名」。法语里 G 叫「热」、J 叫「日」、R 叫「艾赫」、U 叫「于」，跟英语完全不同。点上面的卡片听一遍。");
    }
    if (tab === "vowels" || tab === "nasal" || tab === "consonants") {
      const arr = L[tab] || [];
      h += `<div class="syl-grid">${arr.map(x => `<div class="syl-cell" role="button" tabindex="0" data-audio="${esc(audioOf(x.say))}">
        <div class="syl-big tx">${esc(x.ipa)}</div><div class="syl-name tx">${esc(x.ex || x.sp || "")}</div><div class="syl-zh">${esc(x.zh)}</div></div>`).join("")}</div>`;
      if (tab === "vowels") h += tip("最容易混的三组", `[y] 和 [u]：<span class="tx">tu</span> 是「迂」（先摆 [i] 的舌位再圆唇），<span class="tx">tout</span> 是「乌」（舌头往后缩）。<br>
        [e] 和 [ɛ]：前者嘴收得更紧（<span class="tx">été</span>），后者嘴张得更大（<span class="tx">père</span>）。<br>[ø] 和 [œ]：前者舌位像 [e]，后者像 [ɛ]，嘴唇都是圆的。`);
      if (tab === "nasal") h += tip("鼻化元音的关键", `发鼻化元音时气流同时走口腔和鼻腔，<b>不要</b>把后面的 n 读出来。一旦后面紧跟元音或 n/m，就要「去鼻化」：<span class="tx">bon</span> [bɔ̃] → <span class="tx">bonne</span> [bɔn]。`);
      if (tab === "consonants") h += tip("两个中文里没有的音", `[ʁ]：小舌擦音，像轻轻漱口，<b>不要卷舌</b>，也不要发成英语的 r。<br>[ɲ]：gn 拼写，舌面抵硬腭，接近汉语「你」的声母。`);
    }
    if (tab === "spelling") {
      h += `<div class="table-wrap"><table class="tbl"><thead><tr><th>拼写</th><th>读音</th><th>例词</th><th>说明</th></tr></thead><tbody>${(L.spelling || []).map(r =>
        `<tr><td class="tx">${esc(r.sp)}</td><td class="tx">${esc(r.ipa)}</td><td class="tx">${esc(r.ex)}${spkBtn(audioOf(r.say))}</td><td class="nt">${esc(r.zh)}</td></tr>`).join("")}</tbody></table></div>`;
    }
    if (tab === "liaison") {
      h += `<div class="table-wrap"><table class="tbl"><thead><tr><th>类型</th><th>规则</th><th>例子</th><th>说明</th></tr></thead><tbody>${(L.liaison || []).map(r =>
        `<tr><td><span class="${r.kind === "必连" ? "tag" : ""}">${esc(r.kind)}</span></td><td>${esc(r.rule)}</td><td class="tx">${esc(r.ex)}</td><td class="nt">${esc(r.zh)}</td></tr>`).join("")}</tbody></table></div>`
        + tip("连诵是什么", `前一个词以不发音的辅音结尾、后一个词以元音开头时，这个辅音「借」给后面读出来：<span class="tx">les amis</span> 读 [le‿zami]。连诵分三类：必须连、绝不连（<span class="tx">et</span> 后面、h aspiré 前）、可连可不连。`);
    }
    if (tab === "ipaq") {
      const pool = L.ipaq || [];
      if (!ipaQ || ipaQ.n !== pool.length) ipaQ = ipaQuizNew(pool);
      const q = ipaQ, item = pool[q.i];
      h += `<div class="card ipaq"><div class="q-hint">这个词的音标是？</div><div class="q-iso tx">${esc(item.w)}</div><div class="q-hint" style="text-align:center">${esc(item.zh)}</div>
        <div class="form-opts">${q.opts.map((o, i) => {
          const cls = q.picked === null ? "btn ghost" : i === q.ans ? "btn" : i === q.picked ? "btn ghost bad" : "btn ghost";
          return `<button class="${cls}" type="button" data-ipao="${i}">${esc(o)}</button>`; }).join("")}</div>
        ${q.picked !== null ? `<div class="q-after"><b>${q.picked === q.ans ? "答对了" : "正确答案：" + esc(q.opts[q.ans])}</b><button class="btn" type="button" data-ipan>下一个</button></div>` : ""}</div>`;
    }
    const box = show(h);
    box.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { tab = b.dataset.tab; letters(); });
    box.querySelectorAll("[role=button][data-audio]").forEach(el => el.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); } });
    box.querySelectorAll("[data-ipao]").forEach(b => b.onclick = () => { if (!ipaQ || ipaQ.picked !== null) return; ipaQ.picked = +b.dataset.ipao; letters(); });
    box.querySelector("[data-ipan]")?.addEventListener("click", () => { ipaQ = null; letters(); });
  }
  return { letters };
};
