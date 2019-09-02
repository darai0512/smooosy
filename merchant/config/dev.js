require('dotenv').config()

module.exports = {
  port: 3232,
  mongodb: {
    uri: `mongodb+srv://smooosy:${process.env.MONGODB_PASSWORD}@smooosy-dev-sjshd.mongodb.net/smooosy`,
  },
  staticPath: '/var/www/smooosy/merchant/dist/public',
  essentialPath: '/var/www/smooosy/merchant/dist/public/essential.html',
  loadableWebStatsDir: '/var/www/smooosy/merchant/dist/public/',
  loadableNodeStatsDir: '/var/www/smooosy/merchant/dist/node/',
  log4js: {
    pm2: true,
    pm2InstanceVar: 'INSTANCE_ID',
    disableClustering: true,
    appenders: {
      all: {
        type: 'dateFile',
        filename: 'logs/all.log',
        compress: true,
      },
      console: {
        type: 'dateFile',
        filename: 'logs/console.log',
        compress: true,
      },
    },
    categories: {
      default: {
        appenders: ['all'],
        level: 'debug',
      },
      console: {
        appenders: ['all', 'console'],
        level: 'debug',
      },
    },
  },
  mecabDicDir: '/usr/lib64/mecab/dic',
  sitemap: {
    path: '/var/www/smooosy/merchant/dist/public',
  },
}
