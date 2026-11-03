/* ===== 测验题生成 ===== */
(function () {
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function poolFor(secIds) {
    const D = window.COURSE;
    const inSec = [], inCh = [], global = [];
    const secSet = new Set(secIds);
    D.chapters.forEach(ch => ch.sections.forEach(sec => {
      (sec.vocab || []).forEach(v => {
        const item = { fr: v.fr, zh: v.zh, ipa: v.ipa, audio: v.a, sec: sec.id, ch: ch.id };
        if (!item.zh) return;
        if (secSet.has(sec.id)) inSec.push(item); else if (secIds.some(s => s.startsWith(ch.id))) inCh.push(item);
        global.push(item);
      });
    }));
    return { inSec, inCh, global };
  }

  function distractors(pool, ans, key, n) {
    const out = [];
    const seen = new Set([ans[key]]);
    const tries = shuffle(pool.slice());
    for (const p of tries) {
      if (out.length >= n) break;
      const val = p[key];
      if (!val || seen.has(val)) continue;
      seen.add(val);
      out.push(p);
    }
    return out;
  }

  /**
   * 生成一套题
   * @param {string[]} secIds 章节 id 列表
   * @param {number} count
   */
  function build(secIds, count) {
    const D = window.COURSE;
    const pool = poolFor(secIds);
    let base = pool.inSec.length >= 4 ? pool.inSec : (pool.inSec.length + pool.inCh.length >= 4 ? pool.inSec.concat(pool.inCh) : pool.global);
    if (base.length < 4) return [];
    const types = ['fr2zh', 'zh2fr', 'audio2fr', 'ipa2fr'];
    const qs = [];
    const used = new Set();
    let guard = 0;
    while (qs.length < count && guard++ < count * 12) {
      const item = pick(base);
      if (!item.fr || !item.zh) continue;
      let type = pick(types);
      if (type === 'ipa2fr' && !item.ipa) type = 'fr2zh';
      const ukey = item.fr + '|' + type;
      if (used.has(ukey)) continue;
      used.add(ukey);

      let prompt, promptClass, audio = null, answer, optKey;
      if (type === 'fr2zh') {
        prompt = item.fr; promptClass = 'fr'; answer = item.zh; optKey = 'zh';
      } else if (type === 'zh2fr') {
        prompt = item.zh; promptClass = 'zh-q'; answer = item.fr; optKey = 'fr';
      } else if (type === 'audio2fr') {
        prompt = '🔊 听发音，选出你听到的词'; promptClass = 'zh-q'; answer = item.fr; optKey = 'fr'; audio = item.audio;
      } else {
        prompt = '[' + item.ipa + ']'; promptClass = 'mono'; answer = item.fr; optKey = 'fr';
      }

      const ds = distractors(base.length > 8 ? base : pool.global, item, optKey, 3);
      if (ds.length < 3) continue;
      const opts = shuffle([item].concat(ds)).map(x => ({ text: x[optKey], fr: optKey === 'fr' }));
      const ansIdx = opts.findIndex(o => o.text === answer);
      if (ansIdx < 0) continue;

      qs.push({
        type,
        label: { fr2zh: '看法语选中文', zh2fr: '看中文选法语', audio2fr: '听音选词', ipa2fr: '看音标选法语' }[type],
        prompt, promptClass, audio, options: opts, answerIndex: ansIdx,
        explain: (item.ipa ? '[' + item.ipa + '] ' : '') + item.fr + ' — ' + item.zh
      });
    }
    return qs;
  }

  window.QUIZ = { build, shuffle };
})();
