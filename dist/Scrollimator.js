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
  extend = __webpack_require__(13),
  each = __webpack_require__(16),
  throttle = __webpack_require__(12),
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
  extend = __webpack_require__(13);

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
  extend = __webpack_require__(13);

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
/* 13 */
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
