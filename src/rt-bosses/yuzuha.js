'use strict';
// Yuzuha RT: phase one is a side-view rock fight; phase two becomes a top-down ring arena.
RTVariants.register('yuzuha',{
 phase(rt,n){const g=rt.g;g.formName=['','ИЗУМРУДНЫЙ СТРАЖ','ВОРОНКА БЕЗДНЫ','СЕРДЦЕ ШТОРМА'][n];g.patternCount=0;g.patternTimer=n===1?1.65:1.4;if(n===1&&!g.rocks?.length)g.rocks=[{x:230,y:480,taken:false},{x:390,y:455,taken:false},{x:560,y:490,taken:false}];
  if(n===2){g.x=480;g.y=160;g.bossX=480;g.bossY=300;g.ringAngle=0;g.rocks=[];rt.announce('АРЕНА ЗАТОПЛЕНА · ДЕРЖИСЬ ВНЕ ВОРОНКИ',2.8)}
  if(n===3)g.patternTimer=1.12;
 },
 move(rt,dt,mx,my){const g=rt.g;g.dx=mx||g.dx;g.dy=my||g.dy;
  if(g.phase===1){g.x+=mx*(g.slow>0?160:240)*dt;g.y+=my*190*dt;g.x=clamp(g.x,65,700);g.y=clamp(g.y,175,515);g.bossX=815;g.bossY=350;
   if(Input.pressed.has('KeyE')||Input.pressed.has('touch:e')){const rock=g.rocks.find(r=>!r.taken&&hypot(r.x-g.x,r.y-g.y)<48);if(rock){rock.taken=true;g.carryRock=true;rt.announce('БУЛЫЖНИК ПОДНЯТ · ПРИЁМЫ НЕДОСТУПНЫ',1.2)}else if(g.carryRock){const a=Math.atan2(g.bossY-g.y,g.bossX-g.x);g.objects.push({kind:'moving',shape:'rock',x:g.x,y:g.y,vx:Math.cos(a)*580,vy:Math.sin(a)*580,r:14,damage:34,life:1.5});g.carryRock=false;}}
  }else{g.ringAngle=(g.ringAngle||0)+dt*.25;const d=hypot(g.x-480,g.y-300),pull=g.hard?52:38;if(d>55){g.x+=(480-g.x)/d*pull*dt;g.y+=(300-g.y)/d*pull*dt;}g.x+=mx*255*dt;g.y+=my*255*dt;g.x=clamp(g.x,70,890);g.y=clamp(g.y,100,550);g.bossX=480;g.bossY=300;
   if(d<75)rt.hitHero(5*dt,{slow:true});
  }
 },
 pattern(rt){const g=rt.g;const seq=g.phase===1?['tentacle','emerald','tentacle','emerald']:['flood','vortex','emeraldRing','flood','vortex','tentacle'];const type=seq[g.patternCount%seq.length];g.patternTimer=g.phase===1?(g.hard?1.65:2.05):(g.hard?1.35:1.75);const delay=g.hard?.68:.95;
  if(type==='tentacle'){rt.announce('ЩУПАЛЬЦЕ · НЕ ПОДХОДИ');rt.warn(type,{x:g.phase===1?760:480,y:g.phase===1?350:300,r:g.phase===1?90:155},delay)}
  else if(type==='emerald'){rt.announce('ИЗУМРУДНЫЙ ВСПЛЕСК · СМЕНИ ВЫСОТУ');const ys=g.phase===1?[205,295,385,475]:[155,245,355,465];for(let i=0;i<ys.length;i++)rt.warn('emerald',{y:ys[i],lane:i},delay+i*.14)}
  else if(type==='flood'){const safe=(g.patternCount*3+1)%10;rt.announce('ЗАТОПЛЕНИЕ · СМЕНИ СЕКТОР');rt.warn(type,{safe},delay)}
  else if(type==='vortex'){rt.announce('ВОРОНКА · ДВИГАЙСЯ ПО КОЛЬЦАМ');rt.warn(type,{r:115},delay)}
  else {const safe=(g.patternCount*7+2)%10;rt.announce('ИЗУМРУДНЫЙ ВСПЛЕСК · СЕКТОРЫ');rt.warn('emeraldRing',{safe},delay)}
 },
 trigger(rt,w){const g=rt.g;if(w.type==='emerald'){const y=w.y;rt.bullet(975,y,-620,0,10,20,'#72e7a0',{shape:'emerald',life:2.1});rt.bullet(-15,y,620,0,10,20,'#72e7a0',{shape:'emerald',life:2.1});}
  if(w.type==='tentacle'){if(g.phase===1){g.objects.push({kind:'moving',shape:'tentacle',x:790,y:350,vx:-210,vy:0,r:36,damage:13,life:1.3});}else{for(let i=0;i<12;i++){const a=i*Math.PI/6;rt.bullet(480+Math.cos(a)*100,300+Math.sin(a)*100,Math.cos(a)*230,Math.sin(a)*230,12,22,'#62d79b',{life:2.1})}}}
  if(w.type==='flood'||w.type==='emeraldRing'){for(let i=0;i<10;i++)if(i!==(w.safe??-1)){const a=i*Math.PI/5;const x=480+Math.cos(a)*225,y=300+Math.sin(a)*150;rt.bullet(x,y,0,0,12,38,'#4ccf8d',{shape:'ringcell',life:.8})}}
  if(w.type==='vortex'){for(let i=0;i<8;i++){const a=i*Math.PI/4;rt.bullet(480+Math.cos(a)*190,300+Math.sin(a)*135,-Math.cos(a)*80,-Math.sin(a)*80,9,18,'#55d3a2',{life:2.3})}}
 },
 status(rt){const g=rt.g;return g.phase===1?(g.carryRock?'БУЛЫЖНИК В РУКАХ · E — БРОСОК':'E — ПОДНЯТЬ БУЛЫЖНИК · УКЛОНЯЙСЯ'):`ВОРОНКА · РАДИУС ${Math.round(hypot(g.x-480,g.y-300))} · УКЛОНЕНИЯ ${g.grazeCount}`},
 drawBg(rt,ctx){const g=rt.g;ctx.fillStyle=g.phase===1?'#202b32':'#071f2c';ctx.fillRect(0,0,960,600);
  if(g.phase===1){for(let i=0;i<7;i++){const x=95+i*105,y=485+(i%2)*30;ctx.fillStyle='#65727a';poly(ctx,[[x-28,y+12],[x-19,y-17],[x+4,y-28],[x+28,y-4],[x+21,y+17]],'#65727a');}line(ctx,30,530,930,530,'#8b9b9c',4);}
  else{for(let r=1;r<=3;r++){ctx.strokeStyle=r===1?'#36c9a0':'#248d9a';ctx.lineWidth=r===1?5:3;ctx.beginPath();ctx.ellipse(480,300,90*r,58*r,g.ringAngle*.1,0,Math.PI*2);ctx.stroke();}circle(ctx,480,300,60,'#123d4a');circle(ctx,480,300,36,'#4ab8b5',true,3);canvasText(ctx,'ВОРОНКА',480,306,13,'#b6f8e6');}
 },
 drawExtra(rt,ctx){const g=rt.g;if(g.phase===1){for(const r of g.rocks||[])if(!r.taken)poly(ctx,[[r.x-14,r.y+9],[r.x-11,r.y-8],[r.x+3,r.y-15],[r.x+16,r.y-1],[r.x+12,r.y+12]],'#8b989e');if(g.carryRock)circle(ctx,g.x,g.y-28,12,'#a5b0b4');}else{circle(ctx,480,300,90,'#3ed7bb33',true,4);for(let i=0;i<10;i++){const a=i*Math.PI/5+g.ringAngle;circle(ctx,480+Math.cos(a)*[115,190,265][i%3],300+Math.sin(a)*[75,120,165][i%3],7,'#6ce4bd')}}
 }
});
