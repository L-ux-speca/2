'use strict';

// Shared painter; each boss supplies a bespoke environment and attack language.
RTVariants.draw=function(){
  const g=this.g,ctx=App.ctx;if(!g||!ctx)return;
  ctx.clearRect(0,0,960,600);
  this.genre().drawBg(this,ctx);
  if(g.state==='intro'){
    ctx.fillStyle='#090e1ab5';ctx.fillRect(0,0,960,600);
    canvasText(ctx,'ТЕРРИТОРИЯ · '+g.enemy.name.toUpperCase(),480,245,28,'#f0e8ec');
    canvasText(ctx,g.info.title.toUpperCase(),480,308,44,g.info.accent);
    canvasText(ctx,g.info.genre,480,349,18,'#c9cdd8');
    canvasText(ctx,g.info.hint,480,435,13,'#e5e1e6');
    return;
  }
  for(const w of g.warnings){
    const progress=1-clamp(w.time/w.full,0,1);
    ctx.save();ctx.globalAlpha=.16+.13*Math.sin(g.t*25)**2;
    const color=g.info.accent;
    if(g.bossId==='david'){
      if(w.type==='cloud'){
        circle(ctx,w.x,w.y,w.r,'#a7f5a850');
        circle(ctx,w.x,w.y,w.r*(1-progress),'#d6f8b7',true,3);
      }else if(w.type==='wall'){
        ctx.fillStyle='#c1e18a77';
        ctx.fillRect(0,120,960,Math.max(0,w.safe-52-120));
        ctx.fillRect(0,w.safe+52,960,Math.max(0,548-w.safe-52));
        line(ctx,0,w.safe-52,960,w.safe-52,'#dafab4',2);
        line(ctx,0,w.safe+52,960,w.safe+52,'#dafab4',2);
      }else{
        const a=w.angle;
        ctx.fillStyle='#9cfa9e77';ctx.beginPath();ctx.moveTo(w.x,w.y);
        ctx.arc(w.x,w.y,850,a-.64,a+.64);ctx.closePath();ctx.fill();
      }
    }else if(g.bossId==='airi'){
      const safe=w.safe;
      if(w.type==='clone'){
        circle(ctx,759,[202,355,508][w.lane],48,'#f3d3ff55');
      }else for(let lane=0;lane<3;lane++)if(lane!==safe){
        const y=[202,355,508][lane];
        ctx.fillStyle='#eea2d066';ctx.fillRect(38,y-54,884,108);
        line(ctx,38,y-54,922,y-54,'#f6c2e0',2);
      }
    }else{
      const y=w.y||462;
      ctx.fillStyle='#f2a8aa66';ctx.fillRect(100,y-w.r-6,860,w.r*2+12);
      line(ctx,100,y-w.r-6,960,y-w.r-6,'#ffd4bd',2);
      canvasText(ctx,w.type==='shuriken'?'ПРИГНИСЬ':'ПРЫГНИ',770,y-44,14,'#fff1df');
    }
    ctx.restore();
  }
  for(const o of g.objects){
    if(o.kind==='pulse')circle(ctx,o.x,o.y,o.r*(1-o.life/(o.full||.4)),g.c.color+'8a',true,4);
    if(o.kind==='field')circle(ctx,o.x,o.y,o.r,g.c.color+'5a',true,2);
    if(o.kind==='orbit')for(let i=0;i<(o.count||2);i++){
      const a=g.t*6+i*Math.PI*2/(o.count||2);
      circle(ctx,g.x+Math.cos(a)*o.r,g.y+Math.sin(a)*o.r,12,g.c.color);
    }
  }
  this.genre().drawExtra?.(this,ctx);
  const enemy={c:g.enemy,x:g.bossX,y:g.bossY+47,face:-1,hp:g.bossHP,
    stun:0,st:{},grounded:true,moving:false,attack:null,pose:0,block:false,crouch:false};
  ctx.save();glow(ctx,g.enemy.color,8);
  drawFighter(ctx,enemy,g.t,.73);ctx.restore();
  circle(ctx,g.bossX,g.bossY,49,g.enemy.color+'45',true,2);
  if(g.phase===3){
    circle(ctx,g.bossX,g.bossY,57+Math.sin(g.t*6)*4,g.enemy.color+'55',true,2);
  }
  for(const s of g.shots){
    line(ctx,s.x-s.vx*.017,s.y-s.vy*.017,s.x,s.y,g.c.color,Math.max(2,s.r));
    circle(ctx,s.x,s.y,Math.max(2,s.r*.6),'#ebfff0');
  }
  for(const b of g.bullets){
    if(b.shape==='spike'){
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.PI/2);
      poly(ctx,[[0,-18],[15,14],[-15,14]],b.color);ctx.restore();
    }else if(b.shape==='cube'){
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(g.t*1.8);
      ctx.fillStyle=b.color;ctx.fillRect(-b.r,-b.r,b.r*2,b.r*2);ctx.restore();
    }else if(b.shape==='shuriken'){
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(g.t*9);
      poly(ctx,[[0,-b.r*1.5],[b.r*.55,-b.r*.5],[b.r*1.5,0],
        [b.r*.55,b.r*.5],[0,b.r*1.5],[-b.r*.55,b.r*.5],[-b.r*1.5,0],[-b.r*.55,-b.r*.5]],b.color);
      ctx.restore();
    }else circle(ctx,b.x,b.y,b.r,b.color);
    if(b.near&&!b.grazed)circle(ctx,b.x,b.y,b.r+6,'#fff5bd55',true,1);
  }
  for(const e of g.activeAbilities)if(e.kind==='summon'){
    circle(ctx,e.originX,e.originY,14,g.c.color+'77');
    poly(ctx,[[e.originX,e.originY-12],[e.originX+10,e.originY+8],
      [e.originX-10,e.originY+8]],g.c.color);
  }
  const hero={c:g.c,x:g.x,y:g.y+(g.bossId==='sonic'?51:40),
    face:g.face||1,hp:g.hp,stun:g.hitTimer||0,st:{inv:g.inv},
    grounded:g.grounded,moving:true,attack:null,pose:0,
    block:g.shield>0,crouch:g.crouch};
  ctx.save();if(g.inv>0&&Math.floor(g.t*18)%2===0)ctx.globalAlpha=.46;
  drawFighter(ctx,hero,g.t,g.bossId==='sonic'?.55:.48);ctx.restore();
  circle(ctx,g.x,g.y,17,g.c.color+'71',true,1.7);
  if(g.shield>0)circle(ctx,g.x,g.y,30+Math.sin(g.t*13)*2,g.c.color+'bd',true,3);
  if(g.bossId==='sonic'&&g.crouch)
    canvasText(ctx,'ПРИСЕД',g.x,g.y-38,10,'#d9f2e1');
  for(const p of g.fx){ctx.save();ctx.globalAlpha=clamp(p.life*2,0,1);
    circle(ctx,p.x,p.y,2.5,p.color);ctx.restore();}
  if(g.phaseWait>0){
    ctx.save();ctx.globalAlpha=.3;ctx.fillStyle='#090a13';ctx.fillRect(0,0,960,600);
    ctx.restore();
  }
  if(g.state==='finish'){
    ctx.save();ctx.fillStyle='#09111bbe';ctx.fillRect(0,0,960,600);
    canvasText(ctx,g.won?'ПОБЕДА':'ПОРАЖЕНИЕ',480,290,52,g.won?'#abebce':'#f3a4a8');
    canvasText(ctx,g.info.title.toUpperCase(),480,341,21,'#f1e6eb');
    ctx.restore();
  }
};
