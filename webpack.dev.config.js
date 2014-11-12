var fs = require("fs");
var extend = require("extend");

var pkg = JSON.parse(fs.readFileSync("./package.json"));
var webpackCommon = require("./webpack.common.config.js");

module.exports = extend({}, webpackCommon, {
  entry: __dirname + "/src/Scrollimator.js",
  output: {
    path: __dirname + "/dist",
    filename: pkg.name + ".dev.js",
    library: pkg.name,
    libraryTarget: "umd",
    sourcePrefix:""
  },
  devtool: "inline-source-map"
});
