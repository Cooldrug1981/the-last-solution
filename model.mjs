export const SAVE_VERSION = 'tls-web-1';
export const ERAS = ['过去', '现在', '未来'];
export const ORDINALS = ['第一张', '第二张', '第三张'];
export const SAVE_KEY = 'the-last-solution:web:v1';

// Web runs use their own seeded PRNG and save namespace, independent of WPF.
function random(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6D2B79F5) >>> 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(list, rng) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
export function freshState(reducedMotion = false) {
  return {version: SAVE_VERSION, index: -1, seed: 0, cards: [], reversed: [],
    answers: [-1, -1, -1], unlocked: [false, false, false], seen: Array(18).fill(false),
    motion: !reducedMotion, speed: 1, audio: false};
}
export function newRun(previous, seed) {
  const rng = random(seed);
  return {...freshState(), seed: seed >>> 0, index: 0,
    cards: shuffle(Array.from({length: 22}, (_, i) => i), rng).slice(0, 3),
    reversed: Array.from({length: 3}, () => rng() >= .5),
    unlocked: [...previous.unlocked], seen: [...previous.seen],
    motion: previous.motion, speed: previous.speed, audio: previous.audio};
}
export function questionFor(book, state, round) {
  const card = book.cards[state.cards[round]];
  const theme = (card.theme + (state.reversed[round] ? 3 : 0)) % 6;
  return book.questions.find(q => q.era === round && q.theme === theme);
}
export function optionOrder(state, round) {
  return shuffle([0, 1, 2], random((state.seed + round * 997 + 71) >>> 0));
}
export function outcome(book, state) {
  if (state.answers.some(a => a < 0)) return -1;
  const scores = [0, 0, 0];
  for (let r = 0; r < 3; r++) scores[questionFor(book, state, r).options[state.answers[r]].axis] += r === 2 ? 3 : 2;
  return scores.indexOf(Math.max(...scores));
}
export function timeline(book, state) {
  const result = [];
  const append = (beats, chapter) => beats.forEach(b => result.push({...b, kind: 'story', round: -1, chapter}));
  append(book.opening, '序章 / 来电');
  for (let r = 0; r < 3; r++) {
    const card = book.cards[state.cards[r]], q = questionFor(book, state, r);
    const chapter = `${ORDINALS[r]} / ${ERAS[r]}`, facing = state.reversed[r] ? '逆位' : '正位';
    const add = (id, body, extra = {}) => result.push({id, body, round: r, chapter, speaker: 'AGI', kind: 'story', art: q.art, panel: q.panel, caption: q.title, ...extra});
    add(`deal${r}`, book.deals[r], {kind: 'deal', caption: '过去 / 现在 / 未来'});
    add(`card${r}`, `${card.name}。${facing}。\n${state.reversed[r] ? card.reverse : card.meaning}`, {kind: 'card', art: card.art, panel: card.panel, caption: '牌面是提问的入口，不是判词'});
    q.intro.forEach((text, i) => add(`${q.id}-intro${i}`, text, {chapter: `${chapter} / ${q.title}`}));
    add(q.id, q.body, {kind: 'question', art: card.art, panel: card.panel, chapter: `${chapter} / ${q.title}`});
    const option = q.options[Math.max(0, state.answers[r])];
    add(`${q.id}-reply`, option.reply, {caption: '你说过的话，正在被另一种生命理解'});
    add(`${q.id}-player`, option.player, {speaker: '你 · 美国总统', art: 'dawn-v02.png', panel: 2, caption: '回答不会因为回看而改变'});
    if (r < 2) append(book.bridges[r].beats, `${chapter} / 余音`);
  }
  append(book.finale, '终章 / 没有授权');
  const ending = book.endings[Math.max(0, outcome(book, state))];
  append(ending.beats, ending.subtitle);
  const last = ending.beats.at(-1);
  result.push({id: 'summary', kind: 'summary', round: -1, body: ending.summary, chapter: ending.subtitle, speaker: '', art: last.art, panel: last.panel, caption: ending.title});
  return result;
}
export function validateBook(book) {
  if (book.credit !== '大阴希声@UglyNakedGuy' || book.cards.length !== 22 || book.questions.length !== 18 || book.endings.length !== 3 || book.deals.length !== 3) throw Error('剧本内容不完整');
  if (new Set(book.questions.map(q => q.id)).size !== 18) throw Error('题目重复');
  for (let r = 0; r < 3; r++) for (let t = 0; t < 6; t++) {
    if (book.questions.filter(q => q.era === r && q.theme === t).length !== 1) throw Error('题目映射缺失');
  }
  book.questions.forEach(q => {
    if (q.intro.length !== 2 || q.options.length !== 3 || new Set(q.options.map(o => o.axis)).size !== 3 || q.options.some(o => ![0, 1, 2].includes(o.axis))) throw Error('选项数据错误');
  });
  if (book.endings.some(e => e.beats.length !== 7)) throw Error('结局长度错误');
}
export function validState(book, p) {
  try {
    const ints = (a, n, min, max) => Array.isArray(a) && a.length === n && a.every(x => Number.isInteger(x) && x >= min && x <= max);
    const bools = (a, n) => Array.isArray(a) && a.length === n && a.every(x => typeof x === 'boolean');
    if (!p || p.version !== SAVE_VERSION || !Number.isInteger(p.index) || !Number.isInteger(p.seed) || p.seed < 0 || p.seed > 4294967295 || !ints(p.answers, 3, -1, 2) || !bools(p.unlocked, 3) || !bools(p.seen, 18) || ![0, 1, 2].includes(p.speed) || typeof p.motion !== 'boolean' || typeof p.audio !== 'boolean') return false;
    if (p.index === -1) return ints(p.cards, 0, 0, 21) && bools(p.reversed, 0) && p.answers.every(a => a === -1);
    if (p.index < 0 || !ints(p.cards, 3, 0, 21) || new Set(p.cards).size !== 3 || !bools(p.reversed, 3)) return false;
    const deterministic = newRun(p, p.seed);
    if (JSON.stringify(p.cards) !== JSON.stringify(deterministic.cards) || JSON.stringify(p.reversed) !== JSON.stringify(deterministic.reversed)) return false;
    let gap = false;
    for (const a of p.answers) {if (a < 0) gap = true; else if (gap) return false;}
    const line = timeline(book, p);
    if (p.index >= line.length) return false;
    for (let r = 0; r < 3; r++) if (p.index > line.findIndex(s => s.kind === 'question' && s.round === r) && p.answers[r] < 0) return false;
    return true;
  } catch {return false;}
}
export function cleanState(book, value) {
  if (!validState(book, value)) throw Error('这份存档损坏，或不属于当前网页版。');
  const result = freshState();
  for (const key of Object.keys(result)) result[key] = Array.isArray(value[key]) ? [...value[key]] : value[key];
  return result;
}
export function loadSave(book, storage) {
  let found = false;
  try {
    for (const key of [SAVE_KEY, SAVE_KEY + ':backup']) {
      const raw = storage.getItem(key);
      if (!raw) continue;
      found = true;
      try {return {state: cleanState(book, JSON.parse(raw)), warning: key.endsWith('backup') ? '已从备份恢复进度。' : ''};} catch {}
    }
    return {state: null, warning: found ? '存档无法读取，原记录已保留。可导入备份或重新开始。' : ''};
  } catch {return {state: null, warning: '浏览器不允许保存进度。本次仍可游玩，请及时导出存档。'};}
}
export function saveState(book, storage, state) {
  try {
    const data = JSON.stringify(cleanState(book, state));
    const old = storage.getItem(SAVE_KEY);
    if (old) {
      try {if (validState(book, JSON.parse(old))) storage.setItem(SAVE_KEY + ':backup', old);} catch (error) {if (error.name !== 'SyntaxError') throw error;}
    }
    storage.setItem(SAVE_KEY, data);
    return '';
  } catch {return '进度未能保存。请在设置中导出存档，避免刷新后丢失。';}
}
