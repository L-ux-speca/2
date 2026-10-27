'use strict';

// Onsoku RT: horizontal pursuit platform-runner. Jump, duck and keep pace;
// attacks lose power when the runner is too far behind Sonic.
RTVariants.register('sonic',{
  move(rt,dt,mx){
    const g=rt.g;
    if(g.grounded&&(Input.tap(0,'up')||Input.pressed.has('touch:up'))){
      g.jumpVy=-690;g.grounded=false;AudioSys.sfx('jump');
    }
    g.crouch=g.grounded&&(Input.has(0,'down')||Input.touchHeld.has('down'));
    if(g.dashTime<=0)g.x+=mx*(g.crouch?145:280)*dt;
    g.x=clamp(g.x,110,702);
    if(!g.grounded){
      g.jumpVy+=1640*dt;
      g.y+=g.jumpVy*dt;
      if(g.y>=462){g.y=462;g.jumpVy=0;g.grounded=true;}
    }else g.y=462;
    const runFactor=mx>0?10:mx<0?-7:2.4;
    g.chase=clamp(g.chase+runFactor*dt,0,100);
    if(g.dashTime>0)g.chase=clamp(g.chase+19*dt,0,100);
    g.progress+=(305+g.chase*2)*dt;
    g.bossX=clamp(845-g.chase*.76,758,853);
    g.bossY=465+Math.sin(g.t*9)*3;
  },
  pattern(rt){
    const g=rt.g,seq=g.phase===1?['shuriken','spikes','shuriken','wave']:
      g.phase===2?['wave','shadow','spikes','shuriken']:
      ['shadow','spikes','wave','shuriken','shadow'];
    const type=seq[g.patternCount%seq.length];
    g.patternTimer=g.hard?1.35:1.95;
    const names={shuriken:'СЮРИКЕН · ПРИГНИСЬ',spikes:'СТАЛЬНЫЕ ШИПЫ · ПРЫЖОК',
      wave:'ВЕТРЯНОЙ РАЗРЕЗ · ПРЫЖОК',shadow:'ТЕНЬ СКОРОСТИ · ПРЫЖОК'};
    rt.announce(names[type]);
    rt.warn(type,{x:932,y:type==='shuriken'?435:462,r:type==='shuriken'?11:20},
      g.hard?.46:.68);
  },
  trigger(rt,w){
    const g=rt.g,speed=g.hard?565:415;
    if(w.type==='shuriken'){
      for(let i=0;i<(g.hard?3:2);i++)rt.bullet(955+i*85,435,-speed,0,6,11,'#a9e8ed',{shape:'shuriken'});
    }else if(w.type==='spikes'){
      for(let i=0;i<(g.hard?3:2);i++){
        g.objects.push({kind:'moving',x:965+i*64,y:466,vx:-speed*.9,vy:0,
          r:18,damage:9,life:4,shape:'spikes'});
      }
    }else if(w.type==='wave'){
      rt.bullet(955,462,-speed*1.12,0,10,18,'#a9bde5',{shape:'wave'});
    }else{
      g.objects.push({kind:'moving',x:966,y:460,vx:-speed*1.4,vy:0,
        r:25,damage:12,life:3,shape:'shadow'});
    }
  },
  status(rt){
    const g=rt.g;
    return `ПОГОНЯ ${Math.round(g.chase)}% · ПУТЬ ${Math.round(g.progress)} м`;
  },
  drawBg(rt,ctx){
    const g=rt.g,gradient=ctx.createLinearGradient(0,0,0,600);
    gradient.addColorStop(0,'#191d34');gradient.addColorStop(1,'#543b3c');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,960,600);
    const shift=g.progress*.37;
    for(let layer=0;layer<3;layer++){
      const step=220-layer*40;
      for(let i=-2;i<10;i++){
        const x=((i*step-shift*(layer+1)*.4)%(step*10)+step*10)%(step*10)-step;
        const h=90+(i*41+layer*53)%115;
        ctx.fillStyle=['#252b43','#34374e','#4a3e4d'][layer];
        ctx.fillRect(x,440-h,step-14,h);
        for(let j=0;j<4;j++){
          ctx.fillStyle='#d6b5a822';ctx.fillRect(x+18+j*27,450-h+15,9,15);
        }
      }
    }
    ctx.fillStyle='#1b202d';ctx.fillRect(0,508,960,92);
    line(ctx,0,508,960,508,'#e9b5a5',4);
    const dashOffset=g.progress*3%100;
    for(let x=-100;x<1080;x+=100)ctx.fillStyle='#deb6a3',ctx.fillRect(x-dashOffset,554,54,4);
    canvasText(ctx,'ПОГОНЯ ОНСОКУ · СЛЕДИ ЗА СКОРОСТЬЮ',480,95,19,'#ffd6bd');
  },
  drawExtra(rt,ctx){
    const g=rt.g;
    for(const o of g.objects)if(o.kind==='moving'){
      if(o.shape==='spikes'){
        ctx.save();ctx.fillStyle='#d4a1ad';ctx.beginPath();
        ctx.moveTo(o.x-21,496);ctx.lineTo(o.x,440);ctx.lineTo(o.x+21,496);ctx.fill();
        ctx.restore();
      }else if(o.shape==='shadow'){
        ctx.save();ctx.globalAlpha=.55;
        circle(ctx,o.x,o.y,26,'#e8a59d');
        line(ctx,o.x-48,o.y,o.x-16,o.y,'#f1c3bd',8);
        ctx.restore();
      }
    }
    ctx.fillStyle='#172632';ctx.fillRect(280,117,400,8);
    ctx.fillStyle=g.chase>=56?'#b4edda':'#e0ab8d';
    ctx.fillRect(280,117,g.chase*4,8);
    canvasText(ctx,'ДИСТАНЦИЯ ДО ОНСОКУ',480,145,13,'#ead5ce');
  }
});
