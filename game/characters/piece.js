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

import {
    pickFromList,
    getMaxFromList,
    getMinFromList,
} from '../utils/baseUtils.js';

import {
    padBounds
} from '../utils/spriteUtils.js';

import Block from '../characters/block.js';

class Piece {
    constructor({ ctx, board, image, color, cellSize, cellBounds, bounds }) {
        this.ctx = ctx;
        this.board = board;

        this.image = image;
        this.color = color;

        this.cellBounds = cellBounds;
        this.bounds = bounds;

        this.cellSize = cellSize;

        this.body = this.createBody();
        this.box = { top: 0, right: 0, bottom: 0, left: 0 };

        this.shift({ x: 4, y: 0 });
    }

    draw() {
        this.body
        .forEach(block => block.draw());
    }

    getBox(body) {
        return [body]
        .map(body => {
            return {
                listY: body.map(block => block.cell.y),
                listX: body.map(block => block.cell.x)
            }
        })
        .map(cell => {
            return {
                top: getMinFromList(cell.listY),
                bottom: getMaxFromList(cell.listY),
                right: getMaxFromList(cell.listX),
                left: getMinFromList(cell.listX)
            }
        })
        .reduce(box => box);
    }

    shift({ x = 0, y = 0 }) {
        // don't shift off the board
        let hitLeft = this.box.left + x < 0;
        let hitRight = this.box.right + x > this.board.width - 1;

        let hitBottom = this.box.bottom + y > this.board.height;

        if (hitLeft || hitRight || hitBottom) {
            return;
        }

        // update body
        this.body.forEach(block => block.shift({ x: x, y: y }));

        // update box
        this.box = this.getBox(this.body);
    }

    rotate() {
        // pick a rotation point
        let origin = this.body[0];

        // rotate block around origin
        this.body.forEach(block => {
            block.cell = this.rotateCellAround(block.cell, origin.cell);
        })

        // shift in place to update x and y
        this.shift({ x: 0, y: 0 });
    }

    rotateCellAround(cell, origin) {
        return [cell]
        .map((cell) => {
            // translate origin to 0,0
            return {
                x: cell.x - origin.x,
                y: cell.y - origin.y
            };
        })
        .map((cell, idx, arr) => {
            // rotate around origin
            let prev = arr[idx - 1] || arr[arr.length - 1];
            return {
                x: prev.y,
                y: prev.x
            }
        })
        .map((cell) => {
            // translate back to starting x,y
            return {
                x: cell.x + origin.x,
                y: cell.y + origin.y,
            }
        })
        .reduce(cell => cell);
    }

    selectShape() {
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

    createBody() {
        return this.selectShape()
        .map(cell => {
            return new Block({
                ctx: this.ctx,
                color: this.color,
                image: this.image,
                cell: cell,
                size: this.cellSize,
                bounds: padBounds(this.bounds, 0, this.cellSize * 2)
            })
        })
    }
}

export default Piece;