import test from 'node:test';
import assert from 'node:assert/strict';
import {EliminationMatch} from '../src/systems/elimination.js';
import {sweptCompanionHit} from '../src/systems/projectile-impact.js';

function combat(){
 const match=new EliminationMatch({fightersPerTeam:10});
 for(const team of ['blue','red']){
  match.register(team,team==='blue'?'hero':'enemy');
  for(let i=1;i<=9;i++)match.register(team,team+'-ai-'+i);
 }
 match.begin();
 return match;
}
test('the final red companion falling to a travelling shot ends the match once',()=>{
 const match=combat();
 match.eliminate('enemy');
 for(let i=1;i<=8;i++)match.eliminate('red-ai-'+i);
 assert.equal(match.remaining('red'),1);
 assert.equal(match.phase,'fight');
 const last={x:800,y:590};
 const hit=sweptCompanionHit({x:700,y:573},{x:900,y:573},last);
 assert.equal(hit,true);
 assert.deepEqual(match.eliminate('red-ai-9'),{accepted:true,remaining:0,winner:'blue'});
 assert.equal(match.phase,'finished');
 assert.equal(match.remaining('blue'),10);
 assert.equal(match.eliminate('red-ai-9').accepted,false);
 assert.equal(match.eliminations.red,10);
});
test('loss of blue champion does not finish match while nine autonomous escorts live',()=>{
 const match=combat();
 const casualty=match.eliminate('hero');
 assert.equal(casualty.accepted,true);
 assert.equal(casualty.winner,null);
 assert.equal(match.phase,'fight');
 assert.equal(match.remaining('blue'),9);
 for(let i=1;i<=9;i++)match.eliminate('blue-ai-'+i);
 assert.equal(match.winner,'red');
 assert.equal(match.remaining('blue'),0);
});
test('projectile passing above the final companion does not register a win',()=>{
 const match=combat();
 match.eliminate('enemy');
 for(let i=1;i<=8;i++)match.eliminate('red-ai-'+i);
 const hit=sweptCompanionHit({x:700,y:410},{x:900,y:410},{x:800,y:590});
 assert.equal(hit,false);
 assert.equal(match.phase,'fight');
 assert.equal(match.winner,null);
});
