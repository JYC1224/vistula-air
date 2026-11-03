import * as Phaser from 'phaser';
import { createGameConfig } from './game/config.js';
import { GameStore } from './game/systems/GameStore.js';
import { GameUI } from './game/ui/GameUI.js';
import './styles/game.css';

const store = new GameStore();
const ui = new GameUI(store);
ui.mount(document.getElementById('game'));

new Phaser.Game(createGameConfig(store));
