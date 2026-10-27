'use strict';

// Lapis's third skill launches a physical, harmless magnetic anchor.
// A double tap teleports to its *current* position rather than a pre-set spot.
const LapisAnchor=Object.freeze({
  move(fight,dt){
    for(const anchor of fight.g.e){
      if(anchor.kind!=='magnetAnchor'||anchor.life<=0)continue;
      const owner=fight.g.f[anchor.owner];
      if(owner?.magnet?.anchorId!==anchor.anchorId){anchor.life=0;continue}
      anchor.x+=anchor.vx*dt;
      if(!fight.ruleArenaEndless()&&(anchor.x<32||anchor.x>1068)){
        anchor.x=clamp(anchor.x,32,1068);anchor.vx=0;
      }
      owner.magnet.x=anchor.x;
      owner.magnet.y=anchor.y+50;
      owner.magnet.time=anchor.life;
    }
  },
  clean(fight){
    for(const fighter of fight.g.f)if(fighter.magnet&&!fight.g.e.some(e=>
      e.kind==='magnetAnchor'&&e.owner===fighter.side&&
      e.anchorId===fighter.magnet.anchorId&&e.life>0))fighter.magnet=null;
  }
});
(() => {
  CombatHooks.onAfterCast((fight,f,skillIndex)=>{
    if (f.id !== 'lapis' || skillIndex !== 2) return;

    // Recasting with cooldown cheats should not leave multiple active anchors.
    for (const previous of fight.g.e) {
      if (previous.kind === 'magnetAnchor' && previous.owner === f.side)
        previous.life = 0;
    }
    fight.g.anchorSerial = (fight.g.anchorSerial || 0) + 1;
    const anchor = fight.entity(f, {
      kind: 'magnetAnchor',
      anchorId: fight.g.anchorSerial,
      x: f.x + f.face * 36,
      y: f.y - 50,
      vx: f.face * 480,
      vy: 0,
      r: 12,
      life: 4,
      dmg: 0,
      shape: 'orb'
    });
    f.magnet = {
      anchorId: anchor.anchorId,
      x: anchor.x,
      y: anchor.y + 50,
      time: anchor.life
    };
    fight.spark(anchor.x, anchor.y, f.c.color, 10);
  });

  const drawEntityBase = Fight.drawEntity.bind(Fight);
  Fight.drawEntity = function(ctx, e) {
    if (e.kind !== 'magnetAnchor') return drawEntityBase(ctx, e);
    const direction = Math.sign(e.vx) || this.g.f[e.owner].face || 1;
    ctx.save();
    const pulse = 1 + Math.sin(this.g.t * 13) * .12;
    glow(ctx, e.color, 12);
    line(ctx, e.x - direction * 36, e.y, e.x - direction * 9, e.y, e.color + '75', 4);
    circle(ctx, e.x, e.y, 14 * pulse, e.color + '44');
    circle(ctx, e.x, e.y, 11 * pulse, e.color, true, 3);
    circle(ctx, e.x, e.y, 4, '#e9ffff');
    ctx.restore();
  };
})();
