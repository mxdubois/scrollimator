/* globals describe, expect, beforeEach, afterEach, it*/

var setupFixture = require("test/setups/setupBrowserFixture"),
    forJunk = require("test/helpers/forJunk");

var elementData = require("src/util/elementData");

describe("elementData", function() {
  "use strict";

  setupFixture();
  var html = "<head></head><body></body>";
  var fixture, someNode, someOtherNode;

  beforeEach(function(){
    fixture = this;
    this.document.innerHTML = html;

    expect(fixture.window).to.not.equal(undefined);
    expect(fixture.document).to.not.equal(undefined);

    someNode = fixture.document.createElement("div");
    someOtherNode = fixture.document.createElement("div");

    fixture.document.body.appendChild(someNode);
    fixture.document.body.appendChild(someOtherNode);
  });

  afterEach(function() {
    someNode = null;
    someOtherNode = null;
  });

  it("should throw if `el` is not given", function() {
    expect(function() {
        elementData();
    }).to.throw();
    expect(function() {
        elementData(undefined, "foo");
    }).to.throw();
    expect(function() {
        elementData(undefined, "foo", "bar");
    }).to.throw();
  });

  it("should throw if `key` is not given", function() {
    expect(function() {
        elementData(fixture.window);
    }).to.throw();

    expect(function() {
        elementData(someNode);
    }).to.throw();
  });

  it("should only get from `Node` and `Window` objects", function() {
    var key = "foo";

    expect(function() {
        elementData(someNode, key);
    }).to.not.throw();

    expect(function() {
        elementData(fixture.window, key);
    }).to.not.throw();

    forJunk(function(junk) {
      expect(function() {
        elementData(junk, key);
      }).to.throw();
    });
  });

  it("should retrieve `undefined` from objects without value set", function() {
    var key1 = "foo";
    var key2 = "arglebargle"; // A key we have not used before, to be safe
    expect(elementData(someOtherNode, key1)).to.equal(undefined);
    expect(elementData(someOtherNode, key2)).to.equal(undefined);
    expect(elementData(fixture.window, key1)).to.equal(undefined);
    expect(elementData(fixture.window, key2)).to.equal(undefined);
  });

  it("should only set on `Node` and `Window` objects", function() {
    var key = "foo";
    var value = "bar";

    expect(function() {
        elementData(someNode, key, value);
    }).to.not.throw();

    expect(function() {
        elementData(fixture.window, key, value);
    }).to.not.throw();

    forJunk(function(junk) {
      expect(function() {
        elementData(junk, key, value);
      }).to.throw();
    });
  });

  it("should retrieve the same value it sets", function() {
    var key = "foo";
    var value = "bar";

    elementData(someNode, key, value);
    expect(elementData(someNode, key, value)).to.equal(value);

    elementData(fixture.window, key, value);
    expect(elementData(fixture.window, key)).to.equal(value);
  });

  it("should overwrite previously set ids", function() {
    var key = "foo";
    var value1 = "bar";
    var value2 = "baz";
    elementData(fixture.window, key, value1);
    elementData(fixture.window, key, value2);
    expect(elementData(fixture.window, key)).to.equal(value2);

    elementData(someNode, key, value1);
    elementData(someNode, key, value2);
    expect(elementData(someNode, key)).to.equal(value2);
  });

  it("should clear ids set to `null`", function() {
    var key = "foo";
    var value = "bar";

    expect(elementData(fixture.window, key, value));
    expect(elementData(fixture.window, key, null));
    expect(elementData(fixture.window, key)).to.equal(undefined);

    expect(elementData(someNode, key, value));
    expect(elementData(someNode, key, null));
    expect(elementData(someNode, key)).to.equal(undefined);
  });

});
