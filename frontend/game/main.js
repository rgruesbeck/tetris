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
} from 'game-asset-loader';

import audioContext from 'audio-context';
import audioPlayback from 'audio-play';
import unlockAudioContext from 'unlock-audio-context';

import preventParent from 'prevent-parent';

import {
    pickFromList,
    hashCode
} from './utils/baseUtils.js';

import {
    gridRow,
    neighborDown,
    neighborLeft,
    neighborRight,
    setGridCell,
    getCellSize
} from './utils/gridUtils.js';

import Piece from './characters/piece.js';
import ImageSprite from './objects/imageSprite.js';

class Game {

    constructor(screen, board, effects, overlay, topbar, config) {
        this.config = config; // customization
        this.overlay = overlay;
        this.topbar = topbar;

        this.prefix = hashCode(this.config.settings.name); // set prefix for local-storage keys

        this.canvas = screen; // game screen
        this.ctx = screen.getContext("2d"); // game screen context

        this.boardCanvas = board; // game board
        this.boardCtx = board.getContext("2d"); // game board context

        this.effectsCanvas = effects; // effects canvas
        this.effectsCtx = effects.getContext("2d"); // game effects context

        this.audioCtx = audioContext(); // create new audio context
        this.playlist = [];

        // prevent parent scroll
        preventParent();

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
            lockDelayTicks: parseInt(this.config.settings.lockDelayTicks),
            modeInfinity: this.config.settings.modeInfinity,
            infinityAction: false,
            paused: false,
            muted: localStorage.getItem(`${this.prefix}-muted`) === 'true'
        };

        this.input = {
            active: 'keyboard',
            keyboard: { up: false, right: false, left: false, down: false },
            mouse: { x: 0, y: 0, click: false },
            touch: { x: 0, y: 0 },
        };

        // setup event listeners
        // handle keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyboardInput('keydown', e.code, e));
        document.addEventListener('keyup', (e) => this.handleKeyboardInput('keyup', e.code, e));

        // handle swipes
        document.addEventListener('touchstart', ({ touches }) => this.handleSwipeInput('touchstart', touches[0]), false);
        document.addEventListener('touchmove', ({ touches }) => this.handleSwipeInput('touchmove', touches[0]), false);
        document.addEventListener('touchend', ({ touches }) => this.handleSwipeInput('touchend', touches[0]), false);

        // handle taps
        document.addEventListener('touchstart', ({ touches }) => this.handleTap(touches[0]));

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

        // unlock audio context: audiocontext
        unlockAudioContext(this.audioCtx);
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
        let columns = parseInt(this.config.settings.columns);
        let rows = parseInt(this.config.settings.rows);

        let cellSize = getCellSize(
            this.canvas.width,
            this.canvas.height,
            rows,
            columns
        );

        this.boardCanvas.width = cellSize * columns;
        this.boardCanvas.height = cellSize * rows;

        // create tick queue
        this.tickQueue = [];

        // set state
        let { tickRate } = this.config.settings;
        this.setState({
            score: 0,
            tickRate: parseInt(tickRate)
        });

        // board settings
        this.board = {
            width: columns,
            height: rows,
            columns: columns,
            rows: rows,
            cellSize: cellSize,
            blocks: [],
            grid: [],
            lastClear: 0
        }

        // random bag for next pieces
        this.bag = [];

        // set board size
        let boardHeight = this.board.height * this.board.cellSize;
        this.boardCanvas.height = boardHeight;

        // place board
        this.boardCanvas.style.top = `${(this.canvas.height - this.boardCanvas.height) / 2 + this.canvas.offsetTop}px`;
        this.boardCanvas.style.left = `${(this.canvas.width - this.boardCanvas.width) / 2}px`;

        // place effects
        this.effectsCanvas.style.top = `${this.canvas.offsetTop}px`;
        this.effectsCanvas.style.left = `${0}px`;
        this.effectsCanvas.width = this.canvas.width;
        this.effectsCanvas.height = this.canvas.height;

        // set containers
        this.images = {}; // place to keep images
        this.sounds = {}; // place to keep sounds
        this.fonts = {}; // place to keep fonts

        // create lists
        this.pieces = []; // place to put active pieces
        this.stack = []; // place to put stacked blocks
        this.cleared = []; // place to host cleared blocks

        // set document body to backgroundColor
        document.body.style.backgroundColor = this.config.colors.backgroundColor;

