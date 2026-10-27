let lastFrame=0,accumulator=0,hudClock=0;
function frame(ms){
  const dt=Math.min(.1,Math.max(0,(ms-lastFrame)/1000||0));
  lastFrame=ms;App.homeTime+=dt;accumulator+=dt;
  let count=0;
  while(accumulator>=1/60&&count<5){
    if(App.screen==='fight')Fight.step(1/60);
    else if(App.screen==='rt'){
      if(RTVariants.g)RTVariants.step(1/60);else RT.step(1/60);
    }
    if(!App.paused&&!document.hidden)AudioSys.tick(1/60);
    Input.end();accumulator-=1/60;count++;
  }
  if(count===5)accumulator=0;
  if(App.screen==='home')homeDraw(dt);
  else if(App.screen==='fight')Fight.draw();
  else if(App.screen==='rt'){
    if(RTVariants.g)RTVariants.draw();else RT.draw();
  }
  requestAnimationFrame(frame);
}
// Read-only diagnostics for local verification and save-file compatibility.
window.TokyoDawn=window.Clash={App,Fight,RT,Builder,Net,CHARS,RULES,Input,Cheats,
  Hitbox,CombatHooks,CombatCollisions,CharacterCatalog,ArenaCatalog,SkillRegistry,
  SpriteSystem,RTBossCatalog,RTVariants,RTHub,Encyclopedia,version:'2.5.0-multi-rt'};
App.home();requestAnimationFrame(frame);

