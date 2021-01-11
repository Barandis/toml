// Copyright (c) 2021 Thomas J. Otterson
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* eslint max-len: ["error", { code: 80, comments: 80 }] */

import { flatjoin, newline, nonAscii, ws, wschar } from './common'
import { TomlString } from './types'

import {
  alt, attempt, bcount, between, bleft, bseq, char, count, hex, join,
  many, many1, map, not, oneof, opt, peek, range, right, seq, value,
} from '@barandis/kessel'

/*
;; Basic String

basic-string = quotation-mark *basic-char quotation-mark

quotation-mark = %x22            ; "

basic-char = basic-unescaped / escaped
basic-unescaped = wschar / %x21 / %x23-5B / %x5D-7E / non-ascii
escaped = escape escape-seq-char

escape = %x5C                   ; \
escape-seq-char =  %x22         ; "    quotation mark  U+0022
escape-seq-char =/ %x5C         ; \    reverse solidus U+005C
escape-seq-char =/ %x62         ; b    backspace       U+0008
escape-seq-char =/ %x66         ; f    form feed       U+000C
escape-seq-char =/ %x6E         ; n    line feed       U+000A
escape-seq-char =/ %x72         ; r    carriage return U+000D
escape-seq-char =/ %x74         ; t    tab             U+0009
escape-seq-char =/ %x75 4HEXDIG ; uXXXX                U+XXXX
escape-seq-char =/ %x55 8HEXDIG ; UXXXXXXXX            U+XXXXXXXX
*/

const quotationMark = char('"')

const escapes = {
  'b': '\b',
  'f': '\f',
  'n': '\n',
  'r': '\r',
  't': '\t',
  '"': '"',
  '\\': '\\',
}

const HEXDIG = hex()

const escape = char('\x5c')
const escapeSeqChar = alt(
  oneof('\x22\x5c\x62\x66\x6e\x72\x74'),
  flatjoin(seq(char('\x75'), count(HEXDIG, 4))),
  flatjoin(seq(char('\x55'), count(HEXDIG, 8))),
)
const escaped = map(right(escape, escapeSeqChar), x => {
  if (x.length > 1) {
    return String.fromCodePoint(parseInt(x.substring(1), 16))
  }
  return escapes[x]
}, 'an escape sequence')

const basicUnescaped = alt(
  wschar,
  char('\x21'),
  range('\x23', '\x5b'),
  range('\x5d', '\x7e'),
  nonAscii,
  'an unescaped character',
)
const basicChar = alt(basicUnescaped, escaped)

const basicString = between(
  quotationMark,
  quotationMark,
  join(many(basicChar)),
)

/*
;; Multiline Basic String

ml-basic-string = ml-basic-string-delim ml-basic-body ml-basic-string-delim
ml-basic-string-delim = 3quotation-mark
ml-basic-body = *mlb-content *( mlb-quotes 1*mlb-content ) [ mlb-quotes ]

mlb-content = mlb-char / newline / mlb-escaped-nl
mlb-char = mlb-unescaped / escaped
mlb-quotes = 1*2quotation-mark
mlb-unescaped = wschar / %x21 / %x23-5B / %x5D-7E / non-ascii
mlb-escaped-nl = escape ws newline *( wschar / newline )
*/

const mlBasicStringDelim = bcount(quotationMark, 3)

const mlbEscapedNl = value(bseq(
  escape,
  ws,
  newline,
  many(alt(wschar, newline)),
), '', 'an escaped newline')
const mlbUnescaped = basicUnescaped
// The first two cases aren't in the ABNF but are necessary here so that
// this parser doesn't parse part of an ending delimiter.
const mlbQuotes = alt(
  bleft(join(bcount(quotationMark, 2)), peek(mlBasicStringDelim)),
  bleft(quotationMark, peek(mlBasicStringDelim)),
  bleft(join(bcount(quotationMark, 2)), not(quotationMark)),
  bleft(quotationMark, not(quotationMark)),
)
const mlbChar = alt(mlbUnescaped, attempt(escaped))
const mlbContent = alt(mlbChar, newline, mlbEscapedNl)

// The first element of the sequence (`value(opt(newline), '')`) is not
// present in the ABNF. It implements the rule that if a newline
// immediately follows the opening delimiter, that newline is trimmed.
const mlBasicBody = flatjoin(seq(
  value(opt(newline), ''),
  many(mlbContent),
  many(bseq(mlbQuotes, many1(mlbContent))),
  opt(mlbQuotes),
))

const mlBasicString = between(
  mlBasicStringDelim,
  mlBasicStringDelim,
  mlBasicBody,
)

/*
;; Literal String

literal-string = apostrophe *literal-char apostrophe

apostrophe = %x27 ; ' apostrophe

literal-char = %x09 / %x20-26 / %x28-7E / non-ascii
*/

const apostrophe = char('\x27')
const literalChar = alt(
  char('\x09'),
  range('\x20', '\x26'),
  range('\x28', '\x7e'),
  nonAscii,
  'a literal character',
)
const literalString = between(
  apostrophe,
  apostrophe,
  join(many(literalChar)),
)

/*
;; Multiline Literal String

ml-literal-string =
        ml-literal-string-delim ml-literal-body ml-literal-string-delim
ml-literal-string-delim = 3apostrophe
ml-literal-body = *mll-content *( mll-quotes 1*mll-content ) [ mll-quotes ]

mll-content = mll-char / newline
mll-char = %x09 / %x20-26 / %x28-7E / non-ascii
mll-quotes = 1*2apostrophe
*/

const mlLiteralStringDelim = bcount(apostrophe, 3)

// Same concept as `mlbQuotes` above - the first two cases aren't in
// the ABNF but are necessary to prevent consuming part of the ending
// delimiter.
const mllQuotes = alt(
  bleft(join(bcount(apostrophe, 2)), peek(mlLiteralStringDelim)),
  bleft(apostrophe, peek(mlLiteralStringDelim)),
  bleft(join(bcount(apostrophe, 2)), not(apostrophe)),
  bleft(apostrophe, not(apostrophe)),
)
const mllChar = literalChar
const mllContent = alt(mllChar, newline)

const mlLiteralBody = flatjoin(seq(
  value(opt(newline), ''),
  many(mllContent),
  many(bseq(mllQuotes, many1(mllContent))),
  opt(mllQuotes),
))

const mlLiteralString = between(
  mlLiteralStringDelim,
  mlLiteralStringDelim,
  mlLiteralBody,
)

/*
;; String

string = ml-basic-string / basic-string / ml-literal-string / literal-string
*/

export const string = map(alt(
  mlBasicString,
  basicString,
  mlLiteralString,
  literalString,
), TomlString)
