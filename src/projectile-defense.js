'use strict';

// Pure orbit-defense query. Projectile and summon hits are resolved in collisions.js.
const CombatDefense=Object.freeze({
  orbitIntercept(fight,shot,dt,orbit,fighter){
    if(orbit.owner===shot.owner||fighter.hp<=0)return false;
    const endX=shot.x+(shot.vx||0)*dt;
    const endY=shot.y+(shot.vy||0)*dt;
    const count=orbit.count||2;
    for(let n=0;n<count;n++){
      const angle=fight.g.t*5+n*Math.PI*2/count;
      const x=fighter.x+Math.cos(angle)*orbit.r;
      const y=fighter.y-45+Math.sin(angle)*orbit.r*.55;
      if(!Hitbox.sweepCircleCircle(shot.x,shot.y,endX,endY,shot.r||10,x,y,14))continue;
      fight.spark(x,y,fighter.c.color,10);
      fight.float('ОТРАЖЕНО',x,y-28,fighter.c.color);
      return true;
    }
    return false;
  }
});
