var webpack = require('webpack');
var path = require('path');

var config = {
    entry: __dirname + '/src/index.js',
    devtool: 'source-map',
    output: {
        path: __dirname + '/build',
        filename: 'index.js',
        library: 'AE2Canvas',
        libraryTarget: 'umd'
    },
    module: {
        loaders: [
            {test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"}
        ]
    },
    devServer: {
        contentBase: path.join(__dirname, 'examples'),
        publicPath: '/',
        stats: 'errors-only',
        port: 8000,
        host: '0.0.0.0',
    }
};

module.exports = config;