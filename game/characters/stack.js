/**
 * game/character/stack.js
 * 
 * What it Does:
 *   This file is a class for the stacked blocks
 *   and contains a shift method
 * 
 * What to Change:
 *   Add any character specific methods
 *   eg. eat
 * 
 */

class Stack {
    constructor(options) {
        super({
            ...options,
            ...{
                width: options.size,
                height: options.size
            }
        });

        this.color = options.color;


        this.cell = options.cell;
        this.size = options.size;

        this.x = this.cell.x * this.size;
        this.y = this.cell.y * this.size;
    }

    shift({ x = 0, y = 0 }) {
        // update cell
        this.cell = {
            x: this.cell.x + x,
            y: this.cell.y + y
        };

        // update x and y
        this.x = this.cell.x * this.size;
        this.y = this.cell.y * this.size;
   }

}

export default Stack;