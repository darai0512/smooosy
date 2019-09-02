const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'production',
  stats: 'errors-only',
  entry: {
    essential: [
      path.join(__dirname, '/src/essential'),
    ],
  },
  output: {
    path: `${__dirname}/dist/public`,
    filename: 'js/[name].[hash].js',
    publicPath: '/',
  },
  resolve: {
    modules: ['node_modules', 'src'],
    extensions: ['.js', '.json'],
  },
  module: {
    exprContextCritical: false,
    rules: [
      {
        test: /\.js$/,
        include: [
          path.join(__dirname, '/src'),
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
              ],
              plugins: [
                ['transform-imports', {
                  '@smooosy/config': {
                    'transform': '@smooosy/config/src/${member}',
                  },
                }],
                ['@babel/plugin-proposal-decorators', { 'legacy': true }],
                ['@babel/plugin-proposal-class-properties', { 'loose': true }],
              ],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'TARGET_ENV': JSON.stringify(process.env.NODE_ENV),
      },
    }),
    new HtmlWebpackPlugin({
      template: 'src/static/bundle.html',
      filename: 'essential.html',
    }),
  ],
}
