// Copyright (c) 2021 Thomas J. Otterson
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export const STRING = 'STRING'
export const NUMBER = 'NUMBER'

export const TomlString = value => ({
  type: STRING,
  value,
})
export const TomlNumber = value => ({
  type: NUMBER,
  value,
})
