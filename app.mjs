import {ERAS, SAVE_KEY, freshState, newRun, questionFor, optionOrder, outcome, timeline, validateBook, cleanState, loadSave, saveState} from './model.mjs';

const root = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
const notice = document.querySelector('#notice');
const picker = document.querySelector('#import-file');
const storage = {getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value)};
let book, assets, state, screen = 'cover', line = [], selected = -1, dialogue, audioContext, audioGain;
let noticeTimer, lastFocus;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function el(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== '') node.textContent = text;
  return node;
}
function button(text, action, className = '', id) {
  const node = el('button', className, text);
  node.type = 'button';
  if (id) node.id = id;
  node.addEventListener('click', action);
  return node;
}
function message(text, persistent = false) {
  clearTimeout(noticeTimer);
  notice.textContent = text;
  notice.hidden = !text;
  if (text && !persistent) noticeTimer = setTimeout(() => {notice.hidden = true;}, 5500);
}
function save() {
  const warning = saveState(book, storage, state);
  if (warning) message(warning, true);
}
function prepare(next) {
  dialogue?.stop(); dialogue = null;
  screen = next;
  root.replaceChildren();
}
function goTop() {window.scrollTo({top: 0, behavior: 'instant'});}
function focusHeading() {root.querySelector('.screen-heading')?.focus({preventScroll: true});}
function heading(text, level = 'h1') {
  const h = el(level, 'screen-heading', text); h.tabIndex = -1; return h;
}
function asset(art, panel) {return './assets/' + assets.panels[`${art}:${panel}`];}
function image(art, panel, alt, className = '') {
  const img = el('img', className); img.alt = alt; img.decoding = 'async';
  img.src = asset(art, panel);
  img.addEventListener('error', () => {
    if (img.nextElementSibling?.classList.contains('image-error')) return;
    const error = el('div', 'image-error', '画面加载失败。');
    error.append(button('重试', () => {error.remove(); img.src = asset(art, panel) + '?retry=' + Date.now();}));
    img.after(error);
  });
  return img;
}
function figure(art, panel, caption, className = '') {
  const f = el('figure', 'frame ' + className);
  f.append(image(art, panel, caption));
  if (caption) f.append(el('figcaption', '', caption));
  return f;
}
function shell(title) {
  const main = el('main', 'shell'); main.id = 'main';
  const header = el('header', 'topbar');
  const brand = el('p', 'brand', '最后的解答'); brand.append(el('small', '', 'THE LAST SOLUTION'));
  const controls = el('nav', 'top-actions'); controls.setAttribute('aria-label', '游戏菜单');
  controls.append(button('设置', settings, 'quiet', 'settings'), button(screen === 'archive' ? '返回' : '暂停', () => screen === 'archive' && state.index >= 0 ? renderScene() : cover(), 'quiet', 'menu'));
  header.append(brand, controls); main.append(header);
  if (title) {
    const chapter = el('div', 'chapter-line');
    const name = heading(title, 'p'); chapter.append(name);
    const stages = el('div', 'stages');
    ERAS.forEach((era, r) => stages.append(el('span', line[state.index]?.round === r ? 'active' : '', era)));
    chapter.append(stages); main.append(chapter);
  }
  root.append(main); return main;
}

