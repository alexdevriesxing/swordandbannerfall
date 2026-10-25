// Hand-authored Iron Citadel combat layout. No geometry is rendered as art:
// the matching licensed gantry texture is mandatory before the scene starts.
export const IRON_CITADEL_GANTRIES=Object.freeze([
 Object.freeze({id:'west-gantry',x:350,y:490,width:240,height:24,landingY:445}),
 Object.freeze({id:'east-gantry',x:930,y:490,width:240,height:24,landingY:445})
]);
export const IRON_CITADEL_NODES=Object.freeze([
 {id:'west-gantry',x:350,y:445,width:240},
 {id:'west-foot',x:250,y:590},
 {id:'west-cross',x:470,y:590},
 {id:'east-cross',x:760,y:590},
 {id:'east-foot',x:1030,y:590},
 {id:'east-gantry',x:930,y:445,width:240}
]);
export const IRON_CITADEL_LINKS=Object.freeze([
 ['west-gantry','west-foot'],
 ['west-foot','west-cross'],
 ['west-cross','east-cross'],
 ['east-cross','east-foot'],
 ['east-foot','east-gantry']
]);
export function validateIronCitadel(){
 const nodes=new Map(IRON_CITADEL_NODES.map(n=>[n.id,n]));
 for(const ledge of IRON_CITADEL_GANTRIES){
  const landing=nodes.get(ledge.id);
  if(!landing||landing.x!==ledge.x||landing.y!==ledge.landingY||landing.width!==ledge.width)throw new Error('Invalid gantry landing: '+ledge.id);
  if(!(ledge.width>0&&ledge.height>0)||ledge.x-ledge.width/2<50||ledge.x+ledge.width/2>1230)throw new Error('Invalid gantry geometry');
 }
 return true;
}
