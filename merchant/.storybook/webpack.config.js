const path = require('path');

module.exports = {
  entry: {
    'bundle': [
      '@babel/polyfill',
    ]
  },
  resolve: {
    modules: ['src', 'src/main', 'node_modules'],
    extensions: ['.js', '.json'],
  },
}