/* globals sinon, beforeEach */

var extend = require("extend");

module.exports = {

  mockScrollimatorUpdateStrategy: function() {
    beforeEach(function() {
      var fixture = this;
      this.mockScrollimatorUpdateStrategy =
        sinon.spy(function(el, props, parentProps) {
          extend(props, fixture.scrollimatorProps);
        });
    });
  },

  mockTargetUpdateStrategy: function() {
    beforeEach(function() {
      var fixture = this;
      this.mockTargetUpdateStrategy =
        sinon.spy(function(el, props, parentProps) {
          extend(props, fixture.targetProps);
        });
    });
  }
};
