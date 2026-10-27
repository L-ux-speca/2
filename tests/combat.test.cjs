'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scriptPaths=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
const scripts=scriptPaths.map(name=>fs.readFileSync(path.join(root,name),'utf8'));
const allJs=scripts.join('\n');
assert.ok(scriptPaths.length>=15,'Game loads as ordered external JavaScript files');
assert.ok(Buffer.byteLength(html)<10000,'index.html only wires up modular scripts and layout');
for(const name of [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m=>m[1]))
  assert.ok(fs.statSync(path.join(root,name)).size>100,'Every linked stylesheet exists');
for(const text of ['CLASH OF CHAMPIONS','THESEUS EDITION','Время выйти на арену',
  'Проклятая энергия. Точный удар.','14 бойцов. Свои правила.',
  '14 оригинальных портретов · без потери качества'])
  assert.ok(!`${html}${allJs}`.includes(text),`Outdated UI copy removed: ${text}`);
assert.ok(`${html}${allJs}`.includes('Tokyo Dawn'),'Tokyo Dawn is the visible title');
const ctx=vm.createContext({
  console,Math,Date,Promise,Map,Set,JSON,structuredClone,
  setTimeout,clearTimeout,performance:{now:()=>10},
  localStorage:{getItem:()=>null,setItem:()=>{}},
  window:{addEventListener:()=>{}},
  addEventListener:()=>{},
  document:{querySelector:()=>null,querySelectorAll:()=>[],addEventListener:()=>{}}
});
// The last script starts the animation loop; execute game definitions only.
for(let i=0;i<scripts.length-1;i++)new vm.Script(scripts[i],{filename:`script-${i}`}).runInContext(ctx);
vm.runInContext(`AudioSys.sfx=()=>{};AudioSys.tone=()=>{};
  App.gameUI=()=>{};App.showSkills=()=>{};App.announce=()=>{};
  Fight.updateHUD=()=>{};Fight.trainingUI=()=>{};
  App.screen='fight';App.paused=false;`,ctx);
function evalGame(code){return vm.runInContext(code,ctx)}
function battle(p1='lapis',p2='caesar'){
  evalGame(`Fight.start({mode:'training',p1:'${p1}',p2:'${p2}',arena:'cyber_arena',
    rounds:1,rules:[],difficulty:'easy'});Fight.g.state='active';
    Fight.g.f[0].x=330;Fight.g.f[1].x=395;
    Fight.g.f[0].face=1;Fight.g.f[1].face=-1;`);
}
const tick=(n=1)=>{for(let i=0;i<n;i++)evalGame('Fight.step(1/60);Input.end()')};

assert.equal(evalGame('CHARS.length'),14);
for(const id of evalGame('CHARS.map(c=>c.id)')){
  const ext=id==='lapis'?'png':'jpg';
  assert.ok(fs.statSync(path.join(root,'assets','portraits',`${id}.${ext}`)).size>10000);
}

battle();
evalGame("Input.held.add('KeyD')");
tick();
let speed=evalGame('Fight.g.f[0].vx');
assert.ok(speed>0&&speed<225,'Movement starts smoothly instead of full speed instantly');
tick(14);
assert.ok(evalGame('Fight.g.f[0].vx')>220,'Acceleration approaches fighter speed rapidly');
evalGame("Input.held.delete('KeyD')");
tick(12);
assert.ok(Math.abs(evalGame('Fight.g.f[0].vx'))<1,'Braking finishes promptly');

battle();
evalGame("Input.double.add('KeyD')");
const startX=evalGame('Fight.g.f[0].x');
tick();
assert.ok(evalGame('Fight.g.f[0].x')-startX>9,'Double direction must dash');
assert.ok(evalGame('Fight.g.f[0].dashCD')>.6,'Dash has a genuine cooldown');
assert.ok(evalGame('Fight.g.f[0].dashTime')>0,'Dash animation has duration');

