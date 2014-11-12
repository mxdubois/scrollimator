var constants = require("../constants");

module.exports = function makeEndpointProgressStrategy(axis) {
  "use strict";

  var nearKey = constants.axisKeys[axis].near;
  var farKey = constants.axisKeys[axis].far;
  var lengthKey = constants.axisKeys[axis].length;

  return function computeEndpointProgress(el, props, parentProps) {
    var containerLength = parentProps[lengthKey];

    // target coords are relative, so use containerLength instead of far coord.
    var nearTraveled = containerLength - props[nearKey];
    var farTraveled = containerLength - props[farKey];

    props[nearKey + "Progress"] = nearTraveled / containerLength;
    props[farKey + "Progress"] =  farTraveled / containerLength;
  };
};
