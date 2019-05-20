/**
 * game/main.js
 * 
 * What it Does:
 *   This file is the main game class
 *   Important parts are the load, create, and play functions
 *   
 *   Load: is where images, sounds, and fonts are loaded
 *   
 *   Create: is where game elements and characters are created
 *   
 *   Play: is where game characters are updated according to game play
 *   before drawing a new frame to the screen, and calling play again
 *   this creates an animation just like the pages of a flip book
 * 
 *   Other parts include boilerplate for requesting and canceling new frames
 *   handling input events, pausing, muting, etc.
 * 
 * What to Change:
 *   Most things to change will be in the play function
 */

import Koji from 'koji-tools';

import {
    requestAnimationFrame,
    cancelAnimationFrame
} from './helpers/animationFrame.js';

import {
    loadList,
    loadImage,
    loadSound,
    loadFont
} from './helpers/assetLoaders.js';

import {
    gridRow,
    neighborDown,
    neighborLeft,
    neighborRight,
    setGridCell
} from './utils/gridUtils.js';

import Piece from './characters/piece.js';

class Game {

    constructor(screen, board, overlay, topbar, config) {
        this.config = config; // customization
        this.overlay = overlay;
        this.topbar = topbar;

        this.canvas = screen; // game screen
        this.ctx = screen.getContext("2d"); // game screen context

        this.boardCanvas = board; // game board
        this.boardCtx = board.getContext("2d"); // game board context

        // frame count, rate, and time
        // this is just a place to keep track of frame rate (not set it)
        this.frame = {
            count: 0,
            time: Date.now(),
            rate: null,
            scale: null
        };

        // game settings
        this.state = {
            current: 'loading',
            prev: '',
            score: 0,
            tickRate: parseInt(this.config.settings.tickRate),
            paused: false,
            muted: localStorage.getItem('game-muted') === 'true'
        };

        this.input = {
            active: 'keyboard',
            keyboard: { up: false, right: false, left: false, down: false },
            mouse: { x: 0, y: 0, click: false },
            touch: { x: 0, y: 0 },
        };

        // setup event listeners
        // handle keyboard events
        document.addEventListener('keydown', ({ code }) => this.handleKeyboardInput('keydown', code));
        document.addEventListener('keyup', ({ code }) => this.handleKeyboardInput('keyup', code));

        // setup event listeners for mouse movement
        document.addEventListener('mousemove', ({ clientY }) => this.handleMouseMove(clientY));

        // setup event listeners for mouse movement
        document.addEventListener('touchmove', ({ touches }) => this.handleTouchMove(touches[0]));

        // handle overlay clicks
        this.overlay.root.addEventListener('click', ({ target }) => this.handleClicks(target));

        // handle resize events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener("orientationchange", (e) => this.handleResize(e));
        
        // handle koji config changes
        Koji.on('change', (scope, key, value) => {
            console.log('updating configs...', scope, key, value);
            this.config[scope][key] = value;
            this.cancelFrame(this.frame.count - 1);
            this.load();
        });

    }

    init() {
        // set 

        // set topbar and topbar color
        this.topbar.active = this.config.settings.gameTopBar;
        this.topbar.style.display = this.topbar.active ? 'block' : 'none';
        this.topbar.style.backgroundColor = this.config.colors.primaryColor;

        // set screen size
        this.canvas.width = window.innerWidth; // set game screen width
        this.canvas.height = this.topbar.active ? window.innerHeight - this.topbar.clientHeight : window.innerHeight; // set game screen height

        // set screen
        this.screen = {
            top: 0,
            bottom: this.canvas.height,
            left: 0,
            right: this.canvas.width,
            centerX: this.canvas.width / 2,
            centerY: this.canvas.height / 2,
            scale: ((this.canvas.width + this.canvas.height) / 2) * 0.003
        };

        // set board size
        this.boardCanvas.width = this.canvas.width / 2;
        this.boardCanvas.height = this.canvas.height;

        // create tick queue
        this.tickQueue = [];

        // set state
        let { tickRate } = this.config.settings;
        this.setState({
            score: 0,
            tickRate: parseInt(tickRate)
        });

        // board settings
        let { columns, rows } = this.config.settings;
        this.board = {
            width: columns,
            height: rows,
            columns: columns,
            rows: rows,
            cellSize: Math.min(this.boardCanvas.width / columns, this.boardCanvas.height / rows),
            blocks: [],
            grid: []
        }

        // set board size
        let boardHeight = this.board.height * this.board.cellSize;
        this.boardCanvas.height = boardHeight;
        this.boardCanvas.style.top = `${(window.innerHeight - boardHeight) / 2}px`;

        // set containers
        this.images = {}; // place to keep images
        this.sounds = {}; // place to keep sounds
        this.fonts = {}; // place to keep fonts

        // create lists
        this.pieces = []; // place to put active pieces
        this.stack = []; // place to put stacked pieces

        // set document body to backgroundColor
        document.body.style.backgroundColor = this.config.colors.backgroundColor;

        // set loading indicator to textColor
        document.querySelector('#loading').style.color = this.config.colors.textColor;

    }

