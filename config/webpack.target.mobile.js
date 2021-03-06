'use strict'

const path = require('path')
const { DefinePlugin, ProvidePlugin } = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const pkg = require(path.resolve(__dirname, '../package.json'))

module.exports = function(production, app) {
  return {
    entry: {
      app: [path.resolve(__dirname, `../targets/${app}/mobile/main`)]
    },
    output: {
      path: path.resolve(__dirname, `../targets/${app}/mobile/www`),
      filename: '[name].js',
      publicPath: process.env.PUBLIC_PATH
    },
    module: {
      rules: [
        {
            test: /\.(eot|ttf|woff|woff2)$/,
            loader: 'file-loader',
            options: {
              name: `[name].[ext]`
            }
        }
      ]
    },
    plugins: [
      new DefinePlugin({
        __ALLOW_HTTP__: !production,
        __TARGET__: JSON.stringify('mobile'),
        __SENTRY_TOKEN__: production
          ? JSON.stringify('9259817fbb44484b8b7a0a817d968ae4:171a3bcb3095448484aa3e709ea47e9b')
          : JSON.stringify('29bd1255b6d544a1b65435a634c9ff67:ba312a96643d4f98aee26c6378c74212'),
        __APP_VERSION__: JSON.stringify(pkg.version)
      }),
      new ProvidePlugin({
        PouchDB: 'pouchdb',
        pouchdbFind: 'pouchdb-find',
        pouchdbAdapterCordovaSqlite: 'pouchdb-adapter-cordova-sqlite',
        'cozy.client': production ? 'cozy-client-js/dist/cozy-client.min.js' : 'cozy-client-js/dist/cozy-client.js',
        'cozy.bar': production ? 'cozy-bar/dist/cozy-bar.mobile.min.js' : 'cozy-bar/dist/cozy-bar.mobile.js'
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, `../targets/${app}/web/index.ejs`),
        title: `cozy-${app}`,
        chunks: ['app'],
        inject: 'head',
        minify: {
          collapseWhitespace: true
        }
      })
    ]
  }
}
