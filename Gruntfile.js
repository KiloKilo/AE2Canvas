module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            dev: {
                files: {
                    'build/ae2canvas.js': ['src/runtime/AE2Canvas.js']
                },
                options: {
                    watch: true,
                    keepAlive: true,
                    plugin: [
                        ["browserify-derequire"]
                    ],
                    browserifyOptions: {
                        standalone: 'AE2Canvas',
                        debug: true
                    }
                }
            },
            build: {
                files: {
                    'build/ae2canvas.js': ['src/runtime/AE2Canvas.js']
                },
                options: {
                    plugin: [
                        ["browserify-derequire"]
                    ],
                    browserifyOptions: {
                        standalone: 'AE2Canvas'
                    }
                }
            }
        },
        uglify: {
            build: {
                options: {
                    compress: {
                        drop_console: true
                    }
                },
                files: {
                    'build/ae2canvas.min.js': ['build/ae2canvas.js']
                }
            },
            export: {
                files: {
                    'build/ae2canvas-export.jsx': ['build/ae2canvas-export.jsx']
                }
            }
        },
        concat: {
            dist: {
                src: [
                    'src/export/utils/json2.js',
                    'src/export/utils/utils.js',
                    'src/export/utils/keyframes.js',
                    'src/export/utils/motionpath.js',

                    'src/export/transform/transform.js',
                    'src/export/transform/anchor.js',
                    'src/export/transform/scale.js',
                    'src/export/transform/position.js',
                    'src/export/transform/rotation.js',
                    'src/export/transform/opacity.js',
                    'src/export/transform/skew.js',
                    'src/export/transform/skewAxis.js',

                    'src/export/element/comp.js',
                    'src/export/element/group.js',
                    'src/export/element/path.js',
                    'src/export/element/rect.js',
                    'src/export/element/ellipse.js',
                    'src/export/element/polystar.js',

                    'src/export/element/fill.js',
                    'src/export/element/stroke.js',

                    'src/export/element/merge.js',
                    'src/export/element/vectorTrim.js',

                    'src/export/property/property.js',
                    'src/export/property/staticProperty.js',
                    'src/export/property/animatedProperty.js',

                    'src/export/main.jsx'
                ],
                dest: 'build/ae2canvas-export.jsx'
            }
        },
        'string-replace': {
            dist: {
                files: {
                    'build/ae2canvas-export.jsx': 'build/ae2canvas-export.jsx'
                },
                options: {
                    replacements: [{
                        pattern: /#include.*/g,
                        replacement: ''
                    }]
                }
            }
        }
    });

    //

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-string-replace');

    grunt.registerTask('dev', ['browserify:dev']);
    grunt.registerTask('build', ['browserify:build', 'uglify:build', 'concat', 'string-replace', 'uglify:export']);
};