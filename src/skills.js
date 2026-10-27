'use strict';

// Data-driven fallback skills for newly registered fighters. The 14 original
// characters keep their bespoke handlers; extra characters need no engine edits.
const SkillRegistry=(()=>{
  const custom=new Map();
  const number=(value,fallback,min,max)=>clamp(Number.isFinite(value)?value:fallback,min,max);
  const invoke=(fight,actor,skill)=>{
    const p=skill.params||{};
    switch(skill.effect){
      case 'projectile':fight.projectile(actor,{dmg:number(p.damage,14,0,80),
        vx:actor.face*number(p.speed,550,20,1600),r:number(p.radius,12,3,60),
        life:number(p.life,2,.1,8),shape:p.shape||'orb'});return true;
      case 'area':fight.area(actor,{dmg:number(p.damage,18,0,80),
        r:number(p.radius,85,10,450),life:.25,shape:p.shape||'wave'});return true;
      case 'shield':actor.shield={hp:number(p.hp,30,1,300),time:number(p.duration,6,.1,30)};return true;
      case 'heal':actor.hp=Math.min(actor.maxHp,actor.hp+number(p.heal,20,0,100));return true;
      case 'dash':actor.kx=actor.face*number(p.speed,420,20,1300);
        actor.st.inv=.12;return true;
      case 'summon':fight.summon(actor,{hp:number(p.hp,15,1,120),
        dmg:number(p.damage,5,0,35),life:number(p.duration,7,.1,30),
        shape:p.shape||'clone'});return true;
      default:return false;
    }
  };
  return Object.freeze({
    effects:['projectile','area','shield','heal','dash','summon'],
    register(characterId,index,handler){
      if(typeof handler!=='function'||!Number.isInteger(index)||index<0||index>3)
        throw Error('Skill handler must be a function for slots 0–3');
      custom.set(characterId+':'+index,handler);
    },
    run(fight,actor,index){
      const handler=custom.get(actor.id+':'+index);
      return handler?handler(fight,actor):invoke(fight,actor,actor.c.skills[index]);
    },
    runRT(rt,index){
      const s=rt.g.c.skills[index],p=s.params||{};
      const dmg=number(p.damage,18,0,80);
      switch(s.effect){
        case 'projectile':rt.shoot(dmg,0,number(p.radius,6,3,30),number(p.speed,700,100,1500));break;
        case 'area':{const target=rt.target();if(target)rt.hitTarget(target,dmg);break;}
        case 'shield':rt.g.shield=Math.max(rt.g.shield,number(p.duration,3,.1,12));break;
        case 'heal':rt.g.hp=Math.min(rt.g.c.hp,rt.g.hp+number(p.heal,20,0,100));break;
        case 'dash':rt.g.inv=Math.max(rt.g.inv,.3);break;
        case 'summon':RTAbility.summon(rt,number(p.duration,5,.5,20),dmg,1);break;
      }
    }
  });
})();

(() => {
  CombatHooks.onAfterCast((fight,actor,index)=>{
    if(actor.c.skills[index]?.effect)SkillRegistry.run(fight,actor,index);
  });
  const rtCastBase=RT.cast.bind(RT);
  RT.cast=function(index){
    const g=this.g,s=g?.c.skills[index];
    const ready=!!(s&&!s.passive&&g.state==='active'&&g.phaseWait<=0&&
      g.cd[index]<=0&&(g.pe>=s.cost||Cheats.energy));
    const result=rtCastBase(index);
    if(ready&&s.effect)SkillRegistry.runRT(this,index);
    return result;
  };
})();
