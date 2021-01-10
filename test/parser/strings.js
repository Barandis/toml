// Copyright (c) 2021 Thomas J. Otterson
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { expect } from 'chai'

import { run } from '@barandis/kessel'
import { basicString, mlBasicString } from 'parser/strings'
import { TomlString } from 'parser/types'

function testBasic(input, value) {
  expect(run(basicString, input)).to.deep.equal(TomlString(value))
}

function testMlBasic(input, value) {
  expect(run(mlBasicString, input)).to.deep.equal(TomlString(value))
}

describe('TOML strings', () => {
  describe('basic string parser', () => {
    it('parses an empty string', () => {
      testBasic('""', '')
    })
    it('parses a text string', () => {
      const input = '"This is a test string."'
      const value = 'This is a test string.'
      testBasic(input, value)
    })
    it('parses simple escape sequences', () => {
      const input = String.raw`"\b\f\n\r\t\"\\"`
      const value = '\b\f\n\r\t"\\'
      testBasic(input, value)
    })
    it('parses 4-digit hex codes', () => {
      const input = String.raw`"\u0020\u00a7\u041f\u2608"`
      const value = ' §П☈'
      testBasic(input, value)
    })
    it('parses 8-digit hex codes', () => {
      const input = String.raw`"\U000000a7\U0000041f\U00002608\U000170ba"`
      const value = '§П☈𗂺'
      testBasic(input, value)
    })
  })

  describe('multi-line basic string parser', () => {
    it('parses an empty string', () => {
      testMlBasic('""""""', '')
    })
    it('parses a string of one quote', () => {
      testMlBasic('"""""""', '"')
    })
    it('parses a string of two quotes', () => {
      testMlBasic('""""""""', '""')
    })
    it('parses a text string', () => {
      testMlBasic('"""This is a test string."""', 'This is a test string.')
    })
    it('parses simple escape sequences', () => {
      testMlBasic(String.raw`"""\b\f\n\r\t\"\\"""`, '\b\f\n\r\t"\\')
    })
    it('parses 4-digit hex codes', () => {
      testMlBasic(String.raw`"""\u0020\u00a7\u041f\u2608"""`, ' §П☈')
    })
    it('parses 8-digit hex codes', () => {
      testMlBasic(
        String.raw`"""\U000000a7\U0000041f\U00002608\U000170ba"""`, '§П☈𗂺',
      )
    })
    it('parses multi-line strings', () => {
      testMlBasic(
        String.raw`"""This is a
                   multi-line string."""`,
        'This is a\n                   multi-line string.',
      )
    })
    it('parses multi-line strings with escaped newlines', () => {
      testMlBasic(
        String.raw`"""This is a \
                   multi-line string."""`,
        'This is a multi-line string.',
      )
    })
    it('collapses multiple empty lines after escaped newline', () => {
      testMlBasic(
        String.raw`"""This is a \


                   multi-line string."""`,
        'This is a multi-line string.',
      )
    })
    it('trims a newline immediately following the opening delimiter', () => {
      testMlBasic(
        String.raw`"""
This is a
multi-line string."""`,
        'This is a\nmulti-line string.',
      )
    })
    it('allows the embedding of single or double quotation marks', () => {
      testMlBasic(
        String.raw`"""Here are two quotation marks: "". Simple enough."""`,
        'Here are two quotation marks: "". Simple enough.',
      )
    })
    it('allows the embedding of three or more quotes with escapes', () => {
      testMlBasic(
        String.raw`"""Here are three quotation marks: ""\"."""`,
        'Here are three quotation marks: """.',
      )
      testMlBasic(
        String.raw`"""Here are fifteen quotation marks: \
                   ""\"""\"""\"""\"""\"."""`,
        'Here are fifteen quotation marks: """"""""""""""".',
      )
    })
    it('will accept embedded quotes immediately inside delimiters', () => {
      testMlBasic(
        '""""This," she said, "is just a pointless statement.""""',
        '"This," she said, "is just a pointless statement."',
      )
    })
  })
})
