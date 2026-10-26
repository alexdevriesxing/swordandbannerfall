import * as Phaser from 'phaser';
import { CombatDirector, ARENA } from './systems/combat.js';
import {gameAssetUrl} from './systems/asset-paths.js';
import { TacticalBattle } from './systems/tactics.js';
import { CompanionDirector } from './systems/companions.js';
import { BattlefieldCover, shotObstruction } from './systems/cover.js';
import { PreparationPhase } from './systems/preparation.js';
import { EliminationMatch } from './systems/elimination.js';
import { interceptDamage } from './systems/abilities.js';
import { protectedCompanionDamage } from './systems/companion-damage.js';
import { ComebackDraft } from './systems/comeback-draft.js';
import { EnemyDefenseDirector } from './systems/enemy-defenses.js';
import { CombatFeed, BattlePacing } from './systems/feedback.js';
import { AttackTelegraphs, healthLabel } from './systems/telegraphs.js';
import { validImpact, resolveTarget } from './systems/impact.js';
import { nearestOpponent } from './systems/targeting.js';
import { resolveProjectileTarget } from './systems/projectile-targets.js';
import { aimVelocity } from './systems/ballistics.js';
import { sweptProjectileImpact } from './systems/projectile-impact.js';
import { planCompanionShot } from './systems/companion-projectiles.js';
import { PlatformRoutes } from './systems/platform-routes.js';
import { enemyChampionDecision } from './systems/enemy-champion.js';
import { matchResultView } from './systems/match-summary.js';
import { canPauseMatch } from './systems/pause-contract.js';
import { DemoSession } from './systems/demo-session.js';
const DEMO_BUILD=import.meta.env.MODE==='demo';
import { IRON_CITADEL_GANTRIES, IRON_CITADEL_NODES, IRON_CITADEL_LINKS, validateIronCitadel } from './levels/iron-citadel.js';
import { GROUND_ART_CENTER_Y, GROUND_ART_HEIGHT, championHitbox, validateGantrySurfaces, isGrounded, canDropThroughGantry } from './levels/arena-physics.js';

