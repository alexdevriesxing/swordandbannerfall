// Dedicated real Chromium acceptance for the optional local two-human mode.
// The full VS AI acceptance remains separate and stays the default.
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

const origin=process.env.SWORD_BROWSER_QA_URL??'http://127.0.0.1:4173/';
const url=new URL(origin);
if(!['127.0.0.1','localhost'].includes(url.hostname))
 throw new Error('Local two-player QA requires a loopback Vite preview');
url.searchParams.set('qa','1');
mkdirSync('artifacts/local-2p',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:720}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const state=()=>page.evaluate(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()??null);
try{
 await page.goto(url.toString(),{waitUntil:'networkidle',timeout:30000});
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.match?.phase==='setup',
   undefined,{timeout:30000});
 const ai=await state();
 assert.equal(ai.controlMode.mode,'vs-ai');
 assert.deepEqual(ai.defenses.filter(d=>d.team==='red').map(d=>d.kind),['turret','shield']);
 assert.equal(ai.supply.red,20);
 assert.deepEqual(ai.match.remaining,{blue:10,red:10});
 await page.keyboard.press('p');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.controlMode?.localTwoPlayer,
   undefined,{timeout:3000});
 const local=await state();
 assert.equal(local.supply.red,100,'P2 must receive a full defense budget');
 assert.equal(local.defenses.filter(d=>d.team==='red').length,0,
  'AI pre-deployed fortifications must not be granted to P2');
 await page.keyboard.press('b');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.defenses.some(
   d=>d.team==='red'&&d.kind==='turret'),undefined,{timeout:3000});
 const purchased=await state();
 assert.equal(purchased.supply.red,55);
 assert.equal(purchased.defenses.filter(d=>d.team==='red').length,1);
 await page.keyboard.press('b');
 await page.waitForTimeout(120);
 assert.equal((await state()).supply.red,55,'Duplicate P2 defense charged twice');
 await page.screenshot({path:'artifacts/local-2p/01-human-red-setup.png'});
 await page.keyboard.press('p'); // Back to AI to verify symmetric clean switching.
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.controlMode?.mode==='vs-ai',
   undefined,{timeout:3000});
 const aiAgain=await state();
 assert.equal(aiAgain.supply.red,20);
 assert.deepEqual(aiAgain.defenses.filter(d=>d.team==='red').map(d=>d.kind),['turret','shield']);
 await page.keyboard.press('p');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.controlMode?.localTwoPlayer,
   undefined,{timeout:3000});
 assert.equal((await state()).supply.red,100);
 await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.match?.phase==='fight',
   undefined,{timeout:15000});
 await page.waitForTimeout(600);
 const starting=await state();
 assert.equal(starting.controlMode.locked,true);
 assert.equal(starting.controlMode.localTwoPlayer,true);
 assert.equal(starting.defenses.filter(d=>d.team==='red').length,0);
 await page.keyboard.down('ArrowLeft');
 await page.waitForTimeout(270);
 await page.keyboard.up('ArrowLeft');
 const moved=await state();
 assert.ok(moved.fighters.red.x<starting.fighters.red.x-12,
   'ArrowLeft did not move the human-controlled red champion');
 await page.keyboard.down('o');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.redStance==='guard',
   undefined,{timeout:3000});
 await page.keyboard.up('o');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.redStance==='attack',
   undefined,{timeout:3000});
 await page.keyboard.press('r');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.orders?.red==='guard',
   undefined,{timeout:3000});
 await page.keyboard.press('ArrowUp');
 await page.waitForTimeout(110);
 const jumped=await state();
 assert.ok(jumped.fighters.red.y<moved.fighters.red.y-10,
   'ArrowUp failed to initiate second human champion jump');
 // Both human champions must use real ballistic projectiles, not instant
 // ranged damage. Observe the red champion's actual Arcade bullet in flight.
 await page.keyboard.press('i');
 await page.waitForFunction(()=>
   window.__SWORD_BANNERFALL_QA__?.snapshot()?.projectileDetails?.some(
     bullet=>bullet.team==='red'&&bullet.source==='champion'
   ),undefined,{timeout:2500});
 const redBullet=(await state()).projectileDetails.find(
   bullet=>bullet.team==='red'&&bullet.source==='champion');
 assert.ok(Number.isFinite(redBullet?.x)&&Number.isFinite(redBullet?.y),
   'Red champion fired without a real travelling projectile');
 await page.screenshot({path:'artifacts/local-2p/02b-human-red-projectile.png'});
 // Switching controllers in a live match would be unfair and must be rejected.
 await page.keyboard.press('p');
 assert.equal((await state()).controlMode.mode,'local-2p');
 assert.deepEqual(errors,[],errors.join('\n'));
 await page.screenshot({path:'artifacts/local-2p/02-human-red-combat.png'});
 console.log(JSON.stringify({passed:true,mode:'local-2p',checks:[
   'default VS AI','full red supply refund','P2 defense purchase',
   'duplicate placement rejection','switch to AI restores authored loadout',
   'match choice locks at start','red horizontal movement','red guard',
   'red squad orders','red jump','real red champion projectile','no mid-match controller switching',
   'no browser errors']}));
}catch(e){
 await page.screenshot({path:'artifacts/local-2p/FAIL.png'}).catch(()=>{});
 console.error('Local two-player Chromium acceptance failed:',e,errors);
 process.exitCode=1;
}finally{await browser.close();}
