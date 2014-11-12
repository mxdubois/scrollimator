/*! Scrollimator v0.0.0 | https://github.com/mxdubois/scrollimator | MIT License */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["Scrollimator"] = factory();
	else
		root["Scrollimator"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

/* globals Node, NodeList, HTMLCollection */
;(function(){
"use strict";

module.exports = Scrollimator;

// External dependencies
var uid = __webpack_require__(15),
  extend = __webpack_require__(12),
  each = __webpack_require__(16),
  throttle = __webpack_require__(13),
  domEvent = __webpack_require__(14),
  isWindow = __webpack_require__(9),
  elementData = __webpack_require__(10),
  isObjectLiteral = __webpack_require__(11);

// Internal dependencies
var constants = __webpack_require__(1),
  boundingBoxStrategy = __webpack_require__(3),
  makeRelativePositionStrategy =
    __webpack_require__(4),
  makeEndpointProgressStrategy =
    __webpack_require__(5),
  makeContainedProgressStrategy =
    __webpack_require__(6),
  makeVisibleProgressStrategy =
    __webpack_require__(7),
  makeStateStrategy = __webpack_require__(8),
  Watchable = __webpack_require__(2);

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


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

var constants = {
  VERTICAL: "vertical",
  HORIZONTAL: "horizontal",
  DATA_PREFIX : "data-Scrollanism-",
  KEY_DELIMITER: "-",
  KEY_SCROLLIMATOR_ID : "id",
  KEY_TARGET_ID : "targetId",
  UID_LENGTH : 16,
  states : {
    CONTAINED : "contained",
    SPANNING : "spanning",
    ENTERING : "entering",
    EXITING : "exiting",
    AHEAD : "ahead",
    BEHIND : "behind"
  },
  axisKeys: {}
};

constants.axisKeys[constants.VERTICAL] = {
  near: "top",
  far: "bottom",
  length: "height"
};

constants.axisKeys[constants.HORIZONTAL] = {
  near: "left",
  far: "right",
  length: "width"
};

module.exports = constants;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

;(function(){
  "use strict";

module.exports = Watchable;

// External dependencies
var uid = __webpack_require__(15),
  each = __webpack_require__(16),
  extend = __webpack_require__(12);

// Internal dependencies
var constants = __webpack_require__(1);

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


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

var getPosition = __webpack_require__(17),
  extend = __webpack_require__(12);

module.exports = function getBoundingBox(el, props, parentProps) {
  "use strict";

  var position = getPosition(el);
  extend(props, position);
};


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

var constants = __webpack_require__(1);

module.exports = function makeRelativePositionStrategy(axis) {
  "use strict";

  var nearKey = constants.axisKeys[axis].near;
  var farKey = constants.axisKeys[axis].far;

  return function computeRelativePosition(el, props, parentProps){
    var containernear = parentProps[nearKey];
    props[nearKey] = props[nearKey] - containernear;
    props[farKey] = props[farKey] - containernear;
  };

};


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

var constants = __webpack_require__(1);

module.exports = function makeEndpointProgressStrategy(axis) {
  "use strict";

  var nearKey = constants.axisKeys[axis].near;
  var farKey = constants.axisKeys[axis].far;
  var lengthKey = constants.axisKeys[axis].length;

  return function computeEndpointProgress(el, props, parentProps) {
    var containerLength = parentProps[lengthKey];

    // target coords are relative, so use containerLength instead of far coord.
    var nearTraveled = containerLength - props[nearKey];
    var farTraveled = containerLength - props[farKey];

    props[nearKey + "Progress"] = nearTraveled / containerLength;
    props[farKey + "Progress"] =  farTraveled / containerLength;
  };
};


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

var constants = __webpack_require__(1);

module.exports = function makeContainedProgressStrategy(axis) {
  "use strict";

  var nearKey = constants.axisKeys[axis].near;
  var lengthKey = constants.axisKeys[axis].length;
  var resultKey = axis + "ContainedProgress";

  return function computeContainedProgress(el, props, parentProps) {
    // Determine the length el can travel while fully contained by parent
    var containedLength = parentProps[lengthKey] - props[lengthKey];
    var offset = props[nearKey];

    // If the containedLength is negative, target cannot be contained
    if(containedLength < 0) {
      props[resultKey] = Number.NaN;
    } else if(containedLength === 0 && offset === 0) {
      // target size matches container and target is centered in container
      // 0/0 is NaN but, in this case, we really want 0 or 1
      // we choose to use 1 since the traversal is complete
      props[resultKey] = 1;
    } else {
      props[resultKey] = 1 - (offset / containedLength);
    }
  };

};


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

var constants = __webpack_require__(1);

module.exports = function makeVisibleProgressStrategy(axis) {
  "use strict";

  var nearKey = constants.axisKeys[axis].near;
  var lengthKey = constants.axisKeys[axis].length;

  var resultKey = axis + "VisibleProgress";

  return function computeVisibleProgress(el, props, parentProps) {
    var parentLength = parentProps[lengthKey];
    // Determine the length el can travel while remaining visible in parent
    var visibleLength = parentLength + props[lengthKey];
    // target coords are relative to parent,
    // so use parent length instead of parent far coord.
    var visibleTraveled = parentLength - props[nearKey];
    props[resultKey] = visibleTraveled / visibleLength;
  };

};


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

var constants = __webpack_require__(1);

module.exports = function makeStateStrategy(axis) {
  "use strict";

  var nearKey = constants.axisKeys[axis].near;
  var farKey = constants.axisKeys[axis].far;

  var visibleProgressKey = axis + "VisibleProgress";
  var containedProgressKey = axis + "ContainedProgress";
  var nearProgressKey = nearKey + "Progress";
  var farProgressKey = farKey + "Progress";

  var resultKey = axis + "State";

  return function computeState(el, props, parentProps) {
    var state;

    var visibleProgress = props[visibleProgressKey];
    var containedProgress = props[containedProgressKey];
    var nearProgress = props[nearProgressKey];
    var farProgress = props[farProgressKey];

    if(containedProgress >=0 && containedProgress <= 1) {
      if(nearProgress === 1 && farProgress === 0) {
        state = "matching";
      } else {
        state = "contained";
      }
    } else if(visibleProgress < 0) {
      state = "ahead";
    } else if(visibleProgress > 1) {
      state = "behind";
    } else {
      // Target is visible but not contained
      if(nearProgress > 1 && farProgress < 0) {
        state = "spanning";
      } else if(nearProgress > 1 && farProgress >= 0 && farProgress <=1) {
        state = "exiting";
      } else if(farProgress < 0 && nearProgress >= 0 && nearProgress <= 1) {
        state = "entering";
      }
    }
    props[resultKey] = state;
  };

};


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

module.exports = function isWindow(obj) {
  "use strict";
  return (typeof obj === "object" &&
    obj !== null &&
    obj["setInterval"] !== undefined); // jshint ignore:line
};



/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

module.exports = elementData;

var isWindow = __webpack_require__(9);

function elementData(el, key, value) {
  "use strict";

  if(typeof key !== "string") {
    throw new Error("A string `key` is required");
  }

  if(isWindow(el)) {
    if(typeof value === "undefined") {
      value = el[key];
    } else if(value === null) {
      delete el[key];
    } else {
      el[key] = value;
    }
  } else if(el instanceof Node) {
    if(typeof value === "undefined") {
      if(el.hasAttribute(key)) {
        value = el.getAttribute(key);
      }
    } else if(value === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
  } else {
    throw new Error("el must be an instance of Node or Window.");
  }

  return value;
}



/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

module.exports = function(obj) {
  "use strict";
  return Object.prototype.toString.call( obj ) === '[object Object]';
};


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;
var undefined;

var isPlainObject = function isPlainObject(obj) {
	'use strict';
	if (!obj || toString.call(obj) !== '[object Object]') {
		return false;
	}

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {}

	return key === undefined || hasOwn.call(obj, key);
};

module.exports = function extend() {
	'use strict';
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if ((typeof target !== 'object' && typeof target !== 'function') || target == null) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target === copy) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
					if (copyIsArray) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];
					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[name] = extend(deep, clone, copy);

				// Don't bring in undefined values
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};



/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {


/**
 * Module exports.
 */

module.exports = throttle;

/**
 * Returns a new function that, when invoked, invokes `func` at most one time per
 * `wait` milliseconds.
 *
 * @param {Function} func The `Function` instance to wrap.
 * @param {Number} wait The minimum number of milliseconds that must elapse in between `func` invokations.
 * @return {Function} A new function that wraps the `func` function passed in.
 * @api public
 */

function throttle (func, wait) {
  var rtn; // return value
  var last = 0; // last invokation timestamp
  return function throttled () {
    var now = new Date().getTime();
    var delta = now - last;
    if (delta >= wait) {
      rtn = func.apply(this, arguments);
      last = now;
    }
    return rtn;
  };
}


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

module.exports = on;
module.exports.on = on;
module.exports.off = off;

function on (element, event, callback, capture) {
  (element.addEventListener || element.attachEvent).call(element, event, callback, capture);
  return callback;
}

function off (element, event, callback, capture) {
  (element.removeEventListener || element.detachEvent).call(element, event, callback, capture);
  return callback;
}


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

/**
 * Export `uid`
 */

module.exports = uid;

/**
 * Create a `uid`
 *
 * @param {String} len
 * @return {String} uid
 */

function uid(len) {
  len = len || 7;
  return Math.random().toString(35).substr(2, len);
}


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

var hasOwn = Object.prototype.hasOwnProperty;

/**
 * Iterate over any object, calling the callback function on every iteration.
 *
 * @param {Object}   obj
 * @param {Function} fn
 * @param {*}        context
 */
module.exports = function (obj, fn, context) {
  // Iterate over array-like objects numerically.
  if (obj != null && obj.length === +obj.length) {
    for (var i = 0; i < obj.length; i++) {
      fn.call(context, obj[i], i, obj);
    }
  } else {
    for (var key in obj) {
      // Use the Object prototype directly in case the object we are iterating
      // over does not inherit from `Object.prototype`.
      if (hasOwn.call(obj, key)) {
        fn.call(context, obj[key], key, obj);
      }
    }
  }
};


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

'use strict';

/**
 * Transport.
 */
module.exports = position;

/**
 * Globals.
 */
var win = window;
var doc = win.document;
var docEl = doc.documentElement;

/**
 * Poor man's shallow object extend.
 *
 * @param {Object} a
 * @param {Object} b
 *
 * @return {Object}
 */
function extend(a, b) {
	for (var key in b) {
		a[key] = b[key];
	}
	return a;
}

/**
 * Checks whether object is window.
 *
 * @param {Object} obj
 *
 * @return {Boolean}
 */
function isWin(obj) {
	return obj && obj.setInterval != null;
}

/**
 * Returns element's object with `left`, `top`, `bottom`, `right`, `width`, and `height`
 * properties indicating the position and dimensions of element on a page.
 *
 * @param {Element} element
 *
 * @return {Object}
 */
function position(element) {
	var winTop = win.pageYOffset || docEl.scrollTop;
	var winLeft = win.pageXOffset || docEl.scrollLeft;
	var box = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };

	if (isWin(element)) {
		box.width = win.innerWidth || docEl.clientWidth;
		box.height = win.innerHeight || docEl.clientHeight;
	} else if (docEl.contains(element) && element.getBoundingClientRect != null) {
		extend(box, element.getBoundingClientRect());
		// width & height don't exist in <IE9
		box.width = box.right - box.left;
		box.height = box.bottom - box.top;
	} else {
		return box;
	}

	box.top = box.top + winTop - docEl.clientTop;
	box.left = box.left + winLeft - docEl.clientLeft;
	box.right = box.left + box.width;
	box.bottom = box.top + box.height;

	return box;
}

/***/ }
/******/ ])
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCAzZGQwODZjNjIyMTU5MTQ0NjNkZCIsIndlYnBhY2s6Ly8vLi9zcmMvU2Nyb2xsaW1hdG9yLmpzIiwid2VicGFjazovLy8uL3NyYy9jb25zdGFudHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL1dhdGNoYWJsZS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc3RyYXRlZ2llcy9ib3VuZGluZ0JveFN0cmF0ZWd5LmpzIiwid2VicGFjazovLy8uL3NyYy9zdHJhdGVnaWVzL21ha2VSZWxhdGl2ZVBvc2l0aW9uU3RyYXRlZ3kuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0cmF0ZWdpZXMvbWFrZUVuZHBvaW50UHJvZ3Jlc3NTdHJhdGVneS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc3RyYXRlZ2llcy9tYWtlQ29udGFpbmVkUHJvZ3Jlc3NTdHJhdGVneS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc3RyYXRlZ2llcy9tYWtlVmlzaWJsZVByb2dyZXNzU3RyYXRlZ3kuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0cmF0ZWdpZXMvbWFrZVN0YXRlU3RyYXRlZ3kuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3V0aWwvaXNXaW5kb3cuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3V0aWwvZWxlbWVudERhdGEuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3V0aWwvaXNPYmplY3RMaXRlcmFsLmpzIiwid2VicGFjazovLy8uL34vZXh0ZW5kL2luZGV4LmpzIiwid2VicGFjazovLy8uL34vdGhyb3R0bGVpdC9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L2RvbS1ldmVudC9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L3VpZC9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L3V0aWwtZWFjaC9lYWNoLmpzIiwid2VicGFjazovLy8uL2Jvd2VyX2NvbXBvbmVudHMvcG9zaXRpb24vaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPO0FDVkE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSx3Qzs7Ozs7OztBQ3RDQTtBQUNBLENBQUM7QUFDRDs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxLQUFLO0FBQ2hCLFdBQVcsUUFBUTtBQUNuQjtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsS0FBSztBQUNoQixXQUFXLFFBQVE7QUFDbkI7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLEtBQUs7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWEsS0FBSztBQUNsQixhQUFhLFNBQVM7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBLGFBQWEsS0FBSztBQUNsQixhQUFhLFNBQVM7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWEsU0FBUztBQUN0QixhQUFhLE9BQU87QUFDcEI7QUFDQSxjQUFjLFNBQVM7QUFDdkI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLEtBQUs7QUFDaEIsV0FBVyxPQUFPO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsT0FBTztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUEsNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE9BQU87QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLCtCQUErQjtBQUMvQjtBQUNBO0FBQ0EsR0FBRzs7QUFFSCw0QkFBNEI7QUFDNUI7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUTtBQUNSO0FBQ0E7QUFDQSxxQkFBcUIsd0JBQXdCO0FBQzdDO0FBQ0E7QUFDQTtBQUNBLFFBQVE7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLGNBQWM7QUFDekIsV0FBVyxPQUFPO0FBQ2xCLFdBQVcsU0FBUztBQUNwQixXQUFXLE1BQU07QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxjQUFjO0FBQ3pCLFdBQVcsT0FBTztBQUNsQixXQUFXLFNBQVM7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxHQUFHOztBQUVIO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsT0FBTztBQUNsQixXQUFXLE9BQU87QUFDbEI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7O0FBRUg7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxLQUFLO0FBQ2hCO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBLEdBQUc7QUFDSDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsT0FBTztBQUNsQjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLEtBQUs7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsT0FBTztBQUNsQixXQUFXLFFBQVE7QUFDbkI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLENBQUMsSUFBSTs7Ozs7OztBQzdtQkw7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOzs7Ozs7O0FDL0JBLENBQUM7QUFDRDs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCLFdBQVcsU0FBUztBQUNwQixXQUFXLE1BQU07QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsT0FBTztBQUNsQixXQUFXLFNBQVM7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7O0FBRUwsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPOztBQUVQO0FBQ0E7QUFDQSxnQ0FBZ0M7QUFDaEM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCLFdBQVcsTUFBTTtBQUNqQjtBQUNBO0FBQ0EsdUJBQXVCO0FBQ3ZCO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxzQkFBc0I7QUFDdEI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsT0FBTztBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7O0FBRUEsQ0FBQyxJQUFJOzs7Ozs7O0FDN09MO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7Ozs7Ozs7QUNSQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7OztBQ2RBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O0FDbkJBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7O0FBRUE7Ozs7Ozs7QUMzQkE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7OztBQ3BCQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxPQUFPO0FBQ1A7QUFDQSxPQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7Ozs7OztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQztBQUN0Qzs7Ozs7Ozs7QUNMQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7QUNIQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTs7QUFFQSxPQUFPLFlBQVk7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7Ozs7Ozs7OztBQzlFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFNBQVM7QUFDcEIsV0FBVyxPQUFPO0FBQ2xCLFlBQVksU0FBUztBQUNyQjtBQUNBOztBQUVBO0FBQ0EsVUFBVTtBQUNWLGVBQWU7QUFDZjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQzdCQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7QUNaQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCLFlBQVksT0FBTztBQUNuQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQ2hCQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE9BQU87QUFDbEIsV0FBVyxTQUFTO0FBQ3BCLFdBQVcsRUFBRTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLGdCQUFnQjtBQUNuQztBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQ3hCQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxPQUFPO0FBQ2xCLFdBQVcsT0FBTztBQUNsQjtBQUNBLFlBQVk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE9BQU87QUFDbEI7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFFBQVE7QUFDbkI7QUFDQSxZQUFZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZOztBQUVaO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsQyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wiU2Nyb2xsaW1hdG9yXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcIlNjcm9sbGltYXRvclwiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIFxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvblxuICoqLyIsIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIDNkZDA4NmM2MjIxNTkxNDQ2M2RkXG4gKiovIiwiLyogZ2xvYmFscyBOb2RlLCBOb2RlTGlzdCwgSFRNTENvbGxlY3Rpb24gKi9cbjsoZnVuY3Rpb24oKXtcblwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjcm9sbGltYXRvcjtcblxuLy8gRXh0ZXJuYWwgZGVwZW5kZW5jaWVzXG52YXIgdWlkID0gcmVxdWlyZShcInVpZFwiKSxcbiAgZXh0ZW5kID0gcmVxdWlyZShcImV4dGVuZFwiKSxcbiAgZWFjaCA9IHJlcXVpcmUoXCJ1dGlsLWVhY2hcIiksXG4gIHRocm90dGxlID0gcmVxdWlyZShcInRocm90dGxlaXRcIiksXG4gIGRvbUV2ZW50ID0gcmVxdWlyZShcImRvbS1ldmVudFwiKSxcbiAgaXNXaW5kb3cgPSByZXF1aXJlKFwic3JjL3V0aWwvaXNXaW5kb3dcIiksXG4gIGVsZW1lbnREYXRhID0gcmVxdWlyZShcInNyYy91dGlsL2VsZW1lbnREYXRhXCIpLFxuICBpc09iamVjdExpdGVyYWwgPSByZXF1aXJlKFwic3JjL3V0aWwvaXNPYmplY3RMaXRlcmFsXCIpO1xuXG4vLyBJbnRlcm5hbCBkZXBlbmRlbmNpZXNcbnZhciBjb25zdGFudHMgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIiksXG4gIGJvdW5kaW5nQm94U3RyYXRlZ3kgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL2JvdW5kaW5nQm94U3RyYXRlZ3lcIiksXG4gIG1ha2VSZWxhdGl2ZVBvc2l0aW9uU3RyYXRlZ3kgPVxuICAgIHJlcXVpcmUoXCIuL3N0cmF0ZWdpZXMvbWFrZVJlbGF0aXZlUG9zaXRpb25TdHJhdGVneVwiKSxcbiAgbWFrZUVuZHBvaW50UHJvZ3Jlc3NTdHJhdGVneSA9XG4gICAgcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9tYWtlRW5kcG9pbnRQcm9ncmVzc1N0cmF0ZWd5XCIpLFxuICBtYWtlQ29udGFpbmVkUHJvZ3Jlc3NTdHJhdGVneSA9XG4gICAgcmVxdWlyZShcIi4vc3RyYXRlZ2llcy9tYWtlQ29udGFpbmVkUHJvZ3Jlc3NTdHJhdGVneVwiKSxcbiAgbWFrZVZpc2libGVQcm9ncmVzc1N0cmF0ZWd5ID1cbiAgICByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL21ha2VWaXNpYmxlUHJvZ3Jlc3NTdHJhdGVneVwiKSxcbiAgbWFrZVN0YXRlU3RyYXRlZ3kgPSByZXF1aXJlKFwiLi9zdHJhdGVnaWVzL21ha2VTdGF0ZVN0cmF0ZWd5XCIpLFxuICBXYXRjaGFibGUgPSByZXF1aXJlKFwiLi9XYXRjaGFibGVcIik7XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIGdpdmVuIGVsIGlzIGEgdmFsaWQgc2Nyb2xsaW1hdG9yIGVsLlxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gZWxcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gc2hvdWxkVGhyb3cgLSB3aGV0aGVyIG9yIG5vdCB0byB0aHJvdyBpZiBpdCBpcyBpbnZhbGlkLlxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlU2Nyb2xsaW1hdG9yRWwoZWwsIHNob3VsZFRocm93KSB7XG4gIHZhciBpc1ZhbGlkID0gZWwgaW5zdGFuY2VvZiBOb2RlIHx8IGlzV2luZG93KGVsKTtcbiAgaWYoIWlzVmFsaWQgJiYgc2hvdWxkVGhyb3cpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJgZWxgIG11c3QgYmUgb2YgdHlwZSBgTm9kZWAgb3IgYFdpbmRvd2BcIik7XG4gIH1cbiAgcmV0dXJuIGlzVmFsaWQ7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIGdpdmVuIGVsIGlzIGEgdmFsaWQgdGFyZ2V0IGVsLlxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gZWxcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gc2hvdWxkVGhyb3cgLSB3aGV0aGVyIG9yIG5vdCB0byB0aHJvdyBpZiBpdCBpcyBpbnZhbGlkLlxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlVGFyZ2V0RWwoZWwsIHNob3VsZFRocm93KSB7XG4gIHZhciBpc1ZhbGlkID0gZWwgaW5zdGFuY2VvZiBOb2RlO1xuICBpZighaXNWYWxpZCAmJiBzaG91bGRUaHJvdykge1xuICAgIHRocm93IG5ldyBFcnJvcihcImBlbGAgbXVzdCBiZSBhbiBpbnN0YW5jZSBvZiBgTm9kZWBcIik7XG4gIH1cbiAgcmV0dXJuIGlzVmFsaWQ7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgU2Nyb2xsaW1hdG9yIHVpZCBvZiB0aGUgZ2l2ZW4gZWxlbWVudCBvciBudWxsIGlmIHRoZXJlIGlzIG5vbmUuXG4gKlxuICogQHBhcmFtIHtOb2RlfSBlbFxuICovXG5TY3JvbGxpbWF0b3IuZ2V0U2Nyb2xsaW1hdG9ySWQgPSBmdW5jdGlvbihlbCkge1xuICB2YWxpZGF0ZVNjcm9sbGltYXRvckVsKGVsLCB0cnVlKTtcbiAgdmFyIGtleSA9IGNvbnN0YW50cy5EQVRBX1BSRUZJWCArIGNvbnN0YW50cy5LRVlfU0NST0xMSU1BVE9SX0lEO1xuICByZXR1cm4gZWxlbWVudERhdGEoZWwsIGtleSk7XG59O1xuXG4vKipcbiAqIERlZmF1bHQgc2V0dGluZ3NcbiAqL1xuU2Nyb2xsaW1hdG9yLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogQW4gYWRhcHRvciBmdW5jdGlvbiB0aGF0IGJpbmRzIHRoZSBnaXZlbiBgY2FsbGJhY2tgIGZyb20gdGhlXG4gICAqIHNjcm9sbCBldmVudCBkaXNwYXRjaGVyIGFzc29jaWF0ZWQgd2l0aCB0aGUgZ2l2ZW4gYGVsYC5cbiAgICogUmVwbGFjZSB0aGlzIGlmIHlvdSBhcmUgdXNpbmcgY3ViaXEvaVNjcm9sbCBvciBzaW1pbGFyLlxuICAgKlxuICAgKiBAcGFyYW0ge05vZGV9IGVsXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAqL1xuICBiaW5kVXBkYXRlOiBmdW5jdGlvbihlbCwgY2FsbGJhY2spIHtcbiAgICBkb21FdmVudC5vbihlbCwgXCJzY3JvbGxcIiwgY2FsbGJhY2spO1xuICAgIGRvbUV2ZW50Lm9uKHdpbmRvdywgXCJyZXNpemVcIiwgY2FsbGJhY2spO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDb21wbGVtZW50IHRvIGBiaW5kU2Nyb2xsYC5cbiAgICpcbiAgICogQHBhcmFtIHtOb2RlfSBlbFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICAgKi9cbiAgdW5iaW5kVXBkYXRlOiBmdW5jdGlvbihlbCwgY2FsbGJhY2spIHtcbiAgICBkb21FdmVudC5vZmYoZWwsIFwic2Nyb2xsXCIsIGNhbGxiYWNrKTtcbiAgICBkb21FdmVudC5vZmYod2luZG93LCBcInJlc2l6ZVwiLCBjYWxsYmFjayk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFRocm90dGxpbmcgZnVuY3Rpb24gdXNlZCBpbnRlcm5hbGx5IGZvciBzY3JvbGwuXG4gICAqIFJlcGxhY2UgYXMgbmVjZXNzYXJ5IG9yIHVzZSB5b3Vyc2VsZiBmb3IgYWR2YW5jZWQgdXNhZ2UuXG4gICAqXG4gICAqIE5vdGU6IE1haW50YWlucyB0aGUgY2FsbGluZyBjb250ZXh0IGZvciB0aHJvdHRsZWQgY2FsbGJhY2suXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkZWxheU1zXG4gICAqXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0aHJvdHRsZWQgY2FsbGJhY2tcbiAgICovXG4gIHRocm90dGxlOiB0aHJvdHRsZSxcblxuICAvKipcbiAgICogTWluaW11bSBkZWxheSBlbmZvcmNlZCBiZXR3ZWVuIGNhbGxzIHRvIHNjcm9sbCB1cGRhdGUgZnVuY3Rpb24uXG4gICAqIERlZmF1bHQ6IFRyeSB0byBoaXQgb25jZSBwZXIgZnJhbWUgYXQgNjBmcHNcbiAgICovXG4gIHRocm90dGxlRGVsYXlNczogTWF0aC5mbG9vcigxMDAwLzYwKSxcblxuICAvKipcbiAgICogQ2FsbGJhY2tzIHRoYXQgYXJlIGNhbGxlZCBkdXJpbmcgYW4gdXBkYXRlIHRvIG1vZGlmeSBwcm9wZXJ0aWVzXG4gICAqIG9uIHRoZSBpbnRlcm5hbCBzY3JvbGxpbWF0b3IgbW9kZWwuXG4gICAqL1xuICBzY3JvbGxpbWF0b3JVcGRhdGVTdHJhdGVnaWVzOiBbYm91bmRpbmdCb3hTdHJhdGVneV0sXG5cbiAgLyoqXG4gICAqIENhbGxiYWNrcyB0aGF0IGFyZSBjYWxsZWQgZHVyaW5nIGFuIHVwZGF0ZSB0byBtb2RpZnkgcHJvcGVydGllc1xuICAgKiBvbiBhbiBpbnRlcm5hbCB0YXJnZXQgbW9kZWwuXG4gICAqL1xuICB0YXJnZXRVcGRhdGVTdHJhdGVnaWVzOiBbXG4gICAgYm91bmRpbmdCb3hTdHJhdGVneSxcblxuICAgIG1ha2VSZWxhdGl2ZVBvc2l0aW9uU3RyYXRlZ3koXCJ2ZXJ0aWNhbFwiKSxcbiAgICBtYWtlUmVsYXRpdmVQb3NpdGlvblN0cmF0ZWd5KFwiaG9yaXpvbnRhbFwiKSxcblxuICAgIG1ha2VFbmRwb2ludFByb2dyZXNzU3RyYXRlZ3koXCJ2ZXJ0aWNhbFwiKSxcbiAgICBtYWtlVmlzaWJsZVByb2dyZXNzU3RyYXRlZ3koXCJ2ZXJ0aWNhbFwiKSxcbiAgICBtYWtlQ29udGFpbmVkUHJvZ3Jlc3NTdHJhdGVneShcInZlcnRpY2FsXCIpLFxuICAgIG1ha2VTdGF0ZVN0cmF0ZWd5KFwidmVydGljYWxcIiksXG5cbiAgICBtYWtlRW5kcG9pbnRQcm9ncmVzc1N0cmF0ZWd5KFwiaG9yaXpvbnRhbFwiKSxcbiAgICBtYWtlVmlzaWJsZVByb2dyZXNzU3RyYXRlZ3koXCJob3Jpem9udGFsXCIpLFxuICAgIG1ha2VDb250YWluZWRQcm9ncmVzc1N0cmF0ZWd5KFwiaG9yaXpvbnRhbFwiKSxcbiAgICBtYWtlU3RhdGVTdHJhdGVneShcImhvcml6b250YWxcIilcbiAgXSxcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIFNjcm9sbGltYXRvciBpbnN0YW5jZS5cbiAqXG4gKiBJTVBPUlRBTlQ6IEJlIHN1cmUgdG8gY2FsbCAjZGVzdHJveSB3aGVuIHlvdSBhcmUgZG9uZSB3aXRoIHRoaXMgU2Nyb2xsaW1hdG9yLlxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gZWwgLSB0aGUgc2Nyb2xsaW5nIHNjcm9sbGltYXRvciBlbGVtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIG1hcCBvZiBvcHRpb25zLiBTZWUgI2RlZmF1bHRzIGZvciBkb2N1bWVudGF0aW9uLlxuICovXG5mdW5jdGlvbiBTY3JvbGxpbWF0b3IoZWwsIG9wdGlvbnMpIHtcbiAgdmFsaWRhdGVTY3JvbGxpbWF0b3JFbChlbCwgdHJ1ZSk7XG4gIC8vY29uc29sZS5sb2coXCJJTklUSUFMSVpJTkdcIik7XG4gIHRoaXMuX3Jlc2V0VWlkKCk7XG4gIHRoaXMuX3NldEVsKGVsKTtcbiAgdGhpcy5yZXNldChvcHRpb25zKTtcbiAgdGhpcy5faXNJbml0aWFsaXplZCA9IHRydWU7XG4gIC8vY29uc29sZS5sb2coXCJET05FIElOSVRJQUxJWklOR1wiKTs7XG59XG5cbi8qKlxuICogUmVzZXRzIHRoZSBpbnN0YW5jZSB0byBhIGNsZWFuIHN0YXRlLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gbWFwIG9mIG9wdGlvbnMuIFNlZSAjZGVmYXVsdHMgZm9yIGRvY3VtZW50YXRpb24uXG4gKi9cblNjcm9sbGltYXRvci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIGlmKHR5cGVvZiBvcHRpb25zID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgb3B0aW9ucyA9IHt9O1xuICB9IGVsc2UgaWYoIWlzT2JqZWN0TGl0ZXJhbChvcHRpb25zKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIm9wdGlvbnMgbXVzdCBiZSBhbiBvYmplY3QgbGl0ZXJhbC5cIik7XG4gIH1cblxuICBpZiggdGhpcy5faXNJbml0aWFsaXplZCApIHtcbiAgICB0aGlzLnVud2F0Y2hBbGwoKTtcbiAgICAvLyBVbmJpbmQgYW55IHN0cmFnZ2xlcnNcbiAgICBlYWNoKHRoaXMuX2JvdW5kRmxhZ3MsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICB0aGlzLl9zZXRCaW5kaW5nKGtleSwgZmFsc2UpO1xuICAgIH0sIHRoaXMpO1xuICB9XG5cbiAgdGhpcy5fc2V0dGluZ3MgPSBleHRlbmQoe30sIFNjcm9sbGltYXRvci5kZWZhdWx0cyk7XG4gIHRoaXMuX2JvdW5kRmxhZ3MgPSB7fTtcbiAgdGhpcy5fdGFyZ2V0TWFwID0ge307XG4gIHRoaXMuX3NldE51bVRhcmdldHMoMCk7XG5cbiAgdGhpcy5jb25maWd1cmUob3B0aW9ucyk7XG59O1xuXG5cbi8qKlxuICogQWRqdXN0cyBzZXR0aW5ncyBvbi10aGUtZmx5LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gbWFwIG9mIG9wdGlvbnMuIFNlZSAjZGVmYXVsdHMgZm9yIGRvY3VtZW50YXRpb24uXG4gKi9cblNjcm9sbGltYXRvci5wcm90b3R5cGUuY29uZmlndXJlID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICBpZih0eXBlb2Ygb3B0aW9ucyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIm9wdGlvbnMgYXJlIHJlcXVpcmVkXCIpO1xuICB9XG5cbiAgLy8gVW5iaW5kIHVwZGF0ZSBiaW5kaW5nc1xuICB2YXIgb2xkQm91bmRGbGFncyA9IGV4dGVuZCh7fSwgdGhpcy5fYm91bmRGbGFncyk7XG4gIGVhY2gob2xkQm91bmRGbGFncywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgIHRoaXMuX3NldEJpbmRpbmcoa2V5LCBmYWxzZSk7XG4gIH0sIHRoaXMpO1xuXG4gIHRoaXMuX3NldHRpbmdzID0gZXh0ZW5kKHt9LCB0aGlzLl9zZXR0aW5ncywgb3B0aW9ucyk7XG4gIHRoaXMuX3Jlc2V0VGhyb3R0bGVzKCk7XG5cbiAgLy8gUmVzdG9yZSBiaW5kaW5nc1xuICBlYWNoKG9sZEJvdW5kRmxhZ3MsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICB0aGlzLl9zZXRCaW5kaW5nKGtleSwgdmFsdWUpO1xuICB9LCB0aGlzKTtcbn07XG5cbi8qKlxuICogVW5iaW5kcyBsaXN0ZW5lcnMgYW5kIGNsZWFucyB1cC5cbiAqXG4gKiBJbXBvcnRhbnQ6IFlvdSBNVVNUIGNhbGwgdGhpcyBhdCB0ZWFyZG93biB0byBwcmV2ZW50IG1lbW9yeSBsZWFrcy5cbiAqL1xuU2Nyb2xsaW1hdG9yLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gIC8vY29uc29sZS5sb2coXCJERVNUUk9ZSU5HXCIpO1xuICB0aGlzLnJlc2V0KCk7XG4gIHRoaXMuX3NldEVsKG51bGwpO1xuICAvL2NvbnNvbGUubG9nKFwiRE9ORSBERVNUUk9ZSU5HXCIpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB1bmlxdWUgaWQgb2YgdGhpcyBpbnN0YW5jZS5cbiAqIE1vc3RseSBmb3IgZGVidWdnaW5nIHB1cnBvc2VzLlxuICpcbiAqIFRoZSBpZCBpcyBwbGFjZWQgb24gdGhlIGVsJ3NcbiAqIGBjb25zdGFudHMuREFUQV9QUkVGSVggKyBjb25zdGFudHMuS0VZX1NDUk9MTElNQVRPUl9fSURgIGF0dHJpYnV0ZVxuICogd2hpbGUgdGhlIGluc3RhbmNlIGlzIGFjdGl2ZS5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblNjcm9sbGltYXRvci5wcm90b3R5cGUuZ2V0SWQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuX3VpZDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIGVsZW1lbnRzIGN1cnJlbnRseSB3YXRjaGVkLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqL1xuU2Nyb2xsaW1hdG9yLnByb3RvdHlwZS5udW1XYXRjaGVkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9udW1UYXJnZXRzO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBjYWxsYmFjayB0byBiZSBub3RpZmllZCBvZiBjaGFuZ2VzIHRvIHRoZSBnaXZlbiBwcm9wZXJ0eVxuICogb24gdGhlIGdpdmVuIGVsIG9yIGVscy5cbiAqIElmIGEgTm9kZUxpc3QgaXMgZ2l2ZW4sIHdhdGNoIHdpbGwgYmUgY2FsbGVkIHJlY3Vyc2l2ZWx5IGZvciBlYWNoIG5vZGUuXG4gKiBJZiBubyBwcm9wZXJ0eSBpcyBnaXZlbiwgdGhlIGNhbGxiYWNrIHdpbGwgYmUgbm90aWZpZWQgb2YgY2hhbmdlcyB0b1xuICogYWxsIHByb3BlcnRpZXMuXG4gKiBJZiBubyBjb250ZXh0IGlzIGdpdmVuLCBjYWxsYmFja3MgYXJlIGNhbGxlZCBpbiB0aGUgZWxlbWVudCdzIGNvbnRleHQuXG4gKlxuICogTGlzdGVuZXJzIG9uIHRoZSBcImFsbFwiIHByb3BlcnR5IGtleSB3aWxsIHJlY2VpdmUgYmF0Y2hlZCBjYWxsc1xuICogKCBvbmUgZm9yIGVhY2ggdXBkYXRlICkuXG4gKlxuICogRXhhbXBsZXM6XG4gKiBgYGBqYXZhc2NyaXB0XG4gKiAgICAgbXlTY3JvbGxpbWF0b3Iud2F0Y2gobXlOb2RlLCBcInRvcFwiLCBmdW5jdGlvbihwcm9wZXJ0eSwgdmFsdWUpIHtcbiAqICAgICAgIGNvbnNvbGUubG9nKHByb3BlcnR5ICsgXCIgaXMgbm93IFwiICsgdmFsdWUpO1xuICogICAgIH0pO1xuICpcbiAqICAgICBteVNjcm9sbGltYXRvci53YXRjaChteU5vZGUsIFwiYWxsXCIsIGZ1bmN0aW9uKGNoYW5nZWRLZXlzLCBwcm9wZXJ0eU1hcCkge1xuICogICAgICAgZm9yKHZhciBpPTA7IGkgPCBjaGFuZ2VkS2V5cy5sZW5ndGg7IGkrKykge1xuICogICAgICAgICB2YXIga2V5ID0gY2hhbmdlZEtleXNbaV07XG4gKiAgICAgICAgIGNvbnNvbGUubG9nKGtleSArIFwiIGlzIG5vdyBcIiArIHByb3BlcnR5TWFwWyBrZXkgXSk7XG4gKiAgICAgICB9XG4gKiAgICAgfSk7XG4gKiAgYGBgXG4gKlxuICogRm9yIG9wdGltYWwgcGVyZm9ybWFuY2UsIHlvdSBzaG91bGQgdXNlIGNhbGxiYWNrcyBvbmx5IHRvIGNvbnN1bWUgdGhlXG4gKiBuZXcgcHJvcGVydHkgdmFsdWVzLiBET00gdXBkYXRlcyBzaG91bGQgYmUgcGVyZm9ybWVkIGluXG4gKiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgY2FsbGJhY2tzLiBZb3UgY2FuIHVzZSBhbiBpc0RpcnR5IGZsYWcgZm9yIHRoaXMuXG4gKlxuICogVG8gcmVtb3ZlIGEgc3BlY2lmaWMgbGlzdGVuZXIsIHVzZSAjdW53YXRjaFxuICogVG8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMsIHVzZSAjdW53YXRjaEFsbCwgI3Jlc2V0LCBvciAjZGVzdHJveVxuICpcbiAqIEBwYXJhbSB7Tm9kZXxOb2RlTGlzdH0gZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEBwYXJhbSB7TWl4ZWR9IGNvbnRleHRcbiAqL1xuU2Nyb2xsaW1hdG9yLnByb3RvdHlwZS53YXRjaCA9IGZ1bmN0aW9uKGVsLCBwcm9wZXJ0eSwgY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgaWYoZWwgaW5zdGFuY2VvZiBOb2RlTGlzdCB8fCBlbCBpbnN0YW5jZW9mIEhUTUxDb2xsZWN0aW9uKSB7XG4gICAgLy8gQ2FsbCByZWN1cnNpdmVseSBmb3IgZWFjaCBub2RlXG4gICAgZWFjaChlbCwgZnVuY3Rpb24obm9kZSwgaSkge1xuICAgICAgdGhpcy53YXRjaChub2RlLCBwcm9wZXJ0eSwgY2FsbGJhY2ssIGNvbnRleHQpO1xuICAgIH0sIHRoaXMpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhbGlkYXRlVGFyZ2V0RWwoZWwsIHRydWUpO1xuICBpZih0eXBlb2YgY29udGV4dCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIGNvbnRleHQgPSBlbDtcbiAgfVxuICB2YXIgdGFyZ2V0ID0gdGhpcy5fY3JlYXRlVGFyZ2V0T25jZShlbCk7XG4gIHRhcmdldC53YXRjaGFibGUud2F0Y2gocHJvcGVydHksIGNhbGxiYWNrLCBjb250ZXh0KTtcbn07XG5cbi8qKlxuICogUmVtb3ZlIGhhbmRsZXJzIG1hdGNoaW5nIHRoZSBnaXZlbiBgZWxgLCBgcHJvcGVydHlgLCBgY2FsbGJhY2tgIGNvbWJpbmF0aW9uLlxuICogSWYgYSBOb2RlTGlzdCBpcyBnaXZlbiwgdW53YXRjaCB3aWxsIGJlIGNhbGxlZCByZWN1cnNpdmVseSBmb3IgZWFjaCBub2RlLlxuICpcbiAqIFRvIHJlbW92ZSBhbGwgcmVnaXN0ZXJlZCBsaXN0ZW5lcnMsIHVzZSAjdW53YXRjaEFsbCwgI3Jlc2V0LCBvciAjZGVzdHJveVxuICpcbiAqIEBwYXJhbSB7Tm9kZXxOb2RlTGlzdH0gZWxcbiAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqL1xuU2Nyb2xsaW1hdG9yLnByb3RvdHlwZS51bndhdGNoID0gZnVuY3Rpb24oZWwsIHByb3BlcnR5LCBjYWxsYmFjaykge1xuICAvLyBUT0RPIHRoaXMgZnVuY3Rpb24gd2lsbCBiZSBkaWZmaWN1bHQgZm9yIFY4IHRvIG9wdGltaXplLiBXb3J0aCBmaXhpbmc/XG4gIGlmKHR5cGVvZiBlbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBlbCBpbnN0YW5jZW9mIE5vZGVMaXN0KSB7XG4gICAgLy8gQ2FsbCByZWN1cnNpdmVseSBmb3IgZWFjaCBub2RlXG4gICAgZWFjaChlbCwgZnVuY3Rpb24obm9kZSwgaSkge1xuICAgICAgdGhpcy51bndhdGNoKG5vZGUsIHByb3BlcnR5LCBjYWxsYmFjayk7XG4gICAgfSwgdGhpcyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYodHlwZW9mIHByb3BlcnR5ID09PSBcImZ1bmN0aW9uXCIgJiYgYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgIGNhbGxiYWNrID0gcHJvcGVydHk7XG4gICAgcHJvcGVydHkgPSB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBBbGxvdyBlbCB0byBiZSBvbWl0dGVkLFxuICAvLyBidXQgZG9uJ3QgYWxsb3cgY2xpZW50IHRvIHBhc3Mgd3JvbmcgdHlwZXMgYXMgZWwuXG4gIC8vIHdlIGNhbiBkbyB0aGlzIHdpdGggY2FyZWZ1bCBhcmd1bWVudHMgbGVuZ3RoIGNoZWNraW5nLlxuICBpZiggdHlwZW9mIGVsID09PSBcInN0cmluZ1wiICYmIGFyZ3VtZW50cy5sZW5ndGggPD0yICkge1xuICAgIHByb3BlcnR5ID0gZWw7XG4gICAgZWwgPSB1bmRlZmluZWQ7XG4gIH0gZWxzZSBpZih0eXBlb2YgZWwgPT09IFwiZnVuY3Rpb25cIiAmJiBhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgY2FsbGJhY2sgPSBlbDtcbiAgICBlbCA9IHVuZGVmaW5lZDtcbiAgICBwcm9wZXJ0eSA9IHVuZGVmaW5lZDtcbiAgfSBlbHNlIGlmKHR5cGVvZiBlbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiAhKGVsIGluc3RhbmNlb2YgTm9kZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiZWwgbXVzdCBiZSBhbiBpbnN0YW5jZSBvZiBgTm9kZWAgb3IgYE5vZGVMaXN0YCBvciBiZSBvbWl0dHRlZC5cIik7XG4gIH1cblxuICAvLyBUaHJvdyBpZiBhbGwgYXJndW1lbnRzIGFyZSB1bmRlZmluZWRcbiAgaWYodHlwZW9mIGVsID09PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICB0eXBlb2YgcHJvcGVydHkgPT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgIHR5cGVvZiBjYWxsYmFjayA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJgdW53YXRjaGAgcmVxdWlyZXMgYW4gYGVsYCBhbmQvb3IgYHByb3BlcnR5YCBhbmQvb3IgYGNhbGxiYWNrYC5cIiArXG4gICAgICAgIFwiUGVyaGFwcyB5b3UgbWVhbnQgdG8gdXNlIGB1bndhdGNoQWxsYD9cIik7XG4gIH1cblxuICBpZih0eXBlb2YgZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAvLyBVbndhdGNoIGNvbWJvIG9uIGdpdmVuIGVsXG4gICAgdmFyIHRhcmdldElkID0gdGhpcy5fZ2V0VGFyZ2V0SWQoZWwpO1xuICAgIGlmKCB0eXBlb2YgdGFyZ2V0SWQgPT09IFwic3RyaW5nXCIgKSB7XG4gICAgICB0aGlzLl91bndhdGNoQnlJZCh0YXJnZXRJZCwgcHJvcGVydHksIGNhbGxiYWNrKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gVW53YXRjaCBjb21ibyBvbiBhbGwgZWxzXG4gICAgZWFjaCh0aGlzLl90YXJnZXRNYXAsIGZ1bmN0aW9uKHRhcmdldCwgdGFyZ2V0SWQpIHtcbiAgICAgIHRoaXMuX3Vud2F0Y2hCeUlkKHRhcmdldElkLCBwcm9wZXJ0eSwgY2FsbGJhY2spO1xuICAgIH0sIHRoaXMpO1xuICB9XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgcmVnaXN0ZXJlZCBjYWxsYmFja3MgZm9yIGFsbCB3YXRjaGVkIGVsZW1lbnRzLlxuICpcbiAqIEl0J3Mgbm90IG5lY2Vzc2FyeSB0byBjYWxsIHRoaXMgYmVmb3JlICNyZXNldCBvciAjZGVzdHJveS5cbiAqL1xuU2Nyb2xsaW1hdG9yLnByb3RvdHlwZS51bndhdGNoQWxsID0gZnVuY3Rpb24oKSB7XG4gIGVhY2godGhpcy5fdGFyZ2V0TWFwLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgdGhpcy5fdW53YXRjaEJ5SWQoa2V5KTtcbiAgfSwgdGhpcyk7XG59O1xuXG4vKipcbiAqIFNjcm9sbCB1cGRhdGUgaGFuZGxlci5cbiAqIFBvd2VycyB0aGUgY29yZSBldmVudCBsb29wLlxuICpcbiAqIEJ5IGRlZmF1bHQsIGEgdGhyb3R0bGVkIHZlcnNpb24gb2YgdGhpcyBmdW5jdGlvbiBpcyBhdXRvbWF0aWNhbGx5XG4gKiBib3VuZCB0byB0aGUgc2Nyb2xsaW1hdG9yJ3Mgc2Nyb2xsIGhhbmRsZXIgYW5kIHJlc2l6ZSBoYW5kbGVyXG4gKiBieSB0aGUgYGJpbmRTY3JvbGxgIGFuZCBgYmluZFJlc2l6ZWAgZnVuY3Rpb25zIGdpdmVuIGluIHRoZSBgb3B0aW9uc2AgbWFwLlxuICpcbiAqIENhbGwgdGhpcyBtYW51YWxseSB3aGVuXG4gKiAgKiB0aGUgc2Nyb2xsaW1hdG9yIGlzIG1hbnVhbGx5IHJlc2l6ZWQgb3IgcmVwb3NpdGlvbmVkXG4gKiAgKiBhbnkgb2YgdGhlIHNjcm9sbGltYXRvcidzIGNoaWxkcmVuIGFyZSByZXNpemVkIG9yIHJlcG9zaXRpb25lZFxuICogICogdGhlIHNjcm9sbGltYXRvcidzIERPTSBzdWJ0cmVlIGlzIGNoYW5nZWRcbiAqXG4gKiBZb3UgbWlnaHQgY29uc2lkZXIgdXNpbmcgYSBtdXRhdGlvbiBvYnNlcnZlciBwb2x5ZmlsbCB0byBjYWxsIHRoaXMuXG4gKiBCZSBzdXJlIHRvIHRocm90dGxlIHRoaXMgZnVuY3Rpb24gaWYgeW91IHBhc3MgaXQgdG8gYSBzY3JvbGwgaGFuZGxlci5cbiAqL1xuU2Nyb2xsaW1hdG9yLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNjcm9sbGltYXRvclByb3BzID0ge307XG5cbiAgLy8gRXhlY3R1dGUgc2Nyb2xsaW1hdG9yIHVwZGF0ZSBzdHJhdGVnaWVzXG4gIGVhY2godGhpcy5fc2V0dGluZ3Muc2Nyb2xsaW1hdG9yVXBkYXRlU3RyYXRlZ2llcywgZnVuY3Rpb24oc3RyYXRlZ3ksIGkpIHtcbiAgICBzdHJhdGVneSh0aGlzLl9lbCwgc2Nyb2xsaW1hdG9yUHJvcHMpO1xuICB9LCB0aGlzKTtcblxuICBlYWNoKHRoaXMuX3RhcmdldE1hcCwgZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgdGhpcy5fdXBkYXRlVGFyZ2V0KHRhcmdldCwgc2Nyb2xsaW1hdG9yUHJvcHMpO1xuICB9LCB0aGlzKTtcbn07XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBQUklWQVRFXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFVwZGF0ZXMgYSBzaW5nbGUgdGFyZ2V0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXQgLSBhIHRhcmdldCBtYXBwaW5nIChlbCBhbmQgbW9kZWwpXG4gKiBAcGFyYW0ge09iamVjdH0gc2Nyb2xsaW1hdG9yUG9zaXRpb24gLSBib3VuZGluZyBib3ggb2Ygc2Nyb2xsaW1hdG9yXG4gKi9cblNjcm9sbGltYXRvci5wcm90b3R5cGUuX3VwZGF0ZVRhcmdldCA9IGZ1bmN0aW9uKHRhcmdldCwgc2Nyb2xsaW1hdG9yUHJvcHMpIHtcbiAgdmFyIHRhcmdldFByb3BzID0ge307XG5cbiAgLy8gRXhlY3R1dGUgdGFyZ2V0IHVwZGF0ZSBzdHJhdGVnaWVzXG4gIGVhY2godGhpcy5fc2V0dGluZ3MudGFyZ2V0VXBkYXRlU3RyYXRlZ2llcywgZnVuY3Rpb24oc3RyYXRlZ3ksIGkpIHtcbiAgICBzdHJhdGVneSh0YXJnZXQuZWwsIHRhcmdldFByb3BzLCBzY3JvbGxpbWF0b3JQcm9wcyk7XG4gIH0sIHRoaXMpO1xuXG4gIC8vIFVwZGF0ZSBwcm9wZXJ0aWVzIGFuZCBjYWxsIGxpc3RlbmVyc1xuICB0YXJnZXQud2F0Y2hhYmxlLnNldCh0YXJnZXRQcm9wcyk7XG59O1xuXG4vKipcbiAqIFVud2F0Y2hlcyBhIHRhcmdldCBieSBpdCdzIHRhcmdldElkXG4gKi9cblNjcm9sbGltYXRvci5wcm90b3R5cGUuX3Vud2F0Y2hCeUlkID0gZnVuY3Rpb24odGFyZ2V0SWQsIHByb3BlcnR5LCBjYWxsYmFjaykge1xuICBpZiggdHlwZW9mIHByb3BlcnR5ID09PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiBjYWxsYmFjayA9PT0gXCJ1bmRlZmluZWRcIiApIHtcbiAgICB0aGlzLl9yZW1vdmVUYXJnZXQodGFyZ2V0SWQpO1xuICB9IGVsc2Uge1xuICAgIHZhciB0YXJnZXQgPSB0aGlzLl90YXJnZXRNYXBbdGFyZ2V0SWRdO1xuICAgIHRhcmdldC53YXRjaGFibGUudW53YXRjaChwcm9wZXJ0eSwgY2FsbGJhY2spO1xuXG4gICAgaWYoICF0YXJnZXQud2F0Y2hhYmxlLmlzV2F0Y2hlZCgpICkge1xuICAgICAgdGhpcy5fcmVtb3ZlVGFyZ2V0KHRhcmdldElkKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgdGFyZ2V0IGZvciB0aGUgZ2l2ZW4gYGVsYCwgY3JlYXRpbmcgYSBuZXcgb25lIGlmIG5lY2Vzc2FyeS5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IGVsXG4gKlxuICogQHJldHVybiB7VGFyZ2V0fVxuICovXG5TY3JvbGxpbWF0b3IucHJvdG90eXBlLl9jcmVhdGVUYXJnZXRPbmNlID0gZnVuY3Rpb24oZWwpIHtcbiAgdmFyIHRhcmdldElkID0gdGhpcy5fZ2V0VGFyZ2V0SWQoZWwpLFxuICAgICAgdGFyZ2V0O1xuICAvLyBJZiBub2RlIGlzIG5vdCBhbHJlYWR5IHdhdGNoZWQgYnkgdGhpcyBpbnN0YW5jZVxuICBpZih0eXBlb2YgdGFyZ2V0SWQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAvLyBDcmVhdGUgYSBuZXcgdGFyZ2V0XG4gICAgdmFyIHRhcmdldFdhdGNoYWJsZSA9IG5ldyBXYXRjaGFibGUoKTtcblxuICAgIC8vIFdlIG5lZWQgdG8gYXNzb2NpYXRlIERPTSBub2RlcyB3aXRoIHRoZWlyIHRhcmdldHMuXG4gICAgLy8gVG8gYXZvaWQgbWVtb3J5IGxlYWtzLCB3ZSBtdXN0IHVzZSBhbiBpbmRpcmVjdCByZWZlcmVuY2UuXG4gICAgLy8gVGh1cywgd2Ugc3RvcmUgYSB1aWQgYXMgYSBkYXRhIGF0dHJpYnV0ZSBvbiB0aGUgRE9NIG5vZGVcbiAgICB0YXJnZXRJZCA9IHRhcmdldFdhdGNoYWJsZS5nZXRJZCgpO1xuICAgIHRoaXMuX3NldFRhcmdldElkKGVsLCB0YXJnZXRJZCk7XG5cbiAgICB0YXJnZXQgPSB7XG4gICAgICBlbDogZWwsXG4gICAgICB3YXRjaGFibGU6IHRhcmdldFdhdGNoYWJsZVxuICAgIH07XG5cbiAgICAvLyBhbmQgdXNlIHRoaXMgdWlkIGFzIHRoZSBrZXkgaW4gb3VyIHRhcmdldCBtYXAuXG4gICAgdGhpcy5fdGFyZ2V0TWFwW3RhcmdldElkXSA9IHRhcmdldDtcblxuICAgIHRoaXMuX3NldE51bVRhcmdldHModGhpcy5fbnVtVGFyZ2V0cyArIDEpO1xuXG4gIH0gZWxzZSB7XG4gICAgdGFyZ2V0ID0gdGhpcy5fdGFyZ2V0TWFwW3RhcmdldElkXTtcbiAgfVxuXG4gIHJldHVybiB0YXJnZXQ7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIHRhcmdldCBpZCBvbiBhbiBlbC5cbiAqL1xuU2Nyb2xsaW1hdG9yLnByb3RvdHlwZS5fc2V0VGFyZ2V0SWQgPSBmdW5jdGlvbihlbCwgdGFyZ2V0SWQpIHtcbiAgZWxlbWVudERhdGEoZWwsIHRoaXMuX3RhcmdldElkS2V5LCB0YXJnZXRJZCk7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIHRhcmdldCBpZCBmcm9tIGFuIGVsLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuU2Nyb2xsaW1hdG9yLnByb3RvdHlwZS5fZ2V0VGFyZ2V0SWQgPSBmdW5jdGlvbihlbCkge1xuICB2YXIgdGFyZ2V0SWQgPSBlbGVtZW50RGF0YShlbCwgdGhpcy5fdGFyZ2V0SWRLZXkpO1xuICBpZiggIXRoaXMuX3RhcmdldE1hcC5oYXNPd25Qcm9wZXJ0eSh0YXJnZXRJZCkgKSB7XG4gICAgdGFyZ2V0SWQgPSBmYWxzZTtcbiAgfVxuICByZXR1cm4gdGFyZ2V0SWQ7XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgYW5kIGRlc3Ryb3lzIHRoZSB0YXJnZXQgYXQgdGhlIGdpdmVuIGlkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0YXJnZXRJZFxuICovXG5TY3JvbGxpbWF0b3IucHJvdG90eXBlLl9yZW1vdmVUYXJnZXQgPSBmdW5jdGlvbih0YXJnZXRJZCkge1xuICB2YXIgdGFyZ2V0ID0gdGhpcy5fdGFyZ2V0TWFwW3RhcmdldElkXTtcblxuICAvLyBSZW1vdmUgZGF0YSBwcm9wZXJ0eSBmcm9tIG5vZGVcbiAgdGhpcy5fc2V0VGFyZ2V0SWQodGFyZ2V0LmVsLCBudWxsKTtcblxuICB0YXJnZXQud2F0Y2hhYmxlLmRlc3Ryb3koKTtcbiAgZGVsZXRlIHRoaXMuX3RhcmdldE1hcFt0YXJnZXRJZF07XG5cbiAgdGhpcy5fc2V0TnVtVGFyZ2V0cyh0aGlzLl9udW1UYXJnZXRzIC0gMSk7XG59O1xuXG4vKipcbiAqIFNldCBudW1UYXJnZXRzIGFuZCBwZXJmb3JtIG5lY2Vzc2FyeSBvcGVyYXRpb25zLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB2YWx1ZSAtIHRoZSBuZXcgdmFsdWVcbiAqL1xuU2Nyb2xsaW1hdG9yLnByb3RvdHlwZS5fc2V0TnVtVGFyZ2V0cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHRoaXMuX251bVRhcmdldHMgPSB2YWx1ZTtcbiAgdmFyIGhhc1RhcmdldHMgPSB0aGlzLl9udW1UYXJnZXRzID4gMDtcbiAgdGhpcy5fc2V0QmluZGluZyhcInVwZGF0ZVwiLCBoYXNUYXJnZXRzKTtcbn07XG5cbi8qKlxuICogUmVwbGFjZXMgdGhpcyBpbnN0YW5jZSdzIGVsIGFuZCBjYWNoZXMgYXNzb2NpYXRlZCB2YWx1ZXMuXG4gKlxuICogQHBhcmFtIHtOb2RlfSBlbCAtIG5vZGUgdG8gc2V0IG9yIG51bGwgdG8gY2xlYW51cFxuICovXG5TY3JvbGxpbWF0b3IucHJvdG90eXBlLl9zZXRFbCA9IGZ1bmN0aW9uKGVsKSB7XG4gIGlmKGVsICE9PSB0aGlzLl9lbCkge1xuICAgIGlmKHRoaXMuX2VsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIFJlbW92ZSBpZCBmcm9tIG9sZCBlbFxuICAgICAgZWxlbWVudERhdGEodGhpcy5fZWwsIHRoaXMuX3Njcm9sbGltYXRvcklkS2V5LCBudWxsKTtcbiAgICB9XG5cbiAgICB0aGlzLl9lbCA9IGVsO1xuXG4gICAgaWYoZWwgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuX2lzV2luZG93ID0gaXNXaW5kb3coZWwpO1xuICAgICAgLy8gQWRkIGlkIHRvIG5ldyBlbFxuICAgICAgZWxlbWVudERhdGEodGhpcy5fZWwsIHRoaXMuX3Njcm9sbGltYXRvcklkS2V5LCB0aGlzLl91aWQpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiAoUmUpc2V0cyB0aGlzIGluc3RhbmNlJ3MgdWlkIGFuZCB1cGRhdGVzIGFzc29jaWF0ZWQgY2FjaGVkIHZhbHVlcy5cbiAqL1xuU2Nyb2xsaW1hdG9yLnByb3RvdHlwZS5fcmVzZXRVaWQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fdWlkID0gdWlkKGNvbnN0YW50cy5VSURfTEVOR1RIKTtcbiAgLy8gQ2FjaGUgY29uY2F0ZW5hdGlvbnNcbiAgdGhpcy5fc2Nyb2xsaW1hdG9ySWRLZXkgPVxuICAgIGNvbnN0YW50cy5EQVRBX1BSRUZJWCArIGNvbnN0YW50cy5LRVlfU0NST0xMSU1BVE9SX0lEO1xuICB0aGlzLl90YXJnZXRJZEtleSA9XG4gICAgY29uc3RhbnRzLkRBVEFfUFJFRklYICtcbiAgICB0aGlzLl91aWQgK1xuICAgIGNvbnN0YW50cy5LRVlfREVMSU1JVEVSICtcbiAgICBjb25zdGFudHMuS0VZX1RBUkdFVF9JRDtcbn07XG5cbi8qKlxuICogUmVzZXRzIGNhY2hlZCB0aHJvdHRsZWQgZnVuY3Rpb25zXG4gKi9cblNjcm9sbGltYXRvci5wcm90b3R5cGUuX3Jlc2V0VGhyb3R0bGVzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5fdGhyb3R0bGVkVXBkYXRlID1cbiAgICB0aGlzLl9zZXR0aW5ncy50aHJvdHRsZS5jYWxsKFxuICAgICAgICB0aGlzLFxuICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICBzZWxmLnVwZGF0ZS5hcHBseShzZWxmLCBhcmd1bWVudHMpO1xuICAgICAgICB9LFxuICAgICAgICB0aGlzLl9zZXR0aW5ncy50aHJvdHRsZURlbGF5TXMpO1xufTtcblxuLyoqXG4gKiBCaW5kcyBvciB1bmJpbmRzIHRoZSBjb3JyZWN0IGNhbGxiYWNrIGZ1bmN0aW9uIHRvIHRoZSBnaXZlbiBldmVudCB0eXBlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHNob3VsZEJpbmRcbiAqL1xuU2Nyb2xsaW1hdG9yLnByb3RvdHlwZS5fc2V0QmluZGluZyA9IGZ1bmN0aW9uKHR5cGUsIHNob3VsZEJpbmQpIHtcbiAgdmFyIGJpbmRlciwgdW5iaW5kZXIsIGNhbGxiYWNrO1xuXG4gIHZhciBoYXNGbGFnID0gdGhpcy5fYm91bmRGbGFncy5oYXNPd25Qcm9wZXJ0eSh0eXBlKTtcbiAgaWYoICghaGFzRmxhZyAmJiBzaG91bGRCaW5kKSB8fFxuICAgICAgKGhhc0ZsYWcgJiYgdGhpcy5fYm91bmRGbGFnc1t0eXBlXSAhPT0gc2hvdWxkQmluZCkgKVxuICB7XG5cbiAgICBpZih0eXBlID09PSBcInVwZGF0ZVwiKSB7XG4gICAgICBiaW5kZXIgPSB0aGlzLl9zZXR0aW5ncy5iaW5kVXBkYXRlO1xuICAgICAgdW5iaW5kZXIgPSB0aGlzLl9zZXR0aW5ncy51bmJpbmRVcGRhdGU7XG4gICAgICBjYWxsYmFjayA9IHRoaXMuX3Rocm90dGxlZFVwZGF0ZTtcbiAgICB9XG5cbiAgICAvLyBPbmx5IGJpbmQgaWYgd2UgY2FuIGJvdGggYmluZCBhbmQgdW5iaW5kXG4gICAgaWYoIHR5cGVvZiBiaW5kZXIgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgdW5iaW5kZXIgPT09IFwiZnVuY3Rpb25cIiApIHtcbiAgICAgIGlmKHNob3VsZEJpbmQpIHtcbiAgICAgICAgICBiaW5kZXIuY2FsbCh0aGlzLCB0aGlzLl9lbCwgY2FsbGJhY2spO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1bmJpbmRlci5jYWxsKHRoaXMsIHRoaXMuX2VsLCBjYWxsYmFjayk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgYmluZC91bmJpbmQgaXMgZGlzYWJsZWQsIHdlIHN0aWxsIGp1c3QgcHJldGVuZCB0aGUgYmluZGluZyB3b3JrZWQuXG4gICAgdGhpcy5fYm91bmRGbGFnc1t0eXBlXSA9IHNob3VsZEJpbmQ7XG4gIH1cbn07XG5cbn0pKCk7IC8vIEVuZCBtb2R1bGVcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvU2Nyb2xsaW1hdG9yLmpzXG4gKiogbW9kdWxlIGlkID0gMFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIGNvbnN0YW50cyA9IHtcbiAgVkVSVElDQUw6IFwidmVydGljYWxcIixcbiAgSE9SSVpPTlRBTDogXCJob3Jpem9udGFsXCIsXG4gIERBVEFfUFJFRklYIDogXCJkYXRhLVNjcm9sbGFuaXNtLVwiLFxuICBLRVlfREVMSU1JVEVSOiBcIi1cIixcbiAgS0VZX1NDUk9MTElNQVRPUl9JRCA6IFwiaWRcIixcbiAgS0VZX1RBUkdFVF9JRCA6IFwidGFyZ2V0SWRcIixcbiAgVUlEX0xFTkdUSCA6IDE2LFxuICBzdGF0ZXMgOiB7XG4gICAgQ09OVEFJTkVEIDogXCJjb250YWluZWRcIixcbiAgICBTUEFOTklORyA6IFwic3Bhbm5pbmdcIixcbiAgICBFTlRFUklORyA6IFwiZW50ZXJpbmdcIixcbiAgICBFWElUSU5HIDogXCJleGl0aW5nXCIsXG4gICAgQUhFQUQgOiBcImFoZWFkXCIsXG4gICAgQkVISU5EIDogXCJiZWhpbmRcIlxuICB9LFxuICBheGlzS2V5czoge31cbn07XG5cbmNvbnN0YW50cy5heGlzS2V5c1tjb25zdGFudHMuVkVSVElDQUxdID0ge1xuICBuZWFyOiBcInRvcFwiLFxuICBmYXI6IFwiYm90dG9tXCIsXG4gIGxlbmd0aDogXCJoZWlnaHRcIlxufTtcblxuY29uc3RhbnRzLmF4aXNLZXlzW2NvbnN0YW50cy5IT1JJWk9OVEFMXSA9IHtcbiAgbmVhcjogXCJsZWZ0XCIsXG4gIGZhcjogXCJyaWdodFwiLFxuICBsZW5ndGg6IFwid2lkdGhcIlxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjb25zdGFudHM7XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL2NvbnN0YW50cy5qc1xuICoqIG1vZHVsZSBpZCA9IDFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIjsoZnVuY3Rpb24oKXtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gV2F0Y2hhYmxlO1xuXG4vLyBFeHRlcm5hbCBkZXBlbmRlbmNpZXNcbnZhciB1aWQgPSByZXF1aXJlKFwidWlkXCIpLFxuICBlYWNoID0gcmVxdWlyZShcInV0aWwtZWFjaFwiKSxcbiAgZXh0ZW5kID0gcmVxdWlyZShcImV4dGVuZFwiKTtcblxuLy8gSW50ZXJuYWwgZGVwZW5kZW5jaWVzXG52YXIgY29uc3RhbnRzID0gcmVxdWlyZShcIi4vY29uc3RhbnRzXCIpO1xuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyB0YXJnZXQgaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIFdhdGNoYWJsZSgpIHtcbiAgdGhpcy5faWQgPSB1aWQoY29uc3RhbnRzLlVJRF9MRU5HVEgpO1xuXG4gIHRoaXMuX2NhbGxiYWNrc0J5UHJvcGVydHkgPSB7fTtcbiAgLy8gV2UgbmVlZCB0byBhc3NvY2lhdGUgY29udGV4dHMgd2l0aCBjYWxsYmFja3MsXG4gIC8vIGJ1dCBhbGxvY2F0aW5nIG5ldyBvYmplY3RzIG9uIGluc2VydCBpcyBjbHVua3kvZXhwZW5zaXZlLFxuICAvLyBzbyB1c2UgYSBwYXJhbGxlbCBtYXAsIGluc3RlYWQuXG4gIHRoaXMuX2NvbnRleHRzQnlQcm9wZXJ0eSA9IHt9O1xuXG4gIHRoaXMuX3Byb3BlcnRpZXMgPSB7fTtcbiAgdGhpcy5fbnVtV2F0Y2hlZFByb3BlcnRpZXMgPSAwO1xuICB0aGlzLl9udW1CaW5kaW5ncyA9IDA7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgdGFyZ2V0J3MgdW5pcXVlIGlkLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuV2F0Y2hhYmxlLnByb3RvdHlwZS5nZXRJZCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5faWQ7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGdpdmVuIHByb3BlcnR5IGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dFxuICovXG5XYXRjaGFibGUucHJvdG90eXBlLndhdGNoID0gZnVuY3Rpb24ocHJvcGVydHksIGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gIGlmKHR5cGVvZiBwcm9wZXJ0eSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgY29udGV4dCA9IGNhbGxiYWNrO1xuICAgIGNhbGxiYWNrID0gcHJvcGVydHk7XG4gICAgcHJvcGVydHkgPSBcImFsbFwiO1xuICB9IGVsc2UgaWYodHlwZW9mIHByb3BlcnR5ICE9PSBcInN0cmluZ1wiICYmIHR5cGVvZiBwcm9wZXJ0eSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcImBwcm9wZXJ0eWAgbXVzdCBiZSBhIHN0cmluZyBvciBiZSBvbWl0dGVkLlwiKTtcbiAgfVxuXG4gIGlmKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQSBmdW5jdGlvbiBgY2FsbGJhY2tgIG11c3QgYmUgZ2l2ZW4uXCIpO1xuICB9XG5cbiAgaWYoICF0aGlzLl9jYWxsYmFja3NCeVByb3BlcnR5Lmhhc093blByb3BlcnR5KHByb3BlcnR5KSApIHtcbiAgICB0aGlzLl9jYWxsYmFja3NCeVByb3BlcnR5W3Byb3BlcnR5XSA9IFtdO1xuICAgIHRoaXMuX2NvbnRleHRzQnlQcm9wZXJ0eVtwcm9wZXJ0eV0gPSBbXTtcbiAgICB0aGlzLl9udW1XYXRjaGVkUHJvcGVydGllcysrO1xuICB9XG5cbiAgaWYoIHRoaXMuX2NhbGxiYWNrc0J5UHJvcGVydHlbcHJvcGVydHldLmluZGV4T2YoY2FsbGJhY2spIDwgMCApIHtcbiAgICB0aGlzLl9jYWxsYmFja3NCeVByb3BlcnR5W3Byb3BlcnR5XS5wdXNoKGNhbGxiYWNrKTtcbiAgICB0aGlzLl9jb250ZXh0c0J5UHJvcGVydHlbcHJvcGVydHldLnB1c2goY29udGV4dCk7XG4gICAgdGhpcy5fbnVtQmluZGluZ3MrKztcbiAgfVxufTtcblxuLyoqXG4gKiBVbnJlZ2lzdGVycyBjYWxsYmFja3MgYXQgdGhlIGdpdmVuIHByb3BlcnR5LWNhbGxiYWNrIGNvbnRleHQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICovXG5XYXRjaGFibGUucHJvdG90eXBlLnVud2F0Y2ggPSBmdW5jdGlvbihwcm9wZXJ0eSwgY2FsbGJhY2spIHtcbiAgaWYodHlwZW9mIHByb3BlcnR5ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBjYWxsYmFjayA9IHByb3BlcnR5O1xuICAgIHByb3BlcnR5ID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgLy8gSWYgbm8gcHJvcGVydHkgd2FzIHNwZWNpZmllZFxuICBpZih0eXBlb2YgcHJvcGVydHkgPT09IFwidW5kZWZpbmVkXCIgJiYgIHR5cGVvZiBjYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgLy8gUmVtb3ZlIGNhbGxiYWNrIGZyb20gYWxsIHByb3BlcnRpZXMuXG5cbiAgICAvLyBnZXQgZnVsbCBsaXN0IG9mIHByb3BlcnR5IGtleXMgYmVmb3JlIG1vZGlmeWluZyB0aGUgbWFwXG4gICAgLy8gY2FuJ3QgdXNlIE9iamVjdC5rZXlzIGJlY2F1c2UgSUU4IHN1Y2tzXG4gICAgdmFyIHdhdGNoZWRLZXlzID0gW107XG4gICAgZWFjaCh0aGlzLl9jYWxsYmFja3NCeVByb3BlcnR5LCBmdW5jdGlvbihjYWxsYmFja3MsIGtleSkge1xuICAgICAgd2F0Y2hlZEtleXMucHVzaChrZXkpO1xuICAgIH0pO1xuXG4gICAgLy8gUmVjdXJpdmVseSB0cnkgdG8gcmVtb3ZlIGNhbGxiYWNrIGZyb20gZWFjaCBrZXlcbiAgICAvLyB3aGljaCBtaWdodCByZW1vdmUgdGhlIGtleSBmcm9tIG1hcCBpZiBpdCByZW1vdmVzIGxhc3QgY2FsbGJhY2tcbiAgICBlYWNoKHdhdGNoZWRLZXlzLCBmdW5jdGlvbihrZXksIGkpIHtcbiAgICAgIHRoaXMudW53YXRjaChrZXksIGNhbGxiYWNrKTtcbiAgICB9LCB0aGlzKTtcblxuICB9IGVsc2UgaWYoIHR5cGVvZiBwcm9wZXJ0eSA9PT0gXCJzdHJpbmdcIiAmJiB0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIC8vIFJlbW92ZSBjYWxsYmFjayBhdCBwcm9wZXJ0eVxuICAgIGlmKCB0aGlzLl9jYWxsYmFja3NCeVByb3BlcnR5Lmhhc093blByb3BlcnR5KHByb3BlcnR5KSApIHtcbiAgICAgIHZhciBiaW5kaW5ncyA9IHRoaXMuX2NhbGxiYWNrc0J5UHJvcGVydHlbcHJvcGVydHldO1xuICAgICAgdmFyIGNvbnRleHRzID0gdGhpcy5fY29udGV4dHNCeVByb3BlcnR5W3Byb3BlcnR5XTtcblxuICAgICAgLy8gRmluZCB0aGUgY2FsbGJhY2sgaW4gdGhlIGFycmF5LlxuICAgICAgLy8gQ2FuJ3QgdXNlIEFycmF5LnByb3RvdHlwZS5pbmRleE9mIGJlY2F1c2UgSUU4XG4gICAgICB2YXIgaWR4ID0gLTE7XG4gICAgICBlYWNoKGJpbmRpbmdzLCBmdW5jdGlvbihjYiwgaSkge1xuICAgICAgICBpZihjYiA9PT0gY2FsbGJhY2spIHtcbiAgICAgICAgICBpZHggPSBpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmKCBpZHggPj0gMCkge1xuICAgICAgICBiaW5kaW5ncy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgY29udGV4dHMuc3BsaWNlKGlkeCwgMSk7IC8vIFdpbGwgYWx3YXlzIGJlIHNhbWUgaWR4XG4gICAgICAgIHRoaXMuX251bUJpbmRpbmdzLS07XG5cbiAgICAgICAgaWYoYmluZGluZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgLy8gRW1wdHkgcHJvcGVydHkuIFJlbW92ZSBpdC5cbiAgICAgICAgICB0aGlzLnVud2F0Y2gocHJvcGVydHkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYoIHR5cGVvZiBwcm9wZXJ0eSA9PT0gXCJzdHJpbmdcIiApe1xuICAgIC8vIFJlbW92ZSBBTEwgY2FsbGJhY2tzIGF0IHByb3BlcnR5XG4gICAgaWYodGhpcy5fY2FsbGJhY2tzQnlQcm9wZXJ0eS5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkgKSB7XG4gICAgICB0aGlzLl9udW1CaW5kaW5ncyAtPSB0aGlzLl9jYWxsYmFja3NCeVByb3BlcnR5W3Byb3BlcnR5XS5sZW5ndGg7XG4gICAgICB0aGlzLl9udW1XYXRjaGVkUHJvcGVydGllcy0tO1xuICAgICAgZGVsZXRlIHRoaXMuX2NhbGxiYWNrc0J5UHJvcGVydHlbcHJvcGVydHldO1xuICAgICAgZGVsZXRlIHRoaXMuX2NvbnRleHRzQnlQcm9wZXJ0eVtwcm9wZXJ0eV07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcImB1bndhdGNoYCByZXF1aXJlcyBhIGBwcm9wZXJ0eWAgYW5kL29yIGBjYWxsYmFja2AuXCIgK1xuICAgICAgICBcIiBQZXJoYXBzIHlvdSBtZWFudCB0byB1c2UgYHVud2F0Y2hBbGxgLlwiKTtcbiAgfVxufTtcblxuLyoqXG4gKiBVbnJlZ2lzdGVyIGFsbCBjYWxsYmFja3NcbiAqL1xuV2F0Y2hhYmxlLnByb3RvdHlwZS51bndhdGNoQWxsID0gZnVuY3Rpb24oKSB7XG4gIGVhY2godGhpcy5fY2FsbGJhY2tzQnlQcm9wZXJ0eSwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgIHRoaXMudW53YXRjaChrZXkpO1xuICB9LCB0aGlzKTtcbn07XG5cbldhdGNoYWJsZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnVud2F0Y2hBbGwoKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIHRydWUgaWYgdGhlIFdhdGNoYWJsZSBpcyBiZWluZyB3YXRjaGVkLlxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbldhdGNoYWJsZS5wcm90b3R5cGUuaXNXYXRjaGVkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLm51bUJpbmRpbmdzKCkgPiAwO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgdW5pcXVlIHByb3BlcnR5LWNhbGxiYWNrIGJpbmRpbmdzLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqL1xuV2F0Y2hhYmxlLnByb3RvdHlwZS5udW1CaW5kaW5ncyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5fbnVtQmluZGluZ3M7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG51bWJlciBvZiB3YXRjaGVkIHByb3BlcnRpZXMuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfVxuICovXG5XYXRjaGFibGUucHJvdG90eXBlLm51bVdhdGNoZWRQcm9wZXJ0aWVzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9udW1XYXRjaGVkUHJvcGVydGllcztcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgZ2l2ZW4gcHJvcGVydHkgYW5kIGNhbGxzIGFueSBjYWxsYmFja3MgcmVnaXN0ZXJlZCBvbiBpdC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHlcbiAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlXG4gKi9cbldhdGNoYWJsZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24ocHJvcGVydHlLZXksIHZhbHVlKSB7XG4gIHZhciBjaGFuZ2VkUHJvcHMgPSB7fSxcbiAgICBkaWZmLFxuICAgIGFsbFByb3BzO1xuXG4gIGlmKHR5cGVvZiBwcm9wZXJ0eUtleSA9PT0gXCJvYmplY3RcIikge1xuICAgIGRpZmYgPSBwcm9wZXJ0eUtleTtcbiAgfSBlbHNlIHtcbiAgICBkaWZmID0ge307XG4gICAgZGlmZltwcm9wZXJ0eUtleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIGZvcihwcm9wZXJ0eUtleSBpbiBkaWZmKSB7XG4gICAgdmFsdWUgPSBkaWZmW3Byb3BlcnR5S2V5XTtcbiAgICBpZiggdGhpcy5pc0RpZmZlcmVudChwcm9wZXJ0eUtleSwgdmFsdWUpICkge1xuICAgICAgdGhpcy5fcHJvcGVydGllc1twcm9wZXJ0eUtleV0gPSB2YWx1ZTtcbiAgICAgIGNoYW5nZWRQcm9wc1twcm9wZXJ0eUtleV0gPSB2YWx1ZTtcbiAgICAgIHRoaXMubm90aWZ5KHByb3BlcnR5S2V5LCBwcm9wZXJ0eUtleSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIGFsbFByb3BzID0gZXh0ZW5kKHt9LCB0aGlzLl9wcm9wZXJ0aWVzKTtcbiAgdGhpcy5ub3RpZnkoXCJhbGxcIiwgY2hhbmdlZFByb3BzLCBhbGxQcm9wcyk7XG59O1xuXG5XYXRjaGFibGUucHJvdG90eXBlLmlzRGlmZmVyZW50ID0gZnVuY3Rpb24ocHJvcGVydHlLZXksIG5ld1ZhbHVlKSB7XG4gIHJldHVybiAhdGhpcy5fcHJvcGVydGllcy5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eUtleSkgfHxcbiAgICAgICAgICB0aGlzLl9wcm9wZXJ0aWVzW3Byb3BlcnR5S2V5XSAhPT0gbmV3VmFsdWU7XG59O1xuXG4vKipcbiAqIE5vdGlmaWVzIHRoZSBoYW5kbGVycyBhdCB0aGUgZ2l2ZW4gYmluZGluZyBrZXkuXG4gKiBQYXNzZXMgYWRkaXRpb25hbCBhcmd1bWVudHMgb24gdG8gdGhlIGNhbGxiYWNrLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBiaW5kaW5nS2V5IC0gdGhlIGtleSB0byBub3RpZnkgKG9mdGVuIGVxdWFsIHRvIHByb3BlcnR5S2V5KVxuICovXG5XYXRjaGFibGUucHJvdG90eXBlLm5vdGlmeSA9IGZ1bmN0aW9uKGJpbmRpbmdLZXkpIHtcbiAgaWYodGhpcy5fY2FsbGJhY2tzQnlQcm9wZXJ0eS5oYXNPd25Qcm9wZXJ0eShiaW5kaW5nS2V5KSkge1xuICAgIC8vIENvbnZlcnQgYXJndW1lbnRzIHRvIHJlYWwgYXJyYXkgYW5kIHJlbW92ZSBiaW5kaW5nS2V5XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgIGFyZ3Muc2hpZnQoKTtcblxuICAgIGVhY2godGhpcy5fY2FsbGJhY2tzQnlQcm9wZXJ0eVtiaW5kaW5nS2V5XSwgZnVuY3Rpb24oY2FsbGJhY2ssIGkpIHtcbiAgICAgIHZhciBjb250ZXh0ID0gKHRoaXMuX2NvbnRleHRzQnlQcm9wZXJ0eVtiaW5kaW5nS2V5XSlbaV07XG4gICAgICBjYWxsYmFjay5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICB9LCB0aGlzKTtcbiAgfVxufTtcblxufSkoKTsgLy8gRW5kIG1vZHVsZVxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9XYXRjaGFibGUuanNcbiAqKiBtb2R1bGUgaWQgPSAyXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgZ2V0UG9zaXRpb24gPSByZXF1aXJlKFwicG9zaXRpb25cIiksXG4gIGV4dGVuZCA9IHJlcXVpcmUoXCJleHRlbmRcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0Qm91bmRpbmdCb3goZWwsIHByb3BzLCBwYXJlbnRQcm9wcykge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgcG9zaXRpb24gPSBnZXRQb3NpdGlvbihlbCk7XG4gIGV4dGVuZChwcm9wcywgcG9zaXRpb24pO1xufTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvc3RyYXRlZ2llcy9ib3VuZGluZ0JveFN0cmF0ZWd5LmpzXG4gKiogbW9kdWxlIGlkID0gM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoXCIuLi9jb25zdGFudHNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWFrZVJlbGF0aXZlUG9zaXRpb25TdHJhdGVneShheGlzKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIHZhciBuZWFyS2V5ID0gY29uc3RhbnRzLmF4aXNLZXlzW2F4aXNdLm5lYXI7XG4gIHZhciBmYXJLZXkgPSBjb25zdGFudHMuYXhpc0tleXNbYXhpc10uZmFyO1xuXG4gIHJldHVybiBmdW5jdGlvbiBjb21wdXRlUmVsYXRpdmVQb3NpdGlvbihlbCwgcHJvcHMsIHBhcmVudFByb3BzKXtcbiAgICB2YXIgY29udGFpbmVybmVhciA9IHBhcmVudFByb3BzW25lYXJLZXldO1xuICAgIHByb3BzW25lYXJLZXldID0gcHJvcHNbbmVhcktleV0gLSBjb250YWluZXJuZWFyO1xuICAgIHByb3BzW2ZhcktleV0gPSBwcm9wc1tmYXJLZXldIC0gY29udGFpbmVybmVhcjtcbiAgfTtcblxufTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvc3RyYXRlZ2llcy9tYWtlUmVsYXRpdmVQb3NpdGlvblN0cmF0ZWd5LmpzXG4gKiogbW9kdWxlIGlkID0gNFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoXCIuLi9jb25zdGFudHNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWFrZUVuZHBvaW50UHJvZ3Jlc3NTdHJhdGVneShheGlzKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIHZhciBuZWFyS2V5ID0gY29uc3RhbnRzLmF4aXNLZXlzW2F4aXNdLm5lYXI7XG4gIHZhciBmYXJLZXkgPSBjb25zdGFudHMuYXhpc0tleXNbYXhpc10uZmFyO1xuICB2YXIgbGVuZ3RoS2V5ID0gY29uc3RhbnRzLmF4aXNLZXlzW2F4aXNdLmxlbmd0aDtcblxuICByZXR1cm4gZnVuY3Rpb24gY29tcHV0ZUVuZHBvaW50UHJvZ3Jlc3MoZWwsIHByb3BzLCBwYXJlbnRQcm9wcykge1xuICAgIHZhciBjb250YWluZXJMZW5ndGggPSBwYXJlbnRQcm9wc1tsZW5ndGhLZXldO1xuXG4gICAgLy8gdGFyZ2V0IGNvb3JkcyBhcmUgcmVsYXRpdmUsIHNvIHVzZSBjb250YWluZXJMZW5ndGggaW5zdGVhZCBvZiBmYXIgY29vcmQuXG4gICAgdmFyIG5lYXJUcmF2ZWxlZCA9IGNvbnRhaW5lckxlbmd0aCAtIHByb3BzW25lYXJLZXldO1xuICAgIHZhciBmYXJUcmF2ZWxlZCA9IGNvbnRhaW5lckxlbmd0aCAtIHByb3BzW2ZhcktleV07XG5cbiAgICBwcm9wc1tuZWFyS2V5ICsgXCJQcm9ncmVzc1wiXSA9IG5lYXJUcmF2ZWxlZCAvIGNvbnRhaW5lckxlbmd0aDtcbiAgICBwcm9wc1tmYXJLZXkgKyBcIlByb2dyZXNzXCJdID0gIGZhclRyYXZlbGVkIC8gY29udGFpbmVyTGVuZ3RoO1xuICB9O1xufTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvc3RyYXRlZ2llcy9tYWtlRW5kcG9pbnRQcm9ncmVzc1N0cmF0ZWd5LmpzXG4gKiogbW9kdWxlIGlkID0gNVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoXCIuLi9jb25zdGFudHNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWFrZUNvbnRhaW5lZFByb2dyZXNzU3RyYXRlZ3koYXhpcykge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgbmVhcktleSA9IGNvbnN0YW50cy5heGlzS2V5c1theGlzXS5uZWFyO1xuICB2YXIgbGVuZ3RoS2V5ID0gY29uc3RhbnRzLmF4aXNLZXlzW2F4aXNdLmxlbmd0aDtcbiAgdmFyIHJlc3VsdEtleSA9IGF4aXMgKyBcIkNvbnRhaW5lZFByb2dyZXNzXCI7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGNvbXB1dGVDb250YWluZWRQcm9ncmVzcyhlbCwgcHJvcHMsIHBhcmVudFByb3BzKSB7XG4gICAgLy8gRGV0ZXJtaW5lIHRoZSBsZW5ndGggZWwgY2FuIHRyYXZlbCB3aGlsZSBmdWxseSBjb250YWluZWQgYnkgcGFyZW50XG4gICAgdmFyIGNvbnRhaW5lZExlbmd0aCA9IHBhcmVudFByb3BzW2xlbmd0aEtleV0gLSBwcm9wc1tsZW5ndGhLZXldO1xuICAgIHZhciBvZmZzZXQgPSBwcm9wc1tuZWFyS2V5XTtcblxuICAgIC8vIElmIHRoZSBjb250YWluZWRMZW5ndGggaXMgbmVnYXRpdmUsIHRhcmdldCBjYW5ub3QgYmUgY29udGFpbmVkXG4gICAgaWYoY29udGFpbmVkTGVuZ3RoIDwgMCkge1xuICAgICAgcHJvcHNbcmVzdWx0S2V5XSA9IE51bWJlci5OYU47XG4gICAgfSBlbHNlIGlmKGNvbnRhaW5lZExlbmd0aCA9PT0gMCAmJiBvZmZzZXQgPT09IDApIHtcbiAgICAgIC8vIHRhcmdldCBzaXplIG1hdGNoZXMgY29udGFpbmVyIGFuZCB0YXJnZXQgaXMgY2VudGVyZWQgaW4gY29udGFpbmVyXG4gICAgICAvLyAwLzAgaXMgTmFOIGJ1dCwgaW4gdGhpcyBjYXNlLCB3ZSByZWFsbHkgd2FudCAwIG9yIDFcbiAgICAgIC8vIHdlIGNob29zZSB0byB1c2UgMSBzaW5jZSB0aGUgdHJhdmVyc2FsIGlzIGNvbXBsZXRlXG4gICAgICBwcm9wc1tyZXN1bHRLZXldID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvcHNbcmVzdWx0S2V5XSA9IDEgLSAob2Zmc2V0IC8gY29udGFpbmVkTGVuZ3RoKTtcbiAgICB9XG4gIH07XG5cbn07XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL3N0cmF0ZWdpZXMvbWFrZUNvbnRhaW5lZFByb2dyZXNzU3RyYXRlZ3kuanNcbiAqKiBtb2R1bGUgaWQgPSA2XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJ2YXIgY29uc3RhbnRzID0gcmVxdWlyZShcIi4uL2NvbnN0YW50c1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBtYWtlVmlzaWJsZVByb2dyZXNzU3RyYXRlZ3koYXhpcykge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgbmVhcktleSA9IGNvbnN0YW50cy5heGlzS2V5c1theGlzXS5uZWFyO1xuICB2YXIgbGVuZ3RoS2V5ID0gY29uc3RhbnRzLmF4aXNLZXlzW2F4aXNdLmxlbmd0aDtcblxuICB2YXIgcmVzdWx0S2V5ID0gYXhpcyArIFwiVmlzaWJsZVByb2dyZXNzXCI7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGNvbXB1dGVWaXNpYmxlUHJvZ3Jlc3MoZWwsIHByb3BzLCBwYXJlbnRQcm9wcykge1xuICAgIHZhciBwYXJlbnRMZW5ndGggPSBwYXJlbnRQcm9wc1tsZW5ndGhLZXldO1xuICAgIC8vIERldGVybWluZSB0aGUgbGVuZ3RoIGVsIGNhbiB0cmF2ZWwgd2hpbGUgcmVtYWluaW5nIHZpc2libGUgaW4gcGFyZW50XG4gICAgdmFyIHZpc2libGVMZW5ndGggPSBwYXJlbnRMZW5ndGggKyBwcm9wc1tsZW5ndGhLZXldO1xuICAgIC8vIHRhcmdldCBjb29yZHMgYXJlIHJlbGF0aXZlIHRvIHBhcmVudCxcbiAgICAvLyBzbyB1c2UgcGFyZW50IGxlbmd0aCBpbnN0ZWFkIG9mIHBhcmVudCBmYXIgY29vcmQuXG4gICAgdmFyIHZpc2libGVUcmF2ZWxlZCA9IHBhcmVudExlbmd0aCAtIHByb3BzW25lYXJLZXldO1xuICAgIHByb3BzW3Jlc3VsdEtleV0gPSB2aXNpYmxlVHJhdmVsZWQgLyB2aXNpYmxlTGVuZ3RoO1xuICB9O1xuXG59O1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9zdHJhdGVnaWVzL21ha2VWaXNpYmxlUHJvZ3Jlc3NTdHJhdGVneS5qc1xuICoqIG1vZHVsZSBpZCA9IDdcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBjb25zdGFudHMgPSByZXF1aXJlKFwiLi4vY29uc3RhbnRzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1ha2VTdGF0ZVN0cmF0ZWd5KGF4aXMpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgdmFyIG5lYXJLZXkgPSBjb25zdGFudHMuYXhpc0tleXNbYXhpc10ubmVhcjtcbiAgdmFyIGZhcktleSA9IGNvbnN0YW50cy5heGlzS2V5c1theGlzXS5mYXI7XG5cbiAgdmFyIHZpc2libGVQcm9ncmVzc0tleSA9IGF4aXMgKyBcIlZpc2libGVQcm9ncmVzc1wiO1xuICB2YXIgY29udGFpbmVkUHJvZ3Jlc3NLZXkgPSBheGlzICsgXCJDb250YWluZWRQcm9ncmVzc1wiO1xuICB2YXIgbmVhclByb2dyZXNzS2V5ID0gbmVhcktleSArIFwiUHJvZ3Jlc3NcIjtcbiAgdmFyIGZhclByb2dyZXNzS2V5ID0gZmFyS2V5ICsgXCJQcm9ncmVzc1wiO1xuXG4gIHZhciByZXN1bHRLZXkgPSBheGlzICsgXCJTdGF0ZVwiO1xuXG4gIHJldHVybiBmdW5jdGlvbiBjb21wdXRlU3RhdGUoZWwsIHByb3BzLCBwYXJlbnRQcm9wcykge1xuICAgIHZhciBzdGF0ZTtcblxuICAgIHZhciB2aXNpYmxlUHJvZ3Jlc3MgPSBwcm9wc1t2aXNpYmxlUHJvZ3Jlc3NLZXldO1xuICAgIHZhciBjb250YWluZWRQcm9ncmVzcyA9IHByb3BzW2NvbnRhaW5lZFByb2dyZXNzS2V5XTtcbiAgICB2YXIgbmVhclByb2dyZXNzID0gcHJvcHNbbmVhclByb2dyZXNzS2V5XTtcbiAgICB2YXIgZmFyUHJvZ3Jlc3MgPSBwcm9wc1tmYXJQcm9ncmVzc0tleV07XG5cbiAgICBpZihjb250YWluZWRQcm9ncmVzcyA+PTAgJiYgY29udGFpbmVkUHJvZ3Jlc3MgPD0gMSkge1xuICAgICAgaWYobmVhclByb2dyZXNzID09PSAxICYmIGZhclByb2dyZXNzID09PSAwKSB7XG4gICAgICAgIHN0YXRlID0gXCJtYXRjaGluZ1wiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUgPSBcImNvbnRhaW5lZFwiO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZih2aXNpYmxlUHJvZ3Jlc3MgPCAwKSB7XG4gICAgICBzdGF0ZSA9IFwiYWhlYWRcIjtcbiAgICB9IGVsc2UgaWYodmlzaWJsZVByb2dyZXNzID4gMSkge1xuICAgICAgc3RhdGUgPSBcImJlaGluZFwiO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUYXJnZXQgaXMgdmlzaWJsZSBidXQgbm90IGNvbnRhaW5lZFxuICAgICAgaWYobmVhclByb2dyZXNzID4gMSAmJiBmYXJQcm9ncmVzcyA8IDApIHtcbiAgICAgICAgc3RhdGUgPSBcInNwYW5uaW5nXCI7XG4gICAgICB9IGVsc2UgaWYobmVhclByb2dyZXNzID4gMSAmJiBmYXJQcm9ncmVzcyA+PSAwICYmIGZhclByb2dyZXNzIDw9MSkge1xuICAgICAgICBzdGF0ZSA9IFwiZXhpdGluZ1wiO1xuICAgICAgfSBlbHNlIGlmKGZhclByb2dyZXNzIDwgMCAmJiBuZWFyUHJvZ3Jlc3MgPj0gMCAmJiBuZWFyUHJvZ3Jlc3MgPD0gMSkge1xuICAgICAgICBzdGF0ZSA9IFwiZW50ZXJpbmdcIjtcbiAgICAgIH1cbiAgICB9XG4gICAgcHJvcHNbcmVzdWx0S2V5XSA9IHN0YXRlO1xuICB9O1xuXG59O1xuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL3NyYy9zdHJhdGVnaWVzL21ha2VTdGF0ZVN0cmF0ZWd5LmpzXG4gKiogbW9kdWxlIGlkID0gOFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1dpbmRvdyhvYmopIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHJldHVybiAodHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIiAmJlxuICAgIG9iaiAhPT0gbnVsbCAmJlxuICAgIG9ialtcInNldEludGVydmFsXCJdICE9PSB1bmRlZmluZWQpOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbn07XG5cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9zcmMvdXRpbC9pc1dpbmRvdy5qc1xuICoqIG1vZHVsZSBpZCA9IDlcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gZWxlbWVudERhdGE7XG5cbnZhciBpc1dpbmRvdyA9IHJlcXVpcmUoXCJzcmMvdXRpbC9pc1dpbmRvd1wiKTtcblxuZnVuY3Rpb24gZWxlbWVudERhdGEoZWwsIGtleSwgdmFsdWUpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgaWYodHlwZW9mIGtleSAhPT0gXCJzdHJpbmdcIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkEgc3RyaW5nIGBrZXlgIGlzIHJlcXVpcmVkXCIpO1xuICB9XG5cbiAgaWYoaXNXaW5kb3coZWwpKSB7XG4gICAgaWYodHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICB2YWx1ZSA9IGVsW2tleV07XG4gICAgfSBlbHNlIGlmKHZhbHVlID09PSBudWxsKSB7XG4gICAgICBkZWxldGUgZWxba2V5XTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxba2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgfSBlbHNlIGlmKGVsIGluc3RhbmNlb2YgTm9kZSkge1xuICAgIGlmKHR5cGVvZiB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgaWYoZWwuaGFzQXR0cmlidXRlKGtleSkpIHtcbiAgICAgICAgdmFsdWUgPSBlbC5nZXRBdHRyaWJ1dGUoa2V5KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYodmFsdWUgPT09IG51bGwpIHtcbiAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcImVsIG11c3QgYmUgYW4gaW5zdGFuY2Ugb2YgTm9kZSBvciBXaW5kb3cuXCIpO1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL3V0aWwvZWxlbWVudERhdGEuanNcbiAqKiBtb2R1bGUgaWQgPSAxMFxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmopIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoIG9iaiApID09PSAnW29iamVjdCBPYmplY3RdJztcbn07XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vc3JjL3V0aWwvaXNPYmplY3RMaXRlcmFsLmpzXG4gKiogbW9kdWxlIGlkID0gMTFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsInZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbnZhciB1bmRlZmluZWQ7XG5cbnZhciBpc1BsYWluT2JqZWN0ID0gZnVuY3Rpb24gaXNQbGFpbk9iamVjdChvYmopIHtcblx0J3VzZSBzdHJpY3QnO1xuXHRpZiAoIW9iaiB8fCB0b1N0cmluZy5jYWxsKG9iaikgIT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0dmFyIGhhc19vd25fY29uc3RydWN0b3IgPSBoYXNPd24uY2FsbChvYmosICdjb25zdHJ1Y3RvcicpO1xuXHR2YXIgaGFzX2lzX3Byb3BlcnR5X29mX21ldGhvZCA9IG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IucHJvdG90eXBlICYmIGhhc093bi5jYWxsKG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGUsICdpc1Byb3RvdHlwZU9mJyk7XG5cdC8vIE5vdCBvd24gY29uc3RydWN0b3IgcHJvcGVydHkgbXVzdCBiZSBPYmplY3Rcblx0aWYgKG9iai5jb25zdHJ1Y3RvciAmJiAhaGFzX293bl9jb25zdHJ1Y3RvciAmJiAhaGFzX2lzX3Byb3BlcnR5X29mX21ldGhvZCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIE93biBwcm9wZXJ0aWVzIGFyZSBlbnVtZXJhdGVkIGZpcnN0bHksIHNvIHRvIHNwZWVkIHVwLFxuXHQvLyBpZiBsYXN0IG9uZSBpcyBvd24sIHRoZW4gYWxsIHByb3BlcnRpZXMgYXJlIG93bi5cblx0dmFyIGtleTtcblx0Zm9yIChrZXkgaW4gb2JqKSB7fVxuXG5cdHJldHVybiBrZXkgPT09IHVuZGVmaW5lZCB8fCBoYXNPd24uY2FsbChvYmosIGtleSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGV4dGVuZCgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXHR2YXIgb3B0aW9ucywgbmFtZSwgc3JjLCBjb3B5LCBjb3B5SXNBcnJheSwgY2xvbmUsXG5cdFx0dGFyZ2V0ID0gYXJndW1lbnRzWzBdLFxuXHRcdGkgPSAxLFxuXHRcdGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGgsXG5cdFx0ZGVlcCA9IGZhbHNlO1xuXG5cdC8vIEhhbmRsZSBhIGRlZXAgY29weSBzaXR1YXRpb25cblx0aWYgKHR5cGVvZiB0YXJnZXQgPT09ICdib29sZWFuJykge1xuXHRcdGRlZXAgPSB0YXJnZXQ7XG5cdFx0dGFyZ2V0ID0gYXJndW1lbnRzWzFdIHx8IHt9O1xuXHRcdC8vIHNraXAgdGhlIGJvb2xlYW4gYW5kIHRoZSB0YXJnZXRcblx0XHRpID0gMjtcblx0fSBlbHNlIGlmICgodHlwZW9mIHRhcmdldCAhPT0gJ29iamVjdCcgJiYgdHlwZW9mIHRhcmdldCAhPT0gJ2Z1bmN0aW9uJykgfHwgdGFyZ2V0ID09IG51bGwpIHtcblx0XHR0YXJnZXQgPSB7fTtcblx0fVxuXG5cdGZvciAoOyBpIDwgbGVuZ3RoOyArK2kpIHtcblx0XHRvcHRpb25zID0gYXJndW1lbnRzW2ldO1xuXHRcdC8vIE9ubHkgZGVhbCB3aXRoIG5vbi1udWxsL3VuZGVmaW5lZCB2YWx1ZXNcblx0XHRpZiAob3B0aW9ucyAhPSBudWxsKSB7XG5cdFx0XHQvLyBFeHRlbmQgdGhlIGJhc2Ugb2JqZWN0XG5cdFx0XHRmb3IgKG5hbWUgaW4gb3B0aW9ucykge1xuXHRcdFx0XHRzcmMgPSB0YXJnZXRbbmFtZV07XG5cdFx0XHRcdGNvcHkgPSBvcHRpb25zW25hbWVdO1xuXG5cdFx0XHRcdC8vIFByZXZlbnQgbmV2ZXItZW5kaW5nIGxvb3Bcblx0XHRcdFx0aWYgKHRhcmdldCA9PT0gY29weSkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gUmVjdXJzZSBpZiB3ZSdyZSBtZXJnaW5nIHBsYWluIG9iamVjdHMgb3IgYXJyYXlzXG5cdFx0XHRcdGlmIChkZWVwICYmIGNvcHkgJiYgKGlzUGxhaW5PYmplY3QoY29weSkgfHwgKGNvcHlJc0FycmF5ID0gQXJyYXkuaXNBcnJheShjb3B5KSkpKSB7XG5cdFx0XHRcdFx0aWYgKGNvcHlJc0FycmF5KSB7XG5cdFx0XHRcdFx0XHRjb3B5SXNBcnJheSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0Y2xvbmUgPSBzcmMgJiYgQXJyYXkuaXNBcnJheShzcmMpID8gc3JjIDogW107XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGNsb25lID0gc3JjICYmIGlzUGxhaW5PYmplY3Qoc3JjKSA/IHNyYyA6IHt9O1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vIE5ldmVyIG1vdmUgb3JpZ2luYWwgb2JqZWN0cywgY2xvbmUgdGhlbVxuXHRcdFx0XHRcdHRhcmdldFtuYW1lXSA9IGV4dGVuZChkZWVwLCBjbG9uZSwgY29weSk7XG5cblx0XHRcdFx0Ly8gRG9uJ3QgYnJpbmcgaW4gdW5kZWZpbmVkIHZhbHVlc1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNvcHkgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdHRhcmdldFtuYW1lXSA9IGNvcHk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvLyBSZXR1cm4gdGhlIG1vZGlmaWVkIG9iamVjdFxuXHRyZXR1cm4gdGFyZ2V0O1xufTtcblxuXG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL34vZXh0ZW5kL2luZGV4LmpzXG4gKiogbW9kdWxlIGlkID0gMTJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIlxuLyoqXG4gKiBNb2R1bGUgZXhwb3J0cy5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRocm90dGxlO1xuXG4vKipcbiAqIFJldHVybnMgYSBuZXcgZnVuY3Rpb24gdGhhdCwgd2hlbiBpbnZva2VkLCBpbnZva2VzIGBmdW5jYCBhdCBtb3N0IG9uZSB0aW1lIHBlclxuICogYHdhaXRgIG1pbGxpc2Vjb25kcy5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBgRnVuY3Rpb25gIGluc3RhbmNlIHRvIHdyYXAuXG4gKiBAcGFyYW0ge051bWJlcn0gd2FpdCBUaGUgbWluaW11bSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRoYXQgbXVzdCBlbGFwc2UgaW4gYmV0d2VlbiBgZnVuY2AgaW52b2thdGlvbnMuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBuZXcgZnVuY3Rpb24gdGhhdCB3cmFwcyB0aGUgYGZ1bmNgIGZ1bmN0aW9uIHBhc3NlZCBpbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gdGhyb3R0bGUgKGZ1bmMsIHdhaXQpIHtcbiAgdmFyIHJ0bjsgLy8gcmV0dXJuIHZhbHVlXG4gIHZhciBsYXN0ID0gMDsgLy8gbGFzdCBpbnZva2F0aW9uIHRpbWVzdGFtcFxuICByZXR1cm4gZnVuY3Rpb24gdGhyb3R0bGVkICgpIHtcbiAgICB2YXIgbm93ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdmFyIGRlbHRhID0gbm93IC0gbGFzdDtcbiAgICBpZiAoZGVsdGEgPj0gd2FpdCkge1xuICAgICAgcnRuID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgbGFzdCA9IG5vdztcbiAgICB9XG4gICAgcmV0dXJuIHJ0bjtcbiAgfTtcbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3Rocm90dGxlaXQvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAxM1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBvbjtcbm1vZHVsZS5leHBvcnRzLm9uID0gb247XG5tb2R1bGUuZXhwb3J0cy5vZmYgPSBvZmY7XG5cbmZ1bmN0aW9uIG9uIChlbGVtZW50LCBldmVudCwgY2FsbGJhY2ssIGNhcHR1cmUpIHtcbiAgKGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lciB8fCBlbGVtZW50LmF0dGFjaEV2ZW50KS5jYWxsKGVsZW1lbnQsIGV2ZW50LCBjYWxsYmFjaywgY2FwdHVyZSk7XG4gIHJldHVybiBjYWxsYmFjaztcbn1cblxuZnVuY3Rpb24gb2ZmIChlbGVtZW50LCBldmVudCwgY2FsbGJhY2ssIGNhcHR1cmUpIHtcbiAgKGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciB8fCBlbGVtZW50LmRldGFjaEV2ZW50KS5jYWxsKGVsZW1lbnQsIGV2ZW50LCBjYWxsYmFjaywgY2FwdHVyZSk7XG4gIHJldHVybiBjYWxsYmFjaztcbn1cblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L2RvbS1ldmVudC9pbmRleC5qc1xuICoqIG1vZHVsZSBpZCA9IDE0XG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCIvKipcbiAqIEV4cG9ydCBgdWlkYFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gdWlkO1xuXG4vKipcbiAqIENyZWF0ZSBhIGB1aWRgXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGxlblxuICogQHJldHVybiB7U3RyaW5nfSB1aWRcbiAqL1xuXG5mdW5jdGlvbiB1aWQobGVuKSB7XG4gIGxlbiA9IGxlbiB8fCA3O1xuICByZXR1cm4gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNSkuc3Vic3RyKDIsIGxlbik7XG59XG5cblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIC4vfi91aWQvaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAxNVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwidmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogSXRlcmF0ZSBvdmVyIGFueSBvYmplY3QsIGNhbGxpbmcgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIG9uIGV2ZXJ5IGl0ZXJhdGlvbi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gICBvYmpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0geyp9ICAgICAgICBjb250ZXh0XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaiwgZm4sIGNvbnRleHQpIHtcbiAgLy8gSXRlcmF0ZSBvdmVyIGFycmF5LWxpa2Ugb2JqZWN0cyBudW1lcmljYWxseS5cbiAgaWYgKG9iaiAhPSBudWxsICYmIG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmoubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZuLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAvLyBVc2UgdGhlIE9iamVjdCBwcm90b3R5cGUgZGlyZWN0bHkgaW4gY2FzZSB0aGUgb2JqZWN0IHdlIGFyZSBpdGVyYXRpbmdcbiAgICAgIC8vIG92ZXIgZG9lcyBub3QgaW5oZXJpdCBmcm9tIGBPYmplY3QucHJvdG90eXBlYC5cbiAgICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIHtcbiAgICAgICAgZm4uY2FsbChjb250ZXh0LCBvYmpba2V5XSwga2V5LCBvYmopO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogLi9+L3V0aWwtZWFjaC9lYWNoLmpzXG4gKiogbW9kdWxlIGlkID0gMTZcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUcmFuc3BvcnQuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gcG9zaXRpb247XG5cbi8qKlxuICogR2xvYmFscy5cbiAqL1xudmFyIHdpbiA9IHdpbmRvdztcbnZhciBkb2MgPSB3aW4uZG9jdW1lbnQ7XG52YXIgZG9jRWwgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xuXG4vKipcbiAqIFBvb3IgbWFuJ3Mgc2hhbGxvdyBvYmplY3QgZXh0ZW5kLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBhXG4gKiBAcGFyYW0ge09iamVjdH0gYlxuICpcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xuZnVuY3Rpb24gZXh0ZW5kKGEsIGIpIHtcblx0Zm9yICh2YXIga2V5IGluIGIpIHtcblx0XHRhW2tleV0gPSBiW2tleV07XG5cdH1cblx0cmV0dXJuIGE7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgb2JqZWN0IGlzIHdpbmRvdy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaXNXaW4ob2JqKSB7XG5cdHJldHVybiBvYmogJiYgb2JqLnNldEludGVydmFsICE9IG51bGw7XG59XG5cbi8qKlxuICogUmV0dXJucyBlbGVtZW50J3Mgb2JqZWN0IHdpdGggYGxlZnRgLCBgdG9wYCwgYGJvdHRvbWAsIGByaWdodGAsIGB3aWR0aGAsIGFuZCBgaGVpZ2h0YFxuICogcHJvcGVydGllcyBpbmRpY2F0aW5nIHRoZSBwb3NpdGlvbiBhbmQgZGltZW5zaW9ucyBvZiBlbGVtZW50IG9uIGEgcGFnZS5cbiAqXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnRcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbmZ1bmN0aW9uIHBvc2l0aW9uKGVsZW1lbnQpIHtcblx0dmFyIHdpblRvcCA9IHdpbi5wYWdlWU9mZnNldCB8fCBkb2NFbC5zY3JvbGxUb3A7XG5cdHZhciB3aW5MZWZ0ID0gd2luLnBhZ2VYT2Zmc2V0IHx8IGRvY0VsLnNjcm9sbExlZnQ7XG5cdHZhciBib3ggPSB7IGxlZnQ6IDAsIHJpZ2h0OiAwLCB0b3A6IDAsIGJvdHRvbTogMCwgd2lkdGg6IDAsIGhlaWdodDogMCB9O1xuXG5cdGlmIChpc1dpbihlbGVtZW50KSkge1xuXHRcdGJveC53aWR0aCA9IHdpbi5pbm5lcldpZHRoIHx8IGRvY0VsLmNsaWVudFdpZHRoO1xuXHRcdGJveC5oZWlnaHQgPSB3aW4uaW5uZXJIZWlnaHQgfHwgZG9jRWwuY2xpZW50SGVpZ2h0O1xuXHR9IGVsc2UgaWYgKGRvY0VsLmNvbnRhaW5zKGVsZW1lbnQpICYmIGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0ICE9IG51bGwpIHtcblx0XHRleHRlbmQoYm94LCBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpKTtcblx0XHQvLyB3aWR0aCAmIGhlaWdodCBkb24ndCBleGlzdCBpbiA8SUU5XG5cdFx0Ym94LndpZHRoID0gYm94LnJpZ2h0IC0gYm94LmxlZnQ7XG5cdFx0Ym94LmhlaWdodCA9IGJveC5ib3R0b20gLSBib3gudG9wO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBib3g7XG5cdH1cblxuXHRib3gudG9wID0gYm94LnRvcCArIHdpblRvcCAtIGRvY0VsLmNsaWVudFRvcDtcblx0Ym94LmxlZnQgPSBib3gubGVmdCArIHdpbkxlZnQgLSBkb2NFbC5jbGllbnRMZWZ0O1xuXHRib3gucmlnaHQgPSBib3gubGVmdCArIGJveC53aWR0aDtcblx0Ym94LmJvdHRvbSA9IGJveC50b3AgKyBib3guaGVpZ2h0O1xuXG5cdHJldHVybiBib3g7XG59XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiAuL2Jvd2VyX2NvbXBvbmVudHMvcG9zaXRpb24vaW5kZXguanNcbiAqKiBtb2R1bGUgaWQgPSAxN1xuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIl0sInNvdXJjZVJvb3QiOiIiLCJmaWxlIjoiU2Nyb2xsaW1hdG9yLmRldi5qcyJ9