    load() {
        // load pictures, sounds, and fonts

        this.init(); // apply new configs
        
        // make a list of assets
        const gameAssets = [
            loadImage('playerImage', this.config.images.playerImage),
            loadImage('butterflyImage', this.config.images.butterflyImage),
            loadImage('backgroundImage', this.config.images.backgroundImage),
            loadSound('backgroundMusic', this.config.sounds.backgroundMusic),
            loadFont('gameFont', this.config.settings.fontFamily)
        ];

        // put the loaded assets the respective containers
        loadList(gameAssets)
        .then((assets) => {

            this.images = assets.image;
            this.sounds = assets.sound;

        })
        .then(() => this.create());
    }

    create() {
        // set overlay styles
        this.overlay.setStyles({...this.config.colors, ...this.config.settings});

        this.setState({ current: 'ready' });
        this.play();
    }

    play() {
        // update game characters

        // clear the screen of the last picture
        this.ctx.fillStyle = this.config.colors.backgroundColor; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // clear the board of the last picture
        this.boardCtx.fillStyle = this.config.colors.boardColor; 
        this.boardCtx.fillRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);

        // draw and do stuff that you need to do
        // no matter the game state
        // this.ctx.drawImage(this.images.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);

        // ready to play
        if (this.state.current === 'ready') {
            this.overlay.hide('loading');
            this.canvas.style.opacity = 1;
            this.boardCanvas.style.opacity = 1;

            this.overlay.setBanner(this.config.settings.name);
            this.overlay.setButton(this.config.settings.startText);
            this.overlay.setInstructions({
                desktop: this.config.settings.instructionsDesktop,
                mobile: this.config.settings.instructionsMobile
            });

            this.overlay.show('stats');
            this.overlay.setScore(this.state.score);

            this.overlay.setMute(this.state.muted);
            this.overlay.setPause(this.state.paused);

            // this.setState({ current: 'play' });
        }

