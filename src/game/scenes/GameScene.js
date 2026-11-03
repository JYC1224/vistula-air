import * as Phaser from 'phaser';
import { SCENE_KEYS } from '../constants/sceneKeys.js';
import { RouteMap } from '../objects/RouteMap.js';

export class GameScene extends Phaser.Scene {
  constructor(store) {
    super(SCENE_KEYS.GAME);
    this.store = store;
  }

  create() {
    this.routeMap = new RouteMap(this, this.store);
    this.routeMap.draw();
    this.redraw = () => {
      if (this.pendingDraw) return;
      this.pendingDraw = requestAnimationFrame(() => {
        this.pendingDraw = null;
        if (this.sys.isActive()) this.routeMap.draw();
      });
    };
    this.unsubscribe = this.store.subscribe(this.redraw);
    this.scale.on('resize', this.redraw);
    this.resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 20 && height > 20) this.scale.resize(Math.round(width), Math.round(height));
    });
    this.resizeObserver.observe(document.getElementById('route-map'));
    this.events.once('shutdown', () => {
      this.unsubscribe?.();
      this.scale.off('resize', this.redraw);
      this.resizeObserver.disconnect();
      if (this.pendingDraw) cancelAnimationFrame(this.pendingDraw);
      this.routeMap.destroy();
    });
  }

  update(time) { this.routeMap?.update(time); }
}
