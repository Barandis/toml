// Copyright (c) 2021 Thomas J. Otterson
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { expect } from 'chai'

import { run } from '@barandis/kessel'
import { boolean, comment } from 'parser/misc'
import { TomlBoolean, TomlComment } from 'parser/types'

function testComment(input, value) {
  expect(run(comment, input)).to.deep.equal(TomlComment(value))
}

function testBoolean(input, value) {
  expect(run(boolean, input)).to.deep.equal(TomlBoolean(value))
}

describe('Element parsers', () => {
  describe('comment parser', () => {
    it('parses empty comments', () => {
      testComment('#', '')
    })
    it('parses comments with text', () => {
      testComment('# This is a comment.', ' This is a comment.')
    })
    it('parses only up to a newline', () => {
      testComment('# No multi-\nline comments!', ' No multi-')
    })
  })

  describe('boolean parser', () => {
    it('parses true', () => {
      testBoolean('true', true)
    })
    it('parses false', () => {
      testBoolean('false', false)
    })
  })
})
