'use strict';

// Imported character art on 384x576 transparent canvases, feet on a common baseline.
// Each imported character has two poses. Add other animation states here later.
const SPRITE_MANIFEST={
  lapis: {displayHeight:110,states:{
    idle: {paths:['assets/sprites/lapis/idle.png'],fps:1},
    crouch: {paths:['assets/sprites/lapis/crouch.png'],fps:1}
  }},
  airi: {displayHeight:110,states:{
    idle: {paths:['assets/sprites/airi/idle.png'],fps:1},
    crouch: {paths:['assets/sprites/airi/crouch.png'],fps:1}
  }},
  chieko: {displayHeight:110,states:{
    idle: {paths:['assets/sprites/chieko/idle.png'],fps:1},
    crouch: {paths:['assets/sprites/chieko/crouch.png'],fps:1}
  }},
  dio: {displayHeight:110,states:{
    idle: {paths:['assets/sprites/dio/idle.png'],fps:1},
    crouch: {paths:['assets/sprites/dio/crouch.png'],fps:1}
  }},
  tori: {displayHeight:110,states:{
    idle: {paths:['assets/sprites/tori/idle.png'],fps:1},
    crouch: {paths:['assets/sprites/tori/crouch.png'],fps:1}
  }},
  araya: {displayHeight:110,states:{
    idle: {paths:['assets/sprites/araya/idle.png'],fps:1},
    crouch: {paths:['assets/sprites/araya/crouch.png'],fps:1}
  }},
  kayano: {displayHeight:110,states:{
    idle: {paths:['assets/sprites/kayano/idle.png'],fps:1},
    crouch: {paths:['assets/sprites/kayano/crouch.png'],fps:1}
  }},
  david: {displayHeight:110,states:{
    idle: {paths:['assets/sprites/david/idle.png'],fps:1},
    crouch: {paths:['assets/sprites/david/crouch.png'],fps:1}
  }},
  caesar: {displayHeight:110,states:{
    idle: {paths:['assets/sprites/caesar/idle.png'],fps:1},
    crouch: {paths:['assets/sprites/caesar/crouch.png'],fps:1}
  }},
  yuzuha: {displayHeight:110,states:{
    idle: {paths:['assets/sprites/yuzuha/idle.png'],fps:1},
    crouch: {paths:['assets/sprites/yuzuha/crouch.png'],fps:1}
  }}
};
