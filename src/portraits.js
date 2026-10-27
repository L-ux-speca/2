'use strict';

// Image assets are copied byte-for-byte from characters.zip.  CSS only scales
// the displayed image and never stretches or crops its intrinsic aspect ratio.
const PORTRAIT_PATHS = Object.freeze({
  yuzuha: 'assets/portraits/yuzuha.jpg',
  caesar: 'assets/portraits/caesar.jpg',
  araya: 'assets/portraits/araya.jpg',
  lapis: 'assets/portraits/lapis.png',
  tori: 'assets/portraits/tori.jpg',
  akira: 'assets/portraits/akira.jpg',
  sonic: 'assets/portraits/sonic.jpg',
  david: 'assets/portraits/david.jpg',
  chieko: 'assets/portraits/chieko.jpg',
  airi: 'assets/portraits/airi.jpg',
  dio: 'assets/portraits/dio.jpg',
  kayano: 'assets/portraits/kayano.jpg',
  mechamaru: 'assets/portraits/mechamaru.jpg',
  kisei: 'assets/portraits/kisei.jpg'
});
const portraitPath=c=>c?.portrait||PORTRAIT_PATHS[c?.id]||'';
const proceduralPortrait=portrait;

// The original UI invokes portrait() in both the selection cards and hero info.
portrait = function(c) {
  if(!portraitPath(c))return proceduralPortrait(c);
  return `<div class="fighter-portrait" style="--portrait-accent:${c.color}">
    <img class="portrait-original" src="${esc(portraitPath(c))}"
      alt="Портрет: ${esc(c.name)}" loading="lazy" decoding="async">
  </div>`;
};

const homeWithoutPortraits = App.home.bind(App);
App.home = function() {
  homeWithoutPortraits();
  const hero = document.querySelector('.home-grid .hero');
  const footer = document.querySelector('#app > .footer');
  if (!hero || !footer) return;

  hero.classList.add('hero-with-portrait');
  const featured = document.createElement('img');
  featured.className = 'hero-featured-portrait';
  featured.src = portraitPath(char(this.config.p1));
  if(!featured.src||!portraitPath(char(this.config.p1)))featured.hidden=true;
  featured.alt = 'Избранный персонаж';
  featured.decoding = 'async';
  featured.fetchPriority = 'high';
  hero.prepend(featured);
  const fallback = document.createElement('div');
  fallback.className = 'hero-featured-fallback';
  fallback.innerHTML = proceduralPortrait(char(this.config.p1));
  fallback.hidden = !!portraitPath(char(this.config.p1));
  hero.prepend(fallback);

  // The complete roster is available in character select and Encyclopedia.
  // Avoid 14 additional images, buttons and network requests on the home screen.

  const current = char(App.config.p1);
  const label = hero.querySelector('.hero-bottom span');
  const description = hero.querySelector('.hero-bottom p');
  if (label) label.textContent = current.name.toUpperCase();
  if (description) description.textContent = current.tag;
};

