/* globals sinon, expect, describe, it, before, beforeEach, after, afterEach */

var extend = require("extend");

// Setups
var setupFixture = require("test/setups/setupBrowserFixture"),
  setupAxis = require("test/setups/setupAxis"),
  targetPositionSetups = require("test/setups/targetPositionSetups");

// Helpers
var forJunk = require("test/helpers/forJunk"),
  testNodeUnchanged = require("test/helpers/testNodeUnchanged"),
  rectHelper = require("test/helpers/rectHelper");

// Units under test
var constants = require("src/constants");
var Scrollimator = require("src/Scrollimator");

describe("Scrollimator", function() {
  "use strict";

  setupFixture();
  var html = "";
  var fixture;

  beforeEach(function(){
    fixture = this;
    this.document.innerHTML = html;
    expect(fixture.window).to.not.equal(undefined);
    expect(fixture.document).to.not.equal(undefined);
  });

  describe("#getScrollimatorId", function() {
    var someNode, someOtherNode;

    beforeEach(function(){
      someNode = fixture.document.createElement("div");
      someOtherNode = fixture.document.createElement("div");

      fixture.document.body.appendChild(someNode);
      fixture.document.body.appendChild(someOtherNode);
    });

    afterEach(function() {
      someNode = null;
      someOtherNode = null;
    });

    it("throws if no arguments are given", function() {
      expect(function(){
        Scrollimator.getScrollimatorId();
      }).to.throw();
    });

    it("accepts only `Node` and `Window` as `el`", function() {

      expect(function() {
          Scrollimator.getScrollimatorId(someNode);
      }).to.not.throw();

      expect(function() {
          Scrollimator.getScrollimatorId(fixture.window);
      }).to.not.throw();

      forJunk(function(junk) {
        expect(function() {
          Scrollimator.getScrollimatorId(junk);
        }).to.throw();
      });
    });

    it("retrieves `undefined` from objects without ids", function() {
      expect(Scrollimator.getScrollimatorId(someNode))
        .to.equal(undefined);
      expect(Scrollimator.getScrollimatorId(fixture.window))
        .to.equal(undefined);
    });

    it("retrieves the correct id from Scrollimator els", function() {

      var nodeScrollimator = new Scrollimator(someNode);
      var windowScrollimator = new Scrollimator(fixture.window);

      var nodeId = nodeScrollimator.getId();
      var windowId = windowScrollimator.getId();

      expect(Scrollimator.getScrollimatorId(someNode)).to.equal(nodeId);
      expect(Scrollimator.getScrollimatorId(fixture.window)).to.equal(windowId);
      expect(Scrollimator.getScrollimatorId(someOtherNode)).to.equal(undefined);

      nodeScrollimator.destroy();
      windowScrollimator.destroy();
    });

  });


  describe("(constructor)", function() {
    var windowScrollimator, nodeScrollimator, someNode;

    beforeEach(function() {
      someNode = fixture.document.createElement("div");
      fixture.document.body.appendChild(someNode);
    });

    afterEach(function() {
      if(windowScrollimator) {
        windowScrollimator.destroy();
      }
      if(nodeScrollimator) {
        nodeScrollimator.destroy();
      }

      windowScrollimator = null;
      nodeScrollimator = null;
    });

    it("throws if no `el` is given", function() {
      expect(function() {
        windowScrollimator = new Scrollimator();
      }).to.throw(Error);
    });

    it("accepts a `Node` as an `el`", function() {
      expect(function() {
        nodeScrollimator = new Scrollimator(fixture.window);
      }).to.not.throw();
    });

    it("accepts a `Window` as an `el`", function() {
      expect(function() {
        windowScrollimator = new Scrollimator(fixture.window);
      }).to.not.throw();
    });

    it("accepts nothing else as an `el`", function() {
      expect(function() {
        windowScrollimator = new Scrollimator(fixture.window);
      }).to.not.throw();
    });

    it("sets a different id for each instance", function() {
      nodeScrollimator = new Scrollimator(fixture.window);
      windowScrollimator = new Scrollimator(fixture.window);

      expect(Scrollimator.getScrollimatorId(someNode))
        .to.not.equal(Scrollimator.getScrollimatorId(fixture.window));
    });

  });

  describe("#getId", function() {
    var windowScrollimator, nodeScrollimator, someNode;

    beforeEach(function(){
      someNode = document.createElement("div");
      document.body.appendChild(someNode);

      windowScrollimator = new Scrollimator(fixture.window);
      nodeScrollimator = new Scrollimator(someNode);
    });

    afterEach(function() {
      windowScrollimator.destroy();
      nodeScrollimator.destroy();
      windowScrollimator = null;
      nodeScrollimator = null;
      someNode = null;
    });

    it("returns a string", function() {
      expect(windowScrollimator.getId()).to.be.a("string");
      expect(nodeScrollimator.getId()).to.be.a("string");
    });

    it("returns the same id as Scrollimator.getScrollimatorId", function() {
      var windowId = Scrollimator.getScrollimatorId(fixture.window);
      var nodeId = Scrollimator.getScrollimatorId(someNode);

      expect(windowScrollimator.getId()).to.equal(windowId);
      expect(nodeScrollimator.getId()).to.equal(nodeId);
    });

  });

  describe("#configure", function() {
    var scrollimator, options, someNode;

    beforeEach(function(){
      options = {
        bindUpdate : sinon.spy(function() {
          return Scrollimator.defaults.bindUpdate.apply(this, arguments);
        }),
        unbindUpdate: sinon.spy( function() {
          return Scrollimator.defaults.unbindUpdate.apply(this, arguments);
        }),
        throttle: sinon.spy(Scrollimator.defaults.throttle)
      };

      scrollimator = new Scrollimator(fixture.window, options);

      someNode = fixture.document.createElement("div");
      fixture.document.body.appendChild(someNode);
    });

    afterEach(function() {
      scrollimator.destroy();
      scrollimator = null;
      someNode = null;
    });

    it("throws if no arguments are given", function() {
      expect(function() {
        scrollimator.configure();
      }).to.throw();
    });

    it("sinon spies work with and without Function.call", function() {
      var ourCallCount = 0;
      var ourArgs;
      var options = {
        cb : function() {
          ourCallCount++;
          ourArgs = Array.prototype.slice.call(arguments);
        }
      };
      var spy = sinon.spy(options.cb);

      spy();
      expect(spy.callCount).to.be.above(0);
      expect(spy.callCount).to.equal(ourCallCount);
      var callCountAfterFirst = spy.callCount;

      spy.call(this, 3, 2, 1);
      expect(spy.callCount).to.be.above(callCountAfterFirst);
      expect(spy.callCount).to.equal(ourCallCount);
      expect(spy.getCall(1).args).to.have.members(ourArgs);
    });

    it("sinon spies keep separate counts for spies on same func", function() {
      var options = {
        cb : function() {}
      };
      var spy1 = sinon.spy(options.cb);
      var spy2 = sinon.spy(options.cb);
      spy1();
      spy1();
      spy2();
      expect(spy1.callCount).to.be.above(spy2.callCount);
    });

    it("accepts a plain object `options`", function() {
      expect(function() {
        scrollimator.configure({
          foo: "bar"
        });
      }).to.not.throw();
    });

    it("rebinds bindUpdate/unbindUpdate if they change", function() {
      // Ensure that scroll is bound
      scrollimator.watch(someNode, "foo", function(){});

      var newOptions = {
        bindUpdate : sinon.spy(Scrollimator.defaults.bindUpdate),
        unbindUpdate : sinon.spy(Scrollimator.defaults.unbindUpdate)
      };

      var unbindUpdateCallCountBefore = options.unbindUpdate.callCount;
      var bindUpdateCallCountBefore = options.bindUpdate.callCount;

      scrollimator.configure(newOptions);

      expect(options.unbindUpdate.callCount)
        .to.be.above(unbindUpdateCallCountBefore);
      expect(options.bindUpdate.callCount)
        .to.equal(bindUpdateCallCountBefore);

      expect(newOptions.bindUpdate.callCount).to.be.above(0);
      expect(newOptions.unbindUpdate.callCount)
        .to.be.below(newOptions.bindUpdate.callCount);
    });

    it("rebinds to throttle if it changes", function() {
      // Ensure that throttle is bound
      scrollimator.watch(someNode, "foo", function(){});

      var throttleSpyNew = sinon.spy(Scrollimator.defaults.throttle);
      var throttleCallCountBefore = options.throttle.callCount;

      scrollimator.configure({
        throttle: throttleSpyNew
      });

      expect(options.throttle.callCount).to.equal(throttleCallCountBefore);
      expect(throttleSpyNew.callCount).to.be.above(0);
    });

    it("rebinds to throttle if throttleDelayMs changes", function() {
      // Ensure that throttle is bound
      scrollimator.watch(someNode, "foo", function(){});

      var throttleDelayMsNew = Scrollimator.defaults.throttleDelayMs + 2;
      var throttleCallCountBefore = options.throttle.callCount;

      scrollimator.configure({
        throttleDelayMs: throttleDelayMsNew
      });

      expect(options.throttle.callCount).to.be.above(throttleCallCountBefore);
      expect(options.throttle.lastCall.args).to.contain(throttleDelayMsNew);
    });

  });

  describe("#reset", function() {
    var scrollimator, someNode;

    beforeEach(function() {
      scrollimator = new Scrollimator(fixture.window);
      someNode = document.createElement("div");
      document.body.appendChild(someNode);
    });

    afterEach(function() {
      scrollimator.destroy();
      scrollimator = null;
      someNode = null;
    });

    it("doesn't require any arguments", function() {
      scrollimator.reset();
    });

    it("doesn't change the Scrollimator's id", function() {
      var id = Scrollimator.getScrollimatorId(fixture.window);

      scrollimator.reset();
      expect(scrollimator.getId()).to.equal(id);
      expect(Scrollimator.getScrollimatorId(fixture.window)).to.equal(id);

      scrollimator.reset({ foo: "bar"});
      expect(scrollimator.getId()).to.equal(id);
      expect(Scrollimator.getScrollimatorId(fixture.window)).to.equal(id);
    });

  });

  describe("#watch", function() {
    var scrollimator, tagName;
    var nodes, props, cbs;

    beforeEach(function() {
      tagName = "section";
      for(var i=0; i < 3; i++) {
        fixture.document.body.appendChild(
          fixture.document.createElement(tagName));
      }
      nodes = fixture.document.getElementsByTagName(tagName);
      props = ["foo", "bar", "baz"];
      cbs = [
        function(){},
        function(){},
        function(){},
      ];
      scrollimator = new Scrollimator(fixture.window);
    });

    afterEach(function() {
      scrollimator.destroy();
      scrollimator = null;
      for(var i=0; i < nodes.length; i++) {
        nodes[i] = null;
      }
      nodes = null;
    });

    it("throws if no arguments are given", function() {
      expect(function() {
        scrollimator.watch();
      }).to.throw();
    });

    it("throws if el is not given", function() {
      expect(function() {
        scrollimator.watch(undefined, props[0], cbs[0], {});
      }).to.throw();

      expect(function() {
        scrollimator.watch(props[0], cbs[0], {});
      }).to.throw();
    });

    it("throws if callback is not given", function() {
      expect(function() {
        scrollimator.watch(nodes[0]);
      }).to.throw();

      expect(function() {
        scrollimator.watch(nodes[0], undefined, undefined, this);
      }).to.throw();

      expect(function() {
        scrollimator.watch(nodes[0], props[0], undefined, this);
      }).to.throw();

    });

    it("doesn't throw if property is ommitted", function() {
      expect(function() {
        scrollimator.watch(nodes[0], cbs[0], this);
      }).to.not.throw();

      expect(function() {
        scrollimator.watch(nodes[0], undefined, cbs[0], this);
      }).to.not.throw();
    });

    it("doesn't throw if context is ommitted", function() {
      expect(function() {
        scrollimator.watch(nodes[0], props[0], cbs[0]);
      }).to.not.throw();

      expect(function() {
        scrollimator.watch(nodes[0], props[0], cbs[0], undefined);
      }).to.not.throw();

      expect(function() {
        scrollimator.watch(nodes[0], cbs[0]);
      }).to.not.throw();

      expect(function() {
        scrollimator.watch(nodes[0], cbs[0], undefined);
      }).to.not.throw();
    });

    it("accepts only els of type `Node`, `Nodelist`, or `HTMLCollection`",
     function() {
        expect(function() {
          scrollimator.watch(nodes, props[0], cbs[0]);
        }).to.not.throw();

        var htmlCollection = this.document.forms;
        expect(function() {
          scrollimator.watch(htmlCollection, props[0], cbs[0]);
        }).to.not.throw();

        expect(function() {
          scrollimator.watch(nodes[0], props[0], cbs[0]);
        }).to.not.throw();

        expect(function() {
          scrollimator.watch(fixture.window, props[0], cbs[0]);
        }).to.throw();

        forJunk(function(junk) {
          expect(function() {
            scrollimator.watch(junk, props[0], cbs[0]);
          }).to.throw();
        });
      });

    it("calls itself on each node in a `NodeList` `el`", function() {
      var nodeList = fixture.document.getElementsByTagName(tagName);
      scrollimator.watch(nodeList, props[0], cbs[0]);
      expect(scrollimator.numWatched()).to.equal(nodeList.length);
    });
  });

  describe("#unwatch", function() {
    var scrollimator;
    var nodes, props, cbs;

    beforeEach(function() {
      var tagName = "section";
      for(var i=0; i < 3; i++) {
        fixture.document.body.appendChild(
          fixture.document.createElement(tagName));
      }
      nodes = fixture.document.getElementsByTagName(tagName);
      props = ["foo", "bar", "baz"];
      cbs = [
        function(){},
        function(){},
        function(){},
      ];

      scrollimator = new Scrollimator(fixture.window);

      // watch all combos
      for(var j=0; j < props.length; j++) {
        for(var k=0; k < cbs.length; k++) {
          scrollimator.watch(nodes, props[j], cbs[k]);
        }
      }
    });

    afterEach(function() {
      scrollimator.destroy();
      scrollimator = null;
      for(var i=0; i < nodes.length; i++) {
        nodes[i] = null;
      }
    });

    it("throws if called with no arguments", function() {
      expect(function(){
        scrollimator.unwatch();
      }).to.throw();
    });

    it("accepts only els of type `Node` or `Nodelist`", function() {
      expect(function() {
        scrollimator.unwatch(nodes, props[0], cbs[0]);
      }).to.not.throw();

      expect(function() {
        scrollimator.unwatch(nodes[0], props[0], cbs[0]);
      }).to.not.throw();

      expect(function() {
        scrollimator.unwatch(fixture.window, props[0], cbs[0]);
      }).to.throw();

      forJunk(function(junk) {
        expect(function() {
          scrollimator.unwatch(junk, props[0], cbs[0]);
        }).to.throw();
      }, { undefineds: false });
    });

    it("calls itself on each node in a `NodeList` `el`", function() {
      for(var i=0; i < props.length; i++) {
        for(var j=0; j < cbs.length; j++) {
          scrollimator.unwatch(nodes, props[i], cbs[j]);
          var isLast = i === props.length -1 && j === cbs.length - 1;
          if( !isLast ) {
            expect(scrollimator.numWatched()).to.equal(nodes.length);
          } else {
            expect(scrollimator.numWatched()).to.equal(0);
          }
        }
      }
    });

    it("doesn't throw if asked to unwatch unwatched", function() {
      var fakeNode = fixture.document.createElement("div");
      var fakeProperty = "arglebargle";
      var fakeCallback = function(){};

      expect(function(){
        scrollimator.unwatch(fakeNode);
      }).to.not.throw();
      expect(function(){
        scrollimator.unwatch(fakeNode, fakeProperty);
      }).to.not.throw();
      expect(function(){
        scrollimator.unwatch(fakeNode, fakeProperty, fakeCallback);
      }).to.not.throw();

      expect(function(){
        scrollimator.unwatch(fakeProperty);
      }).to.not.throw();
      expect(function(){
        scrollimator.unwatch(fakeProperty, fakeCallback);
      }).to.not.throw();

      expect(function(){
        scrollimator.unwatch(fakeCallback);
      }).to.not.throw();
    });


    it("unwatches at el", function() {
      var remainingNodes;
      for(var i=0; i < nodes.length; i++) {
        scrollimator.unwatch(nodes[i]);

        remainingNodes = nodes.length - i - 1;
        expect(scrollimator.numWatched()).to.equal(remainingNodes);
      }
    });

    it("unwatches at el-property", function() {
      var remainingNodes, isLastOnTarget;
      for(var i=0; i < nodes.length; i++) {
        for(var j=0; j < props.length; j++) {
          scrollimator.unwatch(nodes[i], props[j]);

          isLastOnTarget =
            j === props.length - 1;
          if( !isLastOnTarget ) {
            remainingNodes = nodes.length - i;
          } else {
            remainingNodes = nodes.length - i - 1;
          }
          expect(scrollimator.numWatched()).to.equal(remainingNodes);
        }
      }
    });

    it("unwatches at el-property-callback", function() {
      var remainingNodes, isLastOnTarget;
      for(var i=0; i < nodes.length; i++) {
        for(var j=0; j < props.length; j++) {
          for(var k=0; k < cbs.length; k++) {
            scrollimator.unwatch(nodes[i], props[j], cbs[k]);

            isLastOnTarget =
              k === cbs.length - 1 &&
              j === props.length - 1;
            if( !isLastOnTarget ) {
              remainingNodes = nodes.length - i;
            } else {
              remainingNodes = nodes.length - i - 1;
            }
            expect(scrollimator.numWatched()).to.equal(remainingNodes);
          }
        }
      }
    });

    it("unwatches at property", function() {
      for(var i=0; i < props.length; i++) {
        scrollimator.unwatch(props[i]);
        if(i < props.length - 1) {
          expect(scrollimator.numWatched()).to.equal(nodes.length);
        } else {
          expect(scrollimator.numWatched()).to.equal(0);
        }
      }
    });

    it("unwatches at property-callback", function() {
      for(var i=0; i < props.length; i++) {
        for(var j=0; j < cbs.length; j++) {
          scrollimator.unwatch(props[i], cbs[j]);
          var isLastBinding =
            i === props.length - 1 &&
            j === cbs.length - 1;
          if(!isLastBinding) {
            expect(scrollimator.numWatched()).to.equal(nodes.length);
          } else {
            expect(scrollimator.numWatched()).to.equal(0);
          }
        }
      }
    });

    it("unwatches at callback", function() {
      for(var i=0; i < cbs.length; i++) {
        scrollimator.unwatch(cbs[i]);
        if(i < props.length - 1) {
          expect(scrollimator.numWatched()).to.equal(nodes.length);
        } else {
          expect(scrollimator.numWatched()).to.equal(0);
        }
      }
    });

    it("reverses any changes made to target els by watch", function() {
      var node;
      var prop = props[0];
      var cb = cbs[0];

      node = fixture.document.createElement("div");
      testNodeUnchanged(node, function() {
        scrollimator.watch(node, prop, cb);
        scrollimator.unwatch(node);
      });

      node = fixture.document.createElement("div");
      testNodeUnchanged(node, function() {
        scrollimator.watch(node, prop, cb);
        scrollimator.unwatch(node, prop);
      });

      node = fixture.document.createElement("div");
      testNodeUnchanged(node, function() {
        scrollimator.watch(node, prop, cb);
        scrollimator.unwatch(node, prop, cb);
      });

      node = fixture.document.createElement("div");
      testNodeUnchanged(node, function() {
        scrollimator.watch(node, prop, cb);
        scrollimator.unwatch(prop);
      });

      node = fixture.document.createElement("div");
      testNodeUnchanged(node, function() {
        scrollimator.watch(node, prop, cb);
        scrollimator.unwatch(prop, cb);
      });

      node = fixture.document.createElement("div");
      testNodeUnchanged(node, function() {
        scrollimator.watch(node, prop, cb);
        scrollimator.unwatch(cb);
      });

      node = null;

    });
  });

  // TODO cleanup
  describe("#update", function() {

    var setupForUpdate = function setupForUpdate() {
      beforeEach(function() {
        this.scrollimatorNode = this.document.createElement("div");
        this.targetNode = this.document.createElement("div");

        this.scrollimatorNode.appendChild(this.targetNode);
        this.document.body.appendChild(this.scrollimatorNode);

        this.scrollimatorProps = rectHelper.rectify({}, 0, 0, 100, 100);
        this.targetProps = rectHelper.rectify({}, 0, 0, 10, 10);
        rectHelper.moveEdge(this.scrollimatorProps, "top", 17);
        rectHelper.moveEdge(this.scrollimatorProps, "left", 17);
        rectHelper.moveEdge(this.targetProps, "top", 17);
        rectHelper.moveEdge(this.targetProps, "left", 17);

        // Mock out boundingBoxStrategy for scrollimator and targets
        var fixture = this;
        this.mockScrollimatorUpdateStrategy =
          sinon.spy(function(el, props, parentProps) {
            extend(props, fixture.scrollimatorProps);
          });
        this.mockTargetUpdateStrategy =
          sinon.spy(function(el, props, parentProps) {
            extend(props, fixture.targetProps);
          });

        var targetUpdateStrategies =
          Array.prototype.slice
            .call(Scrollimator.defaults.targetUpdateStrategies);
        targetUpdateStrategies.shift(); // Remove position strat
        targetUpdateStrategies.unshift(this.mockTargetUpdateStrategy);

        this.scrollimator = new Scrollimator(this.scrollimatorNode, {
          // We don't want update to be called except when we call it.
          // so stub out bindUpdate and unbindUpdate
          bindUpdate: sinon.stub(),
          unbindUpdate: sinon.stub(),
          scrollimatorUpdateStrategies: [this.mockScrollimatorUpdateStrategy],
          targetUpdateStrategies: targetUpdateStrategies
        });

        this.callbackContext = {};

        this.allSpy = sinon.spy(function(changedProps, allProps){
        });
        this.scrollimator.watch(
          this.targetNode,
          "all",
          this.allSpy,
          this.callbackContext);
      });

      afterEach(function() {
        this.scrollimator.destroy();
      });

    };

    /**
     * Helper function for quickly verifying values of
     * the "all" callback result object.
     */
    var resultHas = function(key, comparison, value1, value2) {
      var valueString;
      switch(comparison) {
        case "within":
          valueString = value1 + "and" + value2;
          break;
        case "isNaN":
          valueString = "";
          break;
        default:
          valueString = "" + value1;
      }

      it("reports " + key + " " + comparison + " " + valueString, function() {
        this.scrollimator.update();
        var resultObject = this.allSpy.lastCall.args[1];
        expect(resultObject).to.include.key(key);
        var resultValue = resultObject[key];

        switch(comparison) {
          case "atMost" :
            expect(resultValue).to.be.at.most(value1);
            break;
          case "atLeast" :
            expect(resultValue).to.be.at.least(value1);
            break;
          case "within" :
            expect(resultValue)
              .to.be.within(value1,value2);
            break;
          case "equalTo" :
            expect(resultValue).to.equal(value1);
            break;
          case "isNaN":
            // NaN !== NaN
            expect(resultValue).to.not.equal(resultValue);
            break;
          default:
            expect(resultValue).to.be[comparison](value1);
        }
      });
    };

    describe("horizontal", function() {
      perAxis("horizontal");
    });

    describe("vertical", function() {
      perAxis("vertical");
    });

    /**
     * Scenarios and expectations that are true for each axis.
     */
    function perAxis(axis) {
      var NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;
      var POSITIVE_INFINITY = Number.POSITIVE_INFINITY;

      setupAxis(axis);
      var stateKey = axis + "State";
      var visibleProgressKey = axis + "VisibleProgress";
      var containedProgressKey = axis + "ContainedProgress";
      var nearKey = constants.axisKeys[axis].near;
      var farKey = constants.axisKeys[axis].far;
      var nearProgressKey = nearKey + "Progress";
      var farProgressKey = farKey + "Progress";

      // Behaviors shared in scenarios that also have
      // some unique behavior at each size
      var sharedBehaviors = {

        targetAhead: function(cb) {
          describe("when targetAhead", function() {
            targetPositionSetups.targetAhead();

            resultHas(nearProgressKey, "below", 0);
            resultHas(farProgressKey, "below", 0);
            resultHas(visibleProgressKey, "below", 0);
            resultHas(stateKey, "equalTo", "ahead");

            cb.call(this);
          });
        },

        targetNearFlushFar: function(cb) {
          describe("when targetNearFlushFar", function() {
            targetPositionSetups.targetNearFlushFar();

            resultHas(nearProgressKey, "equalTo", 0);
            resultHas(farProgressKey, "atMost", 0);
            resultHas(visibleProgressKey, "equalTo", 0);
            resultHas(stateKey, "equalTo", "entering");

            cb.call(this);
          });
        },

        targetSpanningFar: function(cb) {
          describe("when targetSpanningFar", function() {
            targetPositionSetups.targetSpanningFar();

            resultHas(nearProgressKey, "within", 0, 1);
            resultHas(farProgressKey, "atMost", 0);
            resultHas(visibleProgressKey, "within", 0, 1);
            resultHas(stateKey, "equalTo", "entering");

            cb.call(this);
          });
        },

        targetFarFlushFar: function(cb) {
          describe("when targetFarFlushFar", function() {
            targetPositionSetups.targetFarFlushFar();

            resultHas(nearProgressKey, "atLeast", 0);
            resultHas(farProgressKey, "equalTo", 0);
            resultHas(visibleProgressKey, "within", 0, 1);

            cb.call(this);
          });
        },

        targetCentered: function(cb) {
          describe("when targetCentered", function() {
            targetPositionSetups.targetCentered();

            resultHas(nearProgressKey, "atLeast", 0.5);
            resultHas(farProgressKey, "atMost", 0.5);
            resultHas(visibleProgressKey, "within", 0, 1);

            cb.call(this);
          });
        },

        targetNearFlushNear: function(cb) {
          describe("when targetNearFlushNear", function() {
            targetPositionSetups.targetNearFlushNear();

            resultHas(nearProgressKey, "equalTo", 1);
            resultHas(farProgressKey, "atMost", 1);
            resultHas(visibleProgressKey, "within", 0, 1);

            cb.call(this);
          });
        },

        targetSpanningNear: function(cb) {
          describe("when targetSpanningNear", function() {
            targetPositionSetups.targetSpanningNear();

            resultHas(nearProgressKey, "atLeast", 1);
            resultHas(farProgressKey, "within", 0, 1);
            resultHas(visibleProgressKey, "within", 0, 1);
            resultHas(stateKey, "equalTo", "exiting");

            cb.call(this);
          });
        },

        targetFarFlushNear: function(cb) {
          describe("when targetFarFlushNear", function() {
            targetPositionSetups.targetFarFlushNear();

            resultHas(nearProgressKey, "atLeast", 1);
            resultHas(farProgressKey, "equalTo", 1);
            resultHas(visibleProgressKey, "equalTo", 1);
            resultHas(stateKey, "equalTo", "exiting");

            cb.call(this);
          });
        },

        targetBehind: function(cb) {
          describe("when targetBehind", function() {
            targetPositionSetups.targetBehind();

            resultHas(nearProgressKey, "above", 1);
            resultHas(farProgressKey, "above", 1);
            resultHas(visibleProgressKey, "above", 1);
            resultHas(stateKey, "equalTo", "behind");

            cb.call(this);
          });
        }

      };

      var targetSizeSetups = {
        describeSmallerThanScrollimator: function(cb) {
          describe("when target is smaller than scrollimator", function() {
            setupForUpdate();
            beforeEach(function() {
              var scrollimatorProps = this.scrollimatorProps;
              this.targetProps = rectHelper.rectify(
                {},
                scrollimatorProps.left,
                scrollimatorProps.top,
                scrollimatorProps.right,
                scrollimatorProps.bottom);
                rectHelper.setWidth(
                  this.targetProps,
                  0.5*scrollimatorProps.width);
                rectHelper.setHeight(
                  this.targetProps,
                  0.5*scrollimatorProps.height);
            });
            cb.call(this);
          });
        },

        describeMatchingScrollimator: function(cb) {
          describe("when target is same size as scrollimator", function() {
            setupForUpdate();
            beforeEach(function() {
              this.targetProps = rectHelper.rectify(
                {},
                this.scrollimatorProps.left,
                this.scrollimatorProps.top,
                this.scrollimatorProps.right,
                this.scrollimatorProps.bottom);
            });
            cb.call(this);
          });
        },

        describeLargerThanScrollimator: function(cb) {
          describe("when target is larger than scrollimator", function() {
            setupForUpdate();
            beforeEach(function() {
              var scrollimatorProps = this.scrollimatorProps;
              this.targetProps = rectHelper.rectify(
                {},
                scrollimatorProps.left,
                scrollimatorProps.top,
                scrollimatorProps.right,
                scrollimatorProps.bottom);
              rectHelper.setWidth(
                this.targetProps,
                2*scrollimatorProps.width);
              rectHelper.setHeight(
                this.targetProps,
                2*scrollimatorProps.height);
            });
            cb.call(this);
          });
        }
      };

      targetSizeSetups.describeSmallerThanScrollimator(function() {
        sharedBehaviors.targetAhead(function() {
          resultHas(containedProgressKey, "below", 0);
        });
        sharedBehaviors.targetNearFlushFar(function() {
          resultHas(containedProgressKey, "atMost", 0);
        });
        sharedBehaviors.targetSpanningFar(function() {
          resultHas(containedProgressKey, "atMost", 0);
        });
        sharedBehaviors.targetFarFlushFar(function() {
          resultHas(containedProgressKey, "equalTo", 0);
          resultHas(stateKey, "equalTo", "contained");
        });
        sharedBehaviors.targetCentered(function() {
          resultHas(containedProgressKey, "within", 0, 1);
          resultHas(stateKey, "equalTo", "contained");
        });
        sharedBehaviors.targetNearFlushNear(function() {
          resultHas(containedProgressKey, "equalTo", 1);
          resultHas(stateKey, "equalTo", "contained");
        });
        sharedBehaviors.targetSpanningNear(function() {
          resultHas(containedProgressKey, "atLeast", 1);
        });
        sharedBehaviors.targetFarFlushNear(function() {
          resultHas(containedProgressKey, "atLeast", 1);
        });
        sharedBehaviors.targetBehind(function() {
          resultHas(containedProgressKey, "above", 1);
        });
      });

      targetSizeSetups.describeMatchingScrollimator(function() {
        sharedBehaviors.targetAhead(function() {
          resultHas(containedProgressKey, "equalTo", NEGATIVE_INFINITY);
        });
        sharedBehaviors.targetNearFlushFar(function() {
          resultHas(containedProgressKey, "equalTo", NEGATIVE_INFINITY);
        });
        sharedBehaviors.targetSpanningFar(function() {
          resultHas(containedProgressKey, "equalTo", NEGATIVE_INFINITY);
        });
        sharedBehaviors.targetFarFlushFar(function() {
          resultHas(containedProgressKey, "equalTo", 1);
          resultHas(stateKey, "equalTo", "matching");
        });
        sharedBehaviors.targetCentered(function() {
          resultHas(containedProgressKey, "equalTo", 1);
          resultHas(stateKey, "equalTo", "matching");
        });
        sharedBehaviors.targetNearFlushNear(function() {
          resultHas(containedProgressKey, "equalTo", 1);
          resultHas(stateKey, "equalTo", "matching");
        });
        sharedBehaviors.targetSpanningNear(function() {
          resultHas(containedProgressKey, "equalTo", POSITIVE_INFINITY);
        });
        sharedBehaviors.targetFarFlushNear(function() {
          resultHas(containedProgressKey, "equalTo", POSITIVE_INFINITY);
        });
        sharedBehaviors.targetBehind(function() {
          resultHas(containedProgressKey, "equalTo", POSITIVE_INFINITY);
        });
      });

      targetSizeSetups.describeLargerThanScrollimator(function() {
        sharedBehaviors.targetAhead(function() {
          resultHas(containedProgressKey, "isNaN");
        });
        sharedBehaviors.targetNearFlushFar(function() {
          resultHas(containedProgressKey, "isNaN");
        });
        sharedBehaviors.targetSpanningFar(function() {
          resultHas(containedProgressKey, "isNaN");
        });
        sharedBehaviors.targetFarFlushFar(function() {
          resultHas(containedProgressKey, "isNaN");
          resultHas(stateKey, "equalTo", "exiting");
        });
        sharedBehaviors.targetCentered(function() {
          resultHas(containedProgressKey, "isNaN");
          resultHas(stateKey, "equalTo", "spanning");
        });
        sharedBehaviors.targetNearFlushNear(function() {
          resultHas(containedProgressKey, "isNaN");
          resultHas(stateKey, "equalTo", "entering");
        });
        sharedBehaviors.targetSpanningNear(function() {
          resultHas(containedProgressKey, "isNaN");
        });
        sharedBehaviors.targetFarFlushNear(function() {
          resultHas(containedProgressKey, "isNaN");
        });
        sharedBehaviors.targetBehind(function() {
          resultHas(containedProgressKey, "isNaN");
        });
      });
    } // end perAxis

    describe("notifies property listeners", function() {
      setupForUpdate();

      beforeEach(function() {
        // TODO this is gross. refactor setup code
        this.scrollimator.destroy();
        this.scrollimator = new Scrollimator(this.scrollimatorNode, {
          // We don't want update to be called except when we call it.
          // so stub out bindUpdate and unbindUpdate
          bindUpdate: sinon.stub(),
          unbindUpdate: sinon.stub(),
          scrollimatorUpdateStrategies: [this.mockScrollimatorUpdateStrategy],
          targetUpdateStrategies: [this.mockTargetUpdateStrategy]
        });

        this.allSpy = sinon.spy();
        this.fooSpy = sinon.spy();
        this.barSpy = sinon.spy();

        this.scrollimator.watch(
          this.targetNode, "all", this.allSpy, this.callbackContext);
        this.scrollimator.watch(
          this.targetNode, "foo", this.fooSpy, this.callbackContext);
        this.scrollimator.watch(
          this.targetNode, "bar", this.barSpy, this.callbackContext);

        this.scrollimator.update();
        this.allSpy.reset();
        this.fooSpy.reset();
        this.barSpy.reset();
      });

      it("requires no arguments", function() {
        var fixture = this;
        expect(function() {
          fixture.scrollimator.update();
        }).to.not.throw();
      });

      it("notifies listeners when corresponding property changes", function () {
        this.targetProps.foo = "arglebargle";
        this.scrollimator.update();
        expect(this.fooSpy.callCount).to.equal(1);
        expect(this.barSpy.callCount).to.equal(0);
      });

      it("notifies listeners with [key, value] and bound context", function() {
        var value = 9001;
        this.targetProps.foo = value;
        this.scrollimator.update();
        expect(this.fooSpy).to.have.been.calledWithExactly("foo", value);
        expect(this.fooSpy).to.have.been.calledOn(this.callbackContext);
      });

      it("notifies \"all\" in batch when any property changes", function() {
        var changes = {
          foo: "arglebargle",
          baz: -Number.NEGATIVE_INFINITY
        };

        extend(this.targetProps, changes);
        this.scrollimator.update();

        expect(this.allSpy.callCount).to.equal(1);
        expect(this.allSpy.lastCall.args[0]).to.deep.equal(changes);
        expect(this.allSpy.lastCall.args[1]).to.deep.equal(this.targetProps);
        expect(this.allSpy).to.have.been.calledOn(this.callbackContext);
      });
    });

  });

  describe("#destroy", function() {
    var numUnbindCalls, numBindCalls;
    var options;
    var someNode, someOtherNode, scrollimator;

    beforeEach(function() {
      someNode = document.createElement("div");
      someOtherNode = document.createElement("div");
      numUnbindCalls = 0;
      numBindCalls = 0;
      options = {
        bindUpdate: sinon.spy(Scrollimator.defaults.bindUpdate) ,
        unbindUpdate: sinon.spy(Scrollimator.defaults.unbindUpdate)
      };
    });

    afterEach(function() {
      scrollimator = null;
      someNode = null;
    });

    it("returns the Scrollimator el to it's original state", function() {
      //var scrollimator = new Scrollimator(someNode);
      //expect(Scrollimator.getScrollimatorId(someNode)).to.equal(scrollimator.getId());
      //scrollimator.destroy();
      //expect(Scrollimator.getScrollimatorId(someNode)).to.equal(undefined);

      testNodeUnchanged(someNode, function(){
        var scrollimator = new Scrollimator(someNode, options);
        scrollimator.destroy();
      });

      // TODO This could easily be wrong since window persists through tests.
      //      Perhaps we can use a window mock?
      testNodeUnchanged(fixture.window, function() {
        var scrollimator = new Scrollimator(someNode, options);
        scrollimator.destroy();
      });
    });

    it("calls unbindUpdate once for every bindUpdate called", function() {
      var scrollimator = new Scrollimator(fixture.window, options);
      scrollimator.destroy();
      expect(options.unbindUpdate.callCount)
        .to.equal(options.bindUpdate.callCount);

      scrollimator = new Scrollimator(fixture.window, options);
      scrollimator.watch(someNode, function(){});
      scrollimator.destroy();
      expect(options.unbindUpdate.callCount)
        .to.equal(options.bindUpdate.callCount);

      scrollimator = new Scrollimator(fixture.window, options);
      scrollimator.watch(someNode, function(){});
      scrollimator.unwatch(someNode);
      scrollimator.destroy();
      expect(options.unbindUpdate.callCount)
        .to.equal(options.bindUpdate.callCount);

      scrollimator = new Scrollimator(fixture.window, options);
      scrollimator.watch(someNode, function(){});
      scrollimator.watch(someOtherNode, function(){});
      scrollimator.unwatchAll();
      scrollimator.destroy();
      expect(options.unbindUpdate.callCount)
        .to.equal(options.bindUpdate.callCount);

      scrollimator = new Scrollimator(fixture.window, options);
      scrollimator.watch(someNode, function(){});
      scrollimator.reset();
      scrollimator.destroy();
      expect(options.unbindUpdate.callCount)
        .to.equal(options.bindUpdate.callCount);
    });

  });


});
