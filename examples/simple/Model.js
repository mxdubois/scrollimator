;(function() {
  "use strict";

  // transport
  window.Model = Model;

  /**
   * A simple model object for storing properties between renders.
   */
  function Model(id, name) {
    this.id = id;
    this.name = name;
    this.props = {};
    this.resetChanged();
  }

  /**
   * Consumes the properties given in changedProps
   */
  Model.prototype.update = function(changedProps) {
    for(var key in changedProps) {
      if(Object.prototype.hasOwnProperty.call(changedProps, key)) {
        this.props[key] = changedProps[key];
        this.changedProps[key] = changedProps[key];
        this._hasChanged = true;
      }
    }
  };

  /**
   * Indicates whether or not the model has changed since it was last reset.
   *
   * @return {Boolean}
   */
  Model.prototype.hasChanged = function() {
    return this._hasChanged;
  };

  /**
   * Clear the changedProps and reset hasChanged flag.
   */
  Model.prototype.resetChanged = function() {
      this._hasChanged = false;
      this.changedProps = {};
  };

})();
