// Copyright (c) 2021 Thomas J. Otterson
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* eslint max-len: ["error", { code: 80, comments: 80 }] */

import { nonEol } from './common'
import { TomlBoolean, TomlComment } from './types'

import {
  alt,
  char,
  join,
  many,
  map,
  right,
  str,
  value,
} from '@barandis/kessel'

/*
;; Comment

comment-start-symbol = %x23 ; #

comment = comment-start-symbol *non-eol
*/

const commentStartSymbol = char('#')

export const comment = map(right(
  commentStartSymbol,
  join(many(nonEol)),
), TomlComment)

/*
;; Boolean

boolean = true / false

true    = %x74.72.75.65     ; true
false   = %x66.61.6C.73.65  ; false
*/

const ptrue = value(str('true'), true)
const pfalse = value(str('false'), false)

export const boolean = map(alt(ptrue, pfalse), TomlBoolean)

