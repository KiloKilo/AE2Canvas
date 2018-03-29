var webpack = require('webpack');
var path = require('path');

var config = {
    entry: __dirname + '/src/runtime/AE2Canvas.js',
    devtool: 'source-map',
    output: {
        path: __dirname + '/build',
        filename: 'ae2canvas.js',
        library: 'AE2Canvas',
        libraryTarget: 'umd'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env']
                    }
                }
            }
        ]
    }
};

module.exports = config;