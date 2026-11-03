import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { GameScene } from './scenes/GameScene.js';

export const createGameConfig = (store) => ({
  type: Phaser.AUTO,
  parent: 'route-map',
  backgroundColor: '#142d44',
  scale: {
    parent: 'route-map',
    width: 800,
    height: 332,
    mode: Phaser.Scale.RESIZE,
  },
  fps: { target: 30, limit: 30 },
  banner: false,
  scene: [BootScene, PreloadScene, new GameScene(store)],
});
