'use strict';

// Simplify the home screen without changing the established mode screens.
(() => {
  const originalHome=App.home.bind(App);
  App.home=function(...args){
    originalHome(...args);
    document.querySelector('.home-portrait-selector')?.remove();
    const menu=document.querySelector('.home-grid .menu');
    if(!menu)return;
    menu.classList.add('clean-home-menu');
    menu.innerHTML=`
      <div class="home-menu-heading"><span class="eyebrow">TOKYO DAWN</span>
        <h2>Главное меню</h2><p>Выбери режим и начни бой.</p></div>
      <button class="mode-btn primary" onclick="App.modes()">
        <div><b>Играть</b><small>Бой, аркада, тренировка</small></div><span class="arrow">↗</span>
      </button>
      <button class="mode-btn" onclick="RTHub.open()">
        <div><b>Территории РТ</b><small>4 босса · Easy / Lunatic</small></div><span class="arrow">→</span>
      </button>
      <button class="mode-btn" onclick="Encyclopedia.open()">
        <div><b>Энциклопедия</b><small>Персонажи и способности</small></div><span class="arrow">▣</span>
      </button>
      <div class="home-utilities">
        <button onclick="Builder.open()">Конструктор</button>
        <button onclick="App.settings()">Настройки</button>
      </div>
      <button class="home-help" onclick="App.help()">Управление и помощь</button>`;
    const nav=document.querySelector('.topnav');
    if(nav)nav.innerHTML='<button onclick="App.help()">Управление</button>';
  };
})();
