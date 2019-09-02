module.exports = {
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
    ['@babel/plugin-transform-runtime', { 'regenerator': true }],
    '@babel/plugin-syntax-dynamic-import',
    '@loadable/babel-plugin',
  ],
}