battle();
evalGame("Input.pressed.add('KeyZ')");
tick(15);
assert.ok(evalGame('Fight.g.f[0].basicChain.confirmed'),'Basic hit enables next combo hit');
assert.equal(evalGame('Fight.g.f[0].basicChain.stage'),1);
evalGame("Input.pressed.add('KeyX')");
tick(12);
assert.equal(evalGame('Fight.g.f[0].basicChain.stage'),2,'Buffered kick chains into second hit');
evalGame("Input.pressed.add('KeyZ')");
tick(25);
assert.equal(evalGame('Fight.g.f[0].basicChain.stage'),3,'Chain supports a three-hit finisher');

battle();
evalGame(`Fight.g.f[1].block=true;Fight.g.f[1].blockTime=.04;
  Fight.g.f[1].face=-1;`);
let parried=evalGame(`Fight.damage(Fight.g.f[1],10,Fight.g.f[0],{level:'high',kb:70})`);
assert.ok(parried);
assert.equal(evalGame('Fight.g.f[1].hp'),evalGame('Fight.g.f[1].maxHp'),'Perfect block negates HP loss');
assert.ok(evalGame('Fight.g.f[1].parryCD')>.7,'Parry enforces an anti-spam cooldown');
evalGame('Fight.g.f[1].blockTime=.01');
evalGame(`Fight.damage(Fight.g.f[1],10,Fight.g.f[0],{level:'high',kb:70})`);
assert.ok(evalGame('Fight.g.f[1].hp')<evalGame('Fight.g.f[1].maxHp'),
  'Second immediate block must not be another free parry');

battle();
evalGame(`Fight.g.hitstop=.075;Input.pressed.add('KeyZ')`);
tick();
assert.ok(evalGame('Input.buffers[0].punch')>evalGame('Fight.g.t'),
  'Pressing during freeze stores the input');
tick(7);
assert.ok(evalGame('Fight.g.f[0].attack?.kind')==='punch',
  'Buffered hitstop input plays once simulation resumes');

battle('lapis','caesar');
evalGame(`Fight.g.f[0].x=300;Fight.g.f[1].x=550;Fight.g.f[0].face=1;
  Fight.cast(Fight.g.f[0],2)`);
const anchor=()=>evalGame("Fight.g.e.find(e=>e.kind==='magnetAnchor')");
assert.equal(anchor().dmg,0,'Flying magnetic anchor is explicitly harmless');
assert.ok(anchor().vx>0,'Anchor flies horizontally toward the enemy');
assert.ok(evalGame('Fight.g.f[0].magnet')?.anchorId,'Lapis tracks the actual launched projectile');
const originX=anchor().x;
const enemyHP=evalGame('Fight.g.f[1].hp');
tick(25);
assert.ok(anchor().x>originX+160,'Anchor moves across the arena over time');
assert.equal(evalGame('Fight.g.f[1].hp'),enemyHP,'Anchor passing through enemy inflicts no damage');
const destination=anchor().x;
evalGame("Fight.g.f[1].x=850;Input.double.add('KeyD')");
tick();
assert.equal(evalGame('Fight.g.f[0].dashTime'),0,'Lapis teleport takes priority over dash');
assert.ok(Math.abs(evalGame('Fight.g.f[0].x')-destination)<2,
  'Lapis teleports to the projectile current position, not a static marker');
assert.equal(evalGame('Fight.g.f[0].magnet'),null,'Teleport consumes the magnetic anchor');
assert.ok(!anchor(),'Used anchor is removed from the arena');

battle('lapis','caesar');
evalGame('Fight.g.f[0].x=260;Fight.g.f[0].y=260;Fight.g.f[0].grounded=false;Fight.cast(Fight.g.f[0],2)');
tick(3);
const airAnchorY=anchor().y;
evalGame("Fight.g.f[1].x=950;Input.double.add('KeyD')");
tick();
assert.ok(Math.abs(evalGame('Fight.g.f[0].y')-(airAnchorY+50))<25,
  'Magnetic teleport also follows an airborne projectile');

