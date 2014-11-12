;(function(){
  "use strict";

module.exports = Watchable;

// External dependencies
var uid = require("uid"),
  each = require("util-each"),
  extend = require("extend");

// Internal dependencies
var constants = require("./constants");

/**
 * Create a new target instance.
 */
function Watchable() {
  this._id = uid(constants.UID_LENGTH);

  this._callbacksByProperty = {};
  // We need to associate contexts with callbacks,
  // but allocating new objects on insert is clunky/expensive,
  // so use a parallel map, instead.
  this._contextsByProperty = {};

  this._properties = {};
  this._numWatchedProperties = 0;
  this._numBindings = 0;
}

/**
 * Returns the target's unique id.
 *
 * @return {String}
 */
Watchable.prototype.getId = function() {
  return this._id;
};

/**
 * Register a callback to be called when the given property changes.
 *
 * @param {String} property
 * @param {Function} callback
 * @param {Mixed} context
 */
Watchable.prototype.watch = function(property, callback, context) {
  if(typeof property === "function") {
    context = callback;
    callback = property;
    property = "all";
  } else if(typeof property !== "string" && typeof property !== "undefined") {
    throw new Error("`property` must be a string or be omitted.");
  }

  if(typeof callback !== "function") {
    throw new Error("A function `callback` must be given.");
  }

  if( !this._callbacksByProperty.hasOwnProperty(property) ) {
    this._callbacksByProperty[property] = [];
    this._contextsByProperty[property] = [];
    this._numWatchedProperties++;
  }

  if( this._callbacksByProperty[property].indexOf(callback) < 0 ) {
    this._callbacksByProperty[property].push(callback);
    this._contextsByProperty[property].push(context);
    this._numBindings++;
  }
};

/**
 * Unregisters callbacks at the given property-callback context.
 *
 * @param {String} property
 * @param {Function} callback
 */
Watchable.prototype.unwatch = function(property, callback) {
  if(typeof property === "function") {
    callback = property;
    property = undefined;
  }

  // If no property was specified
  if(typeof property === "undefined" &&  typeof callback === "function") {
    // Remove callback from all properties.

    // get full list of property keys before modifying the map
    // can't use Object.keys because IE8 sucks
    var watchedKeys = [];
    each(this._callbacksByProperty, function(callbacks, key) {
      watchedKeys.push(key);
    });

    // Recurively try to remove callback from each key
    // which might remove the key from map if it removes last callback
    each(watchedKeys, function(key, i) {
      this.unwatch(key, callback);
    }, this);

  } else if( typeof property === "string" && typeof callback === "function") {
    // Remove callback at property
    if( this._callbacksByProperty.hasOwnProperty(property) ) {
      var bindings = this._callbacksByProperty[property];
      var contexts = this._contextsByProperty[property];

      // Find the callback in the array.
      // Can't use Array.prototype.indexOf because IE8
      var idx = -1;
      each(bindings, function(cb, i) {
        if(cb === callback) {
          idx = i;
          return false;
        }
      });

      if( idx >= 0) {
        bindings.splice(idx, 1);
        contexts.splice(idx, 1); // Will always be same idx
        this._numBindings--;

        if(bindings.length === 0) {
          // Empty property. Remove it.
          this.unwatch(property);
        }
      }
    }
  } else if( typeof property === "string" ){
    // Remove ALL callbacks at property
    if(this._callbacksByProperty.hasOwnProperty(property) ) {
      this._numBindings -= this._callbacksByProperty[property].length;
      this._numWatchedProperties--;
      delete this._callbacksByProperty[property];
      delete this._contextsByProperty[property];
    }
  } else {
    throw new Error("`unwatch` requires a `property` and/or `callback`." +
        " Perhaps you meant to use `unwatchAll`.");
  }
};

/**
 * Unregister all callbacks
 */
Watchable.prototype.unwatchAll = function() {
  each(this._callbacksByProperty, function(value, key) {
    this.unwatch(key);
  }, this);
};

Watchable.prototype.destroy = function() {
  this.unwatchAll();
};

/**
 * Return true if the Watchable is being watched.
 *
 * @return {Boolean}
 */
Watchable.prototype.isWatched = function() {
  return this.numBindings() > 0;
};

/**
 * Returns the number of unique property-callback bindings.
 *
 * @return {Number}
 */
Watchable.prototype.numBindings = function() {
  return this._numBindings;
};

/**
 * Returns the number of watched properties.
 *
 * @return {Number}
 */
Watchable.prototype.numWatchedProperties = function() {
  return this._numWatchedProperties;
};

/**
 * Sets the given property and calls any callbacks registered on it.
 *
 * @param {String} property
 * @param {Mixed} value
 */
Watchable.prototype.set = function(propertyKey, value) {
  var changedProps = {},
    diff,
    allProps;

  if(typeof propertyKey === "object") {
    diff = propertyKey;
  } else {
    diff = {};
    diff[propertyKey] = value;
  }

  for(propertyKey in diff) {
    value = diff[propertyKey];
    if( this.isDifferent(propertyKey, value) ) {
      this._properties[propertyKey] = value;
      changedProps[propertyKey] = value;
      this.notify(propertyKey, propertyKey, value);
    }
  }

  allProps = extend({}, this._properties);
  this.notify("all", changedProps, allProps);
};

Watchable.prototype.isDifferent = function(propertyKey, newValue) {
  return !this._properties.hasOwnProperty(propertyKey) ||
          this._properties[propertyKey] !== newValue;
};

/**
 * Notifies the handlers at the given binding key.
 * Passes additional arguments on to the callback.
 *
 * @param {String} bindingKey - the key to notify (often equal to propertyKey)
 */
Watchable.prototype.notify = function(bindingKey) {
  if(this._callbacksByProperty.hasOwnProperty(bindingKey)) {
    // Convert arguments to real array and remove bindingKey
    var args = Array.prototype.slice.call(arguments);
    args.shift();

    each(this._callbacksByProperty[bindingKey], function(callback, i) {
      var context = (this._contextsByProperty[bindingKey])[i];
      callback.apply(context, args);
    }, this);
  }
};

})(); // End module
