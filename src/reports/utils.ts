export default function currentDateTime(): string {
  const date = new Date();

  // YYYY-MM-DD HH:mm:ss format
  const dateString = `${date.getUTCFullYear()}/${`${
    date.getUTCMonth() + 1
  }`.slice(-2)}/${`${date.getUTCDate()}`.slice(
    -2
  )} ${`${date.getUTCHours()}`.slice(-2)}:${`${date.getUTCMinutes()}`.slice(
    -2
  )}:${`${date.getUTCSeconds()}`.slice(-2)}`;

  return dateString;
}