// Asset-first rendering: no generated textures, geometric stand-ins, or dummy art.
// All named assets must be licensed and staged before this scene can run.
const ASSETS = {
  background:gameAssetUrl('assets/arena/iron-citadel.webp',import.meta.env.BASE_URL),
  ground:gameAssetUrl('assets/arena/citadel-ground.webp',import.meta.env.BASE_URL),
  knight:gameAssetUrl('assets/fighters/knight.png',import.meta.env.BASE_URL),
  raider:gameAssetUrl('assets/fighters/raider.png',import.meta.env.BASE_URL),
  missile:gameAssetUrl('assets/fx/projectile.png',import.meta.env.BASE_URL),
  slash:gameAssetUrl('assets/fx/slash.png',import.meta.env.BASE_URL),
  logo:gameAssetUrl('assets/branding/fire-dragon-interactive.png',import.meta.env.BASE_URL),
  trap:gameAssetUrl('assets/defenses/trap.png',import.meta.env.BASE_URL),
  turret:gameAssetUrl('assets/defenses/turret.png',import.meta.env.BASE_URL),
  shield:gameAssetUrl('assets/defenses/shield.png',import.meta.env.BASE_URL),
  barricade:gameAssetUrl('assets/arena/destructible-barricade.png',import.meta.env.BASE_URL),
  gantry:gameAssetUrl('assets/arena/iron-citadel-gantry.png',import.meta.env.BASE_URL),
  'card-war-cry':gameAssetUrl('assets/cards/war-cry.png',import.meta.env.BASE_URL),
  'card-shieldwall':gameAssetUrl('assets/cards/shieldwall.png',import.meta.env.BASE_URL),
  'card-swift-march':gameAssetUrl('assets/cards/swift-march.png',import.meta.env.BASE_URL),
  'card-field-medics':gameAssetUrl('assets/cards/field-medics.png',import.meta.env.BASE_URL),
  'card-war-chest':gameAssetUrl('assets/cards/war-chest.png',import.meta.env.BASE_URL),
  'card-deadeye':gameAssetUrl('assets/cards/deadeye.png',import.meta.env.BASE_URL)
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
// The Arena is paused at the Scene level: update, Arcade world and scene clock
// all stop while the painted game view stays visible. No fabricated textures.
class PauseMenu extends Phaser.Scene {
  constructor(){super('PauseMenu');}
  create(){
    this.add.text(640,310,
      'SWORD & BANNERFALL\n\nPAUSED\n\nPRESS ESC TO RESUME',{
      fontFamily:'system-ui',fontSize:'33px',fontStyle:'bold',
      color:'#ffffff',align:'center',
      backgroundColor:'#101722f5',padding:{x:75,y:50},
      lineSpacing:13
    }).setOrigin(.5).setScrollFactor(0).setDepth(200);
    let closing=false;
    const resume=()=>{
      if(closing)return;
      closing=true;
      this.scene.resume('Arena');
      this.scene.stop();
    };
    this.input.keyboard.on('keydown-ESC',resume);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      this.input.keyboard.off('keydown-ESC',resume);
    });
  }
}
class Arena extends Phaser.Scene {
  constructor(){super('Arena');}
  create(){
    this.add.image(640,360,'background').setDisplaySize(1280,720);
    // Ground collider is derived from the same mandatory authored texture as the visual floor.
    this.groundBody=this.physics.add.staticImage(640,GROUND_ART_CENTER_Y,'ground')
      .setDisplaySize(1280,GROUND_ART_HEIGHT).setDepth(1);
    this.groundBody.refreshBody();
    this.physics.world.setBounds(0,0,1280,720);
    this.keys=this.input.keyboard.addKeys('W,A,S,D,SPACE,J,K,L,E,F,G,H,ENTER,ESC,ONE,TWO,THREE');
    this.director=new CombatDirector({seed:101,roundLimit:10});
    this.tactics=new TacticalBattle();this.defenseSprites=new Map();
    this.enemyDefenses=new EnemyDefenseDirector();
    this.preparation=new PreparationPhase({durationMs:12000});
    this.match=new EliminationMatch();
    this.feed=new CombatFeed();this.pacing=new BattlePacing();this.telegraphs=new AttackTelegraphs();this.healthLabels=new Map();
    this.companions=new CompanionDirector({maxPerTeam:9});this.companionSprites=new Map();
    this.comeback=new ComebackDraft();
    this.cover=new BattlefieldCover();this.coverSprites=new Map();
    validateIronCitadel();
    validateGantrySurfaces(IRON_CITADEL_GANTRIES);
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
    this.playerDropUntil=0;
    this.physics.add.collider(this.player,this.groundBody);
    this.physics.add.collider(this.enemy,this.groundBody);
    this.physics.add.collider(this.player,this.platformBodies,undefined,()=>this.time.now>=this.playerDropUntil,this);
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
    // Both champions and AI companions use swept projectile impacts below.
    // Do not register a second Arcade overlap callback: it could double-award hits.
    // Authentic Fire Dragon Interactive branding, imported from its pinned studio artwork.
    this.studioLogo=this.add.image(1210,75,'logo').setDisplaySize(76,114)
      .setScrollFactor(0).setDepth(100);
    this.overlay=this.add.text(20,18,'',{fontFamily:'system-ui',fontSize:'18px',color:'#ffffff',backgroundColor:'#101722cc',padding:{x:14,y:10}}).setScrollFactor(0).setDepth(99);
    this.feedback=this.add.text(640,110,'',{fontFamily:'system-ui',fontSize:'27px',color:'#ffcf77',align:'center'}).setOrigin(.5).setDepth(99);
    this.combatLog=this.add.text(20,510,'',{fontFamily:'system-ui',fontSize:'14px',color:'#ffdfaa',backgroundColor:'#101722aa',padding:{x:8,y:6}}).setDepth(99);
    this.cardPrompt=this.add.text(640,207,'',{fontFamily:'system-ui',fontSize:'22px',fontStyle:'bold',color:'#ffeac1',backgroundColor:'#101722ee',align:'center',padding:{x:25,y:15}}).setOrigin(.5).setScrollFactor(0).setDepth(130).setVisible(false);
    this.cardArtwork=Array.from({length:3},(_,i)=>{
      const x=410+i*230;
      const image=this.add.image(x,351,'card-war-cry').setDisplaySize(172,172)
        .setScrollFactor(0).setDepth(131).setVisible(false);
      const label=this.add.text(x,475,'',{fontFamily:'system-ui',fontSize:'16px',fontStyle:'bold',
        color:'#ffffff',backgroundColor:'#101722ee',align:'center',padding:{x:10,y:8}})
        .setOrigin(.5).setScrollFactor(0).setDepth(132).setVisible(false);
      return {image,label};
    });
    this.cameras.main.setBounds(0,0,1280,720);
    this.lastShot=0;this.lastStrike=0;this.lastEnemyAction=0;this.lastCommand=0;
    this.endShown=false;
    this.demo=DEMO_BUILD?new DemoSession():null;
    this.demoHud=this.demo?this.add.text(640,42,'HTML5 DEMO — ONE MATCH / 4 MINUTES',{
      fontFamily:'system-ui',fontSize:'15px',fontStyle:'bold',color:'#ffe4ad',
      backgroundColor:'#101722e8',padding:{x:14,y:8}
    }).setOrigin(.5).setScrollFactor(0).setDepth(120):null;
    for(const defense of this.enemyDefenses.update(this.tactics,{phase:'setup',timeMs:this.time.now}))
      this.renderDefense(defense);
    this.feedback.setText('PREPARE: F trap / G turret / H shield — ENTER to battle');
    this.showState();
  }
  makeFighter(id,texture,x){
    const sprite=this.physics.add.sprite(x,580,texture).setDisplaySize(72,100);
    sprite.setData('id',id).setData('team',id==='hero'?'blue':'red');
    const collision=championHitbox(sprite.width,sprite.height);
    sprite.body.setSize(collision.width,collision.height,true);
    sprite.body.setCollideWorldBounds(true);
    sprite.body.setGravityY(850);sprite.setDepth(4);
    this.teamSprites.set(id,sprite);return sprite;
  }
  hit(sprite,damage,type){
    if(this.match.phase!=='fight')return;
    if(!sprite.active)return;
    const id=sprite.getData('id');
    const team=sprite.getData('team');
    const opponent=team==='blue'?'red':'blue';
    const boosted=this.comeback.damage(opponent,damage,type);
    const protectedHit=this.tactics.incomingDamage(team,this.comeback.incoming(team,boosted),sprite.x);
    const intercepted=interceptDamage(this.companions.units,team,sprite.x,protectedHit.remaining,this.time.now);
    const result=this.director.damage(id,intercepted.damage,type);
    if(result.applied>0){this.cameras.main.shake(65,.0011);this.tweens.add({targets:sprite,alpha:.5,duration:70,yoyo:true});}
    if(result.applied>0){this.pacing.impact(this.time.now);this.feed.push(this.time.now,(team==='blue'?'ALLY':'ENEMY')+' champion -'+result.applied+' HP','hit');}
    sprite.setAlpha(.65);this.time.delayedCall(100,()=>sprite.active&&sprite.setAlpha(1));
    if(result.ko){
      const team=sprite.getData('team');
      const casualty=this.match.eliminate(id);
      if(casualty.accepted){
        this.tactics.grantSupply(team==='blue'?'red':'blue',15);
        this.feed.push(this.time.now,(team==='blue'?'BLUE':'RED')+' champion eliminated','ko');
        this.offerComeback(team,casualty.remaining,Boolean(casualty.winner));
      }
      this.telegraphs.cancelFor(id);
      sprite.setVelocity(0,0);
      sprite.body.enable=false;
      sprite.setActive(false).setVisible(false);
      if(this.match.winner)this.finishMatch();
    }
  }
  championTarget(source,range,attackMode='melee',ignoreCover=false){
    return nearestOpponent(source.x,source.getData('team'),{
      blue:{x:this.player.x,y:this.player.y,hp:this.director.fighters.hero.hp},
      red:{x:this.enemy.x,y:this.enemy.y,hp:this.director.fighters.enemy.hp}
    },this.companions.units,{range,cover:ignoreCover?null:this.cover,fromY:source.y,attackMode});
  }
  hitCompanion(target,damage,time=this.time.now,attackType='melee'){
    if(this.match.phase!=='fight'||!target||!(target.hp>0))return;
    const attackerTeam=target.team==='blue'?'red':'blue';
    const adjusted=this.comeback.incoming(target.team,this.comeback.damage(attackerTeam,damage,attackType));
    const protectedHit=protectedCompanionDamage(this.tactics,this.companions.units,target,adjusted,time);
    const result=this.companions.wound(target.id,protectedHit.damage);
    if(result.applied>0)this.pacing.impact(time);
    if(result.ko){
      const outcome=this.match.eliminate('ai-'+target.id);
      if(outcome.accepted){
        this.tactics.grantSupply(target.team==='blue'?'red':'blue',15);
        this.offerComeback(target.team,outcome.remaining,Boolean(outcome.winner));
      }
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
    const obstruction=shotObstruction(this.cover,{x:source.x,y:source.y-17},{x:aimX,y:(nearest?.y??target?.y??590)-17});
    if(obstruction&&Math.abs(source.x-obstruction.x)<650){this.damageCover(obstruction.id,18);return;}
    if(!nearest)return;
    const dir=Math.sign(nearest.x-source.x)||1;
    const originX=source.x+dir*43,originY=source.y-17;
    const bullet=this.bullets.create(originX,originY,'missile').setScale(.6);
    bullet.setData('previousX',originX).setData('previousY',originY);
    bullet.setData('team',source.getData('team'));
    bullet.setData('targetId',nearest.id);
    bullet.setData('damage',12);
    bullet.body.setAllowGravity(false);
    const velocity=aimVelocity({x:originX,y:originY},{x:nearest.x,y:(nearest.y??590)-17});
    bullet.setVelocity(velocity.x,velocity.y);
    this.time.delayedCall(1900,()=>bullet.active&&bullet.destroy());
  }
  fireCompanion(attacker,target,damage){
    const shot=planCompanionShot({attacker,target,damage,cover:this.cover});
    if(!shot)return false;
    const bullet=this.bullets.create(shot.origin.x,shot.origin.y,'missile').setScale(.6);
    bullet.setData('previousX',shot.origin.x).setData('previousY',shot.origin.y);
    bullet.setData('team',shot.team);
    bullet.setData('targetId',shot.targetId);
    bullet.setData('damage',shot.damage);
    bullet.body.setAllowGravity(false);
    bullet.setVelocity(shot.velocity.x,shot.velocity.y);
    this.time.delayedCall(1900,()=>bullet.active&&bullet.destroy());
    return true;
  }
  updateProjectiles(){
    const champions={
      blue:{team:'blue',x:this.player.x,y:this.player.y,hp:this.director.fighters.hero.hp},
      red:{team:'red',x:this.enemy.x,y:this.enemy.y,hp:this.director.fighters.enemy.hp}
    };
    for(const projectile of this.bullets.getChildren()){
      if(!projectile.active)continue;
      const id=projectile.getData('targetId');
      const victim=resolveProjectileTarget(id,projectile.getData('team'),champions,this.companions.units);
      if(!victim){projectile.destroy();continue;}
      const previous={x:projectile.getData('previousX')??projectile.x,
        y:projectile.getData('previousY')??projectile.y};
      const collision=sweptProjectileImpact(previous,{x:projectile.x,y:projectile.y},victim,this.cover);
      if(collision==='cover'){projectile.destroy();continue;}
      if(collision==='unit'){
        // Destroying Phaser game objects may also release their data manager.
        // Capture the damage before destruction; apply the hit exactly once.
        const damage=projectile.getData('damage')??12;
        projectile.destroy();
        if(victim.kind==='champion'){
          this.hit(id==='hero'?this.player:this.enemy,damage,'ranged');
        }else{
          this.hitCompanion(this.companions.units.find(u=>u.id===id),damage,this.time.now,'ranged');
        }
        if(this.match.phase==='finished')return;
      }else{
        projectile.setData('previousX',projectile.x).setData('previousY',projectile.y);
      }
    }
  }
  showComebackCards(){
    const offer=this.comeback.offer('blue');
    if(!offer){
      this.cardPrompt.setVisible(false);
      for(const slot of this.cardArtwork){slot.image.setVisible(false);slot.label.setVisible(false);}
      return;
    }
    const queued=this.comeback.snapshot().queued.blue;
    this.cardPrompt.setText('TURN THE TIDE — CHOOSE 1 / 2 / 3'+
      (queued?'  (+'+queued+' MORE)':''));
    this.cardPrompt.setVisible(true);
    for(let i=0;i<3;i++){
      const card=offer.options[i],slot=this.cardArtwork[i];
      slot.image.setTexture('card-'+card.id).setVisible(true);
      slot.label.setText((i+1)+'. '+card.name.toUpperCase()+'\n'+card.description).setVisible(true);
    }
  }
  offerComeback(team,remaining,ended){
    const offer=this.comeback.casualty(team,{remaining,ended});
    if(!offer)return;
    if(team==='red'){
      // Enemy captain chooses immediately; no artificial targeting or RNG.
      // The AI cannot deploy new defenses midbattle, so prioritize perks
      // it can actually use: movement, ranged accuracy, then direct damage.
      this.chooseComeback('red',[1,2,1][this.comeback.claims.red]??0);
    }else{
      this.showComebackCards();
      this.feed.push(this.time.now,'Comeback card ready: choose 1, 2 or 3','card');
    }
  }
  chooseComeback(team,index){
    const card=this.comeback.choose(team,index);
    if(!card)return false;
    if(card.supply)this.tactics.grantSupply(team,card.supply);
    if(card.heal){
      for(const unit of this.companions.units){
        if(unit.team===team&&unit.hp>0)unit.hp=Math.min(unit.maxHp,unit.hp+card.heal);
      }
      const champion=this.director.fighters[team==='blue'?'hero':'enemy'];
      if(champion.hp>0)champion.hp=Math.min(champion.maxHp,champion.hp+card.heal);
    }
    if(team==='blue')this.showComebackCards();
    this.feed.push(this.time.now,team.toUpperCase()+' CARD: '+card.name.toUpperCase(),'card');
    return true;
  }
  damageCover(id,amount){
    const hit=this.cover.damage(id,amount);
    const model=this.cover.segments.find(s=>s.id===id);
    if(hit.applied>0)this.pacing.impact(this.time.now);
    if(hit.destroyed){this.feed.push(this.time.now,'Barricade breached','cover');this.coverSprites.get(id)?.destroy();this.coverSprites.delete(id);this.feedback?.setText('COVER DESTROYED');}
    else if(hit.applied&&model){this.coverSprites.get(id)?.setAlpha(Math.max(.35,model.hp/model.maxHp));}
  }
  renderDefense(defense){
    // Every visual uses one of the mandatory finished defense textures.
    const sprite=this.add.image(defense.x,defense.kind==='turret'?591:615,defense.kind)
      .setDepth(3).setDisplaySize(defense.kind==='turret'?70:62,defense.kind==='turret'?70:44);
    // Team tint applies to existing licensed artwork, never invents a texture.
    if(defense.team==='red')sprite.setTint(0xff9a93);
    this.defenseSprites.set(defense.id,sprite);
    return sprite;
  }
  syncDefenseSprites(){
    for(const defense of this.tactics.defenses){
      if(defense.hp>0)continue;
      this.defenseSprites.get(defense.id)?.destroy();
      this.defenseSprites.delete(defense.id);
    }
  }
  deployDefense(kind){
    const result=this.tactics.deploy('blue',kind,Math.max(60,Math.min(600,this.player.x)));
    if(!result.accepted){this.feedback.setText('Cannot deploy: '+result.reason);return;}
    this.renderDefense(result.defense);
    this.feedback.setText(kind.toUpperCase()+' DEPLOYED');
  }
  finishMatch(){
    if(this.endShown||!this.match.winner)return;
    if(this.demo)this.demo.finishMatch();
    this.endShown=true;
    const result=matchResultView(this.match.snapshot());
    if(!result)return;
    this.feed.push(this.time.now,result.headline,'victory');
    this.telegraphs.clear();
    this.cardPrompt?.setVisible(false);
    for(const slot of this.cardArtwork??[]){slot.image.setVisible(false);slot.label.setVisible(false);}
    this.bullets.clear(true,true);
    this.player.setVelocity(0,0);
    this.enemy.setVelocity(0,0);
    this.feedback.setText(result.headline);
    this.showState();
    this.add.image(640,122,'logo').setDisplaySize(80,120).setScrollFactor(0).setDepth(151);
    if(this.demo){this.physics.world.pause();this.showDemoStoreLink();}
    this.resultScreen=this.add.text(640,328,
      result.headline+'\n\n'+result.summary+'\n'+result.casualties+'\n\n'+
      (this.demo?'DEMO COMPLETE — FULL WINDOWS GAME AT SNACKBREAKGAMES.COM':result.instruction),{
      fontFamily:'system-ui',fontSize:'27px',fontStyle:'bold',color:'#ffffff',
      align:'center',backgroundColor:'#101722ef',padding:{x:45,y:35},
      lineSpacing:12
    }).setOrigin(.5).setScrollFactor(0).setDepth(150);
  }
  showDemoStoreLink(){
    if(!this.demo||this.storeLink)return;
    this.storeLink=this.add.text(640,570,'VISIT SNACKBREAKGAMES.COM — FULL WINDOWS EDITION',{
      fontFamily:'system-ui',fontSize:'21px',fontStyle:'bold',color:'#ffdc87',
      backgroundColor:'#101722ef',padding:{x:23,y:13}
    }).setOrigin(.5).setScrollFactor(0).setDepth(155).setInteractive({useHandCursor:true});
    this.storeLink.on('pointerdown',()=>{
      window.open('https://www.snackbreakgames.com/','_blank','noopener,noreferrer');
    });
  }
  finishDemo(){
    if(!this.demo?.ended||this.endShown)return;
    this.endShown=true;
    this.telegraphs.clear();
    this.bullets.clear(true,true);
    this.player.setVelocity(0,0);this.enemy.setVelocity(0,0);
    this.physics.world.pause();
    this.cardPrompt?.setVisible(false);
    for(const slot of this.cardArtwork??[]){slot.image.setVisible(false);slot.label.setVisible(false);}
    this.feedback.setText('HTML5 DEMO COMPLETE');
    this.showDemoStoreLink();
    this.resultScreen=this.add.text(640,340,
      'SWORD & BANNERFALL — DEMO COMPLETE\n\n'+
      'ONE-MATCH PREVIEW / FOUR MINUTES OF COMBAT\n\n'+
      'FULL WINDOWS GAME AT SNACKBREAKGAMES.COM',{
      fontFamily:'system-ui',fontSize:'26px',fontStyle:'bold',color:'#ffffff',
      align:'center',backgroundColor:'#101722ef',padding:{x:35,y:32},lineSpacing:12
    }).setOrigin(.5).setScrollFactor(0).setDepth(150);
    this.showState();
  }
  showState(){
    if(this.demoHud){
      const remaining=Math.ceil(this.demo.snapshot().remainingMs/1000);
      this.demoHud.setText('HTML5 DEMO — '+Math.floor(remaining/60)+':'+
        String(remaining%60).padStart(2,'0')+' REMAINING — ONE MATCH');
    }
    const state=this.director.snapshot();
    const tactics=this.tactics.snapshot();
    const match=this.match.snapshot();
    this.combatLog.setText(this.feed.lines(this.time.now).join('\n'));
    this.overlay.setText('SWORD & BANNERFALL    ELIMINATION 10v10\nCHAMPION HP '+state.fighters.hero.hp+' / '+state.fighters.enemy.hp+'\nSURVIVORS '+match.remaining.blue+' : '+match.remaining.red+'    SUPPLY '+tactics.supply.blue+' : '+tactics.supply.red+'\nCOMEBACK CARDS '+this.comeback.claims.blue+' / 3    Stance '+state.fighters.hero.stance+'    Order '+tactics.orders.blue+'    Phase '+(this.preparation.phase==='setup'?'PREP '+this.preparation.remaining()+'s':state.phase));
  }
  update(time,delta){
    // Consume any resume keydown while the Scene was paused so the newly
    // resumed Arena does not immediately pause again on the same Esc press.
    if(this.pauseReleaseGate){
      Phaser.Input.Keyboard.JustDown(this.keys.ESC);
      if(!this.keys.ESC.isDown)this.pauseReleaseGate=false;
    }else if(canPauseMatch({phase:this.match.phase,demoEnded:this.demo?.ended})&&
      Phaser.Input.Keyboard.JustDown(this.keys.ESC)){
      this.pauseReleaseGate=true;
      this.scene.launch('PauseMenu');
      this.scene.pause();
      return;
    }
    if(this.demo?.ended)return;
    if(this.match.phase==='finished'){
      if(Phaser.Input.Keyboard.JustDown(this.keys.ENTER))this.scene.restart();
      return;
    }
    if(this.demo){
      const status=this.demo.advance(Math.min(delta,250),{
        fighting:this.match.phase==='fight'
      });
      if(status.ended){this.finishDemo();return;}
    }
    const p=this.player,e=this.enemy;
    if(this.preparation.phase==='setup'){
      if(Phaser.Input.Keyboard.JustDown(this.keys.F))this.deployDefense('trap');
      if(Phaser.Input.Keyboard.JustDown(this.keys.G))this.deployDefense('turret');
      if(Phaser.Input.Keyboard.JustDown(this.keys.H))this.deployDefense('shield');
      const launched=Phaser.Input.Keyboard.JustDown(this.keys.ENTER)?this.preparation.launch():this.preparation.tick(Math.min(delta,100));
      if(launched){this.match.begin();this.pacing.impact(time);this.feed.push(time,'BATTLE START','phase');this.feedback.setText('BATTLE START');}
      this.showState();return;
    }
    if(this.comeback.offer('blue')){
      if(Phaser.Input.Keyboard.JustDown(this.keys.ONE))this.chooseComeback('blue',0);
      else if(Phaser.Input.Keyboard.JustDown(this.keys.TWO))this.chooseComeback('blue',1);
      else if(Phaser.Input.Keyboard.JustDown(this.keys.THREE))this.chooseComeback('blue',2);
    }
    if(Phaser.Input.Keyboard.JustDown(this.keys.F))this.deployDefense('trap');
    if(Phaser.Input.Keyboard.JustDown(this.keys.G))this.deployDefense('turret');
    if(Phaser.Input.Keyboard.JustDown(this.keys.H))this.deployDefense('shield');
    const friendlyTargets=[
      ...(this.director.fighters.hero.hp>0?[{id:'hero',x:p.x,y:p.y,hp:this.director.fighters.hero.hp}]:[]),
      ...this.companions.units.filter(u=>u.team==='blue'&&u.hp>0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp}))
    ];
    for(const defense of this.enemyDefenses.update(this.tactics,{
      phase:'fight',timeMs:time,opponents:friendlyTargets
    }))this.renderDefense(defense);
    const hostileTargets=[
      ...(this.director.fighters.enemy.hp>0?[{id:'enemy',x:e.x,y:e.y,hp:this.director.fighters.enemy.hp}]:[]),
      ...this.companions.units.filter(u=>u.team==='red'&&u.hp>0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp}))
    ];
    // Resolve both sides symmetrically. Champions and AI escorts receive the
    // same shield, Sentinel interception, KO and comeback-card logic.
    for(const [team,targets] of [['blue',hostileTargets],['red',friendlyTargets]]){
      for(const attack of this.tactics.getTargets(team,targets,time,{cover:this.cover})){
        if(attack.targetId==='enemy')this.hit(e,attack.damage,'ranged');
        else if(attack.targetId==='hero')this.hit(p,attack.damage,'ranged');
        else{
          const victim=this.companions.units.find(u=>u.id===attack.targetId&&u.hp>0);
          if(victim)this.hitCompanion(victim,attack.damage,time,'ranged');
        }
        if(this.match.phase==='finished')return;
      }
    }
    this.syncDefenseSprites();
    this.updateProjectiles();
    if(this.match.phase==='finished')return;
    const pace=this.pacing.update(time,true);
    const aiActions=this.companions.update(time,Math.min(delta*pace,65),{
      blue:{team:'blue',x:p.x,y:p.y,platformNode:this.platforms.nearest(p.x,p.y,{maxDistance:320})?.id??null,hp:this.director.fighters.hero.hp},
      red:{team:'red',x:e.x,y:e.y,platformNode:this.platforms.nearest(e.x,e.y,{maxDistance:320})?.id??null,hp:this.director.fighters.enemy.hp}
    },this.cover,this.platforms,{blue:{speedMultiplier:this.comeback.speed('blue')},red:{speedMultiplier:this.comeback.speed('red')}});
    for(const attack of this.telegraphs.popReady(time)){
      const attacker=this.companions.units.find(u=>u.id===attack.attacker);
      if(!attacker||attacker.hp<=0)continue;
      const resolved=resolveTarget(attack,this.companions.units,{
        blue:{team:'blue',hp:this.director.fighters.hero.hp,x:p.x,y:p.y,platformNode:this.platforms.nearest(p.x,p.y,{maxDistance:180})?.id??null},
        red:{team:'red',hp:this.director.fighters.enemy.hp,x:e.x,y:e.y,platformNode:this.platforms.nearest(e.x,e.y,{maxDistance:180})?.id??null}
      });
      if(!validImpact({attacker,target:resolved,range:attacker.range,cover:this.cover}))continue;
      if(attacker.role==='ranger'){
        this.fireCompanion(attacker,{...resolved,id:attack.target},attack.damage);
        continue;
      }
      if(attack.target==='hero'||attack.target==='enemy'){
        const target=attack.target==='hero'?p:e;
        if(target.active)this.hit(target,attack.damage,'melee');
      }else{
        const victim=this.companions.units.find(u=>u.id===attack.target);
        if(!victim||victim.hp<=0)continue;
        this.hitCompanion(victim,attack.damage,time);
        if(this.match.phase==='finished')return;
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
        if(attacker.role==='ranger'){
          const target=action.targetId==='champion'
            ?{id:action.team==='blue'?'enemy':'hero',team:action.team==='blue'?'red':'blue',x:action.team==='blue'?e.x:p.x,y:action.team==='blue'?e.y:p.y,hp:action.team==='blue'?this.director.fighters.enemy.hp:this.director.fighters.hero.hp}
            :this.companions.units.find(u=>u.id===action.targetId);
          if(target)this.fireCompanion(attacker,target,action.damage);
          continue;
        }
        if(action.targetId==='champion'){
          const target=action.team==='blue'?e:p;
          if(!target.active)continue;
          this.hit(target,action.damage,'melee');
          if(this.match.phase==='finished')return;
        }else if(attacker){
          const victim=this.companions.units.find(u=>u.id===action.targetId);
          if(!victim||victim.hp<=0)continue;
          this.hitCompanion(victim,action.damage,time);
          if(this.match.phase==='finished')return;
        }
      }
    }
    const x=(this.keys.D.isDown?1:0)-(this.keys.A.isDown?1:0);
    if(p.active)p.setVelocityX(x*265*this.comeback.speed('blue'));
    if(p.active&&isGrounded(p.body)&&(Phaser.Input.Keyboard.JustDown(this.keys.SPACE)||Phaser.Input.Keyboard.JustDown(this.keys.W)))p.setVelocityY(-660);
    if(p.active&&canDropThroughGantry(p.body,p.x,IRON_CITADEL_GANTRIES)&&Phaser.Input.Keyboard.JustDown(this.keys.S)){
      // S drops through one-way gantries but cannot fall through the solid ground.
      this.playerDropUntil=time+700;
      p.setVelocityY(175);
    }
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
        x:e.x,y:e.y,grounded:isGrounded(e.body),
        blueChampion:{x:p.x,y:p.y,hp:this.director.fighters.hero.hp},
        blueUnits:this.companions.units,platforms:this.platforms,
        timeMs:time,nextTraversalAt:this.nextEnemyTraversalAt
      });
      e.setVelocityX(decision.velocityX*pace*this.comeback.speed('red'));
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
        else if(barricade&&Math.abs(barricade.x-e.x)<210)this.fire(e,decision.target);
        else if(Math.abs(decision.target.x-e.x)<560&&this.director.rng.next()<.28)this.fire(e,decision.target);
      }
    }
    this.showState();
  }
}
const swordBannerGame=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:1280,height:720,backgroundColor:'#101722',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{x:0,y:0},debug:false}},scene:[Boot,Arena,PauseMenu]});

