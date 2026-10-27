'use strict';

// David RT: top-down area-denial survival, NOT Araya's shoot-'em-up.
RTVariants.register('david',{
  move(rt,dt,mx,my){
    const g=rt.g,length=hypot(mx,my)||1,speed=g.slow>0?190:275;
    if(mx||my){g.dx=mx/length;g.dy=my/length;g.face=mx<0?-1:mx>0?1:g.face;}
    if(g.dashTime<=0){g.x+=mx/length*speed*dt;g.y+=my/length*speed*dt;}
    g.x=clamp(g.x,65,670);g.y=clamp(g.y,135,515);
    g.bossX=820+Math.sin(g.t*.68)*24;g.bossY=348+Math.sin(g.t*.52)*130;
  },
  pattern(rt){
    const g=rt.g,phase=g.phase,seq=phase===1?['cloud','fan','cloud','wall']:
      phase===2?['cloud','wall','fan','cloud','wall']:
        ['doubleCloud','wall','fan','doubleCloud','fan'];
    const type=seq[g.patternCount%seq.length],delay=g.hard?.68:1.06;
    g.patternTimer=(g.hard?1.6:2.25)-(phase-1)*.14;
    if(type==='cloud'||type==='doubleCloud'){
      rt.announce(type==='cloud'?'ЯДОВИТАЯ БОМБА':'ТОКСИЧНАЯ ЦЕПНАЯ РЕАКЦИЯ');
      rt.warn('cloud',{x:g.x,y:g.y,r:g.hard?67:60},delay);
      if(type==='doubleCloud')rt.warn('cloud',{
        x:clamp(g.x+(g.patternCount%2?100:-100),70,685),
        y:clamp(g.y+(g.patternCount%2?-85:85),140,520),r:58},delay+.43);
    }else if(type==='fan'){
      rt.announce('КИСЛОТНЫЙ ШКВАЛ');
      rt.warn('fan',{x:g.bossX,y:g.bossY,
        angle:Math.atan2(g.y-g.bossY,g.x-g.bossX)},delay);
    }else{
      rt.announce('ГАЗОВАЯ БЛОКАДА · ИЩИ ПРОХОД');
      // A fixed safe opening in the gas wall: there is always a path through.
      rt.warn('wall',{safe:175+(g.patternCount%3)*130},delay);
    }
  },
  trigger(rt,w){
    const g=rt.g;
    if(w.type==='cloud'){
      g.objects.push({kind:'poison',x:w.x,y:w.y,r:w.r,damage:7,
        life:g.hard?3.7:2.9,tick:.12});
      if(hypot(g.x-w.x,g.y-w.y)<w.r+15)rt.hitHero(9,{slow:true});
      rt.spark(w.x,w.y,'#a4f2a3',20);
    }else if(w.type==='fan'){
      const count=g.hard?12:8,spread=1.28;
      for(let i=0;i<count;i++){
        const angle=w.angle-spread/2+i*spread/(count-1),speed=g.hard?250:195;
        rt.bullet(w.x,w.y,Math.cos(angle)*speed,Math.sin(angle)*speed,
          8,8,'#abea8a',{slow:true});
      }
    }else if(w.type==='wall'){
      for(let y=130;y<=540;y+=38){
        if(Math.abs(y-w.safe)<52)continue;
        rt.bullet(930,y,g.hard?-340:-295,0,7,15,'#94c76d',{slow:true});
      }
    }
  },
  status(rt){
    const g=rt.g;
    return `УКЛОНЕНИЯ ${g.grazeCount} · ЯДОВИТЫХ ЗОН ${g.objects.filter(o=>o.kind==='poison').length}`;
  },
  drawBg(rt,ctx){
    const g=rt.g;
    const grd=ctx.createLinearGradient(0,0,960,600);
    grd.addColorStop(0,'#12231c');grd.addColorStop(1,'#0b151e');
    ctx.fillStyle=grd;ctx.fillRect(0,0,960,600);
    ctx.fillStyle='#182e26';ctx.fillRect(0,118,960,430);
    for(let x=0;x<960;x+=66)for(let y=118;y<550;y+=66){
      ctx.strokeStyle='#36614848';ctx.lineWidth=1;ctx.strokeRect(x,y,66,66);
      if((x+y)%4===0)circle(ctx,x+30,y+30,4,'#4d826029');
    }
    ctx.fillStyle='#101d1b';ctx.fillRect(730,118,230,430);
    circle(ctx,g.bossX,g.bossY,65+Math.sin(g.t*2.8)*8,'#79d4a017',true,2);
    canvasText(ctx,'КАРАНТИН · ОПАСНАЯ ЗОНА',480,93,21,'#8dc9a6');
  },
  drawExtra(rt,ctx){
    const g=rt.g;
    for(const o of g.objects)if(o.kind==='poison'){
      ctx.save();ctx.globalAlpha=.33+.12*Math.sin(g.t*7);
      circle(ctx,o.x,o.y,o.r,'#79de6c55');
      circle(ctx,o.x,o.y,o.r,'#b4f7a6',true,2);
      for(let i=0;i<7;i++)circle(ctx,o.x+Math.cos(i*2.4+g.t)*o.r*.62,
        o.y+Math.sin(i*2.4+g.t)*o.r*.62,5,'#baf2a2');
      ctx.restore();
    }
  }
});
