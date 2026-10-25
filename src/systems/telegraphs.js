// Timing logic only; the renderer chooses licensed art or readable UI text.
export class AttackTelegraphs {
 constructor({windupMs=450,maxPending=64}={}){this.windupMs=windupMs;this.maxPending=maxPending;this.pending=[];this.nextId=1;}
 schedule(time,attacker,target,damage){
  if(!Number.isFinite(time)||!Number.isFinite(damage)||damage<0)throw new Error('Invalid attack');
  const entry={id:this.nextId++,readyAt:time+this.windupMs,attacker,target,damage};
  if(this.pending.length>=this.maxPending)return null;
  this.pending.push(entry);return {...entry};
 }
 popReady(time){
  const ready=this.pending.filter(a=>a.readyAt<=time);
  this.pending=this.pending.filter(a=>a.readyAt>time);
  return ready;
 }
 cancelFor(target){const n=this.pending.length;this.pending=this.pending.filter(a=>a.target!==target&&a.attacker!==target);return n-this.pending.length;}
 clear(){this.pending=[];}
}
export function healthLabel(hp,maxHp){
 if(!Number.isFinite(hp)||!Number.isFinite(maxHp)||maxHp<=0)throw new Error('Invalid health');
 return Math.max(0,Math.ceil(hp))+'/'+Math.ceil(maxHp);
}
