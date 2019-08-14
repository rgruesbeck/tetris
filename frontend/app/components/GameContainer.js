
import { h, Component } from 'preact';
import PropTypes from 'prop-types';

import Game from '../../game/main';
import Overlay from '../../game/overlay.js';

class GameContainer extends Component {
  componentDidMount() {

    const gameScreen = document.getElementById('gameScreen');
    const gameBoard = document.getElementById("gameBoard");
    const gameEffects = document.getElementById("gameEffects");
    const gameOverlay = document.getElementById("gameOverlay");
    const topbar = document.getElementById('topBar');

    const overlay = new Overlay(gameOverlay)
    this.game = new Game(gameScreen, gameBoard, gameEffects, overlay, topbar, Koji.config);

    this.game.load();
  }

  componentWillUnmount() {

    this.game.destroy();
  }

  render() {
    return (
      <div id={'game-container'} >
        <div id='app'>
          <div id='topBar'></div>
          <canvas id='gameScreen' style='opacity: 0;'></canvas>
          <canvas id="gameBoard" style="opacity: 0;"></canvas>
          <canvas id="gameEffects" style="opacity: 0;"></canvas>
          <div id='gameOverlay'>
            <div class='container'>
              <div id='loading' class='la-ball-clip-rotate'>
                <span id='loading-progress'>0%</span>
                <div></div>
              </div>
              <div class='center'>
                <div id='banner'>Game Title</div>
                <div id='button'>Start</div>
                <div id='instructions'></div>
              </div>
              <div id='score'>score</div>
              <div id='lives'>lives</div>
              <i id='mute' class='material-icons'>volume_up</i>
              <i id='pause' class='material-icons'>pause</i>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default GameContainer;

