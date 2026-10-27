// Combat-feel pass: responsive chains, real defensive timing, and readable contact.
(() => {
  const createFighter = Fight.makeF.bind(Fight);
  Fight.makeF = function(id, side) {
    const f = createFighter(id, side);
    f.basicChain = {stage:0, confirmed:false, expires:0};
    f.dashTime=0; f.dashCD=0; f.dashVX=0; f.parryCD=0;
    return f;
  };

  const newRound = Fight.newRound.bind(Fight);
  Fight.newRound = function(...args) {
    Input.buffers=[{},{}];
    const result = newRound(...args);
    this.g.impacts=[];
    if(this.g.mode==='training')this.g.coach={enabled:readStore('clash-coach-v1',true),
      phase:0,origin:this.g.f[0].x,basicHit:false,skillUsed:false};
    return result;
  };

  Fight.canChain = function(f, action) {
    const c=f.basicChain;
    if(!['punch','kick'].includes(action)||!c||!c.confirmed||c.stage>=3||
       this.g?.state!=='active'||this.g.t>c.expires||f.stun>0||f.block||f.recovery>.32) return false;
    // Do not cancel the windup or active frames before the hit has resolved.
    return !f.attack||f.attack.t>=f.attack.startup+f.attack.active;
  };

  const strike = Fight.attack.bind(Fight);
  Fight.attack = function(f, kind) {
    if(!['punch','kick'].includes(kind)) return strike(f,kind);
    const chain=this.canChain(f,kind), old=f.attack;
    if(chain) f.recovery=0;
    strike(f,kind);
    if(f.attack===old||f.attack?.kind!==kind) return;
    const stage=chain?Math.min(3,f.basicChain.stage+1):1;
    f.basicChain={stage,confirmed:false,expires:this.g.t+.86};
    f.attack.chainStage=stage;
    f.attack.startup=kind==='punch'?.075:.115;
    f.attack.active=kind==='punch'?.135:.15;
    f.recovery=(kind==='punch'?.38:.5)*(stage===3?1.12:1);
    if(stage>1) {
      this.spark(f.x+f.face*33,f.y-60,f.c.color,7);
      if(stage===3) this.float('ФИНАЛ СЕРИИ',f.x,f.y-128,f.c.color);
    }
  };

  const applyDamage = Fight.damage.bind(Fight);
  Fight.damage = function(target, amount, owner, options={}) {
    if(!target||!owner||!this.g) return false;
    const basic=owner.attack?.chainStage>0&&options.level&&
       (options.kb===70||options.kb===150);
    const stage=basic?owner.attack.chainStage:1;
    const opts=basic?{...options,kb:options.kb*(stage===3?1.6:stage===2?1.12:1)}:options;
    const value=basic?amount*(stage===2?1.08:stage===3?1.16:1):amount;
    const originalHp=target.hp;
    const readyParry=(target.parryCD||0)<=0&&target.block&&target.blockTime<.12&&
      target.guardLock<=0&&!opts.unblockable&&target.face*(owner.x-target.x)>0&&!(target.st?.inv>0);
    // Quick block tapping is not an infinite perfect-block strategy.
    if(!readyParry&&target.block&&target.blockTime<.12&&(target.parryCD||0)>0)
      target.blockTime=.13;
    const hit=applyDamage(target,value,owner,opts);
    if(!hit) return hit;
    if(readyParry){
      target.parryCD=.88;
      target.pe=Math.min(target.c.pe,target.pe+3);
      target.guard=Math.min(100,target.guard+8);
      owner.recovery=Math.max(owner.recovery||0,.22);
      this.g.hitstop=Math.max(this.g.hitstop,.072);
      const label=this.g.texts?.findLast?.(t=>t.t==='ИДЕАЛЬНЫЙ БЛОК');
      if(label) label.t='ПАРИРОВАНИЕ!';
      this.spark(target.x,target.y-58,'#d8fff5',18);
      AudioSys.sfx('parry');
    }
    if(basic&&owner.basicChain){
      owner.basicChain.confirmed=true;
      owner.basicChain.expires=this.g.t+.86;
      if(target.hp<originalHp)target.stun=Math.max(target.stun,stage===3?.19:.12);
      if(owner.side===0&&target.side===1&&this.g.coach)this.g.coach.basicHit=true;
    }
    if(originalHp>target.hp){
      const heavy=originalHp-target.hp>=19||stage===3;
      this.g.hitstop=Math.max(this.g.hitstop,heavy?.085:basic?.052:.045);
      const impacts=this.g.impacts??(this.g.impacts=[]);
      impacts.push({x:target.x,y:target.y-52,life:heavy?.31:.23,total:heavy?.31:.23,
        heavy,color:owner.c?.color||'#e7d9b9'});
      if(impacts.length>24)impacts.shift();
    }
    return hit;
  };

  const visualStep=Fight.visualStep.bind(Fight);
  Fight.visualStep=function(dt){
    visualStep(dt);
    for(const f of this.g?.f||[])f.parryCD=Math.max(0,(f.parryCD||0)-dt);
    if(this.g?.impacts)this.g.impacts=this.g.impacts.filter(p=>(p.life-=dt)>0);
    const g=this.g,c=g?.coach,f=g?.f?.[0];
    if(c?.enabled&&f&&g.state==='active'&&c.phase<5){
      const complete=[()=>Math.abs(f.x-c.origin)>55,()=>c.basicHit,
        ()=>f.basicChain?.stage===3,()=>f.dashTime>0,()=>c.skillUsed][c.phase];
      if(complete?.()){c.phase++;AudioSys.sfx('target')}
    }
  };

  const cast=Fight.cast.bind(Fight);
  Fight.cast=function(f,i){
    const success=cast(f,i);
    if(success&&f.side===0&&this.g?.coach)this.g.coach.skillUsed=true;
    return success;
  };

  const originalTrainingUI=Fight.trainingUI.bind(Fight);
  Fight.trainingUI=function(){
    originalTrainingUI();
    if(this.g?.mode!=='training')return;
    const toolbar=document.querySelector('#trainingTools');
    if(toolbar){
      const toggle=document.createElement('button');
      toggle.textContent='Подсказки: '+(this.g.coach?.enabled?'ВКЛ':'ВЫКЛ');
      toggle.addEventListener('click',()=>{
        const coach=this.g?.coach;if(!coach)return;
        coach.enabled=!coach.enabled;saveStore('clash-coach-v1',coach.enabled);
        this.trainingUI();
      });
      toolbar.append(toggle);
    }
  };

  const sfx=AudioSys.sfx.bind(AudioSys);
  AudioSys.sfx=function(kind){
    if(kind==='dash')return this.tone(375,.09,'triangle',.085);
    if(kind==='parry'){
      this.tone(780,.16,'triangle',.13);
      this.tone(1170,.07,'sine',.045);
      return;
    }
    if(kind==='hit'){
      this.tone(102,.095,'sawtooth',.155);
      this.tone(64,.14,'triangle',.072);
      return;
    }
    if(kind==='block'){
      this.tone(390,.065,'square',.065);
      this.tone(640,.045,'triangle',.07);
      return;
    }
    sfx(kind);
  };

  const setupGame=App.gameUI.bind(App);
  App.gameUI=function(rt=false){
    setupGame(rt);
    if(rt)return;
    const badge=document.createElement('div');
    badge.id='dashStatus';badge.className='dash-status ready';
    badge.innerHTML='<b>РЫВОК ГОТОВ</b>2× направление';
    document.querySelector('.combat-footer .control-hint')?.before(badge);
  };

  const updateHUD=Fight.updateHUD.bind(Fight);
  Fight.updateHUD=function(){
    updateHUD();
    const e=document.querySelector('#dashStatus');
    if(!e||!this.g?.f?.length)return;
    const f=this.g.f[this.g.mode==='online'&&Net.role==='client'?1:0];
    const ready=(f.dashCD||0)<=.001;
    e.classList.toggle('ready',ready);
    e.innerHTML=ready?'<b>РЫВОК ГОТОВ</b>2× направление':
      `<b>РЫВОК · ${f.dashCD.toFixed(1)} с</b>перезарядка`;
  };

  const combatDraw=Fight.draw.bind(Fight);
  Fight.draw=function(){
    combatDraw();
    const g=this.g,ctx=App.ctx;
    if(!g||!ctx||!['active','ko','finisher'].includes(g.state))return;
    const xAt=x=>550+(x-g.cam.x)*g.cam.zoom;
    const yAt=y=>460+(y-460)*g.cam.zoom;
    ctx.save();
    for(const f of g.f){
      if((f.dashTime||0)>0&&Pref.effects){
        ctx.globalAlpha=.15+.11*Math.sin(g.t*36)**2;
        ctx.fillStyle=f.c.color;
        ctx.beginPath();ctx.ellipse(xAt(f.x)-f.face*35,yAt(f.y-49),20,53,-.1,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=1;
      }
      const a=f.attack;
      if(a&&Pref.effects){
        const active=a.t>=a.startup&&a.t<a.startup+a.active;
        const windup=a.t<a.startup;
        const px=xAt(f.x+f.face*(a.kind==='punch'?57:66)),py=yAt(f.y-(a.kind==='punch'?62:28));
        ctx.strokeStyle=active?f.c.color:windup?'#f4e0b4':'#95a7b3';
        ctx.globalAlpha=active?.86:windup?.33:.14;
        ctx.lineWidth=active?5:2.5;
        ctx.beginPath();ctx.arc(px,py,active?23:16,f.face>0?-1.4:1.74,f.face>0?1.4:4.54);ctx.stroke();
        ctx.globalAlpha=1;
      }
      if(f.basicChain?.stage>=2&&g.t<=f.basicChain.expires){
        const fade=clamp((f.basicChain.expires-g.t)*2,0,1);
        ctx.globalAlpha=fade;
        ctx.font='bold 16px system-ui';ctx.textAlign='center';
        ctx.fillStyle='#09171c';ctx.fillText(`${f.basicChain.stage} × СЕРИЯ`,xAt(f.x)+1,yAt(f.y-139)+1);
        ctx.fillStyle=f.c.color;ctx.fillText(`${f.basicChain.stage} × СЕРИЯ`,xAt(f.x),yAt(f.y-139));
        ctx.globalAlpha=1;
      }
    }
    if(Pref.effects)for(const p of g.impacts||[]){
      const k=1-p.life/p.total,px=xAt(p.x),py=yAt(p.y);
      ctx.globalAlpha=(1-k)*(p.heavy?.9:.7);
      ctx.lineWidth=p.heavy?4:2;ctx.strokeStyle=p.color;
      ctx.beginPath();ctx.arc(px,py,(p.heavy?8:5)+k*(p.heavy?42:27),0,Math.PI*2);ctx.stroke();
      for(let i=0;i<(p.heavy?8:4);i++){
        const a=i*Math.PI/(p.heavy?4:2);
        ctx.beginPath();ctx.moveTo(px+Math.cos(a)*16,py+Math.sin(a)*16);
        ctx.lineTo(px+Math.cos(a)*(21+k*38),py+Math.sin(a)*(21+k*38));ctx.stroke();
      }
    }
    ctx.restore();
    if(g.mode==='training'){
      ctx.save();ctx.fillStyle='#c2dfd9';ctx.textAlign='left';ctx.font='11px system-ui';
      ctx.fillText('Серии: удар → удар → нога · рывок: двойное направление · парирование: блок в последний момент',20,118);
      if(g.coach?.enabled){
        const prompts=['1/5 · Пройди несколько шагов влево или вправо',
          '2/5 · Попади обычным ударом (Z или X)',
          '3/5 · Продолжай попадания до серии из трёх ударов',
          '4/5 · Сделай рывок двойным нажатием направления',
          '5/5 · Примени любую технику персонажа (1–4)',
          'Тренировка пройдена! Попробуй защиту и авторские приёмы.'];
        ctx.font='bold 13px system-ui';
        ctx.fillStyle=g.coach.phase>=5?'#b4efd7':'#f4d59c';
        ctx.fillText(prompts[g.coach.phase],20,139);
      }
      ctx.restore();
    }
  };

  const showHelp=App.help.bind(App);
  App.help=function(){
    showHelp();
    const box=document.querySelector('#modalRoot .help-note');
    if(box)box.insertAdjacentHTML('beforebegin',
      '<p class="help-note"><b>Новые приёмы боя:</b> дважды быстро нажми направление для рывка (перезарядка 0,7 с). Попадание кулаком или ногой позволяет продолжить серию до трёх ударов; последняя атака сильнее отбрасывает. Идеальный блок в первые 0,12 с даёт немного ПЭ и замедляет нападающего, но затем 0,9 с нельзя парировать повторно. Подсказки по сериям есть в тренировке.</p>');
  };
})();

