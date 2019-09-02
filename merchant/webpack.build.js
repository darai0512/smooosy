/* eslint-env node */

const path = require('path')
const webpack = require('webpack')
const webpackEssential = require('./webpack.essential')
const LoadablePlugin = require('@loadable/webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const RollbarSourceMapPlugin = require('rollbar-sourcemap-webpack-plugin')
const nodeExternals = require('webpack-node-externals')
const { webOrigin } = require('@smooosy/config')

let revision = 'N/A'
try {
  revision = require('child_process').execSync('git rev-parse HEAD').toString().trim()
} catch (e) {
  // empty
}

const entries = [
  {path: 'main', out: ''},
  {path: 'tools', out: 'tools/'},
]

const handler = (percentage, message, ...args) => {
  console.info(percentage, message, ...args)
}


const configs = entries.map(entry => ({
  mode: 'production',
  stats: 'errors-only',
  entry: {
    'bundle': [
      '@babel/polyfill',
      `${__dirname}/src/${entry.path}/index`,
    ],
  },
  output: {
    path: `${__dirname}/dist/public/${entry.out}`,
    filename: 'js/[name].[chunkhash:8].js',
    chunkFilename: 'js/[name].[chunkhash:8].js',
    publicPath: `/${entry.out}`,
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
                '@loadable/babel-plugin',
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
  optimization: {
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: process.env.CIRCLECI ? 1 : true, // CircleCIでのNOMEM回避
        sourceMap: true,
      }),
    ],
    splitChunks: {
      chunks: 'all',
      name: false,
      cacheGroups: {
        react: {
          test: /react/,
          name: 'react',
          chunks: 'all',
        },
        core: {
          test: /redux|core-js|jss|history|matarial-ui|lodash|moment|rollbar|\.io|platform|axios/,
          name: 'core',
          chunks: 'all',
        },
      },
    },
  },
  plugins: [
    new webpack.HashedModuleIdsPlugin(),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.ContextReplacementPlugin(
      /caniuse-lite[\/\\]data[\/\\]regions/,
      /^$/,
    ),
    new webpack.DefinePlugin({
      'process.env': {
        'TARGET_ENV': JSON.stringify(process.env.NODE_ENV),
        'GIT_REVISION': JSON.stringify(revision),
      },
    }),
  ],
}))

configs[0].devtool = 'source-map'
configs[0].plugins.push(
  new LoadablePlugin({
    writeToDisk: { filename: path.join(__dirname, '/dist/public') },
  }),
  new CopyWebpackPlugin([{
    from: 'src/static',
    ignore: [ 'index.html', 'bundle.html' ],
  }]),
  new BundleAnalyzerPlugin({
    analyzerMode: 'static',
  }),
)
if (!process.env.CIRCLECI) {
  configs[0].plugins.push(new webpack.ProgressPlugin(handler))
}
if (process.env.NODE_ENV === 'production') {
  configs[0].plugins.push(
    new RollbarSourceMapPlugin({
      accessToken: '707427adabc648299b6ddd3e04860796',
      version: revision,
      publicPath: webOrigin,
    })
  )
}

configs[1].plugins.push(
  new HtmlWebpackPlugin({
    template: 'src/static/tools/base.html',
    filename: 'index.html',
  })
)

const server = {
  mode: 'production',
  stats: 'errors-only',
  target: 'node',
  entry: {
    bundle: [
      path.join(__dirname, '/src/main/components/main-node.js'),
    ],
  },
  output: {
    path: `${__dirname}/dist/node`,
    filename: '[name].[chunkhash:8].js',
    chunkFilename: '[name].[chunkhash:8].js',
    libraryTarget: 'commonjs2',
    publicPath: '/dist/node',
  },
  externals: [
    nodeExternals({
      modulesDir: '../node_modules',
      whitelist: [/\.(?!(?:jsx?|json)$).{1,5}$/i],
    }),
  ],
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
                    modules: false,
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
    new LoadablePlugin({
      writeToDisk: { filename: path.join(__dirname, '/dist/node') },
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'TARGET_ENV': JSON.stringify(process.env.NODE_ENV),
      },
    }),
  ],
}

configs.push(server)

configs.push(webpackEssential)

module.exports = configs
