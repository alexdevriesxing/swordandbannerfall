// Authored physical measurements in Iron Citadel scene coordinates.
// Visual geometry always comes from licensed production art; no shapes/textures are generated.
import {GROUND_Y} from '../systems/navigation.js';

export const COMPANION_HEIGHT=65;
export const GROUND_ART_HEIGHT=120;
export const CHAMPION_HEIGHT=100;
export const CHAMPION_WIDTH=72;
export const CHAMPION_HITBOX_WIDTH_RATIO=0.65;
export const CHAMPION_HITBOX_HEIGHT_RATIO=0.86;

export const FLOOR_TOP_Y=GROUND_Y+COMPANION_HEIGHT/2;
export const GROUND_ART_CENTER_Y=FLOOR_TOP_Y+GROUND_ART_HEIGHT/2;

export function championHitbox(textureWidth,textureHeight){
 if(![textureWidth,textureHeight].every(v=>Number.isFinite(v)&&v>0))throw new RangeError('Invalid champion texture size');
 // Arcade Body.setSize() uses native (unscaled) texture dimensions.
 return {width:textureWidth*CHAMPION_HITBOX_WIDTH_RATIO,
  height:textureHeight*CHAMPION_HITBOX_HEIGHT_RATIO};
}

export function championLandingY(surfaceTopY){
 if(!Number.isFinite(surfaceTopY))throw new RangeError('Invalid landing surface');
 return surfaceTopY-CHAMPION_HEIGHT*CHAMPION_HITBOX_HEIGHT_RATIO/2;
}

export function validateGantrySurfaces(gantries){
 if(!Array.isArray(gantries)||!gantries.length)throw new Error('No approved authored gantries');
 for(const g of gantries){
  if(![g.y,g.height,g.landingY].every(Number.isFinite)||g.height<=0)throw new Error('Invalid gantry collision geometry');
  const artTop=g.y-g.height/2;
  const companionFeet=g.landingY+COMPANION_HEIGHT/2;
  if(Math.abs(artTop-companionFeet)>1)throw new Error('Gantry landing does not align with artwork: '+g.id);
 }
 return true;
}
