import * as Phaser from 'phaser';
import { CombatDirector, ARENA } from './systems/combat.js';

// Asset-first rendering: no generated textures, geometric stand-ins, or dummy art.
// All named assets must be licensed and staged before this scene can run.
const ASSETS = {
  background:'/assets/arena/iron-citadel.webp',
  ground:'/assets/arena/citadel-ground.webp',
  knight:'/assets/fighters/knight.png',
  raider:'/assets/fighters/raider.png',
  missile:'/assets/fx/projectile.png',
  slash:'/assets/fx/slash.png',
  logo:'/assets/branding/fire-dragon-interactive.png'
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
    this.physics.world.setBounds(0,0,1280,720);
    this.keys=this.input.keyboard.addKeys('W,A,S,D,SPACE,J,K,L,E,ONE,TWO,THREE');
    this.director=new CombatDirector({seed:101,roundLimit:10});
    this.teamSprites=new Map();this.bullets=this.physics.add.group({allowGravity:false});
    this.player=this.makeFighter('hero','knight',220);
    this.enemy=this.makeFighter('enemy','raider',1030);
    this.player.body.setCollideWorldBounds(true);this.enemy.body.setCollideWorldBounds(true);
    this.physics.add.overlap(this.bullets,[this.player,this.enemy],(target,projectile)=>{
      if(target.getData('team')===projectile.getData('team'))return;
      projectile.destroy();this.hit(target,12,'ranged');
    });
    this.overlay=this.add.text(20,18,'',{fontFamily:'system-ui',fontSize:'18px',color:'#ffffff',backgroundColor:'#101722cc',padding:{x:14,y:10}}).setScrollFactor(0).setDepth(99);
    this.feedback=this.add.text(640,110,'',{fontFamily:'system-ui',fontSize:'27px',color:'#ffcf77',align:'center'}).setOrigin(.5).setDepth(99);
    this.cameras.main.setBounds(0,0,1280,720);
    this.lastShot=0;this.lastStrike=0;this.lastEnemyAction=0;this.lastCommand=0;
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
    if(this.director.phase!=='fight')return;
    const id=sprite.getData('id');const result=this.director.damage(id,damage,type);
    sprite.setAlpha(.65);this.time.delayedCall(100,()=>sprite.active&&sprite.setAlpha(1));
    if(result.ko){sprite.setVelocity(0,0);sprite.setActive(false).setVisible(false);this.roundEnd();}
  }
  strike(source,target){
    const facing=target.x-source.x;
    if(Math.abs(facing)<112&&Math.abs(target.y-source.y)<100){
      const slash=this.add.image(source.x+Math.sign(facing)*70,source.y-15,'slash').setDepth(6).setScale(.5);
      this.tweens.add({targets:slash,alpha:0,scale:.85,duration:180,onComplete:()=>slash.destroy()});
      this.hit(target,21,'melee');
    }
  }
  fire(source,target){
    const dir=Math.sign(target.x-source.x)||1;
    const bullet=this.bullets.create(source.x+dir*43,source.y-17,'missile').setScale(.6);
    bullet.setData('team',source.getData('team'));bullet.body.setAllowGravity(false);
    bullet.setVelocityX(dir*650);
    this.time.delayedCall(1900,()=>bullet.active&&bullet.destroy());
  }
  roundEnd(){
    const outcome=this.director.finishRound();
    this.feedback.setText(outcome.message);
    this.showState();
    if(this.director.phase==='finished')return;
    this.time.delayedCall(1100,()=>{
      if(this.director.phase==='cards'){this.feedback.setText('Defeat bonus: press 1 / 2 / 3');return;}
      this.nextRound();
    });
  }
  nextRound(){
    this.director.startRound();
    for(const [id,sprite] of this.teamSprites){
      sprite.setActive(true).setVisible(true).setAlpha(1);
      sprite.setPosition(id==='hero'?220:1030,580).setVelocity(0,0);
    }
    this.feedback.setText('');this.showState();
  }
  showState(){
    const state=this.director.snapshot();
    this.overlay.setText('SWORD & BANNERFALL    ROUND '+state.round+'/10\nBLUE '+state.score.blue+'  |  RED '+state.score.red+'     HP '+state.fighters.hero.hp+' / '+state.fighters.enemy.hp+'\nStance '+state.fighters.hero.stance+'    Retinue '+state.fighters.hero.command+'    Phase '+state.phase);
  }
  update(time,delta){
    if(this.director.phase==='cards'){
      for(const [key,index] of [['ONE',0],['TWO',1],['THREE',2]]){
        if(Phaser.Input.Keyboard.JustDown(this.keys[key])){this.director.selectCard(index);this.nextRound();break;}
      }return;
    }
    if(this.director.phase!=='fight')return;
    const p=this.player,e=this.enemy;
    const x=(this.keys.D.isDown?1:0)-(this.keys.A.isDown?1:0);
    p.setVelocityX(x*265);
    if(Phaser.Input.Keyboard.JustDown(this.keys.SPACE)&&p.body.blocked.down)p.setVelocityY(-505);
    this.director.setStance('hero',this.keys.L.isDown?'guard':'attack');
    if(Phaser.Input.Keyboard.JustDown(this.keys.E)&&time-this.lastCommand>350){
      this.lastCommand=time;this.director.cycleCommand('hero');
    }
    if(Phaser.Input.Keyboard.JustDown(this.keys.J)&&time-this.lastStrike>400){
      this.lastStrike=time;this.strike(p,e);
    }
    if(Phaser.Input.Keyboard.JustDown(this.keys.K)&&time-this.lastShot>900){
      this.lastShot=time;this.fire(p,e);
    }
    const gap=p.x-e.x;
    e.setVelocityX(Math.abs(gap)>95?Math.sign(gap)*155:0);
    if(time-this.lastEnemyAction>620){
      this.lastEnemyAction=time;
      if(Math.abs(gap)<110)this.strike(e,p);
      else if(Math.abs(gap)<560&&this.director.rng.next()<.24)this.fire(e,p);
    }
    this.showState();
  }
}
new Phaser.Game({type:Phaser.AUTO,parent:'game',width:1280,height:720,backgroundColor:'#101722',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},physics:{default:'arcade',arcade:{gravity:{x:0,y:0},debug:false}},scene:[Boot,Arena]});
