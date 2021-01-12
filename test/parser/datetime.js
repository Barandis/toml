// Copyright (c) 2021 Thomas J. Otterson
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { expect } from 'chai'

import { run } from '@barandis/kessel'
import { dateTime } from 'parser/datetime'
import { TomlDateTime } from 'parser/types'

function testDateTime(input, value) {
  expect(run(dateTime, input)).to.deep.equal(TomlDateTime(value))
}

function failDateTime(input, error) {
  expect(() => run(dateTime, input)).to.throw(error)
}

describe('Date-time parsers', () => {
  context('local time', () => {
    it('parses a local time without fractional seconds', () => {
      testDateTime('12:00:00', {
        hours: 12,
        minutes: 0,
        seconds: 0,
        ms: 0,
      })
      testDateTime('23:45:09', {
        hours: 23,
        minutes: 45,
        seconds: 9,
        ms: 0,
      })
    })
    it('parses a local time with fractional seconds', () => {
      testDateTime('12:00:00.729', {
        hours: 12,
        minutes: 0,
        seconds: 0,
        ms: 729,
      })
      testDateTime('23:45:09.1', {
        hours: 23,
        minutes: 45,
        seconds: 9,
        ms: 100,
      })
      testDateTime('13:57:46.654321', {
        hours: 13,
        minutes: 57,
        seconds: 46,
        ms: 654.321,
      })
    })
    it('rejects times with single-digit components', () => {
      failDateTime('1:57:46')
      failDateTime('12:0:0')
    })
    it('rejects out-of-range hour values', () => {
      failDateTime('24:00:00', "two digits between '00' and '23'")
    })
    it('rejects out-of-range minute values', () => {
      failDateTime('23:60:00', "two digits between '00' and '59'")
    })
    it('rejects out-of-range second values', () => {
      // This is okay to allow for leap seconds
      testDateTime('23:59:60', {
        hours: 23,
        minutes: 59,
        seconds: 60,
        ms: 0,
      })
      failDateTime('23:59:61', "two digits between '00' and '60'")
    })
  })

  context('local dates', () => {
    it('parses a local date', () => {
      testDateTime('1972-11-27', { year: 1972, month: 11, day: 27 })
      testDateTime('2000-02-29', { year: 2000, month: 2, day: 29 })
    })
    it('rejects single-digit month and day values', () => {
      failDateTime('2000-2-29')
      failDateTime('2000-01-1')
    })
    it('rejects out-of-range month values', () => {
      failDateTime('2000-00-01', "two digits between '01' and '12'")
      failDateTime('2000-13-01', "two digits between '01' and '12'")
    })
    it('rejects out-of-range day values in 31-day months', () => {
      failDateTime('2000-01-00', "two digits between '01' and '31'")
      testDateTime('2000-01-31', { year: 2000, month: 1, day: 31 })
      failDateTime('2000-01-32', "two digits between '01' and '31'")

      failDateTime('2000-03-00', "two digits between '01' and '31'")
      testDateTime('2000-03-31', { year: 2000, month: 3, day: 31 })
      failDateTime('2000-03-32', "two digits between '01' and '31'")

      failDateTime('2000-05-00', "two digits between '01' and '31'")
      testDateTime('2000-05-31', { year: 2000, month: 5, day: 31 })
      failDateTime('2000-05-32', "two digits between '01' and '31'")

      failDateTime('2000-07-00', "two digits between '01' and '31'")
      testDateTime('2000-07-31', { year: 2000, month: 7, day: 31 })
      failDateTime('2000-07-32', "two digits between '01' and '31'")

      failDateTime('2000-08-00', "two digits between '01' and '31'")
      testDateTime('2000-08-31', { year: 2000, month: 8, day: 31 })
      failDateTime('2000-08-32', "two digits between '01' and '31'")

      failDateTime('2000-10-00', "two digits between '01' and '31'")
      testDateTime('2000-10-31', { year: 2000, month: 10, day: 31 })
      failDateTime('2000-10-32', "two digits between '01' and '31'")

      failDateTime('2000-12-00', "two digits between '01' and '31'")
      testDateTime('2000-12-31', { year: 2000, month: 12, day: 31 })
      failDateTime('2000-12-32', "two digits between '01' and '31'")
    })
    it('rejects out-of-range day values in 30-day months', () => {
      failDateTime('2000-04-00', "two digits between '01' and '30'")
      testDateTime('2000-04-30', { year: 2000, month: 4, day: 30 })
      failDateTime('2000-04-31', "two digits between '01' and '30'")

      failDateTime('2000-06-00', "two digits between '01' and '30'")
      testDateTime('2000-06-30', { year: 2000, month: 6, day: 30 })
      failDateTime('2000-06-31', "two digits between '01' and '30'")

      failDateTime('2000-09-00', "two digits between '01' and '30'")
      testDateTime('2000-09-30', { year: 2000, month: 9, day: 30 })
      failDateTime('2000-09-31', "two digits between '01' and '30'")

      failDateTime('2000-11-00', "two digits between '01' and '30'")
      testDateTime('2000-11-30', { year: 2000, month: 11, day: 30 })
      failDateTime('2000-11-31', "two digits between '01' and '30'")
    })
    it('rejects out-of-range day values in February', () => {
      failDateTime('2000-02-00', "two digits between '01' and '29'")
      testDateTime('2000-02-29', { year: 2000, month: 2, day: 29 })
      failDateTime('2000-02-30', "two digits between '01' and '29'")

      failDateTime('2001-02-00', "two digits between '01' and '28'")
      testDateTime('2001-02-28', { year: 2001, month: 2, day: 28 })
      failDateTime('2001-02-29', "two digits between '01' and '28'")

      failDateTime('2004-02-00', "two digits between '01' and '29'")
      testDateTime('2004-02-29', { year: 2004, month: 2, day: 29 })
      failDateTime('2004-02-30', "two digits between '01' and '29'")

      failDateTime('1900-02-00', "two digits between '01' and '28'")
      testDateTime('1900-02-28', { year: 1900, month: 2, day: 28 })
      failDateTime('1900-02-29', "two digits between '01' and '28'")
    })
  })

  context('local date-times', () => {
    it('parses a local date-time', () => {
      testDateTime('1972-11-27T03:53:00', {
        year: 1972,
        month: 11,
        day: 27,
        hours: 3,
        minutes: 53,
        seconds: 0,
        ms: 0,
      })
    })
    it('parses a lowercase separator', () => {
      testDateTime('1972-11-27t03:53:00', {
        year: 1972,
        month: 11,
        day: 27,
        hours: 3,
        minutes: 53,
        seconds: 0,
        ms: 0,
      })
    })
    it('parses a space separator', () => {
      testDateTime('1972-11-27 03:53:00', {
        year: 1972,
        month: 11,
        day: 27,
        hours: 3,
        minutes: 53,
        seconds: 0,
        ms: 0,
      })
    })
  })

  context('offset date-times', () => {
    it('parses an offset date-time with Z', () => {
      testDateTime('1972-11-27T09:53:00Z', {
        year: 1972,
        month: 11,
        day: 27,
        hours: 9,
        minutes: 53,
        seconds: 0,
        ms: 0,
        offset: 0,
      })
    })
    it('parses an offset date-time with a positive offset', () => {
      testDateTime('1972-11-27T03:53:00+06:00', {
        year: 1972,
        month: 11,
        day: 27,
        hours: 3,
        minutes: 53,
        seconds: 0,
        ms: 0,
        offset: 360,
      })
    })
    it('parses an offset date-time with a negative offset', () => {
      testDateTime('1972-11-27T15:53:00-06:00', {
        year: 1972,
        month: 11,
        day: 27,
        hours: 15,
        minutes: 53,
        seconds: 0,
        ms: 0,
        offset: -360,
      })
    })
  })
})
