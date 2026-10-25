import test from 'node:test';
import assert from 'node:assert/strict';
import {EliminationMatch} from '../src/systems/elimination.js';
import {ComebackDraft} from '../src/systems/comeback-draft.js';
import {CompanionDirector} from '../src/systems/companions.js';
import {TacticalBattle} from '../src/systems/tactics.js';
import {protectedCompanionDamage} from '../src/systems/companion-damage.js';

function fullRoster(){
 const match=new EliminationMatch();
 match.register('blue','hero');match.register('red','enemy');
 const ai=new CompanionDirector({maxPerTeam:9});
 for(const team of ['blue','red'])for(let n=0;n<9;n++){
  const unit=ai.add(team,team==='blue'?130+n*30:1160-n*30,{role:'vanguard'});
  match.register(team,'ai-'+unit.id);
 }
 match.begin();
 return {match,ai,cards:new ComebackDraft(),tactics:new TacticalBattle()};
}
test('casualties trigger comeback picks without changing the ten-person elimination count',()=>{
 const game=fullRoster();
 const defeated=game.ai.units.find(u=>u.team==='blue');
 game.ai.wound(defeated.id,defeated.hp);
 const result=game.match.eliminate('ai-'+defeated.id);
 assert.equal(result.accepted,true);
 const offer=game.cards.casualty('blue',{remaining:result.remaining,ended:!!result.winner});
 assert.equal(offer.options.length,3);
 assert.deepEqual(game.match.snapshot().remaining,{blue:9,red:10});
 game.cards.choose('blue',0);
 assert.deepEqual(game.match.snapshot().remaining,{blue:9,red:10});
 assert.equal(game.cards.damage('blue',10),12);
});
test('comeback damage respects defending shield and Sentinel exactly once',()=>{
 const game=fullRoster(),target=game.ai.units.find(u=>u.team==='red'&&u.role==='vanguard');
 game.cards.casualty('blue',{remaining:9});game.cards.choose('blue',0);
 game.tactics.deploy('red','shield',target.x);
 const raw=game.cards.damage('blue',30);
 const reduced=game.cards.incoming('red',raw);
 const guard=protectedCompanionDamage(game.tactics,game.ai.units,target,reduced,1000);
 assert.equal(raw,35);assert.equal(guard.damage,0);
 assert.equal(game.ai.wound(target.id,guard.damage).ko,false);
 assert.equal(target.hp,target.maxHp);
});
test('movement perk accelerates a team without affecting the opposing side',()=>{
 const game=fullRoster();
 game.cards.casualty('red',{remaining:9});
 assert.equal(game.cards.choose('red',1).id,'swift-march');
 const formations={blue:{team:'blue',x:150,hp:100},red:{team:'red',x:1050,hp:100}};
 game.ai.command('blue','hunt');game.ai.command('red','hunt');
 const blue=game.ai.units.find(u=>u.team==='blue'&&u.id===1);
 const red=game.ai.units.find(u=>u.team==='red'&&u.id===10);
 const blueX=blue.x,redX=red.x;
 game.ai.update(1000,100,formations,null,null,{
  blue:{speedMultiplier:game.cards.speed('blue')},red:{speedMultiplier:game.cards.speed('red')}
 });
 const blueMove=Math.abs(blue.x-blueX),redMove=Math.abs(red.x-redX);
 assert.ok(blueMove>0);assert.ok(redMove>blueMove,'red fighters gain a meaningful speed advantage');
});
test('three drafts cannot resurrect a champion or prevent a team wipe',()=>{
 const game=fullRoster();
 const hero=game.match.eliminate('hero');
 assert.equal(hero.accepted,true);
 assert.equal(game.cards.casualty('blue',{remaining:hero.remaining,ended:false}).options.length,3);
 const medic=game.cards.choose('blue',0);
 assert.equal(medic.heal,0);
 for(const unit of game.ai.units.filter(u=>u.team==='blue')){
  game.ai.wound(unit.id,unit.hp);
  const casualty=game.match.eliminate('ai-'+unit.id);
  const offer=game.cards.casualty('blue',{remaining:casualty.remaining,ended:!!casualty.winner});
  if(offer)game.cards.choose('blue',0);
 }
 assert.equal(game.match.winner,'red');
 assert.equal(game.match.remaining('blue'),0);
 assert.equal(game.cards.offer('blue'),null);
 assert.ok(game.cards.claims.blue<=3);
});
test('every final victory still counts exactly ten losses and no extra lives',()=>{
 const game=fullRoster();
 for(const victim of game.ai.units.filter(u=>u.team==='red')){
  game.ai.wound(victim.id,victim.hp);
  const KO=game.match.eliminate('ai-'+victim.id);
  const offered=game.cards.casualty('red',{remaining:KO.remaining,ended:!!KO.winner});
  if(offered)game.cards.choose('red',0);
 }
 assert.equal(game.match.eliminate('enemy').winner,'blue');
 assert.equal(game.match.snapshot().eliminations.red,10);
 assert.equal(game.match.remaining('red'),0);
});
