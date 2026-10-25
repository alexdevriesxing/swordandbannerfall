// Real Chromium integration smoke, intentionally requiring ALL final licensed art.
// This does not fabricate textures, force results or bypass gameplay rules.
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

const origin=process.env.SWORD_BROWSER_QA_URL??'http://127.0.0.1:4173/';
const url=new URL(origin);
if(!['127.0.0.1','localhost'].includes(url.hostname))
 throw new Error('Browser QA must run against a loopback Vite preview');
url.searchParams.set('qa','1');
mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:720}});
const runtimeErrors=[];
page.on('pageerror',error=>runtimeErrors.push(error.message));
async function snapshot(){
 return page.evaluate(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()??null);
}
try{
 await page.goto(url.toString(),{waitUntil:'networkidle',timeout:30000});
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.match?.phase==='setup',{timeout:30000});
 const setup=await snapshot();
 assert.deepEqual(setup.match.remaining,{blue:10,red:10});
 assert.equal(setup.companions,18);
 assert.equal(setup.preparation,'setup');
 await page.screenshot({path:'artifacts/01-preparation.png'});

 await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.match?.phase==='fight',{timeout:15000});
 await page.waitForTimeout(700); // Let Arcade settle onto physical ground.
 const before=await snapshot();
 await page.keyboard.down('d');
 await page.waitForTimeout(250);
 await page.keyboard.up('d');
 const moved=await snapshot();
 assert.ok(moved.fighters.blue.x>before.fighters.blue.x+10,
  'A/D player movement did not advance the Phaser body');

 const jumpStart=moved.fighters.blue.y;
 await page.keyboard.press('Space');
 await page.waitForTimeout(120);
 const jumping=await snapshot();
 assert.ok(jumping.fighters.blue.y<jumpStart-10,
  'Space jump did not propel the player champion upward');
 await page.screenshot({path:'artifacts/02-live-combat.png'});

 // Observe the full autonomous battle, never teleport or kill combatants in QA.
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.match?.phase==='finished',
  {timeout:180000,polling:500});
 const result=await snapshot();
 assert.ok(['blue','red'].includes(result.match.winner));
 assert.equal(result.match.remaining[result.match.winner==='blue'?'red':'blue'],0);
 assert.equal(result.match.eliminations.blue+result.match.remaining.blue,10);
 assert.equal(result.match.eliminations.red+result.match.remaining.red,10);
 await page.screenshot({path:'artifacts/03-victory.png'});

 await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.match?.phase==='setup',{timeout:15000});
 const replay=await snapshot();
 assert.deepEqual(replay.match.remaining,{blue:10,red:10});
 assert.equal(replay.companions,18);
 await page.screenshot({path:'artifacts/04-replay-setup.png'});

 assert.deepEqual(runtimeErrors,[],runtimeErrors.join('\n'));
 console.log(JSON.stringify({passed:true,checks:['setup','20 combatants','movement','jump',
  'unassisted victory','elimination invariants','replay'],winner:result.match.winner}));
}catch(error){
 await page.screenshot({path:'artifacts/FAIL-browser-smoke.png'}).catch(()=>{});
 console.error('Browser smoke failed:',error);
 console.error('Phaser page errors:',runtimeErrors);
 process.exitCode=1;
}finally{
 await browser.close();
}
