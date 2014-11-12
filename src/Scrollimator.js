/* globals Node, NodeList, HTMLCollection */
;(function(){
"use strict";

module.exports = Scrollimator;

// External dependencies
var uid = require("uid"),
  extend = require("extend"),
  each = require("util-each"),
  throttle = require("throttleit"),
  domEvent = require("dom-event"),
  isWindow = require("src/util/isWindow"),
  elementData = require("src/util/elementData"),
  isObjectLiteral = require("src/util/isObjectLiteral");

// Internal dependencies
var constants = require("./constants"),
  boundingBoxStrategy = require("./strategies/boundingBoxStrategy"),
  makeRelativePositionStrategy =
    require("./strategies/makeRelativePositionStrategy"),
  makeEndpointProgressStrategy =
    require("./strategies/makeEndpointProgressStrategy"),
  makeContainedProgressStrategy =
    require("./strategies/makeContainedProgressStrategy"),
  makeVisibleProgressStrategy =
    require("./strategies/makeVisibleProgressStrategy"),
  makeStateStrategy = require("./strategies/makeStateStrategy"),
  Watchable = require("./Watchable");

/**
 * Determines whether given el is a valid scrollimator el.
 *
 * @param {Node} el
 * @param {Boolean} shouldThrow - whether or not to throw if it is invalid.
 *
 * @return {Boolean}
 */
function validateScrollimatorEl(el, shouldThrow) {
  var isValid = el instanceof Node || isWindow(el);
  if(!isValid && shouldThrow) {
    throw new Error("`el` must be of type `Node` or `Window`");
  }
  return isValid;
}

/**
 * Determines whether given el is a valid target el.
 *
 * @param {Node} el
 * @param {Boolean} shouldThrow - whether or not to throw if it is invalid.
 *
 * @return {Boolean}
 */
function validateTargetEl(el, shouldThrow) {
  var isValid = el instanceof Node;
  if(!isValid && shouldThrow) {
    throw new Error("`el` must be an instance of `Node`");
  }
  return isValid;
}

/**
 * Returns the Scrollimator uid of the given element or null if there is none.
 *
 * @param {Node} el
 */
Scrollimator.getScrollimatorId = function(el) {
  validateScrollimatorEl(el, true);
  var key = constants.DATA_PREFIX + constants.KEY_SCROLLIMATOR_ID;
  return elementData(el, key);
};

/**
 * Default settings
 */
Scrollimator.defaults = {
  /**
   * An adaptor function that binds the given `callback` from the
   * scroll event dispatcher associated with the given `el`.
   * Replace this if you are using cubiq/iScroll or similar.
   *
   * @param {Node} el
   * @param {Function} callback
   */
  bindUpdate: function(el, callback) {
    domEvent.on(el, "scroll", callback);
    domEvent.on(window, "resize", callback);
  },

  /**
   * Complement to `bindScroll`.
   *
   * @param {Node} el
   * @param {Function} callback
   */
  unbindUpdate: function(el, callback) {
    domEvent.off(el, "scroll", callback);
    domEvent.off(window, "resize", callback);
  },

  /**
   * Throttling function used internally for scroll.
   * Replace as necessary or use yourself for advanced usage.
   *
   * Note: Maintains the calling context for throttled callback.
   *
   * @param {Function} callback
   * @param {Number} delayMs
   *
   * @return {Function} throttled callback
   */
  throttle: throttle,

  /**
   * Minimum delay enforced between calls to scroll update function.
   * Default: Try to hit once per frame at 60fps
   */
  throttleDelayMs: Math.floor(1000/60),

  /**
   * Callbacks that are called during an update to modify properties
   * on the internal scrollimator model.
   */
  scrollimatorUpdateStrategies: [boundingBoxStrategy],

  /**
   * Callbacks that are called during an update to modify properties
   * on an internal target model.
   */
  targetUpdateStrategies: [
    boundingBoxStrategy,

    makeRelativePositionStrategy("vertical"),
    makeRelativePositionStrategy("horizontal"),

    makeEndpointProgressStrategy("vertical"),
    makeVisibleProgressStrategy("vertical"),
    makeContainedProgressStrategy("vertical"),
    makeStateStrategy("vertical"),

    makeEndpointProgressStrategy("horizontal"),
    makeVisibleProgressStrategy("horizontal"),
    makeContainedProgressStrategy("horizontal"),
    makeStateStrategy("horizontal")
  ],
};

/**
 * Creates a Scrollimator instance.
 *
 * IMPORTANT: Be sure to call #destroy when you are done with this Scrollimator.
 *
 * @param {Node} el - the scrolling scrollimator element
 * @param {Object} options - map of options. See #defaults for documentation.
 */
function Scrollimator(el, options) {
  validateScrollimatorEl(el, true);
  //console.log("INITIALIZING");
  this._resetUid();
  this._setEl(el);
  this.reset(options);
  this._isInitialized = true;
  //console.log("DONE INITIALIZING");;
}

/**
 * Resets the instance to a clean state.
 *
 * @param {Object} options - map of options. See #defaults for documentation.
 */
Scrollimator.prototype.reset = function(options) {
  if(typeof options === "undefined") {
    options = {};
  } else if(!isObjectLiteral(options)) {
    throw new Error("options must be an object literal.");
  }

  if( this._isInitialized ) {
    this.unwatchAll();
    // Unbind any stragglers
    each(this._boundFlags, function(value, key) {
       this._setBinding(key, false);
    }, this);
  }

  this._settings = extend({}, Scrollimator.defaults);
  this._boundFlags = {};
  this._targetMap = {};
  this._setNumTargets(0);

  this.configure(options);
};


/**
 * Adjusts settings on-the-fly.
 *
 * @param {Object} options - map of options. See #defaults for documentation.
 */
Scrollimator.prototype.configure = function(options) {
  if(typeof options === "undefined") {
    throw new Error("options are required");
  }

  // Unbind update bindings
  var oldBoundFlags = extend({}, this._boundFlags);
  each(oldBoundFlags, function(value, key) {
    this._setBinding(key, false);
  }, this);

  this._settings = extend({}, this._settings, options);
  this._resetThrottles();

  // Restore bindings
  each(oldBoundFlags, function(value, key) {
    this._setBinding(key, value);
  }, this);
};

/**
 * Unbinds listeners and cleans up.
 *
 * Important: You MUST call this at teardown to prevent memory leaks.
 */
Scrollimator.prototype.destroy = function() {
  //console.log("DESTROYING");
  this.reset();
  this._setEl(null);
  //console.log("DONE DESTROYING");
};

/**
 * Returns the unique id of this instance.
 * Mostly for debugging purposes.
 *
 * The id is placed on the el's
 * `constants.DATA_PREFIX + constants.KEY_SCROLLIMATOR__ID` attribute
 * while the instance is active.
 *
 * @return {String}
 */
Scrollimator.prototype.getId = function() {
  return this._uid;
};

/**
 * Returns the number of elements currently watched.
 *
 * @return {Number}
 */
Scrollimator.prototype.numWatched = function() {
  return this._numTargets;
};

/**
 * Registers a callback to be notified of changes to the given property
 * on the given el or els.
 * If a NodeList is given, watch will be called recursively for each node.
 * If no property is given, the callback will be notified of changes to
 * all properties.
 * If no context is given, callbacks are called in the element's context.
 *
 * Listeners on the "all" property key will receive batched calls
 * ( one for each update ).
 *
 * Examples:
 * ```javascript
 *     myScrollimator.watch(myNode, "top", function(property, value) {
 *       console.log(property + " is now " + value);
 *     });
 *
 *     myScrollimator.watch(myNode, "all", function(changedKeys, propertyMap) {
 *       for(var i=0; i < changedKeys.length; i++) {
 *         var key = changedKeys[i];
 *         console.log(key + " is now " + propertyMap[ key ]);
 *       }
 *     });
 *  ```
 *
 * For optimal performance, you should use callbacks only to consume the
 * new property values. DOM updates should be performed in
 * requestAnimationFrame callbacks. You can use an isDirty flag for this.
 *
 * To remove a specific listener, use #unwatch
 * To remove all listeners, use #unwatchAll, #reset, or #destroy
 *
 * @param {Node|NodeList} el
 * @param {String} property
 * @param {Function} callback
 * @param {Mixed} context
 */
Scrollimator.prototype.watch = function(el, property, callback, context) {
  if(el instanceof NodeList || el instanceof HTMLCollection) {
    // Call recursively for each node
    each(el, function(node, i) {
      this.watch(node, property, callback, context);
    }, this);
    return;
  }

  validateTargetEl(el, true);
  if(typeof context === "undefined") {
    context = el;
  }
  var target = this._createTargetOnce(el);
  target.watchable.watch(property, callback, context);
};

/**
 * Remove handlers matching the given `el`, `property`, `callback` combination.
 * If a NodeList is given, unwatch will be called recursively for each node.
 *
 * To remove all registered listeners, use #unwatchAll, #reset, or #destroy
 *
 * @param {Node|NodeList} el
 * @param {String} property
 * @param {Function} callback
 */
Scrollimator.prototype.unwatch = function(el, property, callback) {
  // TODO this function will be difficult for V8 to optimize. Worth fixing?
  if(typeof el !== "undefined" && el instanceof NodeList) {
    // Call recursively for each node
    each(el, function(node, i) {
      this.unwatch(node, property, callback);
    }, this);
    return;
  }

  if(typeof property === "function" && arguments.length === 2) {
    callback = property;
    property = undefined;
  }

  // Allow el to be omitted,
  // but don't allow client to pass wrong types as el.
  // we can do this with careful arguments length checking.
  if( typeof el === "string" && arguments.length <=2 ) {
    property = el;
    el = undefined;
  } else if(typeof el === "function" && arguments.length === 1) {
    callback = el;
    el = undefined;
    property = undefined;
  } else if(typeof el !== "undefined" && !(el instanceof Node)) {
    throw new Error(
        "el must be an instance of `Node` or `NodeList` or be omittted.");
  }

  // Throw if all arguments are undefined
  if(typeof el === "undefined" &&
      typeof property === "undefined" &&
      typeof callback === "undefined") {
    throw new Error(
        "`unwatch` requires an `el` and/or `property` and/or `callback`." +
        "Perhaps you meant to use `unwatchAll`?");
  }

  if(typeof el !== "undefined") {
    // Unwatch combo on given el
    var targetId = this._getTargetId(el);
    if( typeof targetId === "string" ) {
      this._unwatchById(targetId, property, callback);
    }
  } else {
    // Unwatch combo on all els
    each(this._targetMap, function(target, targetId) {
      this._unwatchById(targetId, property, callback);
    }, this);
  }
};

/**
 * Remove all registered callbacks for all watched elements.
 *
 * It's not necessary to call this before #reset or #destroy.
 */
Scrollimator.prototype.unwatchAll = function() {
  each(this._targetMap, function(value, key) {
    this._unwatchById(key);
  }, this);
};

/**
 * Scroll update handler.
 * Powers the core event loop.
 *
 * By default, a throttled version of this function is automatically
 * bound to the scrollimator's scroll handler and resize handler
 * by the `bindScroll` and `bindResize` functions given in the `options` map.
 *
 * Call this manually when
 *  * the scrollimator is manually resized or repositioned
 *  * any of the scrollimator's children are resized or repositioned
 *  * the scrollimator's DOM subtree is changed
 *
 * You might consider using a mutation observer polyfill to call this.
 * Be sure to throttle this function if you pass it to a scroll handler.
 */
Scrollimator.prototype.update = function() {
  var scrollimatorProps = {};

  // Exectute scrollimator update strategies
  each(this._settings.scrollimatorUpdateStrategies, function(strategy, i) {
    strategy(this._el, scrollimatorProps);
  }, this);

  each(this._targetMap, function(target) {
    this._updateTarget(target, scrollimatorProps);
  }, this);
};

////////////////////////////////////////////////////////////////////////////////
// PRIVATE
////////////////////////////////////////////////////////////////////////////////

/**
 * Updates a single target.
 *
 * @param {Object} target - a target mapping (el and model)
 * @param {Object} scrollimatorPosition - bounding box of scrollimator
 */
Scrollimator.prototype._updateTarget = function(target, scrollimatorProps) {
  var targetProps = {};

  // Exectute target update strategies
  each(this._settings.targetUpdateStrategies, function(strategy, i) {
    strategy(target.el, targetProps, scrollimatorProps);
  }, this);

  // Update properties and call listeners
  target.watchable.set(targetProps);
};

/**
 * Unwatches a target by it's targetId
 */
Scrollimator.prototype._unwatchById = function(targetId, property, callback) {
  if( typeof property === "undefined" && typeof callback === "undefined" ) {
    this._removeTarget(targetId);
  } else {
    var target = this._targetMap[targetId];
    target.watchable.unwatch(property, callback);

    if( !target.watchable.isWatched() ) {
      this._removeTarget(targetId);
    }
  }
};

/**
 * Returns the target for the given `el`, creating a new one if necessary.
 *
 * @param {Node} el
 *
 * @return {Target}
 */
Scrollimator.prototype._createTargetOnce = function(el) {
  var targetId = this._getTargetId(el),
      target;
  // If node is not already watched by this instance
  if(typeof targetId !== "string") {
    // Create a new target
    var targetWatchable = new Watchable();

    // We need to associate DOM nodes with their targets.
    // To avoid memory leaks, we must use an indirect reference.
    // Thus, we store a uid as a data attribute on the DOM node
    targetId = targetWatchable.getId();
    this._setTargetId(el, targetId);

    target = {
      el: el,
      watchable: targetWatchable
    };

    // and use this uid as the key in our target map.
    this._targetMap[targetId] = target;

    this._setNumTargets(this._numTargets + 1);

  } else {
    target = this._targetMap[targetId];
  }

  return target;
};

/**
 * Sets the target id on an el.
 */
Scrollimator.prototype._setTargetId = function(el, targetId) {
  elementData(el, this._targetIdKey, targetId);
};

/**
 * Gets the target id from an el.
 *
 * @return {String}
 */
Scrollimator.prototype._getTargetId = function(el) {
  var targetId = elementData(el, this._targetIdKey);
  if( !this._targetMap.hasOwnProperty(targetId) ) {
    targetId = false;
  }
  return targetId;
};

/**
 * Removes and destroys the target at the given id.
 *
 * @param {String} targetId
 */
Scrollimator.prototype._removeTarget = function(targetId) {
  var target = this._targetMap[targetId];

  // Remove data property from node
  this._setTargetId(target.el, null);

  target.watchable.destroy();
  delete this._targetMap[targetId];

  this._setNumTargets(this._numTargets - 1);
};

/**
 * Set numTargets and perform necessary operations.
 *
 * @param {Number} value - the new value
 */
Scrollimator.prototype._setNumTargets = function(value) {
  this._numTargets = value;
  var hasTargets = this._numTargets > 0;
  this._setBinding("update", hasTargets);
};

/**
 * Replaces this instance's el and caches associated values.
 *
 * @param {Node} el - node to set or null to cleanup
 */
Scrollimator.prototype._setEl = function(el) {
  if(el !== this._el) {
    if(this._el !== undefined) {
      // Remove id from old el
      elementData(this._el, this._scrollimatorIdKey, null);
    }

    this._el = el;

    if(el !== null) {
      this._isWindow = isWindow(el);
      // Add id to new el
      elementData(this._el, this._scrollimatorIdKey, this._uid);
    }
  }
};

/**
 * (Re)sets this instance's uid and updates associated cached values.
 */
Scrollimator.prototype._resetUid = function() {
  this._uid = uid(constants.UID_LENGTH);
  // Cache concatenations
  this._scrollimatorIdKey =
    constants.DATA_PREFIX + constants.KEY_SCROLLIMATOR_ID;
  this._targetIdKey =
    constants.DATA_PREFIX +
    this._uid +
    constants.KEY_DELIMITER +
    constants.KEY_TARGET_ID;
};

/**
 * Resets cached throttled functions
 */
Scrollimator.prototype._resetThrottles = function() {
  var self = this;
  this._throttledUpdate =
    this._settings.throttle.call(
        this,
        function() {
          self.update.apply(self, arguments);
        },
        this._settings.throttleDelayMs);
};

/**
 * Binds or unbinds the correct callback function to the given event type.
 *
 * @param {String} type
 * @param {Boolean} shouldBind
 */
Scrollimator.prototype._setBinding = function(type, shouldBind) {
  var binder, unbinder, callback;

  var hasFlag = this._boundFlags.hasOwnProperty(type);
  if( (!hasFlag && shouldBind) ||
      (hasFlag && this._boundFlags[type] !== shouldBind) )
  {

    if(type === "update") {
      binder = this._settings.bindUpdate;
      unbinder = this._settings.unbindUpdate;
      callback = this._throttledUpdate;
    }

    // Only bind if we can both bind and unbind
    if( typeof binder === "function" && typeof unbinder === "function" ) {
      if(shouldBind) {
          binder.call(this, this._el, callback);
      } else {
          unbinder.call(this, this._el, callback);
      }
    }

    // If bind/unbind is disabled, we still just pretend the binding worked.
    this._boundFlags[type] = shouldBind;
  }
};

})(); // End module
