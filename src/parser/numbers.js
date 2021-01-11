// Copyright (c) 2021 Thomas J. Otterson
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { TomlInteger } from './types'
import { flatjoin } from './common'

import {
  alt,
  char,
  digit,
  hex,
  many,
  many1,
  map,
  octal,
  oneof,
  opt,
  pipe,
  range,
  right,
  seq,
  skip,
  str,
} from '@barandis/kessel'

function makeInteger(num, radix) {
  const result = parseInt(num, radix)
  if (Number.isSafeInteger(result)) return result

  switch (radix) {
    case 16: return BigInt(`0x${num}`)
    case 8: return BigInt(`0o${num}`)
    case 2: return BigInt(`0b${num}`)
    default: return BigInt(num)
  }
}

/*
;; Integer

integer = dec-int / hex-int / oct-int / bin-int

minus = %x2D                       ; -
plus = %x2B                        ; +
underscore = %x5F                  ; _
digit1-9 = %x31-39                 ; 1-9
digit0-7 = %x30-37                 ; 0-7
digit0-1 = %x30-31                 ; 0-1

hex-prefix = %x30.78               ; 0x
oct-prefix = %x30.6f               ; 0o
bin-prefix = %x30.62               ; 0b

dec-int = [ minus / plus ] unsigned-dec-int
unsigned-dec-int = DIGIT / digit1-9 1*( DIGIT / underscore DIGIT )

hex-int = hex-prefix HEXDIG *( HEXDIG / underscore HEXDIG )
oct-int = oct-prefix digit0-7 *( digit0-7 / underscore digit0-7 )
bin-int = bin-prefix digit0-1 *( digit0-1 / underscore digit0-1 )
*/

const DIGIT = digit()
const HEXDIG = hex()

const minus = char('\x2d')
const plus = char('\x2b')
const underscore = char('\x5f')
const digit19 = range('\x31', '\x39')
const digit07 = octal()
const digit01 = oneof('\x30\x31')

const hexPrefix = str('0x')
const octPrefix = str('0o')
const binPrefix = str('0b')

const unsignedDecInt = alt(
  flatjoin(seq(digit19, many1(alt(DIGIT, right(underscore, DIGIT))))),
  DIGIT,
)
const decInt = pipe(
  opt(alt(minus, plus)),
  unsignedDecInt,
  (s, n) => makeInteger(n === '0' ? n : (s ?? '') + n, 10),
)

const hexInt = map(flatjoin(seq(
  skip(hexPrefix),
  HEXDIG,
  many(alt(HEXDIG, right(underscore, HEXDIG))),
)), n => makeInteger(n, 16))

const octInt = map(flatjoin(seq(
  skip(octPrefix),
  digit07,
  many(alt(digit07, right(underscore, digit07))),
)), n => makeInteger(n, 8))

const binInt = map(flatjoin(seq(
  skip(binPrefix),
  digit01,
  many(alt(digit01, right(underscore, digit01))),
)), n => makeInteger(n, 2))

export const integer = map(alt(hexInt, octInt, binInt, decInt), TomlInteger)
