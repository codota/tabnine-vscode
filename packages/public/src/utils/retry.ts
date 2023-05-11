export default async function retry<R>(
  func: () => Promise<R>,
  isFulfilled: (arg: R) => boolean,
  attempts = 1,
  attempt = 1
): Promise<R | undefined> {
  const result = await func();

  if (attempt >= attempts) {
    return result;
  }

  if (!isFulfilled(result)) {
    return retry(func, isFulfilled, attempts, attempt + 1);
  }

  return result;
}
