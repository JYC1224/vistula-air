import { AIRPORTS, MISSIONS } from '../data/airports.js';

export class RouteMap {
  constructor(scene, store) {
    this.scene = scene;
    this.store = store;
    this.flights = [];
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  project(lon, lat) {
    const { width, height } = this.scene.scale;
    const bounds = this.store.ui.mapMode === 'world' ? [-82, 65, 20, 70] : [-27, 48, 34, 67];
    const mercator = (latitude) => Math.log(Math.tan(Math.PI / 4 + Math.max(-80, Math.min(80, latitude)) * Math.PI / 360));
    const minX = bounds[0] * Math.PI / 180, maxX = bounds[1] * Math.PI / 180;
    const minY = mercator(bounds[2]), maxY = mercator(bounds[3]);
    const scale = Math.min((width - 45) / (maxX - minX), (height - 45) / (maxY - minY));
    const left = (width - (maxX - minX) * scale) / 2;
    const top = (height - (maxY - minY) * scale) / 2;
    return { x: left + (lon * Math.PI / 180 - minX) * scale, y: top + (maxY - mercator(lat)) * scale };
  }

  draw() {
    this.container?.destroy(true);
    this.container = this.scene.add.container(0, 0);
    this.flights = [];
    const { width, height } = this.scene.scale;
    if (width < 10 || height < 10) return;
    const graphics = this.scene.add.graphics(); this.container.add(graphics);
    graphics.fillStyle(0x142d44, 1); graphics.fillRect(0, 0, width, height);
    graphics.lineStyle(1, 0x36516a, 0.22);
    for (let lon = -180; lon <= 180; lon += 10) {
      const a = this.project(lon, -20), b = this.project(lon, 80); graphics.lineBetween(a.x, a.y, b.x, b.y);
    }
    for (let lat = -10; lat <= 80; lat += 10) {
      const a = this.project(-180, lat), b = this.project(180, lat); graphics.lineBetween(a.x, a.y, b.x, b.y);
    }
    const countries = this.scene.cache.json.get('world')?.features || [];
    for (const country of countries) {
      const polygons = country.geometry.type === 'MultiPolygon' ? country.geometry.coordinates : [country.geometry.coordinates];
      for (const polygon of polygons) {
        const ring = polygon[0];
        if (!ring?.length || Math.max(...ring.map((point) => point[0])) - Math.min(...ring.map((point) => point[0])) > 180) continue;
        const points = ring.map(([lon, lat]) => this.project(lon, lat));
        if (points.every((point) => point.x < -40) || points.every((point) => point.x > width + 40) || points.every((point) => point.y < -40) || points.every((point) => point.y > height + 40)) continue;
        graphics.fillStyle(country.properties.name === 'Poland' ? 0x38596f : 0x244158, 1);
        graphics.lineStyle(0.8, 0x45627a, 0.55);
        graphics.beginPath(); points.forEach((point, index) => index ? graphics.lineTo(point.x, point.y) : graphics.moveTo(point.x, point.y));
        graphics.closePath(); graphics.fillPath(); graphics.strokePath();
      }
    }
    const labels = this.store.ui.mapMode === 'world' ? [['NORTH ATLANTIC', -36, 42], ['EUROPE', 14, 47]] : [['FRANCE', 2, 46], ['GERMANY', 9.5, 50.3], ['POLAND', 21, 49.8], ['SPAIN', -4, 40], ['SWEDEN', 15, 62], ['ITALY', 14, 42], ['NORWAY', 7, 63]];
    for (const [text, lon, lat] of labels) {
      const point = this.project(lon, lat);
      const label = this.scene.add.text(point.x, point.y, text, { fontFamily: 'Arial', fontSize: this.store.ui.mapMode === 'world' ? '10px' : '8px', color: '#5e7e99', letterSpacing: 2 }).setOrigin(0.5).setAlpha(0.6);
      this.container.add(label);
    }
    const active = this.store.state.routes.filter((route) => route.active);
    for (const route of active) this.drawRoute(graphics, route.destination, 0x75c9b2, true);
    if (!active.some((route) => route.destination === this.store.ui.selected)) this.drawRoute(graphics, this.store.ui.selected, 0xefb06e, false);
    for (const airport of Object.values(AIRPORTS)) {
      const point = this.project(airport.lon, airport.lat);
      if (point.x < 10 || point.x > width - 10 || point.y < 27 || point.y > height - 27) continue;
      const hub = airport.code === 'WAW';
      const selected = airport.code === this.store.ui.selected;
      const isActive = active.some((route) => route.destination === airport.code);
      const mission = MISSIONS.find((item) => item.destination === airport.code);
      const locked = mission && mission.unlock > this.store.state.completed.length;
      const color = hub ? 0xf4bd7f : selected ? 0xefb06e : isActive ? 0x84d5bc : locked ? 0x607e96 : 0xa1b8cc;
      if (hub || selected) { graphics.lineStyle(1, color, 0.35); graphics.strokeCircle(point.x, point.y, hub ? 12 : 10); }
      graphics.fillStyle(color, 1); graphics.fillCircle(point.x, point.y, hub ? 4.5 : 3);
      if (!hub) {
        const hit = this.scene.add.circle(point.x, point.y, 16, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => this.store.selectDestination(airport.code));
        hit.on('pointerover', () => { hit.setFillStyle(0xe8b175, 0.16); });
        hit.on('pointerout', () => { hit.setFillStyle(0xffffff, 0.001); });
        this.container.add(hit);
      }
      const offsets = { WAW: [12, -9], CPH: [11, -17], VIE: [11, 6], LHR: [-37, -18], FCO: [10, 2], KEF: [12, -8], DXB: [-35, -18], JFK: [11, -9] };
      const [dx, dy] = offsets[airport.code];
      const label = this.scene.add.text(point.x + dx, point.y + dy, `${airport.code}${hub ? '  HUB' : ''}`, { fontFamily: 'Inter, Arial', fontSize: hub ? '12px' : '10px', fontStyle: hub || selected ? 'bold' : 'normal', color: hub || selected ? '#f4c28f' : locked ? '#7c96ab' : '#bbcedd', backgroundColor: '#142d4455', padding: { left: 2, right: 2 } });
      this.container.add(label);
    }
  }

  drawRoute(graphics, destination, color, active) {
    const airport = AIRPORTS[destination]; if (!airport) return;
    const start = this.project(AIRPORTS.WAW.lon, AIRPORTS.WAW.lat), end = this.project(airport.lon, airport.lat);
    const distance = Math.hypot(end.x - start.x, end.y - start.y);
    const control = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 - Math.min(85, distance * 0.23) };
    const at = (t) => ({ x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x, y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y });
    graphics.lineStyle(active ? 1.5 : 1.2, color, active ? 0.8 : 0.65);
    let previous = at(0);
    for (let step = 1; step <= 48; step += 1) { const next = at(step / 48); if (active || Math.floor(step / 3) % 2 === 0) graphics.lineBetween(previous.x, previous.y, next.x, next.y); previous = next; }
    if (this.scene.textures.exists('plane-marker')) {
      const plane = this.scene.add.image(start.x, start.y, 'plane-marker').setDisplaySize(active ? 14 : 12, active ? 14 : 12).setTint(active ? 0xdbf0e9 : 0xf2b476).setAlpha(active ? 0.95 : 0.75);
      this.container.add(plane);
      this.flights.push({ plane, at, offset: this.flights.length * 0.34 + 0.38 });
    }
  }

  update(time) {
    for (const flight of this.flights) {
      const t = this.reducedMotion ? 0.5 : (time / 28000 + flight.offset) % 1;
      const point = flight.at(t), ahead = flight.at(Math.min(1, t + 0.001));
      flight.plane.setPosition(point.x, point.y).setRotation(Math.atan2(ahead.y - point.y, ahead.x - point.x) + Math.PI / 2);
    }
  }

  destroy() { this.container?.destroy(true); }
}
