// Standard-mapping controllers: Xbox / DualShock / browser Gamepad API
// via Phaser 4's Scene Input GamepadPlugin. This module is renderer-free.
const DEADZONE=.28;
export const GAMEPAD_BUTTONS=Object.freeze({
 jump:0,shoot:1,melee:2,order:3,
 guard:4,turret:5,trap:6,shield:7,
 pause:8,confirm:9
});
const BUTTONS=Object.freeze(['jump','shoot','melee','order','guard','turret','trap','shield','pause','confirm']);
const NEUTRAL=Object.freeze({
 axis:0,up:false,down:false,jump:false,shoot:false,melee:false,
 order:false,guard:false,turret:false,trap:false,shield:false,
 pause:false,confirm:false,
 card1:false,card2:false,card3:false
});
export function readGamepadState(pad){
 if(!pad||pad.connected!==true)return {...NEUTRAL};
 const pressed=index=>{
  const button=pad.buttons?.[index];
  return button?.pressed===true||Number.isFinite(button?.value)&&button.value>.5
    ||typeof pad.isButtonDown==='function'&&pad.isButtonDown(index)===true;
 };
 const analog=Number.isFinite(pad.leftStick?.x)?pad.leftStick.x:0;
 const axis=Math.abs(analog)>=DEADZONE?Math.max(-1,Math.min(1,analog)):0;
 const horizontal=pad.left===true?-1:pad.right===true?1:axis;
 const raw=Object.fromEntries(BUTTONS.map(k=>[k,pressed(GAMEPAD_BUTTONS[k])]));
 return {
  ...raw,axis:horizontal,up:pad.up===true||pad.leftStick?.y<-.65,
  down:pad.down===true||pad.leftStick?.y>.65,
  card1:raw.melee,card2:raw.order,card3:raw.shoot
 };
}
export class GamepadEdgeTracker{
 constructor(){this.previous={...NEUTRAL};}
 read(pad){
  const held=readGamepadState(pad);
  const pressed={};
  for(const key of BUTTONS.concat(['up','down','card1','card2','card3']))
   pressed[key]=held[key]===true&&this.previous[key]!==true;
  this.previous=held;
  return {held,pressed};
 }
 reset(){this.previous={...NEUTRAL};}
}
