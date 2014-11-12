module.exports = {

  rectify: function(rect, left, top, right, bottom) {
    rect.left = left;
    rect.top = top;
    rect.right = right;
    rect.bottom = bottom;

    rect.width = rect.right - rect.left;
    rect.height = rect.bottom - rect.top;

    if(rect.width < 0 || rect.height < 0) {
      throw new Error("Negative dimension. Order is: left, top, right, bottom");
    }
    return rect;
  },

  setWidth: function(rect, value) {
    rect.width = value;
    rect.right = rect.left + value;
  },

  setHeight: function(rect, value) {
    rect.height = value;
    rect.bottom = rect.top + value;
  },

  moveEdge: function(rect, edgeKey, value) {
    var multiplier = 1,
      oppositeKey,
      lengthKey = "width";

    if(edgeKey === "left") {
      oppositeKey = "right";
    } else if(edgeKey === "right") {
      oppositeKey = "left";
      multiplier = -1;
    } else if(edgeKey === "top") {
      oppositeKey = "bottom";
      lengthKey = "width";
      lengthKey = "height";
    }else if(edgeKey === "bottom") {
      oppositeKey = "top";
      lengthKey = "height";
      multiplier = -1;
    }

    if( !Object.prototype.hasOwnProperty.call(rect, edgeKey) ) {
      throw new Error("rect doesn't have `" + edgeKey + "`");
    }

    if(!Object.prototype.hasOwnProperty.call(rect, oppositeKey)) {
      throw new Error("rect doesn't have `" + oppositeKey + "`");
    }

    if(!Object.prototype.hasOwnProperty.call(rect, lengthKey)) {
      throw new Error("rect doesn't have `" + lengthKey + "`");
    }

    rect[edgeKey] = value;
    rect[oppositeKey] = rect[edgeKey] + multiplier * rect[lengthKey];

  },

  moveLeftTo: function(rect, value) {
    rect.left = value;
    rect.right = value + rect.width;
  },

  moveTopTo: function(rect, value) {
    rect.top = value;
    rect.bottom = value + rect.height;
  },

  moveBottomTo: function(rect, value) {
    rect.bottom = value;
    rect.top = value - rect.height;
  },

  moveRightTo: function(rect, value) {
    rect.right = value;
    rect.left = value - rect.width;
  }
};

