const MS_IN_SECOND = 1000;
const MS_IN_MINUTE = 60 * MS_IN_SECOND;
const MS_IN_HOUR = 60 * MS_IN_MINUTE;

export default function isInTheLastHour(date: Date): boolean {
  return Date.now() - date.getTime() < MS_IN_HOUR;
}
