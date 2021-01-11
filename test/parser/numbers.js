// Copyright (c) 2021 Thomas J. Otterson
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { expect } from 'chai'

import { run } from '@barandis/kessel'
import { integer } from 'parser/numbers'
import { TomlInteger } from 'parser/types'

function testInteger(input, value) {
  expect(run(integer, input)).to.deep.equal(TomlInteger(value))
}

describe('TOML number parsers', () => {
  describe('integer parser', () => {
    context('decimal integers', () => {
      it('parses zero', () => {
        testInteger('0', 0)
        testInteger('+0', 0)
        testInteger('-0', 0)
      })
      it('parses safe positive integers', () => {
        testInteger('+99', 99)
        testInteger('1729', 1729)
        testInteger('16777216', 16777216)
      })
      it('parses safe negative numbers', () => {
        testInteger('-99', -99)
        testInteger('-1729', -1729)
        testInteger('-16777216', -16777216)
      })
      it('parses unsafe positive numbers as bigints', () => {
        testInteger('9007199254740991', 9007199254740991)
        testInteger('9007199254740992', 9007199254740992n)
        testInteger('19007199254740992', 19007199254740992n)
      })
      it('parses unsafe negative numbers as bigints', () => {
        testInteger('-9007199254740991', -9007199254740991)
        testInteger('-9007199254740992', -9007199254740992n)
        testInteger('-19007199254740992', -19007199254740992n)
      })
      it('allows underscores to separate digits', () => {
        testInteger('5_349_221', 5349221)
        testInteger('-53_49_221', -5349221)
        testInteger('1_2_3_4_5', 12345)
        testInteger('19_007_199_254_740_992', 19007199254740992n)
      })
      it('requires that underscores have digits on either side', () => {
        expect(() => run(integer, '5__349__221')).to.throw()
        expect(() => run(integer, '_5_349_221')).to.throw()
        expect(() => run(integer, '5_349_221_')).to.throw()
      })
      it('does not recognize leading zeros', () => {
        testInteger('016777216', 0)
      })
    })

    context('hexadecimal integers', () => {
      it('parses zero', () => {
        testInteger('0x0', 0)
      })
      it('parses safe positive integers', () => {
        testInteger('0x63', 99)
        testInteger('0x6c1', 1729)
        testInteger('0x1000000', 16777216)
      })
      it('parses unsafe positive integers as bigints', () => {
        testInteger('0x1FFFFFFFFFFFFF', 9007199254740991)
        testInteger('0x20000000000000', 9007199254740992n)
        testInteger('0x4386F26FC10000', 19007199254740992n)
      })
      it('allows leading zeros', () => {
        testInteger('0x0063', 99)
        testInteger('0x06c1', 1729)
        testInteger('0x0020000000000000', 9007199254740992n)
      })
      it('allows underscores to separate digits', () => {
        testInteger('0x0100_0000', 16777216)
        testInteger('0x1F_FFFF_FFFF_FFFF', 9007199254740991)
        testInteger('0x20_0000_0000_0000', 9007199254740992n)
      })
      it('requires that underscores have digits on either side', () => {
        expect(() => run(integer, '0x0100__0000')).to.throw()
        expect(() => run(integer, '0x_0100_0000')).to.throw()
        expect(() => run(integer, '0x0100_0000_')).to.throw()
      })
    })

    context('octal integers', () => {
      it('parses zero', () => {
        testInteger('0o0', 0)
      })
      it('parses safe positive integers', () => {
        testInteger('0o143', 99)
        testInteger('0o3301', 1729)
        testInteger('0o100000000', 16777216)
      })
      it('parses unsafe positive integers as bigints', () => {
        testInteger('0o377777777777777777', 9007199254740991)
        testInteger('0o400000000000000000', 9007199254740992n)
        testInteger('0o1034157115760200000', 19007199254740992n)
      })
      it('allows leading zeros', () => {
        testInteger('0o143', 99)
        testInteger('0o003301', 1729)
        testInteger('0o000400000000000000000', 9007199254740992n)
      })
      it('allows underscores to separate digits', () => {
        testInteger('0o100_000_000', 16777216)
        testInteger('0o377_777_777_777_777_777', 9007199254740991)
        testInteger('0o400_000_000_000_000_000', 9007199254740992n)
      })
      it('requires that underscores have digits on either side', () => {
        expect(() => run(integer, '0o100__000__000')).to.throw()
        expect(() => run(integer, '0o_100_000_000')).to.throw()
        expect(() => run(integer, '0o100_000_000_')).to.throw()
      })
    })

    context('binary integers', () => {
      it('parses zero', () => {
        testInteger('0b0', 0)
      })
      it('parses safe positive integers', () => {
        testInteger('0b1100011', 99)
        testInteger('0b11011000001', 1729)
        testInteger('0b1000000000000000000000000', 16777216)
      })
      it('parses unsafe positive integers as bigints', () => {
        testInteger(
          '0b11111111111111111111111111111111111111111111111111111',
          9007199254740991,
        )
        testInteger(
          '0b100000000000000000000000000000000000000000000000000000',
          9007199254740992n,
        )
        testInteger(
          '0b1000011100001101111001001101111110000010000000000000000',
          19007199254740992n,
        )
      })
      it('allows leading zeros', () => {
        testInteger('0b01100011', 99)
        testInteger('0b0000011011000001', 1729)
        testInteger(
          '0b00100000000000000000000000000000000000000000000000000000',
          9007199254740992n,
        )
      })
      it('allows underscores to separate digits', () => {
        testInteger('0b0001_0000_0000_0000_0000_0000_0000', 16777216)
        testInteger(
          '0b11111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111_1111',
          9007199254740991,
        )
        testInteger(
          '0b1000000000_0000_0000_0000_0000_0000_0000_0000_0000_0000_0000_0000',
          9007199254740992n,
        )
      })
      it('requires that underscores have digits on either side', () => {
        expect(() => run(integer, '0b0100__0000')).to.throw()
        expect(() => run(integer, '0b_0100_0000')).to.throw()
        expect(() => run(integer, '0b0100_0000_')).to.throw()
      })
    })
  })
})
