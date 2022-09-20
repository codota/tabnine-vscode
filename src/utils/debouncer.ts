 export function debouncePromise(
    fn: () => void,
    wait: number,
  ) {
    const timer = setTimeout(() => fn(), wait);
    const cancel = clearTimeout(timer);
    return {
        timer,
        cancel
    }
  }
  