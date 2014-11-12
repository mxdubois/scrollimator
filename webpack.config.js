var fs = require("fs");
var extend = require("extend");
var webpack = require("webpack");

var pkg = JSON.parse(fs.readFileSync("./package.json"));
var webpackCommon = require("./webpack.common.config.js");

module.exports = extend({}, webpackCommon, {
  entry: __dirname + "/src/Scrollimator.js",
  output: {
    path: __dirname + "/dist",
    filename: pkg.name + ".js",
    library: pkg.name,
    libraryTarget: "umd",
    sourcePrefix:""
  },
  plugins: webpackCommon.plugins.concat(new webpack.optimize.DedupePlugin()),
});
