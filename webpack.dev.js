/**
 * Copyright (c) 2020 Thomas J. Otterson
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const { merge } = require('webpack-merge')
const webpack = require('webpack')

const common = require('./webpack.common')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
    filename: 'kessel.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'ASSERT': JSON.stringify(true),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
})
