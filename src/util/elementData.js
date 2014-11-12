module.exports = elementData;

var isWindow = require("src/util/isWindow");

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

