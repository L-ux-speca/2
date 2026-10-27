'use strict';

const Encyclopedia={selected:'lapis',
  open(id){if(id&&CHARS.some(c=>c.id===id))this.selected=id;
    App.setScreen('encyclopedia');this.draw();},
  choose(id){this.selected=id;this.draw();},
  draw(){
    const c=char(this.selected),lore=ENCYCLOPEDIA_LORE[c.id]||{},rt=RTBossCatalog.get(c.id);
    const safe=(text,fallback='Раздел будет дополнен')=>esc(text||fallback);
    document.querySelector('#app').innerHTML=`
      <header class="screen-head"><div><div class="eyebrow">Токийский архив</div>
        <h2>Энциклопедия Tokyo Dawn</h2></div>
        <button onclick="App.home()">← Главное меню</button></header>
      <div class="encyclopedia-layout">
        <section class="encyclopedia-roster">
          <div class="eyebrow">Бойцы · ${CHARS.length}</div>
          <div class="encyclopedia-grid">${CHARS.map(hero=>`
            <button class="encyclopedia-card ${hero.id===c.id?'selected':''}"
               onclick="Encyclopedia.choose('${hero.id}')">
              ${portrait(hero)}<b>${esc(hero.short)}</b>
              ${RTBossCatalog.has(hero.id)?'<span class="encyclopedia-rt-badge">РТ</span>':''}
            </button>`).join('')}</div>
        </section>
        <article class="encyclopedia-profile">
          <div class="encyclopedia-heading">
            <div class="encyclopedia-portrait">${portrait(c)}</div>
            <div><div class="eyebrow">Досье персонажа</div>
              <h2>${esc(c.name)}</h2>
              <p class="muted">${esc(c.tag)}</p>
              <div class="encyclopedia-stats">
                <span>Здоровье <b>${c.hp}</b></span>
                <span>ПЭ <b>${c.pe}</b></span>
                <span>Скорость <b>${c.speed}</b></span>
                <span>Кулак <b>${c.punch}</b></span>
                <span>Нога <b>${c.kick}</b></span>
              </div>
            </div>
          </div>
          <h3>Способность</h3>
          <p>${safe(lore.ability,c.tag)}</p>
          <h3>Боевой стиль</h3>
          <p>${safe(lore.style,'Информация о стиле будет добавлена')}</p>
          <h3>Приёмы</h3>
          <div class="encyclopedia-skills">${c.skills.map((s,i)=>`
            <div class="encyclopedia-skill"><div><b>${i+1}. ${esc(s.name)}</b>
              <small>${s.passive?'Пассивная':`${s.cost} ПЭ · откат ${s.cd} с`}</small></div>
              <p>${esc(s.desc)}</p></div>`).join('')}</div>
          <h3>История</h3>
          <p class="muted">${safe(lore.biography,'Место для биографии персонажа. Текст редактируется в src/data/encyclopedia.js.')}</p>
          <h3>РТ · Территория</h3>
          ${rt?`<div class="encyclopedia-rt"><b>${esc(rt.title)}</b>
                <p>${esc(rt.genre)} · ${esc(rt.short)}</p>
                <button onclick="RTHub.open('${c.id}')">Испытать эту РТ →</button></div>`:
            '<p class="muted">Для этого персонажа РТ пока не создана.</p>'}
        </article>
      </div>`;
  }
};
