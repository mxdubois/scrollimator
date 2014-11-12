/* globals Scrollimator, Model, TargetView, InfoView */
// TODO IE8 compatibility?
;(function() {
  "use strict";

  // Polyfill this, if necessary
  var requestAnimationFrame = window.requestAnimationFrame;

  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var targetModelsById = {};
  var views = [];

  var smallerNodes,
    matchingNodes,
    largerNodes;

  /**
   * Get the current viewport dimensions.
   */
  function getViewportDimensions() {
    var docElement = document.documentElement;
    return {
      width: Math.max(docElement.clientWidth, window.innerWidth || 0),
      height: Math.max(docElement.clientHeight, window.innerHeight || 0)
    };
  }

  /**
   * Perform resize adjustments.
   */
  function onResize() {
    var viewport = getViewportDimensions();
    var i, length;

    length = smallerNodes.length;
    for(i = 0; i < length; i++) {
      smallerNodes[i].style.height =
        0.5*viewport.height - getTotalBorderHeight(smallerNodes[i]) + "px";
    }

    length = matchingNodes.length;
    for(i = 0; i < length; i++) {
      matchingNodes[i].style.height =
        viewport.height - getTotalBorderHeight(matchingNodes[i]) + "px";
    }

    length = largerNodes.length;
    for(i = 0; i < length; i++) {
      largerNodes[i].style.height =
        2*viewport.height - getTotalBorderHeight(largerNodes[i]) + "px";
    }
  }

  /**
   * Returns the sum of the top and bottom border widths for given element
   * TODO not guaranteed to work on IE8 if borders are not defined in px
   *
   * @param {Node} el
   *
   * @return {Number}
   */
  function getTotalBorderHeight(el) {
    var computedStyle =
      window.getComputedStyle ? window.getComputedStyle(el) : el.currentStyle;
    var borderTopWidth = parseInt(computedStyle.borderTopWidth, 10);
    var borderBottomWidth = parseInt(computedStyle.borderBottomWidth, 10);
    return borderTopWidth + borderBottomWidth;
  }

  /**
   * Capture updated properties.
   */
  function onUpdate(changedProps, allProps) {
    // Called in element context
    var node = this;

    // Consume the new properties,
    // but leave rendering to requestAnimationFrame
    if( node.hasAttribute(TargetView.ID_ATTR) ) {
      var boxId = node.getAttribute(TargetView.ID_ATTR);
      targetModelsById[boxId].update(changedProps);
    }
  }

  /**
   * Render updates to the DOM
   * This is called once per frame, so it is the best place to update DOM
   */
  function onRender() {
    // Render all dirty views
    var len = views.length;
    for(var i=0; i < len; i++) {
      var view = views[i];
      if(view.shouldRender()) {
        view.render();
      }
    }

    // Clear changed flag on targetModels
    for(var boxId in targetModelsById) {
      if(hasOwnProperty.call(targetModelsById, boxId)) {
        targetModelsById[boxId].resetChanged();
      }
    }

    // Run perpetually
    requestAnimationFrame(onRender);
  }

  /**
   * Setup onLoad
   */
  document.addEventListener("DOMContentLoaded", function() {
    smallerNodes = document.getElementsByClassName("smaller");
    matchingNodes = document.getElementsByClassName("matching");
    largerNodes = document.getElementsByClassName("larger");

    window.addEventListener("resize", onResize);
    onResize();

    var scrollimatorNode = document.getElementById("scrollimator");
    var scrollimator = new Scrollimator(scrollimatorNode);

    var targetNodes = document.getElementsByClassName("target-view");
    var infoNodes = document.getElementsByClassName("info-view");
    for(var i=0; i < targetNodes.length; i++) {
      // Get the name off the target element
      var name = "[untitled]";
      if(targetNodes[i].hasAttribute(TargetView.NAME_ATTR)) {
        name = targetNodes[i].getAttribute(TargetView.NAME_ATTR);
      }

      // Create a model object to consume changed properties between renders
      var targetModel = new Model(i, name);
      targetModelsById[i] = targetModel;

      // Create TargetView
      views.push( new TargetView({
        el: targetNodes[i],
        name: name,
        model: targetModel}) );

      // Create InfoView to track the target's props
      views.push( new InfoView({
        el: infoNodes[i],
        name: name,
        model: targetModel }) );
    }

    scrollimator.watch(targetNodes, "all", onUpdate);
    scrollimator.update();

    requestAnimationFrame(onRender);
  });
})();
