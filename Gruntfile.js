module.exports = function (grunt) {
    grunt.initConfig({
        pkg       : grunt.file.readJSON('package.json'),
        browserify: {
            dev  : {
                files  : {
                    'build/ae2canvas.js': ['src/runtime/AE2Canvas.js']
                },
                options: {
                    watch            : true,
                    keepAlive        : true,
                    plugin           : [
                        ["browserify-derequire"]
                    ],
                    browserifyOptions: {
                        standalone: 'AE2Canvas',
                        debug     : true
                    }
                }
            },
            build: {
                files  : {
                    'build/ae2canvas.js': ['src/runtime/AE2Canvas.js']
                },
                options: {
                    plugin           : [
                        ["browserify-derequire"]
                    ],
                    browserifyOptions: {
                        standalone: 'AE2Canvas'
                    }
                }
            }
        },
        uglify    : {
            build: {
                options: {
                    compress: {
                        drop_console: true
                    }
                },
                files  : {
                    'build/ae2canvas.min.js': ['build/ae2canvas.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('dev', ['browserify:dev']);
    grunt.registerTask('build', ['browserify:build', 'uglify:build']);
};