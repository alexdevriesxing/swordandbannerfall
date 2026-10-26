// One shared contract for whether a full or limited-demo encounter may pause.
// The terminal result screen is immutable, and a completed demo cannot restart.
export function canPauseMatch({phase,demoEnded=false}={}){
 return (phase==='setup'||phase==='fight')&&demoEnded!==true;
}
