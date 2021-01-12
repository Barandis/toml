// Copyright (c) 2021 Thomas J. Otterson
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* eslint max-len: ["error", { code: 80, comments: 80 }] */

import { DIGIT, flatjoin } from './common'
import { TomlDateTime } from './types'

import {
  alt,
  attempt,
  block,
  char,
  count,
  fail,
  ichar,
  join,
  many1,
  map,
  oneof,
  opt,
  pipe,
  seq,
  value,
} from '@barandis/kessel'

/*
;; Date and Time (as defined in RFC 3339)

date-time      = offset-date-time / local-date-time / local-date / local-time

date-fullyear  = 4DIGIT
date-month     = 2DIGIT  ; 01-12
date-mday      = 2DIGIT  ; 01-28, 01-29, 01-30, 01-31 based on month/year
time-delim     = "T" / %x20 ; T, t, or space
time-hour      = 2DIGIT  ; 00-23
time-minute    = 2DIGIT  ; 00-59
time-second    = 2DIGIT  ; 00-58, 00-59, 00-60 based on leap second rules
time-secfrac   = "." 1*DIGIT
time-numoffset = ( "+" / "-" ) time-hour ":" time-minute
time-offset    = "Z" / time-numoffset

partial-time   = time-hour ":" time-minute ":" time-second [ time-secfrac ]
full-date      = date-fullyear "-" date-month "-" date-mday
full-time      = partial-time time-offset

;; Offset Date-Time

offset-date-time = full-date time-delim full-time

;; Local Date-Time

local-date-time = full-date time-delim partial-time

;; Local Date

local-date = full-date

;; Local Time

local-time = partial-time
*/

// TOML dates and times are being translated to plain JavaScript
// objects. The `Date` object isn't capable of representing times
// without dates, so we would need a third-party library to fully
// implement TOML date-times. I don't want to force a certain third
// party library, so plain objects are being provided that can then be
// used with whatever library is desired.
//
// The objects in question can have the following properties:
//
// year, month, day, hours, minutes, seconds, ms, offset
//
// Which properties are used depends on which type of date-time is
// parsed:
//
// * Offset date-times will have all properties
// * Local date-times will have all but `offset`
// * Local dates will have `year`, `month`, and `day`
// * Local times will have `hours`, `minutes`, `seconds`, and `ms`

const DIGIT4 = join(count(DIGIT, 4))
const DIGIT2 = join(count(DIGIT, 2))
const colon = char(':')
const hyphen = char('-')

const twoDigitRange = (min, max) => block(function *() {
  const digits = yield DIGIT2
  if (digits < min || digits > max) yield fail()
  return digits
}, `two digits between '${min}' and '${max}'`)

const dateFullyear = DIGIT4
const dateMonth = twoDigitRange('01', '12')
// This depends on the month, which we don't have access to yet, so we
// deal with validating it later
const dateMday = DIGIT2
const timeDelim = oneof('\x20tT')
const timeHour = twoDigitRange('00', '23')
const timeMinute = twoDigitRange('00', '59')
// Second can be 60 in minutes that have leap seconds, and there's no
// hard and fast rule of when that is so we don't try to validate that
// a '60' happens on the correct minute
const timeSecond = twoDigitRange('00', '60')
const timeSecfrac = flatjoin(seq(char('.'), many1(DIGIT)))
const timeNumoffset = pipe(
  alt(char('+'), char('-')),
  timeHour,
  colon,
  timeMinute,
  (s, h, _, m) =>
    (parseInt(h, 10) * 60 + parseInt(m, 10)) * (s === '-' ? -1 : 1),
)
const timeOffset = map(alt(
  value(ichar('Z'), 0),
  timeNumoffset,
), offset => ({ offset }))

const partialTime = pipe(
  timeHour, colon, timeMinute, colon, timeSecond, opt(timeSecfrac),
  (hours, _1, minutes, _2, seconds, ms) => ({
    hours: parseInt(hours, 10),
    minutes: parseInt(minutes, 10),
    seconds: parseInt(seconds, 10),
    ms: ms ? Number(ms) * 1000 : 0,
  }),
)
// Here's where we take care of the day of month
const fullDate = block(function *() {
  const year = yield dateFullyear
  yield hyphen
  const month = yield dateMonth
  yield hyphen
  const day = yield dateMday

  if (['04', '06', '09', '11'].includes(month) && (day < '01' || day > '30')) {
    yield fail("Expected two digits between '01' and '30'")
  } else if (month === '02') {
    const y = parseInt(year, 10)
    const leapYear = y % 4 === 0 && y % 100 !== 0 || y % 400 === 0
    const max = leapYear ? '29' : '28'
    if (day < '01' || day > max) {
      yield fail(`Expected two digits between '01' and '${max}'`)
    }
  } else if (day < '01' || day > '31') {
    yield fail("Expected two digits between '01' and '31'")
  }

  return {
    year: parseInt(year, 10),
    month: parseInt(month, 10),
    day: parseInt(day, 10),
  }
})
const fullTime = pipe(
  partialTime,
  timeOffset,
  (time, offset) => Object.assign(time, offset),
)

const offsetDateTime = pipe(
  fullDate, timeDelim, fullTime, (d, _, t) => Object.assign(d, t),
)
const localDateTime = pipe(
  fullDate, timeDelim, partialTime, (d, _, t) => Object.assign(d, t),
)
const localDate = fullDate
const localTime = partialTime

export const dateTime = map(alt(
  attempt(offsetDateTime),
  attempt(localDateTime),
  attempt(localDate),
  attempt(localTime),
), TomlDateTime)
