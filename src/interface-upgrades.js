'use strict';

// Gameplay and presentation fixes. Loaded after the character and RT adapters.
// Keep these overrides together until the corresponding core modules are refactored.
(() => {
  const key = (player, action) => keyLabel(Keys[player][action]);
  const join = (player, ...actions) => actions.map(action => key(player, action)).join(' / ');
  const controlHelp = () => {
    const listing = (player) => [
      ['Движение', join(player, 'left', 'right')],
      ['Прыжок / присед', join(player, 'up', 'down')],
      ['Удар рукой / ногой', join(player, 'punch', 'kick')],
      ['Блок / бросок', join(player, 'block', 'throw')],
      ['Техники', join(player, 's1', 's2', 's3', 's4')],
      ['Добивание', key(player, 'finish')]
    ].map(([title, keys]) => `<p><span>${title}</span><kbd>${esc(keys)}</kbd></p>`).join('');
    return `<div class="two-cols">
      <section><div class="eyebrow">Игрок 1 · файтинг</div><div class="help-table" style="grid-template-columns:1fr">${listing(0)}</div></section>
      <section><div class="eyebrow">Игрок 2 · файтинг</div><div class="help-table" style="grid-template-columns:1fr">${listing(1)}</div></section>
    </div><div class="section-line"></div>
    <div class="eyebrow">РТ Араи</div><div class="help-table">
      <p><span>Движение</span><kbd>${esc(join(0, 'left', 'right', 'up', 'down'))}</kbd></p>
      <p><span>Смена цели</span><kbd>Q</kbd></p>
      <p><span>Рывок</span><kbd>Shift / двойное направление</kbd></p>
      <p><span>Техники</span><kbd>${esc(join(0, 's1', 's2', 's3', 's4'))}</kbd></p>
      <p><span>Авторские приёмы</span><kbd>Shift + 1–6</kbd></p>
      <p><span>Пауза</span><kbd>Esc</kbd></p>
    </div><p class="help-note">В РТ нет обычного автоогня: урон наносят техники и созданные приёмы. Уклонения вблизи пуль пополняют шкалу АТАКИ и ускоряют откат первого приёма. Клавиши Q, Shift, Esc и Shift + 1–6 пока фиксированы.</p>`;
  };

  App.help = function() {
    if (['fight', 'rt'].includes(this.screen) && Fight.g?.mode !== 'online') {
      this.paused = true;
      AudioSys.pause();
    }
    this.modalBox('Как играть', controlHelp(), true);
  };

  const originalSelect = App.drawSelect.bind(App);
  App.drawSelect = function() {
    originalSelect();
    const controls = document.querySelector('.select-footer .control-hint');
    if (controls) controls.innerHTML = `<kbd>${esc(key(0, 'left'))}</kbd><kbd>${esc(key(0, 'right'))}</kbd> движение · <kbd>${esc(key(0, 'up'))}</kbd> прыжок · <kbd>${esc(key(0, 'block'))}</kbd> блок<br><kbd>${esc(key(0, 'punch'))}</kbd><kbd>${esc(key(0, 'kick'))}</kbd> удары · <kbd>${esc(join(0, 's1', 's2', 's3', 's4'))}</kbd> техники`;
    const rtDifficulty = [...document.querySelectorAll('.settings-grid .field')]
      .find(field => field.querySelector('label')?.textContent.includes('СЛОЖНОСТЬ РТ'));
    if (rtDifficulty && !(this.config.mode === 'cpu' && RTBossCatalog.has(this.config.p2))) rtDifficulty.remove();
    for (const side of [0, 1]) {
      const id = this.config[`p${side + 1}`];
      const hp = this.config.rules.includes('last_chance') ? 1 :
        char(id).hp * (this.config.rules.includes('half_hp') ? .5 : 1);
      const card = document.querySelector(`.char-card[onclick="App.pickChar('${id}')"] .cc-copy small`);
      if (card) card.textContent = `${hp} HP / ${char(id).pe} ПЭ`;
    }
    const fighterInfo = document.querySelector('.select-info .stats b');
    if (fighterInfo) fighterInfo.textContent = this.config.rules.includes('last_chance') ? 1 :
      char(this.config[`p${this.selectionSide + 1}`]).hp * (this.config.rules.includes('half_hp') ? .5 : 1);
  };

  const originalGameUI = App.gameUI.bind(App);
  App.gameUI = function(rt = false) {
    originalGameUI(rt);
    const controls = document.querySelector('.combat-footer .control-hint');
    if (controls) controls.innerHTML = rt ?
      `${esc(join(0, 'left', 'right', 'up', 'down'))} · движение<br>Q · цель &nbsp; Shift · рывок &nbsp; ${esc(join(0, 's1', 's2', 's3', 's4'))} · техники` :
      `${esc(join(0, 'punch', 'kick'))} · удары &nbsp; ${esc(key(0, 'block'))} · блок &nbsp; ${esc(key(0, 'throw'))} · бросок<br>Shift + 1…6 · свои приёмы`;
    if (rt) {
      document.querySelector('[data-act="fire"]')?.remove();
    }
  };

  const originalHome = App.home.bind(App);
  App.home = function() {
    if (this._builderTrial && this.screen === 'fight' && Fight.g?.mode === 'training') {
      this._builderTrial = false;
      Builder.open(Builder.hero);
      return;
    }
    this._builderTrial = false;
    originalHome();
    document.querySelector('#homeArt')?.remove();
    document.querySelector('.hero-number')?.remove();
  };

  const originalBuilderTest = Builder.test.bind(Builder);
  Builder.test = function() {
    originalBuilderTest();
    if (App.screen === 'fight' && Fight.g?.mode === 'training') App._builderTrial = true;
  };

  // The original core generated one ostinato at three tempos. These are
  // different melodic/rhythmic arrangements, plus a true silent selection.
  AudioSys.tick = function(dt) {
    if (this.custom) { this.custom.volume = Pref.master * Pref.music; return; }
    if (Pref.style === 'off' || Pref.music <= 0) return;
    this.clock -= dt;
    if (this.clock > 0) return;
    const tracks = {
      forge: {bpm: 118, root: 65.4, melody: [0, 0, 7, 10, 0, 3, 7, 12], type: 'triangle'},
      blood: {bpm: 142, root: 55, melody: [0, 3, 0, -2, 7, 6, 3, -5, 0, 12, 10, 7, 3, 0, -2, -5], type: 'sawtooth'},
      moon: {bpm: 78, root: 98, melody: [0, 7, 12, 9, 5, 12, 7, 2, 0, 4, 9, 12], type: 'sine'}
    };
    const track = tracks[Pref.style] || tracks.forge;
    this.clock = 60 / track.bpm / (Pref.style === 'moon' ? 1 : 2);
    const beat = this.beat++;
    const note = track.melody[beat % track.melody.length];
    this.tone(track.root * 2 ** (note / 12), Pref.style === 'moon' ? .62 : .24, track.type, .09, true);
    if (Pref.style === 'blood' && beat % 4 === 0) {
      this.tone(track.root * .5, .38, 'sawtooth', .11, true);
      this.tone(track.root * 2, .055, 'square', .035, true);
    } else if (Pref.style === 'forge' && beat % 2 === 0) {
      this.tone(track.root * .5, .18, 'sine', .17, true);
    } else if (Pref.style === 'moon' && beat % 3 === 0) {
      this.tone(track.root * .75, .88, 'sine', .055, true);
    }
  };
  AudioSys.clearCustom = function() {
    if (this.custom) { this.custom.pause(); this.custom.removeAttribute('src'); this.custom.load(); }
    if (this.customURL) URL.revokeObjectURL(this.customURL);
    this.customURL = null;
    this.custom = null;
    this.clock = 0;
    this.beat = 0;
    toast('Своя музыка убрана');
  };
  const originalLoadMusic = AudioSys.load.bind(AudioSys);
  AudioSys.load = function(file) {
    this.custom?.pause();
    return originalLoadMusic(file);
  };
  // The original preferences validator predates the silent option.
  if (readStore('clash-pref-v9', {}).style === 'off') Pref.style = 'off';
  const originalSettings = App.settings.bind(App);
  App.settings = function(tab) {
    originalSettings(tab);
    if (tab === 'keys') return;
    const musicSelect = [...document.querySelectorAll('#modalRoot select')]
      .find(sel => [...sel.options].some(option => option.value === 'forge'));
    if (musicSelect) {
      const names = {forge: 'Кузница · ритмическая', blood: 'Кровь · напряжённая', moon: 'Луна · атмосферная'};
      for (const option of musicSelect.options) option.textContent = names[option.value] || option.textContent;
      const silence = document.createElement('option');
      silence.value = 'off'; silence.textContent = 'Ничего · без музыки';
      musicSelect.append(silence);
      musicSelect.value = Pref.style;
    }
    const customInput = document.querySelector('#modalRoot input[type="file"][accept="audio/*"]');
    if (customInput) {
      const button = document.createElement('button');
      button.textContent = 'Убрать свою музыку';
      button.className = 'ghost';
      button.style.marginTop = '8px';
      button.disabled = !AudioSys.custom;
      button.addEventListener('click', () => { AudioSys.clearCustom(); button.disabled = true; customInput.value = ''; });
      customInput.addEventListener('change', () => { if (customInput.files?.length) button.disabled = false; });
      customInput.closest('label')?.after(button);
    }
    document.querySelector('#modalRoot input[onchange*="Pref.autoFire"]')?.closest('label')?.remove();
  };

  const originalRTSelect = App.rtSelect.bind(App);
  App.rtSelect = function() {
    originalRTSelect();
    const explanation = document.querySelector('#modalRoot p.muted');
    if (explanation) explanation.textContent = 'Три фазы: флот, эскорт и разрушаемые узлы. Применяй техники своего персонажа, переключай цели и уклоняйся от залпов.';
    const notes = document.querySelector('#modalRoot .hintbox');
    if (notes) notes.textContent = `${join(0, 'left', 'right', 'up', 'down')} — движение · Q — цель · Shift или двойное направление — рывок. Приёмы ${join(0, 's1', 's2', 's3', 's4')} наносят урон. Обычная стрельба отключена.`;
  };

  // Track PE spent at the moment it is actually consumed, across all skill types.
  function trackEnergy(actor, record, state) {
    let pe = actor.pe;
    Object.defineProperty(actor, 'pe', {
      configurable: true, enumerable: true,
      get() { return pe; },
      set(next) {
        if (!Number.isFinite(next)) return;
        if (next < pe && state()) record(pe - next);
        pe = next;
      }
    });
  }
  const originalMakeF = Fight.makeF.bind(Fight);
  Fight.makeF = function(id, side) {
    const f = originalMakeF(id, side);
    if (side === 0) trackEnergy(f, used => {
      this.g.stats.peSpent = (this.g.stats.peSpent || 0) + used;
    }, () => this.g?.state === 'active' && !Cheats.energy);
    return f;
  };

  const originalKO = Fight.ko.bind(Fight);
  Fight.ko = function(winner, skip = false) {
    originalKO(winner, skip);
    const g = this.g;
    if (!skip && g.state === 'ko' && winner !== null && ['cpu', 'arcade', 'survival'].includes(g.mode)) {
      this.finisher();
    } else if (!skip && g.state === 'ko' && winner !== null) {
      App.announce('НОКАУТ', `${g.f[winner].c.name} · ${key(winner, 'finish')} — добивание`);
    }
  };

  const originalRecord = Fight.record.bind(Fight);
  Fight.record = function() {
    originalRecord();
    if (this.g?.training?.recording)
      toast(`5 секунд записи манекена: клавиши игрока 2 — ${join(1, 'left', 'right', 'up', 'down', 'punch', 'kick')}`);
  };

  const originalAttack = Fight.attack.bind(Fight);
  Fight.attack = function(f, kind) {
    if (kind !== 'throw') return originalAttack(f, kind);
    if (f.stun > 0 || f.recovery > 0 || f.flying) return;
    const enemy = this.g.f[1 - f.side];
    const dx = enemy.x - f.x;
    if (Math.abs(dx) <= 115 && Math.abs(enemy.y - f.y) <= 65) {
      f.face = Math.sign(dx) || f.face;
      f.x += f.face * Math.min(22, Math.max(0, Math.abs(dx) - 44));
      const landed = this.damage(enemy, 14, f, {unblockable: true, kb: 270, stun: .24});
      f.recovery = .64; f.pose = .42;
      if (landed) { enemy.kx = f.face * 340; this.float('БРОСОК', enemy.x, enemy.y - 124, '#ffdaa3'); }
      else this.float('УКЛОНЕНИЕ', enemy.x, enemy.y - 112, '#b2cada');
      return;
    }
    f.pose = .22; f.recovery = .27;
    this.float('МИМО', f.x, f.y - 119, '#b2cada');
  };

  // After the final round the result screen is no longer an active battle.
  const originalResult = App.result.bind(App);
  App.result = function(title, sub, stats, action) {
    const fight = this.screen === 'fight' ? Fight.g : null;
    const rt = this.screen === 'rt' ? RT.g : null;
    const lived = fight?.t ?? rt?.t ?? 0;
    if (fight || rt) {
      const damage = fight?.stats.damage ?? rt?.damage ?? 0;
      const spent = fight?.stats.peSpent ?? rt?.peSpent ?? 0;
      stats += ` · Нанесено ${Math.round(damage)} урона · Время ${Math.round(lived)} с · Потрачено ${Math.round(spent)} ПЭ`;
    }
    originalResult(title, sub, stats, action);
    this.screen = 'result';
    this.paused = true;
  };
  const originalCloseModal = App.closeModal.bind(App);
  App.closeModal = function() {
    if (this.screen === 'result') { this.home(); return; }
    originalCloseModal();
  };
})();