        // game play
        if (this.state.current === 'play') {

            // if last state was 'ready'
            // hide overlay items
            if (this.state.prev === 'ready') {
                this.overlay.hide(['banner', 'button', 'instructions'])
            }

            // play background music
            if (!this.state.muted) { this.sounds.backgroundMusic.play(); }

            // check for game over
            // game over if there are blocks on the top row
            let topRow = gridRow(this.board.grid, 0);
            if (topRow.length > 0) {
                this.setState({ current: 'over' });
            }

            // every game tick update the game
            let queuedTick = this.tickQueue.length > 0;
            if (queuedTick) {

                // run tick task: shift, rotate, etc
                const tick = this.tickQueue.pop();
                tick.run();

                // if there is a placed piece
                // transfer all the blocks from a placed piece
                // to the stack of blocks
                this.stack = [
                    ...this.stack,
                    ...this.pieces
                    .filter(piece => piece.placed)
                    .map(piece => piece.body)
                    .flat()
                ];

                // remove placed pieces from pieces list
                this.pieces = [
                    ...this.pieces
                    .filter(piece => !piece.placed)
                ]

                // if there is no piece in play
                // put a new piece in play
                if (this.pieces.filter(p => !p.placed).length < 1) {
                    this.pieces = [
                        ...this.pieces,
                        new Piece({
                            ctx: this.boardCtx,
                            board: this.board,
                            image: this.images.butterflyImage,
                            color: this.config.colors.blockColorOne,
                            cellSize: this.board.cellSize,
                            cellBounds: {
                                top: 0,
                                right: this.board.width,
                                bottom: this.board.height,
                                left: 0
                            },
                            bounds: this.screen
                        })
                    ]
                }

                // update board blocks
                this.board.blocks = [
                    ...this.pieces
                    .map(piece => piece.body)
                    .flat(),
                    ...this.stack
                ]

                // update the grid with
                // current placed block locations
                this.board.grid = this.stack
                .map(blocks => blocks.cell)
                .reduce((grid, cell) => {

                   // flag the grid cell as occupied by a block
                   return setGridCell(grid, cell, true);

                   // flag the grid cell as
                }, [])

            }

            // schedule a tick to shift piece down by tick rate
            let scheduledTick = this.frame.count % this.state.tickRate === 0;
            if (scheduledTick) {

                // queue shift down for block in the piece
                this.queueTick(() => this.shiftPieceDown());


                // clear-line
                // full rows of block get removed
                // get row counts (how many placed blocks are in each row)
                let rowCounts = this.stack
                .map(block => block.cell.y)
                .reduce((rows, y) => {

                    // set empty cell to 0
                    if (typeof rows[y] === 'undefined') { rows[y] = 0; }

                    // increment cell full count
                    rows[y] += 1;

                    return rows;
                }, {})

                // get full rows (row count equals board columns)
                let fullRows = Object.entries(rowCounts)
                .filter(ent => ent[1] === this.board.columns)
                .map(ent => parseInt(ent[0]));

                // remove blocks from full row
                // and shift the stack down
                if (fullRows.length > 0) {
                    // mark all block above line as unsupported
                    // remove blocks
                    this.stack = [
                        ...this.stack
                        .map(block => {
                            if (block.cell.y < fullRows[0]) {
                                block.unsupported = true;
                            }

                            return block;
                        })
                        .filter(block => {
                            console.log(fullRows);
                            return block.cell.y != fullRows[0];
                        })
                    ]


                    // queue shift down for blocks in the stack
                    this.queueTick(() => this.shiftStackDown());
                }

                // clear-line gravity
                // do cascade style clear-line gravity
                // https://tetris.fandom.com/wiki/Line_clear#Line_clear_gravity

                // mark unsupported blocks in stack

            }

            // draw board
            this.board.blocks
            .forEach(block => block.draw());
        }

        // player wins
        if (this.state.current === 'win') {

        }

        // game over
        if (this.state.current === 'over') {

            this.overlay.setBanner('Game Over');
        }

