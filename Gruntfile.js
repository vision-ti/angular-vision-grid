var config = require("grunt-settings");

module.exports = function(grunt) {

    config.init(grunt);

    grunt.loadNpmTasks("grunt-contrib-concat");

    config.set("concat.dist", {
        src: ["src/*.js"],
        dest: "dist/angular-vision-grid.js"
    });

    config.set("uglify.dist", {
        options: {report: "gzip"}
        , src: "dist/angular-vision-grid.js"
        , dest: "dist/angular-vision-grid.min.js"
    });

    config.registerTask("default", ["concat", "uglify"]);
};