battle('lapis','caesar');
evalGame('Fight.cast(Fight.g.f[0],2)');
tick(255);
assert.equal(evalGame('Fight.g.f[0].magnet'),null,'Expired anchor cannot be used for teleport');

assert.ok(allJs.includes("if(this.ruleArenaEndless()){ctx.translate(550,460)"),
  'Only the actual endless arena may scroll or zoom the fighters');
assert.ok(allJs.includes('id=\'dashStatus\''),'Dash state appears in fight HUD');

battle();
evalGame('Fight.g.f[0].x=55;Fight.g.f[1].x=1050');
tick(25);
assert.equal(evalGame('Fight.g.cam.zoom'),1,'Regular arena has a fixed scale');
assert.equal(evalGame('Fight.g.cam.x'),550,'Regular arena does not drift with fighters');
evalGame("Fight.g.cfg.arena='endless_plain'");
tick(25);
assert.ok(evalGame('Fight.g.cam.zoom')<1,'Only Endless Plain uses the far-out camera');

battle('lapis','araya');
evalGame("Fight.g.mode='cpu';Fight.g.rtGauge=0;Fight.g.f[1].hp=100");
tick();
assert.ok(Math.abs(evalGame('Fight.g.rtGauge')-2.1/60)<.003,'Araya gauge grows slower');
evalGame("Fight.damage(Fight.g.f[1],20,Fight.g.f[0],{unblockable:true})");
assert.ok(Math.abs(evalGame('Fight.g.rtGauge')-(2.1/60+6))<.05,
  'Damage contribution to Araya RT gauge is reduced');

battle('mechamaru','caesar');
assert.ok(evalGame('Fight.cast(Fight.g.f[0],2)'), 'Mechamaru can summon his puppet');
const robot=()=>evalGame("Fight.g.e.find(e=>e.kind==='summon'&&e.shape==='robot')");
assert.equal(robot().x,550,'Puppet must appear in the center of the arena');
assert.equal(robot().hp,55,'Puppet has its own 55 HP');
assert.equal(robot().stationary,true,'Unoccupied puppet must remain stationary');
assert.equal(evalGame('Fight.cast(Fight.g.f[0],2)'),false,
  'Cannot spawn a second suit while a puppet already exists');
tick(45);
assert.equal(robot().x,550,'Puppet does not walk around on its own');
evalGame("Fight.g.f[0].x=530;Input.pressed.add('KeyE')");
tick();
assert.ok(evalGame('Fight.g.f[0].robot'),'Mechamaru can enter the suit near it');
assert.equal(evalGame('Fight.g.f[0].shield.hp'),55);
assert.ok(!robot(),'The empty puppet disappears once occupied');
tick(15);
const beforeSuitHit=evalGame('Fight.g.f[0].hp');
evalGame(`Fight.damage(Fight.g.f[0],15,Fight.g.f[1],{x:480,y:410})`);
assert.equal(evalGame('Fight.g.f[0].hp'),beforeSuitHit,
  'Armor absorbs damage before the fighter loses HP');
assert.equal(evalGame('Fight.g.f[0].shield.hp'),40,
  'Puppet armor has its own destructible health');
evalGame("Input.pressed.add('KeyE')");
tick();
assert.equal(evalGame('Fight.g.f[0].robot'),false,'Mechamaru can leave the suit');
assert.equal(robot()?.hp,40,'A physical puppet keeps its remaining health after dismounting');

