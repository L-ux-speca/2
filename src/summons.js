// Physical summons and Mechamaru's wearable puppet. Same hit rules for all fighters.
(() => {
  const makeEntity=Fight.entity.bind(Fight);
  Fight.entity=function(actor,data){
    const entity=makeEntity(actor,data);
    if(entity?.kind==='summon'){
      const g=this.g;
      g.summonSerial=(g.summonSerial||1000)+1;
      entity.uid=g.summonSerial;
      entity.hp=Math.max(1,Number(entity.hp)||10);
      entity.maxHp=Math.max(entity.hp,Number(entity.maxHp)||entity.hp);
      if(entity.shape==='robot')entity.r=Math.max(36,entity.r||0);
    }
    return entity;
  };

  Fight.summonBox=function(s){
    const robot=s.shape==='robot',half=robot?36:23,h=robot?132:100;
    return {x:s.x-half,y:s.y-h,w:half*2,h};
  };
  Fight.damageSummon=function(s,amount,actor){
    if(!s||s.kind!=='summon'||s.life<=0||s.hp<=0||actor?.side===s.owner)return false;
    const loss=clamp(Number(amount)||0,0,500);
    if(loss<=0)return false;
    s.hp=Math.max(0,s.hp-loss);
    const color=s.color||(s.owner===0?'#8cc9ff':'#c9a1e5');
    this.spark(s.x,s.y-(s.shape==='robot'?75:50),color,7);
    this.float('−'+Math.round(loss),s.x,s.y-(s.shape==='robot'?150:111),color);
    if(s.hp<=0){
      s.life=0;
      this.spark(s.x,s.y-60,color,23);
      this.float('ПРИЗЫВ УНИЧТОЖЕН',s.x,s.y-156,'#ffd4ba');
      AudioSys.sfx('hit');
    }
    return true;
  };

  const cast=Fight.cast.bind(Fight);
  Fight.cast=function(actor,index){
    const g=this.g,before=g?.e?.length||0;
    if(actor.id==='mechamaru'&&index===2&&(actor.robot||g?.e?.some(e=>
      e.kind==='summon'&&e.shape==='robot'&&e.owner===actor.side&&e.hp>0&&e.life>0)))
      return false;
    const success=cast(actor,index);
    if(success&&actor.id==='mechamaru'&&index===2){
      const puppet=g.e.slice(before).find(e=>e.kind==='summon'&&e.owner===actor.side&&e.shape==='robot');
      if(puppet){
        puppet.x=550;puppet.y=460;
        puppet.hp=55;puppet.maxHp=55;
        puppet.r=38;puppet.dmg=0;
        puppet.stationary=true;puppet.life=30;puppet.attackTimer=999;
        this.float('КУКЛА · 55 HP',puppet.x,puppet.y-150,actor.c.color);
      }
    }
    return success;
  };

  const oldAI=Fight.ai.bind(Fight);
  Fight.ai=function(actor,enemy){
    const command=oldAI(actor,enemy);
    if(actor.id==='mechamaru'&&!actor.robot&&actor.stun<=0&&actor.grounded){
      const doll=this.g?.e?.find(e=>e.kind==='summon'&&e.shape==='robot'&&
        e.owner===actor.side&&e.hp>0&&e.life>0&&Math.abs(e.x-actor.x)<=70);
      if(doll)command.doubleUp=true;
    }
    return command;
  };

  // Check swept projectile paths. High-speed attacks must not pass through a thin clone.
  const segmentHits=(p0x,p0y,p1x,p1y,s,r)=>{
    const dx=p1x-p0x,dy=p1y-p0y,div=dx*dx+dy*dy||1;
    const cx=s.x,cy=s.y-(s.shape==='robot'?67:49);
    const t=clamp(((cx-p0x)*dx+(cy-p0y)*dy)/div,0,1);
    const px=p0x+t*dx,py=p0y+t*dy;
    const rx=(s.shape==='robot'?36:23)+r,ry=(s.shape==='robot'?66:50)+r;
    return ((px-cx)/rx)**2+((py-cy)/ry)**2<=1;
  };
  const stepEntities=Fight.entitiesStep.bind(Fight);
  Fight.entitiesStep=function(dt){
    const g=this.g;
    if(g?.e?.length){
      const summons=g.e.filter(e=>e.kind==='summon'&&e.hp>0&&e.life>0);
      const attacks=g.e.filter(e=>e.kind!=='summon'&&e.life>0);
      for(const a of attacks){
        const owner=g.f[a.owner];
        if(!owner)continue;
        for(const s of summons){
          if(s.owner===a.owner||s.hp<=0||s.life<=0||a.life<=0)continue;
          if(a.kind==='projectile'){
            const endX=a.x+(a.vx||0)*dt;
            const endY=a.y+(a.vy||0)*dt;
            if(segmentHits(a.x,a.y,endX,endY,s,a.r||10)){
              this.damageSummon(s,a.dmg,owner);
              a.life=0;
            }
            continue;
          }
          if(!['area','channel','orbit','trap'].includes(a.kind))continue;
          const next=a.summonNext??(a.summonNext={});
          if((next[s.uid]||0)>g.t)continue;
          const cy=s.y-(s.shape==='robot'?67:49),radius=s.shape==='robot'?36:23;
          let connected=false;
          if(a.kind==='area')connected=hypot(s.x-a.x,cy-a.y)<a.r+radius;
          if(a.kind==='channel')connected=owner.st.channel>0&&
            owner.face*(s.x-owner.x)>-radius&&Math.abs(s.x-owner.x)<a.r+radius&&
            Math.abs(cy-(owner.y-56))<75;
          if(a.kind==='orbit')for(let i=0;i<(a.count||2);i++){
            const angle=g.t*5+i*Math.PI*2/(a.count||2);
            const ox=owner.x+Math.cos(angle)*a.r,oy=owner.y-45+Math.sin(angle)*a.r*.55;
            if(hypot(s.x-ox,cy-oy)<radius+15){connected=true;break}
          }
          if(a.kind==='trap')connected=Math.abs(s.x-a.x)<a.r+radius&&
            Math.abs(s.y-a.y)<95;
          if(connected&&this.damageSummon(s,a.dmg,owner)){
            next[s.uid]=g.t+(a.kind==='area'?100:Math.max(.12,a.period||.18));
          }
        }
      }
    }
    return stepEntities(dt);
  };

  // Remaining puppet armor is a separate health pool, not extra fighter HP.
  const visual=Fight.visualStep.bind(Fight);
  Fight.visualStep=function(dt){
    visual(dt);
    for(const f of this.g?.f||[])if(f.robot&&(!f.shield||f.shield.hp<=0)){
      f.robot=false;f.shield=null;
      this.float('БРОНЯ КУКЛЫ СЛОМАНА',f.x,f.y-152,'#f6b6a8');
      this.spark(f.x,f.y-67,'#a8dffa',18);
    }
  };

  const renderFighter=drawFighter;
  drawFighter=function(ctx,f,time,scale=1,cinematic=false){
    renderFighter(ctx,f,time,scale,cinematic);
    if(!f.robot)return;
    ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.face*scale,scale);
    // Shoulder plates, arm housings and visor encase the original character.
    poly(ctx,[[-26,-76],[-10,-86],[13,-86],[29,-73],[24,-28],[-24,-28]],'#465d69','#a1cadb');
    poly(ctx,[[-32,-76],[-15,-80],[-16,-48],[-33,-46]],'#647d8c','#b2def2');
    poly(ctx,[[15,-80],[33,-75],[33,-45],[17,-48]],'#647d8c','#b2def2');
    poly(ctx,[[-20,-86],[-17,-108],[-7,-118],[14,-116],[22,-104],[19,-83]],'#4c6072','#a3daf3');
    line(ctx,-10,-101,14,-101,'#75e8ff',4);
    line(ctx,-17,-41,18,-41,'#99e2f4',3);
    circle(ctx,1,-61,8,'#79dff5');circle(ctx,1,-61,3,'#e1fcff');
    line(ctx,-12,-25,-12,-5,'#7595a4',7);
    line(ctx,12,-25,12,-5,'#7595a4',7);
    ctx.restore();
  };

  const renderEntity=Fight.drawEntity.bind(Fight);
  Fight.drawEntity=function(ctx,e){
    renderEntity(ctx,e);
    if(e.kind!=='summon'||e.hp<=0||e.life<=0)return;
    const width=e.shape==='robot'?80:46,y=e.y-(e.shape==='robot'?151:111),
      fraction=clamp(e.hp/(e.maxHp||e.hp),0,1);
    ctx.save();
    ctx.fillStyle='#11212b';ctx.fillRect(e.x-width/2,y,width,6);
    ctx.fillStyle=fraction>.35?'#a4e1bd':'#f0a4a0';
    ctx.fillRect(e.x-width/2,y,width*fraction,6);
    ctx.strokeStyle='#bed1d6';ctx.lineWidth=1;ctx.strokeRect(e.x-width/2,y,width,6);
    if(e.shape==='robot'){
      const owner=this.g.f[e.owner];
      if(owner?.id==='mechamaru'&&!owner.robot&&Math.abs(owner.x-e.x)<=112)
        canvasText(ctx,'E / 2× ВВЕРХ · ВОЙТИ',e.x,e.y-165,11,'#d1edff');
    }
    ctx.restore();
  };

  const renderFight=Fight.draw.bind(Fight);
  Fight.draw=function(){
    renderFight();
    const g=this.g,ctx=App.ctx;
    if(g?.mode!=='training'||!g.training?.hitboxes||!ctx)return;
    ctx.save();ctx.strokeStyle='#ebd17c';ctx.lineWidth=1.5;
    for(const e of g.e)if(e.kind==='summon'&&e.hp>0&&e.life>0){
      const b=this.summonBox(e),z=g.cam.zoom;
      const x=550+(b.x-g.cam.x)*z,y=460+(b.y-460)*z;
      ctx.strokeRect(x,y,b.w*z,b.h*z);
    }
    ctx.restore();
  };

  const hud=Fight.updateHUD.bind(Fight);
  Fight.updateHUD=function(){
    hud();
    if(App.screen!=='fight'||!this.g)return;
    for(let i=0;i<2;i++){
      const f=this.g.f[i];
      if(f.robot&&f.shield){
        const text=document.querySelector('#p'+(i+1)+'Meta');
        if(text)text.textContent+=` · КУКЛА ${Math.ceil(f.shield.hp)}/${f.robotMaxHp||55} HP`;
      }
    }
  };

  const help=App.help.bind(App);
  App.help=function(){
    help();
    const e=document.querySelector('#modalRoot .help-note');
    if(e)e.insertAdjacentHTML('beforebegin',
      '<p class="help-note"><b>Кокичи:</b> третья техника создаёт куклу с 55 HP в центре арены. Подойди к ней и нажми E (или дважды клавишу прыжка), чтобы надеть костюм. У куклы отдельная броня; повторным нажатием можно выйти. Клоны и другие призывы получают урон от ударов, снарядов и техник.</p>');
  };
})();

