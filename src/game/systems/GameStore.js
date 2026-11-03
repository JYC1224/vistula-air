import { act, advanceDay, availableMission, createInitialState, SAVE_KEY, validateSave } from './simulation.js';

export class GameStore {
  constructor() {
    this.listeners = new Set();
    this.saved = true;
    this.state = this.load();
    const selected = availableMission(this.state)?.destination || 'JFK';
    this.ui = { view: 'operations', selected, mapMode: ['JFK', 'DXB'].includes(selected) ? 'world' : 'europe', fleetTab: 'owned', manufacturer: 'all', compare: [] };
  }

  load() {
    try {
      const candidate = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (validateSave(candidate)) return candidate;
    } catch { /* Start a fresh company if storage is unavailable or corrupt. */ }
    return createInitialState();
  }

  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }

  emit(event = {}) { for (const listener of this.listeners) listener(event); }

  setUI(next) { Object.assign(this.ui, next); this.emit({ type: 'ui' }); }

  selectDestination(code) {
    this.setUI({ selected: code, mapMode: ['JFK', 'DXB'].includes(code) ? 'world' : this.ui.mapMode, view: 'operations' });
  }

  dispatch(action, payload = {}) {
    const result = action === 'advance' ? advanceDay(this.state) : action === 'reset' ? { ok: true, state: createInitialState() } : act(this.state, action, payload);
    if (result.ok) {
      this.state = result.state;
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); this.saved = true; } catch { this.saved = false; }
      this.emit({ type: action, result });
    }
    return result;
  }
}
