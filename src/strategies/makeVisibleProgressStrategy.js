var constants = require("../constants");

module.exports = function makeVisibleProgressStrategy(axis) {
  "use strict";

  var nearKey = constants.axisKeys[axis].near;
  var lengthKey = constants.axisKeys[axis].length;

  var resultKey = axis + "VisibleProgress";

  return function computeVisibleProgress(el, props, parentProps) {
    var parentLength = parentProps[lengthKey];
    // Determine the length el can travel while remaining visible in parent
    var visibleLength = parentLength + props[lengthKey];
    // target coords are relative to parent,
    // so use parent length instead of parent far coord.
    var visibleTraveled = parentLength - props[nearKey];
    props[resultKey] = visibleTraveled / visibleLength;
  };

};
