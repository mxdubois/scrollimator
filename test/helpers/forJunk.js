module.exports = forJunk;

var extend = require("extend");

forJunk.junk = {
  zeroes: [0],
  smallPositiveNumbers:[1, 2, 3],
  smallNegativeNumbers:[-3, -2, -1],
  bigPositiveNumbers:[Number.MAX_VALUE],
  bigNegativeNumbers:[Number.MIN_VALUE],
  positiveInfinity: [Number.MAX_VALUE + 1],
  negativeInfinity: [Number.MAX_VALUE + 1],
  objects: [{}, { foo: "bar" }],
  nulls: [null],
  arrays: [ [] ],
  undefineds: [undefined],
  strings: ["", "foo"],
  booleans: [true, false],
  falsies: [undefined, null, false, 0]
};

forJunk.defaults = extend({}, forJunk.junk, {
  falsies:false // no duplicates
});

function createJunkArray(options) {
  var settings =  extend({}, forJunk.defaults, options);
  var junkArray = [];

  for(var prop in settings) {
    if(settings.hasOwnProperty(prop) && settings[prop]) {
      if(Array.isArray(settings[prop])) {
        Array.prototype.push.apply(junkArray, settings[prop]);
      }
    }
  }

  return junkArray;
}

function forJunk(cb, options) {
  var junkArray = createJunkArray(options);
  for(var i=0; i < junkArray.length; i++) {
    cb.call(this, junkArray[i], i);
  }
}
