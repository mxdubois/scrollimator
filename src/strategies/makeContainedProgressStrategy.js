var constants = require("../constants");

module.exports = function makeContainedProgressStrategy(axis) {
  "use strict";

  var nearKey = constants.axisKeys[axis].near;
  var lengthKey = constants.axisKeys[axis].length;
  var resultKey = axis + "ContainedProgress";

  return function computeContainedProgress(el, props, parentProps) {
    // Determine the length el can travel while fully contained by parent
    var containedLength = parentProps[lengthKey] - props[lengthKey];
    var offset = props[nearKey];

    // If the containedLength is negative, target cannot be contained
    if(containedLength < 0) {
      props[resultKey] = Number.NaN;
    } else if(containedLength === 0 && offset === 0) {
      // target size matches container and target is centered in container
      // 0/0 is NaN but, in this case, we really want 0 or 1
      // we choose to use 1 since the traversal is complete
      props[resultKey] = 1;
    } else {
      props[resultKey] = 1 - (offset / containedLength);
    }
  };

};
