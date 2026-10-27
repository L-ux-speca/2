'use strict';

// One authoritative collision pass for orbit interception and damageable summons.
// It runs before movement in Fight.entitiesStep, so attacks cannot hit a puppet twice.
const CombatCollisions=Object.freeze({
  step(fight,dt){
    const g=fight.g;
    const summons=g.e.filter(e=>e.kind==='summon'&&e.hp>0&&e.life>0);
    const orbits=g.e.filter(e=>e.kind==='orbit'&&e.life>0);
    for(const attack of g.e){
      if(attack.life<=0||attack.kind==='summon')continue;
      const owner=g.f[attack.owner];
      if(!owner)continue;

      if(attack.kind==='projectile'){
        let stopped=false;
        for(const orbit of orbits){
          const shieldOwner=g.f[orbit.owner];
          if(!shieldOwner||!CombatDefense.orbitIntercept(fight,attack,dt,orbit,shieldOwner))continue;
          attack.life=0;
          stopped=true;
          break;
        }
        if(stopped)continue;
        for(const summon of summons){
          if(summon.owner===attack.owner||summon.hp<=0||summon.life<=0)continue;
          if(!Hitbox.sweepCircleRect(
            attack.x,attack.y,attack.x+(attack.vx||0)*dt,
            attack.y+(attack.vy||0)*dt,attack.r||10,Hitbox.summon(summon)))continue;
          fight.damageSummon(summon,attack.dmg,owner);
          attack.life=0;
          break;
        }
        continue;
      }

      if(!['area','channel','orbit','trap'].includes(attack.kind))continue;
      const next=attack.summonNext??(attack.summonNext={});
      for(const summon of summons){
        if(summon.owner===attack.owner||summon.hp<=0||summon.life<=0)continue;
        if((next[summon.uid]||0)>g.t)continue;
        const box=Hitbox.summon(summon);
        let hit=false;
        if(attack.kind==='area')hit=Hitbox.circleRect(attack.x,attack.y,attack.r,box);
        if(attack.kind==='channel')hit=owner.st.channel>0&&
          owner.face*(summon.x-owner.x)>-box.w/2&&
          Math.abs(summon.x-owner.x)<attack.r+box.w/2&&
          Math.abs((box.y+box.h/2)-(owner.y-56))<75;
        if(attack.kind==='orbit')for(let n=0;n<(attack.count||2);n++){
          const angle=g.t*5+n*Math.PI*2/(attack.count||2);
          const x=owner.x+Math.cos(angle)*attack.r;
          const y=owner.y-45+Math.sin(angle)*attack.r*.55;
          if(Hitbox.circleRect(x,y,15,box)){hit=true;break}
        }
        if(attack.kind==='trap')hit=Hitbox.circleRect(attack.x,attack.y,attack.r,box);
        if(hit&&fight.damageSummon(summon,attack.dmg,owner))
          next[summon.uid]=g.t+(attack.kind==='area'?100:Math.max(.12,attack.period||.18));
      }
    }
  }
});

(() => {
  const updateBase=Fight.entitiesStep.bind(Fight);
  Fight.entitiesStep=function(dt){
    if(!this.g)return;
    LapisAnchor.move(this,dt);
    CombatCollisions.step(this,dt);
    const result=updateBase(dt);
    LapisAnchor.clean(this);
    return result;
  };
})();
