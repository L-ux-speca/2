'use strict';
// Caesar RT: escape a changing maze while Caesar uses bouncing bubble shots to control routes.
const CAESAR_MAZE=[{x:190,y:110,w:28,h:210},{x:190,y:365,w:28,h:140},{x:350,y:190,w:28,h:260},{x:505,y:110,w:28,h:185},{x:505,y:355,w:28,h:170},{x:665,y:190,w:28,h:250},{x:790,y:105,w:28,h:170}];
RTVariants.register('caesar',{
 phase(rt,n){const g=rt.g;g.formName=['','ПУЗЫРЬКОВЫЙ ЛАБИРИНТ','СМЕНА МАРШРУТА','ПОСЛЕДНИЙ КОРИДОР'][n];g.patternCount=0;g.patternTimer=n===1?1.5:1.22;if(n===2){g.mazeShift=0;rt.announce('ЛАБИРИНТ МЕНЯЕТСЯ · ИЩИ КРАСНЫЙ ПУЗЫРЬ',2.6)}if(n===3)rt.announce('ВЫХОД РЯДОМ · ПЕРЕКРЁСТНЫЙ ОГОНЬ',2.6)},
 move(rt,dt,mx,my){const g=rt.g,speed=g.slow>0?165:245;let nx=clamp(g.x+mx*speed*dt,40,920),ny=clamp(g.y+my*speed*dt,100,560);
  const walls=CAESAR_MAZE.filter((w,i)=>g.phase===1||((i+(g.mazeShift||0))%3!==1));for(const w of walls){if(nx+13>w.x&&nx-13<w.x+w.w&&ny+13>w.y&&ny-13<w.y+w.h){if(!(g.phase>=2&&g.mazeShift%2===1&&w.x>650)){if(mx)nx=g.x;if(my)ny=g.y;}}}
  g.x=nx;g.y=ny;g.bossX=760+Math.sin(g.t*.8)*35;g.bossY=300+Math.cos(g.t*1.1)*120;
  if(g.phase>=2){g.exitX=885;g.exitY=510;if(g.x>835&&g.y>455){if(g.phase<3)rt.phase(3);else if(g.warnings.length===0){rt.finish(true)}}}
 },
 pattern(rt){const g=rt.g,seq=g.phase===1?['cannon','cutter','barrier','cannon']:g.phase===2?['cannon','maze','cutter','red','barrier']:['cross','cross','cannon'];const type=seq[g.patternCount%seq.length];g.patternTimer=g.phase===3?(g.hard?.95:1.3):(g.hard?1.15:1.7);const delay=g.hard?.55:.85;rt.announce(({cannon:'ПУЗЫРЬКОВАЯ ПУШКА',cutter:'ПУЗЫРЬКОВЫЙ РЕЗАК',barrier:'ПУЗЫРЬКОВЫЙ БАРЬЕР',maze:'СТЕНЫ СДВИГАЮТСЯ',red:'НАЙДИ КРАСНЫЙ ПУЗЫРЬ',cross:'ПЕРЕКРЁСТНЫЙ ОГОНЬ'})[type]);rt.warn(type,{x:g.bossX,y:g.bossY},delay)},
 trigger(rt,w){const g=rt.g;if(w.type==='maze'){g.mazeShift=(g.mazeShift||0)+1;g.mazeWalls=CAESAR_MAZE.filter((_,i)=>((i+g.mazeShift)%3)!==1);return}
  if(w.type==='barrier'){g.objects.push({kind:'field',x:430,y:320,r:120,life:2.2});return}
  if(w.type==='red'){const a=Math.atan2((g.exitY||510)-g.bossY,(g.exitX||885)-g.bossX);rt.bullet(g.bossX,g.bossY,Math.cos(a)*245,Math.sin(a)*245,8,12,'#ff343f',{redExit:true,bounce:true,life:6});return}
  const a=Math.atan2(g.y-g.bossY,g.x-g.bossX);if(w.type==='cutter'){rt.bullet(g.bossX,g.bossY,Math.cos(a)*610,Math.sin(a)*610,13,9,'#e4f8ff',{life:2});return}
  const n=w.type==='cross'?(g.hard?9:7):g.hard?7:5;for(let i=0;i<n;i++){const off=(i-(n-1)/2)*.2;rt.bullet(g.bossX,g.bossY,Math.cos(a+off)*(w.type==='cross'?380:270),Math.sin(a+off)*(w.type==='cross'?380:270),8,12,w.type==='cross'?'#ff9bce':'#91eaff',{bounce:true,life:5})}
 },
 status(rt){const g=rt.g;return g.phase===3?'ВЫХОД: ↘ · ДОБЕРИСЬ ДО КРАСНОЙ ДВЕРИ':`НАЙДИ ВЫХОД · КООРДИНАТЫ ${Math.round(g.x)}, ${Math.round(g.y)}`},
 drawBg(rt,ctx){const g=rt.g;ctx.fillStyle='#101b30';ctx.fillRect(0,0,960,600);for(let x=0;x<960;x+=40)line(ctx,x,70,x,590,'#5c789322');for(let y=70;y<600;y+=40)line(ctx,0,y,960,y,'#5c789322');const walls=g.mazeWalls||CAESAR_MAZE;for(const w of walls){ctx.fillStyle='#344963';ctx.fillRect(w.x,w.y,w.w,w.h);ctx.strokeStyle='#80b9cb';ctx.lineWidth=2;ctx.strokeRect(w.x,w.y,w.w,w.h)}ctx.fillStyle='#e6d7ff';ctx.fillRect(858,476,38,68);ctx.fillStyle='#ff344a';ctx.fillRect(867,485,20,48);canvasText(ctx,'ВЫХОД',877,463,13,'#ff8c9b');if(g.phase>=2){ctx.fillStyle='#ff344a';circle(ctx,830,490,8,'#ff344a')}}
});
