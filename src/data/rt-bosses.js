'use strict';

// The RT selector, encyclopedia and normal-fight transition share this list.
// Adding new encounters does not require hardcoding another boss into the UI.
const RTBossCatalog=(()=>{
  const bosses=new Map();
  const register=data=>{
    if(!data||!CHARS.some(c=>c.id===data.id)||!data.title||!data.genre)
      throw Error('An RT boss requires an existing fighter, title and genre');
    if(bosses.has(data.id))throw Error('Duplicate RT boss: '+data.id);
    const info=Object.freeze({...data});bosses.set(data.id,info);return info;
  };
  [
    {id:'araya',title:'Корабль Тесея',genre:'Bullet hell · морское сражение',
     short:'Флот, эскорты и узлы флагмана',hint:'WASD — движение · Q — цель · Shift — рывок · 1–4 — техники',accent:'#d0b7df'},
    {id:'david',title:'Токсичный квартал',genre:'Survival · контроль пространства',
     short:'Избегай ядовитых облаков, коридоров и газовых залпов',hint:'WASD — перемещение · Shift — рывок · 1–4 — техники',accent:'#a2df9f'},
    {id:'airi',title:'Лабиринт фигур',genre:'Rhythm lanes · три дорожки',
     short:'Меняй высоту, уклоняйся от кубов и уничтожай клонов',hint:'W/S — смена дорожек · A/D — смещение · Shift — рывок · 1–4 — техники',accent:'#d7b1f3'},
    {id:'sonic',title:'Погоня Онсоку',genre:'Speed runner · погоня',
     short:'Прыгай через ловушки, пригибайся под сюрикенами и догоняй врага',hint:'W — прыжок · S — присесть · A/D — скорость · Shift — рывок · 1–4 — техники',accent:'#f0ad91'}
  ].forEach(register);
  return Object.freeze({register,get:id=>bosses.get(id)||null,has:id=>bosses.has(id),all:()=>[...bosses.values()]});
})();
