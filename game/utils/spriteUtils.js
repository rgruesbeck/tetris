/**
 * game/utils/spriteUtils.js
 * 
 * What it Does:
 *   This file contains utilities for sprites
 * 
 *   inBox: check if coordinate is in box
 * 
 *   pickLocation: pick a random location within a bounding box
 * 
 *   pickLocationAwayFrom: pick a location a distance away from another point
 * 
 *   pickLocationAwayFromList: pick a location a distance away from a list of points
 * 
 * What to Change:
 *   Add any utility methods that could be used by a sprite
 *   eg. 
 * 
 */

import {
    randomBetween,
    getDistance,
    isBounded
} from './baseUtils.js';

// check if hit is in box
const inBox = (x, y, box) => {
    // check x and y against box
    const inX = isBounded(x, box.left, box.right);
    const inY = isBounded(y, box.top, box.bottom);

    return inX && inY;
}

// return larger bounds
// useful for hiding images offscreen
const padBounds = (bounds, x, y) => {
    return {
        top: bounds.top - y,
        right: bounds.right + x,
        bottom: bounds.bottom + y,
        left: bounds.bottom - x
    };
}

// get random point or screen
const pickLocation = (bounds) => {
    return {
        x: randomBetween(bounds.left, bounds.right),
        y: randomBetween(bounds.top, bounds.bottom)
    };
}

// pick new location for moles so they aren't crowded
// pick random location in bounds and distance from point
const pickLocationAwayFrom = (bounds, point, distance, depth = 0, maxDepth = 10) => {
    // limit depth
    if (depth > maxDepth) { return; }

    // get random point or screen
    const location = pickLocation(bounds);
    const locationDistance = getDistance(location, point); 

    // return location when location is distance 
    // away from point, else try a new location
    return locationDistance >= distance ?
    location :
    pickLocationAwayFrom(bounds, point, distance, depth + 1);
}

const pickLocationAwayFromList = (bounds, list, distance, depth = 0, maxDepth = 10) => {
    // limit depth
    if (depth > maxDepth) { return; }

    // return any location if list is empty
    if (list.length < 1) {
        return pickLocation(bounds);
    }

    // get location checked against first element
    const location = pickLocationAwayFrom(bounds, list[0], distance);

    // check if point has close neighbors in list
    const hasCloseNeighbor = list.find(point => {
        // return if less than distance
        let dist = getDistance(location, point);
        return dist < distance;
    });

    // return location without close neighbors
    // else try new location
    return hasCloseNeighbor ?
    pickLocationAwayFromList(bounds, list, distance, depth + 1) :
    location;
}

export {
    padBounds,
    pickLocation,
    pickLocationAwayFrom,
    pickLocationAwayFromList,
    inBox
};