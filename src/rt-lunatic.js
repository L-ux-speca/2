'use strict';

// Araya's naval RT keeps its original Easy balance. Lunatic adds a separate
// attack director with phase-specific tactics and telegraphed crossfire.
(() => {
  const start=RT.start.bind(RT);
  RT.start=function(...args){
    start(...args);
    if(this.g?.hard){
      this.g.lunaticTimer=1.25;
      this.g.lunaticCycle=0;
      this.g.lunaticForm='ПРИЗРАЧНЫЙ ФЛОТ';
    }
  };

  const phase=RT.phase.bind(RT);
  RT.phase=function(n){
    phase(n);
    const g=this.g;if(!g?.hard)return;
    g.lunaticCycle=0;
    g.lunaticTimer=n===3?.8:1.25;
    g.lunaticForm=n===2?'АРМАДА ПЕРЕХВАТА':'КОРАБЛЬ-ПРИГОВОР';
    if(n===2){
      g.targets.push({id:'escort3',name:'Охотник флота',
        hp:160,maxHp:160,x:743,y:424,r:43,ship:true});
    }
  };

  RT.lunaticAttack=function(){
    const g=this.g,n=g.lunaticCycle++,t=this.targets();
    if(g.phase===1){
      const s=t.find(o=>o.ship)||t[0];
      if(n%3===0){
        this.announce('ПРИЗРАЧНЫЙ ПЕРЕКРЁСТНЫЙ ЗАЛП',1.15);
        const a=Math.atan2(g.y-s.y,g.x-s.x);
        this.warn('fan',{x:s.x,y:s.y,a:a-.26,spread:1.1,n:21},.86);
        this.warn('fan',{x:s.x,y:s.y,a:a+.34,spread:1.1,n:19},1.27);
      }else if(n%3===1){
        this.announce('АРТИЛЛЕРИЙСКИЕ МЕТКИ',1.15);
        this.warn('mortar',{x:clamp(g.x+g.dx*85,60,920),
          y:clamp(g.y+g.dy*85,135,550),r:40},1.0);
        this.warn('mortar',{x:clamp(g.x-g.dx*55+75,60,920),
          y:clamp(g.y-g.dy*55-60,135,550),r:37},1.44);
      }else{
        this.announce('ФАЛЬКОНЕТЫ · НОЖНИЦЫ');
        this.warn('fan',{x:s.x,y:s.y,
          a:Math.atan2(g.y-s.y,g.x-s.x),spread:.65,n:17,falcon:true},.86);
      }
    }else if(g.phase===2){
      const escorts=t.filter(s=>s.id.startsWith('escort'));
      this.announce(n%2?'ПОГОНЯ ЭСКОРТА':'ОГОНЬ С ДВУХ БОРТОВ',1.2);
      for(let i=0;i<Math.min(escorts.length,3);i++){
        const s=escorts[i],a=Math.atan2(g.y-s.y,g.x-s.x);
        this.warn('fan',{x:s.x,y:s.y,a,spread:.72,n:15},.85+i*.24);
      }
      if(n%2===0)this.warn('mortar',{x:clamp(g.x+45,70,910),
        y:clamp(g.y-45,125,555),r:38},1.52);
    }else{
      const hull=t.find(s=>s.ship)||t[0];
      if(n%3===0){
        this.announce('СУД КАПИТАНА · ТРИ ПРИГОВОРА');
        this.warn('mark',{x:g.x,y:g.y,r:40},1.38);
        this.warn('mortar',{x:clamp(g.x+105,40,920),
          y:clamp(g.y+68,125,555),r:41},1.62);
      }else if(n%3===1){
        this.announce('АРТИЛЛЕРИЙСКАЯ РЕШЁТКА');
        // Two lanes are threatened; the remaining corridor stays open.
        const lane=Math.floor(clamp((g.y-135)/70,0,5));
        for(const k of [lane,(lane+2)%6])this.warn('corridor',{
          x:hull.x,y:157+k*70,r:12},.88+(k%2)*.34);
      }else{
        this.announce('ФЛАГМАН · ПОСЛЕДНИЙ БОРТОВОЙ ЗАЛП');
        const a=Math.atan2(g.y-hull.y,g.x-hull.x);
        this.warn('fan',{x:hull.x,y:hull.y,a,spread:1.2,n:27},.82);
        this.warn('fan',{x:hull.x,y:hull.y,a:a+.23,spread:1.15,n:25},1.24);
      }
    }
  };

  const step=RT.step.bind(RT);
  RT.step=function(dt){
    step(dt);
    const g=this.g;
    if(!g?.hard||g.state!=='active'||App.paused||g.phaseWait>0)return;
    const hunter=g.targets.find(t=>t.id==='escort3'&&t.hp>0);
    if(hunter){
      hunter.x=741+Math.sin(g.t*1.37)*81;
      hunter.y=410+Math.cos(g.t*1.77)*115;
    }
    g.lunaticTimer-=dt;
    if(g.lunaticTimer<=0){
      g.lunaticTimer=g.phase===1?1.74:g.phase===2?1.45:1.19;
      this.lunaticAttack();
    }
  };

  const draw=RT.draw.bind(RT);
  RT.draw=function(){
    draw();
    const g=this.g,ctx=App.ctx;
    if(!g?.hard||!ctx||g.state==='transition')return;
    const boss=g.targets.find(t=>t.ship&&t.hp>0);
    if(boss){
      ctx.save();ctx.globalAlpha=.48;
      circle(ctx,boss.x,boss.y,boss.r+21+Math.sin(g.t*4)*5,
        g.phase===3?'#f4c38b':'#baa4fc',true,2);
      ctx.restore();
    }
    canvasText(ctx,'LUNATIC · '+g.lunaticForm,480,80,13,'#eed4b1');
  };
})();