battle('sonic','caesar');
assert.ok(evalGame('Fight.cast(Fight.g.f[0],1)'));
const clone=()=>evalGame("Fight.g.e.find(e=>e.kind==='summon'&&e.shape==='clone'&&e.hp>0)");
assert.equal(evalGame("Fight.g.e.filter(e=>e.kind==='summon').length"),3);
assert.equal(clone().maxHp,10,'Every clone has a separate health pool');
evalGame(`(() => {const s=Fight.g.e.find(e=>e.kind==='summon');
  Fight.projectile(Fight.g.f[1],{x:s.x-70,y:s.y-49,vx:4800,dmg:4,r:5,life:1});
})()`);
evalGame('Fight.entitiesStep(1/60)');
assert.ok(clone().hp<10,'High-speed projectile damages summon hitboxes');
evalGame(`(() => {const s=Fight.g.e.find(e=>e.kind==='summon'&&e.hp>0);
  Fight.area(Fight.g.f[1],{x:s.x,y:s.y-50,r:55,dmg:20,life:.3});
})()`);
evalGame('Fight.entitiesStep(1/60)');
assert.ok(evalGame("Fight.g.e.some(e=>e.kind==='summon'&&e.hp<=0)" )===false,
  'Destroyed summons are cleaned up from active entities');

battle('airi','caesar');
evalGame('Fight.cast(Fight.g.f[0],2)');
evalGame('Fight.g.tasks.splice(0).forEach(task=>task.fn())');
const spikes=evalGame("Fight.g.e.filter(e=>e.kind==='projectile'&&e.shape==='spike').map(e=>({x:e.x,y:e.y,vx:e.vx}))");
assert.equal(spikes.length,3,'Airi launches three individual horizontal spikes');
assert.equal(new Set(spikes.map(s=>s.y)).size,3,'Spikes fly at three heights');
assert.ok(spikes.every(s=>s.vx>0&&s.x>330),'Spikes travel outward toward the opponent');
assert.ok(allJs.includes("ctx.scale(Math.sign(e.vx)||1,1)"),
  'Airi projectile geometry faces horizontally along its velocity');

evalGame("RT.start('sonic','easy',true);RT.g.state='active';RT.g.phaseWait=0;RT.cast(1)");
const summonHP=evalGame("RT.g.activeAbilities.find(e=>e.kind==='summon')?.hp");
assert.ok(summonHP>0,'Summons in Araya RT have a real health pool');
evalGame(`(() => {const e=RT.g.activeAbilities.find(e=>e.kind==='summon');
  RT.g.bullets.push({x:e.originX-10,y:e.originY,vx:0,vy:0,
    r:5,damage:9,life:2,near:false,grazed:false});})()`);
evalGame('RT.step(1/60)');
assert.equal(evalGame("RT.g.activeAbilities.find(e=>e.kind==='summon')?.hp"),summonHP-9,
  'Enemy bullets can hit and damage summoned allies in RT');
assert.equal(evalGame('RT.g.bullets.length'),0,
  'A projectile intercepted by a summon cannot also damage the hero');

for(const hero of evalGame('CHARS.map(c=>c.id)')){
  battle(hero);
  const count=evalGame('Fight.g.f[0].c.skills.length');
  for(let i=0;i<count;i++){
    if(evalGame(`Fight.g.f[0].c.skills[${i}].passive`))continue;
    evalGame(`Fight.g.f[0].pe=Fight.g.f[0].c.pe;
      Fight.g.f[0].recovery=0;Fight.g.f[0].stun=0;
      Fight.g.f[0].cd[${i}]=0;Fight.cast(Fight.g.f[0],${i})`);
  }
  // A fresh RT run should accept the same character's abilities.
  evalGame(`RT.start('${hero}','easy',true);RT.g.state='active';RT.g.phaseWait=0`);
  for(let i=0;i<count;i++){
    if(evalGame(`RT.g.c.skills[${i}].passive`))continue;
    evalGame(`RT.g.pe=RT.g.c.pe;RT.g.cd[${i}]=0;RT.cast(${i})`);
  }
}
console.log('PASS: modular scripts, Tokyo Dawn branding, flying harmless Lapis anchor, 14 portraits, combat feel, fixed arenas, slower Araya gauge, Kokichi suit, Airi spikes, summon health/hitboxes, all normal/RT techniques');
