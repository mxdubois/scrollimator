"use strict";

var setupFixture = require("test/setups/setupBrowserFixture");

var  isWindow = require("src/util/isWindow");

describe("isWindow", function() {

  setupFixture();
  var html = '<body><div id="myDiv"></div></body>';

  beforeEach(function() {
    this.document.innerHtml = html;
  });

  it("should return true when given the window", function() {
    expect(isWindow(this.window)).to.equal(true);
  });

  it("should return false when given anything else", function() {
    var myDiv = this.document.getElementById("myDiv");
    expect(isWindow(myDiv)).to.equal(false);

    var fakeWindow1 = {};
    fakeWindow1.window = fakeWindow1;
    expect(isWindow(fakeWindow1)).to.equal(false);

    function Window() {
      this.window = this;
    }
    var fakeWindow2 = new Window();
    expect(isWindow(fakeWindow2)).to.equal(false);

    expect(isWindow(true)).to.equal(false);
    expect(isWindow(false)).to.equal(false);
    expect(isWindow(-1)).to.equal(false);
    expect(isWindow(0)).to.equal(false);
    expect(isWindow(1)).to.equal(false);
    expect(isWindow({})).to.equal(false);
    expect(isWindow(undefined)).to.equal(false);
    expect(isWindow(null)).to.equal(false);
    expect(isWindow([])).to.equal(false);
    expect(isWindow(function(){})).to.equal(false);
  });
});
