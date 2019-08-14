/**
 * game/helpers/animationFrame.js
 * 
 * What it Does:
 *   This file exports requestAnimationFrame and cancelAnimationFrame
 *   for the major browsers
 * 
 *   requestAnimationFrame: takes a function we want to run.
 *   in the case of this game play() runs the function when the browser is ready
 *   and returns an integer representing the times it has been called.
 *   this way the game can keep track of frames and not continue calling play()
 *   when the browser is not in focus. The browser allows a new frame about every 60 seconds.
 * 
 *   checkout the requestFrame method in game/main.js that extends requestAnimationFrame
 * 
 *   cancelAnimationFrame: takes the frame number and cancels the animation
 *   checkout the cancelFrame method in game/main.js that extends cancelAnimationFrame
 * 
 * Learn more:
 *   https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
 *   https://developer.mozilla.org/en-US/docs/Games/Techniques/Efficient_animation_for_web_games
 * 
 */

const requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
const cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

export { requestAnimationFrame, cancelAnimationFrame };