
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
  format as formatDate,
  isValid,
  parseISO,
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
  startOfMonth as startOfMonthDate,
  endOfMonth as endOfMonthDate,
} from "date-fns";

import helper from "./helper";

function toValidDate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  let date;

  if (value instanceof Date) {
    date = new Date(value.getTime());
  } else if (typeof value === "string") {
    const input = value.trim();

    if (!input) return null;

    // Parse ISO strings consistently.
    date = parseISO(input);

    // Support other formats accepted by JavaScript Date.
    if (!isValid(date)) {
      date = new Date(input);
    }
  } else if (typeof value === "number") {
    // Reject NaN and infinities.
    if (!Number.isFinite(value)) return null;
    date = new Date(value);
  } else {
    return null;
  }

  return isValid(date) ? date : null;
}

function safeNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function safeDateOperation(callback, fallback = null) {
  try {
    const result = callback();

    if (result instanceof Date) {
      return isValid(result) ? result : fallback;
    }

    return result ?? fallback;
  } catch {
    return fallback;
  }
}

class RDate {
  constructor(date, endDate) {
    this._date = toValidDate(date);
    this._endData = toValidDate(endDate);
  }

  get isValid() {
    return this._date !== null;
  }

  get(options) {
    const date = this._currentDate;

    if (!date) return null;

    return safeDateOperation(() => ({
      milliseconds: getMilliseconds(date),
      seconds: getSeconds(date),
      minutes: getMinutes(date),
      hours: getHours(date),
      day: getDay(date),
      daysInMonth: getDaysInMonth(date),
      daysInYear: getDaysInYear(date),
      dayOfYear: getDayOfYear(date),
      week: getWeek(date, options),
      weekOfMonth: getWeekOfMonth(date, options),
      weeksInMonth: getWeeksInMonth(date, options),
      weekYear: getWeekYear(date, options),
      year: getYear(date),
      date: getDate(date),
      decade: getDecade(date),
      iSODay: getISODay(date),
      iSOWeek: getISOWeek(date),
      iSOWeekYear: getISOWeekYear(date),
      iSOWeeksInYear: getISOWeeksInYear(date),
      month: getMonth(date),
      quarter: getQuarter(date),
      time: getTime(date),
      unixTime: getUnixTime(date),
    }));
  }

  sub(amount) {
    const date = this._currentDate;

    if (!date || !Number.isFinite(amount)) return null;

    return safeDateOperation(() => ({
      milliseconds: subMilliseconds(date, amount),
      seconds: subSeconds(date, amount),
      minutes: subMinutes(date, amount),
      hours: subHours(date, amount),
      days: subDays(date, amount),
      businessDays: subBusinessDays(date, amount),
      iSOWeekYears: subISOWeekYears(date, amount),
      quarters: subQuarters(date, amount),
      weeks: subWeeks(date, amount),
      months: subMonths(date, amount),
      years: subYears(date, amount),
    }));
  }

  add(amount) {
    const date = this._currentDate;

    if (!date || !Number.isFinite(amount)) return null;

    return safeDateOperation(() => ({
      milliseconds: addMilliseconds(date, amount),
      seconds: addSeconds(date, amount),
      minutes: addMinutes(date, amount),
      hours: addHours(date, amount),
      days: addDays(date, amount),
      businessDays: addBusinessDays(date, amount),
      iSOWeekYears: addISOWeekYears(date, amount),
      quarters: addQuarters(date, amount),
      weeks: addWeeks(date, amount),
      months: addMonths(date, amount),
      years: addYears(date, amount),
    }));
  }

  startOfMonth(pattern) {
    const date = this._currentDate;

    if (!date) return null;

    const result = safeDateOperation(() => startOfMonthDate(date));

    if (!result) return null;

    return pattern
      ? this._safeFormat(result, pattern)
      : result;
  }

  endOfMonth(pattern) {
    const date = this._currentDate;

    if (!date) return null;

    const result = safeDateOperation(() => endOfMonthDate(date));

    if (!result) return null;

    return pattern
      ? this._safeFormat(result, pattern)
      : result;
  }

  diff(to, options) {
    const date = this._currentDate;
    const target = toValidDate(to);

    if (!date || !target) return null;

    return safeDateOperation(() => ({
      milliseconds: differenceInMilliseconds(date, target),
      seconds: differenceInSeconds(date, target, options),
      minutes: differenceInMinutes(date, target, options),
      hours: differenceInHours(date, target, options),
      days: differenceInDays(date, target),
      businessDays: differenceInBusinessDays(date, target),
      calendarDays: differenceInCalendarDays(date, target),
      weeks: differenceInWeeks(date, target, options),
      iSOWeekYears: differenceInISOWeekYears(date, target),
      calendarISOWeekYears: differenceInCalendarISOWeekYears(date, target),
      calendarISOWeeks: differenceInCalendarISOWeeks(date, target),
      calendarMonths: differenceInCalendarMonths(date, target),
      calendarQuarters: differenceInCalendarQuarters(date, target),
      calendarWeeks: differenceInCalendarWeeks(date, target, options),
      calendarYears: differenceInCalendarYears(date, target),
      months: differenceInMonths(date, target),
      quarters: differenceInQuarters(date, target, options),
      years: differenceInYears(date, target),
    }));
  }

  _safeFormat(date, pattern, options) {
    if (!date || !isValid(date)) return "";

    try {
      const { config } = helper();
      const dateFormat = pattern ?? config?.dateFormat ?? "yyyy-MM-dd";

      return formatDate(date, dateFormat, options);
    } catch {
      return "";
    }
  }

  format(pattern, options) {
    const date = this._currentDate;

    if (!date) return "";

    const start = this._safeFormat(date, pattern, options);

    if (!start) return "";

    if (this._endData) {
      const end = this._safeFormat(this._endData, pattern, options);

      if (!end) return start;

      let divider = "-";

      try {
        divider = helper()?.config?.dateDivider || "-";
      } catch {
        // Keep the default divider.
      }

      return `${start} ${divider} ${end}`;
    }

    return start;
  }

  toString(pattern, options) {
    return this.format(pattern, options);
  }

  get _currentDate() {
    return this._date;
  }
}

export default (date, endDate) => new RDate(date, endDate);
