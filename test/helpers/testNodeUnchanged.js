/* globals expect */

module.exports = testNodeUnchanged;

var each = require("util-each");

function getKeys(node) {
  "use strict";
  var keys = [];
  for(var key in node) {
    if(node.hasOwnProperty(key)) {
      keys.push(key);
    }
  }
  return keys;
}

function getNodeAttributeNames(node) {
  "use strict";
  var attributeNames = [];
  each(node.attributes, function(attributeNode, i) {
    attributeNames.push(attributeNode.name);
  });
  return attributeNames;
}

function testNodeUnchanged(node, cb, ctx) {
  "use strict";
  var attributeNamesBefore = getNodeAttributeNames(node);
  var keysBefore = getKeys(node);

  cb.call(ctx);

  var attributeNamesAfter = getNodeAttributeNames(node);
  var keysAfter = getKeys(node);

  expect(keysBefore).to.have.members(keysAfter);

  expect(attributeNamesBefore).to.have.members(attributeNamesAfter);
}
