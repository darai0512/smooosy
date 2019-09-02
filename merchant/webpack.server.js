const threadLoader = require('thread-loader')
const path = require('path')

const nodeExternals = require('webpack-node-externals')
const LoadablePlugin = require('@loadable/webpack-plugin')

const jsWorkerOptions = {
  workers: process.env.CIRCLE_NODE_TOTAL || require('os').cpus().length - 1,
  workerParallelJobs: 50,
  poolTimeout: 2000,
  poolParallelJobs: 50,
  name: 'js-pool-server',
}
threadLoader.warmup(jsWorkerOptions, [ 'babel-loader' ])

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  watch: true,
  watchOptions: {
    aggregateTimeout: 300,
    ignored: [/node_modules/, /dist\//],
  },
  stats: 'errors-only',
  cache: true,
  target: 'node',
  entry: {
    bundle: [
      path.join(__dirname, '/src/main/components/main-node.js'),
    ],
  },
  externals: [
    nodeExternals({
      modulesDir: '../node_modules',
      whitelist: [/\.(?!(?:jsx?|json)$).{1,5}$/i],
    }),
  ],
  output: {
    path: path.join(__dirname, '/dist/node'),
    filename: '[name].js',
    chunkFilename: '[name].js',
    libraryTarget: 'commonjs2',
    publicPath: '/',
  },
  resolve: {
    modules: ['src', 'src/main', 'node_modules'],
    extensions: ['.js', '.json'],
  },
  module: {
    exprContextRegExp: /$^/,
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
                      node: '12.6',
                    },
                    modules: 'commonjs',
                  },
                ],
                '@babel/preset-react',
              ],
              plugins: [
                ['@babel/plugin-proposal-decorators', { 'legacy': true }],
                ['@babel/plugin-proposal-class-properties', { 'loose': true }],
                '@loadable/babel-plugin',
              ],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          'isomorphic-style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
            },
          },
        ],
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
    new LoadablePlugin(),
  ],
}
