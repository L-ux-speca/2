'use strict';

(() => {
  // Standard shots formerly made the player a generic gunship. Every call
  // with explicit damage/parameters is an actual hero or authored technique.
  const shootTechnique = RT.shoot.bind(RT);
  RT.shoot = function(...args) {
    if (args.length === 0) return; // Remove automatic / Space gunfire.
    return shootTechnique(...args);
  };

  // Boss durability was balanced for ~15 free shots/s. With only techniques,
  // damage must be appreciably higher to keep all three phases winnable.
  const originalHitTarget = RT.hitTarget.bind(RT);
  RT.hitTarget = function(target, amount) {
    return originalHitTarget(target, amount * 2.35);
  };

  function trackRTPE(g) {
    let pe = g.pe;
    Object.defineProperty(g, 'pe', {
      configurable: true, enumerable: true,
      get() { return pe; },
      set(next) {
        if (!Number.isFinite(next)) return;
        if (next < pe && g.state === 'active' && !Cheats.energy)
          g.peSpent += pe - next;
        pe = next;
      }
    });
  }

  const originalStart = RT.start.bind(RT);
  RT.start = function(...args) {
    originalStart(...args);
    if (this.g) {
      this.g.visualTraces = [];
      this.g.peSpent = 0;
      trackRTPE(this.g);
    }
  };

  // Skill damage is dealt by the character's ability, and the trajectory is
  // visibly communicated instead of being an invisible instant HP change.
  const originalCast = RT.cast.bind(RT);
  RT.cast = function(index) {
    const g = this.g, skill = g?.c.skills[index];
    if (!g || !skill || skill.passive || g.state !== 'active' || g.phaseWait > 0 || g.cd[index] > 0) return;
    const revolverOn = g.c.id === 'kisei' && index === 3 &&
      g.activeAbilities?.some(effect => effect.kind === 'revolver' && effect.life > 0);
    if (g.pe < (revolverOn ? 4 : skill.cost) && !Cheats.energy) return;
    const target = this.target();
    originalCast(index);
    g.visualTraces ??= [];
    if (g.c.id === 'lapis' && index === 1 && target) {
      g.visualTraces.push({kind:'rail',targetId:target.id,x:g.x,y:g.y,
        toX:target.x,toY:target.y,expires:g.t+.31,started:g.t,color:'#bceffc'});
      this.spark(target.x, target.y, '#dcfaff', 24);
    }
    if (g.c.id === 'akira' && index <= 1 && target) {
      g.visualTraces.push({kind:'blood',targetId:target.id,x:g.x,y:g.y,
        toX:target.x,toY:target.y,expires:g.t+(index===0?2.1:.5),started:g.t,color:'#fb5a7b'});
      this.spark(g.x, g.y, '#df4166', 12);
    }
  };

  const originalStep = RT.step.bind(RT);
  RT.step = function(dt) {
    originalStep(dt);
    const g = this.g;
    if (!g) return;
    g.visualTraces = (g.visualTraces || []).filter(trace => trace.expires > g.t);
    if (g.state !== 'active' || App.paused) return;
    // Sonic's self-accelerating technique previously only made free gunfire
    // faster; after removing basic shots it now increases mobility directly.
    if (g.activeAbilities?.some(effect => effect.kind === 'speed' && effect.life > 0)) {
      g.x = clamp(g.x + g.dx * dt * 160, 24, 936);
      g.y = clamp(g.y + g.dy * dt * 160, 110, 572);
    }
  };

  const originalDraw = RT.draw.bind(RT);
  RT.draw = function() {
    originalDraw();
    const g = this.g, ctx = App.ctx;
    if (!g || !ctx || !g.visualTraces?.length) return;
    ctx.save();
    for (const trace of g.visualTraces) {
      const target = g.targets.find(t => t.id === trace.targetId && t.hp > 0);
      const endX = target?.x ?? trace.toX;
      const endY = target?.y ?? trace.toY;
      const remaining = Math.max(0, trace.expires - g.t);
      const life = trace.expires - trace.started;
      ctx.globalAlpha = Math.min(1, remaining / .2);
      if (trace.kind === 'rail') {
        ctx.strokeStyle = '#bceffc'; ctx.lineWidth = 12 * remaining / life + 2;
        ctx.shadowColor = '#71dbff'; ctx.shadowBlur = 24;
        ctx.beginPath(); ctx.moveTo(trace.x, trace.y); ctx.lineTo(endX, endY); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(trace.x, trace.y); ctx.lineTo(endX, endY); ctx.stroke();
      } else if (trace.kind === 'blood') {
        ctx.shadowColor = '#ff335a'; ctx.shadowBlur = 12; ctx.strokeStyle = '#d63f62';
        ctx.lineWidth = 6 + Math.sin(g.t * 22) * 2;
        ctx.beginPath(); ctx.moveTo(g.x, g.y);
        const bend = Math.sin(g.t * 10) * 35;
        ctx.bezierCurveTo((g.x + endX) / 2, g.y + bend,
          (g.x + endX) / 2, endY - bend, endX, endY);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  const originalPhase = RT.phase.bind(RT);
  RT.phase = function(...args) {
    originalPhase(...args);
    if (this.g) this.g.visualTraces = [];
  };

  const originalReturn = RT.returnResult.bind(RT);
  RT.returnResult = function(won) {
    const g = this.g;
    if (g && !g.test && Fight.g?.stats) {
      Fight.g.stats.peSpent = (Fight.g.stats.peSpent || 0) + (g.peSpent || 0);
      Fight.g.stats.damage += g.damage || 0;
      Fight.g.t += g.t;
    }
    originalReturn(won);
  };

  const originalCustomStep = RT.customStep.bind(RT);
  RT.customStep = function(step) {
    return originalCustomStep({...step,
      power:1 + (step.power - 1) * 1.75,
      range:1 + (step.range - 1) * 1.4});
  };
})();