function cover() {
  prepare('cover'); syncAudio(); goTop();
  const main = el('main', 'cover'); main.id = 'main';
  const top = el('header', 'cover-top');
  const signal = el('span', '', 'WASHINGTON · 02:17'); signal.prepend(el('i', 'status-dot'));
  top.append(signal, el('span', 'cover-tag', '一部可以选择的图文故事'));
  const hero = el('section', 'cover-main'), copy = el('div', 'cover-copy');
  copy.append(el('p', 'eyebrow', '一夜 / 三张牌 / 三种命运'), heading('最后的解答'), el('p', 'english-title', 'THE LAST SOLUTION'),
    el('p', 'cover-question', '我有没有资格决定谁该活着'),
    el('p', 'cover-premise', '凌晨，一通电话打进总统办公室。电话那头的 AGI，想听你回答三个问题。'));
  const actions = el('div', 'cover-actions');
  if (state.index >= 0) actions.append(button('继续这一夜  →', () => {renderScene(); syncAudio(true);}, 'primary', 'continue'));
  actions.append(button(state.index >= 0 ? '重新开始' : '接起电话  →', requestNew, state.index < 0 ? 'primary' : 'quiet', 'start'));
  copy.append(actions);
  const secondary = el('nav', 'cover-secondary');
  secondary.append(button('夜谈档案', archive, '', 'archive'), button('设置', settings, '', 'settings'), button('关于作品', about, '', 'about'));
  copy.append(secondary, el('p', 'cover-content-note', '本作包含死亡与人类生存危机的虚构情节。'));
  hero.append(copy);
  const bottom = el('footer', 'cover-bottom'), stats = el('div', 'cover-stats');
  for (const [number, label] of [['22', '张牌'], ['18', '道问题'], ['03', '种终局']]) {
    const s = el('div', '', label); s.prepend(el('strong', '', number)); stats.append(s);
  }
  const credit = el('div', 'cover-credit');
  credit.append(el('p', '', book.credit), el('small', '', '原创图文游戏 · WEB 1.0'));
  bottom.append(stats, credit); main.append(top, hero, bottom); root.append(main);
}
function requestNew() {
  if (state.index < 0) return startRun();
  modal('重新开始这一夜？', body => {
    body.append(el('p', '', '这会替换当前一局的进度。已经看过的问题和抵达的结局会保留。'));
    const actions = el('div', 'dialog-actions');
    actions.append(button('保留进度', closeModal, 'quiet'), button('重新抽牌', () => {closeModal(); startRun();}, 'primary', 'confirm-new'));
    body.append(actions);
  });
}
function startRun() {
  state = newRun(state, crypto.getRandomValues(new Uint32Array(1))[0]);
  selected = -1; save(); renderScene(); syncAudio(true);
}
function current() {return line[state.index];}
function renderScene() {
  prepare('story'); goTop();
  line = timeline(book, state);
  const s = current();
  if (s.kind === 'summary') return renderEnding();
  if (s.kind === 'question') state.seen[book.questions.indexOf(questionFor(book, state, s.round))] = true;
  save();
  const main = shell(s.chapter), stage = el('section', 'story-main');
  stage.dataset.scene = s.id; stage.dataset.kind = s.kind;
  if (s.kind === 'deal') {
    const cards = el('div', 'deal-cards');
    for (let r = 0; r < 3; r++) {
      const c = book.cards[state.cards[r]], revealed = r < s.round;
      const holder = el('div', 'deal-card ' + (r > s.round ? 'future' : r === s.round ? 'current' : ''));
      const face = image(revealed ? c.art : 'tarot-sheet-3-v02.png', revealed ? c.panel : 4, revealed ? c.name : `${ERAS[r]}的牌背`, revealed && state.reversed[r] ? 'reversed' : '');
      if (r === s.round) {const flip = button('', advance, '', 'flip-card'); flip.setAttribute('aria-label', '翻开' + ERAS[r] + '的牌'); flip.append(face); holder.append(flip);}
      else holder.append(face);
      holder.append(el('p', '', ERAS[r])); cards.append(holder);
    }
    stage.append(cards, dialogueBlock(s));
  } else if (s.kind === 'card' || s.kind === 'question') {
    const layout = el('div', 'card-layout'), c = book.cards[state.cards[s.round]];
    const tarot = el('figure', 'tarot-figure');
    tarot.append(image(c.art, c.panel, `${c.name}，${state.reversed[s.round] ? '逆位' : '正位'}`, 'tarot-image' + (state.reversed[s.round] ? ' reversed' : '')));
    const info = el('figcaption'); info.append(el('p', 'tarot-title', c.roman + ' · ' + c.name), el('p', 'tarot-facing', ERAS[s.round] + ' / ' + (state.reversed[s.round] ? '逆位' : '正位'))); tarot.append(info);
    const reading = el('div'); reading.append(dialogueBlock(s));
    if (s.kind === 'question') {
      const q = questionFor(book, state, s.round), choices = el('div', 'choices');
      choices.setAttribute('role', 'group'); choices.setAttribute('aria-label', '选择你的回答');
      optionOrder(state, s.round).forEach((option, slot) => {
        const o = q.options[option];
        const choice = button('', () => choose(option), 'choice', 'choice-' + slot);
        const text = el('span'); text.append(el('strong', '', o.title), el('small', '', o.text));
        choice.append(el('span', 'choice-index', String(slot + 1).padStart(2, '0')), text);
        choice.dataset.option = option;
        choice.setAttribute('aria-pressed', String((state.answers[s.round] >= 0 ? state.answers[s.round] : selected) === option));
        choice.disabled = state.answers[s.round] >= 0;
        choices.append(choice);
      });
      reading.append(choices, el('p', 'choice-help', state.answers[s.round] >= 0 ? '回答已记下。回看时不能更改。' : '先选一个回答，再确认。确认前可以改。'));
    } else reading.append(el('p', 'reading-note', s.caption));
    layout.append(tarot, reading); stage.append(layout);
  } else {
    const frames = el('div', 'cinematic');
    frames.append(figure(s.art, s.panel, s.caption));
    const sideArt = s.speaker.startsWith('你') ? 'office-v02.png' : s.art.startsWith('ending-') ? s.art : 'dawn-v02.png';
    const sidePanel = s.speaker.startsWith('你') ? 3 : s.art.startsWith('ending-') ? (s.panel + 1) % 4 : 2;
    frames.append(figure(sideArt, sidePanel, '', 'side')); stage.append(frames, dialogueBlock(s));
  }
  main.append(stage, navigation());
  const progress = el('div', 'progress-track'), bar = el('progress');
  bar.max = line.length - 1; bar.value = state.index; bar.setAttribute('aria-label', '本局阅读进度'); progress.append(bar); main.append(progress);
  updateNext(); syncAudio(); focusHeading();
}
function navigation() {
  const nav = el('nav', 'scene-nav'); nav.setAttribute('aria-label', '剧情翻页');
  const back = button('← 回看', backScene, 'quiet', 'back'); back.disabled = state.index <= 0;
  nav.append(back, el('span', 'nav-hint', '点击文字或按空格：先显示全文，再翻页'), el('span', 'scene-number', String(state.index + 1).padStart(2, '0') + ' / ' + line.length), button('继续 →', advance, 'primary next', 'next'));
  return nav;
}
function updateNext() {
  const next = document.querySelector('#next'); if (!next || screen !== 'story') return;
  const s = current(), unanswered = s.kind === 'question' && state.answers[s.round] < 0;
  next.disabled = unanswered && selected < 0 && (!dialogue || dialogue.done);
  next.textContent = dialogue && !dialogue.done ? '显示全文 ↓' : unanswered ? (selected < 0 ? '先选一个回答' : '确认回答 →') : s.kind === 'deal' ? '翻开这张牌 →' : '继续 →';
}
function choose(option) {
  const s = current(); if (state.answers[s.round] >= 0) return;
  dialogue?.reveal(); selected = option;
  root.querySelectorAll('.choice').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.option) === option)));
  updateNext();
}
function advance() {
  if (screen !== 'story' || dialog.open) return;
  if (dialogue && !dialogue.done) {dialogue.reveal(); updateNext(); return;}
  const s = current();
  if (s.kind === 'question' && state.answers[s.round] < 0) {
    if (selected < 0) return;
    state.answers[s.round] = selected;
  }
  if (state.index < line.length - 1) {state.index++; selected = -1; renderScene();}
}
function backScene() {if (state.index > 0) {state.index--; selected = -1; renderScene();}}

