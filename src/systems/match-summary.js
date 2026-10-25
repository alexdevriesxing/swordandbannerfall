// Pure terminal match presentation used by the live Phaser result screen.
export function matchResultView(snapshot){
 if(!snapshot||snapshot.phase!=='finished'||!['blue','red'].includes(snapshot.winner))return null;
 const remaining=snapshot.remaining,eliminations=snapshot.eliminations;
 if(!remaining||!eliminations||![remaining.blue,remaining.red,eliminations.blue,eliminations.red].every(Number.isInteger))throw new Error('Invalid match result');
 if(remaining[snapshot.winner==='blue'?'red':'blue']!==0)throw new Error('Winner does not match elimination state');
 return {
  headline:snapshot.winner.toUpperCase()+' TEAM VICTORY',
  summary:'FINAL SURVIVORS  BLUE '+remaining.blue+'  |  RED '+remaining.red,
  casualties:'ELIMINATIONS  BLUE '+eliminations.blue+'  |  RED '+eliminations.red,
  instruction:'PRESS ENTER TO PLAY AGAIN'
 };
}
