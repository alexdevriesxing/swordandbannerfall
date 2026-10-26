import test from 'node:test';
import assert from 'node:assert/strict';
import {DemoSession,DEMO_LIMIT_MS} from '../src/systems/demo-session.js';
test('a 4-minute preview only counts active battle time, not preparation',()=>{
 const demo=new DemoSession();
 assert.equal(DEMO_LIMIT_MS,240000);
 demo.advance(12000,{fighting:false});
 assert.equal(demo.snapshot().elapsedMs,0);
 demo.advance(200,{fighting:true});
 assert.equal(demo.snapshot().remainingMs,239800);
});
test('preview ends at its active-time cap and cannot restart by incrementing frames',()=>{
 const demo=new DemoSession({limitMs:500});
 demo.advance(250,{fighting:true});
 assert.equal(demo.advance(250,{fighting:true}).reason,'time-limit');
 assert.equal(demo.advance(250,{fighting:true}).remainingMs,0);
 assert.equal(demo.finishMatch().reason,'time-limit');
});
test('natural victory ends the one-match demo before time expires',()=>{
 const demo=new DemoSession();
 demo.advance(100,{fighting:true});
 assert.equal(demo.finishMatch().reason,'match-complete');
 assert.equal(demo.advance(100,{fighting:true}).elapsedMs,100);
 assert.equal(demo.snapshot().matchesAllowed,1);
});
test('background frame spikes are capped but time is not silently charged in setup',()=>{
 const demo=new DemoSession();
 demo.advance(100000,{fighting:false});
 demo.advance(100000,{fighting:true});
 assert.equal(demo.snapshot().elapsedMs,250);
});
test('invalid demo durations and frame values are rejected',()=>{
 assert.throws(()=>new DemoSession({limitMs:0}),RangeError);
 assert.throws(()=>new DemoSession({limitMs:7.5}),RangeError);
 const demo=new DemoSession();
 assert.throws(()=>demo.advance(-1,{fighting:true}),RangeError);
 assert.throws(()=>demo.advance(Infinity,{fighting:true}),RangeError);
});
