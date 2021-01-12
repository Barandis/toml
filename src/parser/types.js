// Copyright (c) 2021 Thomas J. Otterson
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export const BOOLEAN = 'BOOLEAN'
export const COMMENT = 'COMMENT'
export const DATETIME = 'DATETIME'
export const NUMBER = 'NUMBER'
export const STRING = 'STRING'

export const TomlString = value => ({
  type: STRING,
  value,
})
export const TomlNumber = value => ({
  type: NUMBER,
  value,
})
export const TomlComment = value => ({
  type: COMMENT,
  value,
})
export const TomlBoolean = value => ({
  type: BOOLEAN,
  value,
})
export const TomlDateTime = value => ({
  type: DATETIME,
  value,
})
