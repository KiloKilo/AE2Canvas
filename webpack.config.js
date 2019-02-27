var webpack = require('webpack');
var path = require('path');

var config = {
    entry: path.join(__dirname, 'src/index.js'),
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'index.js',
        library: 'AE2Canvas',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        globalObject: '(self || this)'
    },
    module: {
        rules: [
            {test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"}
        ]
    },
    devServer: {
        contentBase: path.join(__dirname, 'examples'),
        publicPath: '/public',
        stats: 'errors-only',
        port: 8000,
        host: '0.0.0.0',
    }
};

module.exports = config;