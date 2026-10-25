import * as Phaser from 'phaser';
import { CombatDirector, ARENA } from './systems/combat.js';
import { TacticalBattle } from './systems/tactics.js';
import { CompanionDirector } from './systems/companions.js';
import { BattlefieldCover } from './systems/cover.js';
import { PreparationPhase } from './systems/preparation.js';
import { EliminationMatch } from './systems/elimination.js';
import { interceptDamage } from './systems/abilities.js';
import { CombatFeed, BattlePacing } from './systems/feedback.js';
import { AttackTelegraphs, healthLabel } from './systems/telegraphs.js';
import { validImpact, resolveTarget } from './systems/impact.js';
import { nearestOpponent } from './systems/targeting.js';
import { shouldProjectileHit } from './systems/projectile.js';
import { aimVelocity, overlapsCompanion } from './systems/ballistics.js';
import { PlatformRoutes } from './systems/platform-routes.js';
import { enemyChampionDecision } from './systems/enemy-champion.js';
import { IRON_CITADEL_GANTRIES, IRON_CITADEL_NODES, IRON_CITADEL_LINKS, validateIronCitadel } from './levels/iron-citadel.js';

// Asset-first rendering: no generated textures, geometric stand-ins, or dummy art.
// All named assets must be licensed and staged before this scene can run.
const ASSETS = {
  background:'/assets/arena/iron-citadel.webp',
  ground:'/assets/arena/citadel-ground.webp',
  knight:'/assets/fighters/knight.png',
  raider:'/assets/fighters/raider.png',
  missile:'/assets/fx/projectile.png',
  slash:'/assets/fx/slash.png',
  logo:'/assets/branding/fire-dragon-interactive.png',
  trap:'/assets/defenses/trap.png',
  turret:'/assets/defenses/turret.png',
  shield:'/assets/defenses/shield.png',
  barricade:'/assets/arena/destructible-barricade.png',
  gantry:'/assets/arena/iron-citadel-gantry.png'
};
class Boot extends Phaser.Scene {
  constructor(){super('Boot');}
  preload(){
    for(const [key,path] of Object.entries(ASSETS))this.load.image(key,path);
    this.load.on('loaderror',file=>{this.registry.set('assetFailure',true); console.error('Missing production asset:',file.src);});
  }
  create(){
    if(this.registry.get('assetFailure')){
      this.add.text(48,100,'Production art missing. See assets/README.md.\nThe game intentionally does not render placeholder artwork.',{fontFamily:'system-ui',fontSize:'22px',color:'#ffffff',wordWrap:{width:850}});
      return;
    }
    this.scene.start('Arena');
  }
}
class Arena extends Phaser.Scene {
  constructor(){super('Arena');}
  create(){
    this.add.image(640,360,'background').setDisplaySize(1280,720);
    this.add.image(640,661,'ground').setDisplaySize(1280,120);
    this.physics.world.setBounds(0,0,1280,660);
    this.keys=this.input.keyboard.addKeys('W,A,S,D,SPACE,J,K,L,E,F,G,H,ENTER,ONE,TWO,THREE');
    this.director=new CombatDirector({seed:101,roundLimit:10});
    this.tactics=new TacticalBattle();this.defenseSprites=new Map();
    this.preparation=new PreparationPhase({durationMs:12000});
    this.match=new EliminationMatch();
    this.feed=new CombatFeed();this.pacing=new BattlePacing();this.telegraphs=new AttackTelegraphs();this.healthLabels=new Map();
    this.companions=new CompanionDirector({maxPerTeam:9});this.companionSprites=new Map();
    this.cover=new BattlefieldCover();this.coverSprites=new Map();
    validateIronCitadel();
    this.platforms=new PlatformRoutes(IRON_CITADEL_NODES,IRON_CITADEL_LINKS);
    this.platformBodies=this.physics.add.staticGroup();
    for(const platform of IRON_CITADEL_GANTRIES){
      const sprite=this.platformBodies.create(platform.x,platform.y,'gantry');
      sprite.setDisplaySize(platform.width,platform.height).setDepth(2);
      sprite.refreshBody();
      // Jump up through the gantry and land on its upper surface only.
      sprite.body.checkCollision.down=false;
      sprite.body.checkCollision.left=false;
      sprite.body.checkCollision.right=false;
      sprite.body.checkCollision.up=true;
    }
    this.coverBodies=this.physics.add.staticGroup();
    for(const segment of this.cover.snapshot()){
      const barricade=this.coverBodies.create(segment.x,580,'barricade');
      barricade.setDisplaySize(segment.width,125).setDepth(2);
      barricade.refreshBody();
      this.coverSprites.set(segment.id,barricade);
    }
    this.teamSprites=new Map();this.bullets=this.physics.add.group({allowGravity:false});
    this.player=this.makeFighter('hero','knight',220);
    this.enemy=this.makeFighter('enemy','raider',1030);
    this.match.register('blue','hero');this.match.register('red','enemy');
    this.player.body.setCollideWorldBounds(true);this.enemy.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player,this.platformBodies);
    this.physics.add.collider(this.player,this.coverBodies);
    this.physics.add.collider(this.enemy,this.coverBodies);
    this.enemyDropUntil=0;
    this.nextEnemyTraversalAt=0;
    this.physics.add.collider(this.enemy,this.platformBodies,undefined,()=>this.time.now>=this.enemyDropUntil,this);
    const formations=[
      ...Array.from({length:9},(_,i)=>['blue',i===7?350:70+i*31,'knight',['sentinel','ranger','vanguard'][i%3],i===7?'west-gantry':null]),
      ...Array.from({length:9},(_,i)=>['red',i===7?930:1210-i*31,'raider',['sentinel','ranger','vanguard'][i%3],i===7?'east-gantry':null])
    ];
    for(const [team,x,texture,role,spawnNode] of formations){
      const platformNode=spawnNode??this.platforms.nearest(x,590,{maxDistance:300})?.id??null;
      const unit=this.companions.add(team,x,{role,platformNode});
      if(unit){
        this.match.register(team,'ai-'+unit.id);
        const y=this.platforms.nodes.get(platformNode)?.y??590;
        const visual=this.add.image(x,y,texture).setDisplaySize(45,65).setDepth(3).setAlpha(.9);
        this.companionSprites.set(unit.id,visual);
        this.healthLabels.set(unit.id,this.add.text(x,y-54,healthLabel(unit.hp,unit.maxHp),{fontFamily:'system-ui',fontSize:'11px',color:team==='blue'?'#92d7ff':'#ffabab'}).setOrigin(.5).setDepth(9));
      }
    }
    // Phaser passes the projectile group member first, the champion sprite second.
    this.physics.add.overlap(this.bullets,[this.player,this.enemy],(projectile,target)=>{
      if(!shouldProjectileHit(projectile.getData('team'),target.getData('team'),projectile.active,target.active))return;
      if(projectile.getData('targetId')!==target.getData('id'))return;
      projectile.destroy();
      this.hit(target,12,'ranged');
    });
    this.overlay=this.add.text(20,18,'',{fontFamily:'system-ui',fontSize:'18px',color:'#ffffff',backgroundColor:'#101722cc',padding:{x:14,y:10}}).setScrollFactor(0).setDepth(99);
    this.feedback=this.add.text(640,110,'',{fontFamily:'system-ui',fontSize:'27px',color:'#ffcf77',align:'center'}).setOrigin(.5).setDepth(99);
    this.combatLog=this.add.text(20,510,'',{fontFamily:'system-ui',fontSize:'14px',color:'#ffdfaa',backgroundColor:'#101722aa',padding:{x:8,y:6}}).setDepth(99);
    this.cameras.main.setBounds(0,0,1280,720);
    this.lastShot=0;this.lastStrike=0;this.lastEnemyAction=0;this.lastCommand=0;
    this.feedback.setText('PREPARE DEFENSES: F trap / G turret / H shield — ENTER to battle');
    this.showState();
  }
  makeFighter(id,texture,x){
    const sprite=this.physics.add.sprite(x,580,texture).setDisplaySize(72,100);
    sprite.setData('id',id).setData('team',id==='hero'?'blue':'red');
    sprite.body.setSize(sprite.displayWidth*.65,sprite.displayHeight*.86,true);
    sprite.body.setCollideWorldBounds(true);
    sprite.body.setGravityY(850);sprite.setDepth(4);
    this.teamSprites.set(id,sprite);return sprite;
  }
  hit(sprite,damage,type){
    if(this.match.phase!=='fight')return;
    if(!sprite.active)return;
    const id=sprite.getData('id');
    const team=sprite.getData('team');
    const protectedHit=this.tactics.incomingDamage(team,damage,sprite.x);
    const intercepted=interceptDamage(this.companions.units,team,sprite.x,protectedHit.remaining,this.time.now);
    const result=this.director.damage(id,intercepted.damage,type);
    if(result.applied>0){this.cameras.main.shake(65,.0011);this.tweens.add({targets:sprite,alpha:.5,duration:70,yoyo:true});}
    if(result.applied>0){this.pacing.impact(this.time.now);this.feed.push(this.time.now,(team==='blue'?'ALLY':'ENEMY')+' champion -'+result.applied+' HP','hit');}
    sprite.setAlpha(.65);this.time.delayedCall(100,()=>sprite.active&&sprite.setAlpha(1));
    if(result.ko){
      const team=sprite.getData('team');
      const casualty=this.match.eliminate(id);
      if(casualty.accepted){this.tactics.grantSupply(team==='blue'?'red':'blue',15);this.feed.push(this.time.now,(team==='blue'?'BLUE':'RED')+' champion eliminated','ko');}
      this.telegraphs.cancelFor(id);
      sprite.setVelocity(0,0);sprite.setActive(false).setVisible(false);
      if(this.match.winner)this.finishMatch();
    }
  }
  championTarget(source,range,attackMode='melee',ignoreCover=false){
    return nearestOpponent(source.x,source.getData('team'),{
      blue:{x:this.player.x,y:this.player.y,hp:this.director.fighters.hero.hp},
      red:{x:this.enemy.x,y:this.enemy.y,hp:this.director.fighters.enemy.hp}
    },this.companions.units,{range,cover:ignoreCover?null:this.cover,fromY:source.y,attackMode});
  }
  hitCompanion(target,damage,time=this.time.now){
    const result=this.companions.wound(target.id,damage);
    if(result.applied>0)this.pacing.impact(time);
    if(result.ko){
      const outcome=this.match.eliminate('ai-'+target.id);
      if(outcome.accepted)this.tactics.grantSupply(target.team==='blue'?'red':'blue',15);
      this.telegraphs.cancelFor(target.id);
      this.companionSprites.get(target.id)?.destroy();this.companionSprites.delete(target.id);
      this.healthLabels.get(target.id)?.destroy();this.healthLabels.delete(target.id);
      this.feed.push(time,(target.team==='blue'?'BLUE':'RED')+' '+target.role+' eliminated','ko');
      if(outcome.winner)this.finishMatch();
    }
  }
  strike(source,target){
    const selected=this.championTarget(source,112);
    const facing=(selected?.x??target.x)-source.x;
    if(!selected)return;
    if(Math.abs(selected.x-source.x)<112&&!this.cover.obstruction(source.x,selected.x)){
      const slash=this.add.image(source.x+Math.sign(facing)*70,source.y-15,'slash').setDepth(6).setScale(.5);
      this.tweens.add({targets:slash,alpha:0,scale:.85,duration:180,onComplete:()=>slash.destroy()});
      if(selected.kind==='champion')this.hit(selected.id==='hero'?this.player:this.enemy,21,'melee');
      else this.hitCompanion(selected,21);
    }
  }
  fire(source,target){
    const nearest=this.championTarget(source,650,'ranged',true);
    // A nearby barricade can be breached even when opponents are beyond shot range.
    const aimX=nearest?.x??target.x;
    const obstruction=this.cover.obstruction(source.x,aimX);
    if(obstruction&&Math.abs(source.x-obstruction.x)<650){this.damageCover(obstruction.id,18);return;}
    if(!nearest)return;
    const dir=Math.sign(nearest.x-source.x)||1;
    const originX=source.x+dir*43,originY=source.y-17;
    const bullet=this.bullets.create(originX,originY,'missile').setScale(.6);
    bullet.setData('team',source.getData('team'));
    bullet.setData('targetId',nearest.id);
    bullet.body.setAllowGravity(false);
    const velocity=aimVelocity({x:originX,y:originY},{x:nearest.x,y:(nearest.y??590)-17});
    bullet.setVelocity(velocity.x,velocity.y);
    this.time.delayedCall(1900,()=>bullet.active&&bullet.destroy());
  }
  updateCompanionProjectiles(){
    for(const projectile of this.bullets.getChildren()){
      if(!projectile.active)continue;
      const id=projectile.getData('targetId');
      if(typeof id!=='number')continue;
      const victim=this.companions.units.find(u=>u.id===id);
      if(!victim||victim.hp<=0){projectile.destroy();continue;}
      if(victim.team===projectile.getData('team')){projectile.destroy();continue;}
      if(this.cover.obstruction(projectile.x,victim.x)){projectile.destroy();continue;}
      if(overlapsCompanion(projectile,victim)){
        projectile.destroy();this.hitCompanion(victim,12);
        if(this.match.phase==='finished')return;
      }
    }
  }
  damageCover(id,amount){
    const hit=this.cover.damage(id,amount);
    const model=this.cover.segments.find(s=>s.id===id);
    if(hit.applied>0)this.pacing.impact(this.time.now);
    if(hit.destroyed){this.feed.push(this.time.now,'Barricade breached','cover');this.coverSprites.get(id)?.destroy();this.coverSprites.delete(id);this.feedback?.setText('COVER DESTROYED');}
    else if(hit.applied&&model){this.coverSprites.get(id)?.setAlpha(Math.max(.35,model.hp/model.maxHp));}
  }
  deployDefense(kind){
    const result=this.tactics.deploy('blue',kind,Math.max(60,Math.min(600,this.player.x)));
    if(!result.accepted){this.feedback.setText('Cannot deploy: '+result.reason);return;}
    const d=result.defense;
    const sprite=this.add.image(d.x,kind==='turret'?591:615,kind).setDepth(3).setDisplaySize(kind==='turret'?70:62,kind==='turret'?70:44);
    this.defenseSprites.set(d.id,sprite);
    this.feedback.setText(kind.toUpperCase()+' DEPLOYED');
  }
  finishMatch(){
    this.feedback.setText(this.match.winner.toUpperCase()+' VICTORY — ALL ENEMIES ELIMINATED');
    this.feed.push(this.time.now,this.match.winner.toUpperCase()+' TEAM WINS','victory');
    this.showState();
    this.player.setVelocity(0,0);this.enemy.setVelocity(0,0);
  }
  showState(){
    const state=this.director.snapshot();
    const tactics=this.tactics.snapshot();
    const match=this.match.snapshot();
    this.combatLog.setText(this.feed.lines(this.time.now).join('\n'));
    this.overlay.setText('SWORD & BANNERFALL    ELIMINATION 10v10\nCHAMPION HP '+state.fighters.hero.hp+' / '+state.fighters.enemy.hp+'\nSURVIVORS '+match.remaining.blue+' : '+match.remaining.red+'    SUPPLY '+tactics.supply.blue+'\nAI ACTIVE '+this.companions.units.filter(u=>u.team==='blue'&&u.hp>0).length+' : '+this.companions.units.filter(u=>u.team==='red'&&u.hp>0).length+'    Stance '+state.fighters.hero.stance+'    Order '+tactics.orders.blue+'    Phase '+(this.preparation.phase==='setup'?'PREP '+this.preparation.remaining()+'s':state.phase));
  }
  update(time,delta){
    if(this.match.phase==='finished')return;
    const p=this.player,e=this.enemy;
    if(this.preparation.phase==='setup'){
      if(Phaser.Input.Keyboard.JustDown(this.keys.F))this.deployDefense('trap');
      if(Phaser.Input.Keyboard.JustDown(this.keys.G))this.deployDefense('turret');
      if(Phaser.Input.Keyboard.JustDown(this.keys.H))this.deployDefense('shield');
      const launched=Phaser.Input.Keyboard.JustDown(this.keys.ENTER)?this.preparation.launch():this.preparation.tick(Math.min(delta,100));
      if(launched){this.match.begin();this.pacing.impact(time);this.feed.push(time,'BATTLE START','phase');this.feedback.setText('BATTLE START');}
      this.showState();return;
    }
    if(Phaser.Input.Keyboard.JustDown(this.keys.F))this.deployDefense('trap');
    if(Phaser.Input.Keyboard.JustDown(this.keys.G))this.deployDefense('turret');
    if(Phaser.Input.Keyboard.JustDown(this.keys.H))this.deployDefense('shield');
    for(const attack of this.tactics.getTargets('blue',e.x,time)){
      this.hit(e,attack.damage,'ranged');
      const defense=this.tactics.defenses.find(d=>d.id===attack.defenseId);
      if(defense?.hp===0){this.defenseSprites.get(defense.id)?.destroy();this.defenseSprites.delete(defense.id);}
      if(this.match.phase==='finished')return;
    }
    this.updateCompanionProjectiles();
    if(this.match.phase==='finished')return;
    const pace=this.pacing.update(time,true);
    const aiActions=this.companions.update(time,Math.min(delta*pace,65),{
      blue:{team:'blue',x:p.x,y:p.y,platformNode:this.platforms.nearest(p.x,p.y,{maxDistance:320})?.id??null,hp:this.director.fighters.hero.hp},
      red:{team:'red',x:e.x,y:e.y,platformNode:this.platforms.nearest(e.x,e.y,{maxDistance:320})?.id??null,hp:this.director.fighters.enemy.hp}
    },this.cover,this.platforms);
    for(const attack of this.telegraphs.popReady(time)){
      const attacker=this.companions.units.find(u=>u.id===attack.attacker);
      if(!attacker||attacker.hp<=0)continue;
      const resolved=resolveTarget(attack,this.companions.units,{
        blue:{team:'blue',hp:this.director.fighters.hero.hp,x:p.x,y:p.y},
        red:{team:'red',hp:this.director.fighters.enemy.hp,x:e.x,y:e.y}
      });
      if(!validImpact({attacker,target:resolved,range:attacker.range,cover:this.cover}))continue;
      if(attack.target==='hero'||attack.target==='enemy'){
        const target=attack.target==='hero'?p:e;
        if(target.active)this.hit(target,attack.damage,'melee');
      }else{
        const victim=this.companions.units.find(u=>u.id===attack.target);
        if(!victim||victim.hp<=0)continue;
        const mitigation=interceptDamage(this.companions.units,victim.team,victim.x,attack.damage,time);
        const hit=this.companions.wound(victim.id,mitigation.damage);
        if(hit.applied>0)this.pacing.impact(time);
        if(hit.ko){this.match.eliminate('ai-'+victim.id);this.telegraphs.cancelFor(victim.id);this.tactics.grantSupply(attacker.team,15);this.feed.push(time,(victim.team==='blue'?'BLUE':'RED')+' '+victim.role+' eliminated','ko');this.companionSprites.get(victim.id)?.destroy();this.companionSprites.delete(victim.id);this.healthLabels.get(victim.id)?.destroy();this.healthLabels.delete(victim.id);if(this.match.winner){this.finishMatch();return;}}
      }
      if(this.match.phase==='finished')return;
    }
    for(const action of aiActions){
      if(action.type==='move'){const visual=this.companionSprites.get(action.id);if(visual){visual.x=action.x;visual.y=action.y??590;}const unit=this.companions.units.find(u=>u.id===action.id);const label=this.healthLabels.get(action.id);if(label&&unit){label.x=action.x;label.y=(action.y??590)-54;label.setText(healthLabel(unit.hp,unit.maxHp));}}
      if(action.type==='cover-attack')this.damageCover(action.coverId,action.damage);
      if(action.type==='attack'){
        const acting=this.companions.units.find(u=>u.id===action.id);
        if(!acting||acting.hp<=0)continue;
        if(action.ability){const target=action.targetId==='champion'?(action.team==='blue'?'enemy':'hero'):action.targetId;const pending=this.telegraphs.schedule(time,action.id,target,action.damage);if(pending)this.feed.push(time,action.ability.toUpperCase()+' incoming','warning');continue;}
        const attacker=acting;
        if(action.targetId==='champion'){
          const target=action.team==='blue'?e:p;
          if(!target.active)continue;
          this.hit(target,action.damage,'melee');
          if(this.match.phase==='finished')return;
        }else if(attacker){
          const victim=this.companions.units.find(u=>u.id===action.targetId);
          if(!victim||victim.hp<=0)continue;
          const mitigation=interceptDamage(this.companions.units,victim.team,victim.x,action.damage,time);
          const result=this.companions.wound(action.targetId,mitigation.damage);
          if(result.applied>0)this.pacing.impact(time);
          if(result.ko){
            this.telegraphs.cancelFor(action.targetId);
            this.healthLabels.get(action.targetId)?.destroy();this.healthLabels.delete(action.targetId);
            const fallen=this.companions.units.find(u=>u.id===action.targetId);
            this.match.eliminate('ai-'+action.targetId);
            this.feed.push(time,(victim.team==='blue'?'BLUE':'RED')+' '+victim.role+' eliminated','ko');
            if(fallen)this.tactics.grantSupply(action.team,15);
            this.companionSprites.get(action.targetId)?.destroy();this.companionSprites.delete(action.targetId);
            if(this.match.winner){this.finishMatch();return;}
          }
        }
      }
    }
    const x=(this.keys.D.isDown?1:0)-(this.keys.A.isDown?1:0);
    if(p.active)p.setVelocityX(x*265);
    if(p.active&&Phaser.Input.Keyboard.JustDown(this.keys.SPACE)&&p.body.blocked.down)p.setVelocityY(-660);
    this.director.setStance('hero',this.keys.L.isDown?'guard':'attack');
    if(Phaser.Input.Keyboard.JustDown(this.keys.E)&&time-this.lastCommand>350){
      this.lastCommand=time;this.director.cycleCommand('hero');
      this.tactics.order('blue',this.director.fighters.hero.command);
      this.companions.command('blue',this.director.fighters.hero.command);
    }
    if(p.active&&Phaser.Input.Keyboard.JustDown(this.keys.J)&&time-this.lastStrike>400){
      this.lastStrike=time;this.strike(p,e);
    }
    if(p.active&&Phaser.Input.Keyboard.JustDown(this.keys.K)&&time-this.lastShot>900){
      this.lastShot=time;this.fire(p,e);
    }
    if(e.active){
      const decision=enemyChampionDecision({
        x:e.x,y:e.y,grounded:e.body.blocked.down,
        blueChampion:{x:p.x,y:p.y,hp:this.director.fighters.hero.hp},
        blueUnits:this.companions.units,platforms:this.platforms,
        timeMs:time,nextTraversalAt:this.nextEnemyTraversalAt
      });
      e.setVelocityX(decision.velocityX*pace);
      if(decision.jump){
        e.setVelocityY(-660);
        this.nextEnemyTraversalAt=time+1600;
      }else if(decision.drop){
        this.enemyDropUntil=time+700;
        e.setVelocityY(175);
        this.nextEnemyTraversalAt=time+1600;
      }
      // Continue fighting surviving squadmates even after the player champion falls.
      if(decision.target&&time-this.lastEnemyAction>620){
        this.lastEnemyAction=time;
        const barricade=this.cover.obstruction(e.x,decision.target.x);
        if(this.championTarget(e,112))this.strike(e,p);
        else if(barricade&&Math.abs(barricade.x-e.x)<210)this.fire(e,p);
        else if(Math.abs(decision.target.x-e.x)<560&&this.director.rng.next()<.28)this.fire(e,p);
      }
    }
    this.showState();
  }
}
new Phaser.Game({type:Phaser.AUTO,parent:'game',width:1280,height:720,backgroundColor:'#101722',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{x:0,y:0},debug:false}},scene:[Boot,Arena]});
