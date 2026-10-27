'use strict';

// Onsoku RT: horizontal pursuit platform-runner. Jump, duck and keep pace;
// attacks lose power when the runner is too far behind Sonic.
RTVariants.register('sonic',{
  phase(rt,n){
    const g=rt.g;
    g.formName=['','НЕУЛОВИМЫЙ БЕГУН','АРМИЯ СКОРОСТИ','ЗАПРЕДЕЛЬНЫЙ ОНСОКУ'][n];
    g.patternCount=0;g.patternTimer=n===1?1.45:g.hard?1.1:1.7;
    if(n===3)g.chase=Math.max(g.chase,42);
  },
  move(rt,dt,mx){
    const g=rt.g;
    if(g.grounded&&(Input.tap(0,'up')||Input.pressed.has('touch:up'))){
      g.jumpVy=g.hard?-725:-690;g.grounded=false;AudioSys.sfx('jump');
    }
    g.crouch=g.grounded&&(Input.has(0,'down')||Input.touchHeld.has('down'));
    if(g.dashTime<=0)g.x+=mx*(g.crouch?145:g.hard?295:280)*dt;
    g.x=clamp(g.x,110,702);
    if(!g.grounded){
      g.jumpVy+=1640*dt;
      g.y+=g.jumpVy*dt;
      if(g.y>=462){g.y=462;g.jumpVy=0;g.grounded=true;}
    }else g.y=462;
    const runFactor=mx>0?g.hard?11:10:mx<0?-9:g.hard?-5.5:2.4;
    g.chase=clamp(g.chase+runFactor*dt,0,100);
    if(g.dashTime>0)g.chase=clamp(g.chase+19*dt,0,100);
    g.progress+=(305+g.chase*2+(g.phase-1)*85)*dt;
    g.bossX=clamp(845-g.chase*.76+Math.sin(g.t*(g.phase===3?2.9:1.1))*
      (g.phase===1?0:g.phase===2?21:42),730,880);
    g.bossY=465+Math.sin(g.t*(g.phase===3?16:9))*(g.phase===1?3:13);
  },
  pattern(rt){
    const g=rt.g,seq=g.phase===1?['shuriken','spikes','shuriken','wave']:
      g.phase===2?['echo','wave','razor','shadow','spikes','dashcut']:
      ['mirage','dashcut','razor','echo','spikes','wave','mirage'];
    const type=seq[g.patternCount%seq.length];
    // A jump needs time to land before a contradictory duck instruction.
    // The two-beat attacks are fast, but new sequences don't cut them short.
    g.patternTimer=g.hard?(g.phase===1?1.45:g.phase===2?1.8:1.72):
      1.95-(g.phase-1)*.15;
    const names={shuriken:'СЮРИКЕН · ПРИГНИСЬ',spikes:'СТАЛЬНЫЕ ШИПЫ · ПРЫЖОК',
      wave:'ВЕТРЯНОЙ РАЗРЕЗ · ПРЫЖОК',shadow:'ТЕНЬ СКОРОСТИ · ПРЫЖОК',
      echo:'ДВОЙНИКИ НА ДОРОГЕ · ПРЫЖОК',razor:'РЕЖУЩИЕ СЮРИКЕНЫ · ПРИГНИСЬ',
      dashcut:'МГНОВЕННЫЙ РАЗРЕЗ · ПРЫЖОК',mirage:'ОБМАННАЯ ТЕНЬ · ПРИГНИСЬ'};
    rt.announce(names[type]);
    const duck=['shuriken','razor','mirage'].includes(type);
    const delay=g.hard?.62:.82;
    rt.warn(type,{x:932,y:duck?435:462,r:duck?11:20},delay);
    if(type==='mirage')rt.warn('spikes',{x:932,y:462,r:20},delay+1.14);
    // Staggered feints demand two DIFFERENT reactions on Lunatic. The second
    // warning comes a full beat later, not in the middle of the same jump.
    if(g.hard&&type!=='mirage'){
      const reply=duck?'wave':'razor';
      rt.warn(reply,{x:932,y:duck?462:435,r:duck?20:11},delay+.92);
    }
  },
  trigger(rt,w){
    const g=rt.g,speed=(g.hard?630:430)+(g.phase-1)*(g.hard?40:30);
    if(['shuriken','razor','mirage'].includes(w.type)){
      const count=w.type==='razor'?(g.hard?5:3):w.type==='mirage'?2:g.hard?3:2;
      for(let i=0;i<count;i++)rt.bullet(955+i*(w.type==='razor'?95:115),435,
        -speed,0,7,11,'#a9e8ed',{shape:'shuriken'});
    }else if(w.type==='spikes'){
      for(let i=0;i<(g.hard?3:2);i++){
        g.objects.push({kind:'moving',x:965+i*84,y:466,vx:-speed*.92,vy:0,
          r:18,damage:9,life:4,shape:'spikes'});
      }
    }else if(w.type==='wave'){
      rt.bullet(955,462,-speed*1.12,0,10,18,'#a9bde5',{shape:'wave'});
    }else if(w.type==='dashcut'){
      for(let i=0;i<(g.hard?3:2);i++)rt.bullet(975+i*130,463,
        -speed*1.12,0,10,16,'#ffd1c8',{shape:'wave'});
    }else{
      const count=w.type==='echo'?(g.hard?3:2):1;
      for(let i=0;i<count;i++)g.objects.push({kind:'moving',x:966+i*145,
        y:460,vx:-speed*(w.type==='echo'?1.07:1.36),vy:0,
        r:w.type==='echo'?21:25,damage:12,life:3,shape:'shadow'});
    }
  },
  status(rt){
    const g=rt.g;
    return `ПОГОНЯ ${Math.round(g.chase)}% · ПУТЬ ${Math.round(g.progress)} м`;
  },
  drawBg(rt,ctx){
    const g=rt.g,gradient=ctx.createLinearGradient(0,0,0,600);
    gradient.addColorStop(0,g.phase===3?'#0d2e39':'#191d34');
    gradient.addColorStop(1,g.phase===2?'#493158':'#543b3c');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,960,600);
    const shift=g.progress*(g.phase===3?.57:.37);
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
    if(g.phase>=2)for(let i=0;i<(g.phase===3?15:8);i++){
      const yy=165+i*24;
      line(ctx,0,yy,960,yy-7,'#abdfee'+(g.phase===3?'30':'16'),g.phase===3?2:1);
    }
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
  },
  drawBoss(rt,ctx){
    const g=rt.g;if(g.phase===1)return;
    ctx.save();ctx.globalAlpha=g.phase===3?.48:.3;
    for(let i=1;i<=(g.phase===3?5:3);i++){
      const x=g.bossX+i*22+Math.sin(g.t*(4+i))*9;
      circle(ctx,x,g.bossY,16-i,'#9ddae5');
      line(ctx,x,g.bossY-23,x+34,g.bossY-23,'#b2e7ed',3);
    }
    ctx.restore();
    if(g.phase===3)circle(ctx,g.bossX,g.bossY,64+Math.sin(g.t*11)*6,
      '#a3f4ee77',true,3);
  }
});
