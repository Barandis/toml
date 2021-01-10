/**
 * Copyright (c) 2020 Thomas J. Otterson
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const fs = require('fs')

const path = require('path')
const webpack = require('webpack')
const { merge } = require('webpack-merge')

const common = require('./webpack.common')

const banner = fs.readFileSync(path.resolve(__dirname, 'LICENSE'), 'utf8')

module.exports = merge(common, {
  mode: 'production',
  output: {
    filename: 'kessel.min.js',
  },
  plugins: [
    new webpack.BannerPlugin({ banner, entryOnly: true }),
    new webpack.DefinePlugin({
      'ASSERT': true,
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
})
