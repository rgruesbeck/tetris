/**
 * game/helpers/assetLoaders.js
 * 
 * What it Does:
 *   This file contains loaders for images, sounds, and fonts.
 *   and a loadList function that lets you load any of these in a list.
 * 
 *   loadList: takes a list of assets loaders (loadImage, loadSound, or loadFont)
 *   and returns a list of object containing { type, key, value }
 *   where value is the loaded asset only after all the assets have loaded
 *   
 *   loadImage: takes a key and a url and returns an object containing
 *   { type: 'image', key: '<key>', value: '<the loaded image>' }
 * 
 *   loadSound: takes a key and a url and returns an object containing
 *   { type: 'sound', key: '<key>', value: '<the loaded sound>' }
 * 
 *   loadFont: takes a key and a google fontName and returns an object containing
 *   { type: 'font', key: '<key>', value: '<the loaded font>' }
 *   
 * What to Change:
 *   
 *   
 * How to Use it:
 * 
 *   loadList: input an array of loaders and pass a function to handle the the loaded assets
 *   eg. loadList(<list of loaders>).then(<function handle loaded assets>)
 * 
 *     loadList([
 *       loadImage('image_key', 'image_url'),
 *       loadSound('sound_key', 'sound_url'),
 *       loadFont('font_key', 'font_name')
 *     ]).then((loadedAssets) => {
 *       // attach loaded assets
 *     })
 *   
 *   loadImage: 
 *       loadImage('image_key', 'image_url')
 *         .then((loadedImage) => {
 *            // attach loaded image
 *         }) 
 * 
 *   loadSound: 
 *       loadSound('sound_key', 'sound_url')
 *         .then((loadedSound) => {
 *            // attach loaded sound
 *         }) 
 * 
 *   loadFont: 
 *       loadFont('font_key', 'font_name')
 *         .then((loadedFont) => {
 *            // attach loaded font
 *         }) 
 *   
 */

const WebFont = require('webfontloader');

const loadList = (list) => {
  return Promise.all(list)
  .then((assets) => {
    return assets.reduce((collection, asset) => {
      // separate assets by type
      // add them to the collection

      const { type, key, value } = asset;

      const collectionIncludes = Object.keys(collection).includes(type);
      if (!collectionIncludes) { collection[type] = {} }

      collection[type][key] = value;
      return collection;
    }, {});
  })
}

const loadImage = (key, url) => {
  let result = { type: 'image', key: key, value: null };

  // check
  if (!key || !url) { return result; }

  return new Promise((resolve, reject) => {
    let image = new Image;
    image.src = url;

    // loaded
    image.onload = () => {
      resolve({...result, ...{ value: image }});
    };

    // error
    image.onerror = () => {
      reject(result);
    };
  });

}

const loadSound = (key, url) => {
  let result = { type: 'sound', key: key, value: null };

  // check
  if (!key || !url) { return result; }

  return new Promise((resolve, reject) => {
    let sound = new Audio(url);

    // loaded
    sound.oncanplaythrough = () => {
      resolve({...result, ...{ value: sound }});
    };

    // error
    sound.onerror = () => {
      reject(result);
    };

    sound.load(); // for iphones
  });
}

const loadFont = (key, fontName) => {
  let result = { type: 'font', key: key, value: null };

  // check
  if (!key || !fontName) { return result; }

  return new Promise((resolve, reject) => {
    const font = {
      google: {
        families: [fontName]
      },
      fontactive: function (familyName) {
        resolve({...result, ...{ value: familyName }});
      }
    }
    WebFont.load(font);
  });
}

export { loadList, loadImage, loadSound, loadFont };