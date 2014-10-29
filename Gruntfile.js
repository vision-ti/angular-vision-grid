module.exports = function(grunt) {

    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.initConfig({
        concat: {
            dist:{
                src: ["src/grid-directives.js", "src/grid-util.js", "src/grid-columns.js"],
                dest: "dist/angular-vision-grid.js"
            }
        },
        uglify: {
            dist: {
                options: {report: 'gzip'},
                src: "dist/angular-vision-grid.js",
                dest: "dist/angular-vision-grid.min.js"
            }
        },
        connect: {
            options: {
                livereload:true,
                port: 9000,
                open: 'http://localhost:<%= connect.options.port %>/demo/index.html'
            },
            server: {
            }
        },
        watch: {
            livereload: {
                options: { livereload: true },
                files: ['demo/**/*']
            }
        }
    });

    /*config.set("concat.dist", {
        src: ["src/*.js"],
        dest: "dist/angular-vision-grid.js"
    });

    config.set("uglify.dist", {
        options: {report: "gzip"}
        , src: "dist/angular-vision-grid.js"
        , dest: "dist/angular-vision-grid.min.js"
    });*/

    grunt.registerTask("default", ['concat', 'uglify']);
    grunt.registerTask('serve', ['connect', 'watch']);
};