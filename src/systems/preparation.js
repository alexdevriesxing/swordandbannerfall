// Preparation is a deliberately small tactical choice, not unit micromanagement.
export class PreparationPhase {
 constructor({durationMs=12000}={}){if(!(durationMs>0))throw new RangeError('duration');this.durationMs=durationMs;this.phase='setup';this.elapsed=0;}
 tick(ms){if(!Number.isFinite(ms)||ms<0)throw new RangeError('elapsed');if(this.phase!=='setup')return false;this.elapsed+=ms;if(this.elapsed>=this.durationMs){this.phase='fight';return true;}return false;}
 launch(){if(this.phase!=='setup')return false;this.phase='fight';return true;}
 reset(){this.phase='setup';this.elapsed=0;}
 remaining(){return this.phase==='setup'?Math.max(0,Math.ceil((this.durationMs-this.elapsed)/1000)):0;}
}
