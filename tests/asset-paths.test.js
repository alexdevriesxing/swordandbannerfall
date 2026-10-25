import test from 'node:test';
import assert from 'node:assert/strict';
import {gameAssetUrl} from '../src/systems/asset-paths.js';

test('offline Electron pages use relative art URLs',()=>{
 assert.equal(gameAssetUrl('assets/arena/iron-citadel.webp','./'),'./assets/arena/iron-citadel.webp');
 assert.equal(gameAssetUrl('assets/branding/fire-dragon-interactive.png','./'),'./assets/branding/fire-dragon-interactive.png');
});
test('hosted web assets work at root or prefixed deployment base',()=>{
 assert.equal(gameAssetUrl('assets/fx/projectile.png','/'),'/assets/fx/projectile.png');
 assert.equal(gameAssetUrl('assets/fx/projectile.png','/games/sword/'),'/games/sword/assets/fx/projectile.png');
});
test('asset paths reject traversal and external URLs',()=>{
 for(const path of ['assets/../../secrets.txt','https://attacker.invalid/a.png','//host/file.png','assets//foo.png'])
  assert.throws(()=>gameAssetUrl(path),/Invalid game art/);
 assert.throws(()=>gameAssetUrl('assets/fx/projectile.png','https://remote.invalid/'));
});
