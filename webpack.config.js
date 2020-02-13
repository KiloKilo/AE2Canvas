const path = require('path')

const config = {
	entry: path.join(__dirname, 'src/index.js'),
	devtool: 'source-maps',
	output: {
		path: path.join(__dirname, 'dist'),
		filename: 'index.js',
		library: 'ae2canvas',
		libraryTarget: 'umd',
	},
	module: {
		rules: [{ test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }],
	},
	optimization: {
		minimize: false,
	},
	devServer: {
		contentBase: path.join(__dirname, 'examples'),
		publicPath: '/dist',
		stats: 'errors-only',
		port: 8000,
		host: '0.0.0.0',
	},
}

module.exports = config
