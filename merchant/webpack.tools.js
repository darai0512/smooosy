const webpack = require('webpack')
const precss = require('precss')
const autoprefixer = require('autoprefixer')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const threadLoader = require('thread-loader')
const path = require('path')

const jsWorkerOptions = {
  workers: process.env.CIRCLE_NODE_TOTAL || require('os').cpus().length - 1,
  workerParallelJobs: 50,
  poolTimeout: 2000,
  poolParallelJobs: 50,
  name: 'js-pool-client-tools',
}
threadLoader.warmup(jsWorkerOptions, [ 'babel-loader' ])


module.exports = {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  cache: true,
  stats: 'errors-only',
  entry: {
    'tools/bundle': [
      '@babel/polyfill',
      path.join(__dirname, '/src/tools/index'),
    ],
  },
  output: {
    path: path.resolve('dist/public'),
    filename: '[name].js',
    chunkFilename: '[name].js',
    publicPath: '/',
  },
  resolve: {
    modules: ['src', 'src/main', 'node_modules'],
    extensions: ['.js', '.json'],
  },
  module: {
    exprContextCritical: false,
    rules: [
      {
        test: /\.js$/,
        include: [
          path.join(__dirname, '/src'),
          path.join(__dirname, '/../config'),
        ],
        use: [
          { loader: 'cache-loader' },
          { loader: 'thread-loader', options: jsWorkerOptions },
          {
            loader: 'babel-loader',
            query: {
              cacheDirectory: true,
              presets: [
                [
                  '@babel/preset-env', {
                    targets: {
                      browsers: ['last 2 versions', '> 1%'],
                    },
                    modules: false,
                  },
                ],
                '@babel/preset-react',
              ],
              plugins: [
                ['@babel/plugin-proposal-decorators', { 'legacy': true }],
                ['@babel/plugin-proposal-class-properties', { 'loose': true }],
                'react-hot-loader/babel',
              ],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
      },
      {
        test: /\.(eot|ttf|woff|gif|svg)$/,
        loader: 'file-loader',
        options: {
          outputPath: 'assets/',
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'TARGET_ENV': JSON.stringify('development'),
      },
    }),
    new HtmlWebpackPlugin({
      template: 'src/static/tools/base.html',
      filename: 'tools/index.html',
      chunks: ['tools/bundle'],
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.LoaderOptionsPlugin({options: {
      postcss: [ precss, autoprefixer() ],
    }}),
  ],
}