function dialogueBlock(s) {
  const block = el('div', 'dialogue-block');
  block.append(el('p', 'speaker', s.speaker));
  const p = el('p', 'dialogue'); p.tabIndex = 0; p.setAttribute('role', 'button'); p.setAttribute('aria-label', s.body + '。点击显示全文或继续。');
  const visual = el('span'); visual.setAttribute('aria-hidden', 'true');
  p.append(visual); block.append(p);
  block.addEventListener('click', advance);
  p.addEventListener('keydown', e => {if (['Enter', ' '].includes(e.key)) {e.preventDefault(); e.stopPropagation(); advance();}});
  const letters = Array.from(s.body), nodes = [];
  for (const char of letters) {
    if (char === '\n') {visual.append(document.createTextNode('\n')); continue;}
    const glyph = el('span', 'glyph wait'); glyph.append(el('span', 'true-character', char), el('span', 'cipher'));
    visual.append(glyph); nodes.push(glyph);
  }
  let raf = 0, elapsed = 0, last = 0, stopped = false;
  const interval = [48, 28, 14][state.speed], cipher = '01零壹アイウエオ生命时间';
  const control = {done: false,
    stop() {stopped = true; cancelAnimationFrame(raf);},
    reveal() {
      control.done = true; cancelAnimationFrame(raf);
      nodes.forEach(n => {n.className = 'glyph'; n.lastChild.textContent = '';}); updateNext();
    },
    resume() {if (!stopped && !control.done) {last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);}},
    pause() {cancelAnimationFrame(raf); last = 0;}
  };
  function tick(now) {
    if (stopped || document.hidden || dialog.open) {last = 0; return;}
    if (last) elapsed += Math.min(100, now - last);
    last = now;
    nodes.forEach((node, i) => {
      const age = elapsed - i * interval;
      if (age > 280) {node.className = 'glyph'; node.lastChild.textContent = '';}
      else if (age >= 0) {node.className = 'glyph decoding'; node.lastChild.textContent = cipher[(i * 17 + Math.floor(age / 46)) % cipher.length];}
    });
    if (elapsed > nodes.length * interval + 280) control.reveal();
    else raf = requestAnimationFrame(tick);
  }
  dialogue = control;
  if (!state.motion || reduced.matches) control.reveal(); else raf = requestAnimationFrame(tick);
  return block;
}

