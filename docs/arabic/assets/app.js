/* ===== 现代标准阿拉伯语 · 互动学习台 ===== */
(function () {
  const D = window.COURSE || { chapters: [] };
  const $ = s => document.querySelector(s);
  const view = $('#view');
  const nav = $('#nav');
  const crumb = $('#crumb');
  const topActions = $('#topActions');
  const toastEl = $('#toast');

  /* ---------------- 工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const ARABIC = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g;
  const AR1 = /[\u0600-\u06FF]/;
  function arWrap(html) {
    // 仅处理不在标签内的文本
    return html.replace(/(^|>)([^<]+)/g, (m, p, t) => p + t.replace(ARABIC, x => '<span class="ar">' + x + '</span>'));
  }
  function md(s) {
    let t = esc(s);
    t = t.replace(/\*\*(.+?)\*\*/g, '<mark>$1</mark>');
    t = t.replace(/\n/g, '<br>');
    return arWrap(t);
  }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }
  function secs() {
    const out = [];
    D.chapters.forEach(ch => ch.sections.forEach(s => out.push(Object.assign({ _ch: ch }, s))));
    return out;
  }
  function findSec(id) { return secs().find(s => s.id === id); }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }

  /* ---------------- 音频 ---------------- */
  const player = $('#player');
  let curSpk = null;
  function play(aid, rate, spkEl) {
    if (!aid) { toast('这句没有音频'); return; }
    if (curSpk) curSpk.classList.remove('playing');
    if (spkEl) { spkEl.classList.add('playing'); curSpk = spkEl; }
    player.src = 'audio/' + aid + '.mp3';
    player.playbackRate = rate || (SRS.load().settings.rate || 1);
    player.currentTime = 0;
    const p = player.play();
    if (p && p.catch) p.catch(() => {});
    player.onended = () => { if (spkEl) spkEl.classList.remove('playing'); };
  }
  const SPK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L13 5v14L7.5 14.5H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  function spkBtn(aid, cls) {
    return `<button class="spk ${cls || ''}" data-audio="${esc(aid || '')}" title="播放">${SPK_SVG}</button>`;
  }


  /* ---------------- 图标（内联 SVG，避免 emoji 字体缺失） ---------------- */
  const SVG = (d, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${extra||''}>${d}</svg>`;
  const ICON = {
    home: SVG('<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>'),
    letters: SVG('<path d="M5 5h5.5a3.5 3.5 0 0 1 0 7H5z"/><path d="M5 12h6.5a3.5 3.5 0 0 1 0 7H5z"/>'),
    review: SVG('<path d="M3 12a9 9 0 0 1 15.5-6.2"/><path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M18.5 2v4.2h-4.2"/><path d="M5.5 22v-4.2h4.2"/>'),
    quiz: SVG('<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8.5h8M8 12.5h8M8 16.5h4"/>'),
    vocab: SVG('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5z"/><path d="M8 7h7"/>'),
    plan: SVG('<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M7.5 14h2M11 14h2M14.5 14h2M7.5 17.5h2M11 17.5h2"/>'),
    stats: SVG('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    book: SVG('<path d="M12 6.5C10 4.8 7.5 4 4.5 4v14c3 0 5.5.8 7.5 2.5 2-1.7 4.5-2.5 7.5-2.5V4c-3 0-5.5.8-7.5 2.5z"/><path d="M12 6.5V20"/>'),
    sun: SVG('<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6"/>'),
    help: SVG('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.2-2.5 3.9"/><circle cx="12" cy="17.3" r=".9" fill="currentColor" stroke="none"/>'),
    download: SVG('<path d="M12 3v11"/><path d="m7.5 10 4.5 4.5 4.5-4.5"/><path d="M4 20h16"/>'),
    menu: SVG('<path d="M4 7h16M4 12h16M4 17h16"/>')
  };

  /* ---------------- 路由 ---------------- */
  function route() {
    const h = (location.hash || '#/home').slice(2);
    const [name, arg] = h.split('/');
    if (curSpk) { curSpk.classList.remove('playing'); curSpk = null; }
    player.pause();
    window.scrollTo(0, 0);
    switch (name) {
      case 'lesson': return lesson(arg);
      case 'letters': return letters(arg);
      case 'review': return review();
      case 'quiz': return quiz(arg);
      case 'stats': return stats();
      case 'plan': return plan();
      case 'vocab': return vocabView(arg);
      case 'search': return searchView(decodeURIComponent(arg || ''));
      default: return home();
    }
  }
  window.addEventListener('hashchange', route);

  /* ---------------- 侧边导航 ---------------- */
  function renderNav() {
    const cur = (location.hash || '').slice(2);
    let h = '';
    h += navItem('home', ICON.home, '学习台', '');
    h += navItem('letters', ICON.letters, '字母表', '');
    h += navItem('review', ICON.review, '复习', '');
    h += navItem('quiz', ICON.quiz, '测验', '');
    h += navItem('vocab', ICON.vocab, '词库', '');
    h += navItem('plan', ICON.plan, '学习计划', '');
    h += navItem('stats', ICON.stats, '统计', '');
    D.chapters.forEach(ch => {
      const p = SRS.chapterProgress(ch);
      h += `<div class="nav-group"><div class="nav-item" data-go="lesson/${ch.sections[0] ? ch.sections[0].id : ''}">
        <span class="ico">${ICON.book}</span><span style="flex:1">${esc(ch.title)}</span>
        <span style="font-size:11px;color:var(--ink3)">${p.done}/${p.tot}</span></div>`;
      ch.sections.forEach(s => {
        const done = SRS.isDone(s.id);
        h += `<div class="nav-sec ${cur === 'lesson/' + s.id ? 'active' : ''}" data-go="lesson/${s.id}">
          <span class="dot ${done ? 'done' : ''}"></span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.title.replace(ARABIC, '').replace(/[：:]\s*$/, '').trim())}</span></div>`;
      });
      h += '</div>';
    });
    h += `<div class="nav-foot">
      <a class="nav-item" href="讲义.html" target="_blank" rel="noopener"><span class="ico">${ICON.book}</span><span style="flex:1">讲义（可打印）</span></a>
      <a class="nav-item" href="学习计划.html" target="_blank" rel="noopener"><span class="ico">${ICON.plan}</span><span style="flex:1">12 周计划</span></a>
      <a class="nav-item" href="速查表.html" target="_blank" rel="noopener"><span class="ico">${ICON.book}</span><span style="flex:1">场景速查表</span></a>
    </div>`;
    nav.innerHTML = h;
    nav.querySelectorAll('[data-go]').forEach(el => el.onclick = () => {
      location.hash = '#/' + el.dataset.go;
      $('#sidebar').classList.remove('open');
    });
  }
  function navItem(name, ico, label, extra) {
    const cur = (location.hash || '#/home').slice(2).split('/')[0];
    return `<div class="nav-item ${cur === name ? 'active' : ''}" data-go="${name}">
      <span class="ico">${ico}</span><span style="flex:1">${label}</span>${extra || ''}</div>`;
  }

  /* ---------------- 首页 ---------------- */
  function home() {
    crumb.textContent = '学习台';
    topActions.innerHTML = '';
    const st = SRS.cardStats();
    const due = SRS.dueQueue(999).length;
    const newQ = SRS.newQueue(999).length;
    const all = secs();
    const doneN = all.filter(s => SRS.isDone(s.id)).length;
    const next = all.find(s => !SRS.isDone(s.id)) || all[0];
    const hr = new Date().getHours();
    const greet = hr < 6 ? '夜深了' : hr < 11 ? '早上好' : hr < 14 ? '中午好' : hr < 19 ? '下午好' : '晚上好';
    const streak = SRS.streak();

    let h = `<div class="hero">
      <h2>${greet}，今天也来学一点阿拉伯语吧</h2>
      <p>${next ? `下一节：${esc(next._ch.title)} · ${esc(next.title)}` : '全书已学完，去复习巩固吧'}</p>
      <div class="btns">
        ${next ? `<button class="btn" data-go="lesson/${next.id}">继续学习 →</button>` : ''}
        <button class="btn ghost" data-go="review">开始复习${due ? `（${due}）` : ''}</button>
        <button class="btn ghost" data-go="quiz">来一组测验</button>
      </div>
    </div>`;

    h += `<div class="grid4" style="margin-top:18px">
      <div class="stat"><div class="n">${streak}<small> 天</small></div><div class="l">连续学习</div></div>
      <div class="stat"><div class="n">${st.seen}<small> / ${st.total}</small></div><div class="l">已接触卡片</div></div>
      <div class="stat"><div class="n" style="color:var(--pink)">${due}</div><div class="l">今日待复习</div></div>
      <div class="stat"><div class="n">${pct(doneN, all.length)}<small>%</small></div><div class="l">全书进度（${doneN}/${all.length} 节）</div></div>
    </div>`;

    h += `<div class="grid2" style="margin-top:18px;align-items:start">
      <div class="card"><h3>今日任务</h3><ul class="todo-list">
        <li><span class="dot ${doneN >= all.length ? 'done' : ''}"></span><div class="t"><b>学完 1 节新课</b><span>${next ? esc(next.title) : '—'}</span></div>
          ${next ? `<button class="btn sm line" data-go="lesson/${next.id}">去学</button>` : ''}</li>
        <li><span class="dot ${due === 0 ? 'done' : ''}"></span><div class="t"><b>复习 ${due} 张卡片</b><span>间隔重复，别让记忆漏掉</span></div>
          <button class="btn sm line" data-go="review">去复习</button></li>
        <li><span class="dot"></span><div class="t"><b>做 10 道测验</b><span>检验今天的学习效果</span></div>
          <button class="btn sm line" data-go="quiz">去测验</button></li>
      </ul></div>
      <div class="card"><h3>章节进度</h3>
        ${D.chapters.map(ch => {
          const p = SRS.chapterProgress(ch);
          return `<div style="margin:12px 0">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px">
              <span>${esc(ch.title)}</span><span style="color:var(--ink3)">${p.done}/${p.tot}</span></div>
            <div class="bar"><i style="width:${p.pct}%"></i></div></div>`;
        }).join('')}
      </div>
    </div>`;

    h += `<div class="card" style="margin-top:18px"><h3>怎么用这套学习台</h3>
      <div class="grid3" style="margin-top:10px">
        <div><b style="color:var(--pink)">① 先学发音</b><p style="font-size:13px;color:var(--ink2);margin:4px 0 0">第一章务必学扎实，点每个字母都能听发音。发音是后面一切的地基。</p></div>
        <div><b style="color:var(--teal)">② 每天 1 节 + 复习</b><p style="font-size:13px;color:var(--ink2);margin:4px 0 0">新知识只学 1 节，剩下的时间交给「复习」。卡片按记忆曲线自动排期。</p></div>
        <div><b style="color:var(--green)">③ 学完就测</b><p style="font-size:13px;color:var(--ink2);margin:4px 0 0">测验题从你学过的词汇和例句里随机生成，做错的会回到复习队列。</p></div>
      </div></div>`;

    view.className = 'view';
    view.innerHTML = h;
    bindGo();
  }

  /* ---------------- 课程页 ---------------- */
  function lesson(secId) {
    const s = findSec(secId);
    if (!s) { view.innerHTML = '<div class="empty">没找到这一节</div>'; return; }
    const ch = s._ch;
    const idx = secs().findIndex(x => x.id === secId);
    const all = secs();
    const prev = all[idx - 1], next = all[idx + 1];
    const st = SRS.load();
    crumb.textContent = ch.title + ' / ' + s.title;
    topActions.innerHTML = `<span class="pill">${esc(s.pages ? 'PDF p.' + s.pages : '')}</span>`;
    const hideZh = st.settings.hideZh;

    let h = `<div class="lesson-head">
      <div class="ch">${esc(ch.title)}</div>
      <h2>${esc(s.title)}</h2>
      <div class="meta">
        <span class="pill">${(s.concepts || []).length} 个知识点</span>
        <span class="pill">${(s.vocab || []).length} 个词</span>
        <span class="pill">${(s.examples || []).length} 个例句</span>
        ${SRS.isDone(secId) ? '<span class="pill green">✓ 已学</span>' : ''}
        <button class="pill" data-go="quiz/sec:${secId}">本节测验</button>
        <button class="pill" id="toggleZh">${hideZh ? '中文已遮挡 · 点击显示' : '中文已显示 · 点击遮挡'}</button>
      </div></div>`;

    if ((s.concepts || []).length) {
      h += `<div class="card"><h3>讲解</h3>`;
      s.concepts.forEach(c => {
        const isArCell = x => AR1.test(x) && !/[\u4e00-\u9fff]/.test(x);
        const tbls = (c.tables || []).map(tb => {
          const colAr = tb.header.map((_, i) => tb.rows.length > 0 && tb.rows.every(r => isArCell(r[i] || '')));
          return `<div class="tbl-wrap"><table class="tbl tt"><thead><tr>${
            tb.header.map((x, i) => `<th${colAr[i] ? ' class="ar"' : ''}>${md(esc(x))}</th>`).join('')}</tr></thead><tbody>${
            tb.rows.map(r => `<tr>${r.map(x => `<td class="${isArCell(x) ? 'ar' : ''}">${arWrap(esc(x))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
        }).join('');
        h += `<div class="concept"><h4>${arWrap(esc(c.title))}</h4>
          ${c.body ? c.body.split('\n').map(p => p.trim()).filter(Boolean).map(p => (AR1.test(p) && !/[\u4e00-\u9fff]/.test(p)) ? `<p class="ar-para">${arWrap(esc(p))}</p>` : `<p>${md(p)}</p>`).join('') : ''}${tbls}</div>`;
      });
      h += `</div>`;
    }

    if ((s.vocab || []).length) {
      h += `<div class="card" style="margin-top:16px"><h3>词汇 <span style="font-size:12px;color:var(--ink3);font-weight:400">点喇叭听发音</span></h3>
        <div class="vocab-grid">`;
      s.vocab.forEach(v => {
        h += `<div class="vcard ${hideZh ? 'hide' : ''}">
          ${spkBtn(v.a)}
          <div class="body"><div class="k">${esc(v.ar)}</div><div class="r">${esc(v.rom)}</div><div class="z">${esc(v.zh)}</div></div>
        </div>`;
      });
      h += `</div></div>`;
    }

    if ((s.examples || []).length) {
      h += `<div class="card" style="margin-top:16px"><h3>例句</h3>`;
      s.examples.forEach(e => {
        h += `<div class="ex">
          <div class="top">
            ${spkBtn(e.a)}
            <div style="flex:1">
              <div class="ar-line">${esc(e.ar)}</div>
              <div class="rom">${esc(e.rom)}</div>
            </div>
            <button class="spk" data-audio="${esc(e.a)}" data-rate="0.7" title="慢速 0.7×">0.7×</button>
          </div>
          <div class="zh ${hideZh ? 'hidden-zh' : ''}">${esc(e.zh)}</div>
          ${e.note ? `<div class="note">${esc(e.note)}</div>` : ''}
        </div>`;
      });
      h += `</div>`;
    }

    if ((s.drills || []).length) {
      h += `<div class="card" style="margin-top:16px"><h3>练习</h3>`;
      s.drills.forEach((d, i) => {
        h += `<div class="drill" data-i="${i}"><div class="q">${i + 1}. ${md(d.q)}</div>
          <div class="a">答案：${md(d.a || '—')}</div>
          <div class="reveal">显示答案</div></div>`;
      });
      h += `</div>`;
    }

    if ((s.tips || []).length) {
      h += `<div style="margin-top:16px">`;
      s.tips.forEach(t => { h += `<div class="tip"><b>易错提示</b> · ${md(t)}</div>`; });
      h += `</div>`;
    }

    if (!SRS.isDone(secId)) {
      h += `<div style="margin-top:22px"><button class="btn" id="markDone">✓ 学完了，标记本节完成</button></div>`;
    } else {
      h += `<div class="done-banner">✓ 本节已学完 · ${st.progress[secId] ? new Date(st.progress[secId].ts).toLocaleDateString('zh-CN') : ''}
        <button class="btn sm line" data-go="review" style="margin-left:auto">去复习</button></div>`;
    }

    h += `<div class="lesson-nav">
      <div>${prev ? `<button class="btn line" data-go="lesson/${prev.id}">← ${esc(prev.title)}</button>` : ''}</div>
      <div>${next ? `<button class="btn line" data-go="lesson/${next.id}">${esc(next.title)} →</button>` : ''}</div>
    </div>`;

    view.className = 'view';
    view.innerHTML = h;
    SRS.load().lastLesson = secId;
    SRS.save();

    bindGo();
    bindAudio(view);
    view.querySelectorAll('.vcard').forEach(c => c.onclick = ev => {
      if (ev.target.closest('.spk')) return;
      c.classList.toggle('hide');
    });
    view.querySelectorAll('.ex .zh.hidden-zh').forEach(z => z.onclick = () => z.classList.remove('hidden-zh'));
    view.querySelectorAll('.drill').forEach(d => {
      const rv = d.querySelector('.reveal');
      if (rv) rv.onclick = () => { d.classList.add('open'); rv.style.display = 'none'; };
    });
    const mdBtn = $('#markDone');
    if (mdBtn) mdBtn.onclick = () => {
      SRS.markDone(secId); toast('已标记完成'); renderNav(); lesson(secId);
    };
    const tz = $('#toggleZh');
    if (tz) tz.onclick = () => {
      const stt = SRS.load(); stt.settings.hideZh = !stt.settings.hideZh; SRS.save(); lesson(secId);
    };
  }

  /* ---------------- 字母与发音 ---------------- */
  // ================= 字母与发音 =================
  const MARKS = [['\u064e', 'fatha', 'a'], ['\u0650', 'kasra', 'i'], ['\u064f', 'damma', 'u'],
                 ['\u0652', 'sukun', '—'], ['\u064b', 'tanwin an', '-an'],
                 ['\u064d', 'tanwin in', '-in'], ['\u064c', 'tanwin un', '-un']];

  function letters(arg) {
    if (arg) letters._tab = arg;
    crumb.textContent = '字母与发音';
    topActions.innerHTML = '';
    const L = D.letters || {};
    let tab = letters._tab || 'letters';
    const tabs = [['letters', '28 个字母'], ['harakat', '短元音符号'], ['long', '长元音与叠音'],
                  ['tanwin', '鼻音符'], ['forms', '形态练习'], ['compose', '拼读练习'],
                  ['dialect', '埃及方言']];

    let h = `<h2 class="page-title">字母与发音</h2>
      <p class="page-sub">阿拉伯语从右往左写。同一个字母在词首、词中、词末会换写法。点任意字母或符号都能听发音。</p>
      <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${tab === k ? 'active' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>`;

    if (tab === 'letters') {
      const ls = L.letters || [];
      if (!ls.length) h += '<div class="empty">字母表加载中</div>';
      h += `<div class="letter-grid">`;
      ls.forEach(l => {
        h += `<div class="lcard" data-audio="${esc(audioOf(l.say) || '')}">
          <div class="lbig ar">${esc(l.iso)}</div>
          <div class="lname ar">${esc(l.name)}</div>
          <div class="lrom">${esc(l.rom)}</div>
          <div class="lzh">${esc(l.zh)}${l.nonconn ? ' <span class="tag">不左连</span>' : ''}</div>
          <div class="lforms ar">${esc(l.ini)} <span class="sep">·</span> ${esc(l.med)} <span class="sep">·</span> ${esc(l.fin)}</div>
        </div>`;
      });
      h += `</div>`;
      h += `<div class="card tipcard"><h4>四种形态怎么看</h4>
        <p>每个字母都有四种写法：<b>独立形</b>（单独出现）、<b>词首形</b>（在词的开头）、<b>词中形</b>（在词中间）、<b>词末形</b>（在词末）。卡片底部三个小字依次是词首、词中、词末形。</p>
        <p>标了「不左连」的 6 个字母（ا د ذ ر ز و）只跟右边的字母连，不跟左边连，所以它们后面一定会断开。</p></div>`;
    } else if (tab === 'harakat') {
      const hs = (L.harakat || []).filter(x => ['\u064e', '\u0650', '\u064f', '\u0652', '\u0651'].includes(x.ch));
      h += `<div class="syl-grid">`;
      hs.forEach(x => {
        const demo = 'ب' + x.ch;
        h += `<div class="syl-cell" data-audio="${esc(audioOf(demo) || '')}">
          <div class="syl-big ar">${esc(demo)}</div>
          <div class="syl-name ar">${esc(x.name)}</div>
          <div class="syl-rom">${esc(x.rom)}</div>
          <div class="syl-zh">${esc(x.zh)}</div></div>`;
      });
      h += `</div>`;
      h += `<div class="card tipcard"><h4>为什么书上标了这些小符号</h4>
        <p>阿拉伯语正文通常<b>不写</b>短元音，只写辅音。初学阶段教材会全部标出来，叫「标音（tashkeel）」。上面的符号写在字母<b>上方或下方</b>：</p>
        <p>开口符 َ 在上（a）· 齐齿符 ِ 在下（i）· 合口符 ُ 在上（u）· 静音符 ْ 表示这个字母不带元音 · 叠音符 ّ 表示辅音读两遍。</p></div>`;
    } else if (tab === 'long') {
      const lv = L.longvowels || [];
      const hs = (L.harakat || []).filter(x => x.ch === '\u0651');
      h += `<div class="syl-grid">`;
      lv.forEach(x => {
        h += `<div class="syl-cell" data-audio="${esc(audioOf(x.say) || '')}">
          <div class="syl-big ar">${esc(x.ch)}</div>
          <div class="syl-rom">${esc(x.rom)}</div>
          <div class="syl-zh">${esc(x.zh)}</div></div>`;
      });
      hs.forEach(x => {
        h += `<div class="syl-cell" data-audio="${esc(audioOf(x.say) || '')}">
          <div class="syl-big ar">بَّ</div>
          <div class="syl-name ar">${esc(x.name)}</div>
          <div class="syl-rom">${esc(x.rom)}</div>
          <div class="syl-zh">${esc(x.zh)}</div></div>`;
      });
      h += `</div>`;
      h += `<div class="card tipcard"><h4>长元音不是新的字母</h4>
        <p>长元音 ā ī ū 就是「短元音 + 三个「半元音字母」ا و ي」：开口符 َ 后面跟 ا → ā；齐齿符 ِ 后面跟 ي → ī；合口符 ُ 后面跟 و → ū。拖两拍读。</p>
        <p>叠音符 ّ 表示这个辅音读两遍，第一遍不带元音，第二遍带元音。例如 مُدَرِّس 读 mu-dar-ris。</p></div>`;
    } else if (tab === 'tanwin') {
      const tw = L.tanwin || [];
      h += `<div class="syl-grid">`;
      tw.forEach(x => {
        const demo = 'كِتَاب' + (x.ch.match(/[\u064b-\u064c\u064d]/) || [''])[0];
        h += `<div class="syl-cell" data-audio="${esc(audioOf(demo) || '')}">
          <div class="syl-big ar">${esc(demo)}</div>
          <div class="syl-rom">${esc(x.rom)}</div>
          <div class="syl-zh">${esc(x.zh)}</div>
          <div class="syl-tip">${esc(x.tip)}</div></div>`;
      });
      h += `</div>`;
      h += `<div class="card tipcard"><h4>鼻音符 = 短元音 + n</h4>
        <p>名词不确指（泛指）时，词尾要加 -n 的鼻音：-an（宾格）、-in（属格）、-un（主格）。写出来就是短元音符号<b>双写</b>。</p>
        <p>这是阿拉伯语格变化的关键：同一个词，格不同，词尾符号就不同。</p></div>`;
    } else if (tab === 'forms') {
      const ls = L.letters || [];
      if (!ls.length) return h;
      if (!letters._f || !letters._f.q) letters._f = formQuizNew();
      const q = letters._f.q;
      h += `<div class="qbox card">
        <div class="q-hint">这个字母的<b>词中形</b>是下面哪一个？</div>
        <div class="q-iso ar" data-audio="${esc(audioOf(q.item.say) || '')}">${esc(q.item.iso)}</div>
        <div class="q-name ar">${esc(q.item.name)} · ${esc(q.item.rom)}</div>
        <div class="opts form-opts">${q.opts.map((o, i) => `<button class="opt ar form-opt ${q.picked !== null && i === q.picked ? (i === q.ans ? 'right' : 'wrong') : (q.picked !== null && i === q.ans ? 'right' : '')}" data-fi="${i}">${esc(o.med)}</button>`).join('')}</div>
        ${q.picked !== null ? `<div class="q-after"><b>${q.picked === q.ans ? '答对了' : '正确答案：' + q.opts[q.ans].med + '（' + q.opts[q.ans].rom + '）'}</b>
          <button class="btn" id="fNext">下一个</button></div>` : ''}
      </div>`;
    } else if (tab === 'compose') {
      const ls = L.letters || [];
      if (!ls.length) return h;
      if (!letters._c) letters._c = { i: 1, q: null };
      const c = letters._c;
      const it = ls[c.i];
      h += `<div class="cp-letterbar">${ls.map((l, i) => `<button class="cp-lbtn ar ${i === c.i ? 'on' : ''}" data-ci="${i}">${esc(l.iso)}</button>`).join('')}</div>`;
      h += `<div class="syl-grid">`;
      MARKS.forEach(([m, name, rom]) => {
        const t = it.iso + m;
        h += `<div class="syl-cell" data-audio="${esc(audioOf(t) || '')}">
          <div class="syl-big ar">${esc(t)}</div>
          <div class="syl-rom">${esc(rom === '—' ? 'sukun' : rom)}</div>
          <div class="syl-zh">${esc(name)}</div></div>`;
      });
      h += `</div>`;
      if (!c.q) c.q = cpQuizNew(ls);
      const q = c.q;
      h += `<div class="qbox card">
        <div class="q-hint">听发音，选出你听到的那个组合</div>
        <button class="btn primary" data-audio="${esc(q.ansAudio)}">${SPK_SVG} 再听一次</button>
        <div class="opts syl-opts">${q.opts.map((o, i) => `<button class="opt ar ${q.picked !== null && i === q.picked ? (i === q.ans ? 'right' : 'wrong') : (q.picked !== null && i === q.ans ? 'right' : '')}" data-si="${i}">${esc(o.text)}</button>`).join('')}</div>
        ${q.picked !== null ? `<div class="q-after"><b>${q.picked === q.ans ? '答对了' : '正确答案：' + q.opts[q.ans].text}</b>
          <button class="btn" id="cNext">再来一个</button></div>` : ''}
      </div>`;
    } else if (tab === 'dialect') {
      const E = window.EGYPT || { letters: [], words: [] };
      h += `<div class="card tipcard"><h4>先看清楚：你学的是标准语，不是方言</h4>
        <p>这套课程教的是<b>现代标准阿拉伯语（MSA）</b>——新闻、书籍、正式场合都用它，阿拉伯各国通用。但一落地埃及，日常口语（العامية）和书本差别不小。下面只列「听懂当地人在说什么」必须知道的差异，<b>不要求你说方言</b>：你自己讲标准语，对方完全听得懂，只是会回你方言。</p></div>`;
      h += `<div class="tbl-wrap"><table class="tbl tt"><thead><tr><th>字母</th><th>标准语</th><th>埃及口语</th><th>例子</th><th>中文</th><th>说明</th></tr></thead><tbody>`;
      E.letters.forEach(r => {
        h += `<tr><td class="ar" style="font-size:22px;text-align:center">${esc(r.ch)}</td>
          <td>${esc(r.msa)}</td><td>${esc(r.eg)}</td>
          <td class="ar" data-audio="${esc(audioOf(r.ex) || '')}" style="cursor:pointer">${esc(r.ex)}${spkBtn(audioOf(r.ex))}</td>
          <td>${esc(r.ex_zh)}</td><td>${esc(r.tip)}</td></tr>`;
      });
      h += `</tbody></table></div>`;
      h += `<h4 style="margin:22px 0 8px">常用词与语法替换</h4>`;
      h += `<div class="tbl-wrap"><table class="tbl tt"><thead><tr><th>标准语</th><th>埃及口语</th><th>中文</th><th>说明</th></tr></thead><tbody>`;
      E.words.forEach(w => {
        h += `<tr><td class="ar">${esc(w.msa)}</td><td class="ar">${esc(w.eg)}</td><td>${esc(w.zh)}</td><td>${esc(w.tip || '')}</td></tr>`;
      });
      h += `</tbody></table></div>`;
      h += `<div class="card tipcard"><h4>怎么用这张表</h4>
        <p>先把标准语学扎实，到埃及第一周自然就听出规律了。硬背方言会打乱你正在建立的格与词尾体系——方言几乎没有格变化，先学方言会养成「不带词尾」的习惯，回头再补很痛苦。</p>
        <p>完整版场景句见侧栏底部的「<a href="速查表.html" target="_blank" rel="noopener">场景速查表</a>」。</p></div>`;
    }

    view.innerHTML = h;
    bindAudio(view);
    view.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => {
      letters._tab = b.dataset.tab; letters(b.dataset.tab);
    }));
    if (tab === 'forms') {
      view.querySelectorAll('.form-opt').forEach(b => b.addEventListener('click', () => {
        if (letters._f.q.picked !== null) return;
        letters._f.q.picked = +b.dataset.fi; letters('forms');
      }));
      const nb = $('#fNext'); if (nb) nb.addEventListener('click', () => { letters._f = formQuizNew(); letters('forms'); });
    }
    if (tab === 'compose') {
      view.querySelectorAll('[data-ci]').forEach(b => b.addEventListener('click', () => {
        letters._c.i = +b.dataset.ci; letters._c.q = null; letters('compose');
      }));
      view.querySelectorAll('.syl-opts .opt').forEach(b => b.addEventListener('click', () => {
        if (letters._c.q.picked !== null) return;
        letters._c.q.picked = +b.dataset.si; letters('compose');
      }));
      const nb = $('#cNext'); if (nb) nb.addEventListener('click', () => { letters._c.q = cpQuizNew(D.letters.letters); letters('compose'); });
      const q = letters._c.q;
      if (q && q.picked === null) setTimeout(() => play(q.ansAudio), 250);
    }
    return h;
  }

  function formQuizNew() {
    const ls = (D.letters && D.letters.letters) || [];
    const item = ls[Math.floor(Math.random() * ls.length)];
    const pool = ls.filter(l => l.n !== item.n);
    const opts = [item];
    while (opts.length < 4 && pool.length) opts.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    opts.sort(() => Math.random() - .5);
    return { item, opts, ans: opts.indexOf(item), picked: null };
  }

  function cpQuizNew(ls) {
    const it = ls[Math.floor(Math.random() * ls.length)];
    const mk = MARKS[Math.floor(Math.random() * MARKS.length)];
    const right = it.iso + mk[0];
    const cands = ls.filter(l => l.n !== it.n).sort(() => Math.random() - .5).slice(0, 3);
    const opts = [{ text: right, ok: true }].concat(cands.map(l => ({ text: l.iso + mk[0], ok: false })));
    opts.sort(() => Math.random() - .5);
    return { opts, ans: opts.findIndex(o => o.ok), ansAudio: audioOf(right), picked: null };
  }

  function audioOf(say) {
    if (!say) return '';
    // 与 build 时一致：sha1(say)[:12] —— 由 data.js 里的 map 提供
    return (window.AUDIO_MAP || {})[say] || '';
  }

  /* ---------------- 复习 ---------------- */
  let revSession = null;
  function review() {
    crumb.textContent = '复习';
    topActions.innerHTML = '';
    if (!revSession) {
      const due = SRS.dueQueue(120);
      const nw = SRS.newQueue(SRS.load().settings.newPerDay);
      revSession = { queue: due.concat(nw), i: 0, flipped: false, ok: 0, again: 0, started: Date.now() };
    }
    const q = revSession.queue;
    if (revSession.i >= q.length) return reviewDone();

    const c = q[revSession.i];
    const total = q.length, idx = revSession.i;
    let h = `<div class="review-wrap">
      <div class="rev-progress"><span>${idx + 1} / ${total}</span><div class="bar"><i style="width:${pct(idx, total)}%"></i></div>
        <span>✓ ${revSession.ok}</span></div>
      <div class="flash" id="flash">`;
    if (!revSession.flipped) {
      if (c.dir === 'zh2ar') {
        h += `<div class="front-zh">${esc(c.front)}</div>`;
      } else {
        h += `<div class="front-ar">${esc(c.front)}</div>`;
        if (c.audio) h += `<div class="front-audio">${spkBtn(c.audio)}</div>`;
      }
      h += `<div class="hint">点击卡片翻面 · 空格键</div></div>`;
    } else {
      h += `<div class="front-ar" style="font-size:30px">${esc(c.dir === 'zh2ar' ? c.back : c.front)}</div>
        <div class="back">
          ${c.audio ? `<div style="margin-bottom:10px">${spkBtn(c.audio)}</div>` : ''}
          ${c.dir === 'zh2ar' ? `<div class="zh2">${esc(c.front)}</div>` : `<div class="ar2">${esc(c.back)}</div>`}
          <div class="rom2">${esc(c.rom || '')}</div>
          ${c.note ? `<div class="note2">${esc(c.note)}</div>` : ''}
          <div style="font-size:12px;color:var(--ink3);margin-top:10px">${esc(c.chTitle)} · ${esc(c.secTitle)}</div>
        </div></div>`;
    }
    h += `</div>`;
    if (revSession.flipped) {
      h += `<div class="rate-row">
        <button class="rate" data-r="0">忘记<small>1</small></button>
        <button class="rate" data-r="1">模糊<small>2</small></button>
        <button class="rate" data-r="2">记得<small>3</small></button>
        <button class="rate" data-r="3">太简单<small>4</small></button>
      </div>`;
    } else {
      h += `<div style="text-align:center;margin-top:14px"><button class="btn line" id="flipBtn">显示答案</button></div>`;
    }
    h += `</div>`;
    view.className = 'view';
    view.innerHTML = h;

    const flip = () => { revSession.flipped = true; review(); };
    const flash = $('#flash');
    if (flash) flash.onclick = e => { if (!e.target.closest('.spk')) flip(); };
    const fb = $('#flipBtn'); if (fb) fb.onclick = flip;
    view.querySelectorAll('.rate').forEach(b => b.onclick = () => {
      const r = +b.dataset.r;
      SRS.rate(c.id, r);
      if (r === 0) { revSession.again++; revSession.queue.push(c); } else revSession.ok++;
      revSession.flipped = false;
      revSession.i++;
      review();
    });
    bindAudio(view);
  }
  function reviewDone() {
    const n = revSession ? revSession.ok + revSession.again : 0;
    const mins = revSession ? Math.max(1, Math.round((Date.now() - revSession.started) / 60000)) : 0;
    const st = SRS.cardStats();
    let h = `<div class="empty"><div class="big">${SVG('<circle cx="12" cy="12" r="9.2"/><path d="m7.8 12.3 2.9 2.9 5.6-5.9"/>')}</div>
      <h2 class="page-title">今天的复习完成了</h2>
      <p class="page-sub">复习 ${n} 张 · 用时约 ${mins} 分钟 · 待复习 ${st.due} 张</p>
      <div class="btns" style="justify-content:center;display:flex;gap:10px">
        <button class="btn" data-go="home">回到学习台</button>
        <button class="btn line" id="againBtn">再复习一轮</button>
        <button class="btn line" data-go="quiz">做测验</button>
      </div></div>`;
    view.className = 'view';
    view.innerHTML = h;
    bindGo();
    $('#againBtn').onclick = () => { revSession = null; review(); };
    revSession = null;
  }

  /* ---------------- 测验 ---------------- */
  let quizState = null;
  function quiz(scope) {
    crumb.textContent = '测验';
    topActions.innerHTML = '';
    if (!quizState && scope && String(scope).startsWith('sec:')) {
      const sid = String(scope).slice(4);
      const qs = QUIZ.build([sid], 8);
      if (!qs.length) { toast('这一节还没有足够的词汇，先去学一下'); quiz(); return; }
      quizState = { qs, i: 0, wrong: [], right: 0, secIds: [sid], scope: 'sec' };
      return quiz();
    }
    if (!quizState && scope) {
      let secIds = null, n = 10;
      if (scope === 'all') { secIds = secs().map(s => s.id); n = 20; }
      else { const ch = D.chapters.find(c => c.id === scope); if (ch) secIds = ch.sections.map(s => s.id); }
      if (secIds) {
        const qs = QUIZ.build(secIds, n);
        if (!qs.length) { toast('这一章还没有足够的词汇，先去学几节吧'); }
        else { quizState = { qs, i: 0, wrong: [], right: 0, secIds, scope }; return quiz(); }
      }
    }
    if (!quizState) {
      let h = `<h2 class="page-title">测验</h2>
        <p class="page-sub">题目从你学过的词汇和例句里自动生成，做错的词会回到复习队列。</p>
        <div class="card"><h3>选择范围</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">`;
      D.chapters.forEach(ch => {
        const p = SRS.chapterProgress(ch);
        h += `<button class="btn line" data-scope="${ch.id}">${esc(ch.title)} <span style="color:var(--ink3);font-weight:400">${p.pct}%</span></button>`;
      });
      h += `<button class="btn" data-scope="all">全书随机 20 题</button></div></div>`;
      view.className = 'view';
      view.innerHTML = h;
      view.querySelectorAll('[data-scope]').forEach(b => b.onclick = () => {
        const sc = b.dataset.scope;
        let secIds;
        if (sc === 'all') secIds = secs().map(s => s.id);
        else secIds = D.chapters.find(c => c.id === sc).sections.map(s => s.id);
        const n = sc === 'all' ? 20 : 10;
        const qs = QUIZ.build(secIds, n);
        if (!qs.length) { toast('这一章还没有足够的词汇，先去学几节吧'); return; }
        quizState = { qs, i: 0, wrong: [], right: 0, secIds, scope: sc };
        quiz();
      });
      return;
    }
    const S = quizState;
    if (S.i >= S.qs.length) return quizResult();
    const q = S.qs[S.i];
    let h = `<div class="qbox">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="qtype">${esc(q.label)}</span>
        <span class="qmeta">${S.i + 1} / ${S.qs.length}</span>
      </div>
      <div class="qtext ${q.promptClass}">${esc(q.prompt)}</div>
      ${q.audio ? `<div style="margin:-10px 0 16px">${spkBtn(q.audio)} <span style="font-size:12px;color:var(--ink3)">点喇叭再听一次</span></div>` : ''}
      <div class="opts">`;
    q.options.forEach((o, i) => {
      h += `<button class="opt ${o.ar ? 'ar-opt' : ''}" data-i="${i}">${esc(o.text)}</button>`;
    });
    h += `</div><div class="qfeed" id="feed"></div>
      <div class="qfoot"><span class="qmeta">✓ ${S.right}</span>
      <button class="btn line" id="nextBtn" style="display:none">下一题 →</button></div></div>`;
    view.className = 'view';
    view.innerHTML = h;
    bindAudio(view);
    if (q.audio) setTimeout(() => play(q.audio), 260);
    let answered = false;
    view.querySelectorAll('.opt').forEach(btn => btn.onclick = () => {
      if (answered) return;
      answered = true;
      const i = +btn.dataset.i;
      const correct = i === q.answerIndex;
      view.querySelectorAll('.opt').forEach((b, j) => {
        b.disabled = true;
        if (j === q.answerIndex) b.classList.add('correct');
        else if (j === i) b.classList.add('wrong');
      });
      if (correct) { S.right++; $('#feed').innerHTML = '✓ 答对了 · ' + esc(q.explain); }
      else {
        S.wrong.push(q);
        $('#feed').innerHTML = '✗ 正确答案：' + esc(q.options[q.answerIndex].text) + '<br><span style="font-size:12.5px;color:var(--ink3)">' + esc(q.explain) + '</span>';
      }
      const nb = $('#nextBtn');
      nb.style.display = '';
      nb.textContent = S.i + 1 >= S.qs.length ? '看结果 →' : '下一题 →';
      nb.onclick = () => { S.i++; quiz(); };
      nb.focus();
    });
  }
  function quizResult() {
    const S = quizState;
    const acc = Math.round(S.right / S.qs.length * 100);
    let h = `<div class="empty"><div class="big">${acc >= 80 ? '🏆' : acc >= 60 ? '👍' : '💪'}</div>
      <h2 class="page-title">${S.right} / ${S.qs.length} 正确（${acc}%）</h2>
      <p class="page-sub">${acc >= 80 ? '掌握得不错，继续保持！' : '错题已记录，会在复习里再见到它们。'}</p></div>`;
    if (S.wrong.length) {
      h += `<div class="card"><h3>错题回顾</h3>`;
      S.wrong.forEach(q => {
        h += `<div class="ex"><div class="ar-line">${esc(q.options[q.answerIndex].text)}</div>
          <div class="zh">${esc(q.explain)}</div></div>`;
      });
      h += `</div>`;
    }
    h += `<div style="display:flex;gap:10px;margin-top:18px">
      <button class="btn" data-go="quiz">再来一组</button>
      <button class="btn line" data-go="home">回到学习台</button>
      <button class="btn line" id="retryWrong">重做错题</button></div>`;
    view.className = 'view';
    view.innerHTML = h;
    bindGo();
    $('#retryWrong').onclick = () => {
      if (!S.wrong.length) { toast('没有错题'); return; }
      quizState = { qs: S.wrong.slice(), i: 0, wrong: [], right: 0, secIds: S.secIds, scope: S.scope };
      quiz();
    };
  }

  /* ---------------- 统计 ---------------- */
  function stats() {
    crumb.textContent = '统计';
    topActions.innerHTML = '';
    const st = SRS.cardStats();
    const s = SRS.load();
    const days = Object.keys(s.days).sort().slice(-30);
    const maxRev = Math.max(1, ...days.map(d => s.days[d].rev || 0));
    let h = `<h2 class="page-title">学习统计</h2><p class="page-sub">数据保存在本机浏览器里，换设备不同步。</p>
      <div class="grid4">
        <div class="stat"><div class="n">${SRS.streak()}<small> 天</small></div><div class="l">连续学习</div></div>
        <div class="stat"><div class="n">${st.seen}<small> / ${st.total}</small></div><div class="l">已接触卡片</div></div>
        <div class="stat"><div class="n">${st.mature}</div><div class="l">长期记住（间隔≥21天）</div></div>
        <div class="stat"><div class="n" style="color:var(--pink)">${st.due}</div><div class="l">今日待复习</div></div>
      </div>
      <div class="card" style="margin-top:18px"><h3>最近 30 天复习量</h3>
        <div style="display:flex;align-items:flex-end;gap:4px;height:110px;margin-top:14px">`;
    const last30 = [];
    for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); last30.push(d); }
    last30.forEach(d => {
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const v = (s.days[k] && s.days[k].rev) || 0;
      h += `<div title="${k} · ${v} 张" style="flex:1;height:${Math.max(3, v / maxRev * 100)}%;background:${v ? 'var(--pink)' : 'var(--bg2)'};border-radius:3px"></div>`;
    });
    h += `</div><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink3);margin-top:6px"><span>30 天前</span><span>今天</span></div></div>`;

    h += `<div class="card" style="margin-top:18px"><h3>各章进度</h3>`;
    D.chapters.forEach(ch => {
      const p = SRS.chapterProgress(ch);
      h += `<div style="margin:14px 0"><div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:5px">
        <span>${esc(ch.title)}</span><span style="color:var(--ink3)">${p.done}/${p.tot} 节</span></div>
        <div class="bar"><i style="width:${p.pct}%"></i></div></div>`;
    });
    h += `</div>`;

    const wrongIds = Object.keys(s.wrong || {}).sort((a, b) => s.wrong[b] - s.wrong[a]).slice(0, 20);
    if (wrongIds.length) {
      const cmap = {};
      SRS.buildCards().forEach(c => cmap[c.id] = c);
      h += `<div class="card" style="margin-top:18px"><h3>最常错的卡</h3><div class="table-wrap" style="max-height:340px"><table class="tbl">
        <thead><tr><th>内容</th><th>释义</th><th>错误次数</th></tr></thead><tbody>`;
      wrongIds.forEach(id => {
        const c = cmap[id]; if (!c) return;
        h += `<tr><td class="ar">${esc(c.front)}</td><td>${esc(c.dir === 'zh2ar' ? c.front : c.back)}</td><td>${s.wrong[id]}</td></tr>`;
      });
      h += `</tbody></table></div></div>`;
    }

    h += `<div style="margin-top:22px;display:flex;gap:10px">
      <button class="btn line" id="exportBtn2">导出学习数据（JSON）</button>
      <button class="btn line" id="resetBtn" style="color:#d05a5a">清空所有学习记录</button></div>`;
    view.className = 'view';
    view.innerHTML = h;
    $('#exportBtn2').onclick = exportData;
    $('#resetBtn').onclick = () => {
      if (confirm('确定清空全部学习记录？此操作不可恢复。')) { SRS.reset(); toast('已清空'); stats(); renderNav(); }
    };
  }

  /* ---------------- 词库 ---------------- */
  function vocabView() {
    crumb.textContent = '词库';
    topActions.innerHTML = '';
    const all = [];
    D.chapters.forEach(ch => ch.sections.forEach(s => (s.vocab || []).forEach(v => all.push(Object.assign({ sec: s.title, ch: ch.title, secId: s.id }, v)))));
    const q = vocabView._q || '';
    const list = q ? all.filter(v => (v.ar + v.zh + v.rom).toLowerCase().includes(q.toLowerCase())) : all;
    let h = `<h2 class="page-title">词库</h2><p class="page-sub">全书共 ${all.length} 个词条。点喇叭听发音，点中文可遮挡自测。</p>
      <div style="margin-bottom:14px"><input id="vq" placeholder="筛选：阿语 / 中文 / 转写" value="${esc(q)}"
        style="width:100%;max-width:380px;padding:10px 14px;border-radius:11px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:14px"></div>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>阿拉伯语</th><th>转写</th><th>中文</th><th>出处</th></tr></thead><tbody>`;
    list.slice(0, 3000).forEach(v => {
      h += `<tr><td class="ar">${esc(v.ar)}${spkBtn(v.a)}</td><td style="font-family:var(--mono);font-size:12px;color:var(--ink3)">${esc(v.rom)}</td>
        <td>${esc(v.zh)}</td><td style="font-size:12px;color:var(--ink3);white-space:nowrap">${esc(v.ch)} · ${esc(v.sec)}</td></tr>`;
    });
    h += `</tbody></table></div>`;
    if (!list.length) h = `<div class="empty">没有匹配的词</div>`;
    view.className = 'view wide';
    view.innerHTML = h;
    bindAudio(view);
    const inp = $('#vq');
    if (inp) inp.oninput = () => { vocabView._q = inp.value; const pos = inp.selectionStart; vocabView(); const i2 = $('#vq'); if (i2) { i2.focus(); i2.setSelectionRange(pos, pos); } };
  }

  /* ---------------- 搜索 ---------------- */
  function searchView(q) {
    crumb.textContent = '搜索：' + q;
    topActions.innerHTML = '';
    if (!q) { view.innerHTML = '<div class="empty">输入关键词搜索</div>'; return; }
    const res = [];
    secs().forEach(s => {
      const hit = [];
      (s.concepts || []).forEach(c => { if ((c.title + c.body).includes(q)) hit.push({ t: c.title, b: c.body.slice(0, 120) }); });
      (s.vocab || []).forEach(v => { if ((v.ar + v.zh + v.rom).includes(q)) hit.push({ t: v.ar + ' ' + v.zh, b: v.rom }); });
      (s.examples || []).forEach(e => { if ((e.ar + e.zh).includes(q)) hit.push({ t: e.ar, b: e.zh }); });
      if (hit.length) res.push({ s, hit });
    });
    let h = `<h2 class="page-title">搜索「${esc(q)}」</h2><p class="page-sub">${res.length} 节命中</p>`;
    res.forEach(r => {
      h += `<div class="card" style="margin-bottom:12px"><h3><a href="#/lesson/${r.s.id}">${esc(r.s._ch.title)} · ${esc(r.s.title)}</a></h3>`;
      r.hit.slice(0, 6).forEach(x => {
        h += `<div style="font-size:13.5px;margin:6px 0"><b>${arWrap(esc(x.t))}</b> <span style="color:var(--ink3)">${arWrap(esc(x.b))}</span></div>`;
      });
      h += `</div>`;
    });
    if (!res.length) h += `<div class="empty">没有找到「${esc(q)}」</div>`;
    view.className = 'view';
    view.innerHTML = h;
  }

  /* ---------------- 学习计划 ---------------- */
  function plan() {
    crumb.textContent = '学习计划';
    topActions.innerHTML = '';
    const planData = D.plan || [];
    let h = `<h2 class="page-title">12 周学习计划</h2>
      <p class="page-sub">按每周 5 天、每天 40–60 分钟设计。零基础从头学，学完能读懂简单的阿语短文和新闻标题。</p>`;
    if (!planData.length) {
      h += `<div class="empty">计划生成中</div>`;
    } else {
      planData.forEach((w, i) => {
        const ids = w.sections || [];
        const done = ids.filter(id => SRS.isDone(id)).length;
        h += `<div class="week-card">
          <div style="display:flex;align-items:center;gap:10px"><span class="tag">第 ${i + 1} 周</span>
            <h4 style="margin:0">${esc(w.name || w.title)}</h4>
            <span style="margin-left:auto;font-size:12px;color:var(--ink3)">${done}/${ids.length} 节</span></div>
          <div class="bar" style="margin:8px 0 10px"><i style="width:${pct(done, ids.length)}%"></i></div>
          <ul>${(w.goals || []).map(g => `<li>${esc(g)}</li>`).join('')}</ul>
          <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">`;
        ids.forEach(id => {
          const s = findSec(id); if (!s) return;
          h += `<button class="btn sm line" data-go="lesson/${id}" style="${SRS.isDone(id) ? 'border-color:var(--green);color:var(--green)' : ''}">${SRS.isDone(id) ? '✓ ' : ''}${esc(s.title)}</button>`;
        });
        h += `</div></div>`;
      });
    }
    view.className = 'view';
    view.innerHTML = h;
    bindGo();
  }

  /* ---------------- 通用绑定 ---------------- */
  function bindGo() {
    view.querySelectorAll('[data-go]').forEach(el => el.onclick = () => { location.hash = '#/' + el.dataset.go; });
  }
  function bindAudio(root) {
    (root || view).querySelectorAll('[data-audio]').forEach(el => {
      el.onclick = ev => {
        ev.stopPropagation();
        play(el.dataset.audio, el.dataset.rate ? +el.dataset.rate : null, el.classList.contains('spk') ? el : null);
      };
    });
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(SRS.load(), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '阿语学习数据-' + SRS.today() + '.json';
    a.click();
    toast('已导出');
  }

  /* ---------------- 全局事件 ---------------- */
  $('#themeBtn').innerHTML = ICON.sun;
  $('#helpBtn').innerHTML = ICON.help;
  $('#exportBtn').innerHTML = ICON.download;
  $('#hamburger').innerHTML = ICON.menu;
  $('#themeBtn').onclick = () => {
    const st = SRS.load();
    st.settings.theme = st.settings.theme === 'dark' ? 'light' : 'dark';
    SRS.save();
    document.documentElement.dataset.theme = st.settings.theme;
    toast(st.settings.theme === 'dark' ? '深色模式' : '浅色模式');
  };
  $('#helpBtn').onclick = () => alert(
    '快捷键：\n· 复习时：空格 / 回车 翻面，1-4 评分\n· 课程页：← → 切换上下节\n\n学习数据保存在本机浏览器（localStorage），换浏览器或清缓存会丢失，可在「统计」页导出备份。'
  );
  $('#exportBtn').onclick = exportData;
  $('#hamburger').onclick = () => $('#sidebar').classList.toggle('open');
  const si = $('#searchInput');
  si.onkeydown = e => { if (e.key === 'Enter' && si.value.trim()) location.hash = '#/search/' + encodeURIComponent(si.value.trim()); };
  document.addEventListener('keydown', e => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (/INPUT|TEXTAREA/.test(tag)) return;
    const r = (location.hash || '').slice(2);
    if (r.startsWith('review')) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (revSession && !revSession.flipped) { revSession.flipped = true; review(); }
      }
      if (revSession && revSession.flipped && /^[1-4]$/.test(e.key)) {
        const b = view.querySelector(`.rate[data-r="${+e.key - 1}"]`); if (b) b.click();
      }
    } else if (r.startsWith('lesson/')) {
      const id = r.split('/')[1];
      const all = secs(); const i = all.findIndex(x => x.id === id);
      if (e.key === 'ArrowRight' && all[i + 1]) location.hash = '#/lesson/' + all[i + 1].id;
      if (e.key === 'ArrowLeft' && all[i - 1]) location.hash = '#/lesson/' + all[i - 1].id;
    }
  });

  /* ---------------- 启动 ---------------- */
  const st0 = SRS.load();
  document.documentElement.dataset.theme = st0.settings.theme || 'light';
  renderNav();
  route();
  window.addEventListener('hashchange', renderNav);
})();
