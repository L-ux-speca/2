let lastFrame=0,accumulator=0,hudClock=0;
// Render the same logical arena at a higher physical resolution. This keeps
// detailed artwork sharp when the browser stretches the Canvas on large or
// high-density displays, without changing physics or hitbox coordinates.
(() => {
  const originalGameUI=App.gameUI.bind(App);
  App.gameUI=function(...args){
    originalGameUI(...args);
    const canvas=this.canvas,ctx=this.ctx;
    const logicalW=canvas.width,logicalH=canvas.height;
    const box=canvas.getBoundingClientRect();
    const fit=Math.min(box.width/logicalW,box.height/logicalH)||1;
    const pixelRatio=Math.min(2,Math.max(1,(window.devicePixelRatio||1)*fit));
    if(pixelRatio>1.01){
      canvas.width=Math.round(logicalW*pixelRatio);
      canvas.height=Math.round(logicalH*pixelRatio);
      ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
    }
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    // The base game binds pointer events before canvas resizing. Convert them
    // back to logical coordinates after that handler has run.
    canvas.addEventListener('pointermove',event=>{
      const bounds=canvas.getBoundingClientRect();
      const factor=Math.min(bounds.width/logicalW,bounds.height/logicalH);
      if(!factor)return;
      const w=logicalW*factor,h=logicalH*factor;
      Input.pointer={
        x:(event.clientX-bounds.left-(bounds.width-w)/2)/factor,
        y:(event.clientY-bounds.top-(bounds.height-h)/2)/factor
      };
    });
  };
})();
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
  SpriteSystem,RTBossCatalog,RTVariants,RTHub,Encyclopedia,version:'2.7.0-lunatic'};
App.home();requestAnimationFrame(frame);