// Strictly read-only QA introspection on loopback hosts with an explicit flag.
// Shipping the build publicly does not enable this interface or any debug actions.
if(typeof window!=='undefined'&&['localhost','127.0.0.1'].includes(window.location.hostname)
  &&new URLSearchParams(window.location.search).has('qa')){
 Object.defineProperty(window,'__SWORD_BANNERFALL_QA__',{
  configurable:false,
  value:Object.freeze({
   snapshot:()=>{
    let scene;
    try{scene=swordBannerGame.scene.getScene('Arena');}catch{return null;}
    if(!scene?.match||!(scene.sys.isActive()||scene.sys.isPaused()))return null;
    return {
     match:scene.match.snapshot(),
     paused:scene.sys.isPaused(),
     preparation:scene.preparation?.phase??null,
     preparationElapsedMs:scene.preparation?.elapsed??null,
     fighters:{
      blue:{x:scene.player?.x,y:scene.player?.y,active:scene.player?.active,
        velocityY:scene.player?.body?.velocity?.y??null},
      red:{x:scene.enemy?.x,y:scene.enemy?.y,active:scene.enemy?.active}
     },
     companions:scene.companions.units.filter(u=>u.hp>0).length,
     projectiles:scene.bullets?.countActive()??0,
     demoBuild:DEMO_BUILD,
     demo:scene.demo?.snapshot()??null,
     // Read-only acceptance diagnostics for real keyboard commands and stance.
     orders:scene.tactics?{...scene.tactics.orders}:null,
     stance:scene.director?.fighters?.hero?.stance??null,
     comeback:scene.comeback?.snapshot()??null,
     defenses:scene.tactics?.defenses.map(d=>({id:d.id,team:d.team,kind:d.kind,x:d.x,hp:d.hp}))??[],
     supply:scene.tactics?{...scene.tactics.supply}:null,
     enemyDefense:scene.enemyDefenses?.snapshot()??null,
     cover:scene.cover.snapshot().map(c=>({id:c.id,hp:c.hp}))
    };
   }
  })
 });
}
