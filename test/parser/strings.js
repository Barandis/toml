// Copyright (c) 2021 Thomas J. Otterson
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { expect } from 'chai'

import { run } from '@barandis/kessel'
import { string } from 'parser/strings'
import { TomlString } from 'parser/types'

function test(input, value) {
  expect(run(string, input)).to.deep.equal(TomlString(value))
}

describe('TOML strings', () => {
  describe('basic string parser', () => {
    it('parses an empty string', () => {
      test('""', '')
    })
    it('parses a text string', () => {
      test('"This is a test string."', 'This is a test string.')
    })
    it('parses simple escape sequences', () => {
      test(String.raw`"\b\f\n\r\t\"\\"`, '\b\f\n\r\t"\\')
    })
    it('parses 4-digit hex codes', () => {
      test(String.raw`"\u0020\u00a7\u041f\u2608"`, ' §П☈')
    })
    it('parses 8-digit hex codes', () => {
      test(String.raw`"\U000000a7\U0000041f\U00002608\U000170ba"`, '§П☈𗂺')
    })
  })

  describe('multi-line basic string parser', () => {
    it('parses an empty string', () => {
      test('""""""', '')
    })
    it('parses a string of one quote', () => {
      test('"""""""', '"')
    })
    it('parses a string of two quotes', () => {
      test('""""""""', '""')
    })
    it('parses a text string', () => {
      test('"""This is a test string."""', 'This is a test string.')
    })
    it('parses simple escape sequences', () => {
      test(String.raw`"""\b\f\n\r\t\"\\"""`, '\b\f\n\r\t"\\')
    })
    it('parses 4-digit hex codes', () => {
      test(String.raw`"""\u0020\u00a7\u041f\u2608"""`, ' §П☈')
    })
    it('parses 8-digit hex codes', () => {
      test(
        String.raw`"""\U000000a7\U0000041f\U00002608\U000170ba"""`, '§П☈𗂺',
      )
    })
    it('parses multi-line strings', () => {
      test(
        String.raw`"""This is a
                   multi-line string."""`,
        'This is a\n                   multi-line string.',
      )
    })
    it('parses multi-line strings with escaped newlines', () => {
      test(
        String.raw`"""This is a \
                   multi-line string."""`,
        'This is a multi-line string.',
      )
    })
    it('collapses multiple empty lines after escaped newline', () => {
      test(
        String.raw`"""This is a \


                   multi-line string."""`,
        'This is a multi-line string.',
      )
    })
    it('trims a newline immediately following the opening delimiter', () => {
      test(
        String.raw`"""
This is a
multi-line string."""`,
        'This is a\nmulti-line string.',
      )
    })
    it('allows the embedding of single or double quotation marks', () => {
      test(
        String.raw`"""Here are two quotation marks: "". Simple enough."""`,
        'Here are two quotation marks: "". Simple enough.',
      )
    })
    it('allows the embedding of three or more quotes with escapes', () => {
      test(
        String.raw`"""Here are three quotation marks: ""\"."""`,
        'Here are three quotation marks: """.',
      )
      test(
        String.raw`"""Here are fifteen quotation marks: \
                   ""\"""\"""\"""\"""\"."""`,
        'Here are fifteen quotation marks: """"""""""""""".',
      )
    })
    it('will accept embedded quotes immediately inside delimiters', () => {
      test(
        '""""This," she said, "is just a pointless statement.""""',
        '"This," she said, "is just a pointless statement."',
      )
    })
  })

  describe('literal string parser', () => {
    it('parses an empty string', () => {
      test("''", '')
    })
    it('ignores escape characters', () => {
      test(
        String.raw`'C:\Users\nodejs\templates'`,
        'C:\\Users\\nodejs\\templates',
      )
    })
    it('allows embedded quotes without escaping', () => {
      test(
        String.raw`'Charles L. "Sonny" Liston'`,
        'Charles L. "Sonny" Liston',
      )
    })
  })

  describe('multi-line literal string parser', () => {
    it('parses an empty string', () => {
      test("''''''", '')
    })
    it('parses a string of one apostrophe', () => {
      test("'''''''", "'")
    })
    it('parses a string of two apostrophes', () => {
      test("''''''''", "''")
    })
    it('parses a text string', () => {
      test("'''This is a text string.'''", 'This is a text string.')
    })
    it('ignores escape sequences', () => {
      test(
        String.raw`'''I [dw]on't need \d{2} apples'''`,
        "I [dw]on't need \\d{2} apples",
      )
    })
    it('parses multi-line strings', () => {
      test(
        String.raw`'''
The first newline is
trimmed in raw strings.
   All other whitespace
   is preserved.
'''`,
        'The first newline is\ntrimmed in raw strings.\n   '
          + 'All other whitespace\n   is preserved.\n',
      )
    })
    it('allows quotes without escaping', () => {
      test(
        String.raw`'''Here are fifteen quotation marks: """""""""""""""'''`,
        'Here are fifteen quotation marks: """""""""""""""',
      )
    })
    it('allows embedded single- and double-apostrophes', () => {
      test(
        "''''That,' she said, 'is still pointless.''''",
        "'That,' she said, 'is still pointless.'",
      )
    })
  })
})
