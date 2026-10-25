import test from 'node:test';
import assert from 'node:assert/strict';
import {matchResultView} from '../src/systems/match-summary.js';
import {EliminationMatch} from '../src/systems/elimination.js';

test('complete elimination match generates accurate victory summary',()=>{
 const match=new EliminationMatch({fightersPerTeam:1});
 match.register('blue','hero');match.register('red','enemy');match.begin();
 match.eliminate('enemy');
 const screen=matchResultView(match.snapshot());
 assert.equal(screen.headline,'BLUE TEAM VICTORY');
 assert.match(screen.summary,/BLUE 1/);
 assert.match(screen.summary,/RED 0/);
 assert.match(screen.instruction,/ENTER/);
});
test('no victory overlay appears during preparation or combat',()=>{
 const match=new EliminationMatch({fightersPerTeam:1});
 assert.equal(matchResultView(match.snapshot()),null);
 match.register('blue','hero');match.register('red','enemy');match.begin();
 assert.equal(matchResultView(match.snapshot()),null);
});
test('rejects inconsistent winner data',()=>{
 assert.throws(()=>matchResultView({phase:'finished',winner:'blue',remaining:{blue:1,red:1},eliminations:{blue:0,red:0}}));
});
