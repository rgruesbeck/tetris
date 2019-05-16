/**
 * game/character/piece.js
 * 
 * What it Does:
 *   This file is a basic player character
 *   it extends the imageSprite class and adds two collision detections methods
 * 
 * What to Change:
 *   Add any character specific methods
 *   eg. eat
 * 
 */

import { pickFromList } from '../utils/baseUtils.js';
import Sprite from '../objects/sprite.js';

class Piece extends Sprite {
    constructor(options) {
        super(options);

        this.ctx = options.ctx;
        this.image = options.image;
        this.color = options.color;

        this.cellSize = 60;
        this.body = this.select();

        this.shift({ x: 2, y: 0 });
    }

    shift({ x = 0, y = 0 }) {
        this.body = [
            ...this.body
            .map(cell => {
                return {
                    x: cell.x + x,
                    y: cell.y + y
                };
            })
        ];
    }

    draw() {
        this.body
        .forEach(cell => {
            let cs = this.cellSize;
            this.ctx.fillStyle = this.color;
            this.ctx.fillRect(cell.x * cs, cell.y * cs, cs, cs);
            this.ctx.drawImage(this.image, cell.x * cs, cell.y * cs, cs, cs);
        })
    }

    rotate() {
        let origin = this.body[0];

        this.body = [
            ...this.body
            .map((cell) => {
                // translate origin
                return {
                    x: cell.x - origin.x,
                    y: cell.y - origin.y,
                };
            })
            .map((cell, idx, arr) => {
                // rotate
                let prev = arr[idx - 1] || arr[arr.length - 1];
                return {
                    x: prev.y,
                    y: prev.x
                }
            })
            .map((cell) => {
                // translate back to location
                return {
                    x: cell.x + origin.x,
                    y: cell.y + origin.y,
                }
            })
        ]
    }

    select() {
        // Tetriminos

        // Straight Bar
        const bar = [
            { x: 2, y: 0 },
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 3, y: 0 }
        ];

        // Left L
        const leftL = [
            { x: 0, y: 1 },
            { x: 0, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 1 }
        ];

        // Right L
        const rightL = [
            { x: 2, y: 1 },
            { x: 1, y: 1 },
            { x: 3, y: 1 },
            { x: 3, y: 0 }
        ];

        // Box
        const box = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 }
        ];

        // Left S
        const leftS = [
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 2, y: 0 }
        ];

        // Right S
        const rightS = [
            { x: 1, y: 0 },
            { x: 0, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 1 }
        ];

        // Tee
        const tee = [
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 2, y: 1 }
        ];

        return pickFromList([
            bar,
            leftL,
            rightL,
            box,
            leftS,
            rightS,
            tee
        ])
    }
}

export default Piece;