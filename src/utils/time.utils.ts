export const SECOND_IN_MS = 1000;
export const MINUTE_IN_MS = 60 * SECOND_IN_MS;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;

export default function isInTheLastHour(date: Date): boolean {
  return Date.now() - date.getTime() < HOUR_IN_MS;
}

export function isInTheLastHours(date: Date, hours: number): boolean {
  return Date.now() - date.getTime() < hours * HOUR_IN_MS;
}
