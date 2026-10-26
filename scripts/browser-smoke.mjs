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
const assetFailures=[];
page.on('pageerror',error=>runtimeErrors.push(error.message));
page.on('response',response=>{
 const pathname=new URL(response.url()).pathname;
 if(pathname.startsWith('/assets/')&&!response.ok())
  assetFailures.push(pathname+' (HTTP '+response.status()+')');
});
page.on('requestfailed',request=>{
 const pathname=new URL(request.url()).pathname;
 if(pathname.startsWith('/assets/'))
  assetFailures.push(pathname+' ('+(request.failure()?.errorText??'network failure')+')');
});
async function snapshot(){
 return page.evaluate(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()??null);
}
try{
 await page.goto(url.toString(),{waitUntil:'networkidle',timeout:30000});
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.match?.phase==='setup',undefined,{timeout:30000});
 const setup=await snapshot();
 assert.deepEqual(setup.match.remaining,{blue:10,red:10});
 assert.equal(setup.terrain.gantryColliders,2,'Both painted gantries need physical one-way ledges');
 assert.equal(setup.terrain.barricadeColliders,2,'Both barricades need solid physical bodies');
 assert.equal(setup.terrain.barricadePaintings,2,'Each barricade requires separate original artwork');
 assert.equal(setup.companions,18);
 assert.equal(setup.preparation,'setup');
 // Enemy prep is paid for, visible, and present before the battle launches.
 assert.deepEqual(setup.defenses.filter(d=>d.team==='red').map(d=>d.kind),['turret','shield']);
 assert.equal(setup.supply.red,20);
 assert.equal(setup.supply.blue,100);
 assert.equal(setup.orders.blue,'guard');
 // A true scene pause freezes preparation and player physics but retains the
 // painted scene behind the menu. Resume must not bounce back to paused.
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.paused===true,
   undefined,{timeout:3000});
 const pausedSetup=await snapshot();
 await page.waitForTimeout(450);
 assert.equal((await snapshot()).preparationElapsedMs,pausedSetup.preparationElapsedMs,
   'Preparation advanced while paused');
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.paused===false,
   undefined,{timeout:3000});
 await page.waitForTimeout(160);
 assert.equal((await snapshot()).paused,false,'Escape resume bounced back to pause');
 await page.screenshot({path:'artifacts/01-preparation.png'});

 // Deploy one real player turret using the documented setup key, then
 // verify supply accounting and placement collision rejection.
 await page.keyboard.press('g');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.defenses.some(
  d=>d.team==='blue'&&d.kind==='turret'),undefined,{timeout:3000});
 const playerDefense=await snapshot();
 assert.equal(playerDefense.supply.blue,55,'Turret must cost 45 supply');
 assert.equal(playerDefense.defenses.filter(d=>d.team==='blue').length,1);
 await page.keyboard.press('g');
 await page.waitForTimeout(150);
 const deniedDuplicate=await snapshot();
 assert.equal(deniedDuplicate.supply.blue,55,'Blocked duplicate must not consume supply');
 assert.equal(deniedDuplicate.defenses.filter(d=>d.team==='blue').length,1);
 await page.screenshot({path:'artifacts/01b-player-turret.png'});

 await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.match?.phase==='fight',undefined,{timeout:15000});
 await page.waitForTimeout(700); // Let Arcade settle onto physical ground.
 const before=await snapshot();
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.paused===true,
   undefined,{timeout:3000});
 const frozen=await snapshot();
 await page.waitForTimeout(450);
 const stillFrozen=await snapshot();
 assert.equal(stillFrozen.fighters.blue.x,frozen.fighters.blue.x,
   'Champion moved while Arcade physics should be paused');
 assert.equal(stillFrozen.fighters.blue.y,frozen.fighters.blue.y,
   'Champion fell while Arcade physics should be paused');
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.paused===false,
   undefined,{timeout:3000});
 await page.waitForTimeout(160);
 assert.equal((await snapshot()).paused,false,'Combat resumed but instantly paused again');
 // Exercise the actual command-cycle and guard bindings while the match is live.
 await page.keyboard.press('e');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.orders?.blue==='patrol',
  undefined,{timeout:3000});
 assert.equal((await snapshot()).orders.blue,'patrol');
 await page.keyboard.down('l');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.stance==='guard',
  undefined,{timeout:3000});
 await page.keyboard.up('l');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.stance==='attack',
  undefined,{timeout:3000});
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

 // Test an authentic champion shot, using read-only telemetry from the
 // actual Arcade bullet group. No synthetic projectile or health mutation.
 await page.keyboard.press('k');
 await page.waitForFunction(() =>
   window.__SWORD_BANNERFALL_QA__?.snapshot()?.projectileDetails?.some(
     shot=>shot.source==='champion'&&shot.team==='blue'
   ),undefined,{timeout:2500});
 const firing=await snapshot();
 const firedBullet=firing.projectileDetails.find(
   shot=>shot.source==='champion'&&shot.team==='blue');
 assert.ok(firedBullet&&Number.isFinite(firedBullet.x)&&Number.isFinite(firedBullet.y),
   'The blue champion failed to create a real travelling projectile');
 assert.ok(firing.projectiles>=1,'No active projectile is present after firing');
 await page.screenshot({path:'artifacts/02b-real-champion-projectile.png'});

 // Observe the unassisted battle. If real casualties unlock a genuine card,
 // choose it through the actual keyboard and verify that it takes effect.
 // Never fabricate a loss, change HP, or bypass the production-art gate.
 let cardsChosen=0;
 let finished=false;
 const deadline=Date.now()+180000;
 while(Date.now()<deadline){
  const current=await snapshot();
  if(current?.match.phase==='finished'){finished=true;break;}
  if(current?.comeback?.pending?.blue){
   const beforeClaims=current.comeback.claims.blue;
   await page.keyboard.press('1');
   await page.waitForTimeout(80);
   const chosen=await snapshot();
   if(chosen?.match.phase!=='finished'){
    assert.ok(chosen.comeback.claims.blue>beforeClaims,
      'Real comeback card selection did not consume the pending offer');
    cardsChosen++;
   }
  }
  await page.waitForTimeout(400);
 }
 assert.ok(finished,'Autonomous 10v10 encounter stalled or exceeded 180 seconds');
 const result=await snapshot();
 assert.ok(['blue','red'].includes(result.match.winner));
 assert.equal(result.match.remaining[result.match.winner==='blue'?'red':'blue'],0);
 assert.equal(result.match.eliminations.blue+result.match.remaining.blue,10);
 assert.equal(result.match.eliminations.red+result.match.remaining.red,10);
 const intact=result.cover.filter(c=>c.hp>0).length;
 assert.equal(result.terrain.barricadeColliders,intact,
   'Destroyed cover must remove its real Arcade physics collider');
 assert.equal(result.terrain.barricadePaintings,intact,
   'Destroyed cover must remove its original painted sprite');
 const frozenResult=await snapshot();
 await page.waitForTimeout(400);
 const victoryStill=await snapshot();
 for(const team of ['blue','red']){
  assert.equal(victoryStill.fighters[team].x,frozenResult.fighters[team].x,
    team+' champion shifted during frozen victory');
  assert.equal(victoryStill.fighters[team].y,frozenResult.fighters[team].y,
    team+' champion continued falling after match end');
 }
 await page.screenshot({path:'artifacts/03-victory.png'});

 await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.match?.phase==='setup',undefined,{timeout:15000});
 const replay=await snapshot();
 assert.deepEqual(replay.match.remaining,{blue:10,red:10});
 assert.equal(replay.companions,18);
 assert.deepEqual(replay.defenses.filter(d=>d.team==='red').map(d=>d.kind),['turret','shield']);
 assert.equal(replay.supply.red,20);
 assert.equal(replay.supply.blue,100);
 assert.equal(replay.orders.blue,'guard','Replay must reset squad command');
 assert.equal(replay.stance,'attack','Replay must reset guard stance');
 assert.equal(replay.defenses.filter(d=>d.team==='blue').length,0,
  'Replay must discard player-purchased defenses');
 assert.equal(replay.comeback.claims.blue,0,'Replay must reset all selected cards');
 assert.equal(replay.comeback.unlocked.blue,0,'Replay must reset unlocked drafts');
 await page.screenshot({path:'artifacts/04-replay-setup.png'});
 // Prove physics really restarted, not just the data and HUD counters.
 await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.__SWORD_BANNERFALL_QA__?.snapshot()?.match?.phase==='fight',
   undefined,{timeout:15000});
 await page.waitForTimeout(650);
 const secondStart=await snapshot();
 await page.keyboard.press('Space');
 await page.waitForTimeout(130);
 const secondJump=await snapshot();
 assert.ok(secondJump.fighters.blue.y<secondStart.fighters.blue.y-10,
  'Arcade physics remained paused after a full match replay');

 assert.deepEqual(assetFailures,[],'Production textures failed to load: '+assetFailures.join(', '));
 assert.deepEqual(runtimeErrors,[],runtimeErrors.join('\n'));
 console.log(JSON.stringify({passed:true,checks:['setup','20 combatants','movement','jump',
  'red preparation defenses','player turret and supply accounting','duplicate placement rejection',
  'scene pause/resume and frozen Arcade physics','squad order command','guard stance','real champion projectile','unassisted victory','comeback card input when unlocked',
  'elimination invariants','frozen victory tableau',
  'defense state reset on replay','active Arcade physics after replay'],cardsChosen,winner:result.match.winner}));
}catch(error){
 await page.screenshot({path:'artifacts/FAIL-browser-smoke.png'}).catch(()=>{});
 console.error('Browser smoke failed:',error);
 console.error('Phaser page errors:',runtimeErrors);
 console.error('Production texture failures:',assetFailures);
 process.exitCode=1;
}finally{
 await browser.close();
}
