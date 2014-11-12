var extend = require("extend");
var webpackCommon = require("./webpack.common.config.js");

module.exports = function(config) {
  "use strict";

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '.',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'sinon-chai'],

    // list of files / patterns to load in the browser
    files: [{pattern: 'test/specs/**/*.js'}],

    // preprocess matching files before serving them to the browser
    preprocessors: {
        'test/specs/**/*.js': ['webpack'],
    },

    // test results reporter to use
    reporters: ['mocha'],

    plugins: [
      'karma-chai',
      'karma-mocha',
      'karma-mocha-reporter',
      'karma-phantomjs-launcher',
      'karma-sinon-chai',
      'karma-webpack'
    ],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests on change
    autoWatch: true,

    // start these browsers
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    webpack: extend({}, webpackCommon, {
      devTool: "eval-source-map"
    })
  });
};
