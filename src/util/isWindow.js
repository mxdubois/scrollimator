module.exports = function isWindow(obj) {
  "use strict";
  return (typeof obj === "object" &&
    obj !== null &&
    obj["setInterval"] !== undefined); // jshint ignore:line
};

