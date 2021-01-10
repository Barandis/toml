// Copyright (c) 2021 Thomas J. Otterson
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export const COMMENT = 'COMMENT'
export const STRING = 'STRING'

export const TomlComment = value => ({
  type: COMMENT,
  value,
})
export const TomlString = value => ({
  type: STRING,
  value,
})
