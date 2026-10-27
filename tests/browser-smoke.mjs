import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

// Optional real-browser smoke test. Requires Playwright + installed Chromium.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let chromium;
try { ({chromium}=await import('playwright')); }
catch {
  try {({chromium}=createRequire(import.meta.url)('playwright'));}
  catch { console.error('Install Playwright for browser tests: npm install -D playwright'); process.exit(2); }
}

const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  try{
    const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';
    const file=path.resolve(root,relative);
    if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.end(fs.readFileSync(file));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'load'});
  await page.locator('.home-grid').waitFor();
  assert.equal(await page.title(),'Tokyo Dawn — 2D-файтинг');
  assert.equal(await page.locator('.clean-home-menu > .mode-btn').count(),3,
    'Landing page now has only three primary mode choices');
  assert.equal(await page.locator('.home-portrait-selector').count(),0,
    'Landing page no longer loads a redundant fourteen-portrait strip');
  await page.getByRole('button',{name:/Территории РТ/}).click();
  await page.locator('#rtBoss').waitFor();
  await page.locator('#rtBoss').selectOption('airi');
  await page.locator('#rtDifficulty').selectOption('hard');
  await page.getByRole('button',{name:/Начать испытание/}).click();
  assert.equal(await page.evaluate(()=>window.TokyoDawn.RTVariants.g.formName),
    'КУБИЧЕСКИЙ АВТОМАТ','Airi has a concrete first-stage form');
  await page.evaluate(()=>{
    const {RTVariants,App}=window.TokyoDawn;
    RTVariants.g.state='active';RTVariants.g.phaseWait=0;
    RTVariants.phase(2);RTVariants.g.phaseWait=0;
    RTVariants.phase(3);RTVariants.g.phaseWait=0;
    RTVariants.genre().pattern(RTVariants);
    RTVariants.draw();App.home();
  });
  await page.locator('.home-grid').waitFor();
  await page.getByRole('button',{name:/Играть/}).first().click();
  await page.getByRole('button',{name:/Тренировка/}).click();
  await page.locator('.select-layout').waitFor();
  await page.getByRole('button',{name:/Начать бой/}).click();
  await page.locator('#gameCanvas').waitFor();
  assert.equal(await page.evaluate(()=>window.TokyoDawn.Fight.g.f.length),2);
  await page.evaluate(()=>{
    const {Fight,App}=window.TokyoDawn;
    Fight.g.state='active';
    Fight.cast(Fight.g.f[0],2);
    Fight.step(1/60);
    App.home();
  });
  await page.locator('.home-grid').waitFor();
  await page.evaluate(()=>window.TokyoDawn.RT.start('lapis','easy',true));
  await page.locator('#gameCanvas').waitFor();
  assert.equal(await page.evaluate(()=>window.TokyoDawn.RT.g.c.id),'lapis');
  assert.deepEqual(errors,[],'No runtime errors in menu, match or RT');
  console.log('PASS: real-browser home, settings navigation, fight, Lapis anchor and RT');
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
