'use strict';

// David RT: top-down area-denial survival, NOT Araya's shoot-'em-up.
RTVariants.register('david',{
  phase(rt,n){
    const g=rt.g;
    g.formName=['','НОСИТЕЛЬ ЯДА','ХИМИЧЕСКИЙ РЕАКТОР','ГАЗОВЫЙ КОЛОСС'][n];
    g.patternCount=0;
    g.patternTimer=n===1?1.5:g.hard?1.15:1.65;
    if(n===3)g.objects=g.objects.filter(o=>o.kind!=='poison'||o.life>1.1);
  },
  move(rt,dt,mx,my){
    const g=rt.g,length=hypot(mx,my)||1,speed=g.slow>0?190:g.hard?297:275;
    if(mx||my){g.dx=mx/length;g.dy=my/length;g.face=mx<0?-1:mx>0?1:g.face;}
    if(g.dashTime<=0){g.x+=mx/length*speed*dt;g.y+=my/length*speed*dt;}
    g.x=clamp(g.x,65,670);g.y=clamp(g.y,135,515);
    g.bossX=g.phase===1?820+Math.sin(g.t*.68)*24:
      g.phase===2?804+Math.cos(g.t*1.03)*64:802+Math.cos(g.t*1.8)*92;
    g.bossY=348+Math.sin(g.t*(g.phase===1?.52:g.phase===2?1.25:2))*
      (g.phase===1?130:160);
  },
  pattern(rt){
    const g=rt.g,phase=g.phase,seq=phase===1?['cloud','fan','cloud','wall','fan']:
      phase===2?['reactor','fork','wall','doubleCloud','fan','ring']:
        ['ring','detonate','fork','reactor','wall','doubleCloud','ring'];
    const type=seq[g.patternCount%seq.length],delay=g.hard?.72:1.05;
    g.patternTimer=Math.max(.92,(g.hard?1.28:2.15)-(phase-1)*(g.hard?.14:.18));
    if(type==='cloud'||type==='doubleCloud'){
      rt.announce(type==='cloud'?'ЯДОВИТАЯ БОМБА':'ТОКСИЧНАЯ ЦЕПНАЯ РЕАКЦИЯ');
      rt.warn('cloud',{x:g.x,y:g.y,r:g.hard?67:60},delay);
      if(type==='doubleCloud')rt.warn('cloud',{
        x:clamp(g.x+(g.patternCount%2?100:-100),70,685),
        y:clamp(g.y+(g.patternCount%2?-85:85),140,520),r:58},delay+.43);
    }else if(type==='fan'||type==='fork'){
      rt.announce(type==='fork'?'ТРЁХСТОРОННИЙ КИСЛОТНЫЙ ЗАЛП':'КИСЛОТНЫЙ ШКВАЛ');
      rt.warn(type,{x:g.bossX,y:g.bossY,
        angle:Math.atan2(g.y-g.bossY,g.x-g.bossX)},delay);
    }else if(type==='ring'){
      rt.announce('КИСЛОТНОЕ КОЛЬЦО · ИЩИ СЕКТОР');
      rt.warn('ring',{x:g.bossX,y:g.bossY,r:105,
        angle:Math.atan2(g.y-g.bossY,g.x-g.bossX)},delay);
    }else if(type==='reactor'){
      rt.announce('РЕАКТОРЫ · ДВЕ ЗОНЫ ЗАРАЖЕНИЯ');
      rt.warn('reactor',{x:clamp(g.x+108,125,650),y:clamp(g.y-105,140,500),r:45},delay);
      rt.warn('reactor',{x:clamp(g.x-130,85,650),y:clamp(g.y+112,140,500),r:45},delay+.24);
    }else if(type==='detonate'){
      rt.announce('ДЕТОНАЦИЯ ЯДОВИТЫХ ОБЛАКОВ');
      rt.warn('detonate',{x:g.x,y:g.y,r:88},delay);
    }else{
      rt.announce('ГАЗОВАЯ БЛОКАДА · ИЩИ ПРОХОД');
      // Every wall has a full-height gap, even on Lunatic.
      rt.warn('wall',{safe:clamp(190+(g.patternCount%3)*110,190,445)},delay);
    }
    // Lunatic adds offset hazards; the delayed warning leaves time to move.
    if(g.hard&&(phase>=2||g.patternCount%2===0)&&
      type!=='reactor'&&type!=='doubleCloud'){
      rt.warn('cloud',{x:clamp(g.x+(g.patternCount%2?85:-85),85,645),
        y:clamp(g.y+(g.patternCount%2?-78:78),140,510),r:41},delay+.57);
    }
  },
  trigger(rt,w){
    const g=rt.g;
    if(w.type==='cloud'||w.type==='reactor'){
      const active=g.objects.filter(o=>o.kind==='poison');
      if(active.length>=7)active[0].life=0;
      g.objects.push({kind:'poison',form:w.type,x:w.x,y:w.y,r:w.r,
        damage:w.type==='reactor'?9:7,
        life:w.type==='reactor'?5.1:g.hard?3.6:2.9,tick:.12});
      if(hypot(g.x-w.x,g.y-w.y)<w.r+15)rt.hitHero(9,{slow:true});
      rt.spark(w.x,w.y,'#a4f2a3',20);
    }else if(w.type==='fan'||w.type==='fork'){
      const streams=w.type==='fork'?3:1;
      for(let row=0;row<streams;row++){
        const count=g.hard?12:8,spread=w.type==='fork'?.48:1.28;
        for(let i=0;i<count;i++){
          const angle=w.angle+(row-(streams-1)/2)*.57-spread/2+i*spread/(count-1);
          const speed=(g.hard?278:195)+(row%2)*23;
          rt.bullet(w.x,w.y,Math.cos(angle)*speed,Math.sin(angle)*speed,
            8,8,'#abea8a',{slow:true});
        }
      }
    }else if(w.type==='ring'){
      const count=g.hard?38:24,gap=g.hard?.29:.43;
      for(let i=0;i<count;i++){
        const angle=i*Math.PI*2/count+g.t*.08;
        if(Math.abs(Math.atan2(Math.sin(angle-w.angle),Math.cos(angle-w.angle)))<gap)continue;
        rt.bullet(w.x,w.y,Math.cos(angle)*(g.hard?292:218),
          Math.sin(angle)*(g.hard?292:218),7,7,'#b2fc9e',{slow:true});
      }
    }else if(w.type==='detonate'){
      const clouds=g.objects.filter(o=>o.kind==='poison');
      for(const o of clouds){
        for(let i=0;i<(g.hard?13:8);i++){
          const angle=i*Math.PI*2/(g.hard?13:8)+g.t*.2;
          rt.bullet(o.x,o.y,Math.cos(angle)*205,Math.sin(angle)*205,6,7,'#d9f8a1');
        }
        o.life=0;
      }
      if(!clouds.length)rt.warn('cloud',{x:w.x,y:w.y,r:62},.25);
    }else if(w.type==='wall'){
      for(let y=130;y<=540;y+=(g.hard?28:38)){
        if(Math.abs(y-w.safe)<(g.hard?47:57))continue;
        rt.bullet(930,y,g.hard?-385:-295,0,7,15,'#94c76d',{slow:true});
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
    grd.addColorStop(0,g.phase===3?'#263713':'#12231c');
    grd.addColorStop(1,g.phase===2?'#191f16':'#0b151e');
    ctx.fillStyle=grd;ctx.fillRect(0,0,960,600);
    ctx.fillStyle='#182e26';ctx.fillRect(0,118,960,430);
    for(let x=0;x<960;x+=66)for(let y=118;y<550;y+=66){
      ctx.strokeStyle='#36614848';ctx.lineWidth=1;ctx.strokeRect(x,y,66,66);
      if((x+y)%4===0)circle(ctx,x+30,y+30,4,'#4d826029');
    }
    ctx.fillStyle='#101d1b';ctx.fillRect(730,118,230,430);
    circle(ctx,g.bossX,g.bossY,65+Math.sin(g.t*2.8)*8,'#79d4a017',true,2);
    if(g.phase>=2)for(let i=0;i<5;i++){
      const x=770+Math.cos(i*1.75+g.t*.3)*150,y=345+Math.sin(i*1.75+g.t*.3)*165;
      circle(ctx,x,y,7,'#a7e98d38');
      line(ctx,x-19,y,x+19,y,'#c3f7a327',2);
    }
    canvasText(ctx,'КАРАНТИН · ОПАСНАЯ ЗОНА',480,93,21,'#8dc9a6');
  },
  drawBoss(rt,ctx){
    const g=rt.g;if(g.phase===1)return;
    const n=g.phase===2?3:7,r=g.phase===2?47:74;
    ctx.save();ctx.translate(g.bossX,g.bossY);ctx.rotate(g.t*(g.phase===3?1.9:.65));
    for(let i=0;i<n;i++){
      const a=i*Math.PI*2/n,x=Math.cos(a)*r,y=Math.sin(a)*r;
      circle(ctx,x,y,g.phase===3?14:9,'#b2eb78a0',true,2);
      line(ctx,x,y,x*.65,y*.65,'#c0f49a88',2);
    }
    circle(ctx,0,0,g.phase===3?61:33,'#9af5a349',true,3);
    ctx.restore();
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
