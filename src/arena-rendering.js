'use strict';

// Registered new arenas get safe rendering without modifying drawArena's
// five handcrafted original backgrounds.
(() => {
  const base=drawArena;
  const images=new Map();
  drawArena=function(ctx,id,time,camera){
    const arena=ArenaCatalog.get(id);
    if(!arena?.custom)return base(ctx,id,time,camera);
    const [sky,ground]=arena.colors;
    const gradient=ctx.createLinearGradient(0,0,0,550);
    gradient.addColorStop(0,sky);gradient.addColorStop(1,ground);
    ctx.fillStyle=gradient;ctx.fillRect(0,0,1100,550);

    if(arena.background&&typeof Image!=='undefined'){
      if(!images.has(arena.background)){
        const image=new Image();image.src=arena.background;
        images.set(arena.background,image);
      }
      const img=images.get(arena.background);
      if(img.complete&&img.naturalWidth&&img.naturalHeight){
        const scale=Math.max(1100/img.naturalWidth,550/img.naturalHeight);
        const w=img.naturalWidth*scale,h=img.naturalHeight*scale;
        ctx.drawImage(img,(1100-w)/2,(550-h)/2,w,h);
      }
    }
    ctx.fillStyle=arena.floor;ctx.fillRect(0,460,1100,90);
    line(ctx,0,460,1100,460,'#a0b4b2',2);
    for(let x=0;x<1100;x+=90)line(ctx,550+(x-550)*.4,462,x,550,'#ffffff10');
  };
})();
