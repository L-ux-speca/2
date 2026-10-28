'use strict';

// A second RT engine for genres that are NOT Araya's naval bullet hell.
// Every genre has its own movement, telegraphs and attacks in rt-bosses/.
const RTVariantPatterns=new Map();
const RTVariants={g:null,
  register(id,logic){
    if(!RTBossCatalog.has(id)||id==='araya'||RTVariantPatterns.has(id)||
       typeof logic.move!=='function'||typeof logic.pattern!=='function')
      throw Error('Invalid RT genre: '+id);
    RTVariantPatterns.set(id,logic);
  },
  start(heroId,bossId,difficulty='easy',test=true){
    if(!RTVariantPatterns.has(bossId))throw Error('RT is not implemented: '+bossId);
    const c=char(heroId),enemy=char(bossId),info=RTBossCatalog.get(bossId);
    if(test){Cheats.god=false;Cheats.energy=false;Cheats.cooldowns=false}
    RT.g=null;App.gameUI(true);
    const maxHP=420;
    this.g={c,enemy,info,bossId,test,hard:difficulty==='hard',t:0,
      state:'intro',intro:1.8,phase:1,phaseWait:0,headline:info.title.toUpperCase(),
      headlineEnd:4,won:false,finishTime:0,
      x:bossId==='david'?260:bossId==='airi'?180:bossId==='caesar'?75:bossId==='yuzuha'?120:bossId==='lapis'?230:230,
      y:bossId==='airi'?355:bossId==='sonic'?462:bossId==='caesar'?145:bossId==='yuzuha'?350:bossId==='lapis'?330:350,
      vx:0,vy:0,dx:1,dy:0,face:1,lane:1,crouch:false,grounded:true,
      hp:c.hp,pe:c.pe,inv:0,shield:0,slow:0,mark:0,buff:0,
      cd:Array(4).fill(0),customCD:Array(6).fill(0),
      gauge:0,combo:0,lastGraze:-100,grazeCount:0,damage:0,usedDash:0,
      dashTime:0,dashCD:0,dashVX:0,dashVY:0,
      bossHP:maxHP,bossMaxHP:maxHP,bossX:bossId==='caesar'?760:bossId==='yuzuha'?815:bossId==='lapis'?815:815,bossY:bossId==='sonic'?462:bossId==='caesar'?300:bossId==='yuzuha'?350:bossId==='lapis'?310:355,
      targets:[{id:'boss',name:enemy.short,hp:maxHP,maxHp:maxHP,x:bossId==='caesar'?760:815,
        y:bossId==='sonic'?462:bossId==='caesar'?300:bossId==='yuzuha'?350:bossId==='lapis'?310:355,r:37}],
      bullets:[],shots:[],warnings:[],objects:[],activeAbilities:[],fx:[],tasks:[],
      patternTimer:1.6,patternCount:0,beat:0,beatTimer:0,progress:0,chase:35,
      jumpVy:0,hitTimer:0,extra:'',selectedTarget:'boss'};
    if(bossId==='yuzuha')this.g.rocks=[{x:230,y:480,taken:false},{x:390,y:455,taken:false},{x:560,y:490,taken:false}];
    this.genre()?.phase?.(this,1);
    App.showSkills(c,true);
    const targetButton=document.querySelector('.target-button');
    if(targetButton)targetButton.remove();
    document.querySelector('[data-act="target"]')?.remove();
    const footer=document.querySelector('.combat-footer .control-hint');
    if(footer)footer.textContent=info.hint;
    App.announce(info.title.toUpperCase(),info.genre);
    AudioSys.tone(bossId==='sonic'?220:bossId==='airi'?330:116,.4,'sawtooth',.11);
    this.updateHUD();
  },
  genre(){return RTVariantPatterns.get(this.g?.bossId)},
  targets(){return this.g?.targets.filter(t=>t.hp>0)||[]},
  target(){const g=this.g;if(!g)return null;return this.targets().find(t=>t.id!=='boss')||this.targets().find(t=>t.id==='boss')||null},
  announce(title,seconds=2){const g=this.g;g.headline=title;g.headlineEnd=g.t+seconds},
  spark(x,y,color,n=10){if(!Pref.effects)return;const g=this.g;
    for(let i=0;i<n&&g.fx.length<200;i++)g.fx.push({x,y,
      vx:rnd(-170,170),vy:rnd(-170,150),life:rnd(.2,.48),color});
  },
  bullet(x,y,vx,vy,damage=8,r=9,color='#f6af8e',extra={}){
    if(this.g.bullets.length>340)return null;
    const b={x,y,vx,vy,damage,r,color,life:7,grazed:false,near:false,...extra};
    this.g.bullets.push(b);return b;
  },
  warn(type,data={},delay=1){
    this.g.warnings.push({...data,type,time:delay,full:delay});
  },
  shoot(dmg=8,offset=0,r=5,speed=760,target=null){
    const g=this.g,t=target||this.target();if(!t)return;
    const angle=Math.atan2(t.y-g.y,t.x-g.x)+offset;
    g.shots.push({x:g.x+18,y:g.y,vx:Math.cos(angle)*speed,
      vy:Math.sin(angle)*speed,life:2.8,r,dmg,target:t.id});
    if(g.shots.length>200)g.shots.shift();
  },
  hitTarget(target,amount){
    const g=this.g;if(!target||target.hp<=0||g.state!=='active'||g.phaseWait>0)return false;
    let dmg=Math.max(0,Number(amount)||0);
    if(target.id==='boss'&&g.bossId==='sonic'&&g.chase<56)dmg*=.4;
    target.hp=Math.max(0,target.hp-dmg);g.damage+=dmg;
    this.spark(target.x,target.y,g.c.color,Math.min(10,Math.ceil(dmg/3)));
    if(target.id==='boss'){
      g.bossHP=target.hp;
      if(g.bossHP<=0){this.finish(true);return true}
      if(g.bossId!=='lapis'){if(g.phase===1&&g.bossHP<=g.bossMaxHP*2/3)this.phase(2);
      else if(g.phase===2&&g.bossHP<=g.bossMaxHP/3)this.phase(3);}
    }else if(target.hp<=0){
      this.spark(target.x,target.y,'#d6ffed',22);
      this.announce('КЛОН УНИЧТОЖЕН');
    }
    return true;
  },
  hitHero(damage,opts={}){
    const g=this.g;
    if(g.state!=='active'||g.phaseWait>0||g.inv>0||g.shield>0||Cheats.god)return false;
    g.hp=Math.max(0,g.hp-damage*(g.hard?1.35:1));
    g.inv=g.hard?.53:.73;g.hitTimer=.3;
    if(opts.slow)g.slow=1.6;
    if(g.bossId==='sonic')g.chase=clamp(g.chase-12,0,100);
    this.spark(g.x,g.y,'#fd9b99',16);AudioSys.sfx('hit');
    if(g.hp<=0&&g.c.id==='dio'&&!g.lastChanceUsed&&g.pe>=30){
      g.hp=Math.min(g.c.hp,30);g.pe-=30;g.inv=1;g.lastChanceUsed=true;
      this.announce('ПОСЛЕДНИЙ ШАНС');
    }
    if(g.hp<=0)this.finish(false);
    else if(g.activeAbilities.some(e=>e.kind==='counter'&&e.life>0))
      this.hitTarget(this.target(),Math.min(25,damage*2));
    return true;
  },
  phase(n){
    const g=this.g;if(g.state!=='active'||n<=g.phase)return;
    g.phase=n;g.phaseWait=1.6;g.inv=2.1;
    g.bullets=[];g.warnings=[];g.patternTimer=2.2;
    this.genre()?.phase?.(this,n);
    this.announce('ФАЗА '+['','I','II','III'][n]+' · '+g.info.title.toUpperCase(),2.2);
    AudioSys.tone(142+n*75,.35,'sawtooth',.1);
  },
  cast(index){
    const g=this.g,skill=g?.c.skills[index];
    if(!skill||skill.passive||g.state!=='active'||g.phaseWait>0||g.cd[index]>0||g.bossId==='yuzuha'&&g.phase===1&&g.carryRock)return false;
    const activeRevolver=g.c.id==='kisei'&&index===3&&g.activeAbilities.some(e=>e.kind==='revolver'&&e.life>0);
    const cost=activeRevolver?4:skill.cost;
    if(g.pe<cost&&!Cheats.energy)return false;
    if(!Cheats.energy)g.pe-=cost;
    g.cd[index]=Cheats.cooldowns?0:activeRevolver?.4:skill.cd;
    AudioSys.sfx('cast');this.announce(skill.name.toUpperCase(),.75);
    if(activeRevolver){this.shoot(5,0,5,820);return true}
    const handler=RT_SKILL_HANDLERS[g.c.id]?.[index];
    if(handler)handler(this);
    else if(skill.effect)SkillRegistry.runRT(this,index);
    else this.shoot(index===3?28:11+index*5,0,7,780);
    return true;
  },
  custom(slot){
    const g=this.g,m=Builder.get(g.c.id,slot);
    if(!m||g.state!=='active'||g.customCD[slot]>0||g.pe<m.cost&&!Cheats.energy)return false;
    if(!Cheats.energy)g.pe-=m.cost;
    g.customCD[slot]=Cheats.cooldowns?0:m.cd;
    for(const step of m.steps)g.tasks.push({at:g.t+step.at,step});
    this.announce(m.name.toUpperCase(),1);
    return true;
  },
  customStep(s){
    const g=this.g,target=this.target();if(!target)return;
    const dmg=5+s.power*4;
    switch(s.type){
      case'projectile':for(let i=0;i<s.count;i++)this.shoot(dmg,(i-(s.count-1)/2)*.09,4+s.size,480+s.range*70);break;
      case'pulse':this.g.bullets=this.g.bullets.filter(b=>hypot(b.x-g.x,b.y-g.y)>45+s.size*27);
        if(hypot(target.x-g.x,target.y-g.y)<45+s.size*27+target.r)this.hitTarget(target,dmg);break;
      case'field':this.hitTarget(target,dmg*.65);this.spark(target.x,target.y,g.c.color,15);break;
      case'orbit':RTAbility.orbit(this,.5+s.duration*.6);break;
      case'shield':RTAbility.shield(this,.5+s.duration*.6);break;
      case'heal':RTAbility.heal(this,4+s.power*5);break;
      case'dash':this.dash(g.dx,g.dy,320+s.range*80);break;
      case'summon':RTAbility.summon(this,1+s.duration,2+s.power*2,s.count);break;
    }
  },
  dash(dx,dy,speed=780){
    const g=this.g;if(g.state!=='active'||g.dashCD>0)return false;
    const length=hypot(dx,dy)||1;
    g.dashVX=dx/length*speed;g.dashVY=dy/length*speed;
    g.dashTime=.15;g.dashCD=.85;g.inv=Math.max(g.inv,.22);g.usedDash++;
    AudioSys.sfx('dash');return true;
  },
  graze(b){
    const g=this.g;if(b.grazed||Cheats.god||g.inv>0)return;
    b.grazed=true;g.grazeCount++;g.combo=g.t-g.lastGraze>2.3?1:Math.min(20,g.combo+1);
    g.lastGraze=g.t;g.gauge=clamp(g.gauge+2+Math.floor(g.combo/5),0,100);
    this.spark(g.x,g.y,'#e9e5bb',3);
  },
  tickEffects(dt){
    const g=this.g;
    for(const e of g.activeAbilities){
      e.life-=dt;e.timer-=dt;
      if(e.kind==='orbit')g.bullets=g.bullets.filter(b=>hypot(b.x-g.x,b.y-g.y)>e.radius);
      if(e.kind==='magnet')for(const b of g.bullets)if(!b._magnetized&&hypot(b.x-g.x,b.y-g.y)<e.radius){b.vx*=.65;b.vy*=.65;b._magnetized=true}
      if(e.kind==='flight'||e.kind==='speed')g.slow=0;
      if(e.timer>0)continue;
      e.timer+=e.interval;
      const target=this.target();
      if(e.kind==='damage-over-time'&&target)this.hitTarget(target,e.damage);
      if(e.kind==='summon'&&target)for(let i=0;i<e.shots;i++)this.shoot(e.damage,(i-(e.shots-1)/2)*.12,5,690,target);
      if(['blade','fist','orbit','revolver'].includes(e.kind))this.shoot(e.damage||5,0,5,760);
      if(e.kind==='counter'&&target&&g.hitTimer>0)this.hitTarget(target,e.damage||10);
    }
    g.activeAbilities=g.activeAbilities.filter(e=>e.life>0);
    for(const p of g.fx){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt}
    g.fx=g.fx.filter(p=>p.life>0);
  },
  step(dt){
    const g=this.g;if(!g||App.paused||g.state==='done')return;
    g.t+=dt;this.tickEffects(dt);
    if(g.state==='intro'){
      g.intro-=dt;if(g.intro<=0){g.state='active';g.inv=1.1;g.phaseWait=.8;this.announce('ФАЗА I · '+g.info.title.toUpperCase(),2)}
      this.updateHUD();return;
    }
    if(g.state==='finish'){
      g.finishTime-=dt;if(g.finishTime<=0)this.returnResult(g.won);
      this.updateHUD();return;
    }
    if(g.state!=='active')return;
    for(const key of ['inv','shield','slow','dashCD','hitTimer'])g[key]=Math.max(0,g[key]-dt);
    g.pe=clamp(g.pe+2.55*dt,0,g.c.pe);if(Cheats.energy)g.pe=g.c.pe;
    for(let i=0;i<4;i++)g.cd[i]=Cheats.cooldowns?0:Math.max(0,g.cd[i]-dt*(i===0?1+g.gauge/70:1));
    for(let i=0;i<6;i++)g.customCD[i]=Cheats.cooldowns?0:Math.max(0,g.customCD[i]-dt);
    const mx=(Input.has(0,'right')?1:0)-(Input.has(0,'left')?1:0);
    const my=(Input.has(0,'down')?1:0)-(Input.has(0,'up')?1:0);
    const double=[Keys[0].left,Keys[0].right,Keys[0].up,Keys[0].down,
      'touch:left','touch:right','touch:up','touch:down'].some(k=>Input.double.has(k));
    const boosted=Input.held.has('ShiftLeft')||Input.held.has('ShiftRight');
    const customShortcut=boosted&&Array.from({length:6},(_,i)=>
      Input.pressed.has('Digit'+(i+1))).some(Boolean);
    if(!customShortcut&&(Input.pressed.has('ShiftLeft')||
      Input.pressed.has('ShiftRight')||Input.pressed.has('touch:dash')||double))
      this.dash(mx||1,my);
    if(boosted)for(let i=0;i<6;i++)if(Input.pressed.has('Digit'+(i+1)))this.custom(i);
    if(g.phaseWait>0)g.phaseWait=Math.max(0,g.phaseWait-dt);
    this.genre().move(this,dt,mx,my);
    if(g.dashTime>0){g.dashTime-=dt;g.x+=g.dashVX*dt;g.y+=g.dashVY*dt;this.spark(g.x,g.y,g.c.color,1)}
    g.x=clamp(g.x,45,890);g.y=clamp(g.y,125,540);
    if(g.phaseWait<=0){
      for(let i=0;i<4;i++)if(Input.tap(0,'s'+(i+1))&&!boosted)this.cast(i);
      g.patternTimer-=dt;
      if(g.patternTimer<=0){this.genre().pattern(this);g.patternCount++}
    }
    for(const w of g.warnings){w.time-=dt;if(w.time<=0)this.genre().trigger(this,w)}
    g.warnings=g.warnings.filter(w=>w.time>0);
    const boss=g.targets[0];boss.x=g.bossX;boss.y=g.bossY;
    for(const s of g.shots){const px=s.x,py=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
      for(const target of this.targets())if(target.id===s.target&&
        Hitbox.sweepCircleCircle(px,py,s.x,s.y,s.r,target.x,target.y,target.r)){
          this.hitTarget(target,s.dmg);s.life=0;this.spark(s.x,s.y,g.c.color,3);break;
        }
    }
    g.shots=g.shots.filter(s=>s.life>0&&s.x>-60&&s.x<1030&&s.y>65&&s.y<650);
    for(const b of g.bullets){const px=b.x,py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      if(b.bounce){
        if(b.x<18||b.x>942){b.vx=-b.vx;b.x=clamp(b.x,18,942)}
        if(b.y<82||b.y>572){b.vy=-b.vy;b.y=clamp(b.y,82,572)}
        if(g.bossId==='caesar'&&!b.redExit){
          for(const wall of (g.mazeWalls||CAESAR_MAZE))if(b.x+b.r>wall.x&&b.x-b.r<wall.x+wall.w&&b.y+b.r>wall.y&&b.y-b.r<wall.y+wall.h){
            if(px+b.r<=wall.x||px-b.r>=wall.x+wall.w)b.vx=-b.vx;else b.vy=-b.vy;
            b.x=px;b.y=py;break;
          }
        }
      }
      if(b.redExit&&hypot(b.x-(g.exitX||885),b.y-(g.exitY||510))<25){b.life=0;}
      let intercepted=false;
      for(const summon of g.activeAbilities)if(summon.kind==='summon'&&summon.life>0&&summon.hp>0&&
        Hitbox.sweepCircleCircle(px,py,b.x,b.y,b.r,
          summon.originX,summon.originY,summon.r||16)){
          summon.hp=Math.max(0,summon.hp-b.damage);
          if(summon.hp<=0)summon.life=0;
          b.life=0;intercepted=true;
          this.spark(summon.originX,summon.originY,g.c.color,5);
          break;
        }
      if(intercepted)continue;
      const d=hypot(b.x-g.x,b.y-g.y),radius=g.bossId==='sonic'&&g.crouch?11:17;
      if(Hitbox.sweepCircleCircle(px,py,b.x,b.y,b.r,g.x,g.y,radius)){
        this.hitHero(b.damage,{slow:b.slow});b.life=0;
      }else if(d<b.r+radius+24&&!b.grazed&&!b.near)b.near=true;
      else if(d>b.r+radius+24&&b.near){this.graze(b);b.near=false}
    }
    g.bullets=g.bullets.filter(b=>b.life>0&&b.x>-120&&b.x<1080&&b.y>60&&b.y<680);
    for(const o of g.objects){o.life-=dt;
      if(o.kind==='poison'&&hypot(g.x-o.x,g.y-o.y)<o.r+15){o.tick=(o.tick||0)-dt;
        if(o.tick<=0){this.hitHero(o.damage||5,{slow:true});o.tick=.65}}
      if(o.kind==='orbit'){o.x=g.x;o.y=g.y}
      if(o.kind==='moving'){const px=o.x,py=o.y;o.x+=o.vx*dt;o.y+=o.vy*dt;
        const heroR=g.bossId==='sonic'&&g.crouch?13:18;
        if(Hitbox.sweepCircleCircle(px,py,o.x,o.y,o.r,g.x,g.y,heroR)){
          this.hitHero(o.damage||8);o.life=0;
        }}
    }
    g.objects=g.objects.filter(o=>o.life>0&&o.hp!==0);
    const tasks=g.tasks;g.tasks=[];
    for(const task of tasks)if(task.at<=g.t)this.customStep(task.step);else g.tasks.push(task);
    if(g.hp<=0&&g.state==='active')this.finish(false);
    this.updateHUD();
  },
  finish(won){
    const g=this.g;if(!g||g.state!=='active')return;
    g.state='finish';g.won=won;g.finishTime=2.35;
    g.bullets=[];g.warnings=[];g.tasks=[];
    this.spark(g.bossX,g.bossY,won?'#c4f1d3':'#f1a8aa',55);
    App.announce(won?'ТЕРРИТОРИЯ ПОБЕЖДЕНА':'ПОРАЖЕНИЕ',g.info.title);
    AudioSys.sfx('ko');
  },
  returnResult(won){
    const g=this.g;if(g.state==='done')return;g.state='done';
    if(g.test){App.result(won?'Победа в РТ':'РТ окончено',won?'ТЕРРИТОРИЯ ПОБЕЖДЕНА':'ПОРАЖЕНИЕ',
      `Фаза ${g.phase}/3 · уклонений ${g.grazeCount} · урона ${Math.round(g.damage)} · здоровье ${Math.ceil(g.hp)}`,
      'RTVariants.restart()');return}
    if(!Fight.g){App.home();return}
    App.gameUI(false);App.showSkills(Fight.g.f[0].c);Fight.trainingUI();
    Fight.g.state='active';Fight.g.f[0].hp=won?Math.max(1,g.hp):0;
    Fight.g.f[0].pe=g.pe;
    if(won)Fight.g.f[1].hp=0;
    Fight.ko(won?0:1,true);
  },
  restart(){const g=this.g;App.closeModal();this.start(g.c.id,g.bossId,g.hard?'hard':'easy',true)},
  updateHUD(){
    const g=this.g,h=App.hud;if(!g||App.screen!=='rt'||!h?.p1Name)return;
    h.p1Name.textContent=g.c.name;h.p1HP.textContent=Math.ceil(g.hp)+' / '+g.c.hp;
    h.p1HPBar.style.width=100*g.hp/g.c.hp+'%';h.p1PEBar.style.width=100*g.pe/g.c.pe+'%';
    h.p1GuardBar.style.width=g.shield>0?Math.min(100,100*g.shield/3)+'%':'0%';
    h.p1Meta.textContent='ПЭ '+Math.floor(g.pe)+'/'+g.c.pe+(g.shield>0?' · ЗАЩИТА':'');
    h.p2Name.textContent=g.enemy.name+' · РТ';
    h.p2HP.textContent=Math.ceil(g.bossHP)+' / '+g.bossMaxHP;
    h.p2HPBar.style.width=100*g.bossHP/g.bossMaxHP+'%';
    h.p2PEBar.style.width='0%';h.p2GuardBar.style.width='0%';
    h.p2Meta.textContent=g.formName?g.formName+' · '+g.info.genre:g.info.genre;
    h.rtCharge.style.width='0%';h.timer.textContent=['','I','II','III'][g.phase];
    h.rounds.textContent=g.hard?'LUNATIC':'EASY';
    h.attackText.textContent='АТАКА '+Math.floor(g.gauge)+'%';
    h.attackBar.style.width=g.gauge+'%';
    h.grazeText.textContent=this.genre().status?.(this)||'Уклонения '+g.grazeCount;
    h.phaseText.textContent=g.headlineEnd>g.t?g.headline:'ФАЗА '+g.phase+' · '+g.info.title.toUpperCase();
    const target=this.target();h.targetText.textContent=target&&target.id!=='boss'?
      'ЦЕЛЬ: '+target.name+' · '+Math.ceil(target.hp)+' HP':g.info.short;
    h.matchLabel.textContent=g.info.title.toUpperCase();
    g.c.skills.forEach((s,i)=>{const b=document.querySelector('#skill'+i);if(!b)return;
      const cd=g.cd[i];b.classList.toggle('unready',cd>0||g.pe<s.cost);
      b.querySelector('span').textContent=s.passive?'Пассивная · вне РТ':
        cd>0?cd.toFixed(1)+' с':s.cost+' ПЭ · готов';
      b.querySelector('.cool').style.width=s.cd?100*clamp(1-cd/s.cd,0,1)+'%':'100%';
    });
  }
};
