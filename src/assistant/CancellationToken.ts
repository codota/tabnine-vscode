export default class CancellationToken {
  private cancelled = false;

  private callbacks: [(...args: unknown[]) => void, unknown[]][] = [];

  isCancelled(): boolean {
    return this.cancelled;
  }

  cancel(): void {
    if (!this.isCancelled()) {
      this.cancelled = true;
      this.callbacks.forEach(([callback, args]) => callback(args));
    }
  }

  reset(): void {
    this.cancelled = false;
    this.callbacks = [];
  }

  registerCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (...args: any[]) => void,
    ...args: unknown[]
  ): void {
    if (this.isCancelled()) {
      callback(...args);
    } else {
      this.callbacks.push([callback, args]);
    }
  }
}
