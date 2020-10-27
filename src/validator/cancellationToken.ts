export class CancellationToken {
  private cancelled = false;
  private callbacks: [(...args: any[]) => void, any[]][] = [];
  constructor() {}

  isCancelled() {
    return this.cancelled;
  }

  cancel() {
    if (!this.isCancelled()) {
      this.cancelled = true;
      this.callbacks.forEach(([callback, args]) => callback(args));
    }
  }

  reset() {
    this.cancelled = false;
    this.callbacks = [];
  }

  registerCallback(callback: (...args: any[]) => void, ...args: any[]): void {
    if (this.isCancelled()) {
      callback(...args);
    } else {
      this.callbacks.push([callback, args]);
    }
  }
}
