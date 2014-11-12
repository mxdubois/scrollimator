/* globals beforeEach */

var rectHelper = require("test/helpers/rectHelper");

module.exports = {

  targetAhead: function() {
    beforeEach(function() {
      rectHelper.moveEdge(
        this.targetProps,
        this.nearKey,
        this.scrollimatorProps[this.farKey] + 100);
      console.log(this.scrollimatorProps);
      console.log(this.targetProps);
    });
  },

  targetBehind: function() {
    beforeEach(function() {
      rectHelper.moveEdge(
        this.targetProps,
        this.farKey,
        this.scrollimatorProps[this.nearKey] - 100);
      console.log(this.scrollimatorProps);
      console.log(this.targetProps);
    });
  },

  targetSpanningNear: function() {
    beforeEach(function() {
      // We want to span top regardless of height of target
      var offset = Math.min(
        this.targetProps[this.lengthKey]/2,
        this.scrollimatorProps[this.lengthKey]/2);
      var newFar = this.scrollimatorProps[this.nearKey] + offset;
      rectHelper.moveEdge(this.targetProps, this.farKey, newFar);
      console.log(this.scrollimatorProps);
      console.log(this.targetProps);
    });
  },

  targetSpanningFar: function() {
    beforeEach(function() {
      var offset = Math.min(
        this.targetProps[this.lengthKey]/2,
        this.scrollimatorProps[this.lengthKey]/2);
      var newNear = this.scrollimatorProps[this.farKey] - offset;
      rectHelper.moveEdge(
        this.targetProps,
        this.nearKey,
        newNear);
    });
  },

  targetNearFlushNear: function() {
    beforeEach(function() {
      rectHelper.moveEdge(
        this.targetProps,
        this.nearKey,
        this.scrollimatorProps[this.nearKey]);
    });
  },

  targetNearFlushFar: function() {
    beforeEach(function() {
      rectHelper.moveEdge(
        this.targetProps,
        this.nearKey,
        this.scrollimatorProps[this.farKey]);
      console.log(this.scrollimatorProps);
      console.log(this.targetProps);
    });
  },

  targetFarFlushNear: function() {
    beforeEach(function() {
      rectHelper.moveEdge(
        this.targetProps,
        this.farKey,
        this.scrollimatorProps[this.nearKey]);
      console.log(this.scrollimatorProps);
      console.log(this.targetProps);
    });
  },

  targetFarFlushFar: function() {
    beforeEach(function() {
      rectHelper.moveEdge(
        this.targetProps,
        this.farKey,
        this.scrollimatorProps[this.farKey]);
      console.log(this.scrollimatorProps);
      console.log(this.targetProps);
    });
  },

  targetCentered: function(axis) {
    beforeEach(function() {
      var scrollimatorCenter =
        this.scrollimatorProps[this.nearKey] +
        this.scrollimatorProps[this.lengthKey]/2;
      var targetLength = this.targetProps[this.lengthKey];
      var targetCenteringNear = scrollimatorCenter - targetLength/2;
      rectHelper.moveEdge(
        this.targetProps,
        this.nearKey,
        targetCenteringNear);
      console.log(this.scrollimatorProps);
      console.log(this.targetProps);
    });
  },
};