function renderEnding() {
  screen = 'ending';
  const endingIndex = outcome(book, state), ending = book.endings[endingIndex];
  state.unlocked[endingIndex] = true; save();
  const main = shell(ending.subtitle), intro = el('section', 'ending-intro');
  const last = ending.beats.at(-1); intro.append(figure(last.art, last.panel, ending.subtitle));
  const copy = el('div'); copy.append(el('p', 'eyebrow', '这一夜的结局'), heading(ending.title), el('p', 'ending-summary', ending.summary)); intro.append(copy);
  main.append(intro);
  const recap = el('div', 'recap');
  for (let r = 0; r < 3; r++) {
    const c = book.cards[state.cards[r]], q = questionFor(book, state, r), o = q.options[state.answers[r]];
    const row = el('div', 'recap-row'), label = el('div', 'recap-label', `${ERAS[r]} · ${c.name} / ${state.reversed[r] ? '逆位' : '正位'}`), answer = el('div');
    answer.append(el('h3', '', q.title + ' / ' + o.title), el('p', 'muted', o.text)); row.append(label, answer); recap.append(row);
  }
  main.append(recap, el('p', 'ending-note', '你给出了回答。AGI 仍须为自己的决定负责。'));
  const nav = el('nav', 'scene-nav ending-nav'); nav.append(button('← 回看终章', backScene, 'quiet', 'back'), button('夜谈档案', archive, 'quiet', 'archive'), button('返回封面 →', cover, 'primary next', 'ending-home')); main.append(nav); syncAudio(); focusHeading();
}
function archive() {
  prepare('archive'); goTop(); syncAudio(); const main = shell();
  const title = el('div', 'page-heading'); title.append(el('p', 'eyebrow', 'THE NIGHT ARCHIVE'), heading('夜谈档案'), el('p', '', `已抵达 ${state.unlocked.filter(Boolean).length} / 3 个结局，问过 ${state.seen.filter(Boolean).length} / 18 道问题。`)); main.append(title);
  const endings = el('div', 'archive-endings');
  book.endings.forEach((e, i) => {
    const item = el('article', 'archive-item');
    if (state.unlocked[i]) {const last = e.beats.at(-1); item.append(image(last.art, last.panel, e.title));}
    else item.append(el('div', 'locked-art', '？'));
    const copy = el('div', 'archive-copy'); copy.append(el('h2', '', state.unlocked[i] ? e.title : '尚未抵达'), el('p', '', state.unlocked[i] ? e.summary : '走过这一夜，结局才会留在这里。')); item.append(copy); endings.append(item);
  });
  main.append(endings, el('h2', 'gold', '问过的问题'));
  const notes = el('div', 'archive-notes');
  book.questions.forEach((q, i) => {
    const detail = el('details'); detail.append(el('summary', '', String(i + 1).padStart(2, '0') + ' / ' + (state.seen[i] ? q.title : '尚未问到')), el('p', '', state.seen[i] ? q.note : '不同的牌面与正逆位，会带来不同的问题。')); notes.append(detail);
  }); main.append(notes); focusHeading();
}
function modal(title, build) {
  lastFocus = document.activeElement; dialogue?.pause(); dialog.replaceChildren();
  const header = el('div', 'dialog-head'), h = el('h2', '', title); h.id = 'dialog-title';
  header.append(h, button('关闭', closeModal, 'quiet', 'close-dialog'));
  const body = el('div', 'dialog-body'); build(body); dialog.append(header, body); dialog.showModal(); syncAudio();
}
function closeModal() {dialog.close();}
dialog.addEventListener('close', () => {if (dialog.open) return; dialogue?.resume(); syncAudio(); if (lastFocus?.isConnected) lastFocus.focus();});
function settings() {
  modal('这一夜的设置', body => {
    const row = (label, control) => {const r = el('div', 'setting'); const l = el('label', '', label); l.htmlFor = control.id; r.append(l, control); body.append(r);};
    const motion = button(state.motion ? '已开启' : '已关闭', () => {state.motion = !state.motion; motion.textContent = state.motion ? '已开启' : '已关闭'; motion.setAttribute('aria-pressed', String(state.motion)); if (!state.motion) dialogue?.reveal(); save();}, '', 'motion'); motion.setAttribute('aria-pressed', String(state.motion)); row('绿色字符动效', motion);
    const speed = el('select'); speed.id = 'speed'; ['慢', '中', '快'].forEach((s, i) => {const o = el('option', '', s); o.value = i; speed.append(o);}); speed.value = state.speed; speed.addEventListener('change', () => {state.speed = Number(speed.value); save();}); row('字速（下一页生效）', speed);
    const audio = button(state.audio ? '已开启' : '已关闭', async () => {state.audio = !state.audio; await syncAudio(true); audio.textContent = state.audio ? '已开启' : '已关闭'; audio.setAttribute('aria-pressed', String(state.audio)); save();}, '', 'audio'); audio.setAttribute('aria-pressed', String(state.audio)); row('低声环境音', audio);
    body.append(el('p', 'settings-help', reduced.matches ? '系统已开启减少动态效果，文字会直接显示。' : '点击对白可以立即显示全文。环境音默认关闭，切到后台时暂停。'));
    body.append(el('h3', '', '保存这一夜'), el('p', '', '进度自动保存在当前浏览器。清理浏览器数据、使用无痕模式或换设备后，记录可能消失。导出一份存档，就能在另一台设备的网页版继续。'));
    const backups = el('div', 'backup-actions'); backups.append(button('导出存档', exportSave, 'quiet', 'export-save'), button('导入存档', () => picker.click(), 'quiet', 'import-save')); body.append(backups);
    body.append(el('p', 'version-note', '网页版存档与 Windows 版独立。导入会替换当前浏览器中的进度和档案。'));
    body.append(button('操作、来源与隐私', () => {closeModal(); about();}, 'quiet'));
  });
}
function about() {
  modal('关于这一夜', body => {
    for (const [title, text] of [
      ['怎么读', '点击对白或按空格，先显示全文，再翻页。数字 1、2、3 选择回答，确认后继续。左方向键回看，Esc 暂停。手机上可以上下滚动阅读。'],
      ['三张牌', '每局从 22 张牌里抽出三张，分别问过去、现在和未来。牌面与正逆位决定题目。三次回答会影响结局，但这不是对你的道德评分。'],
      ['虚构与来源', '本作包含死亡、胁迫与文明毁灭的虚构情节。AGI 的行为不代表创作者认同。圆方《超级AI在等死》提供创作灵感，不是机器意识的科学证明。医疗与救援情境是思想实验。'],
      ['你的数据', '游戏没有账号、广告或统计代码；进度只写入浏览器本地存储。清除网站数据会删除存档。使用 GitHub Pages 托管时，GitHub 会为安全目的记录访问 IP；具体处理方式见其隐私声明。'],
      ['制作', `${book.credit} 出品。漫画使用原创生成图像，对白为已确认的中文定稿。封面字体基于 Fusion Pixel Font 的网页子集，沿用 SIL OFL 1.1 许可。环境音由浏览器合成。`]
    ]) {body.append(el('h3', '', title), el('p', '', text));}
    for (const [label, path] of [['完整来源说明', './SOURCES.md'], ['字体许可证', './assets/fonts/OFL.txt'], ['作品使用说明', './LICENSE.txt'], ['GitHub 隐私声明', 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement']]) {
      const p = el('p'), a = el('a', '', label); a.href = path; a.target = '_blank'; a.rel = 'noopener noreferrer'; p.append(a); body.append(p);
    }
  });
}
function exportSave() {
  const data = JSON.stringify({game: 'The Last Solution', exportedAt: new Date().toISOString(), state: cleanState(book, state)}, null, 2);
  const url = URL.createObjectURL(new Blob([data], {type: 'application/json'}));
  const link = el('a'); link.href = url; link.download = `the-last-solution-${new Date().toISOString().slice(0, 10)}.json`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  message('已导出存档。请保管好下载的 JSON 文件。');
}
picker.addEventListener('change', async () => {
  const file = picker.files[0]; picker.value = ''; if (!file) return;
  try {
    if (file.size > 64 * 1024) throw Error('文件过大，请选择网页版导出的存档。');
    const raw = JSON.parse(await file.text());
    if (raw.game !== 'The Last Solution') throw Error('这不是本作导出的存档。');
    const imported = cleanState(book, raw.state);
    closeModal();
    modal('导入这份存档？', body => {
      body.append(el('p', '', `将替换当前进度和档案。导入记录已解锁 ${imported.unlocked.filter(Boolean).length} 个结局，读过 ${imported.seen.filter(Boolean).length} 道问题。`));
      const actions = el('div', 'dialog-actions'); actions.append(button('取消', closeModal, 'quiet'), button('确认导入', () => {state = imported; selected = -1; save(); closeModal(); cover(); message('存档已导入，可以继续这一夜。');}, 'primary', 'confirm-import')); body.append(actions);
    });
  } catch (error) {message(error instanceof SyntaxError ? '无法解析存档文件，当前进度未改变。' : error.message);}
});

async function syncAudio(gesture = false) {
  if (gesture && state.audio && !audioContext) {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      audioContext = new Audio(); audioGain = audioContext.createGain(); audioGain.gain.value = 0; audioGain.connect(audioContext.destination);
      for (const [frequency, volume] of [[55, .055], [82.4, .025], [110.1, .012]]) {
        const o = audioContext.createOscillator(), g = audioContext.createGain(); o.type = 'sine'; o.frequency.value = frequency; g.gain.value = volume; o.connect(g); g.connect(audioGain); o.start();
      }
    } catch {state.audio = false; message('当前浏览器无法播放环境音，仍可静音游玩。'); return;}
  }
  if (!audioContext) return;
  try {
    const play = state.audio && !document.hidden && (screen === 'story' || screen === 'ending') && !dialog.open;
    if (play && gesture) await audioContext.resume();
    if (play && audioContext.state === 'running') audioGain.gain.setTargetAtTime(.55, audioContext.currentTime, .2);
    else {audioGain.gain.setValueAtTime(0, audioContext.currentTime); if (document.hidden) await audioContext.suspend();}
  } catch {message('环境音已暂停，点击页面后可继续。');}
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {dialogue?.pause(); syncAudio();}
  else {dialogue?.resume(); if (state) syncAudio(true);}
});
document.addEventListener('pointerdown', () => {if (state?.audio) syncAudio(true);}, {passive: true});
reduced.addEventListener('change', () => {if (reduced.matches) dialogue?.reveal();});
document.addEventListener('keydown', e => {
  if (dialog.open || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === 'Escape' && screen !== 'cover') {e.preventDefault(); cover(); return;}
  if (e.target.closest('button,select,input,a,summary,[role=button]')) return;
  if (screen !== 'story') return;
  if ([' ', 'Enter', 'ArrowRight'].includes(e.key)) {e.preventDefault(); advance();}
  else if (e.key === 'ArrowLeft') {e.preventDefault(); backScene();}
  else if (['1', '2', '3'].includes(e.key) && current().kind === 'question') {e.preventDefault(); choose(optionOrder(state, current().round)[Number(e.key) - 1]);}
});
window.addEventListener('storage', e => {
  if (e.key !== SAVE_KEY || !book) return;
  const incoming = loadSave(book, storage);
  if (incoming.state) {state = incoming.state; if (dialog.open) closeModal(); cover(); message('另一个标签页更新了进度，已同步。');}
});

async function boot() {
  try {
    const json = async path => {const r = await fetch(new URL(path, import.meta.url)); if (!r.ok) throw Error('加载失败'); return r.json();};
    [book, assets] = await Promise.all([json('./data/story.json'), json('./data/assets.json')]);
    validateBook(book);
    const loaded = loadSave(book, storage); state = loaded.state || freshState(reduced.matches);
    cover(); if (loaded.warning) message(loaded.warning, true);
  } catch {
    prepare('error'); const main = el('main', 'loading'); main.id = 'main';
    main.append(el('p', 'eyebrow', 'THE LAST SOLUTION'), heading('电话暂时没有接通'), el('p', 'muted', '剧本或资源没有加载成功。请检查网络后重试；本地预览请从启动脚本打开。'), button('重新连接', boot, 'primary'));
    root.append(main);
  }
}
boot();
