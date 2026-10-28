'use strict';

// Airi RT: three-lane rhythm/action game with cubes, horizontal spikes and
// destructible decoys. Inputs W/S select one of three lanes (not free-flight).
const AIRI_LANES=[202,355,508];
RTVariants.register('airi',{
  phase(rt,n){
    const g=rt.g;
    g.formName=['','КУБИЧЕСКИЙ АВТОМАТ','ПРИЗМАТИЧЕСКОЕ ЯДРО','ДЕВЯТИКЛЕТОЧНЫЙ ЛАБИРИНТ'][n];
    g.patternCount=0;g.patternTimer=n===1?1.6:g.hard?1.12:1.7;
    if(n>=2)rt.warn('clone',{lane:(n+1)%3},.7);
    if(n===3){g.gridCol=1;g.gridRow=1;g.gridMoveCD=0;rt.warn('clone',{lane:2},1.35);}
  },
  move(rt,dt,mx){
    const g=rt.g;
    if(g.phase===3){
      g.gridMoveCD=Math.max(0,(g.gridMoveCD||0)-dt);
      if(g.gridMoveCD<=0){
        if(Input.tap(0,'left')||Input.pressed.has('touch:left')){g.gridCol=Math.max(0,(g.gridCol??1)-1);g.gridMoveCD=.14;}
        else if(Input.tap(0,'right')||Input.pressed.has('touch:right')){g.gridCol=Math.min(2,(g.gridCol??1)+1);g.gridMoveCD=.14;}
        else if(Input.tap(0,'up')||Input.pressed.has('touch:up')){g.gridRow=Math.max(0,(g.gridRow??1)-1);g.gridMoveCD=.14;}
        else if(Input.tap(0,'down')||Input.pressed.has('touch:down')){g.gridRow=Math.min(2,(g.gridRow??1)+1);g.gridMoveCD=.14;}
      }
      g.x=[135,285,435][g.gridCol??1];g.y=AIRI_LANES[g.gridRow??1];g.lane=g.gridRow??1;
    }else{
      if(Input.tap(0,'up')||Input.pressed.has('touch:up'))g.lane=Math.max(0,g.lane-1);
      if(Input.tap(0,'down')||Input.pressed.has('touch:down'))g.lane=Math.min(2,g.lane+1);
      if(g.dashTime<=0)g.x+=mx*(g.slow>0?170:230)*dt;
      g.x=clamp(g.x,108,454);g.y=AIRI_LANES[g.lane];
    }
    g.bossX=g.phase===1?829:815+Math.cos(g.t*(g.phase===3?2.1:1.1))*47;
    g.bossY=g.phase===1?AIRI_LANES[1]+Math.sin(g.t*.8)*35:
      g.phase===2?AIRI_LANES[(Math.floor(g.t/(g.hard?.8:1.2)))%3]:
        AIRI_LANES[(Math.floor(g.t/1.65))%3];
    g.beatTimer+=dt;
    const interval=g.hard?.56:.83;
    if(g.beatTimer>=interval){g.beatTimer-=interval;g.beat++;}
    for(const decoy of g.targets)if(decoy.id!=='boss'&&decoy.hp>0){
      decoy.life-=dt;
      decoy.x=759+Math.sin(g.t*(g.phase===3?3.4:2)+decoy.phase)*43;
      if(g.phase===3)decoy.y=AIRI_LANES[(decoy.homeLane+Math.floor((g.t+decoy.phase)/1.75))%3];
      if(decoy.life<=0)decoy.hp=0;
      decoy.timer-=dt;
      if(decoy.timer<=0){
        decoy.timer=g.hard?.56:.85;
        rt.bullet(decoy.x,decoy.y,g.phase===3?-310:-235,0,6,11,'#daaff3');
      }
    }
    g.targets=g.targets.filter(t=>t.id==='boss'||t.hp>0);
  },
  pattern(rt){
    const g=rt.g,seq=g.phase===1?['cubes','spikes','cubes','mirror']:
      g.phase===2?['prism','flip','clone','burst','mirror','spikes','prism']:
      ['gridCross','gridSweep','gridLock','prism','flip','burst','gridCross','gridLock','gridSweep'];
    const type=seq[g.patternCount%seq.length];
    const delay=g.hard?.63:.86;
    // Leave enough time for the last wave's telegraph to resolve before a
    // new safe lane is chosen. Lunatic is dense, but not a forced-hit puzzle.
    g.patternTimer=g.hard?(g.phase===3?2.05:1.58):g.phase===3?2.05:1.66;
    if(type==='gridCross'||type==='gridSweep'||type==='gridLock'){
      const safeCell=(g.patternCount*5+2)%9;
      rt.announce(type==='gridCross'?'ПРИЗМАТИЧЕСКИЙ КРЕСТ · ВЫБЕРИ КЛЕТКУ':type==='gridSweep'?'СМЕНА РЯДОВ · ИЩИ ПРОХОД':'ВЕРТИКАЛЬНЫЙ ЗАМОК · СМЕНИ КОЛОНКУ');
      rt.warn(type,{safeCell,safe:Math.floor(safeCell/3)},g.hard?.9:1.15);
      if(g.hard&&type!=='gridCross')rt.warn(type==='gridSweep'?'gridLock':'gridSweep',{safeCell:(safeCell+4)%9,safe:Math.floor(((safeCell+4)%9)/3)},1.65);
    }else if(type==='clone'){
      rt.announce('ЗЕРКАЛЬНАЯ КОПИЯ · РАЗРУШЬ КЛОНА');
      rt.warn('clone',{lane:(g.patternCount+1)%3},delay);
    }else{
      const safe=(g.patternCount+1+(g.phase===3?1:0))%3;
      rt.announce(type==='cubes'?'КУБИЧЕСКИЙ РИТМ':
        type==='spikes'?'ГОРИЗОНТАЛЬНЫЕ ШИПЫ':
        type==='flip'?'ИНВЕРСИЯ · ДВЕ СТОРОНЫ':
        type==='prism'?'ПРИЗМАТИЧЕСКИЙ ЗАЛП':
        type==='burst'?'КУБИЧЕСКАЯ ПУЛЬСАЦИЯ':'ЗЕРКАЛЬНЫЕ СТЕНЫ');
      rt.warn(type,{safe},delay);
      // Extra on-beat volleys on Lunatic: safe lane stays the same within
      // each sequence, so a perfect lane choice always exists.
      if(g.hard){
        rt.warn(type==='flip'?'mirror':'cubes',{safe},delay+.48);
        if(g.phase===3)rt.warn('spikes',{safe},delay+1.05);
      }
    }
  },
  trigger(rt,w){
    const g=rt.g;
    if(['gridCross','gridSweep','gridLock'].includes(w.type)){
      const rows=[202,355,508],cols=[135,285,435],safe=w.safeCell??4;
      for(let row=0;row<3;row++)for(let col=0;col<3;col++){
        const cell=row*3+col;
        const dangerous=w.type==='gridSweep'?row!==Math.floor(safe/3):w.type==='gridLock'?col!==safe%3:cell!==safe;
        if(dangerous)rt.bullet(cols[col],rows[row],0,0,g.hard?13:9,43,'#dca8f5',{shape:'gridcell',life:.82});
      }
      return;
    }
    if(w.type==='clone'){
      g.targets=g.targets.filter(t=>t.id==='boss'||t.hp>0);
      if(g.targets.filter(t=>t.id!=='boss').length>=(g.hard?3:2))return;
      g.targets.push({id:'clone'+g.patternCount,name:'Клон Айри',
        hp:g.hard?76:42,maxHp:g.hard?76:42,
        x:756,y:AIRI_LANES[w.lane],homeLane:w.lane,
        r:25,life:g.hard?9:6.4,timer:.5,phase:g.patternCount});
      return;
    }
    const lanes=[0,1,2].filter(i=>i!==w.safe);
    const repetitions=w.type==='burst'?3:
      w.type==='spikes'?(g.hard?3:1):w.type==='mirror'||w.type==='prism'?2:1;
    for(let i=0;i<repetitions;i++)for(const lane of lanes){
      const speed=(w.type==='spikes'?445:365)*(g.hard?1.27:1);
      const shape=w.type==='spikes'?'spike':'cube';
      const left=w.type==='flip'||w.type==='prism'&&i%2===1;
      rt.bullet(left?-40:970+i*105,AIRI_LANES[lane],left?speed:-speed,0,
        w.type==='spikes'?11:8,w.type==='spikes'?15:21,
        left?'#a8d6fd':w.type==='spikes'?'#f1b2bc':'#c4aff6',{shape});
    }
  },
  status(rt){const g=rt.g;
    return g.phase===3?`КЛЕТКА ${(g.gridRow??1)+1}-${(g.gridCol??1)+1}/9 · УКЛОНЕНИЯ ${g.grazeCount}`:`ДОРОЖКА ${g.lane+1}/3 · ТАКТ ${g.beat} · УКЛОНЕНИЯ ${g.grazeCount}`;
  },
  drawBg(rt,ctx){
    const g=rt.g,gradient=ctx.createLinearGradient(0,0,960,600);
    gradient.addColorStop(0,g.phase===3?'#3a2254':'#221a33');
    gradient.addColorStop(1,g.phase===2?'#25203b':'#13172a');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,960,600);
    for(let i=0;i<3;i++){
      const y=AIRI_LANES[i];ctx.fillStyle=i===(g.phase===3?(g.gridRow??1):g.lane)?'#8559c522':
        g.phase===3?'#9864c418':'#55417910';
      ctx.fillRect(36,y-57,888,114);
      line(ctx,36,y-57,924,y-57,'#a989dc32',2);
      line(ctx,36,y+57,924,y+57,'#a989dc32',2);
      for(let x=38;x<930;x+=60)line(ctx,x,y-56,x,y+56,'#ac9cce12');
      canvasText(ctx,String(i+1),65,y+8,25,i===g.lane?'#e7ceff':'#715d95');
    }
    if(g.phase===3){
      for(let row=0;row<3;row++)for(let col=0;col<3;col++){
        const x=[135,285,435][col],y=AIRI_LANES[row];
        ctx.fillStyle=(row===(g.gridRow??1)&&col===(g.gridCol??1))?'#c9a4ff20':'#8b7aa010';
        ctx.fillRect(x-65,y-55,130,110);ctx.strokeStyle='#e0baff66';ctx.lineWidth=2;ctx.strokeRect(x-65,y-55,130,110);
      }
      canvasText(ctx,'СЕТКА 3 × 3 · ← → СМЕНА КОЛОНКИ · ↑ ↓ СМЕНА РЯДА',480,145,14,'#e3c7fa');
    }
    const beat=(g.beatTimer/(g.hard?.61:.83));
    circle(ctx,478,77,22,'#5d4087');
    circle(ctx,478,77,17*(1-beat),'#daa9ef');
    canvasText(ctx,'ЛАБИРИНТ ФИГУР · СМЕНИ ДОРОЖКУ',480,115,18,'#e3c7fa');
  },
  drawExtra(rt,ctx){
    const g=rt.g;
    for(const t of g.targets)if(t.id!=='boss'&&t.hp>0){
      ctx.save();ctx.translate(t.x,t.y);ctx.rotate(Math.PI/4+g.t);
      ctx.fillStyle='#bd8ad566';ctx.fillRect(-18,-18,36,36);
      ctx.strokeStyle='#e6b5f6';ctx.lineWidth=3;ctx.strokeRect(-18,-18,36,36);
      ctx.restore();
      ctx.fillStyle='#281a34';ctx.fillRect(t.x-28,t.y+33,56,5);
      ctx.fillStyle='#d59df5';ctx.fillRect(t.x-28,t.y+33,56*t.hp/t.maxHp,5);
    }
  },
  drawBoss(rt,ctx){
    const g=rt.g;if(g.phase===1)return;
    const count=g.phase===2?4:8,r=g.phase===2?57:78;
    ctx.save();ctx.translate(g.bossX,g.bossY);ctx.rotate(g.t*(g.phase===3?1.8:.5));
    for(let i=0;i<count;i++){
      const a=i*Math.PI*2/count;
      const x=Math.cos(a)*r,y=Math.sin(a)*r;
      ctx.save();ctx.translate(x,y);ctx.rotate(a+g.t);
      ctx.fillStyle=g.phase===3?'#dab0ef9d':'#b68bf566';
      ctx.fillRect(-10,-10,20,20);ctx.restore();
      line(ctx,x*.4,y*.4,x,y,'#d8bafa6a',2);
    }
    circle(ctx,0,0,g.phase===3?67:42,'#d1acfb55',true,3);
    ctx.restore();
  }
});
