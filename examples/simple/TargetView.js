;(function(){
  "use strict";

  // transport
  window.TargetView = TargetView;

  function isNaN(x) {
    return x !== x;
  }

  TargetView.ID_ATTR = "data-target-view-id";
  TargetView.NAME_ATTR = "data-target-view-name";

  /**
   * A view that displays it's own progress traversing
   * its scrollimator container.
   *
   * @param {Object} options
   */
  function TargetView(options) {
    this.el = options.el;
    this.targetModel = options.model;
    this.el.setAttribute(TargetView.ID_ATTR, this.targetModel.id);
    this.baseClassName = this.el.className;
  }

  /**
   * Render the view
   */
  TargetView.prototype.render = function() {
    if(typeof this.labelNode === "undefined") {
      this.labelNode = document.createElement("span");
      this.labelNode.className = "label";
      // Convert BoxModel id to character (65 is A)
      this.labelNode.innerHTML = String.fromCharCode(65 + this.targetModel.id);
      this.el.insertBefore(this.labelNode, this.el.firstChild);
    }

    if(typeof this.verticalVisibleProgressNode === "undefined") {
      this.verticalVisibleProgressContainerNode =
        document.createElement("div");
      this.verticalVisibleProgressContainerNode.className =
        "progress-bar-container";

      this.verticalVisibleProgressNode = document.createElement("div");
      this.verticalVisibleProgressNode.className =
        "progress-bar vertical-visible-progress";
      this.verticalVisibleProgressContainerNode
        .appendChild(this.verticalVisibleProgressNode);

      this.el.appendChild(this.verticalVisibleProgressContainerNode);
    }

    if(typeof this.verticalContainedProgressNode === "undefined") {
      this.verticalContainedProgressContainerNode =
        document.createElement("div");
      this.verticalContainedProgressContainerNode.className =
        "progress-bar-container";

      this.verticalContainedProgressNode = document.createElement("div");
      this.verticalContainedProgressNode.className =
        "progress-bar vertical-contained-progress";
      this.verticalContainedProgressContainerNode
        .appendChild(this.verticalContainedProgressNode);

      this.el.appendChild(this.verticalContainedProgressContainerNode);
    }

    var className =
      this.baseClassName + " " + this.targetModel.props.verticalState;
    var isVisible =
      this.targetModel.props.verticalVisibleProgress >= 0 &&
      this.targetModel.props.verticalVisibleProgress <= 1;
    if(isVisible) {
      className += " visible";
    }
    this.el.className = className;

    this._stickifyLabel();

    var verticalVisibleProgress =
      Math.max(this.targetModel.props.verticalVisibleProgress, 0);

    var verticalContainedProgress =
      Math.max(this.targetModel.props.verticalContainedProgress, 0);
    // Contained Progress can be NaN if element cannot be contained
    // Convert to zero
    if(isNaN(verticalContainedProgress)) {
      verticalContainedProgress = 0;
    } else if(verticalContainedProgress > 1) {
      verticalContainedProgress = 1;
    }

    this.verticalVisibleProgressNode.style.width =
      (verticalVisibleProgress * 100) + "%";
    this.verticalContainedProgressNode.style.width =
      (verticalContainedProgress * 100) + "%";
  };

  /**
   * Keep label visible as we scroll through boxView
   */
  TargetView.prototype._stickifyLabel = function() {
    var height = this.targetModel.props.height;

    // Oi, I guess we need the border width
    // Don't worry, we polyfilled getComputedStyle
    var targetStyle = window.getComputedStyle(this.el);
    var targetBorderTopWidth = parseInt(targetStyle.borderTopWidth, 10);

    // The real scrollTop (padding-box)
    var scrollTop = -1*this.targetModel.props.top - targetBorderTopWidth;

    var labelStyle = window.getComputedStyle(this.labelNode);
    var labelOffset = Math.abs(parseInt(labelStyle.marginTop, 10));

    if(scrollTop >= -labelOffset && scrollTop < height - labelOffset ) {
      this.labelNode.style.top = scrollTop + labelOffset + "px";
    } else if(scrollTop >= height - labelOffset) {
      this.labelNode.style.top =
        this.targetModel.props.height + "px";
    } else {
      this.labelNode.style.top = 0 + "px";
    }
  };

  TargetView.prototype.shouldRender = function() {
    return this.targetModel.hasChanged();
  };

})();
