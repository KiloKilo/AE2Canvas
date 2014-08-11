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
                    'build/ae2canvas.js': ['src/runtime/Runtime.js']
//                    'build/export.js' : ['js/export/main.js']
                },
                options: {
                    bundleOptions: {
                        standalone: 'ae2canvas',
                        debug     : true
                    }
                }
            }
        },
        uglify    : {
            my_target: {
                files: {
                    'build/ae2canvas.min.js': ['build/ae2canvas.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
};