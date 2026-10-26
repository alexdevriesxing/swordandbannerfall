// Standalone, bounded HTML5 product demo session. Do not use this client-side
// UX limit as a payments/security control; deploy the demo as a separate build.
export const DEMO_LIMIT_MS=240000; // Four minutes of active combat.
export class DemoSession {
 constructor({limitMs=DEMO_LIMIT_MS}={}){
  if(!Number.isInteger(limitMs)||limitMs<=0)throw new RangeError('Invalid demo duration');
  this.limitMs=limitMs;this.elapsedMs=0;this.reason=null;
 }
 get ended(){return this.reason!==null;}
 advance(deltaMs,{fighting=false}={}){
  if(!Number.isFinite(deltaMs)||deltaMs<0)throw new RangeError('Invalid demo frame duration');
  if(!this.ended&&fighting){
   // Bound a single frame to prevent tab suspension from consuming the whole demo.
   this.elapsedMs=Math.min(this.limitMs,this.elapsedMs+Math.min(deltaMs,250));
   if(this.elapsedMs>=this.limitMs)this.reason='time-limit';
  }
  return this.snapshot();
 }
 finishMatch(){
  if(!this.ended)this.reason='match-complete';
  return this.snapshot();
 }
 snapshot(){
  return {ended:this.ended,reason:this.reason,elapsedMs:this.elapsedMs,
   remainingMs:Math.max(0,this.limitMs-this.elapsedMs),limitMs:this.limitMs,
   matchesAllowed:1};
 }
}
