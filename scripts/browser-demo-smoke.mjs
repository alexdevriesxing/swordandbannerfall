// Real Chromium acceptance test for the deliberately limited demo build.
// Never inject HP, replace textures, mutate the battle, or bypass art/rights gates.
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

const address=process.env.SWORD_DEMO_QA_URL??'http://127.0.0.1:4174/';
const url=new URL(address);
if(!['localhost','127.0.0.1'].includes(url.hostname))
 throw new Error('Demo browser QA requires a loopback Vite preview');
url.searchParams.set('qa','1');
mkdirSync('artifacts/demo',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:720}});
const runtimeErrors=[];
page.on('pageerror',error=>runtimeErrors.push(error.message));
const state=()=>page.evaluate(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()??null);
try{
 await page.goto(url.toString(),{waitUntil:'networkidle',timeout:30000});
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.match?.phase==='setup',
   undefined,{timeout:30000});
 const setup=await state();
 assert.equal(setup.demoBuild,true,'Demo bundle must use the demo compile-time mode');
 assert.equal(setup.demo.limitMs,240000);
 assert.equal(setup.demo.elapsedMs,0,'Setup must not use combat time');
 assert.equal(setup.demo.matchesAllowed,1);
 assert.deepEqual(setup.match.remaining,{blue:10,red:10});
 await page.screenshot({path:'artifacts/demo/01-demo-preparation.png'});

 await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.match?.phase==='fight',
   undefined,{timeout:15000});
 const before=await state();
 await page.waitForTimeout(1300);
 const inFight=await state();
 assert.ok(inFight.demo.elapsedMs>before.demo.elapsedMs,'Combat must tick the demo clock');
 assert.ok(inFight.demo.remainingMs<240000,'Combat must consume the demo time allowance');
 await page.screenshot({path:'artifacts/demo/02-demo-live-combat.png'});

 // Wait for either a genuine team victory or the four-minute active-fight cap.
 // No HP modifications, artificial clock jumps or synthetic victory transitions.
 const deadline=Date.now()+285000;
 let result=await state();
 while(!result?.demo?.ended&&Date.now()<deadline){
  if(result?.comeback?.pending?.blue)await page.keyboard.press('1');
  await page.waitForTimeout(500);
  result=await state();
 }
 assert.ok(result?.demo?.ended,'The limited demo never concluded');
 assert.ok(['match-complete','time-limit'].includes(result.demo.reason));
 assert.equal(result.demo.matchesAllowed,1);
 await page.screenshot({path:'artifacts/demo/03-demo-complete.png'});

 // In the demo, Enter must not allow a second match or reset the four-minute clock.
 await page.keyboard.press('Enter');
 await page.waitForTimeout(300);
 const afterEnter=await state();
 assert.equal(afterEnter.demo.ended,true);
 assert.equal(afterEnter.demo.reason,result.demo.reason);
 assert.equal(afterEnter.demo.elapsedMs,result.demo.elapsedMs);
 assert.deepEqual(runtimeErrors,[],runtimeErrors.join('\n'));
 console.log(JSON.stringify({passed:true,mode:'HTML5-limited-demo',
  endReason:result.demo.reason,limitMs:result.demo.limitMs,
  checks:['approved art boot','setup not timed','20 fighters','active combat timer',
    'natural win or four-minute cap','no extra matches','no page errors']}));
}catch(error){
 await page.screenshot({path:'artifacts/demo/FAIL-demo.png'}).catch(()=>{});
 console.error('Limited demo Chromium acceptance failed:',error);
 console.error('Browser runtime errors:',runtimeErrors);
 process.exitCode=1;
}finally{
 await browser.close();
}
