/* globals sinon, expect, describe, it, before, beforeEach, after, afterEach */

var setupFixture = require("test/setups/setupBrowserFixture"),
    forJunk = require("test/helpers/forJunk");

var Watchable = require("src/Watchable");

describe("Watchable", function() {
  "use strict";

  var fixture;
  setupFixture();

  beforeEach(function() {
    fixture = this;
  });

  afterEach(function() {
  });

  describe("(constructor)", function() {

  });

  describe("#getId", function() {
    var watchable1, watchable2;

    beforeEach(function() {
      watchable1 = new Watchable();
      watchable2 = new Watchable();
    });

    afterEach(function() {
      watchable1.destroy();
      watchable2.destroy();
    });

    it("return a unique string id", function() {
      var id1 = watchable1.getId();
      var id2 = watchable2.getId();
      expect(id1).to.be.a("string");
      expect(id2).to.be.a("string");
      expect(id1).to.not.equal(id2);
    });
  });

  describe("#isWatched", function() {
    var watchable;

    beforeEach(function() {
      watchable = new Watchable();
    });

    afterEach(function() {
      watchable.destroy();
      watchable = null;
    });

    it("return false by default", function() {
      expect(watchable.isWatched()).to.equal(false);
    });
  });

  describe("#watch", function() {
    var watchable;

    beforeEach(function() {
      watchable = new Watchable();
    });

    afterEach(function() {
      watchable.destroy();
      watchable = null;
    });

    it("throws if no arguments are given", function() {
      expect(function() {
        watchable.watch();
      }).to.throw();
    });

    it("accepts only strings as `property`s", function() {
      forJunk(function(junk) {
        expect(function() {
          watchable.watch(junk, function(){});
        }).to.throw();
      }, { strings: false, functions: false, undefineds: false });
    });

    it("watches the \"all\" property if `property` is omitted", function() {
        expect(function() {
          watchable.watch(function(){});
        }).to.not.throw();
        expect(watchable.isWatched()).to.equal(true);
        expect(watchable.numWatchedProperties()).to.equal(1);
        expect(watchable.numBindings()).to.equal(1);
    });

    it("changes isWatched state to true", function() {
      watchable.watch("foo", function(){});
      expect(watchable.isWatched()).to.equal(true);
      watchable.watch("bar", function(){});
      expect(watchable.isWatched()).to.equal(true);
    });

    it("increments numWatchedProperties ONLY for new props", function() {
      var oldNum = watchable.numWatchedProperties();
      var newNum;

      // New prop
      watchable.watch("foo", function(){});
      newNum = watchable.numWatchedProperties();
      expect(newNum).to.be.above(oldNum);
      oldNum = newNum;

      // Old prop
      watchable.watch("foo", function(){});
      newNum = watchable.numWatchedProperties();
      expect(newNum).to.equal(oldNum);
      oldNum = newNum;

      // New prop
      watchable.watch("bar", function(){});
      newNum = watchable.numWatchedProperties();
      expect(newNum).to.be.above(oldNum);
    });

    it("increments numBindings ONLY for new unique combos", function() {
      var cb1 = function() {},
        cb2 = function(){};
      var newNum = watchable.numBindings();
      var oldNum = newNum;

      // Unique callback and combo
      watchable.watch("foo", cb1);
      newNum = watchable.numBindings();
      expect(newNum).to.be.above(oldNum);
      oldNum = newNum;

      // Unique callback and combo
      watchable.watch("foo", cb2);
      newNum = watchable.numBindings();
      expect(newNum).to.be.above(oldNum);
      oldNum = newNum;

      // Unique combo, but nonunique callback
      watchable.watch("bar", cb1);
      newNum = watchable.numBindings();
      expect(newNum).to.be.above(oldNum);
      oldNum = newNum;

      // Nonunique combo
      watchable.watch("foo", cb1);
      newNum = watchable.numBindings();
      expect(newNum).to.equal(oldNum);
      oldNum = newNum;

    });
  });

  describe("#unwatch", function() {
    var watchable,
      keys,
      cbs,
      numBound,
      numUnbound;

    beforeEach(function() {
      watchable = new Watchable();
      keys = ["foo", "bar", "baz"];
      cbs = [
        function() {},
        function() {},
        function(){}
      ];

      for(var i=0; i < keys.length; i++ ) {
        for(var j=0; j < cbs.length; j++) {
          watchable.watch(keys[i], cbs[j]);
        }
      }

      numBound = keys.length * cbs.length;
      numUnbound = 0;

      expect(watchable.numBindings()).to.equal(numBound);
      expect(watchable.numWatchedProperties()).to.equal(keys.length);
    });

    afterEach(function() {
      watchable.destroy();
      watchable = null;
    });

    it("throws if no arguments are given", function() {
      expect(function() {
        watchable.unwatch();
      }).to.throw();
    });

    it("unwatches property", function() {
      for(var i=0; i < keys.length; i++) {
        watchable.unwatch(keys[i]);

        expect(watchable.numWatchedProperties()).to.equal(keys.length - (i + 1));

        expect(watchable.numBindings()).to.equal(numBound - (i+1)*cbs.length);

        if(i < keys.length - 1) {
          expect(watchable.isWatched()).to.equal(true);
        } else {
          expect(watchable.isWatched()).to.equal(false);
        }
      }
    });

    it("unwatches property-callback", function() {
      for(var i=0; i < keys.length; i++) {
        for(var j=0; j < cbs.length; j++) {
          watchable.unwatch(keys[i], cbs[j]);

          expect(watchable.numBindings())
            .to.equal(numBound - i*cbs.length - (j + 1));

          if(j < cbs.length - 1) {
            expect(watchable.numWatchedProperties())
              .to.equal(keys.length - i);
          } else {
            expect(watchable.numWatchedProperties())
              .to.equal(keys.length - (i + 1));
          }

          if(i < keys.length - 1 || j < cbs.length - 1) {
            expect(watchable.isWatched()).to.equal(true);
          } else {
            expect(watchable.isWatched()).to.equal(false);
          }
        }
      }
    });

    it("unwatches callback", function() {
      for(var i=0; i < cbs.length; i++) {
        watchable.unwatch(cbs[i]);

        expect(watchable.numBindings()).to.equal(numBound - keys.length*(i + 1));

        if(i < cbs.length - 1) {
          expect(watchable.isWatched()).to.equal(true);
        } else {
          expect(watchable.isWatched()).to.equal(false);
        }
      }
    });

    it("no-ops for combos that are not watched", function() {
        watchable.unwatch("arglebargle");
        expect(watchable.numWatchedProperties()).to.equal(keys.length);
        expect(watchable.numBindings()).to.equal(numBound);
        expect(watchable.isWatched()).to.equal(true);

        watchable.unwatch("arglebargle", cbs[0]);
        expect(watchable.numWatchedProperties()).to.equal(keys.length);
        expect(watchable.numBindings()).to.equal(numBound);
        expect(watchable.isWatched()).to.equal(true);

        watchable.unwatch(keys[0], function(){});
        expect(watchable.numWatchedProperties()).to.equal(keys.length);
        expect(watchable.numBindings()).to.equal(numBound);
        expect(watchable.isWatched()).to.equal(true);

        watchable.unwatch(function(){});
        expect(watchable.numWatchedProperties()).to.equal(keys.length);
        expect(watchable.numBindings()).to.equal(numBound);
        expect(watchable.isWatched()).to.equal(true);
    });
  });

  describe("#unwatchAll", function() {
    var watchable;

    beforeEach(function() {
      watchable = new Watchable();
      watchable.watch("foo", function(){});
      watchable.watch("foo", function(){});
      watchable.watch("bar", function(){});
      watchable.watch("all", function(){});
      watchable.watch(function(){});
    });

    afterEach(function() {
      watchable.destroy();
      watchable = null;
    });

    it("changes isWatched state to false", function() {
      watchable.unwatchAll();
      expect(watchable.isWatched()).to.equal(false);
    });

    it("changes numWatchedProperties to zero", function() {
      watchable.unwatchAll();
      expect(watchable.numWatchedProperties()).to.equal(0);
    });

    it("changes numBindings to zero", function() {
      watchable.unwatchAll();
      expect(watchable.numBindings()).to.equal(0);
    });
  });

  describe("#set", function() {
    beforeEach(function() {
      this.watchable = new Watchable();

      this.callbackContext = {};
      this.fooSpy = sinon.spy();
      this.barSpy = sinon.spy();
      this.allSpy = sinon.spy();

      this.watchable.watch("foo", this.fooSpy, this.callbackContext);
      this.watchable.watch("bar", this.barSpy, this.callbackContext);
      this.watchable.watch("all", this.allSpy, this.callbackContext);
    });

    afterEach(function() {
      this.watchable.destroy();
      this.watchable = null;
    });

    it("calls listener at key with key, value, and context", function() {
      var key = "foo";
      var value = 1000;
      this.watchable.set(key, value);
      expect(this.fooSpy.callCount).to.equal(1);
      expect(this.fooSpy.lastCall.args).to.deep.equal([key, value]);
      expect(this.fooSpy.lastCall).to.have.been.calledOn(this.callbackContext);
    });

    it("calls all listener with maps of changed, all, and context", function() {
      // Initialize the map
      this.watchable.set("bar", "high");
      this.allSpy.reset();

      var changes = {
        foo: "arglebargle",
        baz: Number.POSITIVE_INFINITY
      };

      this.watchable.set(changes);
      expect(this.allSpy.callCount).to.equal(1);
      expect(this.allSpy.lastCall.args[0]).to.deep.equal(changes);
      expect(this.allSpy.lastCall.args[1]).to.include.key("bar");
      expect(this.fooSpy.lastCall).to.have.been.calledOn(this.callbackContext);
    });
  });

  describe("#destroy", function() {
    var watchable;

    beforeEach(function() {
      watchable = new Watchable();
    });

    afterEach(function() {
      watchable = null;
    });

    it("behaves like unwatchAll", function() {
      watchable.watch("bar", function() {});
      watchable.watch("bar", function() {});
      watchable.watch("baz", function() {});
      watchable.destroy();
      expect(watchable.numWatchedProperties()).to.equal(0);
      expect(watchable.numBindings()).to.equal(0);
      expect(watchable.isWatched()).to.equal(false);
    });
  });
});
