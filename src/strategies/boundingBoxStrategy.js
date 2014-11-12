var getPosition = require("position"),
  extend = require("extend");

module.exports = function getBoundingBox(el, props, parentProps) {
  "use strict";

  var position = getPosition(el);
  extend(props, position);
};
