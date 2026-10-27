// Compact factual reference for the actual arena keyboard bindings.
// The pause UI uses this text without adding invented textures or icons.
export function pauseHelp({localTwoPlayer=false}={}){
 const shared=[
  'BLUE CHAMPION',
  'A / D  move     W / SPACE  jump     S  drop through gantry',
  'J  melee     K  ranged     L  guard     E  squad order',
  'F / G / H  trap / turret / shield     1 / 2 / 3  comeback cards'
 ];
 if(localTwoPlayer)shared.push(
  '',
  'RED CHAMPION',
  'LEFT / RIGHT  move     UP  jump     DOWN  drop',
  'U  melee     I  ranged     O  guard     R  squad order',
  'V / B / N  trap / turret / shield     Q / T / Y  comeback cards'
 );
 else shared.push('',
  'VS AI — red champion is computer controlled',
  'During preparation press P to switch to Local 2P'
 );
 shared.push('', 'CONTROLLERS: left stick to move · face buttons to attack / jump',
  'ESC OR CONTROLLER BACK TO RESUME');
 return shared.join('\n');
}
