// Pure deterministic combat model; runnable independently of rendering and the browser.
export const ARENA={maxRounds:10,maxHealth:100};
export class SeededRandom {
 constructor(seed=1){this.state=(seed>>>0)||1;}
 next(){this.state=(Math.imul(1664525,this.state)+1013904223)>>>0;return this.state/4294967296;}
}
const CARDS=[
 {id:'iron-heart',label:'Iron Heart',description:'+25 maximum health',apply:f=>{f.maxHp+=25;}},
 {id:'sharpened-edge',label:'Sharpened Edge',description:'+20% melee attack',apply:f=>{f.meleeBonus+=.2;}},
 {id:'bulwark',label:'Bulwark',description:'+10% damage reduction',apply:f=>{f.armor=Math.min(.6,f.armor+.1);}}
];
export class CombatDirector {
 constructor({seed=1,roundLimit=10}={}){
  this.rng=new SeededRandom(seed);this.roundLimit=roundLimit;this.round=1;this.phase='fight';
  this.score={blue:0,red:0};
  this.fighters={
   hero:{hp:100,maxHp:100,stance:'attack',command:'guard',armor:0,meleeBonus:0},
   enemy:{hp:100,maxHp:100,stance:'attack',command:'hunt',armor:0,meleeBonus:0}
  };
  this.cards=CARDS.map(c=>({id:c.id,label:c.label,description:c.description}));
 }
 damage(id,raw,type='melee'){
  if(this.phase!=='fight')return {applied:0,ko:false};
  const victim=this.fighters[id];if(!victim||victim.hp<=0)return {applied:0,ko:false};
  const attacker=this.fighters[id==='hero'?'enemy':'hero'];
  const amplified=type==='melee'?raw*(1+attacker.meleeBonus):raw;
  const mitigation=Math.min(.85,victim.armor+(victim.stance==='guard'?.45:0));
  const actual=Math.max(1,Math.round(amplified*(1-mitigation)));
  victim.hp=Math.max(0,victim.hp-actual);
  return {applied:actual,ko:victim.hp===0};
 }
 setStance(id,stance){if(this.fighters[id]&&['guard','attack'].includes(stance))this.fighters[id].stance=stance;}
 cycleCommand(id){const f=this.fighters[id];if(!f)return;const modes=['guard','patrol','hunt'];f.command=modes[(modes.indexOf(f.command)+1)%modes.length];}
 finishRound(){
  if(this.phase!=='fight')throw new Error('Round is not active');
  const hero=this.fighters.hero,enemy=this.fighters.enemy;
  if(hero.hp>0&&enemy.hp>0)throw new Error('Cannot finish a round before a KO');
  const blueWon=hero.hp>0;this.score[blueWon?'blue':'red']++;
  const message=blueWon?'BLUE TEAM WINS THE ROUND':'RED TEAM WINS THE ROUND';
  if(this.round>=this.roundLimit){this.phase='finished';return {message:message+' — MATCH COMPLETE'};}
  this.phase=blueWon?'intermission':'cards';
  return {message};
 }
 selectCard(index){
  if(this.phase!=='cards')throw new Error('Cards are only available after a defeat');
  const card=CARDS[index];if(!card)throw new RangeError('Invalid card selection');
  card.apply(this.fighters.hero);this.phase='intermission';return card.id;
 }
 startRound(){
  if(this.phase!=='intermission')throw new Error('Round cannot start now');
  this.round++;this.phase='fight';
  for(const fighter of Object.values(this.fighters)){fighter.hp=fighter.maxHp;fighter.stance='attack';}
 }
 snapshot(){return JSON.parse(JSON.stringify({round:this.round,phase:this.phase,score:this.score,fighters:this.fighters,cards:this.cards}));}
}
