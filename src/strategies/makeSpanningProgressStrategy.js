var makeContainedProgressStrategy = require("./makeContainedProgressStrategy");

module.exports = function makeSpanningProgressStrategy(axis) {
  "use strict";

  var computeContainedProgress = makeContainedProgressStrategy(axis);
  return function computeSpanningProgress(el, props, parentProps) {
    // Spanning progress is the containedProgress of the container in target.
    return computeContainedProgress(el, parentProps, props);
  };
};
