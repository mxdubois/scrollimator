;(function(){
  "use strict";

  // transport
  window.InfoView = InfoView;

  InfoView.ID_ATTR = "data-info-view-id";
  InfoView.PROPERTY_KEY_ATTR = "data-info-view-property-key";
  InfoView.LABEL_BASE_CLASS = "label";

  /**
   * A view for displaying the properties of a targetModel.
   *
   * @param {Object} options
   */
  function InfoView(options) {
    this.el = options.el;
    this.targetModel = options.model;
    this.el.setAttribute(InfoView.ID_ATTR, this.targetModel.id);
    this.propertyNodesByKey = {};
    this._baseClassName = this.el.className;
    this.name = options.name;
  }

  /**
   * Renders the view
   */
  InfoView.prototype.render = function() {
    var key, value;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var changedProps = this.targetModel.changedProps;
    var shouldRenderPropertyList = false;

    // Render label
    if(typeof this.labelNode === "undefined") {
      this.labelNode = document.createElement("span");
      this.labelNode.className = "label";
      // Convert BoxModel id to character (65 is A)
      this.labelNode.innerHTML = String.fromCharCode(65 + this.targetModel.id);
      this.el.insertBefore(this.labelNode, this.el.firstChild);
    }

    if(typeof this.nameNode === "undefined") {
      this.nameNode = document.createElement("span");
      this.nameNode.className = "name";
      // Convert BoxModel id to character (65 is A)
      this.nameNode.innerHTML = this.name;
      this.el.insertBefore(this.nameNode, this.labelNode.nextSibling);
    }

    var className = this._baseClassName;
    var verticalState = this.targetModel.props.verticalState;
    className += " " + verticalState;

    var verticalVisibleProgress = this.targetModel.props.verticalVisibleProgress;
    var isVisible =
      verticalVisibleProgress >= 0 &&
      verticalVisibleProgress <= 1;
    if(isVisible) {
      className += " visible";
    }

    this.el.className = className;

    // render property list
    for(key in changedProps) {
      if( hasOwnProperty.call(changedProps, key) ) {
        value = changedProps[key];
        if( hasOwnProperty.call(this.propertyNodesByKey, key) ) {
          this.propertyNodesByKey[key].childNodes[1].innerHTML =
            this._prettyPrintValue(value);
        } else {
          this._createPropertyNode(key, value);
          shouldRenderPropertyList = true;
        }
      }
    }

    if(shouldRenderPropertyList) {
      this._renderPropertyList();
    }
  };

  /**
   * Renders the property list alphabetically.
   * TODO this could easily be a separate view.
   */
  InfoView.prototype._renderPropertyList = function() {
    var propertyListNode;
    if(typeof this.propertyListNode === "undefined") {
      // create list node
      propertyListNode = document.createElement("ul");
      propertyListNode.className = "property-list";
      this.propertyListNode = propertyListNode;
    } else {
      // clear list node
      propertyListNode = this.propertyListNode;
      this.el.removeChild(propertyListNode);
      while (propertyListNode.firstChild) {
        propertyListNode.removeChild(propertyListNode.firstChild);
      }
    }

    // Gather keys the hard way for IE8
    var keys = [];
    for(var key in this.propertyNodesByKey) {
      if( Object.prototype.hasOwnProperty.call(this.propertyNodesByKey, key) ) {
        keys.push(key);
      }
    }

    // Sort keys alphabetically
    keys.sort();

    // Insert propertyNodesByKey in order
    var len = keys.length;
    for(var i=0; i < len; i++) {
      this.propertyListNode.appendChild(this.propertyNodesByKey[keys[i]]);
    }

    // reinsert
    this.el.insertBefore(propertyListNode, this.nameNode.nextSibling);
  };

  /**
   * Creates a property node and adds it to the map.
   *
   * @param {String} key
   * @param {String} value
   *
   * @return {Node}
   */
  InfoView.prototype._createPropertyNode = function(key, value) {
    var propertyNode = document.createElement("li");
    propertyNode.className = "property";
    propertyNode.setAttribute(InfoView.PROPERTY_KEY_ATTR, key);

    var keyNode = document.createElement("span");
    keyNode.className = "property-key";
    keyNode.innerHTML = this._prettyPrintKey(key);

    var valueNode = document.createElement("span");
    valueNode.className = "property-value";
    valueNode.innerHTML = this._prettyPrintValue(value);

    propertyNode.appendChild(keyNode);
    propertyNode.appendChild(valueNode);

    this.propertyNodesByKey[key] = propertyNode;

    return propertyNode;
  };

  /**
   * Formats the key.
   *
   * @param {String} key
   *
   * @return {String}
   */
  InfoView.prototype._prettyPrintKey = function(key) {
    return key;
  };

  /**
   * Formats the value.
   *
   * @param {String} value
   *
   * @return {String}
   */
  InfoView.prototype._prettyPrintValue = function(value) {
    if( typeof value === "number" &&
        value !== Number.POSITIVE_INFINITY &&
        value !== Number.NEGATIVE_INFINITY &&
        !isNaN(value)) {

      value = "" + Math.round(value * 100) / 100;
      if(value.indexOf(".") < 0) {
        value += ".";
      }
      var zeroPad = 3 - (value.length - value.indexOf("."));
      while(zeroPad > 0) {
        value += "0";
        zeroPad--;
      }
    }
    return value;
  };

  /**
   * Indicates whether or not the view should be re-rendered.
   *
   * @return {Boolean}
   */
  InfoView.prototype.shouldRender = function() {
    return this.targetModel.hasChanged();
  };

})();
