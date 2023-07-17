export async function executeTimeout<R>(
  operation: () => Promise<R>,
  timeoutMs: number
): Promise<R> {
  return new Promise<R>((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs} ms`));
    }, timeoutMs);
    operation().then(resolve, reject);
  });
}
