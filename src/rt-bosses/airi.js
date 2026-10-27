'use strict';

// Airi RT: three-lane rhythm/action game with cubes, horizontal spikes and
// destructible decoys. Inputs W/S select one of three lanes (not free-flight).
const AIRI_LANES=[202,355,508];
RTVariants.register('airi',{
  move(rt,dt,mx){
    const g=rt.g;
    if(Input.tap(0,'up')||Input.pressed.has('touch:up'))g.lane=Math.max(0,g.lane-1);
    if(Input.tap(0,'down')||Input.pressed.has('touch:down'))g.lane=Math.min(2,g.lane+1);
    if(g.dashTime<=0)g.x+=mx*(g.slow>0?170:230)*dt;
    g.x=clamp(g.x,108,454);g.y=AIRI_LANES[g.lane];
    g.bossX=829;g.bossY=AIRI_LANES[1]+Math.sin(g.t*.8)*35;
    g.beatTimer+=dt;
    const interval=g.hard?.61:.83;
    if(g.beatTimer>=interval){g.beatTimer-=interval;g.beat++;}
    for(const decoy of g.targets)if(decoy.id!=='boss'&&decoy.hp>0){
      decoy.life-=dt;
      decoy.x=759+Math.sin(g.t*2+decoy.phase)*34;
      if(decoy.life<=0)decoy.hp=0;
      decoy.timer-=dt;
      if(decoy.timer<=0){
        decoy.timer=.8;
        rt.bullet(decoy.x,decoy.y,-220,0,5,10,'#daaff3');
      }
    }
    g.targets=g.targets.filter(t=>t.id==='boss'||t.hp>0);
  },
  pattern(rt){
    const g=rt.g,seq=g.phase===1?['cubes','spikes','cubes','mirror']:
      g.phase===2?['spikes','clone','cubes','mirror','spikes']:
      ['clone','mirror','spikes','cubes','spikes'];
    const type=seq[g.patternCount%seq.length];
    const delay=g.hard?.52:.78;
    // Patterns start on every second beat, so the warning rhythm is learnable.
    g.patternTimer=(g.hard?.61:.83)*2;
    if(type==='clone'){
      rt.announce('ЗЕРКАЛЬНАЯ КОПИЯ · РАЗРУШЬ КЛОНА');
      rt.warn('clone',{lane:(g.patternCount+1)%3},delay);
    }else{
      const safe=(g.patternCount+1+(g.phase===3?1:0))%3;
      rt.announce(type==='cubes'?'КУБИЧЕСКИЙ РИТМ':
        type==='spikes'?'ГОРИЗОНТАЛЬНЫЕ ШИПЫ':'ЗЕРКАЛЬНЫЕ СТЕНЫ');
      rt.warn(type,{safe},delay);
    }
  },
  trigger(rt,w){
    const g=rt.g;
    if(w.type==='clone'){
      g.targets=g.targets.filter(t=>t.id==='boss'||t.hp>0);
      if(g.targets.filter(t=>t.id!=='boss').length>=2)return;
      g.targets.push({id:'clone'+g.patternCount,name:'Клон Айри',
        hp:g.hard?48:34,maxHp:g.hard?48:34,
        x:756,y:AIRI_LANES[w.lane],r:25,life:5.4,timer:.9,phase:g.patternCount});
      return;
    }
    const lanes=w.type==='mirror'?[0,1,2].filter(i=>i!==w.safe):
      [0,1,2].filter(i=>i!==w.safe);
    const repetitions=w.type==='spikes'?(g.hard?2:1):w.type==='mirror'?2:1;
    for(let i=0;i<repetitions;i++)for(const lane of lanes){
      const speed=(w.type==='spikes'?425:345)*(g.hard?1.16:1);
      const shape=w.type==='spikes'?'spike':'cube';
      rt.bullet(970+i*110,AIRI_LANES[lane],-speed,0,
        w.type==='spikes'?10:7,w.type==='spikes'?15:21,
        w.type==='spikes'?'#f1b2bc':'#c4aff6',{shape});
    }
  },
  status(rt){const g=rt.g;
    return `ДОРОЖКА ${g.lane+1}/3 · ТАКТ ${g.beat} · УКЛОНЕНИЯ ${g.grazeCount}`;
  },
  drawBg(rt,ctx){
    const g=rt.g,gradient=ctx.createLinearGradient(0,0,960,600);
    gradient.addColorStop(0,'#221a33');gradient.addColorStop(1,'#13172a');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,960,600);
    for(let i=0;i<3;i++){
      const y=AIRI_LANES[i];ctx.fillStyle=i===g.lane?'#8559c522':'#55417910';
      ctx.fillRect(36,y-57,888,114);
      line(ctx,36,y-57,924,y-57,'#a989dc32',2);
      line(ctx,36,y+57,924,y+57,'#a989dc32',2);
      for(let x=38;x<930;x+=60)line(ctx,x,y-56,x,y+56,'#ac9cce12');
      canvasText(ctx,String(i+1),65,y+8,25,i===g.lane?'#e7ceff':'#715d95');
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
  }
});
