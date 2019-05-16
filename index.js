/**
 * index.js
 * 
 * What it Does:
 *   This file gets the #gameScreen and #gameOverlay elements in index.html,
 *   attaches a new game and a overlay to them, and starts the game.
 *   It also loads the .internals/config.json which is a bundle of current customization
 *   to the json files in the .koji directory
 * 
 * How to Use:
 *   Make sure this file has a script tag in index.html
 *   eg. <script src="./index.js"></script>
 */

// import and load koji configs
import Koji from 'koji-tools';
Koji.pageLoad();

// import Game and Overlay
import Game from './game/main.js';
import Overlay from './game/overlay.js';

// create get the gameScreen and gameOverlay elements
// gameScreen is the <canvas> element where the game is displayed
// gameOverlay is where the where start button, score, lives,
// play and pause buttons etc will be displayed
const gameScreen = document.getElementById("gameScreen");
const gameOverlay = document.getElementById("gameOverlay");
const topbar = document.getElementById("topBar");

// create new overlay for game
// create new game and load it
const config = Koji.config;
const overlay = new Overlay(gameOverlay)
const game = new Game(gameScreen, overlay, topbar, config);
game.load();