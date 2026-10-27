'use strict';
// Arena names shown by the selector.
const ARENAS=[['cyber_arena','Киберарена'],['tokyo_night','Ночная Сибуя'],['higan_dojo','Зал Хиганкана'],['industrial_port','Порт'],['endless_plain','Равнина']];

const ARENA_DATA=new Map([
  ['cyber_arena',{camera:'fixed',colors:['#0a1523','#172e3d']}],
  ['tokyo_night',{camera:'fixed',colors:['#111627','#263048']}],
  ['higan_dojo',{camera:'fixed',colors:['#27221f','#4b3a2b']}],
  ['industrial_port',{camera:'fixed',colors:['#67484e','#202d3b']}],
  ['endless_plain',{camera:'follow',colors:['#2a4957','#91b4b3']}]
]);

const ArenaCatalog=Object.freeze({
  get(id){return ARENA_DATA.get(id)||null;},
  register(data){
    if(!data||!/^[a-z][a-z0-9_]*$/.test(data.id||'')||
       typeof data.name!=='string'||!data.name.trim())throw Error('Invalid arena');
    if(ARENA_DATA.has(data.id))throw Error('Duplicate arena: '+data.id);
    const camera=data.camera==='follow'?'follow':'fixed';
    const colors=Array.isArray(data.colors)&&data.colors.length===2?
      data.colors:['#182638','#38465b'];
    ARENAS.push([data.id,data.name]);
    const arena={camera,colors,background:data.background||null,floor:data.floor||'#111f2a',custom:true};
    ARENA_DATA.set(data.id,arena);
    return arena;
  },
  list(){return [...ARENAS];}
});
