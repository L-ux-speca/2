'use strict';

// RT hub and UI integration are deliberately separate from every boss genre.
const RTHub={selected:'araya',
  open(id){if(id&&RTBossCatalog.has(id))this.selected=id;
    const info=RTBossCatalog.get(this.selected);
    App.modalBox('Территории · РТ',`
      <div class="stack"><p class="muted" style="font-size:12px">
        Четыре разных испытания. Выбери территорию, затем своего бойца.
        В обычном бою против ИИ соответствующая РТ откроется только при 100% шкалы.
      </p><div class="field"><label>БОСС И ЖАНР</label>
        <select id="rtBoss" onchange="RTHub.preview(this.value)">
          ${RTBossCatalog.all().map(b=>`<option value="${b.id}" ${this.selected===b.id?'selected':''}>
            ${esc(char(b.id).name)} · ${esc(b.title)}</option>`).join('')}</select></div>
      <div class="rt-hub-preview" id="rtHubPreview"></div>
      <div class="field"><label>ТВОЙ БОЕЦ</label>
        <select id="rtHero">${CHARS.map(c=>`<option value="${c.id}" ${App.config.p1===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div>
      <div class="field"><label>СЛОЖНОСТЬ</label>
        <select id="rtDifficulty"><option value="easy">Easy · освоение паттернов</option>
          <option value="hard">Lunatic · более сложные атаки</option></select></div>
      <button class="primary" onclick="RTHub.launch()">Начать испытание ↗</button></div>`,true);
    this.preview(info.id);
  },
  preview(id){
    const info=RTBossCatalog.get(id);if(!info)return;
    this.selected=id;
    const pane=document.querySelector('#rtHubPreview');if(!pane)return;
    pane.innerHTML=`<div class="rt-hub-avatar">${portrait(char(id))}</div>
      <div><div class="eyebrow">${esc(info.genre)}</div><h3>${esc(info.title)}</h3>
      <p>${esc(info.short)}</p><p class="muted" style="font-size:11px">${esc(info.hint)}</p>
      <b>Три фазы · собственные атаки</b></div>`;
  },
  launch(){
    const id=document.querySelector('#rtBoss')?.value,
      hero=document.querySelector('#rtHero')?.value,
      difficulty=document.querySelector('#rtDifficulty')?.value||'easy';
    if(!RTBossCatalog.has(id)||!CHARS.some(c=>c.id===hero))return;
    App.config.p1=hero;App.config.difficulty=difficulty;
    App.closeModal();AudioSys.init();
    if(id==='araya')RT.start(hero,difficulty,true);
    else RTVariants.start(hero,id,difficulty,true);
  },
  useCustom(index){App.closeModal();RTVariants.custom(index)}
};

(() => {
  // Switching from a variant back to Araya must not reuse a stale variant state.
  const arayaStart=RT.start.bind(RT);
  RT.start=function(...args){RTVariants.g=null;return arayaStart(...args)};
  const home=App.home.bind(App);
  App.home=function(){
    RTVariants.g=null;
    home();
    const button=document.querySelector('.menu button[onclick="App.rtSelect()"]');
    if(button){button.removeAttribute('onclick');button.addEventListener('click',()=>RTHub.open());
      button.innerHTML='<div><b>Территории РТ</b><small>Араи · Дэвид · Айри · Онсоку</small></div><span class="arrow">→</span>';}
    const builder=document.querySelector('.menu button[onclick="Builder.open()"]');
    if(builder){
      const encyclopedia=document.createElement('button');
      encyclopedia.className='mode-btn';
      encyclopedia.innerHTML='<div><b>Энциклопедия</b><small>Персонажи, техники, истории и РТ</small></div><span class="arrow">▣</span>';
      encyclopedia.addEventListener('click',()=>Encyclopedia.open());
      builder.after(encyclopedia);
    }
    const feature=document.querySelector('.menu .feature');
    if(feature){const t=feature.querySelector('p');
      if(t)t.innerHTML='<strong>Четыре территории</strong><br>Морское bullet hell, токсичное выживание, ритм-лабиринт и скоростная погоня.';}
    const footer=document.querySelector('.footer span:last-child');
    if(footer)footer.textContent=`${CHARS.length} БОЙЦОВ · ${ARENAS.length} АРЕН · 4 ТЕРРИТОРИИ РТ`;
  };
  App.rtSelect=()=>RTHub.open('araya');
  const help=App.help.bind(App);
  App.help=function(){
    help();
    const modal=document.querySelector('#modalRoot .modal');
    if(modal){const g=App.screen==='rt'&&RTVariants.g;
      modal.insertAdjacentHTML('beforeend',`<p class="help-note">
        <b>Другие РТ:</b> Дэвид — свободное перемещение и обход газа;
        Айри — W/S меняют одну из трёх дорожек;
        Онсоку — W прыжок, S присед, D погоня.
        ${g?'<b>Сейчас:</b> '+esc(g.info.hint):''}
        Во всех испытаниях 1–4 применяют техники выбранного персонажа, без оружия корабля.
      </p>`);
    }
  };
  const customMenu=App.customMenu.bind(App);
  App.customMenu=function(){
    if(this.screen==='rt'&&RTVariants.g){
      const id=RTVariants.g.c.id;this.paused=true;
      this.modalBox('Свои приёмы · РТ',`<div class="stack">${Array.from({length:6},(_,i)=>{
        const m=Builder.get(id,i);
        return `<button ${m?'':'disabled'} onclick="RTHub.useCustom(${i})">
          ${i+1}. ${esc(m?.name||'Пустой слот')}${m?' · '+m.cost+' ПЭ':''}</button>`;
      }).join('')}</div>`,true);
      return;
    }
    customMenu();
  };
  const useCustom=App.useCustom.bind(App);
  App.useCustom=function(i){
    if(this.screen==='rt'&&RTVariants.g){App.closeModal();RTVariants.custom(i);return}
    useCustom(i);
  };
  const heal=App.heal.bind(App);
  App.heal=function(){
    if(this.screen==='rt'&&RTVariants.g){
      RTVariants.g.hp=RTVariants.g.c.hp;RTVariants.g.pe=RTVariants.g.c.pe;
      toast('Здоровье и ПЭ восстановлены');return;
    }
    heal();
  };
  const drawSelect=App.drawSelect.bind(App);
  App.drawSelect=function(){
    drawSelect();
    if(this.config.mode==='cpu'&&RTBossCatalog.has(this.config.p2)){
      const note=document.querySelector('.select-info .hintbox');
      if(note)note.textContent=`Против ИИ-${char(this.config.p2).short} шкала РТ начинается с 0%. При 100% начнётся испытание «${RTBossCatalog.get(this.config.p2).title}».`;
    }
  };
})();
