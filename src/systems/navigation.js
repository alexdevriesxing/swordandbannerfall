// Deterministic jump traversal for short, authored obstacles.
// All positions are world coordinates; the renderer uses the same final character textures.
export const GROUND_Y=590;
export function jumpPlan(unit,goal,cover,{maxWidth=90,cooldownMs=2600,timeMs=0}={}){
 if(!cover||!Number.isFinite(goal)||Math.abs(goal-unit.x)<10)return null;
 if(unit.jump&&unit.jump.active)return null;
 if(timeMs<(unit.nextJumpAt??0))return null;
 const block=cover.obstruction(unit.x,goal);
 if(!block||block.width>maxWidth)return null;
 const dir=Math.sign(goal-unit.x);
 if(Math.abs(unit.x-(block.x-dir*(block.width/2+35)))>48)return null;
 const land=block.x+dir*(block.width/2+42);
 if(land<50||land>1230)return null;
 return {active:true,startX:unit.x,endX:land,startedAt:timeMs,durationMs:850,nextJumpAt:timeMs+850+cooldownMs};
}
export function advanceJump(unit,timeMs){
 const j=unit.jump;
 if(!j?.active)return null;
 const t=Math.min(1,Math.max(0,(timeMs-j.startedAt)/j.durationMs));
 unit.x=j.startX+(j.endX-j.startX)*t;
 const y=GROUND_Y-115*4*t*(1-t);
 if(t>=1){unit.jump=null;unit.nextJumpAt=j.nextJumpAt;}
 return {type:'move',id:unit.id,x:unit.x,y,jumping:t<1};
}
