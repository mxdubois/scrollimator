var path = require('path');
var fs = require("fs");
var webpack = require("webpack");

var pkg = JSON.parse(fs.readFileSync("./package.json"));

var bannerProperties = [
  pkg.name + " v" + pkg.version,
  pkg.homepage,
  pkg.license + " License"];
var banner = bannerProperties.join(" | ");

module.exports = {
  resolve: {
    root: [__dirname, path.join(__dirname, "bower_components")],
    modulesDirectories: [
      'bower_components',
      'node_modules'
    ],
  },

  loaders: [
    {test: /\.json$/, loaders: ["json-loader"]},
    {test: /\.js$/, loaders: ["es6-loader"]}
  ],

  plugins:  [
    new webpack.ResolverPlugin(
        new webpack
            .ResolverPlugin
            .DirectoryDescriptionFilePlugin("bower.json", ["main"])),
    new webpack.BannerPlugin(banner)
  ],

  stats: {
    colors: true,
    reasons: true
  },

  debug: false,

  progress: false
};
