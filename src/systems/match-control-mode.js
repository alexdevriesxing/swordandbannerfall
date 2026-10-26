// Match control mode is locked when preparation ends. A Local 2P battle still
// uses two complete 10-fighter rosters; only its red champion changes controller.
export const MATCH_CONTROL_MODES=Object.freeze(['vs-ai','local-2p']);
export class MatchControlMode {
 constructor(){this.mode='vs-ai';this.locked=false;}
 get localTwoPlayer(){return this.mode==='local-2p';}
 toggle(){
  if(this.locked)return false;
  this.mode=this.localTwoPlayer?'vs-ai':'local-2p';
  return true;
 }
 begin(){
  if(this.locked)return false;
  this.locked=true;return true;
 }
 snapshot(){return {mode:this.mode,localTwoPlayer:this.localTwoPlayer,locked:this.locked};}
}
