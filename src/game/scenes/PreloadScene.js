import * as Phaser from 'phaser';
import { SCENE_KEYS } from '../constants/sceneKeys.js';
import { asset } from '../utils/format.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.PRELOAD);
  }

  preload() {
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'PREPARING YOUR NETWORK…', { fontSize: '10px', fontFamily: 'Arial', color: '#87a1b8' }).setOrigin(0.5);
    this.load.json('world', asset('data/world.geojson'));
    this.load.svg('plane-marker', asset('images/ui/plane-marker.svg'), { width: 32, height: 32 });
  }

  create() {
    this.scene.start(SCENE_KEYS.GAME);
  }
}
