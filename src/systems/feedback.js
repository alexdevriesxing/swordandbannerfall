// Pure combat feedback queue: bounded to avoid unbounded HUD spam in 20-unit battles.
export class CombatFeed {
 constructor({maxEntries=6,lifetimeMs=2700}={}){this.maxEntries=maxEntries;this.lifetimeMs=lifetimeMs;this.entries=[];this.nextId=1;}
 push(time,text,kind='info'){
  if(!Number.isFinite(time)||typeof text!=='string'||!text.trim())throw new Error('Invalid event');
  this.entries.push({id:this.nextId++,time,text,kind});
  this.expire(time);this.entries=this.entries.slice(-this.maxEntries);
 }
 expire(time){this.entries=this.entries.filter(x=>time-x.time<this.lifetimeMs);}
 lines(time){this.expire(time);return this.entries.map(x=>x.text);}
}
export class BattlePacing {
 constructor({staleMs=11000,boostMs=4500}={}){this.staleMs=staleMs;this.boostMs=boostMs;this.lastImpact=0;this.boostUntil=0;}
 impact(time){this.lastImpact=time;this.boostUntil=0;}
 update(time,active){
  if(!active)return 1;
  if(time-this.lastImpact>=this.staleMs&&time>=this.boostUntil){
   this.boostUntil=time+this.boostMs;this.lastImpact=time;
  }
  return time<this.boostUntil?1.25:1;
 }
}
