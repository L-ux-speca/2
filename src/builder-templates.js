'use strict';

(() => {
  // The templates are interpretations of established moves, not copies of
  // another fighter's complete technique or a way to bypass their palette.
  const TEMPLATES = Object.freeze([
    {id:'lapis_rail', name:'Ляпис · рельсотрон', type:'projectile', form:'rail', power:5, range:5, size:1, count:1},
    {id:'caesar_bubble', name:'Цезарь · пузырьковая пушка', type:'projectile', form:'bubble', power:3, range:4, size:3, count:2},
    {id:'akira_blood', name:'Акира · кровавый поток', type:'projectile', form:'blood', power:3, range:4, size:2, count:2},
    {id:'araya_cannon', name:'Арая · залп пушек', type:'projectile', form:'cannon', power:3, range:4, size:2, count:3},
    {id:'airi_spike', name:'Айри · металлические шипы', type:'projectile', form:'spike', power:3, range:4, size:2, count:3},
    {id:'chieko_tornado', name:'Чиэко · торнадо', type:'projectile', form:'tornado', power:2, range:3, size:4, count:1},
    {id:'kisei_ankh', name:'Кисей · огненный анх', type:'projectile', form:'ankh', power:3, range:4, size:2, count:1},
    {id:'sonic_clones', name:'Соник · клоны', type:'summon', form:'clone', power:3, range:2, size:2, duration:4, count:1},
    {id:'mechamaru_robot', name:'Мехамару · кукла', type:'summon', form:'robot', power:3, range:2, size:3, duration:4, count:1},
    {id:'david_trap', name:'Дэвид · токсичная среда', type:'field', form:'toxic', power:3, range:3, size:3, duration:4, count:1},
    {id:'yuzuha_vine', name:'Юзуха · щупальце', type:'pulse', form:'tentacle', power:4, range:2, size:3, count:1},
    {id:'kayano_meteor', name:'Каяно · метеор-комбинация', type:'pulse', form:'meteor', power:5, range:2, size:2, count:1}
  ]);
  const FORMS_BY_TYPE = Object.freeze({
    projectile: {generic:'Обычный',rail:'Рельсотрон',bubble:'Пузырь',blood:'Кровь',cannon:'Ядро',spike:'Металлический шип',tornado:'Торнадо',ankh:'Огненный анх'},
    pulse: {generic:'Импульс',tentacle:'Щупальце',meteor:'Метеор',wave:'Волна'},
    field: {generic:'Поле',toxic:'Токсичная зона',blood:'Кровавое поле'},
    summon: {generic:'Призыв',clone:'Клон',robot:'Механическая кукла'},
    shield: {generic:'Барьер',metal:'Металлический щит'},
    orbit: {generic:'Орбиты',metal:'Металлические орбиты'},
    dash: {generic:'Рывок',sonic:'Сверхскоростной рывок'},
    heal: {generic:'Лечение'}
  });
  FORMS.clone = 'Клон Соника';
  FORMS.robot = 'Кукла Мехамару';
  const originalNormalize = Builder.normalize.bind(Builder);
  Builder.normalize = function(character, move) {
    const result = originalNormalize(character, move);
    if (!result) return null;
    const sortedSteps = [...move.steps].sort((a, b) => (a.at || 0) - (b.at || 0));
    result.steps.forEach((step, index) => {
      const requested = sortedSteps[index]?.form;
      if (step.type === 'summon' && character.id === 'kisei' && Object.hasOwn(FORMS, requested)) {
        step.form = requested;
      } else if (Object.hasOwn(FORMS_BY_TYPE[step.type] || {}, requested)) {
        step.form = requested;
      }
    });
    return result;
  };

  Builder.applyTemplate = function(id) {
    const source = TEMPLATES.find(template => template.id === id);
    if (!source || !char(this.hero).palette.split(' ').includes(source.type)) {
      toast('Эта форма недоступна технике выбранного персонажа');
      return;
    }
    this.name = source.name;
    this.steps = [{type:source.type,at:0,power:source.power,range:source.range ?? 1,
      size:source.size ?? 1,duration:source.duration ?? 1,count:source.count ?? 1,
      aim:'forward',condition:'always',form:source.form}];
    // Power budget and PE limitations still apply to the selected fighter.
    while (this.price(char(this.hero), this.steps).budget > 70 ||
           this.price(char(this.hero), this.steps).cost > char(this.hero).pe) {
      const step = this.steps[0];
      if (step.count > 1) step.count--;
      else if (step.power > 1) step.power--;
      else if (step.range > 1) step.range--;
      else { toast('Этот образец слишком дорог для персонажа'); return; }
    }
    this.draw();
    toast('Образец загружен: параметры можно изменить');
  };

  const originalDraw = Builder.draw.bind(Builder);
  Builder.draw = function() {
    originalDraw();
    const steps = document.querySelector('#steps');
    if (!steps) return;
    const available = TEMPLATES.filter(template => char(this.hero).palette.split(' ').includes(template.type));
    const section = document.createElement('div');
    section.className = 'field';
    section.innerHTML = `<label>ОБРАЗЦЫ ПРИЁМОВ ДРУГИХ ПЕРСОНАЖЕЙ</label>
      <div class="row"><select id="move-template-picker" aria-label="Выбери образец">
      ${available.map(template => `<option value="${template.id}">${esc(template.name)}</option>`).join('')}
      </select><button type="button" class="ghost" id="apply-move-template">Применить</button></div>
      <small>Форма и базовые параметры сохраняют ограничения мощности и палитры.</small>`;
    steps.before(section);
    section.querySelector('#apply-move-template').addEventListener('click', () =>
      this.applyTemplate(section.querySelector('#move-template-picker').value));

    [...steps.querySelectorAll('.step-card')].forEach((card, index) => {
      const step = this.steps[index], styles = FORMS_BY_TYPE[step.type];
      if (!styles || (step.type === 'summon' && this.hero === 'kisei')) return;
      const field = document.createElement('div');
      field.className = 'field visual-form';
      field.innerHTML = `<label>Форма готового приёма</label><select aria-label="Форма приёма">
        ${Object.entries(styles).map(([id, name]) => `<option value="${id}" ${step.form === id ? 'selected' : ''}>${esc(name)}</option>`).join('')}
      </select>`;
      card.append(field);
      field.querySelector('select').addEventListener('change', event => this.change(index, 'form', event.target.value));
    });
  };

  // Apply the authored appearance to all immediate primitive effect calls.
  const originalProjectile = Fight.projectile.bind(Fight);
  Fight.projectile = function(f, data = {}) {
    const shape = this._customForm;
    if (!shape || shape === 'generic') return originalProjectile(f, data);
    const modified = {...data, shape};
    if (shape === 'rail') {
      modified.vx = (data.vx ?? f.face * 540) * 1.45;
      modified.r = Math.min(data.r ?? 10, 8);
    }
    if (shape === 'spike') modified.r = Math.max(9, data.r || 9);
    if (shape === 'blood') modified.bleed = 3 + (data.dmg || 0) * .12;
    if (shape === 'tornado') modified.stun = .5;
    if (shape === 'ankh') modified.burn = true;
    if (shape === 'bubble') modified.kb = 190;
    if (shape === 'cannon') modified.kb = 260;
    return originalProjectile(f, modified);
  };
  const originalArea = Fight.area.bind(Fight);
  Fight.area = function(f, data = {}) {
    return originalArea(f, this._customForm && this._customForm !== 'generic' ? {...data, shape:this._customForm} : data);
  };
  const originalSummon = Fight.summon.bind(Fight);
  Fight.summon = function(f, data = {}) {
    return originalSummon(f, ['clone','robot'].includes(this._customForm) ? {...data, shape:this._customForm} : data);
  };
  const originalEntity = Fight.entity.bind(Fight);
  Fight.entity = function(f, data) {
    if (this._customForm && this._customForm !== 'generic' && data.kind === 'trap') {
      const modified = {...data, shape:this._customForm};
      if (this._customForm === 'toxic') modified.poison = true;
      if (this._customForm === 'blood') modified.bleed = 4;
      return originalEntity(f, modified);
    }
    return originalEntity(f, data);
  };

  const originalDrawEntity = Fight.drawEntity.bind(Fight);
  Fight.drawEntity = function(ctx, entity) {
    originalDrawEntity(ctx, entity);
    const kind = entity.shape;
    if (!['blood','cannon','toxic','meteor'].includes(kind)) return;
    ctx.save();
    const x = entity.x, y = entity.y, r = entity.r || 15;
    if (kind === 'blood') {
      ctx.strokeStyle = '#ec516f'; ctx.lineWidth = Math.max(3, r * .5);
      ctx.beginPath(); ctx.moveTo(x - (entity.vx || 0) * .032, y + 2);
      ctx.quadraticCurveTo(x - r, y - r * .45, x, y); ctx.stroke();
    } else if (kind === 'cannon') {
      ctx.fillStyle = '#343943'; ctx.strokeStyle = '#f4ce95'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, Math.min(22, r), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (kind === 'toxic') {
      ctx.fillStyle = '#b1e27b55'; ctx.strokeStyle = '#cef49f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y, r, Math.max(6, r * .15), 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    } else if (kind === 'meteor') {
      ctx.strokeStyle = '#ffd080'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, y, r * .65, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  };

  const originalCustomStep = Fight.customStep.bind(Fight);
  Fight.customStep = function(f, step) {
    const power = 1 + (step.power - 1) * 1.75;
    const range = 1 + (step.range - 1) * 1.4;
    const boosted = {...step, power, range};
    if (step.type === 'dash') {
      // Velocity is exponentially damped (9 / s) by the physics engine;
      // the old 700 px/s maximum yielded <80 px of extra travel.
      const impulse = 480 + range * 255 + power * 105;
      f.kx = f.face * impulse;
      f.st.inv = Math.max(f.st.inv || 0, .12 + step.power * .045);
      this.spark(f.x, f.y - 52, f.c.color, 15);
      return;
    }
    if (step.type === 'summon' && f.id === 'kisei' && ['clone','robot'].includes(step.form)) {
      this.summon(f, {life:1 + step.duration, hp:6 + power * 5,
        shape:step.form, dmg:2 + power});
      return;
    }
    this._customForm = step.form || 'generic';
    try {
      if (step.type === 'projectile' && step.form === 'spike') {
        const count = step.count || 1;
        for (let i = 0; i < count; i++) this.projectile(f, {
          x:f.x + f.face * 44, y:f.y - 24 - i * 25,
          vx:f.face * (480 + range * 68), dmg:5 + power * 3,
          r:8 + step.size * 2, level:i===0?'low':'high', life:1.8
        });
      } else originalCustomStep(f, boosted);
    } finally {
      this._customForm = null;
    }
  };

  function beginSpecial(f, index, engine) {
    const skill = f.c.skills[index];
    if (!skill || !engine.canCast(f, index, skill.cost)) return false;
    if (!engine.rule('unlimited_pe') && !engine.cheat(f, 'energy')) f.pe -= skill.cost;
    f.cd[index] = skill.cd * (engine.rule('quick_skills') ? .5 : 1);
    f.pose = .35;
    AudioSys.sfx('cast');
    engine.spark(f.x, f.y - 52, f.c.color, 12);
    return true;
  }

  CombatHooks.onCastOverride((fight,f,index)=>{
    if (f.id === 'airi' && index === 2) {
      if (!beginSpecial(f, index, fight)) return false;
      f.recovery = .42;
      // Three steel spikes originate at Airi, not at the opponent's feet.
      for (let height = 0; height < 3; height++) {
        const h = height;
        fight.queue(f, height * .12, () => fight.projectile(f, {
          x:f.x + f.face * 48, y:f.y - 23 - h * 26,
          vx:f.face * 680, dmg:12, r:13, life:2,
          shape:'spike', level:h===0?'low':'high', kb:135
        }), true);
      }
      return true;
    }
    if (f.id === 'kayano' && index === 0) {
      if (!beginSpecial(f, index, fight)) return false;
      const comboPower = clamp(1 + f.comboPoints * .35, 1, 2.75);
      f.recovery = 1.15;
      for (let hit = 0; hit < 5; hit++) fight.queue(f, .09 + hit * .17, () => {
        const enemy = fight.g.f[1 - f.side], distance = enemy.x - f.x;
        f.face = Math.sign(distance) || f.face;
        if (Math.abs(distance) > 185 || Math.abs(enemy.y - f.y) > 90) return;
        f.x = clamp(f.x + f.face * Math.min(30, Math.max(0, Math.abs(distance) - 47)), 28, 1072);
        f.pose = .18;
        fight.area(f, {x:f.x + f.face * 52, y:f.y - 53, r:70,
          dmg:5 * comboPower, kb:hit === 4 ? 270 : 45, life:.14, shape:'meteor'});
        fight.spark(f.x + f.face * 55, f.y - 53, f.c.color, 6);
      }, true);
      return true;
    }
    return undefined;
  });
  CombatHooks.onAfterCast((fight,f,index)=>{
    if (fight.g.mode === 'cpu' && f.side === 1 && f.id === 'david') {
      f.cd[index] *= 1.55; // No hidden fast-cooldown advantage for David's AI.
      f.aiTimer = Math.max(f.aiTimer, .6);
    }
  });

  // Advancing an arcade/survival stage should dismiss the result without
  // invoking the result screen's 'X means return to menu' behavior.
  const originalNextStage = Fight.nextStage.bind(Fight);
  Fight.nextStage = function() {
    if (App.screen === 'result') App.screen = 'fight';
    return originalNextStage();
  };

  window.ClashMoveTemplates = TEMPLATES;
})();