// RT summons also occupy space and may be destroyed by the boss's projectiles.
(() => {
  const summon=RTAbility.summon.bind(RTAbility);
  RTAbility.summon=function(rt,seconds,damage,shots){
    summon(rt,seconds,damage,shots);
    const g=rt.g,e=g.activeAbilities?.at(-1);
    if(e?.kind==='summon'){
      e.hp=24+shots*6;e.maxHp=e.hp;e.r=16;
      e.originX=clamp(g.x-55,25,935);e.originY=g.y;
    }
  };

  const custom=RT.customStep.bind(RT);
  RT.customStep=function(step){
    const start=this.g?.objects?.length||0;
    const result=custom(step);
    for(const e of this.g?.objects?.slice(start)||[])if(e.kind==='summon'){
      e.hp=12+(step.power||1)*6;e.maxHp=e.hp;e.r=15;
    }
    return result;
  };

  const rtStep=RT.step.bind(RT);
  RT.step=function(dt){
    const g=this.g;
    if(g&&g.state==='active'&&!App.paused){
      const allies=[...(g.activeAbilities||[]).filter(e=>e.kind==='summon'&&e.life>0&&e.hp>0)
          .map(e=>({entity:e,x:e.originX,y:e.originY,r:e.r||16})),
        ...g.objects.filter(e=>e.kind==='summon'&&e.life>0&&e.hp>0)
          .map(e=>({entity:e,x:e.x,y:e.y,r:e.r||15}))];
      const alive=[];
      for(const b of g.bullets){
        let intercepted=false;
        if(b.life>0)for(const a of allies){
          const dx=b.vx*dt,dy=b.vy*dt,den=dx*dx+dy*dy||1;
          const frac=clamp(((a.x-b.x)*dx+(a.y-b.y)*dy)/den,0,1);
          if(hypot(a.x-(b.x+dx*frac),a.y-(b.y+dy*frac))>a.r+(b.r||5))continue;
          a.entity.hp=Math.max(0,a.entity.hp-(b.damage||5));
          this.spark(a.x,a.y,g.c.color,5);
          if(a.entity.hp<=0){a.entity.life=0;this.spark(a.x,a.y,g.c.color,18)}
          intercepted=true;break;
        }
        if(!intercepted)alive.push(b);
      }
      g.bullets=alive;
      g.objects=g.objects.filter(e=>e.kind!=='summon'||e.hp===undefined||e.hp>0);
      if(g.activeAbilities)g.activeAbilities=g.activeAbilities.filter(e=>
        e.kind!=='summon'||e.hp===undefined||e.hp>0);
    }
    return rtStep(dt);
  };

  const rtDraw=RT.draw.bind(RT);
  RT.draw=function(){
    rtDraw();
    const g=this.g,ctx=App.ctx;
    if(!g||!ctx)return;
    ctx.save();
    for(const e of g.objects)if(e.kind==='summon'&&e.maxHp&&e.hp>0){
      ctx.fillStyle='#162835';ctx.fillRect(e.x-20,e.y-30,40,5);
      ctx.fillStyle='#a9e5ba';ctx.fillRect(e.x-20,e.y-30,40*clamp(e.hp/e.maxHp,0,1),5);
    }
    ctx.restore();
  };
})();

