# scrollimator 
Power animations with scroll progress. 

_This library is in beta so the api may change. Feedback is welcome._

_Note: IE8 has not yet been tested_

## What does it do?
A `Scrollimator` instance provides callbacks to watch the position 
and scroll/traversal progress of child elements relative to the `Scrollimator` node.
The progress values returned can be used to tween animations as the
user scrolls.

### [A Simple Demo](//rawgit.com/mxdubois/scrollimator/master/examples/simple/index.html)

## Features

* No jQuery
* Supports IE8+ (untested) and modern browsers
* Unopinionated about application and DOM structure.
* Supports vertical and horizontal scrolling
* Works with `window`, overflowing elements, and 
  custom scrollers (i.e. [cubiq/iscroll](https://github.com/cubiq/iscroll)). 
* Allows reconfiguring options on-the-fly
* (Coming soon!) Fixed and percentage offsets for Scrollimator's active area

## Watchable Properties

* **top** | **left** | **right** | **bottom** 
 * Element offsets relative to Scrollimator's top/left
* **topProgress** | **leftProgress** | **rightProgress** | **bottomProgress**
 * Progress of edge relative to top/left of Scrollimator
* **verticalVisibleProgress** | **horizontalVisibleProgress**
 * Progress from partially entered to fully exited.
* **verticalContainedProgress** | **horizontalContainedProgress**
  * Progress from fully entered to partially exited.
    * [-Infinity, Infinity] if element is smaller than Scrollimator
    * -Infinity|1|Infinity if element is same size as Scrollimator.
    * `NaN` if element is larger than Scrollimator (cannot be contained) 
* **verticalState** | **horizontalState**
 * String representing state of element relative to Scrollimator
    * `"ahead"` - below/right of Scrollimator
    * `"entering"` - straddling bottom/right edge of Scrollimator
    * `"contained"` - smaller than Scrollimator and fully inside
    * `"matching"` - same size as Scrollimator and edges aligned 
    * `"spanning"` - larger than Scrollimator and spanning it 
    * `"exiting"` - straddling top/left edge of Scrollimator
    * `"behind"` - above/left of Scrollimator

## Installing

_Not yet available on npm. Coming soon!_

## Basic Usage

**Constructing:**
```javascript
var Scrollimator = require("scrollimator");

// see src/Scrollimator.js for all available options.
var options = {};

// with a node
var scrollimatorNode = document.getElementById("my-scrollimator-node");
var scrollimator = new Scrollimator(scrollimatorNode, options);

// with the window
var windowScrollimator = new Scrollimator(window, options);
```

**Watching a single property:**
```javascript
// IMPORTANT: do not perform slow operations in these callbacks
// Specifically, it is best to perform DOM updates in 
// a requestAnimationFrame callback. See the examples directory for reference.
var callback = function(key, value) {
  console.log(this.getAttribute("id") + "has " + key + ":" + value);
};

// watch a Node
var someNode = document.getElementById("some-node");
scrollimator.watch(someNode, "verticalState", callback);

// watch a NodeList
var allSections = document.getElementsByTagName("section");
scrollimator.watch(allSections, "topProgress", callback);
```

**Watching all properties:**
```javascript
var someNode = document.getElementById("some-node");
scrollimator.watch(someNode, "all", function(changedProps, allProps){
  if(changedProps.hasOwnProperty("topProgress")) {
    console.log("topProgress is now " + changedProps.topProgress);
  }
  if(changedProps.hasOwnProperty("leftProgress")) {
    console.log("bottomProgress is now " + changedProps.bottomProgress);
  }
});
```

**Unwatching:**
```javascript
// Unwatch property on all nodes
scrollimator.unwatch("foo");
// Unwatch property on a specific node
scrollimator.unwatch(someNode, "bar");
// Unwatch a callback on a specific property on a specific node
scrollimator.unwatch(someNode, "baz", someRegisteredCallback);
// Unwatch a callback on a specific node
scrollimator.unwatch(someNode, someRegisteredCallback);
// Unwatch all callbacks on a specific node
scrollimator.unwatch(someNode);
// Unwatch callback on all nodes
scrollimator.unwatch(someRegisteredCallback);

// Unwatch everything
scrollimator.unwatchAll();
```

**Reconfiguring:**
```javascript
scrollimator.configure(newOptions);
```

**Resetting:**
```javascript
// Return the scrollimator to a clean state (just like new).
scrollimator.reset();
```

**Destroying:**
```javascript
// Be sure to call this when you are done
// it unregisters callbacks and clears references to dom nodes 
scrollimator.destroy();
```

## Keeping the Scrollimator updated

It is important that the Scrollimator's `update` function is called whenever the
position or size of elements changes.

The Scrollimator will automatically call the `bindUpdate` and `unbindUpdate`
adaptor functions specified in the `options` when it begins watching elements. 
By default, these adaptors bind `update` to the `scroll` event of the
 scrollimator element and the `resize` event of the window.

It is up to you, however, to ensure `update` is called when you add or remove 
elements from the document. You can do this by calling `update` manually, or by
overriding the adaptors to bind `update` to custom events within 
your application.

Example:
```javascript
var options = {
  // A throttled version of `update` is given to us as `callback`
  bindUpdate: function(el, callback) {
    // Assuming you've setup you application to fire these events on Backbone.
    Backbone.on("scroll", callback);
    Backbone.on("resize", callback);
    Backbone.on("DOMNodeInserted", callback);
    Backbone.on("DOMNodeRemoved", callback);
  },
  unbindUpdate: function(el, callback) {
    Backbone.off("scroll", callback);
    Backbone.off("resize", callback);
    Backbone.off("DOMNodeInserted", callback);
    Backbone.off("DOMNodeRemoved", callback);
  },
});
```

If you are using a custom scroller, like iScroll, you may want to override 
the adaptors to bind `update` to your scroller's scroll event.

Example:
```javascript
var options = {
  bindUpdate: function(el, callback) {
    iScroll.on("scroll", callback);
    window.addEventListener("resize", callback); // note: not IE8 safe
  },
  unbindUpdate: function(el, callback) {
    iScroll.off("scroll", callback);
    window.removeEventListener("resize", callback); // note: not IE8 safe
  },
});
```

If you wish to control the binding manually, simply nullify the adaptors.

Example:
```javascript
var options = {
  bindUpdate: null,
  unbindUpdate: null
});
```

## Advanced Usage
_This part of the api is likely to change in future releases_

At present it is possible to add or modify the behavior of watchable keys
by adding "strategies" to the Scrollimator. In this case, strategies are simply
callbacks that are called on every `update`. They are stored in the
`targetUpdateStrategies` and `scrollimatorUpdateStrategies` arrays in the options
given to the constructor.

For instance, you can add a strategy to the end of the update process, like so:
```javascript
var options = {};
// Copy the default array
options.targetUpdateStrategies = 
  Array.prototype.slice(Scrollimator.defaults.targetUpdateStrategies)

// Use a closure to encapsulate setup or persistent variables
var velocityStrategy = (function(){
  var lastTop;
  var lastLeft;
  var lastCalledMs;
  return function(el, props, parentProps) {
    var now = new Date().getTime();
    if(typeof lastCalledMs !== "undefined") {
      var deltaMs = nowMs - lastCalledMs;
      props.horizontalVelocity = props.top - lastTop / deltaMs;
      props.verticalVelocity = props.left - lastLeft / deltaMs;
    } else {
      props.verticalVelocity = 0;
      props.horizontalVelocity = 0;
    }
    lastTop = props.top;
    lastLeft = props.left;
    lastCalledMs = nowMs;
  };
})();

// Push to end
options.targetUpdateStrategies.push(velocityStrategy);

var scrollimator = new Scrollimator(window, options);
```
