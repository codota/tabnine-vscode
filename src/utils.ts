export function once(key: string, context) {
  return new Promise((resolve) => {
    if (!context.globalState.get(key)) {
      context.globalState.update(key, true).then(resolve);
    }
  });
}

export function withPolling(
  callback: (clear: () => void) => void,
  interval: number,
  timeout: number
) {
  let pollingInterval = setInterval(() => callback(clearPolling), interval);

  let pollingTimeout = setTimeout(() => {
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
