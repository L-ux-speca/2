'use strict';
// Lapis RT: the boss changes attack language as the player enters his magnetic field.
RTVariants.register('lapis',{
 phase(rt,n){const g=rt.g;g.formName=['','ДАЛЬНЯЯ ДИСТАНЦИЯ','ЭЛЕКТРОМАГНИТНЫЙ КОНТУР','БЛИЖНИЙ КОНТАКТ'][n];g.patternCount=0;g.patternTimer=n===1?1.45:n===2?1.25:1.02;rt.announce(['','РЕЛЬСОТРОН · РАДИОВОЛНЫ · ЛОВУШКИ','ЛОКАЛЬНЫЕ ПОЛЯ · КУБИЧЕСКИЕ ФОРМЫ','ОРБИТЫ · ПРИТЯЖЕНИЕ · БЛИЖНИЙ БОЙ'][n],2.1)},
 move(rt,dt,mx,my){const g=rt.g;g.x+=mx*(g.phase===3?300:250)*dt;g.y+=my*(g.phase===3?300:250)*dt;g.x=clamp(g.x,55,900);g.y=clamp(g.y,105,560);
  // Lapis repositions to keep the fight readable; the player crossing distance thresholds advances the encounter.
  const d=hypot(g.x-g.bossX,g.y-g.bossY);if(g.phase===1&&d<405)rt.phase(2);else if(g.phase===2&&d<180)rt.phase(3);
  if(g.phase===1){g.bossX=820+Math.sin(g.t*.55)*30;g.bossY=310+Math.cos(g.t*.8)*120}else if(g.phase===2){g.bossX=690+Math.sin(g.t*1.2)*90;g.bossY=320+Math.cos(g.t*1.1)*120}else{g.bossX=clamp(g.x+(g.x<480?105:-105),100,860);g.bossY=clamp(g.y+Math.sin(g.t*3)*75,120,530)}
 },
 pattern(rt){const g=rt.g;const seq=g.phase===1?['rail','radio','bomb','trap']:g.phase===2?['pocket','rail','cubes','pocket','dash']:['orbit','attract','invert','bladeDash','spikes'];const type=seq[g.patternCount%seq.length];g.patternTimer=g.hard?Math.max(.78,1.28-(g.phase-1)*.16):Math.max(1.02,1.75-(g.phase-1)*.2);const delay=g.hard?.5:.8;rt.announce(({rail:'РЕЛЬСОТРОН · ЛИНИЯ ОГНЯ',radio:'РАДИОВОЛНОВОЙ ИМПУЛЬС',bomb:'ЗАРАНЕЕ УСТАНОВЛЕННАЯ БОМБА',trap:'МЕТАЛЛИЧЕСКАЯ ЛОВУШКА',pocket:'КАРМАНЫ ПОЛЯ · ТРАЕКТОРИЯ МЕНЯЕТСЯ',cubes:'КУБИЧЕСКИЙ ЩИТ',dash:'РЕЗКИЙ ДЭШ',orbit:'ОРБИТЫ',attract:'ПРИТЯЖЕНИЕ ВСЕХ ОБЪЕКТОВ',invert:'ИНВЕРСИЯ ПОЛЯ',bladeDash:'БЛИЖНИЙ ДЭШ',spikes:'КУБИКИ-ШИПЫ'})[type]);rt.warn(type,{x:g.bossX,y:g.bossY},delay)},
 trigger(rt,w){const g=rt.g,a=Math.atan2(g.y-g.bossY,g.x-g.bossX);if(w.type==='rail'||w.type==='bladeDash'){rt.bullet(g.bossX,g.bossY,Math.cos(a)*(w.type==='rail'?800:620),Math.sin(a)*(w.type==='rail'?800:620),w.type==='rail'?16:13,w.type==='rail'?7:15,w.type==='rail'?'#8de9ff':'#f4d5ff',{life:2});if(w.type==='bladeDash')g.objects.push({kind:'moving',x:g.bossX,y:g.bossY,vx:Math.cos(a)*500,vy:Math.sin(a)*500,r:25,damage:12,life:.6});return}
  if(w.type==='radio'){for(let i=0;i<3;i++)rt.bullet(g.bossX,g.bossY,Math.cos(a+i*.13-.13)*360,Math.sin(a+i*.13-.13)*360,8,17,'#a6cfff',{life:3});return}
  if(w.type==='bomb'||w.type==='trap'){g.objects.push({kind:'field',x:clamp(g.x+(w.type==='bomb'?0:100),70,890),y:clamp(g.y+(w.type==='bomb'?0:-80),120,540),r:w.type==='bomb'?70:48,life:2.4,damage:10});return}
  if(w.type==='pocket'){for(let i=0;i<4;i++){const aa=a+i*Math.PI/2;rt.bullet(g.bossX+Math.cos(aa)*55,g.bossY+Math.sin(aa)*55,-Math.sin(aa)*230,Math.cos(aa)*230,10,13,'#9edfff',{life:3})}return}
  if(w.type==='cubes'||w.type==='spikes'){for(let i=0;i<6;i++){const aa=i*Math.PI/3;rt.bullet(g.bossX+Math.cos(aa)*50,g.bossY+Math.sin(aa)*50,Math.cos(aa)*250,Math.sin(aa)*250,10,w.type==='spikes'?17:13,'#c6b5f6',{shape:w.type==='spikes'?'spike':'cube',life:2.5})}return}
  if(w.type==='dash'){g.objects.push({kind:'moving',x:g.bossX,y:g.bossY,vx:Math.cos(a)*460,vy:Math.sin(a)*460,r:26,damage:13,life:1});return}
  // Orbits, attraction and inversion use persistent magnetic projectiles.
  for(let i=0;i<8;i++){const aa=i*Math.PI/4;const vx=Math.cos(aa)*230,vy=Math.sin(aa)*230;rt.bullet(g.bossX+Math.cos(aa)*70,g.bossY+Math.sin(aa)*70,w.type==='attract'?-vx:w.type==='invert'?-vx: vx,w.type==='attract'?-vy:w.type==='invert'?-vy:vy,10,13,'#a4eaff',{life:3,magnetic:true})}
 },
 status(rt){const g=rt.g;return `ДИСТАНЦИЯ ${Math.round(hypot(g.x-g.bossX,g.y-g.bossY))} · ФАЗА ${g.phase}/3 · УКЛОНЕНИЯ ${g.grazeCount}`},
 drawBg(rt,ctx){const g=rt.g,gr=ctx.createRadialGradient(480,300,30,480,300,600);gr.addColorStop(0,g.phase===3?'#39234e':'#172d45');gr.addColorStop(1,'#080e1b');ctx.fillStyle=gr;ctx.fillRect(0,0,960,600);for(let x=60;x<960;x+=90)for(let y=100;y<600;y+=90){ctx.strokeStyle='#74cde51a';ctx.strokeRect(x,y,55,55)}if(g.phase>=2){for(let i=0;i<4;i++){const x=250+i*150,y=185+(i%2)*230;circle(ctx,x,y,40,'#6bc9ff24',true,2);circle(ctx,x,y,5,'#a4edff')}}},
 drawBoss(rt,ctx){const g=rt.g;ctx.save();ctx.translate(g.bossX,g.bossY);ctx.rotate(g.t*(g.phase===3?2:.5));const n=g.phase===1?4:g.phase===2?6:8;for(let i=0;i<n;i++){const a=i*Math.PI*2/n,x=Math.cos(a)*(35+g.phase*8),y=Math.sin(a)*(35+g.phase*8);ctx.fillStyle='#8ddfff';ctx.fillRect(x-7,y-7,14,14);line(ctx,0,0,x,y,'#8ddfff88',2)}circle(ctx,0,0,24,'#b4f4ff55',true,3);ctx.restore()}
});
