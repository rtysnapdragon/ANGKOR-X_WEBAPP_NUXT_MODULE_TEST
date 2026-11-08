import {
  differenceInMilliseconds,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInBusinessDays,
  differenceInCalendarDays,
  differenceInWeeks,
  differenceInISOWeekYears,
  differenceInCalendarISOWeekYears,
  differenceInCalendarISOWeeks,
  differenceInCalendarMonths,
  differenceInCalendarQuarters,
  differenceInCalendarWeeks,
  differenceInCalendarYears,
  differenceInMonths,
  differenceInQuarters,
  differenceInYears,
  format,
  addMilliseconds,
  addSeconds,
  addMinutes,
  addHours,
  addDays,
  addBusinessDays,
  addISOWeekYears,
  addQuarters,
  addWeeks,
  addMonths,
  addYears,
  subMilliseconds,
  subSeconds,
  subMinutes,
  subHours,
  subDays,
  subBusinessDays,
  subISOWeekYears,
  subQuarters,
  subWeeks,
  subMonths,
  subYears,
  getMilliseconds,
  getSeconds,
  getMinutes,
  getHours,
  getDay,
  getDaysInMonth,
  getDaysInYear,
  getDayOfYear,
  getWeek,
  getWeekOfMonth,
  getWeeksInMonth,
  getWeekYear,
  getYear,
  getDate,
  getDecade,
  getISODay,
  getISOWeek,
  getISOWeekYear,
  getISOWeeksInYear,
  getMonth,
  getQuarter,
  getTime,
  getUnixTime,
  startOfMonth,
  endOfMonth,
} from "date-fns";

import { useRuntimeConfig } from "#imports";
import helper from "./helper";
class RDate {
  constructor(date, end) {
    this._date = date;
    this._endData = end;
  }

  get(options) {
    return {
      milliseconds: getMilliseconds(this._currentDate),
      seconds: getSeconds(this._currentDate),
      minutes: getMinutes(this._currentDate),
      hours: getHours(this._currentDate),
      day: getDay(this._currentDate),
      daysInMonth: getDaysInMonth(this._currentDate),
      daysInYear: getDaysInYear(this._currentDate),
      dayOfYear: getDayOfYear(this._currentDate),
      week: getWeek(this._currentDate, options),
      weekOfMonth: getWeekOfMonth(this._currentDate, options),
      weeksInMonth: getWeeksInMonth(this._currentDate, options),
      weekYear: getWeekYear(this._currentDate, options),
      year: getYear(this._currentDate),
      date: getDate(this._currentDate),
      decade: getDecade(this._currentDate),
      iSODay: getISODay(this._currentDate),
      iSOWeek: getISOWeek(this._currentDate),
      iSOWeekYear: getISOWeekYear(this._currentDate),
      iSOWeeksInYear: getISOWeeksInYear(this._currentDate),
      month: getMonth(this._currentDate),
      quarter: getQuarter(this._currentDate),
      time: getTime(this._currentDate),
      unixTime: getUnixTime(this._currentDate),
    };
  }

  sub(amount) {
    return {
      milliseconds: subMilliseconds(this._currentDate, amount),
      seconds: subSeconds(this._currentDate, amount),
      minutes: subMinutes(this._currentDate, amount),
      hours: subHours(this._currentDate, amount),
      days: subDays(this._currentDate, amount),
      businessDays: subBusinessDays(this._currentDate, amount),
      iSOWeekYears: subISOWeekYears(this._currentDate, amount),
      quarters: subQuarters(this._currentDate, amount),
      weeks: subWeeks(this._currentDate, amount),
      months: subMonths(this._currentDate, amount),
      years: subYears(this._currentDate, amount),
    };
  }

  add(amount) {
    return {
      milliseconds: addMilliseconds(this._currentDate, amount),
      seconds: addSeconds(this._currentDate, amount),
      minutes: addMinutes(this._currentDate, amount),
      hours: addHours(this._currentDate, amount),
      days: addDays(this._currentDate, amount),
      businessDays: addBusinessDays(this._currentDate, amount),
      iSOWeekYears: addISOWeekYears(this._currentDate, amount),
      quarters: addQuarters(this._currentDate, amount),
      weeks: addWeeks(this._currentDate, amount),
      months: addMonths(this._currentDate, amount),
      years: addYears(this._currentDate, amount),
    };
  }

  startOfMonth(format) {
    const date = startOfMonth(this._currentDate);
    return isEmpty(format) ? date : format(date, format);
  }

  endOfMonth(format) {
    const date = endOfMonth(this._currentDate);
    return isEmpty(format) ? date : format(date, format);
  }


  diff(to, options) {
    return {
      milliseconds: differenceInMilliseconds(this._currentDate, to),
      seconds: differenceInSeconds(this._currentDate, to, options),
      minutes: differenceInMinutes(this._currentDate, to, options),
      hours: differenceInHours(this._currentDate, to, options),
      days: differenceInDays(this._currentDate, to),
      businessDays: differenceInBusinessDays(this._currentDate, to),
      calendarDays: differenceInCalendarDays(this._currentDate, to),
      weeks: differenceInWeeks(this._currentDate, to, options),
      iSOWeekYears: differenceInISOWeekYears(this._currentDate, to),
      calendarISOWeekYears: differenceInCalendarISOWeekYears(
        this._currentDate,
        to
      ),
      calendarISOWeeks: differenceInCalendarISOWeeks(this._currentDate, to),
      calendarMonths: differenceInCalendarMonths(this._currentDate, to),
      calendarQuarters: differenceInCalendarQuarters(this._currentDate, to),
      calendarWeeks: differenceInCalendarWeeks(this._currentDate, to, options),
      calendarYears: differenceInCalendarYears(this._currentDate, to),
      months: differenceInMonths(this._currentDate, to),
      quarters: differenceInQuarters(this._currentDate, to, options),
      years: differenceInYears(this._currentDate, to),
    };
  }

  format(str, options) {
    let dateDivider = "-";
    const { config } = helper();

    if (config.dateFormat) str ??= config.dateFormat;

    if (config.dateDivider) dateDivider = config.dateDivider;

    if (this._endData) {
      const start = format(this._currentDate, str, options);
      const end = format(this._endData, str, options);

      return `${start} ${dateDivider} ${end}`;
    }

    return format(this._currentDate, str, options);
  }

  toString(str, options) {
    return this.format(str, options);
  }

  get _currentDate() {
    return this._date ?? new Date();
  }
}

export default (date, endDate) => {
  return new RDate(date, endDate);
};
