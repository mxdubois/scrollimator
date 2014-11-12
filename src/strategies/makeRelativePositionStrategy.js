var constants = require("../constants");

module.exports = function makeRelativePositionStrategy(axis) {
  "use strict";

  var nearKey = constants.axisKeys[axis].near;
  var farKey = constants.axisKeys[axis].far;

  return function computeRelativePosition(el, props, parentProps){
    var containernear = parentProps[nearKey];
    props[nearKey] = props[nearKey] - containernear;
    props[farKey] = props[farKey] - containernear;
  };

};
