// Copyright (c) 2021 Thomas J. Otterson
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { expect } from 'chai'

import { run } from '@barandis/kessel'
import { array, keyval, resetState } from 'parser/collection'
import {
  TomlArray,
  TomlBoolean,
  TomlDateTime,
  TomlFloat,
  TomlInteger,
  TomlKeyval,
  TomlString,
} from 'parser/types'

function testArray(input, values) {
  expect(run(array, input)).to.deep.equal(TomlArray(values))
}

function testKeyval(input, key, value) {
  expect(run(keyval, input)).to.deep.equal(TomlKeyval(key, value))
}

function failKeyval(input, message) {
  expect(() => run(keyval, input)).to.throw(message)
}

describe('Collection parsers', () => {
  const value = TomlString('value')

  beforeEach(() => resetState())

  describe('key parser', () => {
    it('parses bare keys', () => {
      testKeyval('key = "value"', ['key'], value)
      testKeyval('bare_key = "value"', ['bare_key'], value)
      testKeyval('bare-key = "value"', ['bare-key'], value)
      testKeyval('1234 = "value"', ['1234'], value)
    })
    it('parses quoted keys', () => {
      testKeyval('"127.0.0.1" = "value"', ['127.0.0.1'], value)
      testKeyval(
        '"character encoding" = "value"', ['character encoding'], value,
      )
      testKeyval('"ʎǝʞ" = "value"', ['ʎǝʞ'], value)
      testKeyval(String.raw`'key2' = "value"`, ['key2'], value)
      testKeyval(
        String.raw`'quoted "value"' = "value"`, ['quoted "value"'], value,
      )
    })
    it('parses empty quoted keys', () => {
      testKeyval('"" = "value"', [''], value)
      failKeyval('= "value"', 'Expected a letter, a digit, ')
    })
    it('parses dotted keys', () => {
      testKeyval('physical.color = "value"', ['physical', 'color'], value)
      testKeyval('site."google.com" = "value"', ['site', 'google.com'], value)
    })
    it('rejects duplicate keys', () => {
      testKeyval('name = "Thomas"', ['name'], TomlString('Thomas'))
      failKeyval('name = "Otterson"', 'Key <name> is already assigned')
      testKeyval('spelling = "favorite"', ['spelling'], TomlString('favorite'))
      failKeyval(
        '"spelling" = "favourite"', 'Key <spelling> is already assigned',
      )
    })
    it('rejects a key if a part of it was already assigned', () => {
      testKeyval('fruit.apple = 1', ['fruit', 'apple'], TomlInteger(1))
      failKeyval(
        'fruit.apple.smooth = true',
        'Key <fruit.apple> is already assigned',
      )
    })
    it('rejects a key if it was previously assigned to a table', () => {
      testKeyval(
        'fruit.apple.smooth = true',
        ['fruit', 'apple', 'smooth'],
        TomlBoolean(true),
      )
      failKeyval(
        'fruit.apple = 1',
        'Key <fruit.apple.smooth> is already assigned',
      )
    })
    it('accepts when a key is a new subtable of an existing table', () => {
      testKeyval(
        'fruit.apple.smooth = true',
        ['fruit', 'apple', 'smooth'],
        TomlBoolean(true),
      )
      testKeyval(
        'fruit.orange = 2',
        ['fruit', 'orange'],
        TomlInteger(2),
      )
    })
    it('lets you do goofy-looking things with numbers', () => {
      testKeyval('3.14159 = "pi"', ['3', '14159'], TomlString('pi'))
    })
  })

  describe('array parser', () => {
    it('parses empty arrays', () => {
      testArray('[]', [])
      testArray('[   ]', [])
      testArray('[\n]', [])
    })
    it('parses integer arrays', () => {
      testArray('[1]', [TomlInteger(1)])
      testArray('[1, 2, 3]', [TomlInteger(1), TomlInteger(2), TomlInteger(3)])
    })
    it('parses float arrays', () => {
      testArray('[1.729e3]', [TomlFloat(1729)])
      // trailing comma, newlines, comments
      testArray(
        `[
          9.192631770e9,   # Hyperfine structure transition frequency of Cs-133
          2.99792458e8,    # Speed of light in a vacuum
          6.662607015e-34, # Planck constant
          1.602176634e-19, # Elementary charge
          1.380649e-23,    # Boltzmann constant
          6.02214076e23,   # Avogadro constant
          6.83e2,          # Luminous efficacy of 540THz monochromatic radiation
        ]`,
        [
          TomlFloat(9192631770),
          TomlFloat(299792458),
          TomlFloat(6.662607015e-34),
          TomlFloat(1.602176634e-19),
          TomlFloat(1.380649e-23),
          TomlFloat(6.02214076e23),
          TomlFloat(683),
        ],
      )
    })
    it('parses string arrays', () => {
      testArray('["fnord"]', [TomlString('fnord')])
      testArray(
        "['red', 'green', 'blue']",
        [TomlString('red'), TomlString('green'), TomlString('blue')],
      )
    })
    it('parses boolean arrays', () => {
      testArray('[true]', [TomlBoolean(true)])
      testArray(
        '[true, false, true]',
        [TomlBoolean(true), TomlBoolean(false), TomlBoolean(true)],
      )
    })
    it('parses datetime arrays', () => {
      testArray('[2021-01-14T01:32:18Z]', [TomlDateTime({
        year: 2021,
        month: 1,
        day: 14,
        hours: 1,
        minutes: 32,
        seconds: 18,
        ms: 0,
        offset: 0,
      })])
      testArray(
        '[03:53:00, 1972-11-27]',
        [
          TomlDateTime({ hours: 3, minutes: 53, seconds: 0, ms: 0 }),
          TomlDateTime({ year: 1972, month: 11, day: 27 }),
        ],
      )
    })
    it('parses nested arrays', () => {
      testArray('[[1, 2], [3, 4, 5]]', [
        TomlArray([TomlInteger(1), TomlInteger(2)]),
        TomlArray([TomlInteger(3), TomlInteger(4), TomlInteger(5)]),
      ])
    })
  })

  describe('keyval parser', () => {
    it('parses string values', () => {
      testKeyval(
        'basic = "basic string"',
        ['basic'],
        TomlString('basic string'),
      )
      testKeyval(
        "literal = 'literal string'",
        ['literal'],
        TomlString('literal string'),
      )
      testKeyval(
        String.raw`ml-basic = """Multiline \
                   basic string"""`,
        ['ml-basic'],
        TomlString('Multiline basic string'),
      )
      testKeyval(
        `ml-literal = '''
Multiline
literal string'''`,
        ['ml-literal'],
        TomlString('Multiline\nliteral string'),
      )
    })
    it('parses boolean values', () => {
      testKeyval('true = true', ['true'], TomlBoolean(true))
      testKeyval('false = false', ['false'], TomlBoolean(false))
    })
    it('parses integer values', () => {
      testKeyval('a = 0', ['a'], TomlInteger(0))
      testKeyval('b = -0', ['b'], TomlInteger(0))
      testKeyval('c = 1729', ['c'], TomlInteger(1729))
      testKeyval('d = -16777216', ['d'], TomlInteger(-16777216))
      testKeyval('e = 9007199254740992', ['e'], TomlInteger(9007199254740992n))
    })
    it('parses float values', () => {
      testKeyval('a = nan', ['a'], TomlFloat(NaN))
      testKeyval('b = -nan', ['b'], TomlFloat(NaN))
      testKeyval('c = inf', ['c'], TomlFloat(Infinity))
      testKeyval('d = -inf', ['d'], TomlFloat(-Infinity))
      testKeyval('e = 0.0', ['e'], TomlFloat(0))
      testKeyval('f = -0.0', ['f'], TomlFloat(-0))
      testKeyval('g = 1.729', ['g'], TomlFloat(1.729))
      testKeyval('h = -16777216.0', ['h'], TomlFloat(-16777216))
      testKeyval('i = 6.02214e+23', ['i'], TomlFloat(6.02214e23))
      testKeyval('j = 6.62607004e-34', ['j'], TomlFloat(6.62607004e-34))
    })
    it('parses date-time values', () => {
      testKeyval(
        'local.time = 12:34:56.789',
        ['local', 'time'],
        TomlDateTime({ hours: 12, minutes: 34, seconds: 56, ms: 789 }),
      )
      testKeyval(
        'local.date = 2021-01-13',
        ['local', 'date'],
        TomlDateTime({ year: 2021, month: 1, day: 13 }),
      )
      testKeyval(
        'local.date-time = 2021-01-13 12:34:56.789',
        ['local', 'date-time'],
        TomlDateTime({
          year: 2021,
          month: 1,
          day: 13,
          hours: 12,
          minutes: 34,
          seconds: 56,
          ms: 789,
        }),
      )
      testKeyval(
        'offset.date-time = 2021-01-13T12:34:56.789+06:00',
        ['offset', 'date-time'],
        TomlDateTime({
          year: 2021,
          month: 1,
          day: 13,
          hours: 12,
          minutes: 34,
          seconds: 56,
          ms: 789,
          offset: 360,
        }),
      )
    })
    it('parses array values', () => {
      testKeyval(
        'integers = [ 1, 2, 3 ]',
        ['integers'],
        TomlArray([TomlInteger(1), TomlInteger(2), TomlInteger(3)]),
      )
      testKeyval(
        'colors = ["red", "green", "blue"]',
        ['colors'],
        TomlArray([TomlString('red'), TomlString('green'), TomlString('blue')]),
      )
      testKeyval(
        'nested.array.of.int = [ [ 1, 2 ], [3, 4, 5] ]',
        ['nested', 'array', 'of', 'int'],
        TomlArray([
          TomlArray([TomlInteger(1), TomlInteger(2)]),
          TomlArray([TomlInteger(3), TomlInteger(4), TomlInteger(5)]),
        ]),
      )
      testKeyval(
        'nested.array.of.mixed = [[1, 2], ["a", "b", "c"]]',
        ['nested', 'array', 'of', 'mixed'],
        TomlArray([
          TomlArray([TomlInteger(1), TomlInteger(2)]),
          TomlArray([TomlString('a'), TomlString('b'), TomlString('c')]),
        ]),
      )
      testKeyval(
        String.raw`strs = ["all", 'strings', """are the same""", '''type''']`,
        ['strs'],
        TomlArray([
          TomlString('all'),
          TomlString('strings'),
          TomlString('are the same'),
          TomlString('type'),
        ]),
      )
      testKeyval(
        `constants.exact = [
          9.192631770e9,   # Hyperfine structure transition frequency of Cs-133
          2.99792458e8,    # Speed of light in a vacuum
          6.662607015e-34, # Planck constant
          1.602176634e-19, # Elementary charge
          1.380649e-23,    # Boltzmann constant
          6.02214076e23,   # Avogadro constant
          6.83e2,          # Luminous efficacy of 540THz monochromatic radiation
        ]`,
        ['constants', 'exact'],
        TomlArray([
          TomlFloat(9192631770),
          TomlFloat(299792458),
          TomlFloat(6.662607015e-34),
          TomlFloat(1.602176634e-19),
          TomlFloat(1.380649e-23),
          TomlFloat(6.02214076e23),
          TomlFloat(683),
        ]),
      )
    })
  })
})