        // draw the next screen
        this.requestFrame(() => this.play());
    }

    shiftStackDown() {
        // shift un-supported blocks down
        this.stack = this.stack
        .map(block => {

            if (block.unsupported) {

                // shift down
                block.shift({ y: 1 });

                // re-mark as supported
                block.unsupported = false;
            }

            return block;
        })
    }

    shiftPieceDown() {
        this.updatePieces((piece) => {
            // check for blocks below
            let hasDownNeighbor = piece.body
                .some(block => {
                    return neighborDown(this.board.grid, block.cell);
                })

            if (!hasDownNeighbor) {

                // shift down
                piece.shift({ y: 1 });
            } else {

                // mark as placed
                piece.placed = true;
            }

            return piece;
        });
    }

    shiftPieceLeft() {
        this.updatePieces((piece) => {
            // check for left blocks
            let hasLeftNeighbor = piece.body
            .some(block => {
                // check there is a block on the left
                return neighborLeft(this.board.grid, block.cell);
            });

            if (!hasLeftNeighbor) {

                // shift to the left
                piece.shift({ x: -1 })
            }

            return piece;
        });
    }

    shiftPieceRight() {
        this.updatePieces((piece) => {
            // check for right blocks
            let hasRightNeighbor = piece.body
            .some(block => {
                // check there is a block on the left
                return neighborRight(this.board.grid, block.cell);
            });

            if (!hasRightNeighbor) {

                // shift to the right
                piece.shift({ x: 1 })
            }

            return piece;
        });
    }

    rotatePiece() {
        this.updatePieces((piece) => {

            piece.rotate();
            return piece;
        });
    }

    updatePieces(fn) {
        this.pieces = this.pieces
        .map(p => fn(p));
    }

    queueTick(fn) {
        // add a new tick to the tick queue
        this.tickQueue = [
            { run: fn },
            ...this.tickQueue
        ];
    }

    // event listeners
    handleClicks(target) {
        if (this.state.current === 'loading') { return; }
        // mute
        if (target.id === 'mute') {
            this.mute();
        }

        // pause
        if (target.id === 'pause') {
            this.pause();
        }

        // button
        if ( target.id === 'button') {
            this.setState({ current: 'play' });

            // if defaulting to have sound on by default
            // double mute() to warmup iphone audio here
            this.mute();
            this.mute();
        }

        if (this.state.current === 'over') {
            // restart
            this.load();
        }

    }

    handleKeyboardInput(type, code) {
        this.input.active = 'keyboard';

        if (type === 'keydown') {
            // rotate
            if (code === 'ArrowUp') {
                this.queueTick(() => this.rotatePiece());
            }

            // shift left
            if (code === 'ArrowLeft') {
                this.queueTick(() => this.shiftPieceLeft());
            }

            // shift right
            if (code === 'ArrowRight') {
                this.queueTick(() => this.shiftPieceRight());
            }

            // shift down
            if (code === 'ArrowDown') {
                this.queueTick(() => this.shiftPieceDown());
            }


            // drop
            if (code === 'Space') {
                // this.shiftPiece({ y: 3 })
            }
        }

        if (type === 'keyup') {

            // any key restart
            // when game over, or ready
            if (this.state.current.match(/over|ready/)) {
                this.setState({ current: 'play' });
            }
        }
    }

    handleMouseMove(y) {
        this.input.active = 'mouse';
        this.input.mouse.y = y;
    }

    handleTouchMove(touch) {
        let { clientX, clientY } = touch;

        this.input.active = 'touch';
        this.input.touch.x = clientX;
        this.input.touch.y = clientY;
    }

    handleResize() {

        document.location.reload();
    }

    // pause game
    pause() {
        if (this.state.current != 'play') { return; }

        this.state.paused = !this.state.paused;
        this.overlay.setPause(this.state.paused);

        if (this.state.paused) {
            // pause game loop
            this.cancelFrame(this.frame.count - 1);

            // mute all game sounds
            Object.keys(this.sounds).forEach((key) => {
                this.sounds[key].muted = true;
                this.sounds[key].pause();
            });

            this.overlay.setBanner('Paused');
        } else {
            // resume game loop
            this.requestFrame(() => this.play(), true);

            // resume game sounds if game not muted
            if (!this.state.muted) {
                Object.keys(this.sounds).forEach((key) => {
                    this.sounds[key].muted = false;
                    this.sounds.backgroundMusic.play();
                });
            }

            this.overlay.hide('banner');
        }
    }

    // mute game
    mute() {
        let key = 'game-muted';
        localStorage.setItem(
            key,
            localStorage.getItem(key) === 'true' ? 'false' : 'true'
        );
        this.state.muted = localStorage.getItem(key) === 'true';

        this.overlay.setMute(this.state.muted);

        if (this.state.muted) {
            // mute all game sounds
            Object.keys(this.sounds).forEach((key) => {
                this.sounds[key].muted = true;
                this.sounds[key].pause();
            });
        } else {
            // unmute all game sounds
            // and play background music
            // if game not paused
            if (!this.state.paused) {
                Object.keys(this.sounds).forEach((key) => {
                    this.sounds[key].muted = false;
                    this.sounds.backgroundMusic.play();
                });
            }
        }
    }

    // reset game
    reset() {
        document.location.reload();
    }

    // update game state
    setState(state) {
        this.state = {
            ...this.state,
            ...{ prev: this.state.current },
            ...state,
        };
    }

    // request new frame
    // wraps requestAnimationFrame.
    // see game/helpers/animationframe.js for more information
    requestFrame(next, resumed) {
        let now = Date.now();
        this.frame = {
            count: requestAnimationFrame(next),
            time: now,
            rate: resumed ? 0 : now - this.frame.time,
            scale: this.screen.scale * this.frame.rate * 0.01
        };
    }

    // cancel frame
    // wraps cancelAnimationFrame.
    // see game/helpers/animationframe.js for more information
    cancelFrame() {
        cancelAnimationFrame(this.frame.count);
    }
}

export default Game;