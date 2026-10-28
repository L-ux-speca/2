'use strict';

// Onsoku RT: horizontal pursuit platform-runner. Jump, duck and keep pace;
// attacks lose power when the runner is too far behind Sonic.
RTVariants.register('sonic',{
  phase(rt,n){
    const g=rt.g;
    g.formName=['','НЕУЛОВИМЫЙ БЕГУН','АРМИЯ СКОРОСТИ','ЗАПРЕДЕЛЬНЫЙ ОНСОКУ'][n];
    g.patternCount=0;g.patternTimer=n===1?1.45:g.hard?1.1:1.7;
    if(n===3){g.chase=Math.max(g.chase,42);g.platforms=[{x:92,w:190,y:408,id:1},{x:350,w:190,y:318,id:2},{x:620,w:220,y:228,id:3}];g.platformGround=null;g.bossMoveDir=-1;g.bossSlashTimer=0;g.bossLane=0;}
  },
  move(rt,dt,mx){
    const g=rt.g;
    if(g.grounded&&(Input.tap(0,'up')||Input.pressed.has('touch:up'))){
      g.jumpVy=g.hard?-725:-690;g.grounded=false;g.platformGround=null;AudioSys.sfx('jump');
    }
    g.crouch=g.grounded&&(Input.has(0,'down')||Input.touchHeld.has('down'));
    if(g.dashTime<=0)g.x+=mx*(g.crouch?145:g.hard?295:280)*dt;
    g.x=clamp(g.x,110,g.phase===3?860:702);
    if(g.grounded&&g.platformGround!==null&&g.platforms){
      const p=g.platforms.find(p=>p.id===g.platformGround);
      if(p&&g.x>=p.x-8&&g.x<=p.x+p.w+8)g.y=p.y-46;
      else{g.grounded=false;g.platformGround=null;}
    }else if(g.grounded)g.y=462;
    if(!g.grounded){
      const prevY=g.y;g.jumpVy+=1640*dt;g.y+=g.jumpVy*dt;
      if(g.phase===3&&g.jumpVy>0&&g.platforms){
        for(const p of g.platforms){const landingY=p.y-46;
          if(g.x>=p.x-12&&g.x<=p.x+p.w+12&&prevY<=landingY&&g.y>=landingY){g.y=landingY;g.jumpVy=0;g.grounded=true;g.platformGround=p.id;break;}
        }
      }
      if(!g.grounded&&g.y>=462){g.y=462;g.jumpVy=0;g.grounded=true;g.platformGround=null;}
    }
    const runFactor=mx>0?g.hard?11:10:mx<0?-9:g.hard?-5.5:2.4;
    g.chase=clamp(g.chase+runFactor*dt,0,100);
    if(g.dashTime>0)g.chase=clamp(g.chase+19*dt,0,100);
    g.progress+=(305+g.chase*2+(g.phase-1)*85)*dt;
    if(g.phase===3){
      g.bossX=(g.bossX||835)+(g.bossMoveDir||-1)*(g.hard?245:205)*dt;
      if(g.bossX<710){g.bossX=710;g.bossMoveDir=1;}if(g.bossX>900){g.bossX=900;g.bossMoveDir=-1;}
      const bossLevels=[462,362,272,182];
      const lane=Math.floor(g.t/1.85)%bossLevels.length;g.bossLane=lane;
      const targetY=bossLevels[lane];
      g.bossY+=(targetY-g.bossY)*Math.min(1,dt*3.4);
      g.bossY+=Math.sin(g.t*10)*4;
    }else{
      g.bossX=clamp(845-g.chase*.76+Math.sin(g.t*1.1)*(g.phase===1?0:21),730,880);
      g.bossY=465+Math.sin(g.t*9)*(g.phase===1?3:13);
    }
  },
  pattern(rt){
    const g=rt.g,seq=g.phase===1?['shuriken','spikes','shuriken','wave']:
      g.phase===2?['echo','wave','razor','shadow','spikes','dashcut']:
      ['katana','katanaCombo','mirage','platformCut','katanaHigh','dashcut','katanaMid','spikes','katanaLow','echo','katanaGround','razor'];
    const type=seq[g.patternCount%seq.length];
    // A jump needs time to land before a contradictory duck instruction.
    // The two-beat attacks are fast, but new sequences don't cut them short.
    g.patternTimer=g.hard?(g.phase===1?1.45:g.phase===2?1.8:1.72):
      1.95-(g.phase-1)*.15;
    const names={shuriken:'СЮРИКЕН · ПРИГНИСЬ',spikes:'СТАЛЬНЫЕ ШИПЫ · ПРЫЖОК',
      wave:'ВЕТРЯНОЙ РАЗРЕЗ · ПРЫЖОК',shadow:'ТЕНЬ СКОРОСТИ · ПРЫЖОК',
      echo:'ДВОЙНИКИ НА ДОРОГЕ · ПРЫЖОК',razor:'РЕЖУЩИЕ СЮРИКЕНЫ · ПРИГНИСЬ',
      dashcut:'МГНОВЕННЫЙ РАЗРЕЗ · ПРЫЖОК',mirage:'ОБМАННАЯ ТЕНЬ · ПРИГНИСЬ',
      katana:'ПРЯМОЙ УДАР КАТАНОЙ · ПРЫЖОК',katanaCombo:'ДВОЙНОЙ РАЗРЕЗ · ПРЫЖОК, ЗАТЕМ ПРИСЕД',
      platformCut:'СРЕЗ ПЛАТФОРМЫ · СМЕНИ ВЫСОТУ',
      katanaHigh:'КАТАНА · ВЕРХНЯЯ ПЛАТФОРМА',katanaMid:'КАТАНА · СРЕДНЯЯ ПЛАТФОРМА',
      katanaLow:'КАТАНА · НИЖНЯЯ ПЛАТФОРМА',katanaGround:'КАТАНА · УРОВЕНЬ ЗЕМЛИ'};
    rt.announce(names[type]);
    const duck=['shuriken','razor','mirage'].includes(type);
    const delay=g.hard?.62:.82;
    const laneYs=[462,362,272,182];
    let attackY=duck?435:462;
    if(type==='katana')attackY=laneYs[clamp(g.platformGround===null?0:(g.platformGround||0),0,3)];
    if(type==='katanaHigh')attackY=182;
    if(type==='katanaMid')attackY=272;
    if(type==='katanaLow')attackY=362;
    if(type==='katanaGround')attackY=462;
    if(type==='platformCut')attackY=laneYs[(g.patternCount%3)+1];
    rt.warn(type,{x:g.bossX,y:attackY,r:duck?11:20},delay);
    if(type==='mirage')rt.warn('spikes',{x:932,y:462,r:20},delay+1.14);
    if(type==='katanaCombo')rt.warn('katanaHigh',{x:g.bossX,y:182,r:11},delay+.88);
    if(type==='platformCut')rt.warn('katanaLow',{x:g.bossX,y:362,r:11},delay+.9);
    // Staggered feints demand two DIFFERENT reactions on Lunatic. The second
    // warning comes a full beat later, not in the middle of the same jump.
    if(g.hard&&type!=='mirage'&&type!=='katanaCombo'&&type!=='platformCut'){
      const reply=duck?'wave':'razor';
      rt.warn(reply,{x:932,y:duck?462:435,r:duck?20:11},delay+.92);
    }
  },
  trigger(rt,w){
    const g=rt.g,speed=(g.hard?630:430)+(g.phase-1)*(g.hard?40:30);
    if(['katana','katanaHigh','katanaMid','katanaLow','katanaGround','katanaCombo','platformCut'].includes(w.type)){
      const bladeY=w.y||462;
      g.objects.push({kind:'moving',shape:'katana',x:(g.bossX||850)-24,y:bladeY,
        vx:-(g.hard?900:700),vy:0,r:w.type==='katanaHigh'?8:12,damage:g.hard?18:13,life:1.65});
    }else if(['shuriken','razor','mirage'].includes(w.type)){
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
    if(g.phase===3&&g.platforms){
      for(const p of g.platforms){ctx.fillStyle='#172a36';ctx.fillRect(p.x,p.y,p.w,12);
        ctx.fillStyle='#a6e4e8';ctx.fillRect(p.x,p.y,p.w,3);
        ctx.fillStyle='#8ad8e51c';ctx.fillRect(p.x+5,p.y+12,p.w-10,13);
        for(let x=p.x+12;x<p.x+p.w;x+=28)line(ctx,x,p.y+4,x-5,p.y+11,'#9ddce544',1);
        canvasText(ctx,'УРОВЕНЬ '+p.id,p.x+p.w/2,p.y-9,10,'#bdebf0');}
      canvasText(ctx,'ПРЫГАЙ МЕЖДУ ВЫСОТАМИ · ▲',480,176,12,'#bdebf0');
    }
    if(g.phase>=2)for(let i=0;i<(g.phase===3?15:8);i++){
      const yy=165+i*24;
      line(ctx,0,yy,960,yy-7,'#abdfee'+(g.phase===3?'30':'16'),g.phase===3?2:1);
    }
    canvasText(ctx,'ПОГОНЯ ОНСОКУ · СЛЕДИ ЗА СКОРОСТЬЮ',480,95,19,'#ffd6bd');
  },
  drawExtra(rt,ctx){
    const g=rt.g;
    for(const o of g.objects)if(o.kind==='moving'){
      if(o.shape==='katana'){
        ctx.save();ctx.translate(o.x,o.y);ctx.rotate(-.08);
        ctx.shadowColor='#b9f4ff';ctx.shadowBlur=12;
        ctx.strokeStyle='#e7fbff';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-30,0);ctx.lineTo(30,0);ctx.stroke();
        ctx.strokeStyle='#76d8ee';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-30,-4);ctx.lineTo(30,-4);ctx.stroke();
        ctx.strokeStyle='#d5a77c';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-18,4);ctx.lineTo(-5,4);ctx.stroke();ctx.restore();
      }else if(o.shape==='spikes'){ 
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
    if(g.phase===3){
      circle(ctx,g.bossX,g.bossY,64+Math.sin(g.t*11)*6,'#a3f4ee77',true,3);
      // Katana silhouette tracks the moving boss, making direct attacks readable.
      ctx.save();ctx.translate(g.bossX-24,g.bossY+2);ctx.rotate(-.22);
      line(ctx,-24,0,34,0,'#e5fbff',5);line(ctx,-24,-4,34,-4,'#8be4f0',2);line(ctx,-18,5,-6,5,'#d9ad81',4);ctx.restore();
    }
  }
});
