var constants = {
  VERTICAL: "vertical",
  HORIZONTAL: "horizontal",
  DATA_PREFIX : "data-Scrollanism-",
  KEY_DELIMITER: "-",
  KEY_SCROLLIMATOR_ID : "id",
  KEY_TARGET_ID : "targetId",
  UID_LENGTH : 16,
  states : {
    CONTAINED : "contained",
    SPANNING : "spanning",
    ENTERING : "entering",
    EXITING : "exiting",
    AHEAD : "ahead",
    BEHIND : "behind"
  },
  axisKeys: {}
};

constants.axisKeys[constants.VERTICAL] = {
  near: "top",
  far: "bottom",
  length: "height"
};

constants.axisKeys[constants.HORIZONTAL] = {
  near: "left",
  far: "right",
  length: "width"
};

module.exports = constants;
