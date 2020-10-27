export function withPolling(
  callback: (clear: () => void) => void,
  interval: number,
  timeout: number
) {
  const pollingInterval = setInterval(() => callback(clearPolling), interval);

  const pollingTimeout = setTimeout(() => {
    clearInterval(pollingInterval);
  }, timeout);

  function clearPolling() {
    clearInterval(pollingInterval);
    clearTimeout(pollingTimeout);
  }
}

export function sleep(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}
