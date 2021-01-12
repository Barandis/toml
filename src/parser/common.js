// Copyright (c) 2021 Thomas J. Otterson
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import {
  alt, char, digit, flat, hex, join, letter, many, oneof, range, str,
} from '@barandis/kessel'

export const flatjoin = p => join(flat(p))

/*
;; Whitespace

ws = *wschar
wschar =  %x20  ; Space
wschar =/ %x09  ; Horizontal tab
*/

export const wschar = oneof(' \t', 'a whitespace character')
export const ws = many(wschar, 'whitespace')

/*
;; Newline

newline =  %x0A     ; LF
newline =/ %x0D.0A  ; CRLF
*/

export const newline = alt(char('\n'), str('\r\n'), 'a newline')

/*
non-ascii = %x80-D7FF / %xE000-10FFFF
non-eol = %x09 / %x20-7F / non-ascii
*/

export const nonAscii = alt(
  range('\x80', '\ud7ff'),
  range('\ue000', '\u{10ffff}'),
  'a non-ASCII character',
)
export const nonEol = alt(
  char('\x09'),
  range('\x20', '\x7f'),
  nonAscii,
  'a non-EOL character',
)

/*
;; Built-in ABNF terms, reproduced here for clarity

ALPHA = %x41-5A / %x61-7A ; A-Z / a-z
DIGIT = %x30-39 ; 0-9
HEXDIG = DIGIT / "A" / "B" / "C" / "D" / "E" / "F"
*/

export const ALPHA = letter()
export const DIGIT = digit()
export const HEXDIG = hex()
