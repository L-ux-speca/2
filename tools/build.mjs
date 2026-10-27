import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(dir,'index.html'),'utf8');
let count=0;
const standalone=source
  .replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,relative)=>
    `<style>\n${fs.readFileSync(path.join(dir,relative),'utf8')}\n</style>`)
  .replace(/<script src="([^"]+)"><\/script>/g,(_,relative)=>
    `<script>\n${fs.readFileSync(path.join(dir,relative),'utf8')}\n</script>`)
  .replace(/'(assets\/portraits\/([a-z]+)\.(jpg|png))'/g,(_,relative,id,ext)=>{
  const absolute=path.join(dir,relative);
  const mime=ext==='png'?'image/png':'image/jpeg';
  const contents=fs.readFileSync(absolute);
  if(contents.length<10000)throw Error(`Unexpectedly small portrait: ${id}`);
  count++;
  // Base64 changes the HTML encoding, NOT the underlying image bytes or quality.
  return `'data:${mime};base64,${contents.toString('base64')}'`;
});
if(count!==14)throw Error(`Expected 14 original portraits, found ${count}`);
const out=path.resolve(dir,'..','Tokyo_Dawn_Standalone.html');
fs.writeFileSync(out,standalone);
console.log(`${out} (${Math.round(Buffer.byteLength(standalone)/1024)} KiB, ${count} untouched portraits)`);
