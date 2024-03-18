// @deno-types="npm:@types/luxon"
import { Duration, DurationLikeObject } from "luxon";

const pattern = /((?<hours>\d+) ?h(?:rs?)?)?((?<minutes>\d+) ?m(?:ins?)?)?((?<days>\d+) ?d(?:ays?)?)?/gmi;

export const ms = (time: DurationLikeObject) => Duration.fromObject(time).as("milliseconds");

export const parseTime = (input: string) => {
  if (input.includes("-") || input.includes(".")) return { hours: 0, minutes: 0, days: 0 };
  const matches = input.matchAll(pattern);
  const result = {
    hours: 0,
    minutes: 0,
    days: 0,
  };

  for (const match of matches) {
    if (match.groups?.hours) {
      result.hours += parseInt(match.groups.hours);
    }
    if (match.groups?.minutes) {
      result.minutes += parseInt(match.groups.minutes);
    }
    if (match.groups?.days) {
      result.days += parseInt(match.groups.days);
    }
  }

  return result;
};
