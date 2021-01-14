// Copyright (c) 2021 Thomas J. Otterson
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* eslint max-len: ["error", { code: 80, comments: 80 }] */

import { ALPHA, DIGIT, newline, ws, wschar } from './common'
import { boolean, comment } from './misc'
import { basicString, literalString, string } from './string'
import { dateTime } from './datetime'
import { float, integer } from './number'
import { TomlArray, TomlKeyval } from './types'

import {
  alt,
  block,
  bpipe,
  bseq,
  char,
  def,
  fail,
  flat,
  join,
  lazy,
  many,
  many1,
  map,
  opt,
  right,
  second,
  seq,
  // str,
} from '@barandis/kessel'

// This file does indeed contain all of the collection-type elements in
// TOML, but these are together in a single file for another reason.
// These are also all of the elements that might produce parsing errors
// because they use names that have already been taken.
//
// None of the rules governing array and table names can be expressed in
// ABNF, of course. What follows is a series of rules gleaned from the
// spec at https://toml.io/en/v1.0.0-rc.3.
//
// * You cannot define a table more than once. (Defining a super-table
//   of an already defined table is fine, as long as the super-table
//   wasn't itself already defined explicitly.)
// * You cannot define a table whose name was already defined as a
//   key-value pair.
// * Inline tables define the keys and sub-tables within them fully. A
//   table defined inline cannot later have keys or sub-tables added to
//   it.
// * Inline tables cannot be used to add keys or sub-tables to an
//   already-defined table.
// * A table array element cannot be created that is the parent of an
//   already-defined table.
// * A table array element cannot be added to a statically-defined
//   array.
// * A table cannot be defined with the same name as an already-defined
//   array.

let usedKeys = []

export function resetState() {
  usedKeys = []
}

function used(key) {
  nextUsedKey:
  for (const usedKey of usedKeys) {
    const [long, short] = usedKey.length > key.length
      ? [usedKey, key] : [key, usedKey]
    for (const [i, term] of short.entries()) {
      if (term !== long[i]) continue nextUsedKey
    }
    return usedKey
  }
  return false
}

function formatKey(key) {
  return key.map(k => /^[a-zA-Z0-9_-]*$/.test(k) ? k : `"${k}"`).join('.')
}

/*
;; Key-Value pairs

keyval = key keyval-sep val

key = simple-key / dotted-key
simple-key = quoted-key / unquoted-key

unquoted-key = 1*( ALPHA / DIGIT / %x2D / %x5F ) ; A-Z / a-z / 0-9 / - / _
quoted-key = basic-string / literal-string
dotted-key = simple-key 1*( dot-sep simple-key )

dot-sep   = ws %x2E ws  ; . Period
keyval-sep = ws %x3D ws ; =

val = string / boolean / array / inline-table / date-time / float / integer
*/

const hyphen = char('-')
const underscore = char('_')
const dot = char('.')
const equal = char('=')

const dotSep = bseq(ws, dot, ws)
const keyvalSep = bseq(ws, equal, ws)

const unquotedKey = join(many1(alt(ALPHA, DIGIT, hyphen, underscore)))
const quotedKey = alt(basicString, literalString)
const simpleKey = map(alt(unquotedKey, quotedKey), x => [x])
const dottedKey = flat(bseq(simpleKey, many1(right(dotSep, simpleKey))))

export const key = block(function *() {
  const k = yield alt(dottedKey, simpleKey)
  const usedKey = used(k)
  if (usedKey) yield fail(`Key <${formatKey(usedKey)}> is already assigned`)
  usedKeys.push(k)
  return k
})

export const val = alt(
  string, boolean, dateTime, float, integer, lazy(arrayFn), // inlineTable,
)

export const keyval = bpipe(key, keyvalSep, val, (k, _, v) => TomlKeyval(k, v))

/*
;; Array

array = array-open [ array-values ] ws-comment-newline array-close

array-open =  %x5B ; [
array-close = %x5D ; ]

array-values =  ws-comment-newline val ws-comment-newline array-sep array-values
array-values =/ ws-comment-newline val ws-comment-newline [ array-sep ]

array-sep = %x2C  ; , Comma

ws-comment-newline = *( wschar / [ comment ] newline )
*/

const arrayOpen = char('[')
const arrayClose = char(']')
const arraySep = char(',')

const wsCommentNewline = many(alt(wschar, seq(opt(comment), newline)))

const arrayValues = (function arrayValues() {
  return alt(
    bpipe(
      wsCommentNewline, val, wsCommentNewline, arraySep, lazy(arrayValues),
      (_1, value, _2, _3, array) => [value, ...array],
    ),
    map(second(bseq(
      wsCommentNewline, val, wsCommentNewline, opt(arraySep),
    )), value => [value]),
  )
}())

// `array` and `val` are mutually recursive, so we declare this as a
// function (a parser factory) so it gets hoisted above `val` and is
// visible to it. `val` uses `lazy` on it to let `arrayValues`, etc. to
// be defined before `val` actually invokes it.
function arrayFn() {
  return map(second(bseq(
    arrayOpen, def(arrayValues, []), wsCommentNewline, arrayClose,
  )), TomlArray)
}
// Still export it as a parser
export const array = arrayFn()

/*
;; Standard Table

std-table = std-table-open key std-table-close

std-table-open  = %x5B ws     ; [ Left square bracket
std-table-close = ws %x5D     ; ] Right square bracket
*/

// const stdTableOpen = char('[')
// const stdTableClose = char(']')
// export const stdTable = bseq(stdTableOpen, key, stdTableClose)

/*
;; Inline Table

inline-table = inline-table-open [ inline-table-keyvals ] inline-table-close

inline-table-open  = %x7B ws     ; {
inline-table-close = ws %x7D     ; }
inline-table-sep   = ws %x2C ws  ; , Comma

inline-table-keyvals = keyval [ inline-table-sep inline-table-keyvals ]
*/

// const inlineTableOpen = bseq(char('{'), ws)
// const inlineTableClose = bseq(ws, char('}'))
// const inlineTableSep = bseq(ws, char(','), ws)

// const inlineTableKeyvals = bseq(
//   keyval,
//   opt(seq(inlineTableSep, inlineTableKeyvals)),
// )
// export const inlineTable = bseq(
//   inlineTableOpen,
//   opt(inlineTableKeyvals),
//   inlineTableClose,
// )

/*
;; Array Table

array-table = array-table-open key array-table-close

array-table-open  = %x5B.5B ws  ; [[ Double left square bracket
array-table-close = ws %x5D.5D  ; ]] Double right square bracket
*/

// const arrayTableOpen = seq(str('[['), ws)
// const arrayTableClose = seq(ws, str(']]'))

// export const arrayTable = bseq(arrayTableOpen, key, arrayTableClose)
