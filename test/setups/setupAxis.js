/* globals beforeEach*/

var constants = require("src/constants");

module.exports = function(axis) {
  beforeEach(function() {
    this.lengthKey = constants.axisKeys[axis].length;
    this.nearKey = constants.axisKeys[axis].near;
    this.farKey = constants.axisKeys[axis].far;
  });
};