        // set loading indicator to textColor
        document.querySelector('#loading').style.color = this.config.colors.textColor;

    }

    load() {
        // load pictures, sounds, and fonts
        if (this.state.prev === 'over') {
            this.overlay.setBanner('restarting...');
        }

        this.init(); // apply new configs
        
        // make a list of assets
        const gameAssets = [
            loadImage('block1', this.config.images.block1),
            loadImage('block2', this.config.images.block2),
            loadImage('block3', this.config.images.block3),
            loadImage('block4', this.config.images.block4),
            loadImage('block5', this.config.images.block5),
            loadImage('block6', this.config.images.block6),
            loadImage('spectatorLeft', this.config.images.spectatorLeft),
            loadImage('spectatorRight', this.config.images.spectatorRight),
            loadSound('clearSound', this.config.sounds.clearSound),
            loadSound('dropSound', this.config.sounds.dropSound),
            loadSound('backgroundMusic', this.config.sounds.backgroundMusic),
            loadFont('gameFont', this.config.settings.fontFamily)
        ];

        // put the loaded assets the respective containers
        loadList(gameAssets, (progress) => {
            document.getElementById('loading-progress').textContent = `${progress.percent}%`;
        })
        .then((assets) => {

            this.images = assets.image;
            this.sounds = assets.sound;

        })
        .then(() => this.create())
        .catch(err => console.error(err));
    }

    create() {
        // set overlay styles
        this.overlay.setStyles({...this.config.colors, ...this.config.settings});

        // setup block styles
        this.blockStyles = [
            {
                color: this.config.colors.block1,
                image: this.images.block1
            },
            {
                color: this.config.colors.block2,
                image: this.images.block2
            },
            {
                color: this.config.colors.block3,
                image: this.images.block3
            },
            {
                color: this.config.colors.block4,
                image: this.images.block4
            },
            {
                color: this.config.colors.block5,
                image: this.images.block5
            },
            {
                color: this.config.colors.block6,
                image: this.images.block6
            }
        ];

        // setup spectators
        this.spectatorSize = (this.canvas.width - this.boardCanvas.width) / 2;
        this.leftSpectator = new ImageSprite({
            ctx: this.ctx,
            image: this.images.spectatorLeft,
            x: 0,
            y: this.screen.bottom - this.spectatorSize,
            width: this.spectatorSize,
            height: this.spectatorSize,
            bounds: this.screen
        })

        this.rightSpectator = new ImageSprite({
            ctx: this.ctx,
            image: this.images.spectatorRight,
            x: this.screen.right - this.spectatorSize,
            y: this.screen.bottom - this.spectatorSize,
            width: this.spectatorSize,
            height: this.spectatorSize,
            bounds: this.screen
        })

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

        // clear effects of the last picture
        this.effectsCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);

        // draw and do stuff that you need to do
        // no matter the game state
        this.overlay.setScore(this.state.score);

        // draw spectators
        if (this.spectatorSize > 50) {

            // draw spectators
            let now = Date.now();
            let cheer = Math.cos(this.frame.count / 5);
            if (now - this.board.lastClear < 3000) {
                // cheer more
                cheer = Math.cos(this.frame.count / 3) * 3;

                this.leftSpectator.height += cheer;
                this.rightSpectator.height += cheer;
            }

            // reset height
            this.leftSpectator.height = this.spectatorSize;
            this.rightSpectator.height = this.spectatorSize;

            // cheer
            this.leftSpectator.move(0, cheer, this.frame.scale);
            this.rightSpectator.move(0, cheer, this.frame.scale);

            this.leftSpectator.draw();
            this.rightSpectator.draw();

        }

        // ready to play
        if (this.state.current === 'ready' && this.state.prev === 'loading') {
            this.overlay.hide('loading');
            this.canvas.style.opacity = 1;
            this.boardCanvas.style.opacity = 1;
            this.effectsCanvas.style.opacity = 1;

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

            this.setState({ current: 'ready' });
        }

        // game play
        if (this.state.current === 'play') {

            // if last state was 'ready'
            // hide overlay items
            if (this.state.prev === 'ready') {
                this.overlay.hide(['banner', 'button', 'instructions'])
            }

            // background music
            if (!this.state.muted && !this.state.backgroundMusic) {
                this.state.backgroundMusic = true;
                this.playback('backgroundMusic', this.sounds.backgroundMusic, {
                    start: 0,
                    end: this.sounds.backgroundMusic.duration,
                    loop: true,
                    context: this.audioCtx
                });
            }

            // check for game over
            // game over if there are blocks on the top row
            let topRow = gridRow(this.board.grid, 0);
            if (topRow.length > 0) {
                this.setState({ current: 'over' });
            }

            // get new random bag of pieces
            // if bag is empty
            if (this.bag.length < 1) {
                this.bag = [0, 1, 2, 3, 4, 5, 6];
            }

            // every game tick update the game
            let queuedTick = this.tickQueue.length > 0;
            if (queuedTick) {

                // run tick task: shift, rotate, etc
                this.tickQueue.sort((a, b) => a.priority - b.priority);
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
                    // pick a random style
                    // and pick a random shape from the bag
                    let block = pickFromList(this.blockStyles);
                    let shape = pickFromList(this.bag);

                    this.pieces = [
                        ...this.pieces,
                        new Piece({
                            ctx: this.boardCtx,
                            board: this.board,
                            image: block.image,
                            color: block.color,
                            shape: shape,
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

                    // remove shape from the bag
                    this.bag = [
                        ...this.bag
                        .filter(s => s != shape)
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

                }, [])

            }

            // schedule a tick to shift piece down by tick rate
            let scheduledTick = this.frame.count % this.state.tickRate === 0;
            if (scheduledTick) {
                
                // queue shift down for block in the piece
                this.queueTick(1, () => this.shiftPieceDown());

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
                    // set cleared stamp
                    this.board.lastClear = Date.now();

                    // award points
                    this.setState({ score: this.state.score + 100 });

                    // images from cleared line to cleared
                    // as image sprites
                    this.cleared = [
                        ...this.cleared,
                        ...this.stack
                        .filter(block => block.cell.y === fullRows[0])
                        .map(block => {
                            return new ImageSprite({
                                ctx: this.effectsCtx,
                                image: block.image,
                                x: block.x + this.boardCanvas.offsetLeft,
                                y: block.y + this.boardCanvas.offsetTop,
                                width: block.width,
                                height: block.height,
                                speed: 5,
                                bounds: null
                            })
                        })
                    ];

                    // clear-line gravity
                    // do cascade style clear-line gravity
                    // https://tetris.fandom.com/wiki/Line_clear#Line_clear_gravity

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
                            // remove full row blocks
                            return block.cell.y != fullRows[0];
                        })
                    ]

                    this.playback('clearSound', this.sounds.clearSound);

                    // queue shift down for blocks in the stack
                    this.queueTick(1, () => this.shiftStackDown());
                }


            }

            // draw board
            this.board.blocks
            .forEach(block => block.draw());

            // update cleared
            this.cleared = [
                ...this.cleared
                .map((sprite, idx) => {
                    let dx = idx % 2 === 0 ? 0.5 : -0.5;
                    let dy = idx % 3 === 0 ? -1 : -1.5;

                    sprite.move(dx, dy, this.frame.scale);

                    return sprite;
                })
                .filter(sprite => sprite.y > 0)
                .filter(sprite => sprite.x > 0 + sprite.width)
                .filter(sprite => sprite.x < this.screen.right)
            ]

            // draw cleared
            this.cleared
            .forEach(sprite => sprite.draw());


        }

        // player wins
        if (this.state.current === 'win') {

        }

        // game over
        if (this.state.current === 'over') {

            this.overlay.setBanner(this.config.settings.gameoverText);

            // quick quit
            setTimeout(() => {
                window.setScore(this.state.score);
                window.setAppView('setScore');
            }, 1000)
        }

        // draw the next screen
        if (this.state.current === 'stop') {
            this.cancelFrame();
        } else {
            this.requestFrame(() => this.play());
        }
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
            // check for bottom
            let hitBottom = piece.box.bottom > this.board.height - 2;

            // check for blocks below
            let hasDownNeighbor = piece.body
                .some(block => {
                    return neighborDown(this.board.grid, block.cell);
                })


            if (!hitBottom && !hasDownNeighbor) {

                // shift down
                piece.shift({ y: 1 });
            } else {
                
                // if an inifinity mode enabled piece moved or rotated action, reset preplaceTick
                if(this.state.infinityAction) {
                    piece.preplaceTick = 0;
                    this.setState({infinityAction: false}) 
                }

                if (piece.preplaceTick >= this.state.lockDelayTicks) {

                    // mark as placed
                    piece.placed = true;
                } else {
                    
                    // increment preplaceTick
                    piece.preplaceTick += 1;

                }
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
            // check if the rotation results would
            // take up occupied spaces
            let rotatedCells = piece.rotatedCells()
            .map(cell => {
                // add string id
                cell.id = `${cell.x}-${cell.y}`;

                return cell;
            })

            // .map(cell => `${cell.x}-${cell.y}`)

            let blockingCells = this.stack
            .map(block => block.cell)
            .some(cell => {
                // check if cells are blocking
                let id = `${cell.x}-${cell.y}`;

                return rotatedCells
                .map(cell => cell.id)
                .includes(`${cell.x}-${cell.y}`);
            });

            // or be off screen
            let onEdge = rotatedCells
            .some(cell => {
                let { x, y } = cell;
                let offX = x < 0 || x >= this.board.columns;
                let offY = y < 0 || y >= this.board.rows;

                return offX || offY;
            });

            if (!blockingCells && !onEdge) {

                piece.rotate();
            }

            return piece;
        });
    }

    dropPiece() {
        // drop down until hitting the stack
        // get the the piece
        let maxShift = this.board.rows;

        let piece = this.pieces
        .filter(piece => !piece.placed)
        .reduce(piece => piece);

        // get the top block of the stack and, calculate the remaining rows
        let stackCells = this.stack
        .map(block => block.cell);

        let minShift = piece.body
        .map(block => block.cell)
        .reduce((min, cell) => {
            // find the pairs of cells (piece, stack) on x axis that has the
            // minimum number of rows in between

            let stackPairs = stackCells.filter(sc => sc.x === cell.x);
            let minPair = stackPairs.reduce((minP, sp) => {
                return minP.y < sp.y ? minP : sp;
            }, { y: maxShift });

            let dy = minPair.y - cell.y;

            return min < dy ? min : dy;
        }, maxShift);

        // queue downshifts for number of remaining rows
        for (let row = 0; row < minShift; row += 1) {
            this.queueTick(0, () => this.shiftPieceDown());
        }

        this.playback('dropSound', this.sounds.dropSound);
    }

    updatePieces(fn) {
        this.pieces = this.pieces
        .map(p => fn(p));
    }

    queueTick(priority, fn) {

        // add a new tick to the tick queue
        this.tickQueue = [
            { priority: priority, run: fn },
            ...this.tickQueue
        ].sort((a, b) => a.priority - b.priority)
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
        }

        if (this.state.current === 'over') {
            // restart
            this.setState({ current: 'loading' });
            this.reset();
        }

    }

    handleKeyboardInput(type, code, event) {
        this.input.active = 'keyboard';

        if (type === 'keydown' && this.state.current === 'play') {
            // If infinity mode is enabled:
            // Set flag that a key was pressed
            if (this.state.modeInfinity) { 
                    this.setState({infinityAction: true})
            }

            // rotate
            if (code === 'ArrowUp') {
                this.queueTick(0, () => this.rotatePiece());
            }

            // shift left
            if (code === 'ArrowLeft') {
                this.queueTick(0, () => this.shiftPieceLeft());
            }

            // shift right
            if (code === 'ArrowRight') {
                this.queueTick(0, () => this.shiftPieceRight());                
            }

            // shift down
            if (code === 'ArrowDown') {
                this.queueTick(0, () => this.shiftPieceDown());
            }

            // drop
            if (code === 'Space') {
                this.dropPiece();
            }
        }

        if (type === 'keydown') {

            // any key
            // reload when game over
            if (this.state.current.match(/over/)) {
                this.setState({ current: 'loading' });
                this.load();
            }

            // restart when game ready
            if (this.state.current.match(/ready/)) {
                this.setState({ current: 'play' });
            }
        }

        // prevent scroll if in an iframe
        event.stopPropagation();
    }

    handleTap() {
        // rotate
        let now = Date.now();
        let time = now - this.lastTap;

        if ((time < 300) && (time > 0)) {
            // If infinity mode is enabled:
            // Set flag that a key was pressed
            if (this.state.modeInfinity) { 
                    this.setState({infinityAction: true})
            }
            
            // rotate on double tap   
            this.queueTick(0, () => this.rotatePiece());
        }

        this.lastTap = Date.now();
    }

    // convert swipe to a direction
    handleSwipeInput(type, touch) {
        // If infinity mode is enabled:
        // Set flag that a tap was double pressed
        if (this.state.modeInfinity) { 
            this.setState({infinityAction: true})
        }


        // clear touch list
        if (type === 'touchstart') {
            this.input.touches = [];
        }

        // add to touch list
        if (type === 'touchmove') {
            let { clientX, clientY } = touch;
            this.input.touches.push({ x: clientX, y: clientY });
        }

        // get user intention
        if (type === 'touchend') {
            let { touches } = this.input;
            let result = {};

            if (touches.length) {

                // get direction from touches
                result = this.input.touches
                .map((touch, idx, arr) => {
                    // collect diffs
                    let prev = arr[idx - 1] || arr[0];
                    return {
                        x: touch.x,
                        y: touch.y,
                        dx: touch.x - prev.x,
                        dy: touch.y - prev.y
                    }
                })
                .reduce((direction, diff) => {
                    // sum the diffs
                    direction.dx += diff.dx;
                    direction.dy += diff.dy;

                    return direction;
                });

                // get direction
                let swipesX = Math.abs(result.dx) > Math.abs(result.dy);
                let swipesY = Math.abs(result.dy) > Math.abs(result.dx);

                if (swipesX) {
                    if (result.dx > 0) {
                        // swipe right: shift right
                        this.queueTick(0, () => this.shiftPieceRight());
                    } else {
                        // swipe left: shift left
                        this.queueTick(0, () => this.shiftPieceLeft());
                    }
                }

                if (swipesY) {
                    if (result.dy > 0) {
                        // swipe down: drop
                        this.dropPiece();
                    } else {
                        // swipe up: rotate
                        // this.queueTick(0, () => this.rotatePiece());
                    }
                }
            }
        }
    }

    handleResize() {

        // document.location.reload();
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
            this.audioCtx.suspend();

            this.overlay.setBanner('Paused');
        } else {
            // resume game loop
            this.requestFrame(() => this.play(), true);

            // resume game sounds if game not muted
            if (!this.state.muted) {
                this.audioCtx.resume();
            }

            this.overlay.hide('banner');
        }
    }

    // mute game
    mute() {
        let key = `${this.prefix}-muted`;
        localStorage.setItem(
            key,
            localStorage.getItem(key) === 'true' ? 'false' : 'true'
        );
        this.state.muted = localStorage.getItem(key) === 'true';

        this.overlay.setMute(this.state.muted);

        if (this.state.muted) {
            // mute all game sounds
            this.audioCtx.suspend();
        } else {
            // unmute all game sounds
            if (!this.state.paused) {
                this.audioCtx.resume();
            }
        }
    }

    playback(key, audioBuffer, options = {}) {
        // ignore playback requests while paused
        if (this.state.muted) { return; }
        
        // add to playlist
        let id = Math.random().toString(16).slice(2);
        this.playlist.push({
            id: id,
            key: key,
            playback: audioPlayback(audioBuffer, {
                ...{
                    start: 0,
                    end: audioBuffer.duration,
                    context: this.audioCtx
                },
                ...options
            }, () => {
                // remove played sound from playlist
                this.playlist = this.playlist
                    .filter(s => s.id != id);
            })
        });
    }

    stopPlayback(key) {
        this.playlist = this.playlist
        .filter(s => {
            let targetBuffer = s.key === key;
            if (targetBuffer) {
                s.playback.pause();
            }
            return targetBuffer;
        })
    }

    // stop playlist
    stopPlaylist() {
      this.playlist
      .forEach(s => this.stopPlayback(s.key))
    }

    // reset game
    reset() {
        // document.location.reload();
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

    // destroy
    destroy() {
      // stop game loop and music
      this.setState({ current: 'stop' })
      this.stopPlaylist();

      // cleanup event listeners
      document.removeEventListener('keydown', this.handleKeyboardInput);
      document.removeEventListener('keyup', this.handleKeyboardInput);
      document.removeEventListener('touchstart', this.handleSwipeInput);
      document.removeEventListener('touchmove', this.handleSwipeInput);
      document.removeEventListener('touchend', this.handleSwipeInput);
      document.removeEventListener('touchstart', this.handleTap);
      this.overlay.root.removeEventListener('click', this.handleClicks);
      window.removeEventListener('resize', this.handleResize);
      window.removeEventListener('orientationchange', this.handleResize);

      // cleanup nodes
      delete this.overlay;
      delete this.canvas;
      delete this.boardCanvas;
      delete this.effectsCanvas;
    }
}

export default Game;