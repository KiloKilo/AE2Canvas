module.exports = function (grunt) {
    grunt.initConfig({
        pkg       : grunt.file.readJSON('package.json'),
        watch     : {
            files: ['src/runtime/*.js'],
            tasks: ['browserify']
        },
        browserify: {
            dist: {
                files  : {
                    'build/runtime.js': ['src/runtime/main.js']
//                    'build/export.js' : ['js/export/main.js']
                },
                options: {
                    bundleOptions: {
                        debug: true
                    }
                }
            }
        },
        uglify    : {
            my_target: {
                files: {
                    'build/runtime.min.js': ['build/runtime.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
};