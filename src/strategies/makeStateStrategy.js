var constants = require("../constants");

module.exports = function makeStateStrategy(axis) {
  "use strict";

  var nearKey = constants.axisKeys[axis].near;
  var farKey = constants.axisKeys[axis].far;

  var visibleProgressKey = axis + "VisibleProgress";
  var containedProgressKey = axis + "ContainedProgress";
  var nearProgressKey = nearKey + "Progress";
  var farProgressKey = farKey + "Progress";

  var resultKey = axis + "State";

  return function computeState(el, props, parentProps) {
    var state;

    var visibleProgress = props[visibleProgressKey];
    var containedProgress = props[containedProgressKey];
    var nearProgress = props[nearProgressKey];
    var farProgress = props[farProgressKey];

    if(containedProgress >=0 && containedProgress <= 1) {
      if(nearProgress === 1 && farProgress === 0) {
        state = "matching";
      } else {
        state = "contained";
      }
    } else if(visibleProgress < 0) {
      state = "ahead";
    } else if(visibleProgress > 1) {
      state = "behind";
    } else {
      // Target is visible but not contained
      if(nearProgress > 1 && farProgress < 0) {
        state = "spanning";
      } else if(nearProgress > 1 && farProgress >= 0 && farProgress <=1) {
        state = "exiting";
      } else if(farProgress < 0 && nearProgress >= 0 && nearProgress <= 1) {
        state = "entering";
      }
    }
    props[resultKey] = state;
  };

};
