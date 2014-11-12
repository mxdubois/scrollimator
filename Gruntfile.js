// TODO add githooks

var fs = require("fs");
var pkg = JSON.parse(fs.readFileSync("./package.json"));

var webpackRelease = require("./webpack.config.js");
var webpackDev = require("./webpack.dev.config.js");

module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({

    pkg: pkg,

    jshint: {
      options: {
        jshintrc: true
      },
      all: ["Gruntfile.js", "src/**/*.js"]
    },

    webpack: {
      release: webpackRelease,
      dev: webpackDev,
    },

    karma: {
      options: {
        configFile: 'karma.config.js',
      },
      unit: {
        singleRun: true
      },
      watch: {
        background: false,
        singleRun: false,
        autoWatch: false
      }
    },

    watch: {
      test: {
        options: {
          spawn: false,
          interrupt:true
        },
        files: ["test/**/*.js","src/**/*.js"],
        tasks: ["karma:unit:run"]
        //tasks: ["karma:watch:run"]
      }
    }

  });

  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks("grunt-webpack");
  grunt.loadNpmTasks("grunt-karma");

  grunt.registerTask("lint", "jshint:all");

  grunt.registerTask("test", "karma:unit");
  // FIXME This doesn't work due to bugs in grunt-karma regarding PhantomJs
  //grunt.registerTask("testWatch", ["karma:unit", "watch:test"]);

  grunt.registerTask("buildRelease", "webpack:release");
  grunt.registerTask("buildDev", "webpack:dev");
  grunt.registerTask("build", ["buildRelease", "buildDev"]);

  // TODO add version bump
  grunt.registerTask("release",
      ["lint", "test", "build"]);
};
