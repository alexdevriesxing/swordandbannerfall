// The 10v10 elimination comeback draft. Each fallen teammate can open a
// meaningful tactical decision, but no fighter is resurrected and perks are capped.
// Text labels are gameplay UI metadata, not replacement illustrations.
export const COMEBACK_CARDS=Object.freeze([
 Object.freeze({id:'war-cry',name:'War Cry',description:'+16% team damage',kind:'power'}),
 Object.freeze({id:'shieldwall',name:'Shieldwall',description:'14% less incoming damage',kind:'defense'}),
 Object.freeze({id:'swift-march',name:'Swift March',description:'+18% fighter movement',kind:'speed'}),
 Object.freeze({id:'field-medics',name:'Field Medics',description:'Heal 14 HP for living allies',kind:'heal'}),
 Object.freeze({id:'war-chest',name:'War Chest',description:'+55 defense supply',kind:'supply'}),
 Object.freeze({id:'deadeye',name:'Deadeye',description:'+22% ranged damage',kind:'ranged'})
]);
const THRESHOLDS=Object.freeze([1,3,5]);
const DEFAULT=()=>({power:1,defense:1,speed:1,ranged:1});
const validateTeam=team=>{if(!['blue','red'].includes(team))throw new Error('Invalid draft team');};
export class ComebackDraft {
 constructor(){
  this.losses={blue:0,red:0};
  this.claims={blue:0,red:0};
  this.pending={blue:null,red:null};
  this.effects={blue:DEFAULT(),red:DEFAULT()};
 }
 casualty(team,{remaining,ended=false}={}){
  validateTeam(team);
  if(!Number.isInteger(remaining)||remaining<0||remaining>9)throw new RangeError('Invalid remaining fighters');
  this.losses[team]++;
  if(ended||remaining===0||this.pending[team]||this.claims[team]>=THRESHOLDS.length
   ||!THRESHOLDS.includes(this.losses[team]))return null;
  const rotation=(this.claims[team]*2+(team==='red'?1:0))%COMEBACK_CARDS.length;
  const options=[0,1,2].map(n=>COMEBACK_CARDS[(rotation+n)%COMEBACK_CARDS.length]);
  this.pending[team]={options:options.map(card=>({...card})),atLoss:this.losses[team]};
  return this.offer(team);
 }
 offer(team){
  validateTeam(team);
  const value=this.pending[team];
  return value?{team,atLoss:value.atLoss,options:value.options.map(c=>({...c}))}:null;
 }
 choose(team,choice){
  validateTeam(team);
  const draft=this.pending[team];
  if(!draft)return null;
  if(!Number.isInteger(choice)||choice<0||choice>=draft.options.length)
   throw new RangeError('Invalid comeback card choice');
  const selected=draft.options[choice];
  const effect=this.effects[team];
  if(selected.id==='war-cry')effect.power=Math.min(1.48,Math.round((effect.power+.16)*100)/100);
  if(selected.id==='shieldwall')effect.defense=Math.max(.65,Math.round((effect.defense-.14)*100)/100);
  if(selected.id==='swift-march')effect.speed=Math.min(1.5,Math.round((effect.speed+.18)*100)/100);
  if(selected.id==='deadeye')effect.ranged=Math.min(1.5,Math.round((effect.ranged+.22)*100)/100);
  this.pending[team]=null;this.claims[team]++;
  return {team,...selected,heal:selected.id==='field-medics'?14:0,
   supply:selected.id==='war-chest'?55:0,effects:{...effect}};
 }
 damage(team,value,type='melee'){
  validateTeam(team);
  if(!Number.isFinite(value)||value<0)throw new RangeError('Invalid damage');
  const mod=this.effects[team];
  return value===0?0:Math.max(1,Math.round(value*mod.power*(type==='ranged'?mod.ranged:1)));
 }
 incoming(team,value){
  validateTeam(team);
  if(!Number.isFinite(value)||value<0)throw new RangeError('Invalid damage');
  return value===0?0:Math.max(1,Math.round(value*this.effects[team].defense));
 }
 speed(team){validateTeam(team);return this.effects[team].speed;}
 snapshot(){return JSON.parse(JSON.stringify({losses:this.losses,claims:this.claims,pending:this.pending,effects:this.effects}));}
}
