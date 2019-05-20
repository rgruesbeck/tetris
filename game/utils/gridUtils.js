/**
 * game/utils/gridUtils.js
 * 
 * What it Does:
 *   This file contains utilities for the game
 * 
 *   randomBetween: get a numbers a min and a max, optionally ask for an int
 * 
 *   getDistance: get the distance between to points with an x and y
 * 
 *   bounded: apply a lower and upper bound to a number
 *   useful for add limits to AI character movements
 * 
 *   isBounded: check if number is within a min and max
 * 
 *   getCursorPosition: get cursor position on the canvas
 *   needed for when tob bar is active
 * 
 *   hexToRgbA: color converter for easier use of the alpha channel
 * 
 *   throttled: wraps a function so that it can't be called until the delay
 *   in milliseconds has gone by. useful for stopping unwanted side effects of button mashing.
 *   https://gph.is/1syA0yc
 * 
 * 
 * What to Change:
 *   Add any new methods that don't fit anywhere else
 *   eg. 
 * 
 */

const gridCell = (grid, x, y) => {
    let cell =  grid &&
    grid[x] &&
    grid[x][y];

    return cell || false;
}

const gridCol = (grid, x) => {
    return grid && grid[x];
}

const gridRow = (grid, y) => {
    return grid && grid
    .filter(x => x && x[y])
    .map(x => x[y])
}

const setGridCell = (grid, cell, value) => {
    let { x, y } = cell;

    // allocate space on grid
    if (typeof grid[x] === 'undefined') { grid[x] = []; }
    if (typeof grid[x][y] === 'undefined') { grid[x][y] = false; }

    // set value
    grid[x][y] = value;

    return grid;
}

const neighborLeft = (grid, cell) => {
    return gridCell(grid, cell.x - 1, cell.y);
}

const neighborRight = (grid, cell) => {
    return gridCell(grid, cell.x + 1, cell.y);
}

const neighborDown = (grid, cell) => {
    return gridCell(grid, cell.x, cell.y + 1);
}

export {
    gridCell,
    gridCol,
    gridRow,
    setGridCell,
    neighborLeft,
    neighborRight,
    neighborDown
};