module.exports = function(obj) {
  "use strict";
  return Object.prototype.toString.call( obj ) === '[object Object]';
};
